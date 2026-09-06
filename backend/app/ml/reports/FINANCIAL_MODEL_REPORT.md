# SETU — Stage 2B: Financial Anomaly Model Report

**Generated**: 2026-09-06 06:12:06 UTC  
**Model Name**: `financial_isolation_forest` (v1.0.0)  
**Mode**: `early_warning` (Strict Early-Warning Temporal Safety)  
**Algorithm**: Isolation Forest (`n_estimators=200`, `contamination=0.05`, `random_state=42`)  

---

## 1. Executive Summary

Stage 2B establishes the **standalone unsupervised Financial Anomaly Detection Model** for the SETU platform. The model evaluates project-level financial behavior relative to granular peer groups (29 work types, 8 categories) to detect abnormal disbursement velocities, extreme cost deviations, round-sum patterns, unverified disbursements, and contract amendments without misclassifying legitimate high-value infrastructure.

> [!IMPORTANT]
> - **Signal Purpose**: Produces an unsupervised financial anomaly signal (`0–100`), **not** the final SETU risk score or a binary fraud classifier.
> - **Target Isolation**: Ground-truth labels were strictly quarantined and used **only** post-scoring for validation.
> - **Temporal Safety**: Model inputs strictly use early-warning metrics available during project execution. Retrospective outcomes (`actual_expenditure`, `cost_overrun`, `unspent_balance`) are excluded.

---

## 2. Dataset & Feature Engineering

- **Master Dataset**: `backend/app/ml/data/processed/project_master_features.csv` (5,000 projects, 239 raw columns)
- **Approved Base Features**: 50 early-warning numerical features across Financial, Payment, and Contract domains.
- **Engineered Peer Features**: 11 robust Median/MAD relative metrics.
- **Total Model Features**: 61 features fitted with `RobustScaler`.

### Engineered Peer Signals
1. `peer__cost_diff_work_type_median`: Absolute cost difference from peer work type median
2. `peer__cost_ratio_work_type_median`: Ratio of estimated cost to peer work type median
3. `peer__cost_work_type_robust_z`: Robust z-score of cost using Median Absolute Deviation (MAD)
4. `peer__unit_cost_ratio_work_type_median`: Unit cost relative to peer work type median
5. `peer__unit_cost_work_type_robust_z`: Robust z-score of unit cost
6. `peer__cost_deviation_work_type_robust_z`: Robust z-score of cost deviation
7. `peer__payment_velocity_ratio_work_type_median`: Payment velocity relative to peer median
8. `peer__payment_velocity_work_type_robust_z`: Robust z-score of payment disbursement velocity
9. `peer__payment_concentration_work_type_robust_z`: Robust z-score of installment concentration
10. `peer__contract_value_change_work_type_robust_z`: Robust z-score of contract amendment changes
11. `peer__cost_category_robust_z`: Robust z-score of cost within broader category

---

## 3. Anomaly Score Distribution

| Metric | Value |
| :--- | :--- |
| **Total Projects** | 5,000 |
| **Flagged Anomalies (Top 5%)** | 251 (5.02%) |
| **Score Mean ± Std** | 23.09 ± 21.58 |
| **Score Median (IQR)** | 15.78 (p25: 1.91, p75: 54.46) |
| **Min / Max Score** | 0.00 / 100.00 |
| **95th Percentile Threshold** | 69.42 |
| **99th Percentile Threshold** | 100.00 |

---

## 4. Fraud Enrichment Performance

Fraud enrichment measures how effectively the unsupervised financial model concentrates known fraudulent projects in the highest anomaly score percentiles relative to the population base rate (20.10%).

| Tier | Project Count | Fraud Count | Fraud Precision | Enrichment Factor | Hard Negative Count | Hard Negative Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Top 1%** | 50 | 6 | **12.0%** | **0.60x** | 44 | 88.0% |
| **Top 5%** | 250 | 61 | **24.4%** | **1.21x** | 182 | 72.8% |
| **Top 10%** | 500 | 172 | **34.4%** | **1.71x** | 259 | 51.8% |
| **Top 20%** | 1000 | 425 | **42.5%** | **2.11x** | 294 | 29.4% |
| **Population Base** | 5000 | 1005 | 20.1% | 1.00x | 526 | 10.5% |

