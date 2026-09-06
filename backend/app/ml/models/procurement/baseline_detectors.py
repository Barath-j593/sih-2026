"""Procurement Baseline Anomaly Detectors.

Provides simple procurement rule-based baseline detectors for benchmarking:
1. SingleBidRuleBaseline: Flags projects based strictly on single-bid flag and bidder deficit.
2. MultiAttributeProcurementHeuristicBaseline: Composite weighted heuristic across urban single-bid,
   bid suppression, collusive quotation clustering, and post-award variations.
"""

from typing import Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats

from .config import ProcurementModelConfig


class SingleBidRuleBaseline:
    """Baseline 1: Single-bid rule baseline detector."""

    def __init__(self, config: Optional[ProcurementModelConfig] = None):
        self.config = config or ProcurementModelConfig()
        self.score_min_: float = 0.0
        self.score_max_: float = 1.0

    def fit(self, df_features: pd.DataFrame) -> "SingleBidRuleBaseline":
        single = df_features.get("procurement__single_bid_flag", pd.Series(0.0, index=df_features.index)).values
        bids = df_features.get("procurement__bid_count", pd.Series(5.0, index=df_features.index)).values
        raw_scores = single * 5.0 + np.maximum(0.0, 5.0 - bids)
        self.score_min_ = float(np.min(raw_scores))
        self.score_max_ = float(np.max(raw_scores)) if np.max(raw_scores) > self.score_min_ else self.score_min_ + 1.0
        return self

    def score(self, df_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        single = df_features.get("procurement__single_bid_flag", pd.Series(0.0, index=df_features.index)).values
        bids = df_features.get("procurement__bid_count", pd.Series(5.0, index=df_features.index)).values
        raw_scores = single * 5.0 + np.maximum(0.0, 5.0 - bids)

        percentiles = stats.rankdata(raw_scores, method="average") / len(raw_scores) * 100.0
        norm_scores = np.clip(
            (raw_scores - self.score_min_) / (self.score_max_ - self.score_min_ + 1e-6) * 100.0,
            0.0,
            100.0,
        )
        flags = percentiles >= self.config.anomaly_percentile_cutoff
        return norm_scores, percentiles, flags


class MultiAttributeProcurementHeuristicBaseline:
    """Baseline 2: Multi-attribute procurement heuristic detector."""

    def __init__(self, config: Optional[ProcurementModelConfig] = None):
        self.config = config or ProcurementModelConfig()
        self.score_min_: float = 0.0
        self.score_max_: float = 1.0

    def fit(self, df_features: pd.DataFrame) -> "MultiAttributeProcurementHeuristicBaseline":
        raw_scores = self._compute_composite(df_features)
        self.score_min_ = float(np.min(raw_scores))
        self.score_max_ = float(np.max(raw_scores)) if np.max(raw_scores) > self.score_min_ else self.score_min_ + 1.0
        return self

    def _compute_composite(self, df_features: pd.DataFrame) -> np.ndarray:
        urban_single = df_features.get("procurement__urban_single_bid_anomaly", pd.Series(0.0, index=df_features.index)).values
        collusion = df_features.get("procurement__collusive_clustering_score", pd.Series(0.0, index=df_features.index)).values
        suppression = df_features.get("procurement__bid_suppression_score", pd.Series(0.0, index=df_features.index)).values
        post_award = df_features.get("procurement__post_award_leakage_index", pd.Series(0.0, index=df_features.index)).values
        tender_win = df_features.get("procurement__tender_window_anomaly", pd.Series(0.0, index=df_features.index)).values

        composite = (
            0.30 * (urban_single * 4.0) +
            0.25 * (collusion * 3.0) +
            0.20 * (suppression * 3.0) +
            0.15 * (post_award * 10.0) +
            0.10 * tender_win
        )
        return composite

    def score(self, df_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        raw_scores = self._compute_composite(df_features)
        percentiles = stats.rankdata(raw_scores, method="average") / len(raw_scores) * 100.0
        norm_scores = np.clip(
            (raw_scores - self.score_min_) / (self.score_max_ - self.score_min_ + 1e-6) * 100.0,
            0.0,
            100.0,
        )
        flags = percentiles >= self.config.anomaly_percentile_cutoff
        return norm_scores, percentiles, flags
