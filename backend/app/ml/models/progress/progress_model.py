"""
SETU — Stage 2G: Progress vs. Execution Trajectory Model.

Implements Isolation Forest anomaly detection for physical-financial divergence,
ghost projects, execution stalls, and severe timeline overruns.
Calibrates anomaly scores to 0-100 and generates explainable reason traces.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from sklearn.ensemble import IsolationForest
from scipy.stats import rankdata

from app.ml.models.progress.config import ProgressModelConfig


class ProgressAnomalyModel:
    """Isolation Forest anomaly detection model for progress execution trajectories."""

    def __init__(self, config: Optional[ProgressModelConfig] = None):
        self.config = config or ProgressModelConfig()
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
            raise RuntimeError("ProgressAnomalyModel must be fitted before calling predict_score().")

        raw_scores = -self.estimator.decision_function(X_mat)
        span = self.max_raw_score_ - self.min_raw_score_
        if span < 1e-9:
            scaled = np.full_like(raw_scores, 50.0)
        else:
            scaled = (raw_scores - self.min_raw_score_) / span * 100.0

        # Percentile rank calibration
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
        for projects based on execution divergence signals.
        """
        records = []
        for idx in range(len(df_raw)):
            score = scores[idx]
            row = df_raw.iloc[idx]
            
            reasons = []

            phys = row.get("progress__latest_physical_progress", 100.0)
            fin = row.get("progress__latest_financial_progress", 0.0)
            gap = row.get("progress__financial_minus_physical_progress", 0.0)
            overrun_days = row.get("progress__duration_overrun_days", 0.0)
            phys_slope = row.get("progress__physical_progress_slope", 0.5)
            mb_rate = row.get("progress__measurement_book_verified_rate", 1.0)
            geotag_rate = row.get("progress__geotag_available_rate", 1.0)

            # 1. Ghost work: 0% physical with high financial disbursement
            if phys <= self.config.ghost_physical_max and fin > 20.0:
                reasons.append((
                    "GHOST_WORK_EXECUTION_DIVERGENCE",
                    float(fin * 1.5)
                ))

            # 2. Severe financial-physical gap (> 30%)
            if gap > self.config.divergence_threshold:
                reasons.append((
                    "SEVERE_PHYSICAL_FINANCIAL_GAP",
                    float(gap * 1.2)
                ))

            # 3. Extreme duration overrun (> 180 days)
            if overrun_days > self.config.stall_duration_days:
                reasons.append((
                    "EXTREME_DURATION_OVERRUN",
                    float(min(80.0, overrun_days / 5.0))
                ))

            # 4. Stalled execution trajectory (overrun with low slope)
            if overrun_days > 60.0 and phys_slope < 0.20:
                reasons.append((
                    "STALLED_EXECUTION_TRAJECTORY",
                    float(min(60.0, (1.0 - phys_slope) * 50.0))
                ))

            # 5. Inspection / verification deficit
            if mb_rate < 0.90 or geotag_rate < 0.90:
                reasons.append((
                    "INSPECTION_DOCUMENTATION_DEFICIT",
                    float((2.0 - mb_rate - geotag_rate) * 25.0)
                ))

            # 6. Physical progress stall
            if phys < 20.0 and fin > 50.0:
                reasons.append((
                    "ABANDONED_WORK_SUSPICION",
                    float((fin - phys) * 0.8)
                ))

            # Sort candidate reasons by priority weight
            reasons.sort(key=lambda x: x[1], reverse=True)

            r1 = reasons[0][0] if len(reasons) > 0 and score >= threshold else ("NORMAL_EXECUTION_PROGRESS" if score < threshold else "ELEVATED_PROGRESS_VOLATILITY")
            r2 = reasons[1][0] if len(reasons) > 1 and score >= threshold else "NONE"
            r3 = reasons[2][0] if len(reasons) > 2 and score >= threshold else "NONE"

            records.append({
                "primary_reason": r1,
                "secondary_reason": r2,
                "tertiary_reason": r3,
            })

        return pd.DataFrame(records, index=df_raw.index)
