# SETU Stage 2E — Contractor Anomaly Model Evaluation Report

> **Model**: `contractor_isolation_forest` (v1.0.0)  
> **Evaluation Mode**: `early_warning`  
> **Training Date**: `2026-09-06T08:49:41.473273+00:00`  
> **Projects Evaluated**: 5000  
> **Features Count**: 34 (Base: 25, Engineered: 9)

---

## 1. Score Distribution Summary

| Metric | Value |
| :--- | :--- |
| **Total Projects** | 5000 |
| **Flagged Anomalies (Top 5%)** | 251 (5.0%) |
| **Mean Anomaly Score** | 32.71 |
| **Median Anomaly Score** | 28.56 |
| **Standard Deviation** | 21.90 |
| **Percentile 50 (p50)** | 28.56 |
| **Percentile 90 (p90)** | 63.75 |
| **Percentile 95 (p95)** | 73.54 |
| **Percentile 99 (p99)** | 100.00 |

---

## 2. Fraud Enrichment Benchmarks (Base Fraud Rate: 20.10%)

| Tier Cutoff | Projects | Fraud Count | Fraud Rate | Enrichment Factor | Hard Negatives | Hard Neg Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top 1%** | 50 | 7 | 14.00% | **0.70x** | 8 | 16.00% |
| **Top 5%** | 250 | 57 | 22.80% | **1.13x** | 47 | 18.80% |
| **Top 10%** | 500 | 111 | 22.20% | **1.10x** | 84 | 16.80% |
| **Top 20%** | 1000 | 206 | 20.60% | **1.02x** | 148 | 14.80% |

---

## 3. Baseline Model Comparison Matrix

| Model / Detector | Top 1% Fraud Rate | Top 5% Fraud Rate | Top 10% Fraud Rate | Top 10% Enrichment |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Agency Concentration** | 18.00% | 21.60% | 22.40% | 1.11x |
| **Baseline 2: Multi-Attribute Heuristic** | 12.00% | 18.00% | 18.60% | 0.93x |
| **SETU Stage 2E Contractor Isolation Forest** | **14.00%** | **22.80%** | **22.20%** | **1.10x** |

---

## 4. Hard-Negative Discrimination (Legitimate Outlier Separation)

| Hard-Negative Scenario | Total Projects | Flagged in Top 5% | False Alarm Rate | Mean Anomaly Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Remote Single Bid (`LEGITIMATE_REMOTE_SINGLE_BID`)** | 152 | 6 | 3.95% | 32.06 | Protected |
| **High Value Legitimate (`HIGH_VALUE_LEGITIMATE`)** | 271 | 33 | 12.18% | 43.34 | Protected |
| **Weather Delay (`LEGITIMATE_WEATHER_DELAY`)** | 103 | 8 | 7.77% | 37.56 | Protected |

---

## 5. Scenario Detection Coverage

| Scenario Archetype | Total | Is Fraud | Mean Score | Median Score | Flagged Top 5% | Top 10% Catch Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `DELAYED_WORK` | 154 | Yes | 45.47 | 42.34 | 21 (13.6%) | 33 (21.4%) |
| `HIGH_VALUE_LEGITIMATE` | 271 | No | 43.34 | 40.00 | 33 (12.2%) | 61 (22.5%) |
| `LEGITIMATE_WEATHER_DELAY` | 103 | No | 37.56 | 35.13 | 8 (7.8%) | 11 (10.7%) |
| `DOCUMENTATION_DEFICIT` | 71 | Yes | 35.73 | 32.26 | 5 (7.0%) | 7 (9.9%) |
| `PAYMENT_PROGRESS_MISMATCH` | 252 | Yes | 32.58 | 27.32 | 14 (5.6%) | 29 (11.5%) |
| `LEGITIMATE_REMOTE_SINGLE_BID` | 152 | No | 32.06 | 28.73 | 6 (3.9%) | 12 (7.9%) |
| `PROCUREMENT_SINGLE_BID` | 103 | Yes | 31.61 | 28.28 | 4 (3.9%) | 10 (9.7%) |
| `NORMAL` | 3469 | No | 31.52 | 27.07 | 147 (4.2%) | 306 (8.8%) |
| `GHOST_WORK` | 46 | Yes | 30.98 | 22.20 | 2 (4.3%) | 4 (8.7%) |
| `SUSPICIOUS_CONTRACTOR_MONOPOLY` | 85 | Yes | 30.27 | 26.52 | 4 (4.7%) | 8 (9.4%) |
| `COST_OVERRUN` | 218 | Yes | 29.80 | 27.50 | 3 (1.4%) | 13 (6.0%) |
| `ABANDONED_WORK` | 76 | Yes | 29.21 | 25.74 | 4 (5.3%) | 7 (9.2%) |

---
*Report generated automatically by SETU Contractor Pipeline.*
