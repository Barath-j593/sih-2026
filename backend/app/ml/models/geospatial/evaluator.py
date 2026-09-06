"""Geospatial Model Evaluator.

Evaluates unsupervised geospatial anomaly detection performance against quarantined labels:
- Anomaly score distributions
- Fraud enrichment factors (top 1%, 5%, 10% vs baseline)
- Hard negative discrimination (is_hard_negative, LEGITIMATE_REMOTE_SINGLE_BID)
- Scenario detection coverage
- Baseline model comparison matrix
"""

from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import pandas as pd


class GeospatialModelEvaluator:
    """Evaluator for Geospatial Anomaly Models."""

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

        scores = df["geospatial_anomaly_score"].values
        distribution = {
            "total_projects": total_projects,
            "flagged_anomaly_count": int(df["geospatial_anomaly_flag"].sum()),
            "flagged_anomaly_pct": float(df["geospatial_anomaly_flag"].mean() * 100.0),
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
            top_df = df.sort_values(by="geospatial_anomaly_score", ascending=False).head(count)
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

        # Hard-negative evaluation specifically highlighting remote single bids
        remote_mask = df["scenario_type"] == "LEGITIMATE_REMOTE_SINGLE_BID"
        high_val_mask = df["scenario_type"] == "HIGH_VALUE_LEGITIMATE"
        weather_mask = df["scenario_type"] == "LEGITIMATE_WEATHER_DELAY"

        hard_negatives = {
            "base_hard_negative_rate": base_hard_neg_rate,
            "base_hard_negative_count": base_hard_neg_count,
            "flagged_hard_negative_count": int(df[df["geospatial_anomaly_flag"]]["is_hard_negative"].sum()),
            "flagged_hard_negative_rate": float(df[df["geospatial_anomaly_flag"]]["is_hard_negative"].mean()),
            "remote_single_bid_total": int(remote_mask.sum()),
            "remote_single_bid_flagged": int((remote_mask & df["geospatial_anomaly_flag"]).sum()),
            "remote_single_bid_mean_score": float(df[remote_mask]["geospatial_anomaly_score"].mean()) if remote_mask.sum() > 0 else 0.0,
            "high_value_legitimate_total": int(high_val_mask.sum()),
            "high_value_legitimate_flagged": int((high_val_mask & df["geospatial_anomaly_flag"]).sum()),
            "high_value_legitimate_mean_score": float(df[high_val_mask]["geospatial_anomaly_score"].mean()) if high_val_mask.sum() > 0 else 0.0,
            "weather_delay_total": int(weather_mask.sum()),
            "weather_delay_flagged": int((weather_mask & df["geospatial_anomaly_flag"]).sum()),
            "weather_delay_mean_score": float(df[weather_mask]["geospatial_anomaly_score"].mean()) if weather_mask.sum() > 0 else 0.0,
        }

        scenarios = {}
        for sc_name, sc_df in df.groupby("scenario_type"):
            sc_count = len(sc_df)
            flagged = int(sc_df["geospatial_anomaly_flag"].sum())
            top10_count = int((sc_df["geospatial_anomaly_percentile"] >= 90.0).sum())
            scenarios[str(sc_name)] = {
                "total_projects": sc_count,
                "is_fraud_scenario": bool(sc_df["is_fraud"].iloc[0] == 1),
                "is_hard_negative_scenario": bool(sc_df["is_hard_negative"].iloc[0] == 1),
                "mean_anomaly_score": float(sc_df["geospatial_anomaly_score"].mean()),
                "median_anomaly_score": float(sc_df["geospatial_anomaly_score"].median()),
                "flagged_top5_count": flagged,
                "flagged_top5_pct": float(flagged / sc_count * 100.0),
                "top10_count": top10_count,
                "top10_pct": float(top10_count / sc_count * 100.0),
            }

        # Baseline comparison
        baseline_comparison = {}
        if baseline1_scores is not None:
            b1_scores, b1_pcts, b1_flags = baseline1_scores
            df_b1 = df.copy()
            df_b1["b1_score"] = b1_scores
            top50 = df_b1.sort_values(by="b1_score", ascending=False).head(50)
            top250 = df_b1.sort_values(by="b1_score", ascending=False).head(250)
            top500 = df_b1.sort_values(by="b1_score", ascending=False).head(500)
            baseline_comparison["baseline_1_spatial_cost_cluster_deviation"] = {
                "top_1_pct_fraud_rate": float(top50["is_fraud"].mean()),
                "top_5_pct_fraud_rate": float(top250["is_fraud"].mean()),
                "top_10_pct_fraud_rate": float(top500["is_fraud"].mean()),
                "top_10_enrichment": float(top500["is_fraud"].mean() / base_fraud_rate) if base_fraud_rate > 0 else 1.0,
            }

        if baseline2_scores is not None:
            b2_scores, b2_pcts, b2_flags = baseline2_scores
            df_b2 = df.copy()
            df_b2["b2_score"] = b2_scores
            top50 = df_b2.sort_values(by="b2_score", ascending=False).head(50)
            top250 = df_b2.sort_values(by="b2_score", ascending=False).head(250)
            top500 = df_b2.sort_values(by="b2_score", ascending=False).head(500)
            baseline_comparison["baseline_2_multi_attribute_spatial_heuristic"] = {
                "top_1_pct_fraud_rate": float(top50["is_fraud"].mean()),
                "top_5_pct_fraud_rate": float(top250["is_fraud"].mean()),
                "top_10_pct_fraud_rate": float(top500["is_fraud"].mean()),
                "top_10_enrichment": float(top500["is_fraud"].mean() / base_fraud_rate) if base_fraud_rate > 0 else 1.0,
            }

        top50_m = df.sort_values(by="geospatial_anomaly_score", ascending=False).head(50)
        top250_m = df.sort_values(by="geospatial_anomaly_score", ascending=False).head(250)
        top500_m = df.sort_values(by="geospatial_anomaly_score", ascending=False).head(500)
        baseline_comparison["setu_stage_2c_geospatial_isolation_forest"] = {
            "top_1_pct_fraud_rate": float(top50_m["is_fraud"].mean()),
            "top_5_pct_fraud_rate": float(top250_m["is_fraud"].mean()),
            "top_10_pct_fraud_rate": float(top500_m["is_fraud"].mean()),
            "top_10_enrichment": float(top500_m["is_fraud"].mean() / base_fraud_rate) if base_fraud_rate > 0 else 1.0,
        }

        return {
            "distribution": distribution,
            "fraud_enrichment": fraud_enrichment,
            "hard_negatives": hard_negatives,
            "scenarios": scenarios,
            "baseline_comparison": baseline_comparison,
        }
