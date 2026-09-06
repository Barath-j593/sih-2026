"""
SETU — Stage 2G: Progress vs. Execution Trajectory Model Automated Test Suite.

Verifies:
1. Input dataset integrity (5000 rows, required progress features present).
2. Output dataset structure (one row per project, exactly 5000 rows).
3. Zero target and identifier leakage in preprocessed feature matrix.
4. Temporal safety under 'early_warning' mode.
5. Preprocessor determinism.
6. Model scoring determinism (pinned seed 42).
7. Score bounds and statistical validity (0-100, no NaNs/Infs).
8. Model artifact serialization and reloadability.
9. Baseline detector validity.
10. Explainable reason trace validity.
11. Strong sensitivity to ghost works and physical-financial divergence.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

from app.ml.models.progress.config import ProgressModelConfig
from app.ml.models.progress.preprocessor import ProgressPreprocessor
from app.ml.models.progress.baseline_detectors import (
    DivergenceRuleBaseline,
    MultiAttributeProgressHeuristic,
)
from app.ml.models.progress.progress_model import ProgressAnomalyModel


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
    config = ProgressModelConfig()
    preprocessor = ProgressPreprocessor(config)
    preprocessor.fit(master_features)
    return preprocessor


@pytest.fixture(scope="module")
def trained_model(master_features, fitted_preprocessor):
    """Train progress model once for testing."""
    config = ProgressModelConfig()
    model = ProgressAnomalyModel(config)
    X_mat = fitted_preprocessor.transform(master_features)
    model.fit(X_mat)
    return model


def test_input_dataset_integrity(master_features):
    """Verify input dataset has 5000 rows and necessary progress columns."""
    assert len(master_features) == 5000
    expected_cols = [
        "progress__latest_physical_progress",
        "progress__latest_financial_progress",
        "progress__financial_minus_physical_progress",
        "progress__physical_progress_slope",
        "progress__duration_overrun_days",
        "progress__measurement_book_verified_rate",
        "progress__geotag_available_rate",
    ]
    for col in expected_cols:
        assert col in master_features.columns, f"Required column missing: {col}"


def test_output_dataset_one_row_per_project():
    """Verify output scores CSV has 5000 rows and unique project_id."""
    scores_path = Path("backend/app/ml/data/processed/progress_execution_anomaly_scores.csv")
    if not scores_path.exists():
        pytest.skip("Output scores CSV not generated yet (run pipeline first)")
    df_scores = pd.read_csv(scores_path)
    assert len(df_scores) == 5000
    assert df_scores["project_id"].nunique() == 5000
    required_cols = [
        "project_id",
        "progress_anomaly_score",
        "progress_anomaly_percentile",
        "is_progress_anomaly",
        "financial_minus_physical_progress",
        "latest_physical_progress",
        "latest_financial_progress",
        "duration_overrun_days",
        "ghost_work_index",
        "execution_stall_score",
        "primary_reason",
    ]
    for col in required_cols:
        assert col in df_scores.columns, f"Output missing column: {col}"


def test_zero_target_and_identifier_leakage(fitted_preprocessor):
    """Ensure no ground-truth label columns or raw IDs leak into preprocessed feature matrix."""
    feature_names = fitted_preprocessor.get_feature_names()
    forbidden_terms = [
        "is_fraud",
        "scenario_type",
        "is_hard_negative",
        "fraud_severity",
        "synthetic_cluster_id",
        "contractor_id",
        "implementing_agency_id",
        "project_id",
    ]
    for fname in feature_names:
        for forbidden in forbidden_terms:
            assert fname != forbidden, f"Target or identifier leaked into feature matrix: {fname}"


def test_temporal_safety_early_warning():
    """Ensure mode is 'early_warning' and features are pre-completion progress observations."""
    config = ProgressModelConfig()
    assert config.mode == "early_warning"
    for f in config.base_progress_features:
        assert "audit_finding" not in f
        assert "post_completion" not in f


def test_preprocessor_determinism(master_features):
    """Ensure preprocessor produces identical output across independent calls."""
    config = ProgressModelConfig()
    p1 = ProgressPreprocessor(config)
    p2 = ProgressPreprocessor(config)

    mat1 = p1.fit(master_features).transform(master_features)
    mat2 = p2.fit(master_features).transform(master_features)

    np.testing.assert_allclose(mat1, mat2, rtol=1e-5, atol=1e-5)


def test_model_scoring_determinism(master_features, fitted_preprocessor):
    """Ensure model produces identical anomaly scores with fixed random_state."""
    X_mat = fitted_preprocessor.transform(master_features)
    config = ProgressModelConfig()

    m1 = ProgressAnomalyModel(config)
    m1.fit(X_mat)
    scores1 = m1.predict_score(X_mat)

    m2 = ProgressAnomalyModel(config)
    m2.fit(X_mat)
    scores2 = m2.predict_score(X_mat)

    np.testing.assert_allclose(scores1, scores2, rtol=1e-5, atol=1e-5)


def test_score_range_and_validity(master_features, fitted_preprocessor, trained_model):
    """Ensure all scores are bounded in [0.0, 100.0] with zero NaNs or Infs."""
    X_mat = fitted_preprocessor.transform(master_features)
    scores = trained_model.predict_score(X_mat)

    assert not np.isnan(scores).any(), "Found NaN in progress anomaly scores"
    assert not np.isinf(scores).any(), "Found Inf in progress anomaly scores"
    assert (scores >= 0.0).all(), "Scores must be >= 0.0"
    assert (scores <= 100.0).all(), "Scores must be <= 100.0"


def test_model_artifacts_exist_and_loadable():
    """Ensure all production artifacts are serialized and loadable."""
    artifacts_dir = Path("backend/app/ml/models/progress/artifacts")
    if not (artifacts_dir / "progress_isolation_forest.joblib").exists():
        pytest.skip("Artifacts not generated yet (run pipeline first)")

    forest = joblib.load(artifacts_dir / "progress_isolation_forest.joblib")
    preprocessor = joblib.load(artifacts_dir / "progress_preprocessor.joblib")

    assert forest is not None
    assert preprocessor is not None
    assert (artifacts_dir / "progress_features.json").exists()
    assert (artifacts_dir / "progress_model_config.json").exists()
    assert (artifacts_dir / "progress_model_metadata.json").exists()
    assert (artifacts_dir / "training_summary.json").exists()


def test_baseline_comparison_validity(master_features):
    """Ensure baselines produce valid 0-100 scores."""
    config = ProgressModelConfig()
    b1 = DivergenceRuleBaseline(config)
    b2 = MultiAttributeProgressHeuristic(config)

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
        "GHOST_WORK_EXECUTION_DIVERGENCE",
        "SEVERE_PHYSICAL_FINANCIAL_GAP",
        "EXTREME_DURATION_OVERRUN",
        "STALLED_EXECUTION_TRAJECTORY",
        "INSPECTION_DOCUMENTATION_DEFICIT",
        "ABANDONED_WORK_SUSPICION",
        "ELEVATED_PROGRESS_VOLATILITY",
        "NORMAL_EXECUTION_PROGRESS",
        "NONE",
    }
    for r in reasons_df["primary_reason"].unique():
        assert r in valid_reasons, f"Unexpected primary reason code: {r}"


def test_ghost_work_and_divergence_coverage(master_features, fitted_preprocessor, trained_model, labels):
    """Ensure ghost works and payment-progress mismatch projects have high anomaly scores."""
    X_mat = fitted_preprocessor.transform(master_features)
    scores = trained_model.predict_score(X_mat)

    df_eval = master_features[["project_id"]].copy()
    df_eval["score"] = scores
    df_eval = df_eval.merge(labels, on="project_id")

    ghost_scores = df_eval[df_eval["scenario_type"] == "GHOST_WORK"]["score"]
    normal_scores = df_eval[df_eval["scenario_type"] == "NORMAL"]["score"]

    assert ghost_scores.mean() > normal_scores.mean() + 20.0, (
        f"Expected GHOST_WORK mean ({ghost_scores.mean():.2f}) "
        f"to substantially exceed NORMAL mean ({normal_scores.mean():.2f})"
    )
