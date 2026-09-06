# SETU Feature Store — Data Dictionary & Lineage Specification

This document provides complete metadata, source lineage, transformation formulas, domain semantics, and ML-safety classifications for all **239 features** in `project_master_features.csv` and the quarantined target store `project_labels.csv`.

## 1. Architectural Safeguards

- **Strict 1-to-1 Project Grain**: Every row represents exactly one project uniquely keyed by `project_id` (dynamically verified).

- **Zero Target Leakage**: Supervised labels from `12_labels.csv` (`fraud_label`, `is_fraud`, `is_anomalous`, `risk_level`, `scenario_type`, `scenario_name`, `overall_risk_score`, `investigation_priority`) are quarantined exclusively into `project_labels.csv`.

- **Identity Protection**: Raw text names (`contractor_name`, `agency_name`, `mp_name`, `district_name`, `state_name`, `constituency_name`) are stripped from predictive feature vectors. Predictive models learn behavioral and contextual patterns rather than memorizing entity identities.

- **Feature Lineage Grouping**: All feature columns are prefixed with their domain source group (`project__`, `financial__`, `payment__`, `progress__`, `procurement__`, `contract__`, `contractor__`, `agency__`, `geo__`, `constituency__`, `document__`).

- **Temporal Sensitivity**: Outcome-adjacent or post-completion features are marked as `TEMPORALLY_SENSITIVE`.

## 2. Feature Group Summary

| Feature Group Prefix | Domain Source | Column Count | Description |
| :--- | :--- | :--- | :--- |
| `relational_id` | Core Relational Keys | 6 | Primary and Foreign key identifiers for graph lineage & tracing |
| `project__` | 01_projects.csv | 18 | Project categories, types, duration, status, and coordinates |
| `financial__` | 02_financials.csv | 28 | Cost estimates, sanctioned amounts, peer deviations, and cost overruns |
| `payment__` | 03_payments.csv | 28 | Aggregated payment volume, timing, interval std, velocity, and anomalies |
| `progress__` | 04_progress.csv | 25 | Aggregated physical/financial progress, time-aware slopes, gaps, delays |
| `procurement__` | 05_procurement.csv | 22 | Tendering method, bid counts, competition score, bid price similarity |
| `contract__` | 06_contracts.csv | 19 | Work order values, amendments, extensions, capacity strain |
| `contractor__` | 07_contractors.csv | 31 | Contractor historical irregularity rate, value share, cartel/ownership ties |
| `agency__` | 08_agencies.csv | 3 | Implementing agency workload ratio, geographic concentration |
| `geo__` | 09_geography.csv | 8 | District population density, literacy, poverty, infrastructure gap index |
| `constituency__` | 10_constituencies.csv | 1 | Parliamentary house category and institutional context |
| `document__` | 11_documents.csv | 50 | Document completeness, OCR confidence, tampering flags, asset evidence |
| **Total Master Features** | **All Sources** | **239** | **Unified Single-Row Project Feature Store** |

## 3. Comprehensive Feature Dictionary

