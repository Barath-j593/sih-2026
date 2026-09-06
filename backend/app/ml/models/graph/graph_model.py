"""
SETU — Stage 2H: Graph & Entity Relationship Model.

Implements Isolation Forest anomaly detection for graph topology,
collusive cliques, circular bidding, hub monopolization, and entity capture.
Calibrates anomaly scores to 0-100 and generates explainable reason traces.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from sklearn.ensemble import IsolationForest
from scipy.stats import rankdata

from app.ml.models.graph.config import GraphModelConfig


class GraphAnomalyModel:
    """Isolation Forest anomaly detection model for graph entity relationships."""

    def __init__(self, config: Optional[GraphModelConfig] = None):
        self.config = config or GraphModelConfig()
        self.estimator = IsolationForest(
            n_estimators=self.config.n_estimators,
            max_samples=self.config.max_samples,
            contamination=self.config.contamination,
            bootstrap=self.config.bootstrap,
            random_state=self.config.random_state,
            n_jobs=self.config.n_jobs,
        )
        self.min_raw_score_: float = 0.0
        self.max_raw_score_: float = 1.0
        self.score_p95_: float = 0.0
        self.is_fitted: bool = False

    def fit(self, X_mat: np.ndarray, y=None):
        """Fit Isolation Forest estimator on preprocessed feature matrix."""
        self.estimator.fit(X_mat)
        raw_scores = -self.estimator.decision_function(X_mat)
        self.min_raw_score_ = float(np.min(raw_scores))
        self.max_raw_score_ = float(np.max(raw_scores))
        self.score_p95_ = float(np.percentile(raw_scores, 95))
        self.is_fitted = True
        return self

    def predict_score(self, X_mat: np.ndarray) -> np.ndarray:
        """Compute calibrated 0-100 anomaly scores."""
        if not self.is_fitted:
            raise RuntimeError("GraphAnomalyModel must be fitted before calling predict_score().")

        raw_scores = -self.estimator.decision_function(X_mat)
        span = self.max_raw_score_ - self.min_raw_score_
        if span < 1e-9:
            scaled = np.full_like(raw_scores, 50.0)
        else:
            scaled = (raw_scores - self.min_raw_score_) / span * 100.0

        percentile_scores = rankdata(raw_scores) / len(raw_scores) * 100.0

        # Blend min-max and rank calibration
        calibrated = 0.6 * scaled + 0.4 * percentile_scores
        return np.clip(calibrated, 0.0, 100.0)

    def explain_reasons(
        self,
        df_raw: pd.DataFrame,
        scores: np.ndarray,
        threshold: float = 60.0,
    ) -> pd.DataFrame:
        """
        Generate primary, secondary, and tertiary explainable reason traces
        for projects based on graph entity relationships.
        """
        records = []
        triad_counts = df_raw.groupby(["constituency_id", "agency_id", "contractor_id"])["project_id"].transform("count")
        pair_counts = df_raw.groupby(["contractor_id", "agency_id"])["project_id"].transform("count")

        for idx in range(len(df_raw)):
            score = scores[idx]
            row = df_raw.iloc[idx]
            reasons = []

            # 1. Corporate collusion ties
            ties = (
                row.get("contractor__shared_ownership", 0.0) +
                row.get("contractor__shared_directors", 0.0) +
                row.get("contractor__shared_address", 0.0) +
                row.get("contractor__beneficial_owner_overlap", 0.0)
            )
            if ties > 0:
                reasons.append((
                    "CORPORATE_COLLUSION_NETWORK",
                    float(ties * 35.0)
                ))

            # 2. Tripartite closed clique
            triad = triad_counts.iloc[idx]
            if triad >= 2:
                reasons.append((
                    "TRIPARTITE_CLOSED_CLIQUE",
                    float(triad * 25.0)
                ))

            # 3. Agency concentration / capture
            agency_conc = row.get("contractor__contractor_agency_concentration", 0.0)
            if agency_conc > 0.60:
                reasons.append((
                    "HIGH_CONSTITUENCY_AGENCY_CAPTURE",
                    float(agency_conc * 40.0)
                ))

            # 4. Recurring exclusive pairing
            pair_c = pair_counts.iloc[idx]
            repeated_pair = row.get("contractor__repeated_agency_contractor_pair", 0.0)
            if repeated_pair > 0 or pair_c >= 4:
                reasons.append((
                    "RECURRING_EXCLUSIVE_PAIRING",
                    float(max(pair_c * 8.0, 30.0))
                ))

            # 5. Governance changes
            own_ch = row.get("contractor__company_ownership_change", 0.0)
            dir_ch = row.get("contractor__director_change", 0.0)
            if own_ch > 0 or dir_ch > 0:
                reasons.append((
                    "PRE_AWARD_GOVERNANCE_INSTABILITY",
                    25.0
                ))

            # 6. High district concentration
            dist_conc = row.get("contractor__contractor_district_concentration", 0.0)
            if dist_conc > 0.70:
                reasons.append((
                    "HUB_CENTRALITY_SPIKE",
                    float(dist_conc * 25.0)
                ))

            reasons.sort(key=lambda x: x[1], reverse=True)

            r1 = reasons[0][0] if len(reasons) > 0 and score >= threshold else ("NORMAL_GRAPH_TOPOLOGY" if score < threshold else "ELEVATED_GRAPH_CENTRALITY")
            r2 = reasons[1][0] if len(reasons) > 1 and score >= threshold else "NONE"
            r3 = reasons[2][0] if len(reasons) > 2 and score >= threshold else "NONE"

            records.append({
                "primary_reason": r1,
                "secondary_reason": r2,
                "tertiary_reason": r3,
            })

        return pd.DataFrame(records, index=df_raw.index)
