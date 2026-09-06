# SETU Stage 2H — Graph & Entity Relationship Model Evaluation Report

> **Model**: `graph_isolation_forest` (v1.0.0)  
> **Evaluation Mode**: `early_warning`  
> **Training Date**: `2026-09-06T09:32:21.601466+00:00`  
> **Projects Evaluated**: 5000  

---

## 1. Score Distribution Summary

| Metric | Value |
| :--- | :--- |
| **Total Projects** | 5000 |
| **Flagged Anomalies (Top 5%)** | 251 (5.0%) |
| **Mean Anomaly Score** | 33.65 |
| **Median Anomaly Score** | 30.52 |
| **Standard Deviation** | 21.24 |
| **Percentile 50 (p50)** | 30.52 |
| **Percentile 90 (p90)** | 65.48 |
| **Percentile 95 (p95)** | 72.34 |
| **Percentile 99 (p99)** | 85.76 |

---

## 2. Fraud Enrichment Benchmarks (Base Fraud Rate: 20.1%)

| Tier Cutoff | Projects | Fraud Count | Fraud Rate | Enrichment Factor | Hard Negatives | Hard Neg Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top 1%** | 50 | 7 | 14.00% | **0.7x** | 7 | 14.00% |
| **Top 5%** | 250 | 45 | 18.00% | **0.9x** | 27 | 10.80% |
| **Top 10%** | 500 | 100 | 20.00% | **1.0x** | 55 | 11.00% |
| **Top 20%** | 1000 | 193 | 19.30% | **0.96x** | 101 | 10.10% |

---

## 3. Baseline Model Comparison Matrix

| Model / Detector | Top 1% Fraud Rate | Top 5% Fraud Rate | Top 10% Fraud Rate | Top 10% Enrichment |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Tripartite Monopoly Rule** | 26.0% | 18.0% | 19.4% | 0.97x |
| **Baseline 2: Multi-Attribute Heuristic** | 26.0% | 18.0% | 18.2% | 0.91x |
| **SETU Stage 2H Graph Isolation Forest** | **14.0%** | **18.0%** | **20.0%** | **1.0x** |

---

## 4. Hard-Negative Discrimination (Legitimate Outlier Separation)

| Hard-Negative Scenario | Total Projects | Flagged in Top 5% | False Alarm Rate | Mean Anomaly Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **LEGITIMATE_REMOTE_SINGLE_BID** | 152 | 11 | 7.24% | 33.82 | Protected |
| **HIGH_VALUE_LEGITIMATE** | 271 | 11 | 4.06% | 32.55 | Protected |
| **LEGITIMATE_WEATHER_DELAY** | 103 | 5 | 4.85% | 35.21 | Protected |

---

## 5. Scenario Detection Coverage

| Scenario Archetype | Total | Is Fraud | Mean Score | Median Score | Flagged Top 5% | Top 10% Catch Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `LEGITIMATE_WEATHER_DELAY` | 103 | No | 35.21 | 31.20 | 5 (4.8%) | 12 (11.7%) |
| `PAYMENT_PROGRESS_MISMATCH` | 252 | Yes | 34.98 | 31.63 | 18 (7.1%) | 32 (12.7%) |
| `DOCUMENTATION_DEFICIT` | 71 | Yes | 34.92 | 30.44 | 4 (5.6%) | 7 (9.9%) |
| `ABANDONED_WORK` | 76 | Yes | 34.31 | 30.54 | 2 (2.6%) | 5 (6.6%) |
| `NORMAL` | 3469 | No | 33.86 | 30.93 | 179 (5.2%) | 346 (10.0%) |
| `LEGITIMATE_REMOTE_SINGLE_BID` | 152 | No | 33.82 | 30.44 | 11 (7.2%) | 16 (10.5%) |
| `PROCUREMENT_SINGLE_BID` | 103 | Yes | 32.60 | 28.63 | 5 (4.8%) | 10 (9.7%) |
| `HIGH_VALUE_LEGITIMATE` | 271 | No | 32.55 | 29.86 | 11 (4.1%) | 27 (10.0%) |
| `DELAYED_WORK` | 154 | Yes | 32.18 | 30.39 | 8 (5.2%) | 18 (11.7%) |
| `COST_OVERRUN` | 218 | Yes | 31.72 | 28.93 | 5 (2.3%) | 15 (6.9%) |
| `SUSPICIOUS_CONTRACTOR_MONOPOLY` | 85 | Yes | 31.72 | 28.93 | 2 (2.4%) | 8 (9.4%) |
| `GHOST_WORK` | 46 | Yes | 30.04 | 22.51 | 1 (2.2%) | 5 (10.9%) |

---
*Report generated automatically by SETU Graph Pipeline.*
