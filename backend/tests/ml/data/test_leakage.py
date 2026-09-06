"""
test_leakage.py - Strict test suite for label isolation and zero target leakage.
"""

# pyrefly: ignore [missing-import]
import pytest
import pandas as pd
from app.ml.data.setu_data_layer import SETUDataLayer
from app.ml.data.validators import validate_label_leakage
from app.ml.data.schemas import TARGET_LEAKAGE_COLUMNS


@pytest.fixture
def loaded_pipeline():
    layer = SETUDataLayer()
    return layer.run()


def test_zero_target_columns_in_master_features(loaded_pipeline):
    """Assert none of the supervised target labels exist in project_master_features."""
    master_df = loaded_pipeline["master_df"]
    labels_df = loaded_pipeline["labels_df"]
    
    leakage_res = validate_label_leakage(master_df, labels_df)
    assert leakage_res["status"] == "PASS"
    assert leakage_res["leakage_detected"] is False
    assert len(leakage_res["leaked_columns"]) == 0
    
    for target_col in TARGET_LEAKAGE_COLUMNS:
        assert target_col not in master_df.columns, f"Target column {target_col} leaked into master features!"
        assert f"target__{target_col}" not in master_df.columns
        for c in master_df.columns:
            assert not c.endswith(f"__{target_col}")


def test_project_labels_isolated_correctly(loaded_pipeline):
    """Assert project_labels contains project_id and target columns and aligns with project universe."""
    master_df = loaded_pipeline["master_df"]
    labels_df = loaded_pipeline["labels_df"]
    
    assert "project_id" in labels_df.columns
    assert len(labels_df) == len(master_df)
    assert set(labels_df["project_id"]) == set(master_df["project_id"])
    assert "fraud_label" in labels_df.columns
    assert "is_fraud" in labels_df.columns
