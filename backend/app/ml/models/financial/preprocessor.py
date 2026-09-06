"""Financial Preprocessor.

Extracts approved early-warning financial features, computes robust peer statistics
(median, MAD, robust z-scores, peer ratios), imputes missing values deterministically,
and applies robust scaling.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler
import joblib

from .config import FinancialModelConfig


class FinancialPreprocessor:
    """Robust Preprocessor for Financial Anomaly Detection with Peer Normalization."""

    def __init__(self, config: Optional[FinancialModelConfig] = None):
        self.config = config or FinancialModelConfig()
        self.peer_stats_: Dict[str, Dict[str, Dict[str, float]]] = {}
        self.global_stats_: Dict[str, Dict[str, float]] = {}
        self.imputer_values_: Dict[str, float] = {}
        self.scaler_: Optional[RobustScaler] = None
        self.selected_base_features_: List[str] = []
        self.engineered_peer_features_: List[str] = []
        self.final_feature_names_: List[str] = []
        self.is_fitted_: bool = False

    def _validate_safety(self, df: pd.DataFrame) -> None:
        """Verify no target leakage or label contamination in the input."""
        leakage = [col for col in self.config.quarantined_labels if col in df.columns]
        if leakage:
            raise ValueError(
                f"CRITICAL SAFETY VIOLATION: Target labels detected in model input: {leakage}. "
                "Financial anomaly model must be strictly unsupervised."
            )
        if "project_id" not in df.columns:
            raise ValueError("Input dataframe must contain 'project_id' column.")

    def _compute_peer_stats(self, df: pd.DataFrame) -> None:
        """Compute robust Median and MAD for key financial metrics across peer groups."""
        peer_metrics = [
            "financial__estimated_cost",
            "financial__sanctioned_amount",
            "financial__cost_per_unit",
            "financial__cost_deviation",
            "payment__payment_velocity_mean",
            "payment__payment_concentration_max",
            "contract__contract_value_change",
        ]

        # 1. Primary peer group: project__work_type
        self.peer_stats_["work_type"] = {}
        if self.config.primary_peer_column in df.columns:
            work_types = df[self.config.primary_peer_column].dropna().unique()
            for wt in work_types:
                sub = df[df[self.config.primary_peer_column] == wt]
                self.peer_stats_["work_type"][str(wt)] = {}
                for col in peer_metrics:
                    if col in df.columns:
                        vals = sub[col].dropna().values
                        if len(vals) > 0:
                            med = float(np.median(vals))
                            mad = float(np.median(np.abs(vals - med)))
                            self.peer_stats_["work_type"][str(wt)][col] = {
                                "median": med,
                                "mad": mad,
                                "count": len(vals),
                            }

        # 2. Secondary peer group: project__category
        self.peer_stats_["category"] = {}
        if self.config.secondary_peer_column in df.columns:
            categories = df[self.config.secondary_peer_column].dropna().unique()
            for cat in categories:
                sub = df[df[self.config.secondary_peer_column] == cat]
                self.peer_stats_["category"][str(cat)] = {}
                for col in peer_metrics:
                    if col in df.columns:
                        vals = sub[col].dropna().values
                        if len(vals) > 0:
                            med = float(np.median(vals))
                            mad = float(np.median(np.abs(vals - med)))
                            self.peer_stats_["category"][str(cat)][col] = {
                                "median": med,
                                "mad": mad,
                                "count": len(vals),
                            }

        # 3. Global fallback stats
        self.global_stats_ = {}
        for col in peer_metrics:
            if col in df.columns:
                vals = df[col].dropna().values
                med = float(np.median(vals)) if len(vals) > 0 else 0.0
                mad = float(np.median(np.abs(vals - med))) if len(vals) > 0 else 1.0
                self.global_stats_[col] = {"median": med, "mad": mad, "count": len(vals)}

    def _engineer_peer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create robust peer-relative deviation and z-score features."""
        peer_dict = {}

        def get_stats(col: str, group_key: str, group_col: str):
            medians = []
            mads = []
            if group_col in df.columns:
                for val in df[group_col]:
                    stat = self.peer_stats_.get(group_key, {}).get(str(val), {}).get(col)
                    if stat and stat["count"] >= 5:
                        medians.append(stat["median"])
                        mads.append(stat["mad"])
                    else:
                        g_stat = self.global_stats_.get(col, {"median": 0.0, "mad": 1.0})
                        medians.append(g_stat["median"])
                        mads.append(g_stat["mad"])
            else:
                g_stat = self.global_stats_.get(col, {"median": 0.0, "mad": 1.0})
                medians = [g_stat["median"]] * len(df)
                mads = [g_stat["mad"]] * len(df)
            return np.array(medians), np.array(mads)

        eps = self.config.peer_epsilon
        mult = self.config.peer_mad_multiplier

        # Peer Cost features (work type)
        if "financial__estimated_cost" in df.columns:
            cost_med, cost_mad = get_stats("financial__estimated_cost", "work_type", self.config.primary_peer_column)
            raw_cost = df["financial__estimated_cost"].values
            peer_dict["peer__cost_diff_work_type_median"] = raw_cost - cost_med
            peer_dict["peer__cost_ratio_work_type_median"] = (raw_cost + eps) / (cost_med + eps)
            peer_dict["peer__cost_work_type_robust_z"] = (raw_cost - cost_med) / (mult * cost_mad + eps)

        # Peer Cost per unit features (work type)
        if "financial__cost_per_unit" in df.columns:
            unit_med, unit_mad = get_stats("financial__cost_per_unit", "work_type", self.config.primary_peer_column)
            raw_unit = df["financial__cost_per_unit"].values
            peer_dict["peer__unit_cost_ratio_work_type_median"] = (raw_unit + eps) / (unit_med + eps)
            peer_dict["peer__unit_cost_work_type_robust_z"] = (raw_unit - unit_med) / (mult * unit_mad + eps)

        # Peer Cost deviation robust z (work type)
        if "financial__cost_deviation" in df.columns:
            cdev_med, cdev_mad = get_stats("financial__cost_deviation", "work_type", self.config.primary_peer_column)
            raw_cdev = df["financial__cost_deviation"].values
            peer_dict["peer__cost_deviation_work_type_robust_z"] = (raw_cdev - cdev_med) / (mult * cdev_mad + eps)

        # Peer Payment Velocity robust z (work type)
        if "payment__payment_velocity_mean" in df.columns:
            vel_med, vel_mad = get_stats("payment__payment_velocity_mean", "work_type", self.config.primary_peer_column)
            raw_vel = df["payment__payment_velocity_mean"].values
            peer_dict["peer__payment_velocity_ratio_work_type_median"] = (raw_vel + eps) / (vel_med + eps)
            peer_dict["peer__payment_velocity_work_type_robust_z"] = (raw_vel - vel_med) / (mult * vel_mad + eps)

        # Peer Payment Concentration robust z (work type)
        if "payment__payment_concentration_max" in df.columns:
            conc_med, conc_mad = get_stats("payment__payment_concentration_max", "work_type", self.config.primary_peer_column)
            raw_conc = df["payment__payment_concentration_max"].values
            peer_dict["peer__payment_concentration_work_type_robust_z"] = (raw_conc - conc_med) / (mult * conc_mad + eps)

        # Peer Contract Value Change robust z (work type)
        if "contract__contract_value_change" in df.columns:
            cvc_med, cvc_mad = get_stats("contract__contract_value_change", "work_type", self.config.primary_peer_column)
            raw_cvc = df["contract__contract_value_change"].values
            peer_dict["peer__contract_value_change_work_type_robust_z"] = (raw_cvc - cvc_med) / (mult * cvc_mad + eps)

        # Peer Cost Category robust z (category)
        if "financial__estimated_cost" in df.columns:
            cat_med, cat_mad = get_stats("financial__estimated_cost", "category", self.config.secondary_peer_column)
            raw_cost = df["financial__estimated_cost"].values
            peer_dict["peer__cost_category_robust_z"] = (raw_cost - cat_med) / (mult * cat_mad + eps)

        return pd.DataFrame(peer_dict, index=df.index)

    def fit(self, df: pd.DataFrame) -> "FinancialPreprocessor":
        """Fit the preprocessor on master features."""
        self._validate_safety(df)

        base_features = list(self.config.base_financial_features)
        if self.config.mode == "retrospective":
            base_features.extend(self.config.retrospective_features)

        self.selected_base_features_ = [c for c in base_features if c in df.columns]
        self._compute_peer_stats(df)
        peer_df = self._engineer_peer_features(df)
        self.engineered_peer_features_ = list(peer_df.columns)

        combined_df = pd.concat([df[self.selected_base_features_], peer_df], axis=1)

        self.imputer_values_ = {}
        for col in combined_df.columns:
            val = combined_df[col].median()
            self.imputer_values_[col] = float(val) if not np.isnan(val) else 0.0

        imputed_matrix = combined_df.fillna(self.imputer_values_).values
        self.scaler_ = RobustScaler(unit_variance=False)
        self.scaler_.fit(imputed_matrix)
        self.final_feature_names_ = list(combined_df.columns)
        self.is_fitted_ = True
        return self

    def transform(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.DataFrame, np.ndarray]:
        """Transform input master features into scaled matrix for model scoring."""
        if not self.is_fitted_ or self.scaler_ is None:
            raise RuntimeError("FinancialPreprocessor must be fitted before calling transform.")

        self._validate_safety(df)
        project_ids = df["project_id"].copy()
        peer_df = self._engineer_peer_features(df)
        base_df = df[self.selected_base_features_].copy()
        combined_df = pd.concat([base_df, peer_df], axis=1)
        imputed_df = combined_df.fillna(self.imputer_values_)
        scaled_matrix = self.scaler_.transform(imputed_df.values)
        return project_ids, imputed_df, scaled_matrix

    def fit_transform(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.DataFrame, np.ndarray]:
        """Fit and transform in a single call."""
        return self.fit(df).transform(df)

    def save(self, filepath: str) -> None:
        """Save preprocessor to disk."""
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "FinancialPreprocessor":
        """Load preprocessor from disk."""
        return joblib.load(filepath)
