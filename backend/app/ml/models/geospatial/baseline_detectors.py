"""Geospatial Baseline Anomaly Detectors.

Provides simple geospatial rule-based baseline detectors for benchmarking:
1. SpatialCostClusterDeviationBaseline: Flags projects with highest unit cost deviation
   vs localized cluster median for the same work type.
2. MultiAttributeSpatialHeuristicBaseline: Composite weighted heuristic of cluster unit cost Z,
   local project density, and Local Outlier Factor.
"""

from typing import Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats

from .config import GeospatialModelConfig


class SpatialCostClusterDeviationBaseline:
    """Baseline 1: Single-metric spatial cluster cost deviation detector."""

    def __init__(self, config: Optional[GeospatialModelConfig] = None):
        self.config = config or GeospatialModelConfig()
        self.score_min_: float = 0.0
        self.score_max_: float = 1.0

    def fit(self, df_features: pd.DataFrame) -> "SpatialCostClusterDeviationBaseline":
        col = "peer__spatial_unit_cost_robust_z"
        if col in df_features.columns:
            raw_scores = np.abs(df_features[col].values)
        else:
            raw_scores = np.zeros(len(df_features))

        self.score_min_ = float(np.min(raw_scores))
        self.score_max_ = float(np.max(raw_scores)) if np.max(raw_scores) > self.score_min_ else self.score_min_ + 1.0
        return self

    def score(self, df_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        col = "peer__spatial_unit_cost_robust_z"
        if col in df_features.columns:
            raw_scores = np.abs(df_features[col].values)
        else:
            raw_scores = np.zeros(len(df_features))

        percentiles = stats.rankdata(raw_scores, method="average") / len(raw_scores) * 100.0
        norm_scores = np.clip(
            (raw_scores - self.score_min_) / (self.score_max_ - self.score_min_ + 1e-6) * 100.0,
            0.0,
            100.0,
        )
        flags = percentiles >= self.config.anomaly_percentile_cutoff
        return norm_scores, percentiles, flags


class MultiAttributeSpatialHeuristicBaseline:
    """Baseline 2: Multi-attribute spatial heuristic detector."""

    def __init__(self, config: Optional[GeospatialModelConfig] = None):
        self.config = config or GeospatialModelConfig()
        self.score_min_: float = 0.0
        self.score_max_: float = 1.0

    def fit(self, df_features: pd.DataFrame) -> "MultiAttributeSpatialHeuristicBaseline":
        raw_scores = self._compute_composite(df_features)
        self.score_min_ = float(np.min(raw_scores))
        self.score_max_ = float(np.max(raw_scores)) if np.max(raw_scores) > self.score_min_ else self.score_min_ + 1.0
        return self

    def _compute_composite(self, df_features: pd.DataFrame) -> np.ndarray:
        unit_cost_z = np.abs(df_features.get("peer__spatial_unit_cost_robust_z", pd.Series(0.0, index=df_features.index)).values)
        sanc_cost_z = np.abs(df_features.get("peer__spatial_sanctioned_robust_z", pd.Series(0.0, index=df_features.index)).values)
        density_ratio = df_features.get("spatial__density_to_pop_ratio", pd.Series(1.0, index=df_features.index)).values
        lof_score = np.maximum(0.0, df_features.get("spatial__lof_score", pd.Series(1.0, index=df_features.index)).values - 1.0)
        gap_ratio = df_features.get("spatial__density_to_gap_ratio", pd.Series(1.0, index=df_features.index)).values

        # Normalize density ratio for weighting
        density_norm = np.clip(density_ratio / (np.median(density_ratio) + 1e-6), 0.0, 5.0)
        gap_norm = np.clip(gap_ratio / (np.median(gap_ratio) + 1e-6), 0.0, 5.0)

        composite = (
            0.35 * unit_cost_z +
            0.20 * sanc_cost_z +
            0.20 * density_norm +
            0.15 * (lof_score * 2.5) +
            0.10 * gap_norm
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
