import os
import sys
import json
import pytest
import numpy as np
import pandas as pd

# Add workspace and backend to sys.path
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

from app.ml.models.financial.config import FinancialModelConfig
from app.ml.models.financial.preprocessor import FinancialPreprocessor
from app.ml.models.financial.isolation_forest_model import FinancialIsolationForestModel
from app.ml.models.financial.baseline_detectors import PeerCostDeviationBaseline, MultiAttributeRobustZScoreBaseline
from app.ml.models.financial.evaluator import FinancialModelEvaluator


@pytest.fixture(scope="module")
def config():
    return FinancialModelConfig()


@pytest.fixture(scope="module")
def master_df(config):
    assert os.path.exists(config.master_features_path), f"Master features file missing: {config.master_features_path}"
    return pd.read_csv(config.master_features_path)


@pytest.fixture(scope="module")
def labels_df(config):
    assert os.path.exists(config.labels_path), f"Labels file missing: {config.labels_path}"
    return pd.read_csv(config.labels_path)


@pytest.fixture(scope="module")
def output_scores_df(config):
    assert os.path.exists(config.output_scores_path), f"Output scores file missing: {config.output_scores_path}"
    return pd.read_csv(config.output_scores_path)


def test_input_dataset_integrity(master_df, labels_df):
    """Verify input dataset has exactly 5,000 projects with required primary keys."""
    assert len(master_df) == 5000, f"Expected 5,000 projects, got {len(master_df)}"
    assert master_df["project_id"].nunique() == 5000, "project_id must be unique"
    assert len(labels_df) == 5000, f"Expected 5,000 label rows, got {len(labels_df)}"
    assert labels_df["project_id"].nunique() == 5000, "project_id in labels must be unique"
    assert (master_df["project_id"] == labels_df["project_id"]).all(), "Project IDs must match in exact order"


def test_output_dataset_one_row_per_project(master_df, output_scores_df):
    """Verify output dataset has exactly one row per project matching master features."""
    assert len(output_scores_df) == len(master_df), "Output dataset row count must equal master row count"
    assert output_scores_df["project_id"].nunique() == 5000, "Output dataset project_ids must be unique"
    assert (output_scores_df["project_id"] == master_df["project_id"]).all(), "Output project_ids must match master"


def test_zero_target_and_identifier_leakage(config, master_df):
    """Verify no label or identifier columns leak into the model feature matrix."""
    preprocessor = FinancialPreprocessor(config)
    preprocessor.fit(master_df)

    for label_col in config.quarantined_labels:
        assert label_col not in preprocessor.final_feature_names_, f"LEAKAGE: {label_col} in feature names"

    relational_ids = ["project_id", "mp_id", "ida_id", "constituency_id", "district_id", "contractor_id", "agency_id"]
    for id_col in relational_ids:
        assert id_col not in preprocessor.final_feature_names_, f"LEAKAGE: {id_col} in feature names"


def test_temporal_safety_early_warning(config, master_df):
    """Verify retrospective features are strictly excluded in early_warning mode."""
    config_ew = FinancialModelConfig(mode="early_warning")
    preprocessor = FinancialPreprocessor(config_ew)
    preprocessor.fit(master_df)

    for retro_col in config_ew.retrospective_features:
        assert retro_col not in preprocessor.final_feature_names_, f"TEMPORAL VIOLATION: {retro_col} found in early_warning mode"


def test_preprocessor_determinism(config, master_df):
    """Verify preprocessor produces identical matrices across separate runs."""
    p1 = FinancialPreprocessor(config)
    ids1, df1, X1 = p1.fit_transform(master_df)

    p2 = FinancialPreprocessor(config)
    ids2, df2, X2 = p2.fit_transform(master_df)

    assert (ids1 == ids2).all(), "Project IDs must be identical"
    assert np.allclose(X1, X2, equal_nan=True), "Transformed feature matrices must be identical"
    assert df1.equals(df2), "Imputed feature dataframes must be identical"


