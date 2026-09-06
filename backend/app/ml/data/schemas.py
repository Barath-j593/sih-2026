"""
schemas.py - Centralized schema definitions, column safety classifications,
and domain specifications for SETU relational data layer.
"""

from enum import Enum
from typing import Dict, List, Set, Any


class ColumnCategory(str, Enum):
    IDENTIFIER = "IDENTIFIER"
    ML_FEATURE = "ML_FEATURE"
    TARGET = "TARGET"
    METADATA = "METADATA"
    TEMPORAL = "TEMPORAL"


# Strictly quarantined target columns from 12_labels.csv
TARGET_LEAKAGE_COLUMNS: List[str] = [
    "fraud_label",
    "is_fraud",
    "is_anomalous",
    "is_hard_negative",
    "risk_level",
    "scenario_type",
    "scenario_name",
    "overall_risk_score",
    "investigation_priority",
]

# Raw entity identity strings that must not be standalone predictive features
RAW_IDENTITY_COLUMNS: List[str] = [
    "contractor_name",
    "agency_name",
    "mp_name",
    "district_name",
    "state_name",
    "constituency_name",
    "work_name",
    "title",
]

# Relational join keys retained for traceability but categorized as IDENTIFIER
RELATIONAL_KEYS: List[str] = [
    "project_id",
    "contractor_id",
    "agency_id",
    "district_id",
    "state_id",
    "constituency_id",
    "payment_id",
    "progress_id",
    "tender_id",
    "contract_id",
    "document_id",
    "asset_id",
]

# Temporally sensitive features representing post-completion or outcome-adjacent states
TEMPORALLY_SENSITIVE_FEATURES: List[str] = [
    "project__actual_completion_date",
    "project__actual_duration_days",
    "financial__actual_expenditure",
    "financial__unspent_balance",
    "financial__remaining_balance",
    "contract__final_contract_value",
    "contract__end_period_expenditure_ratio",
    "progress__latest_completion_percentage",
    "document__completion_certificate",
    "document__asset_verification_status",
]

