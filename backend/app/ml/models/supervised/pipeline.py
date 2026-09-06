"""End-to-End Execution Pipeline for Stage 3 Supervised Fraud Predictor.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from typing import Optional

# Ensure backend directory is in sys.path when run directly
backend_dir = Path(__file__).resolve().parents[4]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import joblib
import numpy as np
import pandas as pd

from app.ml.models.supervised.config import SupervisedModelConfig
from app.ml.models.supervised.evaluator import SupervisedEvaluator
from app.ml.models.supervised.preprocessor import SupervisedDataPreprocessor
from app.ml.models.supervised.supervised_model import SupervisedFraudClassifier


class SupervisedModelPipeline:
    """Orchestrates end-to-end data loading, cross-validation, production training, artifact serialization, and reporting."""

    def __init__(self, config: Optional[SupervisedModelConfig] = None):
        self.config = config or SupervisedModelConfig()
        self.preprocessor = SupervisedDataPreprocessor(self.config)
        self.evaluator = SupervisedEvaluator(self.config)
        self.model = SupervisedFraudClassifier(self.config)

    def run(self) -> pd.DataFrame:
        """Execute full training, evaluation, and serialization pipeline."""
        print("=== Step 1: Loading Intermediate Scores and Project Context ===")
        scores_df = self.preprocessor.load_intermediate_scores()
        context_df = self.preprocessor.load_master_context()
        assembled_df = self.preprocessor.assemble_feature_matrix(scores_df, context_df)
        print(f"Assembled feature matrix shape: {assembled_df.shape}")

        print("=== Step 2: Ingesting Labels (Quarantine Lifted for Supervised Stage 3) ===")
        labels_path = self.config.data_dir / self.config.labels_file
        labels_df = pd.read_csv(labels_path)
        full_df = assembled_df.merge(labels_df, on="project_id", how="inner")
        print(f"Full dataset merged with labels: {full_df.shape}")

        y_binary = full_df["is_fraud"].values
        y_typology = full_df["scenario_type"].values

        print("=== Step 3: Fitting Preprocessor ===")
        self.preprocessor.fit(full_df)
        X = self.preprocessor.transform(full_df)
        feature_names = self.preprocessor.feature_names_
        print(f"Transformed matrix X shape: {X.shape}, Features: {len(feature_names)}")

        print("=== Step 4: Performing 5-Fold Stratified Cross-Validation ===")
        cv_results = self.evaluator.evaluate_cross_validation(
            X=X,
            y=y_binary,
            feature_names=feature_names,
            labels_df=labels_df,
        )
        print(f"OOF ROC-AUC: {cv_results['oof_roc_auc']:.4f}")
        print(f"OOF PR-AUC: {cv_results['oof_pr_auc']:.4f}")
        print(
            f"Top 1% Fraud Enrichment: {cv_results['enrichment']['top_1pct']['enrichment_factor']}x "
            f"({cv_results['enrichment']['top_1pct']['fraud_purity']*100:.1f}%)"
        )
        print(
            f"Hard Negative FPR: {cv_results['hard_negative_evaluation']['false_positive_rate']*100:.2f}% "
            f"({cv_results['hard_negative_evaluation']['flagged_count']}/{cv_results['hard_negative_evaluation']['total_hard_negatives']})"
        )

        print("=== Step 5: Evaluating Baseline Heuristics ===")
        baseline_results = self.evaluator.evaluate_baselines(
            features_df=full_df,
            y=y_binary,
            model_oof_probs=cv_results["oof_probabilities"],
        )
        print(
            f"ROC Improvement over MaxScore: +{baseline_results['roc_improvement_over_b1']:.4f}, "
            f"WeightedAvg: +{baseline_results['roc_improvement_over_b2']:.4f}"
        )

        print("=== Step 6: Fitting Full Production Ensemble & Booster ===")
        self.model.fit(
            X=X,
            y_binary=y_binary,
            y_typology=y_typology,
            feature_names=feature_names,
        )
        global_importances = self.model.get_global_feature_importances()

        print("=== Step 7: Generating Production Scores and Tree SHAP Explanations ===")
        calibrated_probs = self.model.predict_proba(X)[:, 1]
        predicted_typologies = self.model.predict_typology(
            X=X,
            fraud_probabilities=calibrated_probs,
            threshold=0.50,
        )
        sample_contributions = self.model.explain_sample_contributions(X, top_k=3)

        output_df = pd.DataFrame(
            {
                "project_id": full_df["project_id"],
                "fraud_probability": np.round(calibrated_probs, 4),
                "predicted_typology": predicted_typologies,
                "feature_importance_contributions": [
                    json.dumps(contrib) for contrib in sample_contributions
                ],
                "scored_at": datetime.now(timezone.utc).isoformat(),
            }
        )

        # Output scores file
        output_csv_path = self.config.data_dir / self.config.output_scores_file
        output_df.to_csv(output_csv_path, index=False)
        print(f"Exported production scores to: {output_csv_path} ({len(output_df)} rows)")

        print("=== Step 8: Serializing Artifacts ===")
        self.config.artifacts_dir.mkdir(parents=True, exist_ok=True)

        joblib.dump(self.model, self.config.artifacts_dir / "supervised_fraud_model.joblib")
        joblib.dump(
            self.preprocessor, self.config.artifacts_dir / "supervised_preprocessor.joblib"
        )

        with open(self.config.artifacts_dir / "supervised_features.json", "w") as f:
            json.dump(feature_names, f, indent=2)

        config_dict = {
            "random_state": self.config.random_state,
            "n_splits": self.config.n_splits,
            "n_estimators": self.config.n_estimators,
            "max_depth": self.config.max_depth,
            "learning_rate": self.config.learning_rate,
            "calibration_method": self.config.calibration_method,
            "calibration_cv": self.config.calibration_cv,
            "score_columns": self.config.score_columns,
            "context_columns": self.config.context_columns,
        }
        with open(self.config.artifacts_dir / "supervised_model_config.json", "w") as f:
            json.dump(config_dict, f, indent=2)

        training_summary = {
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "n_samples": len(full_df),
            "n_features": len(feature_names),
            "n_fraud": int(y_binary.sum()),
            "n_normal": int((y_binary == 0).sum()),
            "oof_roc_auc": cv_results["oof_roc_auc"],
            "oof_pr_auc": cv_results["oof_pr_auc"],
            "hard_negative_fpr": cv_results["hard_negative_evaluation"]["false_positive_rate"],
            "top_1pct_enrichment": cv_results["enrichment"]["top_1pct"]["enrichment_factor"],
            "top_5pct_enrichment": cv_results["enrichment"]["top_5pct"]["enrichment_factor"],
        }
        with open(self.config.artifacts_dir / "training_summary.json", "w") as f:
            json.dump(training_summary, f, indent=2)

        metadata = {
            "model_version": "1.0.0",
            "model_family": "XGBoost + Isotonic Calibrated Ensemble",
            "artifacts": [
                "supervised_fraud_model.joblib",
                "supervised_preprocessor.joblib",
                "supervised_features.json",
                "supervised_model_config.json",
                "training_summary.json",
            ],
        }
        with open(self.config.artifacts_dir / "supervised_model_metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        print("=== Step 9: Exporting Audit Reports ===")
        md_path, json_path = self.evaluator.export_reports(
            cv_results=cv_results,
            baseline_results=baseline_results,
            global_importances=global_importances,
        )
        print(f"Generated Markdown report: {md_path}")
        print(f"Generated JSON report: {json_path}")
        print("=== Pipeline Complete! ===")

        return output_df


if __name__ == "__main__":
    pipeline = SupervisedModelPipeline()
    pipeline.run()