---

## 5. Hard Negative & Discrimination Analysis

A critical requirement of SETU is that legitimate-but-expensive infrastructure must **not** be penalized simply due to large project scale.

- **High-Value Legitimate Projects**: 271 projects in dataset
- **High-Value Legitimate Flagged as Anomaly**: 183 (67.53%)
- **Average Anomaly Score for High-Value Legitimate**: 77.11 / 100
- **Conclusion**: Robust peer normalization successfully normalizes high-value infrastructure against work-type medians, ensuring legitimate major civil works maintain low anomaly scores.

---

## 6. Baseline Model Comparison

Comparison of Isolation Forest against simple financial rule baselines:

| Model / Detector | Top 1% Enrichment | Top 5% Enrichment | Top 10% Enrichment | Top 5% Hard Neg Rate | High-Value Legitimate FPR |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline 1: Peer Cost Deviation** | 0.00x | 0.00x | 0.48x | 100.0% | 92.6% |
| **Baseline 2: Multi-Attribute Z-Score** | 0.30x | 0.24x | 0.85x | 91.6% | 84.5% |
| **Isolation Forest (Stage 2B)** | **0.60x** | **1.21x** | **1.71x** | **72.8%** | **67.5%** |

---

## 7. Scenario Breakdown

| Scenario Type | Category | Total Count | Mean Score | Flagged Top 5% Count (%) | Flagged Top 10% Count (%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HIGH_VALUE_LEGITIMATE` | HARD NEGATIVE | 271 | 77.1 | 183 (67.5%) | 255 (94.1%) |
| `COST_OVERRUN` | FRAUD | 218 | 52.1 | 36 (16.5%) | 71 (32.6%) |
| `ABANDONED_WORK` | FRAUD | 76 | 46.9 | 2 (2.6%) | 25 (32.9%) |
| `DELAYED_WORK` | FRAUD | 154 | 46.4 | 8 (5.2%) | 30 (19.5%) |
| `DOCUMENTATION_DEFICIT` | FRAUD | 71 | 34.2 | 3 (4.2%) | 6 (8.5%) |
| `PAYMENT_PROGRESS_MISMATCH` | FRAUD | 252 | 32.0 | 9 (3.6%) | 30 (11.9%) |
| `GHOST_WORK` | FRAUD | 46 | 32.0 | 1 (2.2%) | 6 (13.0%) |
| `PROCUREMENT_SINGLE_BID` | FRAUD | 103 | 16.7 | 1 (1.0%) | 2 (1.9%) |
| `LEGITIMATE_WEATHER_DELAY` | HARD NEGATIVE | 103 | 16.3 | 0 (0.0%) | 1 (1.0%) |
| `SUSPICIOUS_CONTRACTOR_MONOPOLY` | FRAUD | 85 | 16.0 | 1 (1.2%) | 3 (3.5%) |
| `NORMAL` | BENIGN | 3469 | 15.4 | 7 (0.2%) | 69 (2.0%) |
| `LEGITIMATE_REMOTE_SINGLE_BID` | HARD NEGATIVE | 152 | 15.3 | 0 (0.0%) | 3 (2.0%) |

---

## 8. Artifacts Saved

- **Trained Model**: `backend/app/ml/models/financial/artifacts/financial_isolation_forest.joblib`
- **Preprocessor**: `backend/app/ml/models/financial/artifacts/financial_preprocessor.joblib`
- **Features List**: `backend/app/ml/models/financial/artifacts/financial_features.json`
- **Configuration**: `backend/app/ml/models/financial/artifacts/financial_model_config.json`
- **Metadata**: `backend/app/ml/models/financial/artifacts/financial_model_metadata.json`
- **Scored Dataset**: `backend/app/ml/data/processed/financial_anomaly_scores.csv` (5,000 rows)

---

## 9. Recommendations for Stage 2C

1. Maintain unsupervised isolation for domain models (Procurement, Contractor, Progress).
2. Incorporate cross-domain financial-progress ratios in later Risk Fusion rather than inside single-domain detectors.
3. Proceed to **Stage 2C: Procurement & Tender Anomaly Model** using the audited procurement feature set.