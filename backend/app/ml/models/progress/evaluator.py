"""
SETU — Stage 2G: Progress Model Evaluator.

Evaluates progress execution trajectory anomaly detection against quarantined project labels:
- Score distribution metrics (p50, p90, p95, p99)
- Top-k fraud enrichment factors (Top 1%, 5%, 10%, 20%)
- Baseline comparative benchmarks
- Hard-negative false positive discrimination
- Scenario archetype detection coverage
- Export of detailed JSON and Markdown audit reports
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np
import pandas as pd

from app.ml.models.progress.config import ProgressModelConfig


class ProgressEvaluator:
    """Evaluates progress execution anomaly scores against quarantined labels."""

    def __init__(self, config: Optional[ProgressModelConfig] = None):
        self.config = config or ProgressModelConfig()

    def evaluate(
        self,
        scores_df: pd.DataFrame,
        labels_df: pd.DataFrame,
        baseline1_scores: Optional[pd.Series] = None,
        baseline2_scores: Optional[pd.Series] = None,
    ) -> Dict[str, Any]:
        """Run comprehensive post-hoc evaluation on progress execution scores."""
        merged = scores_df.merge(labels_df, on="project_id")
        score_col = "progress_anomaly_score"
        n_total = len(merged)

        # 1. Score distribution
        scores = merged[score_col].to_numpy()
        dist_stats = {
            "total_projects": int(n_total),
            "flagged_top_5pct": int((merged["is_progress_anomaly"] == 1).sum()),
            "mean_score": float(np.mean(scores)),
            "median_score": float(np.median(scores)),
            "std_score": float(np.std(scores)),
            "p50": float(np.percentile(scores, 50)),
            "p90": float(np.percentile(scores, 90)),
            "p95": float(np.percentile(scores, 95)),
            "p99": float(np.percentile(scores, 99)),
        }

        # 2. Fraud enrichment tiers
        base_fraud_rate = float(merged["is_fraud"].mean())
        tier_benchmarks = {}
        for pct in [1, 5, 10, 20]:
            k = int(np.ceil(n_total * (pct / 100.0)))
            top_k = merged.sort_values(score_col, ascending=False).head(k)
            fraud_count = int(top_k["is_fraud"].sum())
            fraud_rate = float(fraud_count / k) if k > 0 else 0.0
            enrichment = float(fraud_rate / base_fraud_rate) if base_fraud_rate > 0 else 1.0
            hard_neg = int(top_k["is_hard_negative"].sum())
            hard_neg_rate = float(hard_neg / k) if k > 0 else 0.0

            tier_benchmarks[f"top_{pct}pct"] = {
                "cutoff_count": k,
                "fraud_count": fraud_count,
                "fraud_rate": round(fraud_rate * 100, 2),
                "enrichment_factor": round(enrichment, 2),
                "hard_negative_count": hard_neg,
                "hard_negative_rate": round(hard_neg_rate * 100, 2),
            }

        # 3. Baseline comparison
        baseline_comparison = {}
        if baseline1_scores is not None and baseline2_scores is not None:
            for b_name, b_s in [("baseline1", baseline1_scores), ("baseline2", baseline2_scores), ("progress_model", merged[score_col])]:
                b_df = pd.DataFrame({"score": b_s, "is_fraud": merged["is_fraud"]})
                comp = {}
                for pct in [1, 5, 10]:
                    k = int(np.ceil(n_total * (pct / 100.0)))
                    top_b = b_df.sort_values("score", ascending=False).head(k)
                    f_rate = float(top_b["is_fraud"].mean())
                    comp[f"top_{pct}pct_fraud_rate"] = round(f_rate * 100, 2)
                    comp[f"top_{pct}pct_enrichment"] = round(f_rate / (base_fraud_rate + 1e-9), 2)
                baseline_comparison[b_name] = comp

        # 4. Hard-negative separation
        hard_negatives = {}
        hn_sub = merged[merged["is_hard_negative"] == 1]
        for scenario in hn_sub["scenario_type"].unique():
            sc_data = hn_sub[hn_sub["scenario_type"] == scenario]
            flagged = int((sc_data["is_progress_anomaly"] == 1).sum())
            total = len(sc_data)
            rate = float(flagged / total) if total > 0 else 0.0
            hard_negatives[scenario] = {
                "total": total,
                "flagged_in_top_5pct": flagged,
                "false_alarm_rate": round(rate * 100, 2),
                "mean_score": round(float(sc_data[score_col].mean()), 2),
                "status": "Protected" if rate < 0.15 else "At Risk",
            }

        # 5. Scenario archetype detection coverage
        scenario_breakdown = {}
        for scenario, sc_data in merged.groupby("scenario_type"):
            total = len(sc_data)
            is_fraud = bool(sc_data["is_fraud"].iloc[0])
            flagged = int((sc_data["is_progress_anomaly"] == 1).sum())
            top_10 = int((sc_data["progress_anomaly_percentile"] >= 90.0).sum())
            scenario_breakdown[scenario] = {
                "total": total,
                "is_fraud": is_fraud,
                "mean_score": round(float(sc_data[score_col].mean()), 2),
                "median_score": round(float(sc_data[score_col].median()), 2),
                "flagged_top_5pct": flagged,
                "flagged_top_5pct_rate": round(flagged / total * 100, 2),
                "flagged_top_10pct": top_10,
                "flagged_top_10pct_rate": round(top_10 / total * 100, 2),
            }

        results = {
            "model_name": self.config.model_name,
            "version": self.config.model_version,
            "mode": self.config.mode,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "base_fraud_rate": round(base_fraud_rate * 100, 2),
            "distribution_summary": dist_stats,
            "enrichment_benchmarks": tier_benchmarks,
            "baseline_comparison": baseline_comparison,
            "hard_negative_discrimination": hard_negatives,
            "scenario_coverage": scenario_breakdown,
        }

        return results

    def export_reports(self, report_data: Dict[str, Any]) -> Tuple[Path, Path]:
        """Write JSON and Markdown evaluation reports."""
        self.config.reports_dir.mkdir(parents=True, exist_ok=True)
        json_path = self.config.reports_dir / "progress_model_report.json"
        md_path = self.config.reports_dir / "PROGRESS_MODEL_REPORT.md"

        # Write JSON
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)

        # Write Markdown
        dist = report_data["distribution_summary"]
        enr = report_data["enrichment_benchmarks"]
        base_comp = report_data.get("baseline_comparison", {})
        hnd = report_data["hard_negative_discrimination"]
        sc_cov = report_data["scenario_coverage"]

        md_content = f"""# SETU Stage 2G — Progress vs. Execution Trajectory Model Evaluation Report

