"""
SETU — Stage 2F: Payment Structuring Anomaly Model Pipeline.

End-to-end pipeline:
1. Ingests master feature store (5,000 projects).
2. Fits PaymentPreprocessor (smurfing, unverified, velocity bursts, peer MADs).
3. Fits Baseline Detectors (Unverified & Round rule, Multi-Attribute heuristic).
4. Trains PaymentAnomalyModel (Isolation Forest).
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

from app.ml.models.payment.config import PaymentModelConfig
from app.ml.models.payment.preprocessor import PaymentPreprocessor
from app.ml.models.payment.baseline_detectors import (
    UnverifiedAndRoundPaymentBaseline,
    MultiAttributePaymentHeuristic,
)
from app.ml.models.payment.payment_model import PaymentAnomalyModel
from app.ml.models.payment.evaluator import PaymentEvaluator


class PaymentModelPipeline:
    """Orchestrates end-to-end training, scoring, artifact generation, and evaluation."""

    def __init__(self, config: Optional[PaymentModelConfig] = None):
        self.config = config or PaymentModelConfig()
        self.preprocessor = PaymentPreprocessor(self.config)
        self.model = PaymentAnomalyModel(self.config)
        self.baseline1 = UnverifiedAndRoundPaymentBaseline(self.config)
        self.baseline2 = MultiAttributePaymentHeuristic(self.config)
        self.evaluator = PaymentEvaluator(self.config)

    def run(self) -> pd.DataFrame:
        """Execute the complete payment structuring anomaly detection pipeline."""
        print("=== [SETU STAGE 2F] Starting Payment Structuring Anomaly Model Pipeline ===")

        # 1. Load canonical master features
        print(f"Loading master features: {self.config.master_features_path}")
        df_master = pd.read_csv(self.config.master_features_path)
        print(f"Loaded {len(df_master)} projects with {len(df_master.columns)} columns.")

        # 2. Fit and transform preprocessor
        print("Fitting PaymentPreprocessor (smurfing, unverified, velocity bursts, peer MADs)...")
        self.preprocessor.fit(df_master)
        X_mat = self.preprocessor.transform(df_master)
        feature_names = self.preprocessor.get_feature_names()
        print(f"Transformed feature matrix shape: {X_mat.shape}")

        # 3. Fit baseline models
        print("Fitting Baseline 1 (Unverified & Round Rule) & Baseline 2 (Multi-Attribute Heuristic)...")
        self.baseline1.fit(df_master)
        self.baseline2.fit(df_master)
        b1_scores = self.baseline1.predict_score(df_master)
        b2_scores = self.baseline2.predict_score(df_master)

        # 4. Fit Isolation Forest model
        print(f"Training Payment IsolationForest (n_estimators={self.config.n_estimators}, contamination={self.config.contamination}, seed={self.config.random_state})...")
        self.model.fit(X_mat)
        calibrated_scores = self.model.predict_score(X_mat)
        percentile_ranks = rankdata(calibrated_scores) / len(calibrated_scores) * 100.0
        is_anomaly = (percentile_ranks >= 95.0).astype(int)

        # 5. Generate reason traces
        print("Generating feature-level explainability reason traces...")
        reasons_df = self.model.explain_reasons(df_master, calibrated_scores, threshold=60.0)

        # 6. Assemble output dataset (5000 rows x 14 columns)
        print("Assembling output dataset...")
        sanction = df_master.get("financial__sanctioned_amount", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        max_pay = df_master.get("payment__max_payment", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        unverified_rate = df_master.get("payment__unverified_payment_rate", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        total_paid = df_master.get("payment__total_paid", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        velocity_mean = df_master.get("payment__payment_velocity_mean", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        planned_days = df_master.get("project__planned_duration_days", pd.Series(180.0, index=df_master.index)).fillna(180.0).clip(lower=30.0)
        planned_exp_velocity = sanction / planned_days
        velocity_ratio = velocity_mean / np.maximum(1.0, planned_exp_velocity)
        concentration = df_master.get("payment__payment_concentration_max", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        final_share = df_master.get("payment__final_installment_share", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        lumpiness = concentration * np.maximum(0.0, 1.0 - final_share)
        timing_rate = df_master.get("payment__payment_timing_anomaly_rate", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        timing_count = df_master.get("payment__payment_timing_anomaly_count", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        timing_risk = timing_rate * np.log1p(np.maximum(0.0, timing_count))

        # Smurfing calculation
        smurf_scores = np.zeros(len(df_master), dtype=float)
        for t in self.config.smurfing_thresholds:
            for s in [sanction, max_pay]:
                vals = s.to_numpy()
                in_win = (vals >= t * (1.0 - self.config.smurfing_window_pct)) & (vals <= t)
                if np.any(in_win):
                    diff = vals[in_win] - t
                    gauss = np.exp(-0.5 * (diff / self.config.smurfing_bandwidth) ** 2)
                    smurf_scores[in_win] = np.maximum(smurf_scores[in_win], gauss)

        output_df = pd.DataFrame({
            "project_id": df_master["project_id"],
            "payment_anomaly_score": np.round(calibrated_scores, 2),
            "payment_anomaly_percentile": np.round(percentile_ranks, 2),
            "is_payment_anomaly": is_anomaly,
            "payment_unverified_rate": np.round(unverified_rate, 4),
            "payment_unverified_exposure": np.round(unverified_rate * total_paid, 2),
            "payment_smurfing_score": np.round(smurf_scores, 4),
            "payment_velocity_ratio": np.round(velocity_ratio, 4),
            "payment_lumpiness_index": np.round(lumpiness, 4),
            "payment_timing_risk": np.round(timing_risk, 4),
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
        joblib.dump(self.model.estimator, self.config.artifacts_dir / "payment_isolation_forest.joblib")
        joblib.dump(self.preprocessor, self.config.artifacts_dir / "payment_preprocessor.joblib")

        with open(self.config.artifacts_dir / "payment_features.json", "w", encoding="utf-8") as f:
            json.dump({"features": feature_names, "count": len(feature_names)}, f, indent=2)

        with open(self.config.artifacts_dir / "payment_model_config.json", "w", encoding="utf-8") as f:
            json.dump({
                "model_name": self.config.model_name,
                "version": self.config.model_version,
                "mode": self.config.mode,
                "n_estimators": self.config.n_estimators,
                "contamination": self.config.contamination,
                "random_state": self.config.random_state,
                "smurfing_thresholds": self.config.smurfing_thresholds,
                "smurfing_bandwidth": self.config.smurfing_bandwidth,
            }, f, indent=2)

        with open(self.config.artifacts_dir / "payment_model_metadata.json", "w", encoding="utf-8") as f:
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

        print("=== [SETU STAGE 2F] Payment Structuring Anomaly Model Pipeline Complete ===")
        return output_df


if __name__ == "__main__":
    pipeline = PaymentModelPipeline()
    pipeline.run()
