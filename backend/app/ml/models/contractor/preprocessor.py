"""Contractor & Implementing Agency Preprocessor.

Extracts approved early-warning contractor/agency features, engineers capacity strain,
corporate collusion indices, agency capture scores, governance instability metrics,
and robust peer deviations across work types and categories.
Applies deterministic imputation and robust scaling.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler
import joblib

from .config import ContractorModelConfig


class ContractorPreprocessor:
    """Robust Preprocessor for Contractor & Agency Monopolization Anomaly Detection."""

    def __init__(self, config: Optional[ContractorModelConfig] = None):
        self.config = config or ContractorModelConfig()
        self.peer_stats_: Dict[str, Dict[str, Dict[str, float]]] = {}
        self.global_stats_: Dict[str, Dict[str, float]] = {}
        self.imputer_values_: Dict[str, float] = {}
        self.scaler_: Optional[RobustScaler] = None
        self.selected_base_features_: List[str] = []
        self.engineered_features_: List[str] = []
        self.final_feature_names_: List[str] = []
        self.is_fitted_: bool = False

    def _validate_safety(self, df: pd.DataFrame) -> None:
        """Verify no target leakage or quarantined labels in model input."""
        leakage = [col for col in self.config.quarantined_labels if col in df.columns]
        if leakage:
            raise ValueError(
                f"CRITICAL SAFETY VIOLATION: Target labels detected in model input: {leakage}. "
                "Contractor anomaly model must be strictly unsupervised."
            )
        if "project_id" not in df.columns:
            raise ValueError("Input dataframe must contain 'project_id' column.")

    def _compute_peer_stats(self, df: pd.DataFrame) -> None:
        """Compute robust Median and MAD for key contractor metrics across peer groups."""
        peer_metrics = [
            "contractor__contractor_project_count",
            "contractor__contractor_agency_concentration",
            "contractor__contractor_value_share",
            "contractor__past_irregularity_rate",
            "agency__agency_workload_ratio",
            "contract__contract_value_to_capacity",
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
        """Create domain-specific contractor features and peer-relative robust z-scores."""
        eps = self.config.peer_epsilon
        mult = self.config.peer_mad_multiplier
        engineered = {}

        # 1. Capacity strain index (value-to-capacity > 1.0 indicates over-allocation)
        val_to_cap = df.get("contract__contract_value_to_capacity", pd.Series(0.0, index=df.index)).values
        engineered["contractor__capacity_strain_index"] = np.maximum(0.0, val_to_cap - 1.0)

        # 2. Corporate collusion risk index (weighted composite of shared corporate links)
        dirs = df.get("contractor__shared_directors", pd.Series(0.0, index=df.index)).values
        addr = df.get("contractor__shared_address", pd.Series(0.0, index=df.index)).values
        own = df.get("contractor__shared_ownership", pd.Series(0.0, index=df.index)).values
        shold = df.get("contractor__shared_shareholders", pd.Series(0.0, index=df.index)).values
        benef = df.get("contractor__beneficial_owner_overlap", pd.Series(0.0, index=df.index)).values
        engineered["contractor__corporate_collusion_index"] = (
            0.30 * dirs + 0.25 * addr + 0.20 * own + 0.15 * shold + 0.10 * benef
        )

        # 3. Agency-contractor capture score
        rep_pair = df.get("contractor__repeated_agency_contractor_pair", pd.Series(0.0, index=df.index)).values
        agency_conc = df.get("contractor__contractor_agency_concentration", pd.Series(0.5, index=df.index)).values
        workload_ratio = df.get("agency__agency_workload_ratio", pd.Series(1.0, index=df.index)).values
        engineered["contractor__agency_capture_score"] = rep_pair * agency_conc * workload_ratio

        # 4. Governance instability score (sudden ownership / director / address changes)
        own_chg = df.get("contractor__company_ownership_change", pd.Series(0.0, index=df.index)).values
        dir_chg = df.get("contractor__director_change", pd.Series(0.0, index=df.index)).values
        addr_chg = df.get("contractor__address_change", pd.Series(0.0, index=df.index)).values
        engineered["contractor__governance_instability_score"] = own_chg * 1.5 + dir_chg * 1.0 + addr_chg * 0.8

        # 5. Constituency monopolization exposure
        const_conc = df.get("contractor__contractor_constituency_concentration", pd.Series(0.0, index=df.index)).values
        val_share = df.get("contractor__contractor_value_share", pd.Series(0.0, index=df.index)).values
        engineered["contractor__monopolization_exposure"] = const_conc * val_share

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

        # 6. Peer project count robust Z
        if "contractor__contractor_project_count" in df.columns:
            cnt_med, cnt_mad = get_stats("contractor__contractor_project_count", "work_type", self.config.primary_peer_column)
            raw_cnt = df["contractor__contractor_project_count"].values
            engineered["peer__contractor_project_count_robust_z"] = (raw_cnt - cnt_med) / (mult * cnt_mad + eps)

        # 7. Peer agency concentration robust Z
        if "contractor__contractor_agency_concentration" in df.columns:
            conc_med, conc_mad = get_stats("contractor__contractor_agency_concentration", "work_type", self.config.primary_peer_column)
            raw_conc = df["contractor__contractor_agency_concentration"].values
            engineered["peer__agency_concentration_robust_z"] = (raw_conc - conc_med) / (mult * conc_mad + eps)

        # 8. Peer value to capacity robust Z
        if "contract__contract_value_to_capacity" in df.columns:
            cap_med, cap_mad = get_stats("contract__contract_value_to_capacity", "work_type", self.config.primary_peer_column)
            raw_cap = df["contract__contract_value_to_capacity"].values
            engineered["peer__value_to_capacity_robust_z"] = (raw_cap - cap_med) / (mult * cap_mad + eps)

        # 9. Peer past irregularity rate robust Z
        if "contractor__past_irregularity_rate" in df.columns:
            irreg_med, irreg_mad = get_stats("contractor__past_irregularity_rate", "work_type", self.config.primary_peer_column)
            raw_irreg = df["contractor__past_irregularity_rate"].values
            engineered["peer__past_irregularity_rate_robust_z"] = (raw_irreg - irreg_med) / (mult * irreg_mad + eps)

        return pd.DataFrame(engineered, index=df.index)

    def fit(self, df: pd.DataFrame) -> "ContractorPreprocessor":
        """Fit preprocessor, calculate peer stats, and fit RobustScaler."""
        self._validate_safety(df)

        # 1. Compute peer stats
        self._compute_peer_stats(df)

        # 2. Extract base features
        base_cols = [c for c in self.config.base_contractor_features if c in df.columns]
        if self.config.mode == "retrospective":
            base_cols.extend([c for c in self.config.retrospective_features if c in df.columns])
        self.selected_base_features_ = sorted(list(set(base_cols)))

        # 3. Engineer contractor features
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
            raise RuntimeError("ContractorPreprocessor must be fitted before transforming.")

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
    def load(cls, file_path: str) -> "ContractorPreprocessor":
        """Load serialized preprocessor from disk."""
        return joblib.load(file_path)
