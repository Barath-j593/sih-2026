"""
SETU — Stage 2G: Progress vs. Execution Trajectory Preprocessor.

Extracts, engineers, normalizes, and scales execution trajectory features:
- Physical-financial divergence penalty: Gap^2 where financial > physical
- Ghost work index: 100% financial disbursement with zero physical progress
- Execution stall score: multi-year duration overrun with near-zero progress velocity
- Verification deficit: missing Measurement Book and geotagged documentation
- Peer-normalized (work_type x category) Median / MAD Z-scores
- Robust scaling for anomaly detection
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import RobustScaler

from app.ml.models.progress.config import ProgressModelConfig


class ProgressPreprocessor(BaseEstimator, TransformerMixin):
    """Preprocessor for execution trajectory anomaly detection."""

    def __init__(self, config: Optional[ProgressModelConfig] = None):
        self.config = config or ProgressModelConfig()
        self.scaler = RobustScaler()
        self.feature_names_: List[str] = []
        self.peer_stats_: Dict[str, Dict[Tuple, Dict[str, float]]] = {}
        self.global_stats_: Dict[str, Dict[str, float]] = {}
        self.is_fitted: bool = False

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
        """Compute all engineered progress execution trajectory domain features."""
        df_out = pd.DataFrame(index=df.index)

        # 1. Divergence Penalty: (max(0, Financial % - Physical %) / 100)^2
        gap = df.get(
            "progress__financial_minus_physical_progress",
            pd.Series(0.0, index=df.index)
        ).fillna(0.0)
        df_out["progress__divergence_penalty"] = np.square(np.maximum(0.0, gap / 100.0))

        # 2. Ghost Work Index: Financial % / 100 * I(Physical % <= 5.0)
        phys = df.get(
            "progress__latest_physical_progress",
            pd.Series(0.0, index=df.index)
        ).fillna(0.0)
        fin = df.get(
            "progress__latest_financial_progress",
            pd.Series(0.0, index=df.index)
        ).fillna(0.0)
        is_ghost_phys = (phys <= self.config.ghost_physical_max).astype(float)
        df_out["progress__ghost_work_index"] = (fin / 100.0) * is_ghost_phys

        # 3. Execution Stall Score: (Overrun Days / 365) * exp(-5 * Physical Slope)
        overrun_days = df.get(
            "progress__duration_overrun_days",
            pd.Series(0.0, index=df.index)
        ).fillna(0.0)
        phys_slope = df.get(
            "progress__physical_progress_slope",
            pd.Series(0.5, index=df.index)
        ).fillna(0.5)
        overrun_factor = np.maximum(0.0, overrun_days / 365.0)
        slope_penalty = np.exp(-5.0 * np.clip(phys_slope, 0.0, 1.0))
        df_out["progress__execution_stall_score"] = overrun_factor * slope_penalty

        # 4. Verification Deficit Index: (1 - MB Verified) + (1 - Geotag Rate)
        mb_rate = df.get(
            "progress__measurement_book_verified_rate",
            pd.Series(1.0, index=df.index)
        ).fillna(1.0)
        geotag_rate = df.get(
            "progress__geotag_available_rate",
            pd.Series(1.0, index=df.index)
        ).fillna(1.0)
        df_out["progress__verification_deficit_index"] = (1.0 - mb_rate) + (1.0 - geotag_rate)

        # 5. Peer-normalized features (computed using fitted stats)
        df_out["progress__peer_physical_slope_z"] = self._apply_peer_mad_z(
            df, "progress__physical_progress_slope"
        )
        df_out["progress__peer_duration_overrun_z"] = self._apply_peer_mad_z(
            df, "progress__duration_overrun_days"
        )

        return df_out

    def fit(self, X: pd.DataFrame, y=None):
        """Fit preprocessor: compute peer group stats and scale training data."""
        # 1. Compute peer statistics for peer-normalized features
        cols_to_peer_normalize = [
            "progress__physical_progress_slope",
            "progress__duration_overrun_days",
        ]
        self._compute_peer_mad_stats(X, cols_to_peer_normalize)

        # 2. Extract base features and context features
        selected_base = [c for c in self.config.base_progress_features if c in X.columns]
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
        """Transform dataframe into scaled progress feature matrix."""
        if not self.is_fitted:
            raise RuntimeError("ProgressPreprocessor must be fitted before calling transform().")

        selected_base = [c for c in self.config.base_progress_features if c in X.columns]
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
