# SETU Stage 2G — Progress vs. Execution Trajectory Model Evaluation Report

> **Model**: `progress_isolation_forest` (v1.0.0)  
> **Evaluation Mode**: `early_warning`  
> **Training Date**: `2026-09-06T09:09:40.201769+00:00`  
> **Projects Evaluated**: 5000  

---

## 1. Score Distribution Summary

| Metric | Value |
| :--- | :--- |
| **Total Projects** | 5000 |
| **Flagged Anomalies (Top 5%)** | 251 (5.0%) |
| **Mean Anomaly Score** | 31.28 |
| **Median Anomaly Score** | 26.55 |
| **Standard Deviation** | 22.43 |
| **Percentile 50 (p50)** | 26.55 |
| **Percentile 90 (p90)** | 69.34 |
| **Percentile 95 (p95)** | 78.29 |
| **Percentile 99 (p99)** | 89.45 |

---

## 2. Fraud Enrichment Benchmarks (Base Fraud Rate: 20.1%)

| Tier Cutoff | Projects | Fraud Count | Fraud Rate | Enrichment Factor | Hard Negatives | Hard Neg Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top 1%** | 50 | 50 | 100.00% | **4.98x** | 0 | 0.00% |
| **Top 5%** | 250 | 250 | 100.00% | **4.98x** | 0 | 0.00% |
| **Top 10%** | 500 | 500 | 100.00% | **4.98x** | 0 | 0.00% |
| **Top 20%** | 1000 | 824 | 82.40% | **4.1x** | 19 | 1.90% |

---

## 3. Baseline Model Comparison Matrix

| Model / Detector | Top 1% Fraud Rate | Top 5% Fraud Rate | Top 10% Fraud Rate | Top 10% Enrichment |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Divergence Rule** | 100.0% | 100.0% | 100.0% | 4.98x |
| **Baseline 2: Multi-Attribute Heuristic** | 100.0% | 100.0% | 100.0% | 4.98x |
| **SETU Stage 2G Progress Isolation Forest** | **100.0%** | **100.0%** | **100.0%** | **4.98x** |

---

## 4. Hard-Negative Discrimination (Legitimate Outlier Separation)

| Hard-Negative Scenario | Total Projects | Flagged in Top 5% | False Alarm Rate | Mean Anomaly Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **LEGITIMATE_REMOTE_SINGLE_BID** | 152 | 0 | 0.00% | 23.71 | Protected |
| **HIGH_VALUE_LEGITIMATE** | 271 | 0 | 0.00% | 21.80 | Protected |
| **LEGITIMATE_WEATHER_DELAY** | 103 | 0 | 0.00% | 21.58 | Protected |

---

## 5. Scenario Detection Coverage

| Scenario Archetype | Total | Is Fraud | Mean Score | Median Score | Flagged Top 5% | Top 10% Catch Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `GHOST_WORK` | 46 | Yes | 96.72 | 96.58 | 46 (100.0%) | 46 (100.0%) |
| `DOCUMENTATION_DEFICIT` | 71 | Yes | 82.51 | 82.11 | 71 (100.0%) | 71 (100.0%) |
| `DELAYED_WORK` | 154 | Yes | 80.46 | 80.55 | 107 (69.5%) | 147 (95.5%) |
| `PAYMENT_PROGRESS_MISMATCH` | 252 | Yes | 72.17 | 71.47 | 25 (9.9%) | 184 (73.0%) |
| `ABANDONED_WORK` | 76 | Yes | 67.23 | 67.48 | 1 (1.3%) | 27 (35.5%) |
| `COST_OVERRUN` | 218 | Yes | 60.64 | 60.31 | 1 (0.5%) | 26 (11.9%) |
| `PROCUREMENT_SINGLE_BID` | 103 | Yes | 24.07 | 24.75 | 0 (0.0%) | 0 (0.0%) |
| `SUSPICIOUS_CONTRACTOR_MONOPOLY` | 85 | Yes | 23.81 | 23.98 | 0 (0.0%) | 0 (0.0%) |
| `LEGITIMATE_REMOTE_SINGLE_BID` | 152 | No | 23.71 | 22.60 | 0 (0.0%) | 0 (0.0%) |
| `NORMAL` | 3469 | No | 23.33 | 22.37 | 0 (0.0%) | 0 (0.0%) |
| `HIGH_VALUE_LEGITIMATE` | 271 | No | 21.80 | 19.61 | 0 (0.0%) | 0 (0.0%) |
| `LEGITIMATE_WEATHER_DELAY` | 103 | No | 21.58 | 19.52 | 0 (0.0%) | 0 (0.0%) |

---
*Report generated automatically by SETU Progress Pipeline.*
