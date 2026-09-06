"""Procurement & Tender Rigging Preprocessor.

Extracts approved early-warning procurement and contract features, engineers
bid suppression, tender window compression, collusive bid clustering,
post-award variation indices, and robust peer deviations (work type / category).
Applies deterministic imputation and robust scaling.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler
import joblib

from .config import ProcurementModelConfig


class ProcurementPreprocessor:
    """Robust Preprocessor for Procurement Anomaly Detection with Peer Normalization."""

    def __init__(self, config: Optional[ProcurementModelConfig] = None):
        self.config = config or ProcurementModelConfig()
        self.peer_stats_: Dict[str, Dict[str, Dict[str, float]]] = {}
        self.global_stats_: Dict[str, Dict[str, float]] = {}
        self.imputer_values_: Dict[str, float] = {}
        self.scaler_: Optional[RobustScaler] = None
        self.selected_base_features_: List[str] = []
        self.engineered_features_: List[str] = []
        self.final_feature_names_: List[str] = []
        self.is_fitted_: bool = False

    def _validate_safety(self, df: pd.DataFrame) -> None:
        """Verify no target leakage or quarantined labels in the model input."""
        leakage = [col for col in self.config.quarantined_labels if col in df.columns]
        if leakage:
            raise ValueError(
                f"CRITICAL SAFETY VIOLATION: Target labels detected in model input: {leakage}. "
                "Procurement anomaly model must be strictly unsupervised."
            )
        if "project_id" not in df.columns:
            raise ValueError("Input dataframe must contain 'project_id' column.")

    def _compute_peer_stats(self, df: pd.DataFrame) -> None:
        """Compute robust Median and MAD for key procurement metrics across peer groups."""
        peer_metrics = [
            "procurement__bid_count",
            "procurement__qualified_bid_count",
            "procurement__bid_competition_score",
            "procurement__winning_bid_deviation",
            "procurement__bid_price_similarity",
            "contract__amendment_value",
            "contract__contract_value_change",
        ]

        primary_col = self.config.primary_peer_column
        secondary_col = self.config.secondary_peer_column

        # 1. Primary peer group: project__work_type
        self.peer_stats_["work_type"] = {}
        if primary_col in df.columns:
            for wt, sub in df.groupby(primary_col):
                self.peer_stats_["work_type"][str(wt)] = {}
                for col in peer_metrics:
                    if col in sub.columns:
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
        if secondary_col in df.columns:
            for cat, sub in df.groupby(secondary_col):
                self.peer_stats_["category"][str(cat)] = {}
                for col in peer_metrics:
                    if col in sub.columns:
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

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create domain-specific procurement features and peer-relative robust z-scores."""
        eps = self.config.peer_epsilon
        mult = self.config.peer_mad_multiplier
        engineered = {}

        # 1. Tender window compression anomaly (statutory norm is >= 21 days)
        if "procurement__tender_duration" in df.columns:
            dur = df["procurement__tender_duration"].values
            engineered["procurement__tender_window_anomaly"] = np.maximum(0.0, (21.0 - dur) / 7.0)
        else:
            engineered["procurement__tender_window_anomaly"] = np.zeros(len(df))

        # 2. Bid suppression score (disqualifications & single bid vs available bidders)
        disq = df.get("procurement__bidder_disqualification_rate", pd.Series(0.0, index=df.index)).values
        single = df.get("procurement__single_bid_flag", pd.Series(0.0, index=df.index)).values
        qual = df.get("procurement__qualified_bid_count", pd.Series(1.0, index=df.index)).values
        engineered["procurement__bid_suppression_score"] = (disq + single) / np.maximum(1.0, qual)

        # 3. Collusive bid price clustering score
        sim = df.get("procurement__bid_price_similarity", pd.Series(0.5, index=df.index)).values
        rep_winner = df.get("procurement__repeated_winner_flag", pd.Series(0.0, index=df.index)).values
        rot_score = df.get("procurement__bid_rotation_score", pd.Series(0.0, index=df.index)).values
        engineered["procurement__collusive_clustering_score"] = sim * (1.0 + rep_winner) * rot_score

        # 4. Post-award amendment variation index
        amend_val = np.maximum(0.0, df.get("contract__amendment_value", pd.Series(0.0, index=df.index)).values)
        win_amt = df.get("procurement__winning_bid_amount", pd.Series(1.0, index=df.index)).values
        engineered["procurement__post_award_leakage_index"] = amend_val / np.maximum(1.0, win_amt)

        # 5. Single bid in accessible/urban area (low infrastructure gap)
        infra_gap = df.get("geo__infrastructure_gap_index", pd.Series(0.5, index=df.index)).values
        engineered["procurement__urban_single_bid_anomaly"] = single * np.maximum(0.0, 1.0 - infra_gap)

        # Helper for peer stats lookup
        def get_stats(col: str, group_key: str, group_col: str):
            medians = []
            mads = []
            if group_col in df.columns:
                for val in df[group_col]:
                    stat = self.peer_stats_.get(group_key, {}).get(str(val), {}).get(col)
                    if stat and stat["count"] >= 3:
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

        # 6. Peer Bid Count Robust Z (negative indicates deficit of bidders)
        if "procurement__bid_count" in df.columns:
            bid_med, bid_mad = get_stats("procurement__bid_count", "work_type", self.config.primary_peer_column)
            raw_bids = df["procurement__bid_count"].values
            engineered["peer__bid_count_diff_median"] = raw_bids - bid_med
            engineered["peer__bid_count_robust_z"] = (raw_bids - bid_med) / (mult * bid_mad + eps)

        # 7. Peer Bid Price Similarity Robust Z (positive indicates excessive quotation similarity)
        if "procurement__bid_price_similarity" in df.columns:
            sim_med, sim_mad = get_stats("procurement__bid_price_similarity", "work_type", self.config.primary_peer_column)
            raw_sim = df["procurement__bid_price_similarity"].values
            engineered["peer__bid_similarity_robust_z"] = (raw_sim - sim_med) / (mult * sim_mad + eps)

        # 8. Peer Contract Amendment Value Robust Z
        if "contract__amendment_value" in df.columns:
            am_med, am_mad = get_stats("contract__amendment_value", "work_type", self.config.primary_peer_column)
            raw_am = df["contract__amendment_value"].values
            engineered["peer__amendment_value_robust_z"] = (raw_am - am_med) / (mult * am_mad + eps)

        # 9. Peer Winning Bid Deviation Robust Z
        if "procurement__winning_bid_deviation" in df.columns:
            dev_med, dev_mad = get_stats("procurement__winning_bid_deviation", "work_type", self.config.primary_peer_column)
            raw_dev = df["procurement__winning_bid_deviation"].values
            engineered["peer__winning_deviation_robust_z"] = (raw_dev - dev_med) / (mult * dev_mad + eps)

        return pd.DataFrame(engineered, index=df.index)

    def fit(self, df: pd.DataFrame) -> "ProcurementPreprocessor":
        """Fit preprocessor, calculate peer stats, and fit RobustScaler."""
        self._validate_safety(df)

        # 1. Compute peer stats
        self._compute_peer_stats(df)

        # 2. Extract base features
        base_cols = [c for c in self.config.base_procurement_features if c in df.columns]
        if self.config.mode == "retrospective":
            base_cols.extend([c for c in self.config.retrospective_features if c in df.columns])
        self.selected_base_features_ = sorted(list(set(base_cols)))

        # 3. Engineer procurement features
        df_engineered = self._engineer_features(df)
        self.engineered_features_ = list(df_engineered.columns)

        # 4. Assemble candidate matrix
        combined = pd.concat([df[self.selected_base_features_], df_engineered], axis=1)

        # Keep strictly numeric features
        numeric_cols = []
        for c in combined.columns:
            if np.issubdtype(combined[c].dtype, np.number):
                numeric_cols.append(c)

        self.final_feature_names_ = sorted(numeric_cols)

        # Compute deterministic median imputer values
        self.imputer_values_ = {}
        for c in self.final_feature_names_:
            val = combined[c].dropna().median()
            self.imputer_values_[c] = float(val) if not np.isnan(val) else 0.0

        imputed_matrix = combined[self.final_feature_names_].fillna(self.imputer_values_).values

        # Fit RobustScaler
        self.scaler_ = RobustScaler()
        self.scaler_.fit(imputed_matrix)

        self.is_fitted_ = True
        return self

    def transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame, np.ndarray]:
        """Transform dataframe into imputed feature dataframe and scaled numpy matrix."""
        if not self.is_fitted_ or self.scaler_ is None:
            raise RuntimeError("ProcurementPreprocessor must be fitted before transforming.")

        self._validate_safety(df)
        project_ids = df["project_id"].values

        df_engineered = self._engineer_features(df)
        combined = pd.concat([df[self.selected_base_features_], df_engineered], axis=1)

        # Impute missing values deterministically
        df_imputed = combined[self.final_feature_names_].fillna(self.imputer_values_)
        X_scaled = self.scaler_.transform(df_imputed.values)

        # Rich feature dataframe for downstream explainability traces
        df_features_rich = combined.copy()
        for c, val in self.imputer_values_.items():
            if c in df_features_rich.columns:
                df_features_rich[c] = df_features_rich[c].fillna(val)

        return project_ids, df_features_rich, X_scaled

    def fit_transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame, np.ndarray]:
        """Fit on dataframe and return project IDs, rich feature dataframe, and scaled matrix."""
        return self.fit(df).transform(df)

    def save(self, file_path: str) -> None:
        """Serialize fitted preprocessor to disk using joblib."""
        if not self.is_fitted_:
            raise RuntimeError("Cannot save unfitted preprocessor.")
        joblib.dump(self, file_path)

    @classmethod
    def load(cls, file_path: str) -> "ProcurementPreprocessor":
        """Load serialized preprocessor from disk."""
        return joblib.load(file_path)
