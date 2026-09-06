# SETU Stage 2D — Procurement Anomaly Model Evaluation Report

> **Model**: `procurement_isolation_forest` (v1.0.0)  
> **Evaluation Mode**: `early_warning`  
> **Training Date**: `2026-09-06T08:43:13.124945+00:00`  
> **Projects Evaluated**: 5000  
> **Features Count**: 32 (Base: 22, Engineered: 10)

---

## 1. Score Distribution Summary

| Metric | Value |
| :--- | :--- |
| **Total Projects** | 5000 |
| **Flagged Anomalies (Top 5%)** | 251 (5.0%) |
| **Mean Anomaly Score** | 25.43 |
| **Median Anomaly Score** | 19.95 |
| **Standard Deviation** | 21.11 |
| **Percentile 50 (p50)** | 19.95 |
| **Percentile 90 (p90)** | 49.61 |
| **Percentile 95 (p95)** | 85.22 |
| **Percentile 99 (p99)** | 100.00 |

---

## 2. Fraud Enrichment Benchmarks (Base Fraud Rate: 20.10%)

| Tier Cutoff | Projects | Fraud Count | Fraud Rate | Enrichment Factor | Hard Negatives | Hard Neg Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top 1%** | 50 | 29 | 58.00% | **2.89x** | 21 | 42.00% |
| **Top 5%** | 250 | 109 | 43.60% | **2.17x** | 141 | 56.40% |
| **Top 10%** | 500 | 280 | 56.00% | **2.79x** | 177 | 35.40% |
| **Top 20%** | 1000 | 462 | 46.20% | **2.30x** | 230 | 23.00% |

---

## 3. Baseline Model Comparison Matrix

| Model / Detector | Top 1% Fraud Rate | Top 5% Fraud Rate | Top 10% Fraud Rate | Top 10% Enrichment |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Single-Bid Rule** | 42.00% | 40.80% | 29.80% | 1.48x |
| **Baseline 2: Multi-Attribute Heuristic** | 58.00% | 64.40% | 57.00% | 2.84x |
| **SETU Stage 2D Procurement Isolation Forest** | **58.00%** | **43.60%** | **56.00%** | **2.79x** |

---

## 4. Hard-Negative Discrimination (Legitimate Outlier Separation)

| Hard-Negative Scenario | Total Projects | Flagged in Top 5% | False Alarm Rate | Mean Anomaly Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Remote Single Bid (`LEGITIMATE_REMOTE_SINGLE_BID`)** | 152 | 141 | 92.76% | 92.84 | Protected |
| **High Value Legitimate (`HIGH_VALUE_LEGITIMATE`)** | 271 | 1 | 0.37% | 27.09 | Protected |
| **Weather Delay (`LEGITIMATE_WEATHER_DELAY`)** | 103 | 0 | 0.00% | 16.95 | Protected |

---

## 5. Scenario Detection Coverage

| Scenario Archetype | Total | Is Fraud | Mean Score | Median Score | Flagged Top 5% | Top 10% Catch Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `PROCUREMENT_SINGLE_BID` | 103 | Yes | 94.83 | 96.56 | 99 (96.1%) | 103 (100.0%) |
| `LEGITIMATE_REMOTE_SINGLE_BID` | 152 | No | 92.84 | 92.47 | 141 (92.8%) | 152 (100.0%) |
| `COST_OVERRUN` | 218 | Yes | 57.28 | 56.16 | 10 (4.6%) | 154 (70.6%) |
| `DELAYED_WORK` | 154 | Yes | 35.02 | 34.70 | 0 (0.0%) | 16 (10.4%) |
| `HIGH_VALUE_LEGITIMATE` | 271 | No | 27.09 | 24.46 | 1 (0.4%) | 25 (9.2%) |
| `ABANDONED_WORK` | 76 | Yes | 26.00 | 25.76 | 0 (0.0%) | 0 (0.0%) |
| `GHOST_WORK` | 46 | Yes | 22.22 | 21.68 | 0 (0.0%) | 2 (4.3%) |
| `PAYMENT_PROGRESS_MISMATCH` | 252 | Yes | 19.33 | 17.47 | 0 (0.0%) | 1 (0.4%) |
| `NORMAL` | 3469 | No | 18.92 | 17.59 | 0 (0.0%) | 44 (1.3%) |
| `SUSPICIOUS_CONTRACTOR_MONOPOLY` | 85 | Yes | 18.66 | 16.45 | 0 (0.0%) | 3 (3.5%) |
| `DOCUMENTATION_DEFICIT` | 71 | Yes | 17.08 | 16.32 | 0 (0.0%) | 1 (1.4%) |
| `LEGITIMATE_WEATHER_DELAY` | 103 | No | 16.95 | 16.87 | 0 (0.0%) | 0 (0.0%) |

---
*Report generated automatically by SETU Procurement Pipeline.*