def test_model_scoring_determinism(config, master_df):
    """Verify Isolation Forest scoring is 100% deterministic with fixed seed."""
    p = FinancialPreprocessor(config)
    _, _, X = p.fit_transform(master_df)

    m1 = FinancialIsolationForestModel(config)
    m1.fit(X, p.final_feature_names_)
    scores1 = m1.score(X)

    m2 = FinancialIsolationForestModel(config)
    m2.fit(X, p.final_feature_names_)
    scores2 = m2.score(X)

    assert np.allclose(scores1, scores2), "Model anomaly scores must be identical for same random seed"


def test_score_range_and_validity(output_scores_df):
    """Verify scores are within [0, 100] with no NaNs or Infs."""
    scores = output_scores_df["financial_anomaly_score"].values
    percentiles = output_scores_df["financial_anomaly_percentile"].values
    flags = output_scores_df["financial_anomaly_flag"].values

    assert not np.isnan(scores).any(), "Scores must not contain NaNs"
    assert not np.isinf(scores).any(), "Scores must not contain Infs"
    assert (scores >= 0.0).all(), "Scores must be >= 0.0"
    assert (scores <= 100.0).all(), "Scores must be <= 100.0"

    assert not np.isnan(percentiles).any(), "Percentiles must not contain NaNs"
    assert (percentiles >= 0.0).all(), "Percentiles must be >= 0.0"
    assert (percentiles <= 100.0).all(), "Percentiles must be <= 100.0"

    assert flags.dtype == bool or flags.dtype == np.bool_, "Flags must be boolean"
    assert 0 < flags.sum() < len(flags), "Flags must flag a non-zero subset of anomalies"


def test_model_artifacts_exist_and_loadable(config):
    """Verify all saved model artifacts exist on disk and can be reloaded."""
    artifacts_dir = config.artifacts_dir
    assert os.path.exists(artifacts_dir), f"Artifacts directory missing: {artifacts_dir}"

    model_path = os.path.join(artifacts_dir, "financial_isolation_forest.joblib")
    prep_path = os.path.join(artifacts_dir, "financial_preprocessor.joblib")
    feat_path = os.path.join(artifacts_dir, "financial_features.json")
    cfg_path = os.path.join(artifacts_dir, "financial_model_config.json")
    meta_path = os.path.join(artifacts_dir, "financial_model_metadata.json")

    for path in [model_path, prep_path, feat_path, cfg_path, meta_path]:
        assert os.path.exists(path), f"Artifact file missing: {path}"

    loaded_model = FinancialIsolationForestModel.load(model_path)
    assert loaded_model.is_fitted_, "Loaded model must be marked as fitted"

    loaded_prep = FinancialPreprocessor.load(prep_path)
    assert loaded_prep.is_fitted_, "Loaded preprocessor must be marked as fitted"

    with open(feat_path, "r", encoding="utf-8") as f:
        feats = json.load(f)
        assert "final_feature_names" in feats
        assert feats["total_features"] == len(feats["final_feature_names"])


def test_baseline_comparison_validity(config, master_df):
    """Verify Baseline detectors run cleanly and compute valid scores."""
    prep = FinancialPreprocessor(config)
    _, df_features, _ = prep.fit_transform(master_df)

    b1 = PeerCostDeviationBaseline(config)
    b1.fit(df_features)
    s1, p1, f1 = b1.score(df_features)
    assert len(s1) == len(master_df)
    assert (s1 >= 0.0).all() and (s1 <= 100.0).all()

    b2 = MultiAttributeRobustZScoreBaseline(config)
    b2.fit(df_features)
    s2, p2, f2 = b2.score(df_features)
    assert len(s2) == len(master_df)
    assert (s2 >= 0.0).all() and (s2 <= 100.0).all()


def test_reason_traces_present_and_valid(output_scores_df):
    """Verify explainability reason traces exist and are descriptive non-empty strings."""
    assert "primary_reason" in output_scores_df.columns
    assert "secondary_reason" in output_scores_df.columns
    assert "tertiary_reason" in output_scores_df.columns

    for col in ["primary_reason", "secondary_reason", "tertiary_reason"]:
        assert output_scores_df[col].notna().all(), f"{col} has null values"
        assert (output_scores_df[col].str.len() > 5).all(), f"{col} has empty or trivial strings"
