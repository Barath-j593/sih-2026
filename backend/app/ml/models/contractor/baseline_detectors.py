"""Contractor Baseline Anomaly Detectors.

Provides simple contractor rule-based baseline detectors for benchmarking:
1. AgencyConcentrationBaseline: Flags projects based strictly on contractor-agency concentration.
2. MultiAttributeContractorHeuristicBaseline: Composite weighted heuristic across capacity strain,
   corporate collusion, agency capture, and governance instability.
"""

from typing import Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats

from .config import ContractorModelConfig


class AgencyConcentrationBaseline:
    """Baseline 1: Agency concentration and repeat pairing baseline detector."""

    def __init__(self, config: Optional[ContractorModelConfig] = None):
        self.config = config or ContractorModelConfig()
        self.score_min_: float = 0.0
        self.score_max_: float = 1.0

    def fit(self, df_features: pd.DataFrame) -> "AgencyConcentrationBaseline":
        conc = df_features.get("contractor__contractor_agency_concentration", pd.Series(0.5, index=df_features.index)).values
        rep = df_features.get("contractor__repeated_agency_contractor_pair", pd.Series(0.0, index=df_features.index)).values
        raw_scores = conc * 2.0 + rep * 1.5
        self.score_min_ = float(np.min(raw_scores))
        self.score_max_ = float(np.max(raw_scores)) if np.max(raw_scores) > self.score_min_ else self.score_min_ + 1.0
        return self

    def score(self, df_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        conc = df_features.get("contractor__contractor_agency_concentration", pd.Series(0.5, index=df_features.index)).values
        rep = df_features.get("contractor__repeated_agency_contractor_pair", pd.Series(0.0, index=df_features.index)).values
        raw_scores = conc * 2.0 + rep * 1.5

        percentiles = stats.rankdata(raw_scores, method="average") / len(raw_scores) * 100.0
        norm_scores = np.clip(
            (raw_scores - self.score_min_) / (self.score_max_ - self.score_min_ + 1e-6) * 100.0,
            0.0,
            100.0,
        )
        flags = percentiles >= self.config.anomaly_percentile_cutoff
        return norm_scores, percentiles, flags


class MultiAttributeContractorHeuristicBaseline:
    """Baseline 2: Multi-attribute contractor heuristic detector."""

    def __init__(self, config: Optional[ContractorModelConfig] = None):
        self.config = config or ContractorModelConfig()
        self.score_min_: float = 0.0
        self.score_max_: float = 1.0

    def fit(self, df_features: pd.DataFrame) -> "MultiAttributeContractorHeuristicBaseline":
        raw_scores = self._compute_composite(df_features)
        self.score_min_ = float(np.min(raw_scores))
        self.score_max_ = float(np.max(raw_scores)) if np.max(raw_scores) > self.score_min_ else self.score_min_ + 1.0
        return self

    def _compute_composite(self, df_features: pd.DataFrame) -> np.ndarray:
        strain = df_features.get("contractor__capacity_strain_index", pd.Series(0.0, index=df_features.index)).values
        collusion = df_features.get("contractor__corporate_collusion_index", pd.Series(0.0, index=df_features.index)).values
        capture = df_features.get("contractor__agency_capture_score", pd.Series(0.0, index=df_features.index)).values
        gov = df_features.get("contractor__governance_instability_score", pd.Series(0.0, index=df_features.index)).values

        composite = (
            0.30 * np.clip(strain, 0.0, 5.0) +
            0.25 * (collusion * 5.0) +
            0.25 * (capture * 3.0) +
            0.20 * (gov * 2.0)
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
