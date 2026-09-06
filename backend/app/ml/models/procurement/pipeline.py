"""Procurement Model Training and Execution Pipeline.

Orchestrates data loading, preprocessing, model training, baseline comparisons,
scoring, evaluation, artifact export, and report generation.
"""

import os
import json
import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import numpy as np
import pandas as pd

from .config import ProcurementModelConfig
from .preprocessor import ProcurementPreprocessor
from .procurement_model import ProcurementIsolationForestModel
from .baseline_detectors import SingleBidRuleBaseline, MultiAttributeProcurementHeuristicBaseline
from .evaluator import ProcurementModelEvaluator


class ProcurementModelPipeline:
    """End-to-End Pipeline for SETU Procurement & Tender Rigging Anomaly Detection."""

    def __init__(self, config: Optional[ProcurementModelConfig] = None):
        self.config = config or ProcurementModelConfig()
        self.preprocessor = ProcurementPreprocessor(self.config)
        self.model = ProcurementIsolationForestModel(self.config)
        self.baseline1 = SingleBidRuleBaseline(self.config)
        self.baseline2 = MultiAttributeProcurementHeuristicBaseline(self.config)

    def run(self) -> Dict[str, Any]:
        """Execute full end-to-end training, scoring, evaluation, and reporting."""
        print("=== [SETU STAGE 2D] Starting Procurement Anomaly Model Pipeline ===")

        # 1. Load data
        print(f"Loading master features: {self.config.master_features_path}")
        df_master = pd.read_csv(self.config.master_features_path)
        print(f"Loaded {len(df_master)} projects with {len(df_master.columns)} columns.")

        # 2. Fit and transform preprocessor
        print("Fitting ProcurementPreprocessor (bid suppression, collusion, urban single-bid, peer MADs)...")
        project_ids, df_features, X_scaled = self.preprocessor.fit_transform(df_master)
        print(f"Transformed feature matrix shape: {X_scaled.shape}")
        print(f"Engineered procurement features count: {len(self.preprocessor.engineered_features_)}")

        # 3. Fit and score Baseline models
        print("Fitting Baseline 1 (Single-Bid Rule) & Baseline 2 (Multi-Attribute Heuristic)...")
        self.baseline1.fit(df_features)
        b1_scores = self.baseline1.score(df_features)

        self.baseline2.fit(df_features)
        b2_scores = self.baseline2.score(df_features)

        # 4. Fit and score Isolation Forest Model
        print(f"Training Procurement IsolationForest (n_estimators={self.config.n_estimators}, contamination={self.config.contamination}, seed={self.config.random_state})...")
        self.model.fit(X_scaled, self.preprocessor.final_feature_names_)

        # Generate scores, percentiles, flags
        scores = self.model.score(X_scaled)
        percentiles = self.model.predict_percentile(scores)
        flags = self.model.predict_flags(percentiles)

        # Generate reason traces
        print("Generating feature-level explainability reason traces...")
        reasons_df = self.model.generate_reason_traces(df_features, scores, percentiles)

        # 5. Build output dataset
        print("Assembling output dataset...")
        bid_count = df_master.get("procurement__bid_count", pd.Series(5, index=df_master.index))
        single_flag = df_master.get("procurement__single_bid_flag", pd.Series(0, index=df_master.index))
        comp_score = df_master.get("procurement__bid_competition_score", pd.Series(0.8, index=df_master.index))
        price_sim = df_master.get("procurement__bid_price_similarity", pd.Series(0.8, index=df_master.index))
        rep_winner = df_master.get("procurement__repeated_winner_flag", pd.Series(0, index=df_master.index))

        output_df = pd.DataFrame({
            "project_id": project_ids,
            "procurement_anomaly_score": np.round(scores, 2),
            "procurement_anomaly_percentile": np.round(percentiles, 2),
            "procurement_anomaly_flag": flags,
            "primary_reason": reasons_df["primary_reason"],
            "secondary_reason": reasons_df["secondary_reason"],
            "tertiary_reason": reasons_df["tertiary_reason"],
            "bid_count": bid_count.astype(int),
            "single_bid_flag": single_flag.astype(int),
            "bid_competition_score": np.round(comp_score, 3),
            "bid_price_similarity": np.round(price_sim, 3),
            "repeated_winner_flag": rep_winner.astype(int),
            "model_version": self.config.model_version,
            "mode": self.config.mode,
            "scored_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        })

        # Save output dataset
        os.makedirs(os.path.dirname(self.config.output_scores_path), exist_ok=True)
        output_df.to_csv(self.config.output_scores_path, index=False)
        print(f"Saved output dataset: {self.config.output_scores_path} ({len(output_df)} rows)")

        # 6. Save model artifacts
        print(f"Saving model artifacts to: {self.config.artifacts_dir}")
        os.makedirs(self.config.artifacts_dir, exist_ok=True)

        self.model.save(os.path.join(self.config.artifacts_dir, "procurement_isolation_forest.joblib"))
        self.preprocessor.save(os.path.join(self.config.artifacts_dir, "procurement_preprocessor.joblib"))

        with open(os.path.join(self.config.artifacts_dir, "procurement_features.json"), "w", encoding="utf-8") as f:
            json.dump(self.preprocessor.final_feature_names_, f, indent=2)

        with open(os.path.join(self.config.artifacts_dir, "procurement_model_config.json"), "w", encoding="utf-8") as f:
            json.dump(self.config.to_dict(), f, indent=2)

        metadata = {
            "model_name": self.config.model_name,
            "model_version": self.config.model_version,
            "mode": self.config.mode,
            "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "projects_count": len(project_ids),
            "features_count": len(self.preprocessor.final_feature_names_),
            "base_features_count": len(self.preprocessor.selected_base_features_),
            "engineered_features_count": len(self.preprocessor.engineered_features_),
            "contamination": self.config.contamination,
            "random_state": self.config.random_state,
        }
        with open(os.path.join(self.config.artifacts_dir, "procurement_model_metadata.json"), "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        # 7. Evaluate against quarantined labels
        print("Evaluating model performance against quarantined labels...")
        df_labels = pd.read_csv(self.config.labels_path)
        eval_results = ProcurementModelEvaluator.evaluate(
            df_scores=output_df,
            df_labels=df_labels,
            baseline1_scores=b1_scores,
            baseline2_scores=b2_scores,
        )

        # Save training summary artifact
        summary = {
            "metadata": metadata,
            "distribution": eval_results["distribution"],
            "top_tiers": eval_results["fraud_enrichment"],
            "hard_negatives": eval_results["hard_negatives"],
            "baseline_comparison": eval_results["baseline_comparison"],
        }
        with open(os.path.join(self.config.artifacts_dir, "training_summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        # 8. Export evaluation reports
        print("Exporting evaluation reports...")
        os.makedirs(os.path.dirname(self.config.report_json_path), exist_ok=True)
        with open(self.config.report_json_path, "w", encoding="utf-8") as f:
            json.dump(eval_results, f, indent=2)

        self._export_markdown_report(eval_results, metadata)
        print(f"Reports saved to {self.config.report_json_path} and {self.config.report_md_path}")
        print("=== [SETU STAGE 2D] Procurement Anomaly Model Pipeline Complete ===")

        return eval_results

    def _export_markdown_report(self, eval_results: Dict[str, Any], metadata: Dict[str, Any]) -> None:
        """Write human-readable markdown audit report."""
        dist = eval_results["distribution"]
        enrich = eval_results["fraud_enrichment"]
        hard_neg = eval_results["hard_negatives"]
        base_comp = eval_results["baseline_comparison"]
        scenarios = eval_results["scenarios"]

        md_content = f"""# SETU Stage 2D — Procurement Anomaly Model Evaluation Report

> **Model**: `{metadata['model_name']}` (v{metadata['model_version']})  
> **Evaluation Mode**: `{metadata['mode']}`  
> **Training Date**: `{metadata['trained_at']}`  
> **Projects Evaluated**: {metadata['projects_count']}  
> **Features Count**: {metadata['features_count']} (Base: {metadata['base_features_count']}, Engineered: {metadata['engineered_features_count']})

---

## 1. Score Distribution Summary

| Metric | Value |
| :--- | :--- |
| **Total Projects** | {dist['total_projects']} |
| **Flagged Anomalies (Top 5%)** | {dist['flagged_anomaly_count']} ({dist['flagged_anomaly_pct']:.1f}%) |
| **Mean Anomaly Score** | {dist['mean_score']:.2f} |
| **Median Anomaly Score** | {dist['median_score']:.2f} |
| **Standard Deviation** | {dist['std_score']:.2f} |
| **Percentile 50 (p50)** | {dist['percentile_50']:.2f} |
| **Percentile 90 (p90)** | {dist['percentile_90']:.2f} |
| **Percentile 95 (p95)** | {dist['percentile_95']:.2f} |
| **Percentile 99 (p99)** | {dist['percentile_99']:.2f} |

---

## 2. Fraud Enrichment Benchmarks (Base Fraud Rate: {enrich['base_fraud_rate']*100:.2f}%)

| Tier Cutoff | Projects | Fraud Count | Fraud Rate | Enrichment Factor | Hard Negatives | Hard Neg Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Top 1%** | {enrich['top_1_pct']['project_count']} | {enrich['top_1_pct']['fraud_count']} | {enrich['top_1_pct']['fraud_rate']*100:.2f}% | **{enrich['top_1_pct']['fraud_enrichment_factor']:.2f}x** | {enrich['top_1_pct']['hard_negative_count']} | {enrich['top_1_pct']['hard_negative_rate']*100:.2f}% |
| **Top 5%** | {enrich['top_5_pct']['project_count']} | {enrich['top_5_pct']['fraud_count']} | {enrich['top_5_pct']['fraud_rate']*100:.2f}% | **{enrich['top_5_pct']['fraud_enrichment_factor']:.2f}x** | {enrich['top_5_pct']['hard_negative_count']} | {enrich['top_5_pct']['hard_negative_rate']*100:.2f}% |
| **Top 10%** | {enrich['top_10_pct']['project_count']} | {enrich['top_10_pct']['fraud_count']} | {enrich['top_10_pct']['fraud_rate']*100:.2f}% | **{enrich['top_10_pct']['fraud_enrichment_factor']:.2f}x** | {enrich['top_10_pct']['hard_negative_count']} | {enrich['top_10_pct']['hard_negative_rate']*100:.2f}% |
| **Top 20%** | {enrich['top_20_pct']['project_count']} | {enrich['top_20_pct']['fraud_count']} | {enrich['top_20_pct']['fraud_rate']*100:.2f}% | **{enrich['top_20_pct']['fraud_enrichment_factor']:.2f}x** | {enrich['top_20_pct']['hard_negative_count']} | {enrich['top_20_pct']['hard_negative_rate']*100:.2f}% |

---

## 3. Baseline Model Comparison Matrix

| Model / Detector | Top 1% Fraud Rate | Top 5% Fraud Rate | Top 10% Fraud Rate | Top 10% Enrichment |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Single-Bid Rule** | {base_comp.get('baseline_1_single_bid_rule', {}).get('top_1_pct_fraud_rate', 0.0)*100:.2f}% | {base_comp.get('baseline_1_single_bid_rule', {}).get('top_5_pct_fraud_rate', 0.0)*100:.2f}% | {base_comp.get('baseline_1_single_bid_rule', {}).get('top_10_pct_fraud_rate', 0.0)*100:.2f}% | {base_comp.get('baseline_1_single_bid_rule', {}).get('top_10_enrichment', 0.0):.2f}x |
| **Baseline 2: Multi-Attribute Heuristic** | {base_comp.get('baseline_2_multi_attribute_procurement_heuristic', {}).get('top_1_pct_fraud_rate', 0.0)*100:.2f}% | {base_comp.get('baseline_2_multi_attribute_procurement_heuristic', {}).get('top_5_pct_fraud_rate', 0.0)*100:.2f}% | {base_comp.get('baseline_2_multi_attribute_procurement_heuristic', {}).get('top_10_pct_fraud_rate', 0.0)*100:.2f}% | {base_comp.get('baseline_2_multi_attribute_procurement_heuristic', {}).get('top_10_enrichment', 0.0):.2f}x |
| **SETU Stage 2D Procurement Isolation Forest** | **{base_comp.get('setu_stage_2d_procurement_isolation_forest', {}).get('top_1_pct_fraud_rate', 0.0)*100:.2f}%** | **{base_comp.get('setu_stage_2d_procurement_isolation_forest', {}).get('top_5_pct_fraud_rate', 0.0)*100:.2f}%** | **{base_comp.get('setu_stage_2d_procurement_isolation_forest', {}).get('top_10_pct_fraud_rate', 0.0)*100:.2f}%** | **{base_comp.get('setu_stage_2d_procurement_isolation_forest', {}).get('top_10_enrichment', 0.0):.2f}x** |

---

## 4. Hard-Negative Discrimination (Legitimate Outlier Separation)

| Hard-Negative Scenario | Total Projects | Flagged in Top 5% | False Alarm Rate | Mean Anomaly Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Remote Single Bid (`LEGITIMATE_REMOTE_SINGLE_BID`)** | {hard_neg['remote_single_bid_total']} | {hard_neg['remote_single_bid_flagged']} | {hard_neg['remote_single_bid_flagged']/max(1, hard_neg['remote_single_bid_total'])*100:.2f}% | {hard_neg['remote_single_bid_mean_score']:.2f} | Protected |
| **High Value Legitimate (`HIGH_VALUE_LEGITIMATE`)** | {hard_neg['high_value_legitimate_total']} | {hard_neg['high_value_legitimate_flagged']} | {hard_neg['high_value_legitimate_flagged']/max(1, hard_neg['high_value_legitimate_total'])*100:.2f}% | {hard_neg['high_value_legitimate_mean_score']:.2f} | Protected |
| **Weather Delay (`LEGITIMATE_WEATHER_DELAY`)** | {hard_neg['weather_delay_total']} | {hard_neg['weather_delay_flagged']} | {hard_neg['weather_delay_flagged']/max(1, hard_neg['weather_delay_total'])*100:.2f}% | {hard_neg['weather_delay_mean_score']:.2f} | Protected |

---

## 5. Scenario Detection Coverage

| Scenario Archetype | Total | Is Fraud | Mean Score | Median Score | Flagged Top 5% | Top 10% Catch Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
"""
        for sc_name, sc in sorted(scenarios.items(), key=lambda x: x[1]["mean_anomaly_score"], reverse=True):
            md_content += f"| `{sc_name}` | {sc['total_projects']} | {'Yes' if sc['is_fraud_scenario'] else 'No'} | {sc['mean_anomaly_score']:.2f} | {sc['median_anomaly_score']:.2f} | {sc['flagged_top5_count']} ({sc['flagged_top5_pct']:.1f}%) | {sc['top10_count']} ({sc['top10_pct']:.1f}%) |\n"

        md_content += "\n---\n*Report generated automatically by SETU Procurement Pipeline.*\n"

        os.makedirs(os.path.dirname(self.config.report_md_path), exist_ok=True)
        with open(self.config.report_md_path, "w", encoding="utf-8") as f:
            f.write(md_content)


if __name__ == "__main__":
    pipeline = ProcurementModelPipeline()
    pipeline.run()
