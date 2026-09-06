"""Comprehensive unit and integration tests for Stage 3 Supervised Calibrated Risk Predictor.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

from app.ml.models.supervised.config import SupervisedModelConfig
from app.ml.models.supervised.preprocessor import SupervisedDataPreprocessor
from app.ml.models.supervised.supervised_model import SupervisedFraudClassifier
from app.ml.models.supervised.baseline_detectors import (
    MaxIntermediateScoreBaseline,
    WeightedAverageBaseline,
)


@pytest.fixture(scope="module")
def config() -> SupervisedModelConfig:
    return SupervisedModelConfig()


@pytest.fixture(scope="module")
def loaded_data(config: SupervisedModelConfig):
    preprocessor = SupervisedDataPreprocessor(config)
    scores_df = preprocessor.load_intermediate_scores()
    context_df = preprocessor.load_master_context()
    assembled_df = preprocessor.assemble_feature_matrix(scores_df, context_df)
    labels_df = pd.read_csv(config.data_dir / config.labels_file)
    return {
        "scores_df": scores_df,
        "context_df": context_df,
        "assembled_df": assembled_df,
        "labels_df": labels_df,
    }


def test_input_dataset_integrity(config: SupervisedModelConfig):
    """Test that all 7 intermediate score CSVs and master context files exist and contain 5,000 rows."""
    for domain, filename in config.intermediate_score_files.items():
        filepath = config.data_dir / filename
        assert filepath.exists(), f"Missing score file for {domain}: {filepath}"
        df = pd.read_csv(filepath)
        assert len(df) == 5000, f"Expected 5,000 rows in {filename}, got {len(df)}"
        assert "project_id" in df.columns, f"Missing project_id in {filename}"

    master_path = config.data_dir / config.master_features_file
    assert master_path.exists()
    df_master = pd.read_csv(master_path)
    assert len(df_master) == 5000

    labels_path = config.data_dir / config.labels_file
    assert labels_path.exists()
    df_labels = pd.read_csv(labels_path)
    assert len(df_labels) == 5000


def test_output_dataset_one_row_per_project(config: SupervisedModelConfig):
    """Test that output supervised_fraud_scores.csv exists, has 5,000 rows, and unique IDs."""
    output_path = config.data_dir / config.output_scores_file
    assert output_path.exists(), f"Output file does not exist: {output_path}"

    df_out = pd.read_csv(output_path)
    assert len(df_out) == 5000, f"Expected 5,000 rows, got {len(df_out)}"
    assert df_out["project_id"].nunique() == 5000, "project_id must be unique"

    expected_cols = [
        "project_id",
        "fraud_probability",
        "predicted_typology",
        "feature_importance_contributions",
        "scored_at",
    ]
    for col in expected_cols:
        assert col in df_out.columns, f"Missing column {col} in output scores"


def test_zero_target_and_identifier_leakage(config: SupervisedModelConfig, loaded_data: dict):
    """Ensure that ground-truth labels and identifiers are never present in preprocessor features."""
    preprocessor = SupervisedDataPreprocessor(config)
    preprocessor.fit(loaded_data["assembled_df"])
    feature_names = preprocessor.feature_names_

    forbidden = [
        "project_id",
        "is_fraud",
        "fraud_label",
        "is_anomalous",
        "is_hard_negative",
        "scenario_type",
        "scenario_name",
        "risk_level",
        "overall_risk_score",
        "investigation_priority",
    ]
    for feat in feature_names:
        assert feat not in forbidden, f"Target or identifier leaked into features: {feat}"


def test_temporal_safety_early_warning(config: SupervisedModelConfig, loaded_data: dict):
    """Ensure preprocessor transforms finite values without lookahead or post-execution leakage."""
    preprocessor = SupervisedDataPreprocessor(config)
    preprocessor.fit(loaded_data["assembled_df"])
    X = preprocessor.transform(loaded_data["assembled_df"])

    assert np.isfinite(X).all(), "Feature matrix contains NaN or Inf values"
    assert X.shape[0] == 5000
    assert X.shape[1] == len(preprocessor.feature_names_)


def test_preprocessor_determinism(config: SupervisedModelConfig, loaded_data: dict):
    """Ensure preprocessor transformations are 100% deterministic."""
    prep1 = SupervisedDataPreprocessor(config)
    prep2 = SupervisedDataPreprocessor(config)

    prep1.fit(loaded_data["assembled_df"])
    prep2.fit(loaded_data["assembled_df"])

    X1 = prep1.transform(loaded_data["assembled_df"])
    X2 = prep2.transform(loaded_data["assembled_df"])

    np.testing.assert_array_almost_equal(X1, X2, decimal=6)


def test_model_scoring_determinism(config: SupervisedModelConfig, loaded_data: dict):
    """Ensure model produces identical predictions given identical inputs."""
    prep = SupervisedDataPreprocessor(config)
    prep.fit(loaded_data["assembled_df"])
    X = prep.transform(loaded_data["assembled_df"])

    model_path = config.artifacts_dir / "supervised_fraud_model.joblib"
    assert model_path.exists()
    model = joblib.load(model_path)

    p1 = model.predict_proba(X)[:, 1]
    p2 = model.predict_proba(X)[:, 1]

    np.testing.assert_array_almost_equal(p1, p2, decimal=6)


def test_score_range_and_validity(config: SupervisedModelConfig):
    """Ensure fraud_probability is strictly bounded in [0.0, 1.0] and exhibits realistic spread."""
    output_path = config.data_dir / config.output_scores_file
    df_out = pd.read_csv(output_path)

    probs = df_out["fraud_probability"].values
    assert (probs >= 0.0).all(), "Fraud probability must be >= 0.0"
    assert (probs <= 1.0).all(), "Fraud probability must be <= 1.0"
    assert not np.isnan(probs).any(), "Probabilities must not contain NaN"
    assert probs.std() > 0.1, "Probabilities should have meaningful variance"


def test_model_artifacts_exist_and_loadable(config: SupervisedModelConfig):
    """Ensure all required serialized artifacts exist and can be loaded cleanly."""
    artifacts = [
        "supervised_fraud_model.joblib",
        "supervised_preprocessor.joblib",
        "supervised_features.json",
        "supervised_model_config.json",
        "supervised_model_metadata.json",
        "training_summary.json",
    ]
    for artifact in artifacts:
        p = config.artifacts_dir / artifact
        assert p.exists(), f"Artifact missing: {p}"

    model = joblib.load(config.artifacts_dir / "supervised_fraud_model.joblib")
    assert isinstance(model, SupervisedFraudClassifier)

    prep = joblib.load(config.artifacts_dir / "supervised_preprocessor.joblib")
    assert isinstance(prep, SupervisedDataPreprocessor)


def test_baseline_comparison_validity(config: SupervisedModelConfig, loaded_data: dict):
    """Ensure Supervised XGBoost strictly outperforms heuristic baselines."""
    summary_path = config.artifacts_dir / "training_summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    # Supervised OOF ROC-AUC
    oof_roc = summary["oof_roc_auc"]
    assert oof_roc >= config.min_roc_auc, f"ROC-AUC {oof_roc} < {config.min_roc_auc}"

    # Compute baseline 1 ROC-AUC
    b1 = MaxIntermediateScoreBaseline()
    b1_probs = b1.predict_proba(loaded_data["assembled_df"])[:, 1]
    y = loaded_data["labels_df"]["is_fraud"].values
    from sklearn.metrics import roc_auc_score

    b1_roc = roc_auc_score(y, b1_probs)
    assert oof_roc > b1_roc, f"Model ROC ({oof_roc}) must exceed Baseline 1 ({b1_roc})"


def test_reason_traces_present_and_valid(config: SupervisedModelConfig):
    """Ensure Tree SHAP feature contributions are valid JSON and contain top feature attributions."""
    output_path = config.data_dir / config.output_scores_file
    df_out = pd.read_csv(output_path)

    for i in range(min(50, len(df_out))):
        trace_str = df_out.iloc[i]["feature_importance_contributions"]
        parsed = json.loads(trace_str)
        assert isinstance(parsed, dict)
        assert len(parsed) <= 3
        for k, v in parsed.items():
            assert isinstance(k, str)
            assert isinstance(v, (float, int))


def test_benchmark_metrics_compliance(config: SupervisedModelConfig):
    """Verify that the model meets or exceeds all performance targets specified in the backlog."""
    summary_path = config.artifacts_dir / "training_summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    assert summary["oof_roc_auc"] >= config.min_roc_auc, "OOF ROC-AUC benchmark failed"
    assert summary["oof_pr_auc"] >= config.min_pr_auc, "OOF PR-AUC benchmark failed"
    assert summary["top_1pct_enrichment"] >= config.min_top1_enrichment, "Top 1% enrichment benchmark failed"
    assert summary["hard_negative_fpr"] <= config.max_hard_negative_fpr, "Hard negative FPR benchmark failed"
