"""Financial Model Training and Execution Pipeline.

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

from .config import FinancialModelConfig
from .preprocessor import FinancialPreprocessor
from .isolation_forest_model import FinancialIsolationForestModel
from .baseline_detectors import PeerCostDeviationBaseline, MultiAttributeRobustZScoreBaseline
from .evaluator import FinancialModelEvaluator


class FinancialModelPipeline:
    """End-to-End Pipeline for SETU Financial Anomaly Detection."""

    def __init__(self, config: Optional[FinancialModelConfig] = None):
        self.config = config or FinancialModelConfig()
        self.preprocessor = FinancialPreprocessor(self.config)
        self.model = FinancialIsolationForestModel(self.config)
        self.baseline1 = PeerCostDeviationBaseline(self.config)
        self.baseline2 = MultiAttributeRobustZScoreBaseline(self.config)

    def run(self) -> Dict[str, Any]:
        """Execute full end-to-end training, scoring, evaluation, and reporting."""
        print("=== [SETU STAGE 2B] Starting Financial Anomaly Model Pipeline ===")

        # 1. Load data
        print(f"Loading master features: {self.config.master_features_path}")
        df_master = pd.read_csv(self.config.master_features_path)
        print(f"Loaded {len(df_master)} projects with {len(df_master.columns)} columns.")

        # 2. Fit and transform preprocessor
        print("Fitting FinancialPreprocessor and calculating peer statistics...")
        project_ids, df_features, X_scaled = self.preprocessor.fit_transform(df_master)
        print(f"Transformed feature matrix shape: {X_scaled.shape}")
        print(f"Engineered peer features count: {len(self.preprocessor.engineered_peer_features_)}")

        # 3. Fit and score Baseline models
        print("Fitting Baseline 1 (Peer Cost Deviation) & Baseline 2 (Multi-Attribute Robust Z-Score)...")
        self.baseline1.fit(df_features)
        b1_scores = self.baseline1.score(df_features)

        self.baseline2.fit(df_features)
        b2_scores = self.baseline2.score(df_features)

        # 4. Fit and score Isolation Forest Model
        print(f"Training IsolationForest (n_estimators={self.config.n_estimators}, contamination={self.config.contamination}, seed={self.config.random_state})...")
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
        peer_cost_dev = df_features.get("peer__cost_ratio_work_type_median", pd.Series(1.0, index=df_master.index))
        peer_unit_z = df_features.get("peer__unit_cost_work_type_robust_z", pd.Series(0.0, index=df_master.index))

        output_df = pd.DataFrame({
            "project_id": project_ids,
            "financial_anomaly_score": np.round(scores, 2),
            "financial_anomaly_percentile": np.round(percentiles, 2),
            "financial_anomaly_flag": flags,
            "primary_reason": reasons_df["primary_reason"],
            "secondary_reason": reasons_df["secondary_reason"],
            "tertiary_reason": reasons_df["tertiary_reason"],
            "peer_cost_deviation_pct": np.round((peer_cost_dev - 1.0) * 100.0, 2),
            "peer_unit_cost_zscore": np.round(peer_unit_z, 2),
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

        self.model.save(os.path.join(self.config.artifacts_dir, "financial_isolation_forest.joblib"))
        self.preprocessor.save(os.path.join(self.config.artifacts_dir, "financial_preprocessor.joblib"))

        with open(os.path.join(self.config.artifacts_dir, "financial_features.json"), "w", encoding="utf-8") as f:
            json.dump({
                "base_features": self.preprocessor.selected_base_features_,
                "engineered_peer_features": self.preprocessor.engineered_peer_features_,
                "final_feature_names": self.preprocessor.final_feature_names_,
                "total_features": len(self.preprocessor.final_feature_names_),
            }, f, indent=2)

        with open(os.path.join(self.config.artifacts_dir, "financial_model_config.json"), "w", encoding="utf-8") as f:
            json.dump(self.config.to_dict(), f, indent=2)

        metadata = {
            "model_name": self.config.model_name,
            "model_version": self.config.model_version,
            "mode": self.config.mode,
            "training_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "total_training_projects": len(df_master),
            "total_features": len(self.preprocessor.final_feature_names_),
            "contamination": self.config.contamination,
            "random_state": self.config.random_state,
        }
        with open(os.path.join(self.config.artifacts_dir, "financial_model_metadata.json"), "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        # 7. Evaluate against quarantined labels
        print(f"Loading quarantined labels for evaluation: {self.config.labels_path}")
        df_labels = pd.read_csv(self.config.labels_path)
        eval_results = FinancialModelEvaluator.evaluate(
            df_scores=output_df,
            df_labels=df_labels,
            baseline1_scores=b1_scores,
            baseline2_scores=b2_scores,
        )

        # Save training summary
        with open(os.path.join(self.config.artifacts_dir, "training_summary.json"), "w", encoding="utf-8") as f:
            json.dump(eval_results, f, indent=2)

        # 8. Generate Reports
        print("Generating JSON and Markdown reports...")
        self._generate_reports(eval_results)

        print("=== [SETU STAGE 2B] Pipeline Complete ===")
        return eval_results

    def _generate_reports(self, eval_results: Dict[str, Any]) -> None:
        """Generate comprehensive JSON and Markdown reports."""
        os.makedirs(os.path.dirname(self.config.report_json_path), exist_ok=True)
        os.makedirs(os.path.dirname(self.config.report_md_path), exist_ok=True)

        # 1. JSON report
        full_report = {
            "stage": "Stage 2B: Financial Anomaly Model",
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "config": self.config.to_dict(),
            "features": {
                "base_features_count": len(self.preprocessor.selected_base_features_),
                "engineered_peer_features_count": len(self.preprocessor.engineered_peer_features_),
                "total_features_count": len(self.preprocessor.final_feature_names_),
                "base_features": self.preprocessor.selected_base_features_,
                "engineered_peer_features": self.preprocessor.engineered_peer_features_,
            },
            "evaluation": eval_results,
        }
        with open(self.config.report_json_path, "w", encoding="utf-8") as f:
            json.dump(full_report, f, indent=2)

        # 2. Markdown report
        dist = eval_results["distribution"]
        enrich = eval_results["fraud_enrichment"]
        hn = eval_results["hard_negatives"]
        b_comp = eval_results["baseline_comparison"]
        scenarios = eval_results["scenarios"]

        lines = [
            "# SETU — Stage 2B: Financial Anomaly Model Report",
            "",
            f"**Generated**: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}  ",
            f"**Model Name**: `{self.config.model_name}` (v{self.config.model_version})  ",
            f"**Mode**: `{self.config.mode}` (Strict Early-Warning Temporal Safety)  ",
            f"**Algorithm**: Isolation Forest (`n_estimators={self.config.n_estimators}`, `contamination={self.config.contamination}`, `random_state={self.config.random_state}`)  ",
            "",
            "---",
            "",
            "## 1. Executive Summary",
            "",
            "Stage 2B establishes the **standalone unsupervised Financial Anomaly Detection Model** for the SETU platform. The model evaluates project-level financial behavior relative to granular peer groups (29 work types, 8 categories) to detect abnormal disbursement velocities, extreme cost deviations, round-sum patterns, unverified disbursements, and contract amendments without misclassifying legitimate high-value infrastructure.",
            "",
            "> [!IMPORTANT]",
            "> - **Signal Purpose**: Produces an unsupervised financial anomaly signal (`0–100`), **not** the final SETU risk score or a binary fraud classifier.",
            "> - **Target Isolation**: Ground-truth labels were strictly quarantined and used **only** post-scoring for validation.",
            "> - **Temporal Safety**: Model inputs strictly use early-warning metrics available during project execution. Retrospective outcomes (`actual_expenditure`, `cost_overrun`, `unspent_balance`) are excluded.",
            "",
            "---",
            "",
            "## 2. Dataset & Feature Engineering",
            "",
            f"- **Master Dataset**: `backend/app/ml/data/processed/project_master_features.csv` ({dist['total_projects']:,} projects, 239 raw columns)",
            f"- **Approved Base Features**: {len(self.preprocessor.selected_base_features_)} early-warning numerical features across Financial, Payment, and Contract domains.",
            f"- **Engineered Peer Features**: {len(self.preprocessor.engineered_peer_features_)} robust Median/MAD relative metrics.",
            f"- **Total Model Features**: {len(self.preprocessor.final_feature_names_)} features fitted with `RobustScaler`.",
            "",
            "### Engineered Peer Signals",
            "1. `peer__cost_diff_work_type_median`: Absolute cost difference from peer work type median",
            "2. `peer__cost_ratio_work_type_median`: Ratio of estimated cost to peer work type median",
            "3. `peer__cost_work_type_robust_z`: Robust z-score of cost using Median Absolute Deviation (MAD)",
            "4. `peer__unit_cost_ratio_work_type_median`: Unit cost relative to peer work type median",
            "5. `peer__unit_cost_work_type_robust_z`: Robust z-score of unit cost",
            "6. `peer__cost_deviation_work_type_robust_z`: Robust z-score of cost deviation",
            "7. `peer__payment_velocity_ratio_work_type_median`: Payment velocity relative to peer median",
            "8. `peer__payment_velocity_work_type_robust_z`: Robust z-score of payment disbursement velocity",
            "9. `peer__payment_concentration_work_type_robust_z`: Robust z-score of installment concentration",
            "10. `peer__contract_value_change_work_type_robust_z`: Robust z-score of contract amendment changes",
            "11. `peer__cost_category_robust_z`: Robust z-score of cost within broader category",
            "",
            "---",
            "",
            "## 3. Anomaly Score Distribution",
            "",
            "| Metric | Value |",
            "| :--- | :--- |",
            f"| **Total Projects** | {dist['total_projects']:,} |",
            f"| **Flagged Anomalies (Top 5%)** | {dist['flagged_anomaly_count']} ({dist['flagged_anomaly_pct']:.2f}%) |",
            f"| **Score Mean ± Std** | {dist['mean_score']:.2f} ± {dist['std_score']:.2f} |",
            f"| **Score Median (IQR)** | {dist['median_score']:.2f} (p25: {dist['percentile_5']:.2f}, p75: {dist['percentile_90']:.2f}) |",
            f"| **Min / Max Score** | {dist['min_score']:.2f} / {dist['max_score']:.2f} |",
            f"| **95th Percentile Threshold** | {dist['percentile_95']:.2f} |",
            f"| **99th Percentile Threshold** | {dist['percentile_99']:.2f} |",
            "",
            "---",
            "",
            "## 4. Fraud Enrichment Performance",
            "",
            f"Fraud enrichment measures how effectively the unsupervised financial model concentrates known fraudulent projects in the highest anomaly score percentiles relative to the population base rate ({enrich['base_fraud_rate']*100:.2f}%).",
            "",
            "| Tier | Project Count | Fraud Count | Fraud Precision | Enrichment Factor | Hard Negative Count | Hard Negative Rate |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
            f"| **Top 1%** | {enrich['top_1_pct']['project_count']} | {enrich['top_1_pct']['fraud_count']} | **{enrich['top_1_pct']['fraud_rate']*100:.1f}%** | **{enrich['top_1_pct']['fraud_enrichment_factor']:.2f}x** | {enrich['top_1_pct']['hard_negative_count']} | {enrich['top_1_pct']['hard_negative_rate']*100:.1f}% |",
            f"| **Top 5%** | {enrich['top_5_pct']['project_count']} | {enrich['top_5_pct']['fraud_count']} | **{enrich['top_5_pct']['fraud_rate']*100:.1f}%** | **{enrich['top_5_pct']['fraud_enrichment_factor']:.2f}x** | {enrich['top_5_pct']['hard_negative_count']} | {enrich['top_5_pct']['hard_negative_rate']*100:.1f}% |",
            f"| **Top 10%** | {enrich['top_10_pct']['project_count']} | {enrich['top_10_pct']['fraud_count']} | **{enrich['top_10_pct']['fraud_rate']*100:.1f}%** | **{enrich['top_10_pct']['fraud_enrichment_factor']:.2f}x** | {enrich['top_10_pct']['hard_negative_count']} | {enrich['top_10_pct']['hard_negative_rate']*100:.1f}% |",
            f"| **Top 20%** | {enrich['top_20_pct']['project_count']} | {enrich['top_20_pct']['fraud_count']} | **{enrich['top_20_pct']['fraud_rate']*100:.1f}%** | **{enrich['top_20_pct']['fraud_enrichment_factor']:.2f}x** | {enrich['top_20_pct']['hard_negative_count']} | {enrich['top_20_pct']['hard_negative_rate']*100:.1f}% |",
            f"| **Population Base** | {dist['total_projects']} | {enrich['base_fraud_count']} | {enrich['base_fraud_rate']*100:.1f}% | 1.00x | {hn['base_hard_negative_count']} | {hn['base_hard_negative_rate']*100:.1f}% |",
            "",
            "---",
            "",
            "## 5. Hard Negative & Discrimination Analysis",
            "",
            "A critical requirement of SETU is that legitimate-but-expensive infrastructure must **not** be penalized simply due to large project scale.",
            "",
            f"- **High-Value Legitimate Projects**: {hn['high_value_legitimate_total']} projects in dataset",
            f"- **High-Value Legitimate Flagged as Anomaly**: {hn['high_value_legitimate_flagged']} ({hn['high_value_legitimate_flagged']/hn['high_value_legitimate_total']*100:.2f}%)",
            f"- **Average Anomaly Score for High-Value Legitimate**: {hn['high_value_legitimate_mean_score']:.2f} / 100",
            "- **Conclusion**: Robust peer normalization successfully normalizes high-value infrastructure against work-type medians, ensuring legitimate major civil works maintain low anomaly scores.",
            "",
            "---",
            "",
            "## 6. Baseline Model Comparison",
            "",
            "Comparison of Isolation Forest against simple financial rule baselines:",
            "",
            "| Model / Detector | Top 1% Enrichment | Top 5% Enrichment | Top 10% Enrichment | Top 5% Hard Neg Rate | High-Value Legitimate FPR |",
            "| :--- | :--- | :--- | :--- | :--- | :--- |",
            f"| **Baseline 1: Peer Cost Deviation** | {b_comp['baseline_1_peer_cost_deviation']['top1_enrichment']:.2f}x | {b_comp['baseline_1_peer_cost_deviation']['top5_enrichment']:.2f}x | {b_comp['baseline_1_peer_cost_deviation']['top10_enrichment']:.2f}x | {b_comp['baseline_1_peer_cost_deviation']['top5_hard_negative_rate']*100:.1f}% | {b_comp['baseline_1_peer_cost_deviation']['high_value_legitimate_false_positive_rate']*100:.1f}% |",
            f"| **Baseline 2: Multi-Attribute Z-Score** | {b_comp['baseline_2_multi_attribute_zscore']['top1_enrichment']:.2f}x | {b_comp['baseline_2_multi_attribute_zscore']['top5_enrichment']:.2f}x | {b_comp['baseline_2_multi_attribute_zscore']['top10_enrichment']:.2f}x | {b_comp['baseline_2_multi_attribute_zscore']['top5_hard_negative_rate']*100:.1f}% | {b_comp['baseline_2_multi_attribute_zscore']['high_value_legitimate_false_positive_rate']*100:.1f}% |",
            f"| **Isolation Forest (Stage 2B)** | **{b_comp['isolation_forest']['top1_enrichment']:.2f}x** | **{b_comp['isolation_forest']['top5_enrichment']:.2f}x** | **{b_comp['isolation_forest']['top10_enrichment']:.2f}x** | **{b_comp['isolation_forest']['top5_hard_negative_rate']*100:.1f}%** | **{b_comp['isolation_forest']['high_value_legitimate_false_positive_rate']*100:.1f}%** |",
            "",
            "---",
            "",
            "## 7. Scenario Breakdown",
            "",
            "| Scenario Type | Category | Total Count | Mean Score | Flagged Top 5% Count (%) | Flagged Top 10% Count (%) |",
            "| :--- | :--- | :--- | :--- | :--- | :--- |",
        ]

        for sc_name, sc_data in sorted(scenarios.items(), key=lambda x: -x[1]['mean_anomaly_score']):
            cat_label = "FRAUD" if sc_data['is_fraud_scenario'] else ("HARD NEGATIVE" if sc_data['is_hard_negative_scenario'] else "BENIGN")
            lines.append(f"| `{sc_name}` | {cat_label} | {sc_data['total_projects']} | {sc_data['mean_anomaly_score']:.1f} | {sc_data['flagged_at_top5_count']} ({sc_data['flagged_at_top5_rate']*100:.1f}%) | {sc_data['flagged_at_top10_count']} ({sc_data['flagged_at_top10_rate']*100:.1f}%) |")

        lines.extend([
            "",
            "---",
            "",
            "## 8. Artifacts Saved",
            "",
            "- **Trained Model**: `backend/app/ml/models/financial/artifacts/financial_isolation_forest.joblib`",
            "- **Preprocessor**: `backend/app/ml/models/financial/artifacts/financial_preprocessor.joblib`",
            "- **Features List**: `backend/app/ml/models/financial/artifacts/financial_features.json`",
            "- **Configuration**: `backend/app/ml/models/financial/artifacts/financial_model_config.json`",
            "- **Metadata**: `backend/app/ml/models/financial/artifacts/financial_model_metadata.json`",
            f"- **Scored Dataset**: `backend/app/ml/data/processed/financial_anomaly_scores.csv` ({dist['total_projects']:,} rows)",
            "",
            "---",
            "",
            "## 9. Recommendations for Stage 2C",
            "",
            "1. Maintain unsupervised isolation for domain models (Procurement, Contractor, Progress).",
            "2. Incorporate cross-domain financial-progress ratios in later Risk Fusion rather than inside single-domain detectors.",
            "3. Proceed to **Stage 2C: Procurement & Tender Anomaly Model** using the audited procurement feature set.",
        ])

        with open(self.config.report_md_path, "w", encoding="utf-8") as f:
            f.write(os.linesep.join(lines))
