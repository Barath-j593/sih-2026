"""
test_referential_integrity.py - Tests for primary key and foreign key validation.
"""

import pytest
import pandas as pd
from app.ml.data.setu_data_layer import SETUDataLayer
from app.ml.data.validators import (
    validate_primary_keys,
    validate_referential_integrity,
    discover_table_schema,
)


@pytest.fixture
def loaded_tables():
    layer = SETUDataLayer()
    return layer.load_raw_data()


def test_primary_keys_valid(loaded_tables):
    """Assert all 12 tables have unique, non-null primary keys."""
    res = validate_primary_keys(loaded_tables)
    assert res["all_passed"] is True
    for table_name, info in res["tables"].items():
        assert info["status"] == "PASS", f"PK check failed for {table_name}: {info}"
        assert info["null_count"] == 0
        assert info["duplicate_count"] == 0


def test_referential_integrity_passes(loaded_tables):
    """Assert all 15 foreign key relationships have 0 orphans in synthetic world."""
    res = validate_referential_integrity(loaded_tables)
    assert res["all_passed"] is True
    assert res["relationship_count"] >= 12
    for rel in res["relationships"]:
        assert rel["status"] == "PASS", f"FK check failed for {rel['relationship']}: {rel}"
        assert rel["orphan_count"] == 0


def test_orphan_detection_fails_cleanly(loaded_tables):
    """Assert that injecting an orphan foreign key triggers a FAIL status."""
    corrupted_tables = {k: v.copy() for k, v in loaded_tables.items()}
    # Corrupt a payment project_id
    corrupted_tables["03_payments.csv"].loc[0, "project_id"] = "NON_EXISTENT_PROJECT_9999"
    
    res = validate_referential_integrity(corrupted_tables)
    assert res["all_passed"] is False
    
    # Find the specific relationship
    failed_rels = [r for r in res["relationships"] if r["status"] == "FAIL"]
    assert len(failed_rels) >= 1
    assert any("03_payments" in r["child_table"] for r in failed_rels)
    assert any(r["orphan_count"] > 0 for r in failed_rels)


def test_duplicate_entity_id_detected(loaded_tables):
    """Assert that injecting duplicate PKs is caught by validator."""
    corrupted_tables = {k: v.copy() for k, v in loaded_tables.items()}
    # Duplicate first contractor row
    dup_row = corrupted_tables["07_contractors.csv"].iloc[[0]]
    corrupted_tables["07_contractors.csv"] = pd.concat([corrupted_tables["07_contractors.csv"], dup_row], ignore_index=True)
    
    res = validate_primary_keys(corrupted_tables)
    assert res["all_passed"] is False
    assert res["tables"]["07_contractors.csv"]["status"] == "FAIL"
    assert res["tables"]["07_contractors.csv"]["duplicate_count"] == 1
