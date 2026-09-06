"""Financial Model Evaluator.

Evaluates unsupervised financial anomaly detection performance against quarantined labels:
- Anomaly score distributions
- Fraud enrichment factors (top 1%, 5%, 10% vs baseline)
- Hard negative discrimination (is_hard_negative)
- Scenario detection coverage
- Baseline model comparison matrix
"""

from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import pandas as pd


class FinancialModelEvaluator:
    """Evaluator for Financial Anomaly Models."""

    @staticmethod
    def evaluate(
        df_scores: pd.DataFrame,
        df_labels: pd.DataFrame,
        baseline1_scores: Optional[Tuple[np.ndarray, np.ndarray, np.ndarray]] = None,
        baseline2_scores: Optional[Tuple[np.ndarray, np.ndarray, np.ndarray]] = None,
    ) -> Dict[str, Any]:
        """Perform comprehensive evaluation against quarantined ground truth labels."""
        df = df_scores.merge(df_labels, on="project_id", how="inner")
        total_projects = len(df)
        base_fraud_count = int(df["is_fraud"].sum())
        base_fraud_rate = float(base_fraud_count / total_projects)
        base_hard_neg_count = int(df["is_hard_negative"].sum())
        base_hard_neg_rate = float(base_hard_neg_count / total_projects)

        scores = df["financial_anomaly_score"].values
        distribution = {
            "total_projects": total_projects,
            "flagged_anomaly_count": int(df["financial_anomaly_flag"].sum()),
            "flagged_anomaly_pct": float(df["financial_anomaly_flag"].mean() * 100.0),
            "mean_score": float(np.mean(scores)),
            "median_score": float(np.median(scores)),
            "std_score": float(np.std(scores)),
            "min_score": float(np.min(scores)),
            "max_score": float(np.max(scores)),
            "percentile_1": float(np.percentile(scores, 1.0)),
            "percentile_5": float(np.percentile(scores, 5.0)),
            "percentile_10": float(np.percentile(scores, 10.0)),
            "percentile_50": float(np.percentile(scores, 50.0)),
            "percentile_90": float(np.percentile(scores, 90.0)),
            "percentile_95": float(np.percentile(scores, 95.0)),
            "percentile_99": float(np.percentile(scores, 99.0)),
        }

        def get_tier_stats(pct_cutoff: float):
            count = int(np.ceil(total_projects * (pct_cutoff / 100.0)))
            top_df = df.sort_values(by="financial_anomaly_score", ascending=False).head(count)
            fraud_count = int(top_df["is_fraud"].sum())
            fraud_rate = float(fraud_count / count)
            enrichment = float(fraud_rate / base_fraud_rate) if base_fraud_rate > 0 else 1.0
            hard_neg_count = int(top_df["is_hard_negative"].sum())
            hard_neg_rate = float(hard_neg_count / count)
            return {
                "tier": f"Top {pct_cutoff:.0f}%",
                "project_count": count,
                "fraud_count": fraud_count,
                "fraud_rate": fraud_rate,
                "fraud_enrichment_factor": enrichment,
                "hard_negative_count": hard_neg_count,
                "hard_negative_rate": hard_neg_rate,
            }

        fraud_enrichment = {
            "base_fraud_rate": base_fraud_rate,
            "base_fraud_count": base_fraud_count,
            "top_1_pct": get_tier_stats(1.0),
            "top_5_pct": get_tier_stats(5.0),
            "top_10_pct": get_tier_stats(10.0),
            "top_20_pct": get_tier_stats(20.0),
        }

        hard_negatives = {
            "base_hard_negative_rate": base_hard_neg_rate,
            "base_hard_negative_count": base_hard_neg_count,
            "flagged_hard_negative_count": int(df[df["financial_anomaly_flag"]]["is_hard_negative"].sum()),
            "flagged_hard_negative_rate": float(df[df["financial_anomaly_flag"]]["is_hard_negative"].mean()),
            "high_value_legitimate_total": int((df["scenario_type"] == "HIGH_VALUE_LEGITIMATE").sum()),
            "high_value_legitimate_flagged": int(((df["scenario_type"] == "HIGH_VALUE_LEGITIMATE") & df["financial_anomaly_flag"]).sum()),
            "high_value_legitimate_mean_score": float(df[df["scenario_type"] == "HIGH_VALUE_LEGITIMATE"]["financial_anomaly_score"].mean()),
        }

        scenarios = {}
        for sc_name, sc_df in df.groupby("scenario_type"):
            sc_count = len(sc_df)
            flagged = int(sc_df["financial_anomaly_flag"].sum())
            top10_count = int((sc_df["financial_anomaly_percentile"] >= 90.0).sum())
            scenarios[str(sc_name)] = {
                "total_projects": sc_count,
                "is_fraud_scenario": bool(sc_df["is_fraud"].iloc[0] == 1),
                "is_hard_negative_scenario": bool(sc_df["is_hard_negative"].iloc[0] == 1),
                "mean_anomaly_score": float(sc_df["financial_anomaly_score"].mean()),
                "median_anomaly_score": float(sc_df["financial_anomaly_score"].median()),
                "flagged_at_top5_count": flagged,
                "flagged_at_top5_rate": float(flagged / sc_count),
                "flagged_at_top10_count": top10_count,
                "flagged_at_top10_rate": float(top10_count / sc_count),
            }

        baseline_comparison = {}
        if baseline1_scores is not None and baseline2_scores is not None:
            def eval_baseline(b_scores, name):
                b_norm, b_pct, b_flags = b_scores
                top1_idx = np.argsort(-b_norm)[:int(total_projects * 0.01)]
                top5_idx = np.argsort(-b_norm)[:int(total_projects * 0.05)]
                top10_idx = np.argsort(-b_norm)[:int(total_projects * 0.10)]

                t1_fraud = float(df_labels.iloc[top1_idx]["is_fraud"].mean())
                t5_fraud = float(df_labels.iloc[top5_idx]["is_fraud"].mean())
                t10_fraud = float(df_labels.iloc[top10_idx]["is_fraud"].mean())

                t5_hn = float(df_labels.iloc[top5_idx]["is_hard_negative"].mean())
                hvl_idx = df_labels[df_labels["scenario_type"] == "HIGH_VALUE_LEGITIMATE"].index
                hvl_flagged = float(b_flags[hvl_idx].mean())

                return {
                    "name": name,
                    "top1_fraud_rate": t1_fraud,
                    "top1_enrichment": t1_fraud / base_fraud_rate if base_fraud_rate > 0 else 1.0,
                    "top5_fraud_rate": t5_fraud,
                    "top5_enrichment": t5_fraud / base_fraud_rate if base_fraud_rate > 0 else 1.0,
                    "top10_fraud_rate": t10_fraud,
                    "top10_enrichment": t10_fraud / base_fraud_rate if base_fraud_rate > 0 else 1.0,
                    "top5_hard_negative_rate": t5_hn,
                    "high_value_legitimate_false_positive_rate": hvl_flagged,
                }

            baseline_comparison["baseline_1_peer_cost_deviation"] = eval_baseline(baseline1_scores, "Peer Cost Deviation")
            baseline_comparison["baseline_2_multi_attribute_zscore"] = eval_baseline(baseline2_scores, "Multi-Attribute Robust Z-Score")
            baseline_comparison["isolation_forest"] = {
                "name": "Isolation Forest (Stage 2B Model)",
                "top1_fraud_rate": fraud_enrichment["top_1_pct"]["fraud_rate"],
                "top1_enrichment": fraud_enrichment["top_1_pct"]["fraud_enrichment_factor"],
                "top5_fraud_rate": fraud_enrichment["top_5_pct"]["fraud_rate"],
                "top5_enrichment": fraud_enrichment["top_5_pct"]["fraud_enrichment_factor"],
                "top10_fraud_rate": fraud_enrichment["top_10_pct"]["fraud_rate"],
                "top10_enrichment": fraud_enrichment["top_10_pct"]["fraud_enrichment_factor"],
                "top5_hard_negative_rate": fraud_enrichment["top_5_pct"]["hard_negative_rate"],
                "high_value_legitimate_false_positive_rate": float(hard_negatives["high_value_legitimate_flagged"] / hard_negatives["high_value_legitimate_total"]),
            }

        return {
            "distribution": distribution,
            "fraud_enrichment": fraud_enrichment,
            "hard_negatives": hard_negatives,
            "scenarios": scenarios,
            "baseline_comparison": baseline_comparison,
        }
