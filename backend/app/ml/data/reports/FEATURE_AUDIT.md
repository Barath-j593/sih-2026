# SETU Feature Audit & ML Selection Report (Stage 2A)

This document presents the comprehensive audit of all **239 features** in `project_master_features.csv`, their classification, temporal safety, correlation redundancies, zero-variance exclusions, and target quarantine verification.

## 1. Executive Summary & Column Distribution

| Classification Category | Column Count | Description |
| :--- | :--- | :--- |
| `IDENTIFIER` | 7 | Primary / Foreign key relational IDs (retained for graph joins & tracing, excluded from ML) |
| `METADATA` | 0 | Entity names/text metadata (excluded from predictive vectors) |
| `TEMPORAL` | 15 | Raw date strings (used as temporal anchors/spans) |
| `EXCLUDE` | 56 | Zero-variance constants (30 cols) and exact collinear duplicates (22 cols) |
| `NUMERICAL` (ML Candidate) | 142 | Clean numerical features suitable for ML anomaly modeling |
| `CATEGORICAL` (ML Candidate) | 19 | Clean categorical features suitable for one-hot/frequency encoding |
| **Total Master Columns** | **239** | **100% of master feature columns audited** |

### Temporal Safety Breakdown

- **Early-Warning Safe**: `221` features (available during tender, sanction, or active execution).

- **Retrospective-Only**: `11` features (post-completion, final expenditures, actual completion certificates — cause temporal leakage if used for early prediction).

- **Direct Target Leakage**: `0` columns inside master (Quarantined in `project_labels.csv`).

## 2. Target Quarantine & Label Roles (`project_labels.csv`)

| Label Column | Role | Data Type | Quarantine Verified | Role in ML Lifecycle |
| :--- | :--- | :--- | :--- | :--- |
| `project_id` | **IDENTIFIER** | `str` | `FAIL` | Offline training/evaluation only |
| `fraud_label` | **PRIMARY_SUPERVISED_TARGET** | `int64` | `YES (0 in master)` | Offline training/evaluation only |
| `is_fraud` | **PRIMARY_SUPERVISED_TARGET** | `int64` | `YES (0 in master)` | Offline training/evaluation only |
| `is_anomalous` | **AUXILIARY_SUPERVISED_TARGET** | `int64` | `YES (0 in master)` | Offline training/evaluation only |
| `is_hard_negative` | **EVALUATION_METADATA_FILTER** | `int64` | `YES (0 in master)` | Offline training/evaluation only |
| `risk_level` | **AUXILIARY_SUPERVISED_TARGET** | `str` | `YES (0 in master)` | Offline training/evaluation only |
| `scenario_type` | **SCENARIO_TAXONOMY_METADATA** | `str` | `YES (0 in master)` | Offline training/evaluation only |
| `scenario_name` | **SCENARIO_TAXONOMY_METADATA** | `str` | `YES (0 in master)` | Offline training/evaluation only |
| `overall_risk_score` | **CONTINUOUS_GROUND_TRUTH_SCORE** | `float64` | `YES (0 in master)` | Offline training/evaluation only |
| `investigation_priority` | **INVESTIGATION_RANKING_METADATA** | `str` | `YES (0 in master)` | Offline training/evaluation only |

## 3. High Correlation & Collinear Redundancy Analysis

We identified **485 highly correlated pairs** ($|r| \ge 0.85$), including **22 exact collinear duplicate pairs** ($|r| \ge 0.9999$).

| Feature 1 | Feature 2 | Correlation ($r$) | Recommendation |
| :--- | :--- | :--- | :--- |
| `project__project_duration` | `project__planned_duration_days` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `project__project_duration` | `progress__planned_duration_days` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `project__planned_duration_days` | `progress__planned_duration_days` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `project__actual_duration_days` | `progress__actual_duration_days` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `project__project_latitude` | `geo__district_latitude` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `project__project_latitude` | `document__asset_latitude` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `project__project_longitude` | `geo__district_longitude` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `project__project_longitude` | `document__asset_longitude` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `financial__recommended_amount` | `financial__estimated_cost` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `financial__recommended_amount` | `financial__peer_median_cost` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `financial__recommended_amount` | `financial__peer_mean_cost` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `financial__estimated_cost` | `financial__peer_median_cost` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `financial__estimated_cost` | `financial__peer_mean_cost` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `financial__sanctioned_amount` | `financial__released_amount` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |
| `financial__sanctioned_amount` | `financial__fund_released` | **1.0** | Keep Feature 1, Exclude Feature 2 (exact duplicate) |

## 4. Zero-Variance (Constant) Feature Exclusions

The following **30 features** have zero variance across all 5,000 projects and must be excluded from ML feature matrices:

- `contract__external_service_provider_flag` (Constant across all rows)
- `contract__performance_guarantee_submitted` (Constant across all rows)
- `document__administrative_sanction` (Constant across all rows)
- `document__asset_geo_consistency` (Constant across all rows)
- `document__asset_project_link_match` (Constant across all rows)
- `document__cross_source_mismatch_flag` (Constant across all rows)
- `document__data_source` (Constant across all rows)
- `document__document_amount_mismatch` (Constant across all rows)
- `document__document_date_mismatch` (Constant across all rows)
- `document__document_entity_mismatch` (Constant across all rows)
- `document__document_exists_flag` (Constant across all rows)
- `document__document_tampering_flag` (Constant across all rows)
- `document__document_type` (Constant across all rows)
- `document__dpr` (Constant across all rows)
- `document__record_update_count` (Constant across all rows)
- `document__required_document_count` (Constant across all rows)
- `document__source_system` (Constant across all rows)
- `document__technical_sanction` (Constant across all rows)
- `document__work_order` (Constant across all rows)
- `financial__release_ratio` (Constant across all rows)
- `payment__duplicate_payment_count` (Constant across all rows)
- `payment__duplicate_payment_rate` (Constant across all rows)
- `payment__final_installment_count` (Constant across all rows)
- `procurement__tender_bypass_flag` (Constant across all rows)
- `procurement__tender_cancellation_count` (Constant across all rows)
- `procurement__tender_exists` (Constant across all rows)
- `progress__financial_progress_slope` (Constant across all rows)
- `progress__planned_progress_slope` (Constant across all rows)
- `progress__progress_gap_slope` (Constant across all rows)
- `progress__progress_observation_count` (Constant across all rows)

## 5. Missingness Audit

- `project__actual_completion_date`: 4,227 missing (84.5%) — Incomplete/ongoing works.

- `document__asset_photo_date`: 4,227 missing (84.5%) — Recorded only upon physical completion.

- All other 237 features have **0 missing values (0.0%)**.
