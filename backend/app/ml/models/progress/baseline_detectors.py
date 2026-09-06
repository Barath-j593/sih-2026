"""
SETU — Stage 2G: Progress Baseline Anomaly Detectors.

Provides benchmark reference detectors:
1. DivergenceRuleBaseline: Rule-based indicator flagging physical-financial divergence and duration overruns.
2. MultiAttributeProgressHeuristic: Weighted multi-attribute execution divergence heuristic.
"""

import numpy as np
import pandas as pd
from typing import Optional

from app.ml.models.progress.config import ProgressModelConfig


class DivergenceRuleBaseline:
    """Baseline 1: Rule-based detector for progress divergence and timeline overrun."""

    def __init__(self, config: Optional[ProgressModelConfig] = None):
        self.config = config or ProgressModelConfig()

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def predict_score(self, X: pd.DataFrame) -> pd.Series:
        """Compute baseline risk score based on deterministic rules."""
        gap = X.get(
            "progress__financial_minus_physical_progress",
            pd.Series(0.0, index=X.index)
        ).fillna(0.0)
        overrun = X.get(
            "progress__duration_overrun_days",
            pd.Series(0.0, index=X.index)
        ).fillna(0.0)

        # 50 points if gap > 30%, extra 25 points if gap > 50%, 25 points if overrun > 180 days
        score = (
            (gap > self.config.divergence_threshold).astype(float) * 50.0 +
            (gap > self.config.extreme_gap_threshold).astype(float) * 25.0 +
            (overrun > self.config.stall_duration_days).astype(float) * 25.0
        )
        return pd.Series(np.clip(score, 0.0, 100.0), index=X.index, name="baseline1_score")


class MultiAttributeProgressHeuristic:
    """Baseline 2: Multi-attribute heuristic scoring divergence, ghost work, and stall."""

    def __init__(self, config: Optional[ProgressModelConfig] = None):
        self.config = config or ProgressModelConfig()

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def predict_score(self, X: pd.DataFrame) -> pd.Series:
        """Compute weighted multi-attribute execution risk score."""
        gap = X.get(
            "progress__financial_minus_physical_progress",
            pd.Series(0.0, index=X.index)
        ).fillna(0.0)
        phys = X.get(
            "progress__latest_physical_progress",
            pd.Series(0.0, index=X.index)
        ).fillna(0.0)
        fin = X.get(
            "progress__latest_financial_progress",
            pd.Series(0.0, index=X.index)
        ).fillna(0.0)
        overrun = X.get(
            "progress__duration_overrun_days",
            pd.Series(0.0, index=X.index)
        ).fillna(0.0)
        mb_rate = X.get(
            "progress__measurement_book_verified_rate",
            pd.Series(1.0, index=X.index)
        ).fillna(1.0)
        geotag_rate = X.get(
            "progress__geotag_available_rate",
            pd.Series(1.0, index=X.index)
        ).fillna(1.0)

        # Ghost indicator: fin % if phys <= 5%
        is_ghost = (phys <= self.config.ghost_physical_max).astype(float)
        ghost_score = (fin / 100.0) * is_ghost

        # Overrun score
        overrun_score = np.clip(overrun / 365.0, 0.0, 1.0)

        # Deficit
        deficit = (1.0 - mb_rate) + (1.0 - geotag_rate)

        weighted_score = (
            np.clip(gap / 100.0, 0.0, 1.0) * 40.0 +
            ghost_score * 30.0 +
            overrun_score * 20.0 +
            np.clip(deficit / 2.0, 0.0, 1.0) * 10.0
        )

        return pd.Series(np.clip(weighted_score, 0.0, 100.0), index=X.index, name="baseline2_score")
