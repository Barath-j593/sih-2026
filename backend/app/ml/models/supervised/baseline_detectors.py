"""Baseline heuristic benchmarks for Stage 3 Supervised Fraud Predictor.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd


class MaxIntermediateScoreBaseline:
    """Heuristic baseline that predicts fraud probability as the maximum intermediate score scaled to [0, 1]."""

    def __init__(self, score_columns: Optional[List[str]] = None):
        self.score_columns = score_columns or [
            "financial_anomaly_score",
            "geospatial_anomaly_score",
            "procurement_anomaly_score",
            "contractor_anomaly_score",
            "payment_anomaly_score",
            "progress_anomaly_score",
            "graph_anomaly_score",
        ]

    def fit(self, X: pd.DataFrame, y: Optional[np.ndarray] = None) -> "MaxIntermediateScoreBaseline":
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Predict probability based on max intermediate score."""
        present_cols = [c for c in self.score_columns if c in X.columns]
        if not present_cols:
            return np.full((len(X), 2), [0.5, 0.5])

        max_scores = X[present_cols].max(axis=1).values
        p1 = np.clip(max_scores / 100.0, 0.0, 1.0)
        p0 = 1.0 - p1
        return np.column_stack([p0, p1])


class WeightedAverageBaseline:
    """Heuristic baseline that predicts fraud probability using an empirical weighted mean of the 7 scores."""

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
    ):
        self.weights = weights or {
            "financial_anomaly_score": 0.15,
            "geospatial_anomaly_score": 0.10,
            "procurement_anomaly_score": 0.20,
            "contractor_anomaly_score": 0.15,
            "payment_anomaly_score": 0.15,
            "progress_anomaly_score": 0.15,
            "graph_anomaly_score": 0.10,
        }

    def fit(self, X: pd.DataFrame, y: Optional[np.ndarray] = None) -> "WeightedAverageBaseline":
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Predict probability based on weighted score sum."""
        total_weight = 0.0
        weighted_sum = np.zeros(len(X))

        for col, w in self.weights.items():
            if col in X.columns:
                weighted_sum += X[col].values * w
                total_weight += w

        if total_weight > 0:
            weighted_sum /= total_weight

        p1 = np.clip(weighted_sum / 100.0, 0.0, 1.0)
        p0 = 1.0 - p1
        return np.column_stack([p0, p1])
