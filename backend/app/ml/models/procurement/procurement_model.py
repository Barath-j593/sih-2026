"""Procurement Isolation Forest Anomaly Model.

Implements the standalone unsupervised Isolation Forest model for tender rigging,
continuous score normalization (0-100), percentile computation, flag thresholding,
and explainable reason trace generation.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest
import joblib

from .config import ProcurementModelConfig


class ProcurementIsolationForestModel:
    """SETU Procurement & Tender Rigging Anomaly Isolation Forest Model."""

    def __init__(self, config: Optional[ProcurementModelConfig] = None):
        self.config = config or ProcurementModelConfig()
        self.model_: Optional[IsolationForest] = None
        self.raw_score_p1_: float = 0.0
        self.raw_score_p99_: float = 1.0
        self.is_fitted_: bool = False

    def fit(self, X: np.ndarray, feature_names: List[str]) -> "ProcurementIsolationForestModel":
        """Train Isolation Forest on preprocessed procurement feature matrix."""
        self.model_ = IsolationForest(
            n_estimators=self.config.n_estimators,
            contamination=self.config.contamination,
            random_state=self.config.random_state,
            max_samples=self.config.max_samples,
            bootstrap=self.config.bootstrap,
            n_jobs=self.config.n_jobs,
        )
        self.model_.fit(X)

        raw_anomaly = -self.model_.decision_function(X)
        self.raw_score_p1_ = float(np.percentile(raw_anomaly, 1.0))
        self.raw_score_p99_ = float(np.percentile(raw_anomaly, 99.0))
        if self.raw_score_p99_ <= self.raw_score_p1_:
            self.raw_score_p99_ = self.raw_score_p1_ + 1.0

        self.is_fitted_ = True
        return self

    def score(self, X: np.ndarray) -> np.ndarray:
        """Compute continuous normalized procurement anomaly score in [0.0, 100.0]."""
        if not self.is_fitted_ or self.model_ is None:
            raise RuntimeError("Model must be fitted before scoring.")

        raw_anomaly = -self.model_.decision_function(X)
        norm_score = (raw_anomaly - self.raw_score_p1_) / (self.raw_score_p99_ - self.raw_score_p1_) * 100.0
        return np.clip(norm_score, 0.0, 100.0)

    def predict_percentile(self, scores: np.ndarray) -> np.ndarray:
        """Compute empirical percentile rank [0.0, 100.0] within the population."""
        return stats.rankdata(scores, method="average") / len(scores) * 100.0

    def predict_flags(self, percentiles: np.ndarray) -> np.ndarray:
        """Flag projects at or above anomaly percentile cutoff (e.g. >= 95th percentile)."""
        return percentiles >= self.config.anomaly_percentile_cutoff

    def generate_reason_traces(
        self,
        df_features: pd.DataFrame,
        scores: np.ndarray,
        percentiles: np.ndarray,
    ) -> pd.DataFrame:
        """Generate explainable, non-accusatory procurement reason traces for every project."""
        reasons_list = []

        for idx in range(len(df_features)):
            row = df_features.iloc[idx]
            pct = percentiles[idx]
            cand_reasons = []

            # 1. Single-bid anomaly in accessible / urban area
            single_flag = row.get("procurement__single_bid_flag", 0.0)
            urban_single = row.get("procurement__urban_single_bid_anomaly", 0.0)
            infra_gap = row.get("geo__infrastructure_gap_index", 0.5)
            if single_flag == 1.0:
                if infra_gap < 0.50:
                    cand_reasons.append((
                        15.0,
                        f"Non-competitive single-bid procurement in accessible district (infrastructure gap {infra_gap:.2f})"
                    ))
                else:
                    cand_reasons.append((
                        6.0,
                        f"Single-bid procurement recorded in remote area (infrastructure gap {infra_gap:.2f})"
                    ))

            # 2. Quotation price clustering / collusive bidding
            sim = row.get("procurement__bid_price_similarity", 0.5)
            rot = row.get("procurement__bid_rotation_score", 0.0)
            if sim > 0.94 and rot > 0.40:
                cand_reasons.append((
                    sim * 10.0,
                    f"High bid price similarity across competing tenders ({sim*100:.1f}% quotation clustering)"
                ))

            # 3. Repeated winner & vendor concentration
            rep_winner = row.get("procurement__repeated_winner_flag", 0.0)
            comp_score = row.get("procurement__bid_competition_score", 0.8)
            if rep_winner == 1.0 and comp_score < 0.5:
                cand_reasons.append((
                    8.5,
                    f"Tender awarded to frequent repeated winning vendor with low competition index ({comp_score:.2f})"
                ))

            # 4. Post-award contract amendment / value leakage
            amend_val = row.get("contract__amendment_value", 0.0)
            leakage_idx = row.get("procurement__post_award_leakage_index", 0.0)
            if amend_val > 25000 or leakage_idx > 0.03:
                cand_reasons.append((
                    7.5,
                    f"Substantial post-award contract amendment (+₹{amend_val/1e5:.2f} Lakhs added post-tender)"
                ))

            # 5. Bidder disqualification rate / suppression
            disq_rate = row.get("procurement__bidder_disqualification_rate", 0.0)
            if disq_rate > 0.20:
                cand_reasons.append((
                    disq_rate * 12.0,
                    f"Elevated bidder disqualification rate during technical evaluation ({disq_rate*100:.1f}%)"
                ))

            # 6. Compressed tender publication window
            duration = row.get("procurement__tender_duration", 21)
            win_anom = row.get("procurement__tender_window_anomaly", 0.0)
            if duration < 15 or win_anom > 0.8:
                cand_reasons.append((
                    win_anom * 5.0,
                    f"Compressed tender submission window ({int(duration)} days vs statutory guidelines)"
                ))

            # 7. Low qualified bidder count
            qual_bids = row.get("procurement__qualified_bid_count", 5)
            if qual_bids <= 2 and single_flag == 0.0:
                cand_reasons.append((
                    4.0,
                    f"Narrow qualified bidder pool ({int(qual_bids)} qualified bidders evaluated)"
                ))

            # Sort candidate reasons by weight
            cand_reasons.sort(key=lambda x: x[0], reverse=True)

            primary = cand_reasons[0][1] if len(cand_reasons) > 0 else "Procurement bidding competition within normal parameters"
            secondary = cand_reasons[1][1] if len(cand_reasons) > 1 else "Tender publication window and bidder participation compliant"
            tertiary = cand_reasons[2][1] if len(cand_reasons) > 2 else "Contract award amount aligned with initial technical estimates"

            reasons_list.append({
                "primary_reason": primary,
                "secondary_reason": secondary,
                "tertiary_reason": tertiary,
            })

        return pd.DataFrame(reasons_list, index=df_features.index)

    def save(self, file_path: str) -> None:
        """Serialize fitted model to disk using joblib."""
        if not self.is_fitted_ or self.model_ is None:
            raise RuntimeError("Cannot save unfitted model.")
        joblib.dump(self, file_path)

    @classmethod
    def load(cls, file_path: str) -> "ProcurementIsolationForestModel":
        """Load serialized model from disk."""
        return joblib.load(file_path)
