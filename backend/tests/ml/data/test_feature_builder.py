"""
test_feature_builder.py - Unit tests for project master feature compilation and entity context joins.
"""

import pytest
import pandas as pd
from app.ml.data.setu_data_layer import SETUDataLayer
from app.ml.data.feature_builder import build_project_master_features
from app.ml.data.schemas import RAW_IDENTITY_COLUMNS, TARGET_LEAKAGE_COLUMNS


@pytest.fixture
def loaded_tables():
    layer = SETUDataLayer()
    return layer.load_raw_data()


def test_master_features_one_row_per_project(loaded_tables):
    """Assert master feature store preserves exact project universe with 1 row per project."""
    master, payments, progress, labels = build_project_master_features(loaded_tables)
    
    expected_projects = len(loaded_tables["01_projects.csv"])
    assert len(master) == expected_projects
    assert master["project_id"].nunique() == expected_projects
    assert len(master.columns[master.columns.duplicated()]) == 0


def test_feature_group_prefixes_present(loaded_tables):
    """Assert all expected feature group prefixes are represented."""
    master, _, _, _ = build_project_master_features(loaded_tables)
    
    expected_prefixes = {
        "project__",
        "financial__",
        "payment__",
        "progress__",
        "procurement__",
        "contract__",
        "contractor__",
        "agency__",
        "geo__",
        "constituency__",
        "document__",
    }
    
    found_prefixes = {col.split("__")[0] + "__" for col in master.columns if "__" in col}
    assert expected_prefixes.issubset(found_prefixes), f"Missing prefixes: {expected_prefixes - found_prefixes}"


def test_raw_identity_columns_excluded(loaded_tables):
    """Assert that raw entity text strings (e.g. contractor_name, mp_name) are stripped from master."""
    master, _, _, _ = build_project_master_features(loaded_tables)
    
    for raw_id in RAW_IDENTITY_COLUMNS:
        assert raw_id not in master.columns, f"Raw identity column {raw_id} leaked into master features!"
        for col in master.columns:
            assert not col.endswith(f"__{raw_id}"), f"Prefixed raw identity {col} leaked into master!"


def test_missing_child_records_do_not_drop_projects(loaded_tables):
    """Assert that if a child table has missing rows, left join preserves all base projects."""
    sparse_tables = {k: v.copy() for k, v in loaded_tables.items()}
    # Drop half of procurement rows
    sparse_tables["05_procurement.csv"] = sparse_tables["05_procurement.csv"].iloc[:2500]
    
    master, _, _, _ = build_project_master_features(sparse_tables)
    assert len(master) == len(loaded_tables["01_projects.csv"])
    assert master["project_id"].nunique() == len(loaded_tables["01_projects.csv"])
