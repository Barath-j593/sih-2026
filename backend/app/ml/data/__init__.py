"""
SETU Relational Data Foundation and Feature Engineering Layer.
"""

from .schemas import (
    ColumnCategory,
    TARGET_LEAKAGE_COLUMNS,
    RAW_IDENTITY_COLUMNS,
    RELATIONAL_KEYS,
    SOURCE_TABLE_SPECS,
    TEMPORALLY_SENSITIVE_FEATURES,
)
from .validators import (
    discover_table_schema,
    validate_primary_keys,
    validate_referential_integrity,
    validate_numeric_and_temporal,
    validate_label_leakage,
    validate_master_feature_store,
)
from .aggregators import aggregate_payments, aggregate_progress
from .feature_builder import (
    build_project_master_features,
    extract_contractor_features,
    extract_agency_features,
    extract_geography_features,
    extract_constituency_features,
)
from .setu_data_layer import SETUDataLayer, run_pipeline

__all__ = [
    "ColumnCategory",
    "TARGET_LEAKAGE_COLUMNS",
    "RAW_IDENTITY_COLUMNS",
    "RELATIONAL_KEYS",
    "SOURCE_TABLE_SPECS",
    "TEMPORALLY_SENSITIVE_FEATURES",
    "discover_table_schema",
    "validate_primary_keys",
    "validate_referential_integrity",
    "validate_numeric_and_temporal",
    "validate_label_leakage",
    "validate_master_feature_store",
    "aggregate_payments",
    "aggregate_progress",
    "build_project_master_features",
    "extract_contractor_features",
    "extract_agency_features",
    "extract_geography_features",
    "extract_constituency_features",
    "SETUDataLayer",
    "run_pipeline",
]