> **Model**: `{report_data['model_name']}` (v{report_data['version']})  
> **Evaluation Mode**: `{report_data['mode']}`  
> **Training Date**: `{report_data['timestamp']}`  
> **Projects Evaluated**: {dist['total_projects']}  

---

## 1. Score Distribution Summary

| Metric | Value |
| :--- | :--- |
| **Total Projects** | {dist['total_projects']} |
| **Flagged Anomalies (Top 5%)** | {dist['flagged_top_5pct']} ({dist['flagged_top_5pct']/dist['total_projects']*100:.1f}%) |
| **Mean Anomaly Score** | {dist['mean_score']:.2f} |
| **Median Anomaly Score** | {dist['median_score']:.2f} |
| **Standard Deviation** | {dist['std_score']:.2f} |
| **Percentile 50 (p50)** | {dist['p50']:.2f} |
| **Percentile 90 (p90)** | {dist['p90']:.2f} |
| **Percentile 95 (p95)** | {dist['p95']:.2f} |
| **Percentile 99 (p99)** | {dist['p99']:.2f} |

---

## 2. Fraud Enrichment Benchmarks (Base Fraud Rate: {report_data['base_fraud_rate']}%)

| Tier Cutoff | Projects | Fraud Count | Fraud Rate | Enrichment Factor | Hard Negatives | Hard Neg Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top 1%** | {enr['top_1pct']['cutoff_count']} | {enr['top_1pct']['fraud_count']} | {enr['top_1pct']['fraud_rate']:.2f}% | **{enr['top_1pct']['enrichment_factor']}x** | {enr['top_1pct']['hard_negative_count']} | {enr['top_1pct']['hard_negative_rate']:.2f}% |
| **Top 5%** | {enr['top_5pct']['cutoff_count']} | {enr['top_5pct']['fraud_count']} | {enr['top_5pct']['fraud_rate']:.2f}% | **{enr['top_5pct']['enrichment_factor']}x** | {enr['top_5pct']['hard_negative_count']} | {enr['top_5pct']['hard_negative_rate']:.2f}% |
| **Top 10%** | {enr['top_10pct']['cutoff_count']} | {enr['top_10pct']['fraud_count']} | {enr['top_10pct']['fraud_rate']:.2f}% | **{enr['top_10pct']['enrichment_factor']}x** | {enr['top_10pct']['hard_negative_count']} | {enr['top_10pct']['hard_negative_rate']:.2f}% |
| **Top 20%** | {enr['top_20pct']['cutoff_count']} | {enr['top_20pct']['fraud_count']} | {enr['top_20pct']['fraud_rate']:.2f}% | **{enr['top_20pct']['enrichment_factor']}x** | {enr['top_20pct']['hard_negative_count']} | {enr['top_20pct']['hard_negative_rate']:.2f}% |

