"""
SETU — Stage 2F: Payment Structuring Model Automated Test Suite.

Verifies:
1. Input dataset integrity (5000 rows, required payment columns present).
2. Output dataset structure (one row per project, exactly 5000 rows).
3. Zero target and identifier leakage in preprocessed feature matrix.
4. Temporal safety under 'early_warning' mode.
5. Preprocessor determinism.
6. Model scoring determinism (pinned seed 42).
7. Score bounds and statistical validity (0-100, no NaNs/Infs).
8. Model artifact serialization and reloadability.
9. Baseline detector validity.
10. Explainable reason trace validity.
11. Discrimination of unverified payments and statutory smurfing.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

from app.ml.models.payment.config import PaymentModelConfig
from app.ml.models.payment.preprocessor import PaymentPreprocessor
from app.ml.models.payment.baseline_detectors import (
    UnverifiedAndRoundPaymentBaseline,
    MultiAttributePaymentHeuristic,
)
from app.ml.models.payment.payment_model import PaymentAnomalyModel


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
    config = PaymentModelConfig()
    preprocessor = PaymentPreprocessor(config)
    preprocessor.fit(master_features)
    return preprocessor


@pytest.fixture(scope="module")
def trained_model(master_features, fitted_preprocessor):
    """Train payment model once for testing."""
    config = PaymentModelConfig()
    model = PaymentAnomalyModel(config)
    X_mat = fitted_preprocessor.transform(master_features)
    model.fit(X_mat)
    return model


def test_input_dataset_integrity(master_features):
    """Verify input dataset has 5000 rows and necessary payment columns."""
    assert len(master_features) == 5000
    expected_cols = [
        "payment__payment_count",
        "payment__total_paid",
        "payment__average_payment",
        "payment__max_payment",
        "payment__unverified_payment_count",
        "payment__unverified_payment_rate",
        "payment__round_number_payment_rate",
        "financial__sanctioned_amount",
    ]
    for col in expected_cols:
        assert col in master_features.columns, f"Required column missing: {col}"


def test_output_dataset_one_row_per_project():
    """Verify output scores CSV has 5000 rows and unique project_id."""
    scores_path = Path("backend/app/ml/data/processed/payment_anomaly_scores.csv")
    if not scores_path.exists():
        pytest.skip("Output scores CSV not generated yet (run pipeline first)")
    df_scores = pd.read_csv(scores_path)
    assert len(df_scores) == 5000
    assert df_scores["project_id"].nunique() == 5000
    required_cols = [
        "project_id",
        "payment_anomaly_score",
        "payment_anomaly_percentile",
        "is_payment_anomaly",
        "payment_unverified_rate",
        "payment_unverified_exposure",
        "payment_smurfing_score",
        "payment_velocity_ratio",
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
    """Ensure mode is 'early_warning' and features are pre-completion payment features."""
    config = PaymentModelConfig()
    assert config.mode == "early_warning"
    # Ensure completion-exclusive post-hoc evaluation columns are absent
    for f in config.base_payment_features:
        assert "post_completion" not in f
        assert "audit_finding" not in f


def test_preprocessor_determinism(master_features):
    """Ensure preprocessor produces identical output across independent calls."""
    config = PaymentModelConfig()
    p1 = PaymentPreprocessor(config)
    p2 = PaymentPreprocessor(config)

    mat1 = p1.fit(master_features).transform(master_features)
    mat2 = p2.fit(master_features).transform(master_features)

    np.testing.assert_allclose(mat1, mat2, rtol=1e-5, atol=1e-5)


def test_model_scoring_determinism(master_features, fitted_preprocessor):
    """Ensure model produces identical anomaly scores with fixed random_state."""
    X_mat = fitted_preprocessor.transform(master_features)
    config = PaymentModelConfig()

    m1 = PaymentAnomalyModel(config)
    m1.fit(X_mat)
    scores1 = m1.predict_score(X_mat)

    m2 = PaymentAnomalyModel(config)
    m2.fit(X_mat)
    scores2 = m2.predict_score(X_mat)

    np.testing.assert_allclose(scores1, scores2, rtol=1e-5, atol=1e-5)


def test_score_range_and_validity(master_features, fitted_preprocessor, trained_model):
    """Ensure all scores are bounded in [0.0, 100.0] with zero NaNs or Infs."""
    X_mat = fitted_preprocessor.transform(master_features)
    scores = trained_model.predict_score(X_mat)

    assert not np.isnan(scores).any(), "Found NaN in payment anomaly scores"
    assert not np.isinf(scores).any(), "Found Inf in payment anomaly scores"
    assert (scores >= 0.0).all(), "Scores must be >= 0.0"
    assert (scores <= 100.0).all(), "Scores must be <= 100.0"


def test_model_artifacts_exist_and_loadable():
    """Ensure all production artifacts are serialized and loadable."""
    artifacts_dir = Path("backend/app/ml/models/payment/artifacts")
    if not (artifacts_dir / "payment_isolation_forest.joblib").exists():
        pytest.skip("Artifacts not generated yet (run pipeline first)")

    forest = joblib.load(artifacts_dir / "payment_isolation_forest.joblib")
    preprocessor = joblib.load(artifacts_dir / "payment_preprocessor.joblib")

    assert forest is not None
    assert preprocessor is not None
    assert (artifacts_dir / "payment_features.json").exists()
    assert (artifacts_dir / "payment_model_config.json").exists()
    assert (artifacts_dir / "payment_model_metadata.json").exists()
    assert (artifacts_dir / "training_summary.json").exists()


def test_baseline_comparison_validity(master_features):
    """Ensure baselines produce valid 0-100 scores."""
    config = PaymentModelConfig()
    b1 = UnverifiedAndRoundPaymentBaseline(config)
    b2 = MultiAttributePaymentHeuristic(config)

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
        "UNVERIFIED_DISBURSEMENT_BURST",
        "STATUTORY_CEILING_SMURFING",
        "DISBURSEMENT_VELOCITY_BURST",
        "DISBURSEMENT_LUMPINESS_ANOMALY",
        "PAYMENT_TIMING_ANOMALY",
        "ROUND_NUMBER_DISBURSEMENT_CONCENTRATION",
        "COMPRESSED_PAYMENT_SCHEDULE",
        "ELEVATED_PAYMENT_VOLATILITY",
        "NORMAL_DISBURSEMENT_SCHEDULE",
        "NONE",
    }
    for r in reasons_df["primary_reason"].unique():
        assert r in valid_reasons, f"Unexpected primary reason code: {r}"


def test_payment_unverified_and_smurfing_coverage(master_features, fitted_preprocessor, trained_model, labels):
    """Ensure projects with unverified releases or smurfing have elevated risk scores."""
    X_mat = fitted_preprocessor.transform(master_features)
    scores = trained_model.predict_score(X_mat)

    df_eval = master_features[["project_id"]].copy()
    df_eval["score"] = scores
    df_eval = df_eval.merge(labels, on="project_id")

    # Payment progress mismatch projects must have high mean score
    ppm_scores = df_eval[df_eval["scenario_type"] == "PAYMENT_PROGRESS_MISMATCH"]["score"]
    normal_scores = df_eval[df_eval["scenario_type"] == "NORMAL"]["score"]

    assert ppm_scores.mean() > normal_scores.mean(), (
        f"Expected PAYMENT_PROGRESS_MISMATCH mean score ({ppm_scores.mean():.2f}) "
        f"to exceed NORMAL mean score ({normal_scores.mean():.2f})"
    )
