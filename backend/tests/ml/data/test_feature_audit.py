"""
test_feature_audit.py - Unit tests for Stage 2A Feature Audit & ML Selection.
"""

import json
import pytest
import pandas as pd
from pathlib import Path
from app.ml.data.audit_features import (
    load_processed_data,
    audit_master_features,
    generate_recommended_feature_sets,
)
from app.ml.data.schemas import TARGET_LEAKAGE_COLUMNS, RELATIONAL_KEYS


@pytest.fixture
def master_and_labels():
    return load_processed_data()


@pytest.fixture
def audit_results(master_and_labels):
    master_df, labels_df = master_and_labels
    return audit_master_features(master_df, labels_df)


def test_all_239_columns_classified(master_and_labels, audit_results):
    """Assert all 239 columns in master feature store are classified."""
    master_df, _ = master_and_labels
    assert len(master_df.columns) == 239
    assert audit_results["total_columns"] == 239
    assert len(audit_results["columns"]) == 239
    
    # Assert every column in master has a valid category
    valid_categories = {
        "IDENTIFIER", "METADATA", "CATEGORICAL", "NUMERICAL",
        "TEMPORAL", "ML_FEATURE", "POTENTIAL_LEAKAGE", "EXCLUDE"
    }
    for col in master_df.columns:
        assert col in audit_results["columns"], f"Column {col} missing from audit!"
        cat = audit_results["columns"][col]["classification"]
        assert cat in valid_categories, f"Invalid classification {cat} for column {col}"


def test_no_column_classified_twice(audit_results):
    """Assert no column is classified more than once."""
    cols = list(audit_results["columns"].keys())
    assert len(cols) == len(set(cols)) == 239
    
    # Sum of category counts equals 239
    cat_sum = sum(audit_results["classification_counts"].values())
    assert cat_sum == 239


def test_labels_quarantined_from_ml_sets(audit_results):
    """Assert target labels are completely excluded from ML candidate features."""
    for col, info in audit_results["columns"].items():
        assert col not in TARGET_LEAKAGE_COLUMNS, f"Direct target column {col} in master!"
        for target in TARGET_LEAKAGE_COLUMNS:
            assert not col.endswith(f"__{target}"), f"Prefixed target {col} in master!"


def test_identifiers_excluded_from_numerical_ml_features(audit_results):
    """Assert relational keys and IDs are classified as IDENTIFIER and not marked suitable for ML."""
    cols = audit_results["columns"]
    for rel_key in ["project_id", "contractor_id", "agency_id", "district_id", "state_id", "constituency_id"]:
        assert rel_key in cols
        assert cols[rel_key]["classification"] == "IDENTIFIER"
        assert cols[rel_key]["is_suitable_for_ml"] is False


def test_leakage_features_explicitly_documented(audit_results):
    """Assert retrospective-only outcome features are flagged as RETROSPECTIVE_ONLY."""
    cols = audit_results["columns"]
    retrospective_samples = [
        "project__actual_completion_date",
        "financial__actual_expenditure",
        "financial__cost_overrun",
        "contract__final_contract_value",
        "progress__latest_completion_percentage",
        "document__completion_certificate",
    ]
    for retro_col in retrospective_samples:
        if retro_col in cols:
            assert cols[retro_col]["temporal_status"] == "RETROSPECTIVE_ONLY", (
                f"Feature {retro_col} expected to be RETROSPECTIVE_ONLY, got {cols[retro_col]['temporal_status']}"
            )


def test_financial_feature_registry_valid(master_and_labels, audit_results):
    """Assert financial features recommended exist in master feature store."""
    master_df, _ = master_and_labels
    fin_rec, _ = generate_recommended_feature_sets(audit_results)
    
    assert fin_rec["total_candidate_features"] > 0
    for feat_info in fin_rec["features"]:
        feat_name = feat_info["feature"]
        assert feat_name in master_df.columns, f"Recommended feature {feat_name} not in master columns!"
        assert feat_name.startswith("financial__") or feat_name.startswith("payment__")


def test_geospatial_feature_registry_valid(master_and_labels, audit_results):
    """Assert geospatial features recommended exist in master feature store."""
    master_df, _ = master_and_labels
    _, geo_rec = generate_recommended_feature_sets(audit_results)
    
    assert geo_rec["total_candidate_features"] > 0
    for feat_info in geo_rec["features"]:
        feat_name = feat_info["feature"]
        assert feat_name in master_df.columns, f"Recommended geo feature {feat_name} not in master columns!"
        assert feat_name.startswith("geo__") or "latitude" in feat_name or "longitude" in feat_name


def test_feature_audit_determinism(master_and_labels):
    """Assert running feature audit multiple times produces identical dictionary results."""
    master_df, labels_df = master_and_labels
    audit1 = audit_master_features(master_df, labels_df)
    audit2 = audit_master_features(master_df, labels_df)
    
    assert audit1["total_columns"] == audit2["total_columns"]
    assert audit1["classification_counts"] == audit2["classification_counts"]
    assert audit1["constant_columns"] == audit2["constant_columns"]
    assert audit1["redundant_exclusions"] == audit2["redundant_exclusions"]
