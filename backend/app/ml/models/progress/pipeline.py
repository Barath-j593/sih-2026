"""
SETU — Stage 2G: Progress vs. Execution Trajectory Model Pipeline.

End-to-end pipeline:
1. Ingests master feature store (5,000 projects).
2. Fits ProgressPreprocessor (divergence penalty, ghost work, stall, peer MADs).
3. Fits Baseline Detectors (Divergence rule, Multi-Attribute heuristic).
4. Trains ProgressAnomalyModel (Isolation Forest).
5. Generates calibrated 0-100 scores and explainable reason traces.
6. Serializes production artifacts to artifacts/ directory.
7. Evaluates performance against quarantined labels and exports markdown/json reports.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from scipy.stats import rankdata

from app.ml.models.progress.config import ProgressModelConfig
from app.ml.models.progress.preprocessor import ProgressPreprocessor
from app.ml.models.progress.baseline_detectors import (
    DivergenceRuleBaseline,
    MultiAttributeProgressHeuristic,
)
from app.ml.models.progress.progress_model import ProgressAnomalyModel
from app.ml.models.progress.evaluator import ProgressEvaluator


class ProgressModelPipeline:
    """Orchestrates end-to-end training, scoring, artifact generation, and evaluation."""

    def __init__(self, config: Optional[ProgressModelConfig] = None):
        self.config = config or ProgressModelConfig()
        self.preprocessor = ProgressPreprocessor(self.config)
        self.model = ProgressAnomalyModel(self.config)
        self.baseline1 = DivergenceRuleBaseline(self.config)
        self.baseline2 = MultiAttributeProgressHeuristic(self.config)
        self.evaluator = ProgressEvaluator(self.config)

    def run(self) -> pd.DataFrame:
        """Execute the complete progress execution anomaly detection pipeline."""
        print("=== [SETU STAGE 2G] Starting Progress Execution Anomaly Model Pipeline ===")

        # 1. Load canonical master features
        print(f"Loading master features: {self.config.master_features_path}")
        df_master = pd.read_csv(self.config.master_features_path)
        print(f"Loaded {len(df_master)} projects with {len(df_master.columns)} columns.")

        # 2. Fit and transform preprocessor
        print("Fitting ProgressPreprocessor (divergence penalty, ghost work, stall, peer MADs)...")
        self.preprocessor.fit(df_master)
        X_mat = self.preprocessor.transform(df_master)
        feature_names = self.preprocessor.get_feature_names()
        print(f"Transformed feature matrix shape: {X_mat.shape}")

        # 3. Fit baseline models
        print("Fitting Baseline 1 (Divergence Rule) & Baseline 2 (Multi-Attribute Heuristic)...")
        self.baseline1.fit(df_master)
        self.baseline2.fit(df_master)
        b1_scores = self.baseline1.predict_score(df_master)
        b2_scores = self.baseline2.predict_score(df_master)

        # 4. Fit Isolation Forest model
        print(f"Training Progress IsolationForest (n_estimators={self.config.n_estimators}, contamination={self.config.contamination}, seed={self.config.random_state})...")
        self.model.fit(X_mat)
        calibrated_scores = self.model.predict_score(X_mat)
        percentile_ranks = rankdata(calibrated_scores) / len(calibrated_scores) * 100.0
        is_anomaly = (percentile_ranks >= 95.0).astype(int)

        # 5. Generate reason traces
        print("Generating feature-level explainability reason traces...")
        reasons_df = self.model.explain_reasons(df_master, calibrated_scores, threshold=60.0)

        # 6. Assemble output dataset (5000 rows x 14 columns)
        print("Assembling output dataset...")
        gap = df_master.get("progress__financial_minus_physical_progress", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        phys = df_master.get("progress__latest_physical_progress", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        fin = df_master.get("progress__latest_financial_progress", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        overrun_days = df_master.get("progress__duration_overrun_days", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        phys_slope = df_master.get("progress__physical_progress_slope", pd.Series(0.5, index=df_master.index)).fillna(0.5)

        is_ghost = (phys <= self.config.ghost_physical_max).astype(float)
        ghost_index = (fin / 100.0) * is_ghost
        stall_score = np.maximum(0.0, overrun_days / 365.0) * np.exp(-5.0 * np.clip(phys_slope, 0.0, 1.0))

        output_df = pd.DataFrame({
            "project_id": df_master["project_id"],
            "progress_anomaly_score": np.round(calibrated_scores, 2),
            "progress_anomaly_percentile": np.round(percentile_ranks, 2),
            "is_progress_anomaly": is_anomaly,
            "financial_minus_physical_progress": np.round(gap, 2),
            "latest_physical_progress": np.round(phys, 2),
            "latest_financial_progress": np.round(fin, 2),
            "duration_overrun_days": np.round(overrun_days, 1),
            "ghost_work_index": np.round(ghost_index, 4),
            "execution_stall_score": np.round(stall_score, 4),
            "baseline1_score": np.round(b1_scores, 2),
            "primary_reason": reasons_df["primary_reason"],
            "secondary_reason": reasons_df["secondary_reason"],
            "tertiary_reason": reasons_df["tertiary_reason"],
        })

        # Save output scores CSV
        self.config.data_dir.mkdir(parents=True, exist_ok=True)
        output_df.to_csv(self.config.output_scores_path, index=False)
        print(f"Saved output dataset: {self.config.output_scores_path} ({len(output_df)} rows)")

        # 7. Serialize artifacts
        print(f"Saving model artifacts to: {self.config.artifacts_dir}")
        self.config.artifacts_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model.estimator, self.config.artifacts_dir / "progress_isolation_forest.joblib")
        joblib.dump(self.preprocessor, self.config.artifacts_dir / "progress_preprocessor.joblib")

        with open(self.config.artifacts_dir / "progress_features.json", "w", encoding="utf-8") as f:
            json.dump({"features": feature_names, "count": len(feature_names)}, f, indent=2)

        with open(self.config.artifacts_dir / "progress_model_config.json", "w", encoding="utf-8") as f:
            json.dump({
                "model_name": self.config.model_name,
                "version": self.config.model_version,
                "mode": self.config.mode,
                "n_estimators": self.config.n_estimators,
                "contamination": self.config.contamination,
                "random_state": self.config.random_state,
                "divergence_threshold": self.config.divergence_threshold,
                "stall_duration_days": self.config.stall_duration_days,
            }, f, indent=2)

        with open(self.config.artifacts_dir / "progress_model_metadata.json", "w", encoding="utf-8") as f:
            json.dump({
                "trained_at": datetime.now(timezone.utc).isoformat(),
                "n_projects": len(df_master),
                "n_features": len(feature_names),
                "estimator": "IsolationForest",
            }, f, indent=2)

        summary = {
            "p50_score": float(np.percentile(calibrated_scores, 50)),
            "p95_score": float(np.percentile(calibrated_scores, 95)),
            "p99_score": float(np.percentile(calibrated_scores, 99)),
            "flagged_count": int(is_anomaly.sum()),
        }
        with open(self.config.artifacts_dir / "training_summary.json", "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        # 8. Post-hoc evaluation with quarantined labels
        if self.config.labels_path.exists():
            print("Evaluating model performance against quarantined labels...")
            df_labels = pd.read_csv(self.config.labels_path)
            report_data = self.evaluator.evaluate(
                scores_df=output_df,
                labels_df=df_labels,
                baseline1_scores=b1_scores,
                baseline2_scores=b2_scores,
            )
            print("Exporting evaluation reports...")
            json_p, md_p = self.evaluator.export_reports(report_data)
            print(f"Reports saved to {json_p} and {md_p}")

        print("=== [SETU STAGE 2G] Progress Execution Anomaly Model Pipeline Complete ===")
        return output_df


if __name__ == "__main__":
    pipeline = ProgressModelPipeline()
    pipeline.run()
