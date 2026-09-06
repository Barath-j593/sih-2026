# SETU Stage 2F — Granular Payment Structuring Model Evaluation Report

> **Model**: `payment_isolation_forest` (v1.0.0)  
> **Evaluation Mode**: `early_warning`  
> **Training Date**: `2026-09-06T08:55:28.104728+00:00`  
> **Projects Evaluated**: 5000  

---

## 1. Score Distribution Summary

| Metric | Value |
| :--- | :--- |
| **Total Projects** | 5000 |
| **Flagged Anomalies (Top 5%)** | 251 (5.0%) |
| **Mean Anomaly Score** | 33.75 |
| **Median Anomaly Score** | 30.96 |
| **Standard Deviation** | 22.88 |
| **Percentile 50 (p50)** | 30.96 |
| **Percentile 90 (p90)** | 68.66 |
| **Percentile 95 (p95)** | 77.53 |
| **Percentile 99 (p99)** | 86.05 |

---

## 2. Fraud Enrichment Benchmarks (Base Fraud Rate: 20.1%)

| Tier Cutoff | Projects | Fraud Count | Fraud Rate | Enrichment Factor | Hard Negatives | Hard Neg Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top 1%** | 50 | 46 | 92.00% | **4.58x** | 1 | 2.00% |
| **Top 5%** | 250 | 200 | 80.00% | **3.98x** | 4 | 1.60% |
| **Top 10%** | 500 | 375 | 75.00% | **3.73x** | 27 | 5.40% |
| **Top 20%** | 1000 | 657 | 65.70% | **3.27x** | 101 | 10.10% |

---

## 3. Baseline Model Comparison Matrix

| Model / Detector | Top 1% Fraud Rate | Top 5% Fraud Rate | Top 10% Fraud Rate | Top 10% Enrichment |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Unverified & Round Rule** | 100.0% | 99.2% | 77.2% | 3.84x |
| **Baseline 2: Multi-Attribute Heuristic** | 100.0% | 100.0% | 79.4% | 3.95x |
| **SETU Stage 2F Payment Isolation Forest** | **92.0%** | **80.0%** | **75.0%** | **3.73x** |

---

## 4. Hard-Negative Discrimination (Legitimate Outlier Separation)

| Hard-Negative Scenario | Total Projects | Flagged in Top 5% | False Alarm Rate | Mean Anomaly Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **LEGITIMATE_REMOTE_SINGLE_BID** | 152 | 1 | 0.66% | 26.37 | Protected |
| **HIGH_VALUE_LEGITIMATE** | 271 | 3 | 1.11% | 46.27 | Protected |
| **LEGITIMATE_WEATHER_DELAY** | 103 | 0 | 0.00% | 25.89 | Protected |

---

## 5. Scenario Detection Coverage

| Scenario Archetype | Total | Is Fraud | Mean Score | Median Score | Flagged Top 5% | Top 10% Catch Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `GHOST_WORK` | 46 | Yes | 77.67 | 75.05 | 20 (43.5%) | 43 (93.5%) |
| `DOCUMENTATION_DEFICIT` | 71 | Yes | 74.79 | 76.39 | 33 (46.5%) | 48 (67.6%) |
| `PAYMENT_PROGRESS_MISMATCH` | 252 | Yes | 73.57 | 73.03 | 92 (36.5%) | 158 (62.7%) |
| `ABANDONED_WORK` | 76 | Yes | 67.00 | 66.43 | 17 (22.4%) | 34 (44.7%) |
| `COST_OVERRUN` | 218 | Yes | 63.94 | 62.48 | 28 (12.8%) | 70 (32.1%) |
| `DELAYED_WORK` | 154 | Yes | 51.29 | 52.61 | 5 (3.2%) | 16 (10.4%) |
| `HIGH_VALUE_LEGITIMATE` | 271 | No | 46.27 | 44.45 | 3 (1.1%) | 20 (7.4%) |
| `PROCUREMENT_SINGLE_BID` | 103 | Yes | 27.36 | 25.31 | 3 (2.9%) | 4 (3.9%) |
| `SUSPICIOUS_CONTRACTOR_MONOPOLY` | 85 | Yes | 26.70 | 28.82 | 3 (3.5%) | 3 (3.5%) |
| `LEGITIMATE_REMOTE_SINGLE_BID` | 152 | No | 26.37 | 25.41 | 1 (0.7%) | 4 (2.6%) |
| `NORMAL` | 3469 | No | 25.98 | 23.92 | 46 (1.3%) | 98 (2.8%) |
| `LEGITIMATE_WEATHER_DELAY` | 103 | No | 25.89 | 21.60 | 0 (0.0%) | 3 (2.9%) |

---
*Report generated automatically by SETU Payment Pipeline.*
