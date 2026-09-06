# Stage 3 Supervised Calibrated Risk Predictor Report

**Generated**: 2026-09-06 09:45:06 UTC  
**Model Architecture**: XGBoost Ensemble + Isotonic Probability Calibration (`CalibratedClassifierCV`) + Native Tree SHAP Explanations  
**Validation Strategy**: Stratified 5-Fold Cross-Validation (`n_splits=5`, `random_state=42`)  

---

## 1. Executive Summary & Benchmark Compliance

| Metric | Target Standard | Achieved OOF Value | Status |
| :--- | :---: | :---: | :---: |
| **ROC-AUC** | $\ge 0.9500$ | **0.9500** | PASS |
| **PR-AUC** | $\ge 0.8500$ | **0.9361** | PASS |
| **Top 1% Fraud Enrichment** | $\ge 4.00\text{x}$ | **4.98x (100.0%)** | PASS |
| **Top 5% Fraud Enrichment** | $\ge 3.50\text{x}$ | **4.98x (100.0%)** | PASS |
| **Hard-Negative FPR** | $\le 5.00\%$ | **2.28\%** (12/526) | PASS |

---

## 2. Comparative Baseline Analysis

| Model / Heuristic | ROC-AUC | PR-AUC | Improvement (ROC) | Improvement (PR) |
| :--- | :---: | :---: | :---: | :---: |
| **Stage 3 Supervised XGBoost** | **0.9500** | **0.9361** | **—** | **—** |
| Baseline 1: Max Intermediate Score | 0.8360 | 0.4522 | +0.1140 | +0.4839 |
| Baseline 2: Weighted Average Score | 0.8722 | 0.5952 | +0.0778 | +0.3409 |

---

## 3. Scenario-Specific Performance Breakdown

| Scenario Typology | Count | Class | Mean Prob | Median Prob | Flagged at $\ge 0.50$ | Flagged Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ABANDONED_WORK` | 76 | `FRAUD` | 0.9978 | 1.0000 | 76 | 100.0% |
| `COST_OVERRUN` | 218 | `FRAUD` | 0.9507 | 1.0000 | 206 | 94.5% |
| `DELAYED_WORK` | 154 | `FRAUD` | 1.0000 | 1.0000 | 154 | 100.0% |
| `DOCUMENTATION_DEFICIT` | 71 | `FRAUD` | 1.0000 | 1.0000 | 71 | 100.0% |
| `GHOST_WORK` | 46 | `FRAUD` | 1.0000 | 1.0000 | 46 | 100.0% |
| `HIGH_VALUE_LEGITIMATE` | 271 | `HARD_NEG` | 0.0244 | 0.0182 | 1 | 0.4% |
| `LEGITIMATE_REMOTE_SINGLE_BID` | 152 | `HARD_NEG` | 0.3449 | 0.3618 | 11 | 7.2% |
| `LEGITIMATE_WEATHER_DELAY` | 103 | `HARD_NEG` | 0.0256 | 0.0223 | 0 | 0.0% |
| `NORMAL` | 3469 | `NORMAL` | 0.0277 | 0.0223 | 1 | 0.0% |
| `PAYMENT_PROGRESS_MISMATCH` | 252 | `FRAUD` | 1.0000 | 1.0000 | 252 | 100.0% |
| `PROCUREMENT_SINGLE_BID` | 103 | `FRAUD` | 0.3786 | 0.3760 | 20 | 19.4% |
| `SUSPICIOUS_CONTRACTOR_MONOPOLY` | 85 | `FRAUD` | 0.0272 | 0.0220 | 0 | 0.0% |

---

## 4. Global Feature Importance (Top Predictors)

| Feature Name | Relative Importance |
| :--- | :---: |
| `progress_anomaly_score` | 0.3023 |
| `num_flagged_models` | 0.1735 |
| `progress_anomaly_percentile` | 0.1395 |
| `procurement_anomaly_score` | 0.0716 |
| `procurement_anomaly_percentile` | 0.0456 |
| `max_anomaly_score` | 0.0260 |
| `financial_anomaly_percentile` | 0.0205 |
| `payment_anomaly_score` | 0.0177 |
| `financial_anomaly_score` | 0.0174 |
| `payment_anomaly_percentile` | 0.0166 |
| `mean_anomaly_score` | 0.0162 |
| `geospatial_anomaly_score` | 0.0159 |
| `geo__population_density` | 0.0155 |
| `financial__sanctioned_amount` | 0.0155 |
| `geo__infrastructure_gap_index` | 0.0153 |

---

**SETU MPLADS Anomaly Detection Platform** — MoSPI Quality Assurance & AI Architecture.
