"""Unit and integration tests for Stage 4 Multi-Signal Risk Fusion Engine.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from app.ml.models.risk_fusion_engine import RiskFusionEngine


@pytest.fixture(scope="module")
def fusion_engine():
    return RiskFusionEngine()


@pytest.fixture(scope="module")
def fused_data(fusion_engine):
    csv_path = fusion_engine.data_dir / "fused_risk_intelligence.csv"
    assert csv_path.exists(), f"Fused dataset missing: {csv_path}"
    return pd.read_csv(csv_path)


def test_fusion_engine_initialization(fusion_engine):
    """Test RiskFusionEngine initialization and default weights."""
    assert fusion_engine.weights is not None
    assert len(fusion_engine.weights) == 7
    assert "financial_anomaly_score" in fusion_engine.weights
    assert "progress_anomaly_score" in fusion_engine.weights
    assert abs(sum(fusion_engine.weights.values()) - 1.0) < 1e-4


def test_fuse_project_single_sample(fusion_engine):
    """Test fusing signals for a single project."""
    domain_scores = {
        "financial_anomaly_score": 85.0,
        "geospatial_anomaly_score": 30.0,
        "procurement_anomaly_score": 75.0,
        "contractor_anomaly_score": 20.0,
        "payment_anomaly_score": 80.0,
        "progress_anomaly_score": 90.0,
        "graph_anomaly_score": 30.0,
    }
    domain_reasons = {
        "financial_anomaly_score": ["Cost overrun +2.5 sigma"],
        "progress_anomaly_score": ["Financial expenditure leads physical progress by 45%"],
        "payment_anomaly_score": ["Unverified payment tranches released without MB verification"],
    }
    result = fusion_engine.fuse_project(
        project_id="TEST-001",
        domain_scores=domain_scores,
        domain_reasons=domain_reasons,
        fraud_probability=0.92,
        predicted_typology="COST_OVERRUN",
    )

    assert result["project_id"] == "TEST-001"
    assert result["overall_risk_score"] >= 80.0
    assert result["risk_level"] == "CRITICAL"
    assert result["investigation_priority"] == "IMMEDIATE"
    assert result["primary_typology"] == "COST_OVERRUN"
    assert len(result["synthesized_reasons"]) > 0
    assert result["primary_reason"] != ""


def test_fuse_signals_legacy_compatibility(fusion_engine):
    """Test legacy fuse_signals method for backward compatibility."""
    row = {
        "ALLOC_ZSCORE_STATE": 3.8,
        "ALLOCATION_AMOUNT": 490000,
        "DUPLICATE_COUNT": 8,
        "IDA_MP_WORK_SHARE": 0.85,
        "STRUCTURING_SCORE": 0.95,
        "STALL_RISK_SCORE": 0.80,
        "DAYS_SINCE_RECOMMENDED": 320,
        "IDA": "DISTRICT MAGISTRATE X",
    }
    score, level, reasons, sub_scores, f_type = fusion_engine.fuse_signals(
        row_dict=row,
        xgb_proba=0.92,
        if_score=0.85,
        lof_score=0.75,
        graph_ida_risk=0.80,
    )

    assert 0.0 <= score <= 100.0
    assert level in ["Critical", "High"]
    assert len(reasons) > 0
    assert "cost_anomaly" in sub_scores
    assert f_type != ""


def test_fused_risk_intelligence_file_exists(fused_data):
    """Ensure fused_risk_intelligence.csv exists, has 5,000 rows, and unique IDs."""
    assert len(fused_data) == 5000
    assert fused_data["project_id"].nunique() == 5000


def test_fused_dataset_schema_and_columns(fused_data):
    """Ensure all required columns are present in the fused intelligence output."""
    expected_cols = [
        "project_id",
        "overall_risk_score",
        "risk_level",
        "investigation_priority",
        "primary_typology",
        "fraud_probability",
        "synthesized_reasons",
        "primary_reason",
        "financial_anomaly_score",
        "geospatial_anomaly_score",
        "procurement_anomaly_score",
        "contractor_anomaly_score",
        "payment_anomaly_score",
        "progress_anomaly_score",
        "graph_anomaly_score",
        "feature_importance_contributions",
        "scored_at",
    ]
    for col in expected_cols:
        assert col in fused_data.columns, f"Missing column in fused dataset: {col}"


def test_risk_score_bounds_and_distribution(fused_data):
    """Ensure overall_risk_score is within [0.0, 100.0] and has healthy standard deviation."""
    scores = fused_data["overall_risk_score"].values
    assert (scores >= 0.0).all()
    assert (scores <= 100.0).all()
    assert not np.isnan(scores).any()
    assert scores.std() > 10.0


def test_risk_tiers_consistency(fused_data):
    """Verify tier mapping strictly adheres to specification thresholds."""
    for _, row in fused_data.iterrows():
        score = row["overall_risk_score"]
        prob = row["fraud_probability"]
        level = row["risk_level"]

        if score >= 80.0 or prob >= 0.85:
            assert level == "CRITICAL", f"Project {row['project_id']} should be CRITICAL, got {level}"
        elif score >= 60.0:
            assert level == "HIGH", f"Project {row['project_id']} should be HIGH, got {level}"
        elif score >= 40.0:
            assert level == "MEDIUM", f"Project {row['project_id']} should be MEDIUM, got {level}"
        else:
            assert level == "LOW", f"Project {row['project_id']} should be LOW, got {level}"


def test_investigation_priority_consistency(fused_data):
    """Verify investigation priority aligns with risk level."""
    for _, row in fused_data.iterrows():
        level = row["risk_level"]
        priority = row["investigation_priority"]

        if level == "CRITICAL":
            assert priority == "IMMEDIATE"
        elif level == "HIGH":
            assert priority == "PRIORITY"
        else:
            assert priority == "ROUTINE"


def test_hard_negative_protection_in_fusion(fusion_engine, fused_data):
    """Ensure hard negatives (high value, remote single bid, weather delay) are protected from CRITICAL false alarms."""
    labels_df = pd.read_csv(fusion_engine.data_dir / "project_labels.csv")
    merged = fused_data.merge(labels_df[["project_id", "scenario_type", "is_hard_negative"]], on="project_id")

    high_val = merged[merged["scenario_type"] == "HIGH_VALUE_LEGITIMATE"]
    weather = merged[merged["scenario_type"] == "LEGITIMATE_WEATHER_DELAY"]
    normal = merged[merged["scenario_type"] == "NORMAL"]

    # 0 CRITICAL false alarms on high-value legitimate works and weather delay
    assert (high_val["risk_level"] == "CRITICAL").sum() == 0
    assert (weather["risk_level"] == "CRITICAL").sum() == 0
    assert (normal["risk_level"] == "CRITICAL").sum() == 0


def test_synthesized_reasons_present_and_structured(fused_data):
    """Ensure synthesized_reasons is valid JSON containing ranked evidence strings."""
    for i in range(min(50, len(fused_data))):
        reasons_json = fused_data.iloc[i]["synthesized_reasons"]
        reasons_list = json.loads(reasons_json)
        assert isinstance(reasons_list, list)
        assert len(reasons_list) >= 1
        assert all(isinstance(r, str) and len(r) > 0 for r in reasons_list)


def test_fusion_reports_exist_and_valid(fusion_engine):
    """Ensure RISK_FUSION_REPORT.md and risk_fusion_report.json exist and are well-formed."""
    md_p = fusion_engine.reports_dir / "RISK_FUSION_REPORT.md"
    json_p = fusion_engine.reports_dir / "risk_fusion_report.json"

    assert md_p.exists()
    assert json_p.exists()

    with open(json_p, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "risk_tier_distribution" in data
    assert "investigation_priority_distribution" in data
    assert data["total_projects_evaluated"] == 5000