| Feature Name | Source Table | Source Column | Grain | Transformation | Domain Meaning | ML-Safe? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `project_id` | `01_projects.csv` | `project_id` | project | Direct relational key | Unique relational identifier for project_id | **NO (IDENTIFIER)** |
| `project__work_type` | `01_projects.csv` | `work_type` | project | Left join from 01_projects with project__ prefix | Project attribute work_type | **YES** |
| `project__category` | `01_projects.csv` | `category` | project | Left join from 01_projects with project__ prefix | Project attribute category | **YES** |
| `project__project_category` | `01_projects.csv` | `project_category` | project | Left join from 01_projects with project__ prefix | Project attribute project_category | **YES** |
| `project__project_type` | `01_projects.csv` | `project_type` | project | Left join from 01_projects with project__ prefix | Project attribute project_type | **YES** |
| `project__project_size` | `01_projects.csv` | `project_size` | project | Left join from 01_projects with project__ prefix | Project attribute project_size | **YES** |
| `district_id` | `01_projects.csv` | `district_id` | project | Direct relational key | Unique relational identifier for district_id | **NO (IDENTIFIER)** |
| `state_id` | `01_projects.csv` | `state_id` | project | Direct relational key | Unique relational identifier for state_id | **NO (IDENTIFIER)** |
| `constituency_id` | `01_projects.csv` | `constituency_id` | project | Direct relational key | Unique relational identifier for constituency_id | **NO (IDENTIFIER)** |
| `contractor_id` | `01_projects.csv` | `contractor_id` | project | Direct relational key | Unique relational identifier for contractor_id | **NO (IDENTIFIER)** |
| `agency_id` | `01_projects.csv` | `agency_id` | project | Direct relational key | Unique relational identifier for agency_id | **NO (IDENTIFIER)** |
| `project__recommendation_date` | `01_projects.csv` | `recommendation_date` | project | Left join from 01_projects with project__ prefix | Project attribute recommendation_date | **YES** |
| `project__sanction_date` | `01_projects.csv` | `sanction_date` | project | Left join from 01_projects with project__ prefix | Project attribute sanction_date | **YES** |
| `project__start_date` | `01_projects.csv` | `start_date` | project | Left join from 01_projects with project__ prefix | Project attribute start_date | **YES** |
| `project__expected_completion_date` | `01_projects.csv` | `expected_completion_date` | project | Left join from 01_projects with project__ prefix | Project attribute expected_completion_date | **YES** |
| `project__target_completion_date` | `01_projects.csv` | `target_completion_date` | project | Left join from 01_projects with project__ prefix | Project attribute target_completion_date | **YES** |
| `project__actual_completion_date` | `01_projects.csv` | `actual_completion_date` | project | Left join from 01_projects with project__ prefix | Project attribute actual_completion_date | **TEMPORALLY_SENSITIVE** |
| `project__project_duration` | `01_projects.csv` | `project_duration` | project | Left join from 01_projects with project__ prefix | Project attribute project_duration | **YES** |
| `project__planned_duration_days` | `01_projects.csv` | `planned_duration_days` | project | Left join from 01_projects with project__ prefix | Project attribute planned_duration_days | **YES** |
| `project__actual_duration_days` | `01_projects.csv` | `actual_duration_days` | project | Left join from 01_projects with project__ prefix | Project attribute actual_duration_days | **TEMPORALLY_SENSITIVE** |
| `project__status` | `01_projects.csv` | `status` | project | Left join from 01_projects with project__ prefix | Project attribute status | **YES** |
| `project__project_status` | `01_projects.csv` | `project_status` | project | Left join from 01_projects with project__ prefix | Project attribute project_status | **YES** |
| `project__project_latitude` | `01_projects.csv` | `project_latitude` | project | Left join from 01_projects with project__ prefix | Project attribute project_latitude | **YES** |
| `project__project_longitude` | `01_projects.csv` | `project_longitude` | project | Left join from 01_projects with project__ prefix | Project attribute project_longitude | **YES** |
| `financial__recommended_amount` | `02_financials.csv` | `recommended_amount` | project | 1:1 join on project_id with financial__ prefix | Financial metric recommended_amount | **YES** |
| `financial__estimated_cost` | `02_financials.csv` | `estimated_cost` | project | 1:1 join on project_id with financial__ prefix | Financial metric estimated_cost | **YES** |
| `financial__sanctioned_amount` | `02_financials.csv` | `sanctioned_amount` | project | 1:1 join on project_id with financial__ prefix | Financial metric sanctioned_amount | **YES** |
| `financial__revised_cost` | `02_financials.csv` | `revised_cost` | project | 1:1 join on project_id with financial__ prefix | Financial metric revised_cost | **YES** |
| `financial__tender_amount` | `02_financials.csv` | `tender_amount` | project | 1:1 join on project_id with financial__ prefix | Financial metric tender_amount | **YES** |
| `financial__tender_value` | `02_financials.csv` | `tender_value` | project | 1:1 join on project_id with financial__ prefix | Financial metric tender_value | **YES** |
| `financial__released_amount` | `02_financials.csv` | `released_amount` | project | 1:1 join on project_id with financial__ prefix | Financial metric released_amount | **YES** |
| `financial__fund_released` | `02_financials.csv` | `fund_released` | project | 1:1 join on project_id with financial__ prefix | Financial metric fund_released | **YES** |
| `financial__actual_expenditure` | `02_financials.csv` | `actual_expenditure` | project | 1:1 join on project_id with financial__ prefix | Financial metric actual_expenditure | **TEMPORALLY_SENSITIVE** |
| `financial__unspent_balance` | `02_financials.csv` | `unspent_balance` | project | 1:1 join on project_id with financial__ prefix | Financial metric unspent_balance | **TEMPORALLY_SENSITIVE** |
| `financial__remaining_balance` | `02_financials.csv` | `remaining_balance` | project | 1:1 join on project_id with financial__ prefix | Financial metric remaining_balance | **TEMPORALLY_SENSITIVE** |
| `financial__fund_utilization_ratio` | `02_financials.csv` | `fund_utilization_ratio` | project | 1:1 join on project_id with financial__ prefix | Financial metric fund_utilization_ratio | **YES** |
| `financial__utilization_ratio` | `02_financials.csv` | `utilization_ratio` | project | 1:1 join on project_id with financial__ prefix | Financial metric utilization_ratio | **YES** |
| `financial__release_ratio` | `02_financials.csv` | `release_ratio` | project | 1:1 join on project_id with financial__ prefix | Financial metric release_ratio | **YES** |
| `financial__expenditure_ratio` | `02_financials.csv` | `expenditure_ratio` | project | 1:1 join on project_id with financial__ prefix | Financial metric expenditure_ratio | **YES** |
| `financial__cost_per_unit` | `02_financials.csv` | `cost_per_unit` | project | 1:1 join on project_id with financial__ prefix | Financial metric cost_per_unit | **YES** |
| `financial__peer_median_cost` | `02_financials.csv` | `peer_median_cost` | project | 1:1 join on project_id with financial__ prefix | Financial metric peer_median_cost | **YES** |
| `financial__peer_mean_cost` | `02_financials.csv` | `peer_mean_cost` | project | 1:1 join on project_id with financial__ prefix | Financial metric peer_mean_cost | **YES** |
| `financial__cost_deviation` | `02_financials.csv` | `cost_deviation` | project | 1:1 join on project_id with financial__ prefix | Financial metric cost_deviation | **YES** |
| `financial__tender_estimate_deviation` | `02_financials.csv` | `tender_estimate_deviation` | project | 1:1 join on project_id with financial__ prefix | Financial metric tender_estimate_deviation | **YES** |
| `financial__actual_sanction_deviation` | `02_financials.csv` | `actual_sanction_deviation` | project | 1:1 join on project_id with financial__ prefix | Financial metric actual_sanction_deviation | **YES** |
| `financial__cost_overrun` | `02_financials.csv` | `cost_overrun` | project | 1:1 join on project_id with financial__ prefix | Financial metric cost_overrun | **YES** |
| `financial__cost_per_km` | `02_financials.csv` | `cost_per_km` | project | 1:1 join on project_id with financial__ prefix | Financial metric cost_per_km | **YES** |
| `financial__cost_per_sqft` | `02_financials.csv` | `cost_per_sqft` | project | 1:1 join on project_id with financial__ prefix | Financial metric cost_per_sqft | **YES** |
| `financial__cost_per_beneficiary` | `02_financials.csv` | `cost_per_beneficiary` | project | 1:1 join on project_id with financial__ prefix | Financial metric cost_per_beneficiary | **YES** |
| `financial__sor_deviation` | `02_financials.csv` | `sor_deviation` | project | 1:1 join on project_id with financial__ prefix | Financial metric sor_deviation | **YES** |
| `financial__market_rate_deviation` | `02_financials.csv` | `market_rate_deviation` | project | 1:1 join on project_id with financial__ prefix | Financial metric market_rate_deviation | **YES** |
| `financial__inflation_adjusted_cost_deviation` | `02_financials.csv` | `inflation_adjusted_cost_deviation` | project | 1:1 join on project_id with financial__ prefix | Financial metric inflation_adjusted_cost_deviation | **YES** |
| `payment__payment_count` | `03_payments.csv` | `payment_count` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_count | **YES** |
| `payment__total_paid` | `03_payments.csv` | `total_paid` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature total_paid | **YES** |
| `payment__average_payment` | `03_payments.csv` | `average_payment` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature average_payment | **YES** |
| `payment__median_payment` | `03_payments.csv` | `median_payment` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature median_payment | **YES** |
| `payment__min_payment` | `03_payments.csv` | `min_payment` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature min_payment | **YES** |
| `payment__max_payment` | `03_payments.csv` | `max_payment` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature max_payment | **YES** |
| `payment__payment_amount_std` | `03_payments.csv` | `payment_amount_std` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_amount_std | **YES** |
| `payment__first_payment_date` | `03_payments.csv` | `first_payment_date` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature first_payment_date | **YES** |
| `payment__last_payment_date` | `03_payments.csv` | `last_payment_date` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature last_payment_date | **YES** |
| `payment__payment_span_days` | `03_payments.csv` | `payment_span_days` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_span_days | **YES** |
| `payment__average_days_between_payments` | `03_payments.csv` | `average_days_between_payments` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature average_days_between_payments | **YES** |
| `payment__median_days_between_payments` | `03_payments.csv` | `median_days_between_payments` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature median_days_between_payments | **YES** |
| `payment__payment_interval_std` | `03_payments.csv` | `payment_interval_std` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_interval_std | **YES** |
| `payment__payment_velocity_mean` | `03_payments.csv` | `payment_velocity_mean` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_velocity_mean | **YES** |
| `payment__payment_velocity_max` | `03_payments.csv` | `payment_velocity_max` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_velocity_max | **YES** |
| `payment__payment_frequency_mean` | `03_payments.csv` | `payment_frequency_mean` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_frequency_mean | **YES** |
| `payment__payment_concentration_max` | `03_payments.csv` | `payment_concentration_max` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_concentration_max | **YES** |
| `payment__duplicate_payment_count` | `03_payments.csv` | `duplicate_payment_count` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature duplicate_payment_count | **YES** |
| `payment__duplicate_payment_rate` | `03_payments.csv` | `duplicate_payment_rate` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature duplicate_payment_rate | **YES** |
| `payment__payment_timing_anomaly_count` | `03_payments.csv` | `payment_timing_anomaly_count` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_timing_anomaly_count | **YES** |
| `payment__payment_timing_anomaly_rate` | `03_payments.csv` | `payment_timing_anomaly_rate` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature payment_timing_anomaly_rate | **YES** |
| `payment__unverified_payment_count` | `03_payments.csv` | `unverified_payment_count` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature unverified_payment_count | **YES** |
| `payment__unverified_payment_rate` | `03_payments.csv` | `unverified_payment_rate` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature unverified_payment_rate | **YES** |
| `payment__round_number_payment_count` | `03_payments.csv` | `round_number_payment_count` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature round_number_payment_count | **YES** |
| `payment__round_number_payment_rate` | `03_payments.csv` | `round_number_payment_rate` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature round_number_payment_rate | **YES** |
| `payment__final_installment_count` | `03_payments.csv` | `final_installment_count` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature final_installment_count | **YES** |
| `payment__final_installment_amount` | `03_payments.csv` | `final_installment_amount` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature final_installment_amount | **YES** |
| `payment__final_installment_share` | `03_payments.csv` | `final_installment_share` | project | Groupby project_id aggregation over payment transactions | Aggregated payment feature final_installment_share | **YES** |
| `progress__progress_observation_count` | `04_progress.csv` | `progress_observation_count` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature progress_observation_count | **YES** |
| `progress__latest_physical_progress` | `04_progress.csv` | `latest_physical_progress` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature latest_physical_progress | **YES** |
| `progress__latest_financial_progress` | `04_progress.csv` | `latest_financial_progress` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature latest_financial_progress | **YES** |
| `progress__latest_planned_progress` | `04_progress.csv` | `latest_planned_progress` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature latest_planned_progress | **YES** |
| `progress__latest_completion_percentage` | `04_progress.csv` | `latest_completion_percentage` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature latest_completion_percentage | **TEMPORALLY_SENSITIVE** |
| `progress__latest_progress_mismatch` | `04_progress.csv` | `latest_progress_mismatch` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature latest_progress_mismatch | **YES** |
| `progress__latest_progress_gap` | `04_progress.csv` | `latest_progress_gap` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature latest_progress_gap | **YES** |
| `progress__financial_minus_physical_progress` | `04_progress.csv` | `financial_minus_physical_progress` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature financial_minus_physical_progress | **YES** |
| `progress__actual_vs_planned_progress` | `04_progress.csv` | `actual_vs_planned_progress` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature actual_vs_planned_progress | **YES** |
| `progress__physical_progress_slope` | `04_progress.csv` | `physical_progress_slope` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature physical_progress_slope | **YES** |
| `progress__financial_progress_slope` | `04_progress.csv` | `financial_progress_slope` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature financial_progress_slope | **YES** |
| `progress__planned_progress_slope` | `04_progress.csv` | `planned_progress_slope` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature planned_progress_slope | **YES** |
| `progress__progress_gap_slope` | `04_progress.csv` | `progress_gap_slope` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature progress_gap_slope | **YES** |
| `progress__progress_velocity_latest` | `04_progress.csv` | `progress_velocity_latest` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature progress_velocity_latest | **YES** |
| `progress__progress_acceleration_latest` | `04_progress.csv` | `progress_acceleration_latest` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature progress_acceleration_latest | **YES** |
| `progress__latest_delay_days` | `04_progress.csv` | `latest_delay_days` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature latest_delay_days | **YES** |
| `progress__max_delay_days` | `04_progress.csv` | `max_delay_days` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature max_delay_days | **YES** |
| `progress__extension_count` | `04_progress.csv` | `extension_count` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature extension_count | **YES** |
| `progress__planned_duration_days` | `04_progress.csv` | `planned_duration_days` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature planned_duration_days | **YES** |
| `progress__actual_duration_days` | `04_progress.csv` | `actual_duration_days` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature actual_duration_days | **YES** |
| `progress__duration_overrun_days` | `04_progress.csv` | `duration_overrun_days` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature duration_overrun_days | **YES** |
| `progress__duration_overrun_ratio` | `04_progress.csv` | `duration_overrun_ratio` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature duration_overrun_ratio | **YES** |
| `progress__geotag_available_rate` | `04_progress.csv` | `geotag_available_rate` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature geotag_available_rate | **YES** |
| `progress__geotag_consistency_rate` | `04_progress.csv` | `geotag_consistency_rate` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature geotag_consistency_rate | **YES** |
| `progress__measurement_book_verified_rate` | `04_progress.csv` | `measurement_book_verified_rate` | project | Time-aware chronological aggregation over progress records | Aggregated progress feature measurement_book_verified_rate | **YES** |
| `procurement__tender_exists` | `05_procurement.csv` | `tender_exists` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature tender_exists | **YES** |
| `procurement__procurement_method` | `05_procurement.csv` | `procurement_method` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature procurement_method | **YES** |
| `procurement__tender_publication_date` | `05_procurement.csv` | `tender_publication_date` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature tender_publication_date | **YES** |
| `procurement__tender_duration` | `05_procurement.csv` | `tender_duration` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature tender_duration | **YES** |
| `procurement__bid_count` | `05_procurement.csv` | `bid_count` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature bid_count | **YES** |
| `procurement__qualified_bid_count` | `05_procurement.csv` | `qualified_bid_count` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature qualified_bid_count | **YES** |
| `procurement__single_bid_flag` | `05_procurement.csv` | `single_bid_flag` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature single_bid_flag | **YES** |
| `procurement__bid_competition_score` | `05_procurement.csv` | `bid_competition_score` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature bid_competition_score | **YES** |
| `procurement__tender_type` | `05_procurement.csv` | `tender_type` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature tender_type | **YES** |
| `procurement__winning_bid` | `05_procurement.csv` | `winning_bid` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature winning_bid | **YES** |
| `procurement__winning_bid_amount` | `05_procurement.csv` | `winning_bid_amount` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature winning_bid_amount | **YES** |
| `procurement__winning_bid_deviation` | `05_procurement.csv` | `winning_bid_deviation` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature winning_bid_deviation | **YES** |
| `procurement__winning_bid_vs_lowest_bid` | `05_procurement.csv` | `winning_bid_vs_lowest_bid` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature winning_bid_vs_lowest_bid | **YES** |
| `procurement__bid_price_similarity` | `05_procurement.csv` | `bid_price_similarity` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature bid_price_similarity | **YES** |
| `procurement__bidder_disqualification_rate` | `05_procurement.csv` | `bidder_disqualification_rate` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature bidder_disqualification_rate | **YES** |
| `procurement__re_tender_count` | `05_procurement.csv` | `re_tender_count` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature re_tender_count | **YES** |
| `procurement__tender_cancellation_count` | `05_procurement.csv` | `tender_cancellation_count` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature tender_cancellation_count | **YES** |
| `procurement__tender_bypass_flag` | `05_procurement.csv` | `tender_bypass_flag` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature tender_bypass_flag | **YES** |
| `procurement__repeated_winner_flag` | `05_procurement.csv` | `repeated_winner_flag` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature repeated_winner_flag | **YES** |
| `procurement__bid_rotation_score` | `05_procurement.csv` | `bid_rotation_score` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature bid_rotation_score | **YES** |
| `procurement__repeated_loser_score` | `05_procurement.csv` | `repeated_loser_score` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature repeated_loser_score | **YES** |
| `procurement__procurement_compliance_flag` | `05_procurement.csv` | `procurement_compliance_flag` | project | 1:1 join on project_id with procurement__ prefix | Tender/procurement feature procurement_compliance_flag | **YES** |
| `contract__work_order_amount` | `06_contracts.csv` | `work_order_amount` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature work_order_amount | **YES** |
| `contract__original_contract_value` | `06_contracts.csv` | `original_contract_value` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature original_contract_value | **YES** |
| `contract__final_contract_value` | `06_contracts.csv` | `final_contract_value` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature final_contract_value | **TEMPORALLY_SENSITIVE** |
| `contract__contract_value_change` | `06_contracts.csv` | `contract_value_change` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature contract_value_change | **YES** |
| `contract__contract_amendment_count` | `06_contracts.csv` | `contract_amendment_count` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature contract_amendment_count | **YES** |
| `contract__amendment_value` | `06_contracts.csv` | `amendment_value` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature amendment_value | **YES** |
| `contract__extension_count` | `06_contracts.csv` | `extension_count` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature extension_count | **YES** |
| `contract__extension_duration` | `06_contracts.csv` | `extension_duration` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature extension_duration | **YES** |
| `contract__award_date` | `06_contracts.csv` | `award_date` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature award_date | **YES** |
| `contract__original_completion_date` | `06_contracts.csv` | `original_completion_date` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature original_completion_date | **YES** |
| `contract__revised_completion_date` | `06_contracts.csv` | `revised_completion_date` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature revised_completion_date | **YES** |
| `contract__contract_delay_days` | `06_contracts.csv` | `contract_delay_days` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature contract_delay_days | **YES** |
| `contract__contractor_capacity` | `06_contracts.csv` | `contractor_capacity` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature contractor_capacity | **YES** |
| `contract__contract_value_to_capacity` | `06_contracts.csv` | `contract_value_to_capacity` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature contract_value_to_capacity | **YES** |
| `contract__external_service_provider_flag` | `06_contracts.csv` | `external_service_provider_flag` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature external_service_provider_flag | **YES** |
| `contract__subcontractor_count` | `06_contracts.csv` | `subcontractor_count` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature subcontractor_count | **YES** |
| `contract__subcontractor_value_share` | `06_contracts.csv` | `subcontractor_value_share` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature subcontractor_value_share | **YES** |
| `contract__end_period_expenditure_ratio` | `06_contracts.csv` | `end_period_expenditure_ratio` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature end_period_expenditure_ratio | **TEMPORALLY_SENSITIVE** |
| `contract__performance_guarantee_submitted` | `06_contracts.csv` | `performance_guarantee_submitted` | project | 1:1 join on project_id with contract__ prefix | Contract lifecycle feature performance_guarantee_submitted | **YES** |
| `contractor__registration_category` | `07_contractors.csv` | `registration_category` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute registration_category | **YES** |
| `contractor__financial_capacity` | `07_contractors.csv` | `financial_capacity` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute financial_capacity | **YES** |
| `contractor__base_quality_score` | `07_contractors.csv` | `base_quality_score` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute base_quality_score | **YES** |
| `contractor__past_irregularity_rate` | `07_contractors.csv` | `past_irregularity_rate` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute past_irregularity_rate | **YES** |
| `contractor__contractor_past_irregularity_rate` | `07_contractors.csv` | `contractor_past_irregularity_rate` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_past_irregularity_rate | **YES** |
| `contractor__contractor_capacity_strain` | `07_contractors.csv` | `contractor_capacity_strain` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_capacity_strain | **YES** |
| `contractor__contractor_project_count` | `07_contractors.csv` | `contractor_project_count` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_project_count | **YES** |
| `contractor__contractor_total_contract_value` | `07_contractors.csv` | `contractor_total_contract_value` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_total_contract_value | **YES** |
| `contractor__contractor_average_contract_value` | `07_contractors.csv` | `contractor_average_contract_value` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_average_contract_value | **YES** |
| `contractor__contractor_max_contract_value` | `07_contractors.csv` | `contractor_max_contract_value` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_max_contract_value | **YES** |
| `contractor__contractor_project_share` | `07_contractors.csv` | `contractor_project_share` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_project_share | **YES** |
| `contractor__contractor_value_share` | `07_contractors.csv` | `contractor_value_share` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_value_share | **YES** |
| `contractor__contractor_district_concentration` | `07_contractors.csv` | `contractor_district_concentration` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_district_concentration | **YES** |
| `contractor__contractor_agency_concentration` | `07_contractors.csv` | `contractor_agency_concentration` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_agency_concentration | **YES** |
| `contractor__contractor_constituency_concentration` | `07_contractors.csv` | `contractor_constituency_concentration` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_constituency_concentration | **YES** |
| `contractor__contractor_delay_rate` | `07_contractors.csv` | `contractor_delay_rate` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_delay_rate | **YES** |
| `contractor__contractor_completion_rate` | `07_contractors.csv` | `contractor_completion_rate` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_completion_rate | **YES** |
| `contractor__contractor_cancellation_rate` | `07_contractors.csv` | `contractor_cancellation_rate` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_cancellation_rate | **YES** |
| `contractor__contractor_previous_irregularities` | `07_contractors.csv` | `contractor_previous_irregularities` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_previous_irregularities | **YES** |
| `contractor__contractor_financial_capacity` | `07_contractors.csv` | `contractor_financial_capacity` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_financial_capacity | **YES** |
| `contractor__contractor_value_to_capacity` | `07_contractors.csv` | `contractor_value_to_capacity` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_value_to_capacity | **YES** |
| `contractor__repeated_agency_contractor_pair` | `07_contractors.csv` | `repeated_agency_contractor_pair` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute repeated_agency_contractor_pair | **YES** |
| `contractor__shared_ownership` | `07_contractors.csv` | `shared_ownership` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute shared_ownership | **YES** |
| `contractor__shared_directors` | `07_contractors.csv` | `shared_directors` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute shared_directors | **YES** |
| `contractor__shared_shareholders` | `07_contractors.csv` | `shared_shareholders` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute shared_shareholders | **YES** |
| `contractor__shared_address` | `07_contractors.csv` | `shared_address` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute shared_address | **YES** |
| `contractor__beneficial_owner_overlap` | `07_contractors.csv` | `beneficial_owner_overlap` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute beneficial_owner_overlap | **YES** |
| `contractor__contractor_financial_health` | `07_contractors.csv` | `contractor_financial_health` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute contractor_financial_health | **YES** |
| `contractor__company_ownership_change` | `07_contractors.csv` | `company_ownership_change` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute company_ownership_change | **YES** |
| `contractor__director_change` | `07_contractors.csv` | `director_change` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute director_change | **YES** |
| `contractor__address_change` | `07_contractors.csv` | `address_change` | contractor | N:1 join on contractor_id with contractor__ prefix (identity dropped) | Contractor behavioral attribute address_change | **YES** |
| `agency__agency_type` | `08_agencies.csv` | `agency_type` | agency | N:1 join on agency_id with agency__ prefix (identity dropped) | Implementing agency attribute agency_type | **YES** |
| `agency__agency_workload_ratio` | `08_agencies.csv` | `agency_workload_ratio` | agency | N:1 join on agency_id with agency__ prefix (identity dropped) | Implementing agency attribute agency_workload_ratio | **YES** |
| `agency__agency_geographic_concentration` | `08_agencies.csv` | `agency_geographic_concentration` | agency | N:1 join on agency_id with agency__ prefix (identity dropped) | Implementing agency attribute agency_geographic_concentration | **YES** |
| `geo__district_latitude` | `09_geography.csv` | `district_latitude` | district | N:1 join on district_id with geo__ prefix (text names dropped) | District socio-economic context district_latitude | **YES** |
| `geo__district_longitude` | `09_geography.csv` | `district_longitude` | district | N:1 join on district_id with geo__ prefix (text names dropped) | District socio-economic context district_longitude | **YES** |
| `geo__population` | `09_geography.csv` | `population` | district | N:1 join on district_id with geo__ prefix (text names dropped) | District socio-economic context population | **YES** |
| `geo__population_density` | `09_geography.csv` | `population_density` | district | N:1 join on district_id with geo__ prefix (text names dropped) | District socio-economic context population_density | **YES** |
| `geo__literacy_rate` | `09_geography.csv` | `literacy_rate` | district | N:1 join on district_id with geo__ prefix (text names dropped) | District socio-economic context literacy_rate | **YES** |
| `geo__poverty_rate` | `09_geography.csv` | `poverty_rate` | district | N:1 join on district_id with geo__ prefix (text names dropped) | District socio-economic context poverty_rate | **YES** |
| `geo__infrastructure_gap_index` | `09_geography.csv` | `infrastructure_gap_index` | district | N:1 join on district_id with geo__ prefix (text names dropped) | District socio-economic context infrastructure_gap_index | **YES** |
| `geo__geographic_cluster_id` | `01_projects.csv` | `geo__geographic_cluster_id` | project | Direct relational key | Unique relational identifier for geo__geographic_cluster_id | **NO (IDENTIFIER)** |
| `constituency__mp_house` | `10_constituencies.csv` | `mp_house` | constituency | N:1 join on constituency_id with constituency__ prefix (MP name dropped) | Constituency institutional context mp_house | **YES** |
| `document__administrative_sanction` | `11_documents.csv` | `administrative_sanction` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature administrative_sanction | **YES** |
| `document__technical_sanction` | `11_documents.csv` | `technical_sanction` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature technical_sanction | **YES** |
| `document__dpr` | `11_documents.csv` | `dpr` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature dpr | **YES** |
| `document__work_order` | `11_documents.csv` | `work_order` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature work_order | **YES** |
| `document__measurement_book` | `11_documents.csv` | `measurement_book` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature measurement_book | **YES** |
| `document__utilization_certificate` | `11_documents.csv` | `utilization_certificate` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature utilization_certificate | **YES** |
| `document__completion_certificate` | `11_documents.csv` | `completion_certificate` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature completion_certificate | **TEMPORALLY_SENSITIVE** |
| `document__geo_tagged_photos` | `11_documents.csv` | `geo_tagged_photos` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature geo_tagged_photos | **YES** |
| `document__photo_count` | `11_documents.csv` | `photo_count` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature photo_count | **YES** |
| `document__required_document_count` | `11_documents.csv` | `required_document_count` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature required_document_count | **YES** |
| `document__available_document_count` | `11_documents.csv` | `available_document_count` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature available_document_count | **YES** |
| `document__missing_document_ratio` | `11_documents.csv` | `missing_document_ratio` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature missing_document_ratio | **YES** |
| `document__document_exists_flag` | `11_documents.csv` | `document_exists_flag` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_exists_flag | **YES** |
| `document__document_type` | `11_documents.csv` | `document_type` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_type | **YES** |
| `document__document_date` | `11_documents.csv` | `document_date` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_date | **YES** |
| `document__document_amount` | `11_documents.csv` | `document_amount` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_amount | **YES** |
| `document__document_entity` | `11_documents.csv` | `document_entity` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_entity | **YES** |
| `document__document_project_reference` | `11_documents.csv` | `document_project_reference` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_project_reference | **YES** |
| `document__document_database_match_score` | `11_documents.csv` | `document_database_match_score` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_database_match_score | **YES** |
| `document__document_amount_mismatch` | `11_documents.csv` | `document_amount_mismatch` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_amount_mismatch | **YES** |
| `document__document_date_mismatch` | `11_documents.csv` | `document_date_mismatch` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_date_mismatch | **YES** |
| `document__document_entity_mismatch` | `11_documents.csv` | `document_entity_mismatch` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_entity_mismatch | **YES** |
| `document__document_duplicate_hash` | `11_documents.csv` | `document_duplicate_hash` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_duplicate_hash | **YES** |
| `document__document_version_count` | `11_documents.csv` | `document_version_count` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_version_count | **YES** |
| `document__document_tampering_flag` | `11_documents.csv` | `document_tampering_flag` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature document_tampering_flag | **YES** |
| `document__ocr_confidence_score` | `11_documents.csv` | `ocr_confidence_score` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature ocr_confidence_score | **YES** |
| `document__data_completeness_score` | `11_documents.csv` | `data_completeness_score` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature data_completeness_score | **YES** |
| `document__missing_field_count` | `11_documents.csv` | `missing_field_count` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature missing_field_count | **YES** |
| `document__missing_critical_field_flag` | `11_documents.csv` | `missing_critical_field_flag` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature missing_critical_field_flag | **YES** |
| `document__data_validation_status` | `11_documents.csv` | `data_validation_status` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature data_validation_status | **YES** |
| `document__data_source` | `11_documents.csv` | `data_source` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature data_source | **YES** |
| `document__source_system` | `11_documents.csv` | `source_system` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature source_system | **YES** |
| `document__last_updated_timestamp` | `11_documents.csv` | `last_updated_timestamp` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature last_updated_timestamp | **YES** |
| `document__record_update_count` | `11_documents.csv` | `record_update_count` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature record_update_count | **YES** |
| `document__late_data_submission_flag` | `11_documents.csv` | `late_data_submission_flag` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature late_data_submission_flag | **YES** |
| `document__inconsistent_record_flag` | `11_documents.csv` | `inconsistent_record_flag` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature inconsistent_record_flag | **YES** |
| `document__cross_source_mismatch_flag` | `11_documents.csv` | `cross_source_mismatch_flag` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature cross_source_mismatch_flag | **YES** |
| `document__asset_created_flag` | `11_documents.csv` | `asset_created_flag` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_created_flag | **YES** |
| `document__asset_register_entry_flag` | `11_documents.csv` | `asset_register_entry_flag` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_register_entry_flag | **YES** |
| `document__asset_location` | `11_documents.csv` | `asset_location` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_location | **YES** |
| `document__asset_latitude` | `11_documents.csv` | `asset_latitude` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_latitude | **YES** |
| `document__asset_longitude` | `11_documents.csv` | `asset_longitude` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_longitude | **YES** |
| `document__asset_photo_available` | `11_documents.csv` | `asset_photo_available` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_photo_available | **YES** |
| `document__asset_photo_date` | `11_documents.csv` | `asset_photo_date` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_photo_date | **YES** |
| `document__asset_photo_count` | `11_documents.csv` | `asset_photo_count` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_photo_count | **YES** |
| `document__asset_status` | `11_documents.csv` | `asset_status` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_status | **YES** |
| `document__asset_verification_status` | `11_documents.csv` | `asset_verification_status` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_verification_status | **TEMPORALLY_SENSITIVE** |
| `document__asset_project_link_match` | `11_documents.csv` | `asset_project_link_match` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_project_link_match | **YES** |
| `document__asset_geo_consistency` | `11_documents.csv` | `asset_geo_consistency` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_geo_consistency | **YES** |
| `document__asset_completion_evidence_score` | `11_documents.csv` | `asset_completion_evidence_score` | project | 1:1 join on project_id with document__ prefix | Document & evidence integrity feature asset_completion_evidence_score | **YES** |

