"""
SETU — Stage 2H: Graph & Entity Relationship Model Pipeline.

End-to-end pipeline:
1. Ingests master feature store (5,000 projects).
2. Fits GraphPreprocessor (builds NetworkX graph, computes degree, PageRank, Louvain, HHI).
3. Fits Baseline Detectors (Tripartite Monopoly rule, Multi-Attribute heuristic).
4. Trains GraphAnomalyModel (Isolation Forest).
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

from app.ml.models.graph.config import GraphModelConfig
from app.ml.models.graph.preprocessor import GraphPreprocessor
from app.ml.models.graph.baseline_detectors import (
    TripartiteMonopolyRuleBaseline,
    MultiAttributeGraphHeuristic,
)
from app.ml.models.graph.graph_model import GraphAnomalyModel
from app.ml.models.graph.evaluator import GraphEvaluator


class GraphModelPipeline:
    """Orchestrates end-to-end training, scoring, artifact generation, and evaluation."""

    def __init__(self, config: Optional[GraphModelConfig] = None):
        self.config = config or GraphModelConfig()
        self.preprocessor = GraphPreprocessor(self.config)
        self.model = GraphAnomalyModel(self.config)
        self.baseline1 = TripartiteMonopolyRuleBaseline(self.config)
        self.baseline2 = MultiAttributeGraphHeuristic(self.config)
        self.evaluator = GraphEvaluator(self.config)

    def run(self) -> pd.DataFrame:
        """Execute the complete graph entity relationship anomaly detection pipeline."""
        print("=== [SETU STAGE 2H] Starting Graph Entity Relationship Model Pipeline ===")

        # 1. Load canonical master features
        print(f"Loading master features: {self.config.master_features_path}")
        df_master = pd.read_csv(self.config.master_features_path)
        print(f"Loaded {len(df_master)} projects with {len(df_master.columns)} columns.")

        # 2. Fit and transform preprocessor
        print("Fitting GraphPreprocessor (NetworkX graph, PageRank, Louvain communities, HHI)...")
        self.preprocessor.fit(df_master)
        X_mat = self.preprocessor.transform(df_master)
        feature_names = self.preprocessor.get_feature_names()
        print(f"Transformed feature matrix shape: {X_mat.shape}")

        # 3. Fit baseline models
        print("Fitting Baseline 1 (Tripartite Monopoly Rule) & Baseline 2 (Multi-Attribute Heuristic)...")
        self.baseline1.fit(df_master)
        self.baseline2.fit(df_master)
        b1_scores = self.baseline1.predict_score(df_master)
        b2_scores = self.baseline2.predict_score(df_master)

        # 4. Fit Isolation Forest model
        print(f"Training Graph IsolationForest (n_estimators={self.config.n_estimators}, contamination={self.config.contamination}, seed={self.config.random_state})...")
        self.model.fit(X_mat)
        calibrated_scores = self.model.predict_score(X_mat)
        percentile_ranks = rankdata(calibrated_scores) / len(calibrated_scores) * 100.0
        is_anomaly = (percentile_ranks >= 95.0).astype(int)

        # 5. Generate reason traces
        print("Generating feature-level explainability reason traces...")
        reasons_df = self.model.explain_reasons(df_master, calibrated_scores, threshold=60.0)

        # 6. Assemble output dataset (5000 rows x 14 columns)
        print("Assembling output dataset...")
        pair_counts = df_master.groupby(["contractor_id", "agency_id"])["project_id"].transform("count")
        triad_counts = df_master.groupby(["constituency_id", "agency_id", "contractor_id"])["project_id"].transform("count")

        def _calc_hhi(group):
            shares = group.value_counts(normalize=True)
            return float((shares ** 2).sum())

        agency_hhi_map = df_master.groupby("agency_id")["contractor_id"].apply(_calc_hhi).to_dict()
        agency_hhi = df_master["agency_id"].map(agency_hhi_map).fillna(0.0)

        ties = (
            df_master.get("contractor__shared_ownership", pd.Series(0.0, index=df_master.index)).fillna(0.0) +
            df_master.get("contractor__shared_directors", pd.Series(0.0, index=df_master.index)).fillna(0.0) +
            df_master.get("contractor__shared_address", pd.Series(0.0, index=df_master.index)).fillna(0.0) +
            df_master.get("contractor__beneficial_owner_overlap", pd.Series(0.0, index=df_master.index)).fillna(0.0)
        )

        community_ids = [
            self.preprocessor.get_community_id(pid) for pid in df_master["project_id"]
        ]

        # Extract contractor degree from transformed feature names if present
        cont_deg_col = "graph__contractor_degree"
        cont_degree = X_mat[:, feature_names.index(cont_deg_col)] if cont_deg_col in feature_names else np.zeros(len(df_master))

        output_df = pd.DataFrame({
            "project_id": df_master["project_id"],
            "graph_anomaly_score": np.round(calibrated_scores, 2),
            "graph_anomaly_percentile": np.round(percentile_ranks, 2),
            "is_graph_anomaly": is_anomaly,
            "clique_community_id": community_ids,
            "pair_project_count": pair_counts,
            "triad_project_count": triad_counts,
            "agency_contractor_hhi": np.round(agency_hhi, 4),
            "corporate_ties_composite": np.round(ties, 2),
            "contractor_degree": np.round(cont_degree, 2),
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
        joblib.dump(self.model.estimator, self.config.artifacts_dir / "graph_isolation_forest.joblib")
        joblib.dump(self.preprocessor, self.config.artifacts_dir / "graph_preprocessor.joblib")

        with open(self.config.artifacts_dir / "graph_features.json", "w", encoding="utf-8") as f:
            json.dump({"features": feature_names, "count": len(feature_names)}, f, indent=2)

        with open(self.config.artifacts_dir / "graph_model_config.json", "w", encoding="utf-8") as f:
            json.dump({
                "model_name": self.config.model_name,
                "version": self.config.model_version,
                "mode": self.config.mode,
                "n_estimators": self.config.n_estimators,
                "contamination": self.config.contamination,
                "random_state": self.config.random_state,
                "pagerank_alpha": self.config.pagerank_alpha,
            }, f, indent=2)

        with open(self.config.artifacts_dir / "graph_model_metadata.json", "w", encoding="utf-8") as f:
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

        print("=== [SETU STAGE 2H] Graph Entity Relationship Model Pipeline Complete ===")
        return output_df


if __name__ == "__main__":
    pipeline = GraphModelPipeline()
    pipeline.run()
