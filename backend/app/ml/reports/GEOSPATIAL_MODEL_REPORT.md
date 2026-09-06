# SETU Stage 2C — Geospatial Anomaly Model Evaluation Report

> **Model**: `geospatial_isolation_forest` (v1.0.0)  
> **Evaluation Mode**: `early_warning`  
> **Training Date**: `2026-09-06T08:30:04.149306+00:00`  
> **Projects Evaluated**: 5000  
> **Features Count**: 27 (Base: 10, Engineered: 18)

---

## 1. Score Distribution Summary

| Metric | Value |
| :--- | :--- |
| **Total Projects** | 5000 |
| **Flagged Anomalies (Top 5%)** | 251 (5.0%) |
| **Mean Anomaly Score** | 20.70 |
| **Median Anomaly Score** | 15.00 |
| **Standard Deviation** | 19.12 |
| **Percentile 50 (p50)** | 15.00 |
| **Percentile 90 (p90)** | 44.19 |
| **Percentile 95 (p95)** | 64.39 |
| **Percentile 99 (p99)** | 100.00 |

---

## 2. Fraud Enrichment Benchmarks (Base Fraud Rate: 20.10%)

| Tier Cutoff | Projects | Fraud Count | Fraud Rate | Enrichment Factor | Hard Negatives | Hard Neg Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top 1%** | 50 | 1 | 2.00% | **0.10x** | 49 | 98.00% |
| **Top 5%** | 250 | 12 | 4.80% | **0.24x** | 191 | 76.40% |
| **Top 10%** | 500 | 50 | 10.00% | **0.50x** | 264 | 52.80% |
| **Top 20%** | 1000 | 158 | 15.80% | **0.79x** | 306 | 30.60% |

---

## 3. Baseline Model Comparison Matrix

| Model / Detector | Top 1% Fraud Rate | Top 5% Fraud Rate | Top 10% Fraud Rate | Top 10% Enrichment |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Spatial Cost Cluster Deviation** | 24.00% | 20.80% | 20.80% | 1.03x |
| **Baseline 2: Multi-Attribute Spatial Heuristic** | 18.00% | 14.40% | 15.80% | 0.79x |
| **SETU Stage 2C Geospatial Isolation Forest** | **2.00%** | **4.80%** | **10.00%** | **0.50x** |

---

## 4. Hard-Negative Discrimination (Legitimate Outlier Separation)

| Hard-Negative Scenario | Total Projects | Flagged in Top 5% | False Alarm Rate | Mean Anomaly Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Remote Single Bid (`LEGITIMATE_REMOTE_SINGLE_BID`)** | 152 | 0 | 0.00% | 17.67 | Protected |
| **High Value Legitimate (`HIGH_VALUE_LEGITIMATE`)** | 271 | 190 | 70.11% | 74.31 | Protected |
| **Weather Delay (`LEGITIMATE_WEATHER_DELAY`)** | 103 | 2 | 1.94% | 16.89 | Protected |

---

## 5. Scenario Detection Coverage

| Scenario Archetype | Total | Is Fraud | Mean Score | Median Score | Flagged Top 5% | Top 10% Catch Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `HIGH_VALUE_LEGITIMATE` | 271 | No | 74.31 | 74.44 | 190 (70.1%) | 252 (93.0%) |
| `COST_OVERRUN` | 218 | Yes | 18.36 | 15.18 | 3 (1.4%) | 11 (5.0%) |
| `NORMAL` | 3469 | No | 17.71 | 14.22 | 47 (1.4%) | 187 (5.4%) |
| `PAYMENT_PROGRESS_MISMATCH` | 252 | Yes | 17.67 | 13.75 | 3 (1.2%) | 14 (5.6%) |
| `LEGITIMATE_REMOTE_SINGLE_BID` | 152 | No | 17.67 | 15.08 | 0 (0.0%) | 6 (3.9%) |
| `SUSPICIOUS_CONTRACTOR_MONOPOLY` | 85 | Yes | 17.37 | 12.90 | 1 (1.2%) | 5 (5.9%) |
| `PROCUREMENT_SINGLE_BID` | 103 | Yes | 17.30 | 12.75 | 2 (1.9%) | 4 (3.9%) |
| `GHOST_WORK` | 46 | Yes | 17.27 | 13.00 | 1 (2.2%) | 2 (4.3%) |
| `DOCUMENTATION_DEFICIT` | 71 | Yes | 17.05 | 14.35 | 1 (1.4%) | 4 (5.6%) |
| `LEGITIMATE_WEATHER_DELAY` | 103 | No | 16.89 | 13.41 | 2 (1.9%) | 6 (5.8%) |
| `DELAYED_WORK` | 154 | Yes | 16.87 | 13.42 | 1 (0.6%) | 8 (5.2%) |
| `ABANDONED_WORK` | 76 | Yes | 15.96 | 14.06 | 0 (0.0%) | 2 (2.6%) |

---
*Report generated automatically by SETU Geospatial Pipeline.*