## 4. Quarantined Supervised Target Store (`project_labels.csv`)

| Target Column | Source Table | Grain | Meaning | Role in ML Lifecycle |
| :--- | :--- | :--- | :--- | :--- |
| `project_id` | `12_labels.csv` | project | Supervised ground truth attribute project_id | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `fraud_label` | `12_labels.csv` | project | Supervised ground truth attribute fraud_label | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `is_fraud` | `12_labels.csv` | project | Supervised ground truth attribute is_fraud | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `is_anomalous` | `12_labels.csv` | project | Supervised ground truth attribute is_anomalous | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `is_hard_negative` | `12_labels.csv` | project | Supervised ground truth attribute is_hard_negative | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `risk_level` | `12_labels.csv` | project | Supervised ground truth attribute risk_level | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `scenario_type` | `12_labels.csv` | project | Supervised ground truth attribute scenario_type | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `scenario_name` | `12_labels.csv` | project | Supervised ground truth attribute scenario_name | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `overall_risk_score` | `12_labels.csv` | project | Supervised ground truth attribute overall_risk_score | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |
| `investigation_priority` | `12_labels.csv` | project | Supervised ground truth attribute investigation_priority | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |

## 5. Non-Predictive Entity Identity Exclusions

The following entity identity string columns exist in raw source tables but have been **intentionally excluded** from `project_master_features.csv`:

- `contractor_name` (from `07_contractors.csv`)

- `agency_name` (from `08_agencies.csv`)

- `mp_name` (from `10_constituencies.csv`)

- `district_name` & `state_name` (from `09_geography.csv` and `01_projects.csv`)

- `constituency_name` (from `10_constituencies.csv` and `01_projects.csv`)

- `work_name` & `title` (from `01_projects.csv`)
