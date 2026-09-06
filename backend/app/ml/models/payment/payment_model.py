"""
SETU — Stage 2F: Granular Payment Structuring Model.

Implements Isolation Forest anomaly detection for payment structuring,
disbursement velocity bursts, unverified releases, and statutory smurfing.
Calibrates anomaly scores to 0-100 and generates explainable reason traces.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import IsolationForest

from app.ml.models.payment.config import PaymentModelConfig


class PaymentAnomalyModel:
    """Isolation Forest anomaly detection model for payment structuring."""

    def __init__(self, config: Optional[PaymentModelConfig] = None):
        self.config = config or PaymentModelConfig()
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
            raise RuntimeError("PaymentAnomalyModel must be fitted before calling predict_score().")

        raw_scores = -self.estimator.decision_function(X_mat)
        span = self.max_raw_score_ - self.min_raw_score_
        if span < 1e-9:
            scaled = np.full_like(raw_scores, 50.0)
        else:
            scaled = (raw_scores - self.min_raw_score_) / span * 100.0

        # Percentile rank calibration
        from scipy.stats import rankdata
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
        for projects based on feature contributions.
        """
        records = []
        for idx in range(len(df_raw)):
            score = scores[idx]
            row = df_raw.iloc[idx]
            
            reasons = []

            # 1. Unverified release
            unverified_rate = row.get("payment__unverified_payment_rate", 0.0)
            unverified_count = row.get("payment__unverified_payment_count", 0.0)
            if unverified_rate > 0.0 or unverified_count > 0.0:
                reasons.append((
                    "UNVERIFIED_DISBURSEMENT_BURST",
                    float(unverified_rate * 50.0 + unverified_count * 10.0)
                ))

            # 2. Statutory smurfing
            sanction = row.get("financial__sanctioned_amount", 0.0)
            max_pay = row.get("payment__max_payment", 0.0)
            for t in self.config.smurfing_thresholds:
                if (t * 0.95 <= sanction <= t) or (t * 0.95 <= max_pay <= t):
                    reasons.append((
                        "STATUTORY_CEILING_SMURFING",
                        40.0
                    ))
                    break

            # 3. Velocity burst / rapid release
            velocity_mean = row.get("payment__payment_velocity_mean", 0.0)
            planned_days = max(30.0, row.get("project__planned_duration_days", 180.0))
            planned_exp_velocity = sanction / planned_days
            velocity_ratio = velocity_mean / max(1.0, planned_exp_velocity)
            if velocity_ratio > 2.0:
                reasons.append((
                    "DISBURSEMENT_VELOCITY_BURST",
                    float(min(50.0, velocity_ratio * 10.0))
                ))

            # 4. Lumpiness / extreme concentration
            concentration = row.get("payment__payment_concentration_max", 0.0)
            if concentration > 0.70:
                reasons.append((
                    "DISBURSEMENT_LUMPINESS_ANOMALY",
                    float(concentration * 35.0)
                ))

            # 5. Timing anomaly
            timing_rate = row.get("payment__payment_timing_anomaly_rate", 0.0)
            if timing_rate > 0.10:
                reasons.append((
                    "PAYMENT_TIMING_ANOMALY",
                    float(timing_rate * 30.0)
                ))

            # 6. Round number payments
            round_rate = row.get("payment__round_number_payment_rate", 0.0)
            if round_rate > 0.30:
                reasons.append((
                    "ROUND_NUMBER_DISBURSEMENT_CONCENTRATION",
                    float(round_rate * 25.0)
                ))

            # 7. High payment count with rapid span
            pay_span = row.get("payment__payment_span_days", 0.0)
            pay_count = row.get("payment__payment_count", 0.0)
            if pay_span < 0.25 * planned_days and pay_count >= 3.0:
                reasons.append((
                    "COMPRESSED_PAYMENT_SCHEDULE",
                    20.0
                ))

            # Sort candidate reasons by priority weight
            reasons.sort(key=lambda x: x[1], reverse=True)

            r1 = reasons[0][0] if len(reasons) > 0 and score >= threshold else ("NORMAL_DISBURSEMENT_SCHEDULE" if score < threshold else "ELEVATED_PAYMENT_VOLATILITY")
            r2 = reasons[1][0] if len(reasons) > 1 and score >= threshold else "NONE"
            r3 = reasons[2][0] if len(reasons) > 2 and score >= threshold else "NONE"

            records.append({
                "primary_reason": r1,
                "secondary_reason": r2,
                "tertiary_reason": r3,
            })

        return pd.DataFrame(records, index=df_raw.index)
