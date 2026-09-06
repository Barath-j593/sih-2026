# SETU Recommended ML Feature Registry

This registry defines the approved feature sets for each of SETU's domain ML models, distinguishing early-warning vs retrospective usage.

## 1. Domain Feature Groups Overview

| Domain Model Target | Recommended Features | Primary Early-Warning | Retrospective Only | Excluded (ID / Redundant / Zero-Var) |
| :--- | :--- | :--- | :--- | :--- |
| `project__*` | 11 | 10 | 1 | 7 |
| `financial__*` | 22 | 19 | 3 | 6 |
| `payment__*` | 23 | 23 | 0 | 5 |
| `progress__*` | 19 | 18 | 1 | 6 |
| `procurement__*` | 17 | 17 | 0 | 5 |
| `contract__*` | 12 | 10 | 2 | 7 |
| `contractor__*` | 20 | 20 | 0 | 11 |
| `agency__*` | 3 | 3 | 0 | 0 |
| `geo__*` | 5 | 5 | 0 | 3 |
| `constituency__*` | 1 | 1 | 0 | 0 |
| `document__*` | 28 | 26 | 2 | 22 |
| `relational_id__*` | 0 | 0 | 0 | 6 |

## 2. Complete Master Feature Registry

| Feature Name | Group | Data Type | ML Use | Temporal Status | Reason / Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `project_id` | `relational_id` | `str` | **EXCLUDED** | `NOT_APPLICABLE` | Relational key - used only for graph/relational joins and traceability, not numerical prediction |
| `project__work_type` | `project` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `project__category` | `project` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `project__project_category` | `project` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `project__project_type` | `project` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `project__project_size` | `project` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `district_id` | `relational_id` | `str` | **EXCLUDED** | `NOT_APPLICABLE` | Relational key - used only for graph/relational joins and traceability, not numerical prediction |
| `state_id` | `relational_id` | `str` | **EXCLUDED** | `NOT_APPLICABLE` | Relational key - used only for graph/relational joins and traceability, not numerical prediction |
| `constituency_id` | `relational_id` | `str` | **EXCLUDED** | `NOT_APPLICABLE` | Relational key - used only for graph/relational joins and traceability, not numerical prediction |
| `contractor_id` | `relational_id` | `str` | **EXCLUDED** | `NOT_APPLICABLE` | Relational key - used only for graph/relational joins and traceability, not numerical prediction |
| `agency_id` | `relational_id` | `str` | **EXCLUDED** | `NOT_APPLICABLE` | Relational key - used only for graph/relational joins and traceability, not numerical prediction |
| `project__recommendation_date` | `project` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `project__sanction_date` | `project` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `project__start_date` | `project` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `project__expected_completion_date` | `project` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `project__target_completion_date` | `project` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `project__actual_completion_date` | `project` | `str` | **EXCLUDED** | `RETROSPECTIVE_ONLY` | Raw date string - transform to elapsed days/intervals before modeling |
| `project__project_duration` | `project` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Redundant duplicate of project__planned_duration_days (r = 1.0) |
| `project__planned_duration_days` | `project` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `project__actual_duration_days` | `project` | `int64` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | PRIMARY_NUMERICAL_FEATURE |
| `project__status` | `project` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `project__project_status` | `project` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `project__project_latitude` | `project` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `project__project_longitude` | `project` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__recommended_amount` | `financial` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact collinear duplicate of financial__estimated_cost (r = 1.0) |
| `financial__estimated_cost` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__sanctioned_amount` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__revised_cost` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__tender_amount` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__tender_value` | `financial` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of financial__tender_amount (r = 1.0) |
| `financial__released_amount` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__fund_released` | `financial` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of financial__released_amount (r = 1.0) |
| `financial__actual_expenditure` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | PRIMARY_NUMERICAL_FEATURE |
| `financial__unspent_balance` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | PRIMARY_NUMERICAL_FEATURE |
| `financial__remaining_balance` | `financial` | `float64` | **EXCLUDED** | `RETROSPECTIVE_ONLY` | Exact duplicate of financial__unspent_balance (r = 1.0) |
| `financial__fund_utilization_ratio` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__utilization_ratio` | `financial` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of financial__fund_utilization_ratio (r = 1.0) |
| `financial__release_ratio` | `financial` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 1.0) |
| `financial__expenditure_ratio` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__cost_per_unit` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__peer_median_cost` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__peer_mean_cost` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__cost_deviation` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__tender_estimate_deviation` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__actual_sanction_deviation` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__cost_overrun` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | PRIMARY_NUMERICAL_FEATURE |
| `financial__cost_per_km` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__cost_per_sqft` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__cost_per_beneficiary` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__sor_deviation` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__market_rate_deviation` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `financial__inflation_adjusted_cost_deviation` | `financial` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__payment_count` | `payment` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__total_paid` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__average_payment` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__median_payment` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__min_payment` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__max_payment` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__payment_amount_std` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__first_payment_date` | `payment` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `payment__last_payment_date` | `payment` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `payment__payment_span_days` | `payment` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__average_days_between_payments` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__median_days_between_payments` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__payment_interval_std` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__payment_velocity_mean` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__payment_velocity_max` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__payment_frequency_mean` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__payment_concentration_max` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__duplicate_payment_count` | `payment` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `payment__duplicate_payment_rate` | `payment` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0.0) |
| `payment__payment_timing_anomaly_count` | `payment` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__payment_timing_anomaly_rate` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__unverified_payment_count` | `payment` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__unverified_payment_rate` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__round_number_payment_count` | `payment` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__round_number_payment_rate` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__final_installment_count` | `payment` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 1) |
| `payment__final_installment_amount` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `payment__final_installment_share` | `payment` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__progress_observation_count` | `progress` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 1) |
| `progress__latest_physical_progress` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__latest_financial_progress` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__latest_planned_progress` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__latest_completion_percentage` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | PRIMARY_NUMERICAL_FEATURE |
| `progress__latest_progress_mismatch` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__latest_progress_gap` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__financial_minus_physical_progress` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__actual_vs_planned_progress` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__physical_progress_slope` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__financial_progress_slope` | `progress` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0.0) |
| `progress__planned_progress_slope` | `progress` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0.0) |
| `progress__progress_gap_slope` | `progress` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0.0) |
| `progress__progress_velocity_latest` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__progress_acceleration_latest` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__latest_delay_days` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__max_delay_days` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__extension_count` | `progress` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__planned_duration_days` | `progress` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Redundant duplicate of project__planned_duration_days (r = 1.0) |
| `progress__actual_duration_days` | `progress` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Redundant duplicate of project__actual_duration_days (r = 1.0) |
| `progress__duration_overrun_days` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__duration_overrun_ratio` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__geotag_available_rate` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__geotag_consistency_rate` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `progress__measurement_book_verified_rate` | `progress` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__tender_exists` | `procurement` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 1) |
| `procurement__procurement_method` | `procurement` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `procurement__tender_publication_date` | `procurement` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `procurement__tender_duration` | `procurement` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__bid_count` | `procurement` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__qualified_bid_count` | `procurement` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__single_bid_flag` | `procurement` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__bid_competition_score` | `procurement` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__tender_type` | `procurement` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `procurement__winning_bid` | `procurement` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of procurement__winning_bid_amount (r = 1.0) |
| `procurement__winning_bid_amount` | `procurement` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__winning_bid_deviation` | `procurement` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__winning_bid_vs_lowest_bid` | `procurement` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__bid_price_similarity` | `procurement` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__bidder_disqualification_rate` | `procurement` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__re_tender_count` | `procurement` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__tender_cancellation_count` | `procurement` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `procurement__tender_bypass_flag` | `procurement` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `procurement__repeated_winner_flag` | `procurement` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__bid_rotation_score` | `procurement` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__repeated_loser_score` | `procurement` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `procurement__procurement_compliance_flag` | `procurement` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__work_order_amount` | `contract` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__original_contract_value` | `contract` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of contract__work_order_amount (r = 1.0) |
| `contract__final_contract_value` | `contract` | `float64` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | PRIMARY_NUMERICAL_FEATURE |
| `contract__contract_value_change` | `contract` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__contract_amendment_count` | `contract` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__amendment_value` | `contract` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__extension_count` | `contract` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Duplicate of progress__extension_count (r = 1.0) |
| `contract__extension_duration` | `contract` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__award_date` | `contract` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `contract__original_completion_date` | `contract` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `contract__revised_completion_date` | `contract` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `contract__contract_delay_days` | `contract` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__contractor_capacity` | `contract` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__contract_value_to_capacity` | `contract` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__external_service_provider_flag` | `contract` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `contract__subcontractor_count` | `contract` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__subcontractor_value_share` | `contract` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contract__end_period_expenditure_ratio` | `contract` | `float64` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | PRIMARY_NUMERICAL_FEATURE |
| `contract__performance_guarantee_submitted` | `contract` | `bool` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: True) |
| `contractor__registration_category` | `contractor` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `contractor__financial_capacity` | `contractor` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__base_quality_score` | `contractor` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__past_irregularity_rate` | `contractor` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__contractor_past_irregularity_rate` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of contractor__past_irregularity_rate (r = 1.0) |
| `contractor__contractor_capacity_strain` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of contractor__capacity_strain (r = 1.0) |
| `contractor__contractor_project_count` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__contractor_total_contract_value` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Collinear with contractor__value_share (r > 0.99) |
| `contractor__contractor_average_contract_value` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Collinear with contractor__total_contract_value |
| `contractor__contractor_max_contract_value` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Collinear with contractor__total_contract_value |
| `contractor__contractor_project_share` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Collinear with contractor__project_count (r > 0.99) |
| `contractor__contractor_value_share` | `contractor` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__contractor_district_concentration` | `contractor` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__contractor_agency_concentration` | `contractor` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__contractor_constituency_concentration` | `contractor` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__contractor_delay_rate` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of contractor__delay_rate (r = 1.0) |
| `contractor__contractor_completion_rate` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of contractor__completion_rate (r = 1.0) |
| `contractor__contractor_cancellation_rate` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of contractor__cancellation_rate (r = 1.0) |
| `contractor__contractor_previous_irregularities` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__contractor_financial_capacity` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of contractor__financial_capacity (r = 1.0) |
| `contractor__contractor_value_to_capacity` | `contractor` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of contractor__value_to_capacity (r = 1.0) |
| `contractor__repeated_agency_contractor_pair` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__shared_ownership` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__shared_directors` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__shared_shareholders` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__shared_address` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__beneficial_owner_overlap` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__contractor_financial_health` | `contractor` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__company_ownership_change` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__director_change` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `contractor__address_change` | `contractor` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `agency__agency_type` | `agency` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `agency__agency_workload_ratio` | `agency` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `agency__agency_geographic_concentration` | `agency` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `geo__district_latitude` | `geo` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of project__project_latitude (r = 1.0) |
| `geo__district_longitude` | `geo` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of project__project_longitude (r = 1.0) |
| `geo__population` | `geo` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `geo__population_density` | `geo` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `geo__literacy_rate` | `geo` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `geo__poverty_rate` | `geo` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `geo__infrastructure_gap_index` | `geo` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `geo__geographic_cluster_id` | `geo` | `str` | **EXCLUDED** | `NOT_APPLICABLE` | Relational key - used only for graph/relational joins and traceability, not numerical prediction |
| `constituency__mp_house` | `constituency` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `document__administrative_sanction` | `document` | `bool` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: True) |
| `document__technical_sanction` | `document` | `bool` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: True) |
| `document__dpr` | `document` | `bool` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: True) |
| `document__work_order` | `document` | `bool` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: True) |
| `document__measurement_book` | `document` | `bool` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__utilization_certificate` | `document` | `bool` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__completion_certificate` | `document` | `bool` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | PRIMARY_NUMERICAL_FEATURE |
| `document__geo_tagged_photos` | `document` | `bool` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__photo_count` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__required_document_count` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 5) |
| `document__available_document_count` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__missing_document_ratio` | `document` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__document_exists_flag` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 1) |
| `document__document_type` | `document` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: PDF_BUNDLE) |
| `document__document_date` | `document` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `document__document_amount` | `document` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__document_entity` | `document` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `document__document_project_reference` | `document` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `document__document_database_match_score` | `document` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__document_amount_mismatch` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `document__document_date_mismatch` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `document__document_entity_mismatch` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `document__document_duplicate_hash` | `document` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `document__document_version_count` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__document_tampering_flag` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `document__ocr_confidence_score` | `document` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__data_completeness_score` | `document` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__missing_field_count` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__missing_critical_field_flag` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__data_validation_status` | `document` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `document__data_source` | `document` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: e-SAKSHI Portal) |
| `document__source_system` | `document` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: MoSPI_MPLADS_V2) |
| `document__last_updated_timestamp` | `document` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `document__record_update_count` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 3) |
| `document__late_data_submission_flag` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__inconsistent_record_flag` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__cross_source_mismatch_flag` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 0) |
| `document__asset_created_flag` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__asset_register_entry_flag` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__asset_location` | `document` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `document__asset_latitude` | `document` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of project__project_latitude (r = 1.0) |
| `document__asset_longitude` | `document` | `float64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Exact duplicate of project__project_longitude (r = 1.0) |
| `document__asset_photo_available` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__asset_photo_date` | `document` | `str` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Raw date string - transform to elapsed days/intervals before modeling |
| `document__asset_photo_count` | `document` | `int64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |
| `document__asset_status` | `document` | `str` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | CATEGORICAL_FEATURE_ENCODING |
| `document__asset_verification_status` | `document` | `str` | **APPROVED_ML_FEATURE** | `RETROSPECTIVE_ONLY` | CATEGORICAL_FEATURE_ENCODING |
| `document__asset_project_link_match` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 1) |
| `document__asset_geo_consistency` | `document` | `int64` | **EXCLUDED** | `SAFE_EARLY_WARNING` | Zero variance (constant value across all 5,000 projects: 1) |
| `document__asset_completion_evidence_score` | `document` | `float64` | **APPROVED_ML_FEATURE** | `SAFE_EARLY_WARNING` | PRIMARY_NUMERICAL_FEATURE |