"""Test Suite for SETU Stage 2C Geospatial Anomaly Model.

Validates dataset integrity, zero label/identifier leakage, temporal safety,
preprocessor & model determinism, score validity, artifact persistence,
baseline benchmarks, reason trace explainability, and hard-negative suppression.
"""

import os
import sys
import json
import pytest
import numpy as np
import pandas as pd

# Add workspace and backend to sys.path
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

from app.ml.models.geospatial.config import GeospatialModelConfig
from app.ml.models.geospatial.preprocessor import GeospatialPreprocessor
from app.ml.models.geospatial.geospatial_model import GeospatialIsolationForestModel
from app.ml.models.geospatial.baseline_detectors import SpatialCostClusterDeviationBaseline, MultiAttributeSpatialHeuristicBaseline
from app.ml.models.geospatial.evaluator import GeospatialModelEvaluator


@pytest.fixture(scope="module")
def config():
    return GeospatialModelConfig()


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
    """Verify input dataset has exactly 5,000 projects with matching primary keys."""
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
    preprocessor = GeospatialPreprocessor(config)
    preprocessor.fit(master_df)

    for label_col in config.quarantined_labels:
        assert label_col not in preprocessor.final_feature_names_, f"LEAKAGE: {label_col} in feature names"

    relational_ids = ["project_id", "mp_id", "ida_id", "constituency_id", "district_id", "contractor_id", "agency_id"]
    for id_col in relational_ids:
        assert id_col not in preprocessor.final_feature_names_, f"LEAKAGE: {id_col} in feature names"


def test_temporal_safety_early_warning(config, master_df):
    """Verify retrospective completion features are strictly excluded in early_warning mode."""
    config_ew = GeospatialModelConfig(mode="early_warning")
    preprocessor = GeospatialPreprocessor(config_ew)
    preprocessor.fit(master_df)

    for retro_col in config_ew.retrospective_features:
        assert retro_col not in preprocessor.final_feature_names_, f"TEMPORAL VIOLATION: {retro_col} found in early_warning mode"


def test_preprocessor_determinism(config, master_df):
    """Verify preprocessor produces identical matrices across separate runs."""
    p1 = GeospatialPreprocessor(config)
    ids1, df1, X1 = p1.fit_transform(master_df)

    p2 = GeospatialPreprocessor(config)
    ids2, df2, X2 = p2.fit_transform(master_df)

    assert (ids1 == ids2).all(), "Project IDs must be identical"
    assert np.allclose(X1, X2, equal_nan=True), "Transformed feature matrices must be identical"
    assert df1.equals(df2), "Feature dataframes must be identical"


def test_model_scoring_determinism(config, master_df):
    """Verify Isolation Forest scoring is 100% deterministic with fixed seed."""
    p = GeospatialPreprocessor(config)
    _, _, X = p.fit_transform(master_df)

    m1 = GeospatialIsolationForestModel(config)
    m1.fit(X, p.final_feature_names_)
    scores1 = m1.score(X)

    m2 = GeospatialIsolationForestModel(config)
    m2.fit(X, p.final_feature_names_)
    scores2 = m2.score(X)

    assert np.allclose(scores1, scores2), "Scores must be bitwise identical across deterministic runs"


def test_score_range_and_validity(output_scores_df):
    """Verify scores are in [0, 100], percentiles in [0, 100], and flag rate is ~5%."""
    scores = output_scores_df["geospatial_anomaly_score"].values
    percentiles = output_scores_df["geospatial_anomaly_percentile"].values
    flags = output_scores_df["geospatial_anomaly_flag"].values

    assert scores.min() >= 0.0, "Scores cannot be negative"
    assert scores.max() <= 100.0, "Scores cannot exceed 100.0"
    assert percentiles.min() >= 0.0, "Percentiles cannot be negative"
    assert percentiles.max() <= 100.0, "Percentiles cannot exceed 100.0"

    flag_rate = flags.mean()
    assert 0.04 <= flag_rate <= 0.06, f"Anomaly flag rate should be ~5%, got {flag_rate:.3f}"


def test_model_artifacts_exist_and_loadable(config):
    """Verify all saved model artifacts exist on disk and can be reloaded."""
    artifacts_dir = config.artifacts_dir
    assert os.path.exists(artifacts_dir), f"Artifacts directory missing: {artifacts_dir}"

    model_path = os.path.join(artifacts_dir, "geospatial_isolation_forest.joblib")
    preprocessor_path = os.path.join(artifacts_dir, "geospatial_preprocessor.joblib")
    features_path = os.path.join(artifacts_dir, "geospatial_features.json")
    config_path = os.path.join(artifacts_dir, "geospatial_model_config.json")
    meta_path = os.path.join(artifacts_dir, "geospatial_model_metadata.json")

    assert os.path.exists(model_path), "Model joblib artifact missing"
    assert os.path.exists(preprocessor_path), "Preprocessor joblib artifact missing"
    assert os.path.exists(features_path), "Features JSON artifact missing"
    assert os.path.exists(config_path), "Config JSON artifact missing"
    assert os.path.exists(meta_path), "Metadata JSON artifact missing"

    # Reload model and preprocessor
    loaded_model = GeospatialIsolationForestModel.load(model_path)
    loaded_prep = GeospatialPreprocessor.load(preprocessor_path)

    assert loaded_model.is_fitted_, "Loaded model must be fitted"
    assert loaded_prep.is_fitted_, "Loaded preprocessor must be fitted"
    assert len(loaded_prep.final_feature_names_) > 0, "Loaded preprocessor must contain feature names"


def test_baseline_comparison_validity(config, master_df):
    """Verify both baseline detectors execute and output valid scores."""
    p = GeospatialPreprocessor(config)
    _, df_features, _ = p.fit_transform(master_df)

    b1 = SpatialCostClusterDeviationBaseline(config)
    b1.fit(df_features)
    s1, p1, f1 = b1.score(df_features)
    assert len(s1) == 5000
    assert 0.0 <= s1.min() and s1.max() <= 100.0

    b2 = MultiAttributeSpatialHeuristicBaseline(config)
    b2.fit(df_features)
    s2, p2, f2 = b2.score(df_features)
    assert len(s2) == 5000
    assert 0.0 <= s2.min() and s2.max() <= 100.0


def test_reason_traces_present_and_valid(output_scores_df):
    """Verify explainable reason traces are populated, non-empty, and informative."""
    for col in ["primary_reason", "secondary_reason", "tertiary_reason"]:
        assert col in output_scores_df.columns, f"Reason column {col} missing"
        assert output_scores_df[col].isna().sum() == 0, f"NaNs found in {col}"
        assert (output_scores_df[col].str.len() > 10).all(), f"Empty or too short reasons in {col}"


def test_hard_negative_remote_single_bid_protected(labels_df, output_scores_df):
    """Verify that legitimate remote single bid works are not excessively flagged."""
    df = output_scores_df.merge(labels_df, on="project_id")
    remote_df = df[df["scenario_type"] == "LEGITIMATE_REMOTE_SINGLE_BID"]
    assert len(remote_df) > 0, "No remote single bid scenarios found"

    # Remote works should not have extreme false positive rate (must be <= 10%)
    flagged_remote_rate = remote_df["geospatial_anomaly_flag"].mean()
    assert flagged_remote_rate <= 0.10, f"False alarm rate on remote works too high: {flagged_remote_rate*100:.1f}%"
