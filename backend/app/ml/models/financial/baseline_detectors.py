"""Financial Baseline Anomaly Detectors.

Provides simple financial rule-based baseline detectors for benchmarking:
1. PeerCostDeviationBaseline: Flags projects with highest cost deviation vs peer median.
2. MultiAttributeRobustZScoreBaseline: Composite weighted heuristic of peer cost,
   velocity, and unverified payments.
"""

from typing import Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats

from .config import FinancialModelConfig


class PeerCostDeviationBaseline:
    """Baseline 1: Single-metric peer cost deviation detector."""

    def __init__(self, config: Optional[FinancialModelConfig] = None):
        self.config = config or FinancialModelConfig()
        self.score_min_: float = 0.0
        self.score_max_: float = 1.0

    def fit(self, df_features: pd.DataFrame) -> "PeerCostDeviationBaseline":
        col = "peer__cost_work_type_robust_z"
        if col in df_features.columns:
            raw_scores = np.abs(df_features[col].values)
        elif "financial__cost_deviation" in df_features.columns:
            raw_scores = np.abs(df_features["financial__cost_deviation"].values)
        else:
            raw_scores = np.zeros(len(df_features))
        self.score_min_ = float(np.min(raw_scores))
        self.score_max_ = float(np.max(raw_scores)) if np.max(raw_scores) > self.score_min_ else self.score_min_ + 1.0
        return self

    def score(self, df_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        col = "peer__cost_work_type_robust_z"
        if col in df_features.columns:
            raw_scores = np.abs(df_features[col].values)
        elif "financial__cost_deviation" in df_features.columns:
            raw_scores = np.abs(df_features["financial__cost_deviation"].values)
        else:
            raw_scores = np.zeros(len(df_features))

        percentiles = stats.rankdata(raw_scores, method="average") / len(raw_scores) * 100.0
        norm_scores = np.clip((raw_scores - self.score_min_) / (self.score_max_ - self.score_min_ + 1e-6) * 100.0, 0.0, 100.0)
        flags = percentiles >= self.config.anomaly_percentile_cutoff
        return norm_scores, percentiles, flags


class MultiAttributeRobustZScoreBaseline:
    """Baseline 2: Multi-attribute robust z-score heuristic detector."""

    def __init__(self, config: Optional[FinancialModelConfig] = None):
        self.config = config or FinancialModelConfig()
        self.score_min_: float = 0.0
        self.score_max_: float = 1.0

    def fit(self, df_features: pd.DataFrame) -> "MultiAttributeRobustZScoreBaseline":
        raw_scores = self._compute_composite(df_features)
        self.score_min_ = float(np.min(raw_scores))
        self.score_max_ = float(np.max(raw_scores)) if np.max(raw_scores) > self.score_min_ else self.score_min_ + 1.0
        return self

    def _compute_composite(self, df_features: pd.DataFrame) -> np.ndarray:
        cost_z = np.abs(df_features.get("peer__cost_work_type_robust_z", pd.Series(0.0, index=df_features.index)).values)
        unit_z = np.abs(df_features.get("peer__unit_cost_work_type_robust_z", pd.Series(0.0, index=df_features.index)).values)
        vel_z = np.maximum(0.0, df_features.get("peer__payment_velocity_work_type_robust_z", pd.Series(0.0, index=df_features.index)).values)
        unverified = df_features.get("payment__unverified_payment_rate", pd.Series(0.0, index=df_features.index)).values
        c_val_chg = np.maximum(0.0, df_features.get("contract__contract_value_change", pd.Series(0.0, index=df_features.index)).values)

        composite = (
            0.30 * cost_z +
            0.20 * unit_z +
            0.20 * vel_z +
            0.20 * (unverified * 5.0) +
            0.10 * (c_val_chg * 4.0)
        )
        return composite

    def score(self, df_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        raw_scores = self._compute_composite(df_features)
        percentiles = stats.rankdata(raw_scores, method="average") / len(raw_scores) * 100.0
        norm_scores = np.clip((raw_scores - self.score_min_) / (self.score_max_ - self.score_min_ + 1e-6) * 100.0, 0.0, 100.0)
        flags = percentiles >= self.config.anomaly_percentile_cutoff
        return norm_scores, percentiles, flags
