"""
SETU — Stage 2H: Graph Baseline Anomaly Detectors.

Provides benchmark reference detectors:
1. TripartiteMonopolyRuleBaseline: Rule-based indicator flagging closed triads and corporate ties.
2. MultiAttributeGraphHeuristic: Weighted multi-attribute graph relationship heuristic.
"""

import numpy as np
import pandas as pd
from typing import Optional

from app.ml.models.graph.config import GraphModelConfig


class TripartiteMonopolyRuleBaseline:
    """Baseline 1: Rule-based detector for closed cliques, repeated pairs, and corporate ties."""

    def __init__(self, config: Optional[GraphModelConfig] = None):
        self.config = config or GraphModelConfig()

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def predict_score(self, X: pd.DataFrame) -> pd.Series:
        """Compute baseline risk score based on deterministic graph rules."""
        # 1. Bipartite & Tripartite co-occurrence
        pair_counts = X.groupby(["contractor_id", "agency_id"])["project_id"].transform("count")
        triad_counts = X.groupby(["constituency_id", "agency_id", "contractor_id"])["project_id"].transform("count")

        # 2. Corporate ties
        ties = (
            X.get("contractor__shared_ownership", pd.Series(0.0, index=X.index)).fillna(0.0) +
            X.get("contractor__shared_directors", pd.Series(0.0, index=X.index)).fillna(0.0) +
            X.get("contractor__shared_address", pd.Series(0.0, index=X.index)).fillna(0.0) +
            X.get("contractor__beneficial_owner_overlap", pd.Series(0.0, index=X.index)).fillna(0.0)
        )

        repeated_pair = X.get(
            "contractor__repeated_agency_contractor_pair",
            pd.Series(0.0, index=X.index)
        ).fillna(0.0)

        # Rule-based score
        score = (
            (triad_counts >= 3).astype(float) * 35.0 +
            (ties > 0).astype(float) * 35.0 +
            (repeated_pair > 0).astype(float) * 15.0 +
            (pair_counts >= 5).astype(float) * 15.0
        )
        return pd.Series(np.clip(score, 0.0, 100.0), index=X.index, name="baseline1_score")


class MultiAttributeGraphHeuristic:
    """Baseline 2: Multi-attribute heuristic scoring graph concentration and collusion."""

    def __init__(self, config: Optional[GraphModelConfig] = None):
        self.config = config or GraphModelConfig()

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def predict_score(self, X: pd.DataFrame) -> pd.Series:
        """Compute weighted multi-attribute graph relationship risk score."""
        pair_counts = X.groupby(["contractor_id", "agency_id"])["project_id"].transform("count")
        triad_counts = X.groupby(["constituency_id", "agency_id", "contractor_id"])["project_id"].transform("count")

        # Agency capture HHI
        def _calc_hhi(group):
            shares = group.value_counts(normalize=True)
            return float((shares ** 2).sum())

        agency_hhi_map = X.groupby("agency_id")["contractor_id"].apply(_calc_hhi).to_dict()
        agency_hhi = X["agency_id"].map(agency_hhi_map).fillna(0.0)

        # Corporate ties
        ties = (
            X.get("contractor__shared_ownership", pd.Series(0.0, index=X.index)).fillna(0.0) +
            X.get("contractor__shared_directors", pd.Series(0.0, index=X.index)).fillna(0.0) +
            X.get("contractor__shared_address", pd.Series(0.0, index=X.index)).fillna(0.0) +
            X.get("contractor__beneficial_owner_overlap", pd.Series(0.0, index=X.index)).fillna(0.0)
        )

        cont_conc = X.get(
            "contractor__contractor_agency_concentration",
            pd.Series(0.0, index=X.index)
        ).fillna(0.0)

        weighted_score = (
            np.clip(triad_counts / 3.0, 0.0, 1.0) * 30.0 +
            agency_hhi * 30.0 +
            np.clip(ties / 2.0, 0.0, 1.0) * 25.0 +
            cont_conc * 15.0
        )

        return pd.Series(np.clip(weighted_score, 0.0, 100.0), index=X.index, name="baseline2_score")
