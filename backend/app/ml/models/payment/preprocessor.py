"""
SETU — Stage 2F: Granular Payment Structuring Preprocessor.

Extracts, engineers, normalizes, and scales payment structuring features:
- Statutory ceiling smurfing near statutory approval limits (₹15L, ₹25L, ₹50L)
- Unverified disbursement exposure index and rates
- Disbursement velocity bursts and planned velocity divergence
- Installment concentration, lumpiness, and final installment imbalance
- Robust peer group (work_type x category) Median / MAD normalizations
- Robust scaling for anomaly detection
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import RobustScaler

from app.ml.models.payment.config import PaymentModelConfig


class PaymentPreprocessor(BaseEstimator, TransformerMixin):
    """Preprocessor for payment structuring anomaly detection."""

    def __init__(self, config: Optional[PaymentModelConfig] = None):
        self.config = config or PaymentModelConfig()
        self.scaler = RobustScaler()
        self.feature_names_: List[str] = []
        self.peer_stats_: Dict[str, Dict[Tuple, Dict[str, float]]] = {}
        self.global_stats_: Dict[str, Dict[str, float]] = {}
        self.is_fitted: bool = False

    def _compute_smurfing_score(
        self,
        amounts: pd.Series,
        thresholds: List[float],
        bandwidth: float,
        window_pct: float,
    ) -> pd.Series:
        """Compute Gaussian smurfing score for amounts just below statutory ceilings."""
        scores = np.zeros(len(amounts), dtype=float)
        vals = amounts.fillna(0.0).to_numpy()

        for thresh in thresholds:
            lower_bound = thresh * (1.0 - window_pct)
            in_window = (vals >= lower_bound) & (vals <= thresh)
            if np.any(in_window):
                diff = vals[in_window] - thresh
                gaussian = np.exp(-0.5 * (diff / bandwidth) ** 2)
                scores[in_window] = np.maximum(scores[in_window], gaussian)

        return pd.Series(scores, index=amounts.index)

    def _compute_peer_mad_stats(
        self,
        df: pd.DataFrame,
        cols_to_normalize: List[str],
    ) -> None:
        """Calculate robust Median and MAD by peer group during training."""
        group_cols = self.config.peer_group_cols

        for col in cols_to_normalize:
            # Global fallback stats
            valid_vals = df[col].dropna()
            global_med = float(valid_vals.median()) if len(valid_vals) > 0 else 0.0
            global_mad = float((valid_vals - global_med).abs().median()) if len(valid_vals) > 0 else 1.0
            if global_mad < 1e-6:
                global_mad = 1.0
            self.global_stats_[col] = {"median": global_med, "mad": global_mad}

            # Group level stats
            self.peer_stats_[col] = {}
            if all(g in df.columns for g in group_cols):
                grouped = df.groupby(group_cols)[col]
                medians = grouped.median()
                
                for group_key, med_val in medians.items():
                    group_data = df.loc[
                        (df[group_cols[0]] == group_key[0]) & 
                        (df[group_cols[1]] == group_key[1]),
                        col
                    ].dropna()
                    mad_val = float((group_data - med_val).abs().median()) if len(group_data) > 0 else global_mad
                    if mad_val < 1e-6:
                        mad_val = global_mad
                    self.peer_stats_[col][group_key] = {"median": float(med_val), "mad": mad_val}

    def _apply_peer_mad_z(
        self,
        df: pd.DataFrame,
        col: str,
    ) -> pd.Series:
        """Apply fitted Median and MAD normalizations to produce robust Z-scores."""
        group_cols = self.config.peer_group_cols
        global_med = self.global_stats_[col]["median"]
        global_mad = self.global_stats_[col]["mad"]
        vals = df[col].fillna(global_med).to_numpy()
        z_scores = np.zeros(len(df), dtype=float)

        if all(g in df.columns for g in group_cols):
            keys = list(zip(df[group_cols[0]], df[group_cols[1]]))
            for i, k in enumerate(keys):
                stat = self.peer_stats_[col].get(k)
                if stat:
                    med, mad = stat["median"], stat["mad"]
                else:
                    med, mad = global_med, global_mad
                z_scores[i] = (vals[i] - med) / (1.4826 * mad + 1e-6)
        else:
            z_scores = (vals - global_med) / (1.4826 * global_mad + 1e-6)

        return pd.Series(np.clip(z_scores, -10.0, 10.0), index=df.index)

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all engineered payment structuring domain features."""
        df_out = pd.DataFrame(index=df.index)

        # 1. Statutory Ceiling Smurfing
        sanction_amount = df.get("financial__sanctioned_amount", pd.Series(0.0, index=df.index)).fillna(0.0)
        max_payment = df.get("payment__max_payment", pd.Series(0.0, index=df.index)).fillna(0.0)
        
        smurf_sanction = self._compute_smurfing_score(
            sanction_amount,
            self.config.smurfing_thresholds,
            self.config.smurfing_bandwidth,
            self.config.smurfing_window_pct,
        )
        smurf_maxpay = self._compute_smurfing_score(
            max_payment,
            self.config.smurfing_thresholds,
            self.config.smurfing_bandwidth,
            self.config.smurfing_window_pct,
        )
        df_out["payment__statutory_smurfing_score"] = np.maximum(smurf_sanction, smurf_maxpay)

        # 2. Unverified Exposure Index (interaction of rate and count)
        unverified_rate = df.get("payment__unverified_payment_rate", pd.Series(0.0, index=df.index)).fillna(0.0)
        unverified_count = df.get("payment__unverified_payment_count", pd.Series(0.0, index=df.index)).fillna(0.0)
        df_out["payment__unverified_exposure_index"] = unverified_rate * np.log1p(np.maximum(0.0, unverified_count))

        # 3. Disbursement Velocity Ratio
        velocity_mean = df.get("payment__payment_velocity_mean", pd.Series(0.0, index=df.index)).fillna(0.0)
        planned_days = df.get("project__planned_duration_days", pd.Series(180.0, index=df.index)).fillna(180.0).clip(lower=30.0)
        planned_exp_velocity = sanction_amount / planned_days
        df_out["payment__disbursement_velocity_ratio"] = velocity_mean / np.maximum(1.0, planned_exp_velocity)

        # 4. Disbursement Lumpiness Index
        concentration_max = df.get("payment__payment_concentration_max", pd.Series(0.0, index=df.index)).fillna(0.0)
        final_share = df.get("payment__final_installment_share", pd.Series(0.0, index=df.index)).fillna(0.0)
        df_out["payment__disbursement_lumpiness_index"] = concentration_max * np.maximum(0.0, 1.0 - final_share)

        # 5. Rapid Disbursement Flag
        pay_span = df.get("payment__payment_span_days", pd.Series(0.0, index=df.index)).fillna(0.0)
        pay_count = df.get("payment__payment_count", pd.Series(0.0, index=df.index)).fillna(0.0)
        is_rapid = (pay_span < 0.25 * planned_days) & (pay_count >= 2.0)
        df_out["payment__rapid_disbursement_flag"] = is_rapid.astype(float)

        # 6. Payment Timing Risk Index
        timing_rate = df.get("payment__payment_timing_anomaly_rate", pd.Series(0.0, index=df.index)).fillna(0.0)
        timing_count = df.get("payment__payment_timing_anomaly_count", pd.Series(0.0, index=df.index)).fillna(0.0)
        df_out["payment__payment_timing_risk_index"] = timing_rate * np.log1p(np.maximum(0.0, timing_count))

        # 7. Peer-normalized features (computed using fitted stats)
        df_out["payment__peer_velocity_mean_z"] = self._apply_peer_mad_z(df, "payment__payment_velocity_mean")
        df_out["payment__peer_concentration_z"] = self._apply_peer_mad_z(df, "payment__payment_concentration_max")

        return df_out

    def fit(self, X: pd.DataFrame, y=None):
        """Fit preprocessor: compute peer group stats and scale training data."""
        # 1. Compute peer statistics for peer-normalized features
        cols_to_peer_normalize = [
            "payment__payment_velocity_mean",
            "payment__payment_concentration_max",
        ]
        self._compute_peer_mad_stats(X, cols_to_peer_normalize)

        # 2. Extract base features and context features
        selected_base = [c for c in self.config.base_payment_features if c in X.columns]
        selected_context = [c for c in self.config.context_features if c in X.columns]
        
        base_mat = X[selected_base + selected_context].copy().fillna(0.0)
        engineered_mat = self._engineer_features(X)

        combined = pd.concat([base_mat, engineered_mat], axis=1)
        self.feature_names_ = list(combined.columns)

        # 3. Fit robust scaler
        self.scaler.fit(combined.to_numpy())
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transform dataframe into scaled payment feature matrix."""
        if not self.is_fitted:
            raise RuntimeError("PaymentPreprocessor must be fitted before calling transform().")

        selected_base = [c for c in self.config.base_payment_features if c in X.columns]
        selected_context = [c for c in self.config.context_features if c in X.columns]
        
        base_mat = X[selected_base + selected_context].copy().fillna(0.0)
        engineered_mat = self._engineer_features(X)

        combined = pd.concat([base_mat, engineered_mat], axis=1)
        
        # Ensure column ordering matches training
        for col in self.feature_names_:
            if col not in combined.columns:
                combined[col] = 0.0
        combined = combined[self.feature_names_]

        return self.scaler.transform(combined.to_numpy())

    def get_feature_names(self) -> List[str]:
        """Return list of transformed feature names."""
        return list(self.feature_names_)
