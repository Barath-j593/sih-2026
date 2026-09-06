"""
SETU — Stage 2F: Payment Baseline Anomaly Detectors.

Provides benchmark reference detectors:
1. UnverifiedAndRoundPaymentBaseline: Rule-based indicator flagging unverified releases & smurfing.
2. MultiAttributePaymentHeuristic: Composite weighted multi-attribute payment structuring heuristic.
"""

import numpy as np
import pandas as pd
from typing import Optional

from app.ml.models.payment.config import PaymentModelConfig


class UnverifiedAndRoundPaymentBaseline:
    """Baseline 1: Rule-based detector for unverified releases, round numbers, and smurfing."""

    def __init__(self, config: Optional[PaymentModelConfig] = None):
        self.config = config or PaymentModelConfig()

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def predict_score(self, X: pd.DataFrame) -> pd.Series:
        """Compute baseline risk score based on deterministic rules."""
        unverified_rate = X.get("payment__unverified_payment_rate", pd.Series(0.0, index=X.index)).fillna(0.0)
        round_rate = X.get("payment__round_number_payment_rate", pd.Series(0.0, index=X.index)).fillna(0.0)
        sanction = X.get("financial__sanctioned_amount", pd.Series(0.0, index=X.index)).fillna(0.0)
        max_pay = X.get("payment__max_payment", pd.Series(0.0, index=X.index)).fillna(0.0)

        # Check smurfing window: [0.95 * T, T] for 15L, 25L, 50L
        smurfing = pd.Series(False, index=X.index)
        for t in self.config.smurfing_thresholds:
            lower = t * 0.95
            is_smurf = ((sanction >= lower) & (sanction <= t)) | ((max_pay >= lower) & (max_pay <= t))
            smurfing = smurfing | is_smurf

        # Composite score
        score = (
            (unverified_rate > 0.0).astype(float) * 50.0 +
            (round_rate > 0.3).astype(float) * 25.0 +
            smurfing.astype(float) * 25.0
        )
        return pd.Series(np.clip(score, 0.0, 100.0), index=X.index, name="baseline1_score")


class MultiAttributePaymentHeuristic:
    """Baseline 2: Multi-attribute heuristic scoring unverified rate, timing, concentration, and smurfing."""

    def __init__(self, config: Optional[PaymentModelConfig] = None):
        self.config = config or PaymentModelConfig()

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def predict_score(self, X: pd.DataFrame) -> pd.Series:
        """Compute weighted multi-attribute payment structuring risk score."""
        unverified_rate = X.get("payment__unverified_payment_rate", pd.Series(0.0, index=X.index)).fillna(0.0)
        timing_rate = X.get("payment__payment_timing_anomaly_rate", pd.Series(0.0, index=X.index)).fillna(0.0)
        concentration = X.get("payment__payment_concentration_max", pd.Series(0.0, index=X.index)).fillna(0.0)
        sanction = X.get("financial__sanctioned_amount", pd.Series(0.0, index=X.index)).fillna(0.0)
        max_pay = X.get("payment__max_payment", pd.Series(0.0, index=X.index)).fillna(0.0)

        # Smurfing proximity
        smurf_scores = np.zeros(len(X), dtype=float)
        for t in self.config.smurfing_thresholds:
            for s in [sanction, max_pay]:
                vals = s.to_numpy()
                in_win = (vals >= t * 0.95) & (vals <= t)
                if np.any(in_win):
                    diff = vals[in_win] - t
                    gauss = np.exp(-0.5 * (diff / self.config.smurfing_bandwidth) ** 2)
                    smurf_scores[in_win] = np.maximum(smurf_scores[in_win], gauss)

        weighted_score = (
            unverified_rate * 40.0 +
            timing_rate * 20.0 +
            concentration * 20.0 +
            pd.Series(smurf_scores, index=X.index) * 20.0
        )

        return pd.Series(np.clip(weighted_score, 0.0, 100.0), index=X.index, name="baseline2_score")