# Standard source file registry and logical schema expectations
SOURCE_TABLE_SPECS: Dict[str, Dict[str, Any]] = {
    "01_projects.csv": {
        "logical_name": "projects",
        "primary_key": "project_id",
        "grain": "1 row = 1 project",
        "foreign_keys": {
            "contractor_id": ("07_contractors.csv", "contractor_id"),
            "agency_id": ("08_agencies.csv", "agency_id"),
            "district_id": ("09_geography.csv", "district_id"),
            "constituency_id": ("10_constituencies.csv", "constituency_id"),
        },
        "id_prefix": "project__",
        "expected_columns": [
            "project_id", "work_name", "title", "work_type", "category",
            "project_category", "project_type", "project_size",
            "district_id", "district_name", "state_id", "state_name",
            "constituency_id", "constituency_name", "contractor_id", "agency_id",
            "recommendation_date", "sanction_date", "start_date",
            "expected_completion_date", "target_completion_date",
            "actual_completion_date", "project_duration",
            "planned_duration_days", "actual_duration_days",
            "status", "project_status", "project_latitude", "project_longitude"
        ],
    },
    "02_financials.csv": {
        "logical_name": "financials",
        "primary_key": "project_id",
        "grain": "1 row = 1 project",
        "foreign_keys": {
            "project_id": ("01_projects.csv", "project_id"),
        },
        "id_prefix": "financial__",
        "expected_columns": [
            "project_id", "recommended_amount", "estimated_cost",
            "sanctioned_amount", "revised_cost", "tender_amount",
            "tender_value", "released_amount", "fund_released",
            "actual_expenditure", "unspent_balance", "remaining_balance",
            "fund_utilization_ratio", "utilization_ratio", "release_ratio",
            "expenditure_ratio", "cost_per_unit", "peer_median_cost",
            "peer_mean_cost", "cost_deviation", "tender_estimate_deviation",
            "actual_sanction_deviation", "cost_overrun", "cost_per_km",
            "cost_per_sqft", "cost_per_beneficiary", "sor_deviation",
            "market_rate_deviation", "inflation_adjusted_cost_deviation"
        ],
    },
    "03_payments.csv": {
        "logical_name": "payments",
        "primary_key": "payment_id",
        "grain": "MANY rows = 1 project",
        "foreign_keys": {
            "project_id": ("01_projects.csv", "project_id"),
            "contractor_id": ("07_contractors.csv", "contractor_id"),
        },
        "id_prefix": "payment__",
        "expected_columns": [
            "payment_id", "project_id", "contractor_id", "tranche_number",
            "payment_number", "payment_amount", "payment_date",
            "voucher_number", "cumulative_payment", "payment_velocity",
            "payment_frequency", "payment_concentration", "is_round_number",
            "is_final_installment", "duplicate_payment_flag",
            "payment_timing_anomaly", "measurement_book_verified"
        ],
    },
    "04_progress.csv": {
        "logical_name": "progress",
        "primary_key": "progress_id",
        "grain": "MANY rows = 1 project (temporal observations)",
        "foreign_keys": {
            "project_id": ("01_projects.csv", "project_id"),
        },
        "id_prefix": "progress__",
        "expected_columns": [
            "progress_id", "project_id", "record_date", "physical_progress",
            "financial_progress", "planned_progress", "actual_vs_planned_progress",
            "progress_mismatch", "progress_velocity", "progress_acceleration",
            "completion_percentage", "physical_progress_delay",
            "financial_physical_gap", "planned_duration_days",
            "actual_duration_days", "extension_count", "progress_gap",
            "measurement_book_verified", "geo_tag_available",
            "geo_tag_progress_consistency"
        ],
    },
    "05_procurement.csv": {
        "logical_name": "procurement",
        "primary_key": "tender_id",
        "grain": "1 row = 1 project (~1:1)",
        "foreign_keys": {
            "project_id": ("01_projects.csv", "project_id"),
        },
        "id_prefix": "procurement__",
        "expected_columns": [
            "tender_id", "project_id", "tender_exists", "procurement_method",
            "tender_publication_date", "tender_duration", "bid_count",
            "qualified_bid_count", "single_bid_flag", "bid_competition_score",
            "tender_type", "winning_bid", "winning_bid_amount",
            "winning_bid_deviation", "winning_bid_vs_lowest_bid",
            "bid_price_similarity", "bidder_disqualification_rate",
            "re_tender_count", "tender_cancellation_count",
            "tender_bypass_flag", "repeated_winner_flag",
            "bid_rotation_score", "repeated_loser_score",
            "procurement_compliance_flag"
        ],
    },
    "06_contracts.csv": {
        "logical_name": "contracts",
        "primary_key": "contract_id",
        "grain": "1 row = 1 project (~1:1)",
        "foreign_keys": {
            "project_id": ("01_projects.csv", "project_id"),
            "contractor_id": ("07_contractors.csv", "contractor_id"),
        },
        "id_prefix": "contract__",
        "expected_columns": [
            "contract_id", "project_id", "contractor_id", "work_order_amount",
            "original_contract_value", "final_contract_value",
            "contract_value_change", "contract_amendment_count",
            "amendment_value", "extension_count", "extension_duration",
            "award_date", "original_completion_date", "revised_completion_date",
            "contract_delay_days", "contractor_capacity",
            "contract_value_to_capacity", "external_service_provider_flag",
            "subcontractor_count", "subcontractor_value_share",
            "end_period_expenditure_ratio", "performance_guarantee_submitted"
        ],
    },
    "07_contractors.csv": {
        "logical_name": "contractors",
        "primary_key": "contractor_id",
        "grain": "1 row = 1 contractor",
        "foreign_keys": {
            "home_district_id": ("09_geography.csv", "district_id"),
        },
        "id_prefix": "contractor__",
        "expected_columns": [
            "contractor_id", "contractor_name", "home_district_id",
            "home_state_id", "registration_category", "financial_capacity",
            "base_quality_score", "past_irregularity_rate",
            "contractor_past_irregularity_rate", "contractor_capacity_strain",
            "contractor_project_count", "contractor_total_contract_value",
            "contractor_average_contract_value", "contractor_max_contract_value",
            "contractor_project_share", "contractor_value_share",
            "contractor_district_concentration", "contractor_agency_concentration",
            "contractor_constituency_concentration", "contractor_delay_rate",
            "contractor_completion_rate", "contractor_cancellation_rate",
            "contractor_previous_irregularities", "contractor_financial_capacity",
            "contractor_value_to_capacity", "repeated_agency_contractor_pair",
            "shared_ownership", "shared_directors", "shared_shareholders",
            "shared_address", "beneficial_owner_overlap",
            "contractor_financial_health", "company_ownership_change",
            "director_change", "address_change"
        ],
    },
    "08_agencies.csv": {
        "logical_name": "agencies",
        "primary_key": "agency_id",
        "grain": "1 row = 1 implementing agency",
        "foreign_keys": {
            "district_id": ("09_geography.csv", "district_id"),
        },
        "id_prefix": "agency__",
        "expected_columns": [
            "agency_id", "agency_name", "district_id", "state_id",
            "agency_type", "agency_workload_ratio",
            "agency_geographic_concentration"
        ],
    },
    "09_geography.csv": {
        "logical_name": "geography",
        "primary_key": "district_id",
        "grain": "1 row = 1 district / geographic entity",
        "foreign_keys": {},
        "id_prefix": "geo__",
        "expected_columns": [
            "district_id", "district_name", "state_id", "state_name",
            "district_latitude", "district_longitude", "population",
            "population_density", "literacy_rate", "poverty_rate",
            "infrastructure_gap_index", "geographic_cluster_id"
        ],
    },
    "10_constituencies.csv": {
        "logical_name": "constituencies",
        "primary_key": "constituency_id",
        "grain": "1 row = 1 constituency",
        "foreign_keys": {
            "district_id": ("09_geography.csv", "district_id"),
        },
        "id_prefix": "constituency__",
        "expected_columns": [
            "constituency_id", "constituency_name", "district_id",
            "state_id", "mp_name", "mp_house"
        ],
    },
    "11_documents.csv": {
        "logical_name": "documents",
        "primary_key": "document_id",
        "grain": "1 row = 1 project (evidence bundle)",
        "foreign_keys": {
            "project_id": ("01_projects.csv", "project_id"),
        },
        "id_prefix": "document__",
        "expected_columns": [
            "document_id", "project_id", "administrative_sanction",
            "technical_sanction", "dpr", "work_order", "measurement_book",
            "utilization_certificate", "completion_certificate",
            "geo_tagged_photos", "photo_count", "required_document_count",
            "available_document_count", "missing_document_ratio",
            "document_exists_flag", "document_type", "document_date",
            "document_amount", "document_entity", "document_project_reference",
            "document_database_match_score", "document_amount_mismatch",
            "document_date_mismatch", "document_entity_mismatch",
            "document_duplicate_hash", "document_version_count",
            "document_tampering_flag", "ocr_confidence_score",
            "data_completeness_score", "missing_field_count",
            "missing_critical_field_flag", "data_validation_status",
            "data_source", "source_system", "last_updated_timestamp",
            "record_update_count", "late_data_submission_flag",
            "inconsistent_record_flag", "cross_source_mismatch_flag",
            "asset_id", "asset_created_flag", "asset_register_entry_flag",
            "asset_location", "asset_latitude", "asset_longitude",
            "asset_photo_available", "asset_photo_date", "asset_photo_count",
            "asset_status", "asset_verification_status",
            "asset_project_link_match", "asset_geo_consistency",
            "asset_completion_evidence_score"
        ],
    },
    "12_labels.csv": {
        "logical_name": "labels",
        "primary_key": "project_id",
        "grain": "1 row = 1 project (Supervised Target)",
        "foreign_keys": {
            "project_id": ("01_projects.csv", "project_id"),
        },
        "id_prefix": "target__",
        "expected_columns": [
            "project_id", "fraud_label", "is_fraud", "is_anomalous",
            "is_hard_negative", "risk_level", "scenario_type",
            "scenario_name", "overall_risk_score", "investigation_priority"
        ],
    },
}


def classify_column(column_name: str) -> ColumnCategory:
    """Classifies a column into its architectural category."""
    lower = column_name.lower()
    if any(lower == target or lower.endswith(f"__{target}") for target in TARGET_LEAKAGE_COLUMNS):
        return ColumnCategory.TARGET
    if lower in RELATIONAL_KEYS or lower.endswith("_id"):
        return ColumnCategory.IDENTIFIER
    if lower in RAW_IDENTITY_COLUMNS:
        return ColumnCategory.METADATA
    if "date" in lower or "timestamp" in lower:
        return ColumnCategory.TEMPORAL
    return ColumnCategory.ML_FEATURE