---

## 3. Baseline Model Comparison Matrix

| Model / Detector | Top 1% Fraud Rate | Top 5% Fraud Rate | Top 10% Fraud Rate | Top 10% Enrichment |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Divergence Rule** | {base_comp.get('baseline1', {}).get('top_1pct_fraud_rate', 'N/A')}% | {base_comp.get('baseline1', {}).get('top_5pct_fraud_rate', 'N/A')}% | {base_comp.get('baseline1', {}).get('top_10pct_fraud_rate', 'N/A')}% | {base_comp.get('baseline1', {}).get('top_10pct_enrichment', 'N/A')}x |
| **Baseline 2: Multi-Attribute Heuristic** | {base_comp.get('baseline2', {}).get('top_1pct_fraud_rate', 'N/A')}% | {base_comp.get('baseline2', {}).get('top_5pct_fraud_rate', 'N/A')}% | {base_comp.get('baseline2', {}).get('top_10pct_fraud_rate', 'N/A')}% | {base_comp.get('baseline2', {}).get('top_10pct_enrichment', 'N/A')}x |
| **SETU Stage 2G Progress Isolation Forest** | **{base_comp.get('progress_model', {}).get('top_1pct_fraud_rate', 'N/A')}%** | **{base_comp.get('progress_model', {}).get('top_5pct_fraud_rate', 'N/A')}%** | **{base_comp.get('progress_model', {}).get('top_10pct_fraud_rate', 'N/A')}%** | **{base_comp.get('progress_model', {}).get('top_10pct_enrichment', 'N/A')}x** |

---

## 4. Hard-Negative Discrimination (Legitimate Outlier Separation)

| Hard-Negative Scenario | Total Projects | Flagged in Top 5% | False Alarm Rate | Mean Anomaly Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
"""
        for sc, hn in hnd.items():
            md_content += f"| **{sc}** | {hn['total']} | {hn['flagged_in_top_5pct']} | {hn['false_alarm_rate']:.2f}% | {hn['mean_score']:.2f} | {hn['status']} |\n"

        md_content += """
---

## 5. Scenario Detection Coverage

| Scenario Archetype | Total | Is Fraud | Mean Score | Median Score | Flagged Top 5% | Top 10% Catch Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
"""
        sorted_scenarios = sorted(sc_cov.items(), key=lambda x: x[1]["mean_score"], reverse=True)
        for sc, dat in sorted_scenarios:
            md_content += f"| `{sc}` | {dat['total']} | {'Yes' if dat['is_fraud'] else 'No'} | {dat['mean_score']:.2f} | {dat['median_score']:.2f} | {dat['flagged_top_5pct']} ({dat['flagged_top_5pct_rate']:.1f}%) | {dat['flagged_top_10pct']} ({dat['flagged_top_10pct_rate']:.1f}%) |\n"

        md_content += """
---
*Report generated automatically by SETU Progress Pipeline.*
"""

        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)

        return json_path, md_path
