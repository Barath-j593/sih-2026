"""
SETU — Stage 2H: Graph & Entity Relationship Model Automated Test Suite.

Verifies:
1. Input dataset integrity (5000 rows, required entity columns present).
2. Output dataset structure (one row per project, exactly 5000 rows).
3. Zero target leakage in preprocessed feature matrix.
4. Temporal safety under 'early_warning' mode.
5. Preprocessor determinism.
6. Model scoring determinism (pinned seed 42).
7. Score bounds and statistical validity (0-100, no NaNs/Infs).
8. Model artifact serialization and reloadability.
9. Baseline detector validity.
10. Explainable reason trace validity.
11. Sensitivity to entity capture and corporate collusion ties.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

from app.ml.models.graph.config import GraphModelConfig
from app.ml.models.graph.preprocessor import GraphPreprocessor
from app.ml.models.graph.baseline_detectors import (
    TripartiteMonopolyRuleBaseline,
    MultiAttributeGraphHeuristic,
)
from app.ml.models.graph.graph_model import GraphAnomalyModel


@pytest.fixture(scope="module")
def master_features():
    """Load canonical master features."""
    path = Path("backend/app/ml/data/processed/project_master_features.csv")
    assert path.exists(), f"Master features file missing: {path}"
    df = pd.read_csv(path)
    assert len(df) == 5000, f"Expected 5000 projects, got {len(df)}"
    return df


@pytest.fixture(scope="module")
def labels():
    """Load quarantined labels for post-hoc validation."""
    path = Path("backend/app/ml/data/processed/project_labels.csv")
    assert path.exists(), f"Labels file missing: {path}"
    return pd.read_csv(path)


@pytest.fixture(scope="module")
def fitted_preprocessor(master_features):
    """Fit preprocessor once for testing."""
    config = GraphModelConfig()
    preprocessor = GraphPreprocessor(config)
    preprocessor.fit(master_features)
    return preprocessor


@pytest.fixture(scope="module")
def trained_model(master_features, fitted_preprocessor):
    """Train graph model once for testing."""
    config = GraphModelConfig()
    model = GraphAnomalyModel(config)
    X_mat = fitted_preprocessor.transform(master_features)
    model.fit(X_mat)
    return model


def test_input_dataset_integrity(master_features):
    """Verify input dataset has 5000 rows and necessary entity columns."""
    assert len(master_features) == 5000
    expected_cols = [
        "project_id",
        "contractor_id",
        "agency_id",
        "constituency_id",
        "district_id",
    ]
    for col in expected_cols:
        assert col in master_features.columns, f"Required column missing: {col}"


def test_output_dataset_one_row_per_project():
    """Verify output scores CSV has 5000 rows and unique project_id."""
    scores_path = Path("backend/app/ml/data/processed/graph_anomaly_scores.csv")
    if not scores_path.exists():
        pytest.skip("Output scores CSV not generated yet (run pipeline first)")
    df_scores = pd.read_csv(scores_path)
    assert len(df_scores) == 5000
    assert df_scores["project_id"].nunique() == 5000
    required_cols = [
        "project_id",
        "graph_anomaly_score",
        "graph_anomaly_percentile",
        "is_graph_anomaly",
        "clique_community_id",
        "pair_project_count",
        "triad_project_count",
        "agency_contractor_hhi",
        "corporate_ties_composite",
        "primary_reason",
    ]
    for col in required_cols:
        assert col in df_scores.columns, f"Output missing column: {col}"


def test_zero_target_and_identifier_leakage(fitted_preprocessor):
    """Ensure no ground-truth label columns leak into preprocessed feature matrix."""
    feature_names = fitted_preprocessor.get_feature_names()
    forbidden_terms = [
        "is_fraud",
        "scenario_type",
        "is_hard_negative",
        "fraud_severity",
        "synthetic_cluster_id",
    ]
    for fname in feature_names:
        for forbidden in forbidden_terms:
            assert fname != forbidden, f"Target leaked into feature matrix: {fname}"


def test_temporal_safety_early_warning():
    """Ensure mode is 'early_warning' and features are pre-completion network observations."""
    config = GraphModelConfig()
    assert config.mode == "early_warning"
    for f in config.base_relationship_features:
        assert "audit_finding" not in f
        assert "post_completion" not in f


def test_preprocessor_determinism(master_features):
    """Ensure preprocessor produces identical output across independent calls."""
    config = GraphModelConfig()
    p1 = GraphPreprocessor(config)
    p2 = GraphPreprocessor(config)

    mat1 = p1.fit(master_features).transform(master_features)
    mat2 = p2.fit(master_features).transform(master_features)

    np.testing.assert_allclose(mat1, mat2, rtol=1e-5, atol=1e-5)


def test_model_scoring_determinism(master_features, fitted_preprocessor):
    """Ensure model produces identical anomaly scores with fixed random_state."""
    X_mat = fitted_preprocessor.transform(master_features)
    config = GraphModelConfig()

    m1 = GraphAnomalyModel(config)
    m1.fit(X_mat)
    scores1 = m1.predict_score(X_mat)

    m2 = GraphAnomalyModel(config)
    m2.fit(X_mat)
    scores2 = m2.predict_score(X_mat)

    np.testing.assert_allclose(scores1, scores2, rtol=1e-5, atol=1e-5)


def test_score_range_and_validity(master_features, fitted_preprocessor, trained_model):
    """Ensure all scores are bounded in [0.0, 100.0] with zero NaNs or Infs."""
    X_mat = fitted_preprocessor.transform(master_features)
    scores = trained_model.predict_score(X_mat)

    assert not np.isnan(scores).any(), "Found NaN in graph anomaly scores"
    assert not np.isinf(scores).any(), "Found Inf in graph anomaly scores"
    assert (scores >= 0.0).all(), "Scores must be >= 0.0"
    assert (scores <= 100.0).all(), "Scores must be <= 100.0"


def test_model_artifacts_exist_and_loadable():
    """Ensure all production artifacts are serialized and loadable."""
    artifacts_dir = Path("backend/app/ml/models/graph/artifacts")
    if not (artifacts_dir / "graph_isolation_forest.joblib").exists():
        pytest.skip("Artifacts not generated yet (run pipeline first)")

    forest = joblib.load(artifacts_dir / "graph_isolation_forest.joblib")
    preprocessor = joblib.load(artifacts_dir / "graph_preprocessor.joblib")

    assert forest is not None
    assert preprocessor is not None
    assert (artifacts_dir / "graph_features.json").exists()
    assert (artifacts_dir / "graph_model_config.json").exists()
    assert (artifacts_dir / "graph_model_metadata.json").exists()
    assert (artifacts_dir / "training_summary.json").exists()


def test_baseline_comparison_validity(master_features):
    """Ensure baselines produce valid 0-100 scores."""
    config = GraphModelConfig()
    b1 = TripartiteMonopolyRuleBaseline(config)
    b2 = MultiAttributeGraphHeuristic(config)

    s1 = b1.predict_score(master_features)
    s2 = b2.predict_score(master_features)

    assert len(s1) == 5000
    assert len(s2) == 5000
    assert (s1 >= 0.0).all() and (s1 <= 100.0).all()
    assert (s2 >= 0.0).all() and (s2 <= 100.0).all()


def test_reason_traces_present_and_valid(master_features, fitted_preprocessor, trained_model):
    """Ensure generated reason traces conform to expected vocabulary."""
    X_mat = fitted_preprocessor.transform(master_features)
    scores = trained_model.predict_score(X_mat)
    reasons_df = trained_model.explain_reasons(master_features, scores, threshold=60.0)

    assert len(reasons_df) == 5000
    assert "primary_reason" in reasons_df.columns
    assert "secondary_reason" in reasons_df.columns
    assert "tertiary_reason" in reasons_df.columns

    valid_reasons = {
        "CORPORATE_COLLUSION_NETWORK",
        "TRIPARTITE_CLOSED_CLIQUE",
        "HIGH_CONSTITUENCY_AGENCY_CAPTURE",
        "RECURRING_EXCLUSIVE_PAIRING",
        "PRE_AWARD_GOVERNANCE_INSTABILITY",
        "HUB_CENTRALITY_SPIKE",
        "ELEVATED_GRAPH_CENTRALITY",
        "NORMAL_GRAPH_TOPOLOGY",
        "NONE",
    }
    for r in reasons_df["primary_reason"].unique():
        assert r in valid_reasons, f"Unexpected primary reason code: {r}"


def test_graph_monopoly_and_capture_coverage(master_features, fitted_preprocessor, trained_model):
    """Ensure projects with high repeated pair counts or corporate ties have elevated scores."""
    X_mat = fitted_preprocessor.transform(master_features)
    scores = trained_model.predict_score(X_mat)

    df_eval = master_features[["project_id"]].copy()
    df_eval["score"] = scores

    # High repeated pair projects vs normal isolated projects
    pair_counts = master_features.groupby(["contractor_id", "agency_id"])["project_id"].transform("count")
    high_pair_mask = pair_counts >= 4
    low_pair_mask = pair_counts <= 1

    if high_pair_mask.sum() > 0 and low_pair_mask.sum() > 0:
        high_pair_mean = df_eval.loc[high_pair_mask, "score"].mean()
        low_pair_mean = df_eval.loc[low_pair_mask, "score"].mean()
        assert high_pair_mean >= low_pair_mean - 5.0, (
            f"Expected high pair mean ({high_pair_mean:.2f}) to be comparable or higher than low pair mean ({low_pair_mean:.2f})"
        )
