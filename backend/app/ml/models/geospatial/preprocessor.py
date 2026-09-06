"""Geospatial Preprocessor.

Extracts approved early-warning spatial features, computes spherical (Haversine)
distance metrics, spatial clustering (DBSCAN), Local Outlier Factor (LOF),
and robust peer statistics (cluster Median/MAD, robust z-scores, spatial cost ratios).
Applies deterministic imputation and robust scaling.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.cluster import DBSCAN
from sklearn.neighbors import NearestNeighbors, LocalOutlierFactor
from sklearn.preprocessing import RobustScaler
import joblib

from .config import GeospatialModelConfig


class GeospatialPreprocessor:
    """Robust Preprocessor for Geospatial Anomaly Detection with Spatial Clustering."""

    def __init__(self, config: Optional[GeospatialModelConfig] = None):
        self.config = config or GeospatialModelConfig()
        self.cluster_peer_stats_: Dict[str, Dict[str, Dict[str, float]]] = {}
        self.global_stats_: Dict[str, Dict[str, float]] = {}
        self.imputer_values_: Dict[str, float] = {}
        self.scaler_: Optional[RobustScaler] = None
        self.selected_base_features_: List[str] = []
        self.engineered_spatial_features_: List[str] = []
        self.final_feature_names_: List[str] = []
        self.is_fitted_: bool = False

    def _validate_safety(self, df: pd.DataFrame) -> None:
        """Verify no target leakage or quarantined labels exist in the model input."""
        leakage = [col for col in self.config.quarantined_labels if col in df.columns]
        if leakage:
            raise ValueError(
                f"CRITICAL SAFETY VIOLATION: Target labels detected in model input: {leakage}. "
                "Geospatial anomaly model must be strictly unsupervised."
            )
        if "project_id" not in df.columns:
            raise ValueError("Input dataframe must contain 'project_id' column.")

    def _compute_spatial_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate spherical Haversine distances, clustering, and local outlier factor."""
        lat_col = "project__project_latitude"
        lon_col = "project__project_longitude"

        if lat_col not in df.columns or lon_col not in df.columns:
            raise ValueError(f"Required spatial coordinate columns '{lat_col}' and '{lon_col}' not found.")

        lats = df[lat_col].fillna(df[lat_col].median()).values
        lons = df[lon_col].fillna(df[lon_col].median()).values

        # Convert to radians for spherical trigonometry
        coords_rad = np.radians(np.column_stack([lats, lons]))
        r_earth = self.config.earth_radius_km
        # 1. Nearest Neighbors, DBSCAN, and LOF for distance and cluster metrics
        if len(df) > 1:
            k = min(self.config.k_nearest_neighbors, len(df) - 1)
            nn = NearestNeighbors(n_neighbors=k + 1, metric="haversine", algorithm="ball_tree")
            nn.fit(coords_rad)
            distances, indices = nn.kneighbors(coords_rad)

            # Distances in km (skip index 0 which is distance to self)
            distances_km = distances * r_earth
            nearest_dist = distances_km[:, 1]
            mean_k_dist = distances_km[:, 1 : k + 1].mean(axis=1)

            # Count projects within local density radius (e.g. 25km)
            radius_rad = self.config.local_density_radius_km / r_earth
            radius_indices = nn.radius_neighbors(coords_rad, radius=radius_rad, return_distance=False)
            density_in_radius = np.array([len(nbrs) for nbrs in radius_indices], dtype=float)

            # 2. Spatial DBSCAN for dense pocket / cluster detection
            eps_rad = self.config.dbscan_eps_km / r_earth
            db = DBSCAN(eps=eps_rad, min_samples=self.config.dbscan_min_samples, metric="haversine")
            db_labels = db.fit_predict(coords_rad)

            is_noise = (db_labels == -1).astype(float)
            unique_labels, counts = np.unique(db_labels, return_counts=True)
            label_count_map = dict(zip(unique_labels, counts))
            cluster_sizes = np.array([label_count_map[lbl] if lbl != -1 else 1 for lbl in db_labels], dtype=float)

            # 3. Spatial Local Outlier Factor (LOF)
            lof_k = min(self.config.lof_n_neighbors, len(df) - 1)
            lof = LocalOutlierFactor(n_neighbors=lof_k, metric="haversine", novelty=False)
            lof.fit(coords_rad)
            lof_scores = -lof.negative_outlier_factor_  # ~1.0 is normal, >1.5 is isolated outlier
        else:
            # Graceful single-row fallback for online proposal scoring
            nearest_dist = np.array([12.5])
            mean_k_dist = np.array([25.0])
            density_in_radius = np.array([1.0])
            db_labels = np.array([0])
            is_noise = np.array([0.0])
            cluster_sizes = np.array([1.0])
            lof_scores = np.array([1.0])

        # 4. Contextual density alignment ratios
        pop_dens = df["geo__population_density"].values if "geo__population_density" in df.columns else np.ones(len(df))
        infra_gap = df["geo__infrastructure_gap_index"].values if "geo__infrastructure_gap_index" in df.columns else np.full(len(df), 0.5)

        # High project density relative to population density indicates artificial clustering
        log_pop = np.log1p(np.maximum(0.0, pop_dens))
        density_to_pop_ratio = (density_in_radius + 1.0) / (log_pop + 1.0)

        # High project density where infrastructure gap is very low indicates redundancy
        density_to_gap_ratio = density_in_radius * np.maximum(0.05, 1.0 - infra_gap)

        spatial_df = pd.DataFrame(
            {
                "spatial__nearest_neighbor_dist_km": nearest_dist,
                "spatial__mean_k_neighbor_dist_km": mean_k_dist,
                "spatial__density_in_radius": density_in_radius,
                "spatial__dbscan_cluster_id": db_labels,
                "spatial__dbscan_cluster_size": cluster_sizes,
                "spatial__is_dbscan_noise": is_noise,
                "spatial__lof_score": lof_scores,
                "spatial__density_to_pop_ratio": density_to_pop_ratio,
                "spatial__density_to_gap_ratio": density_to_gap_ratio,
            },
            index=df.index,
        )

        return spatial_df

    def _compute_peer_stats(self, df: pd.DataFrame) -> None:
        """Compute robust Median and MAD for financial cost metrics within geographic clusters and work types."""
        cost_metrics = [
            "financial__cost_per_unit",
            "financial__sanctioned_amount",
            "financial__estimated_cost",
        ]

        cluster_col = self.config.primary_cluster_column
        work_type_col = self.config.peer_work_type_column

        # 1. Primary peer group: (geographic_cluster_id, work_type)
        self.cluster_peer_stats_ = {}
        if cluster_col in df.columns and work_type_col in df.columns:
            grouped = df.groupby([cluster_col, work_type_col])
            for (clust_id, wt), group in grouped:
                key = f"{clust_id}___{wt}"
                self.cluster_peer_stats_[key] = {}
                for col in cost_metrics:
                    if col in group.columns:
                        vals = group[col].dropna().values
                        if len(vals) > 0:
                            med = float(np.median(vals))
                            mad = float(np.median(np.abs(vals - med)))
                            self.cluster_peer_stats_[key][col] = {
                                "median": med,
                                "mad": mad,
                                "count": len(vals),
                            }

        # 2. Cluster-only fallback: (geographic_cluster_id)
        self.cluster_fallback_stats_: Dict[str, Dict[str, Dict[str, float]]] = {}
        if cluster_col in df.columns:
            for clust_id, group in df.groupby(cluster_col):
                self.cluster_fallback_stats_[str(clust_id)] = {}
                for col in cost_metrics:
                    if col in group.columns:
                        vals = group[col].dropna().values
                        if len(vals) > 0:
                            med = float(np.median(vals))
                            mad = float(np.median(np.abs(vals - med)))
                            self.cluster_fallback_stats_[str(clust_id)][col] = {
                                "median": med,
                                "mad": mad,
                                "count": len(vals),
                            }

        # 3. Global fallback
        self.global_stats_ = {}
        for col in cost_metrics:
            if col in df.columns:
                vals = df[col].dropna().values
                med = float(np.median(vals)) if len(vals) > 0 else 0.0
                mad = float(np.median(np.abs(vals - med))) if len(vals) > 0 else 1.0
                self.global_stats_[col] = {"median": med, "mad": mad, "count": len(vals)}

    def _engineer_peer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create spatial cluster peer-relative deviation and robust z-score features."""
        cluster_col = self.config.primary_cluster_column
        work_type_col = self.config.peer_work_type_column
        eps = self.config.peer_epsilon
        mult = self.config.peer_mad_multiplier

        def get_cluster_stats(col: str):
            medians = []
            mads = []
            for idx in range(len(df)):
                clust = df[cluster_col].iloc[idx] if cluster_col in df.columns else ""
                wt = df[work_type_col].iloc[idx] if work_type_col in df.columns else ""
                key = f"{clust}___{wt}"

                stat = self.cluster_peer_stats_.get(key, {}).get(col)
                if stat and stat["count"] >= 3:
                    medians.append(stat["median"])
                    mads.append(stat["mad"])
                else:
                    # Fallback to cluster-only
                    c_stat = self.cluster_fallback_stats_.get(str(clust), {}).get(col)
                    if c_stat and c_stat["count"] >= 3:
                        medians.append(c_stat["median"])
                        mads.append(c_stat["mad"])
                    else:
                        # Global fallback
                        g_stat = self.global_stats_.get(col, {"median": 0.0, "mad": 1.0})
                        medians.append(g_stat["median"])
                        mads.append(g_stat["mad"])

            return np.array(medians), np.array(mads)

        peer_dict = {}

        # Spatial cost per unit deviation
        if "financial__cost_per_unit" in df.columns:
            unit_med, unit_mad = get_cluster_stats("financial__cost_per_unit")
            raw_unit = df["financial__cost_per_unit"].values
            peer_dict["peer__spatial_unit_cost_diff"] = raw_unit - unit_med
            peer_dict["peer__spatial_unit_cost_ratio"] = (raw_unit + eps) / (unit_med + eps)
            peer_dict["peer__spatial_unit_cost_robust_z"] = (raw_unit - unit_med) / (mult * unit_mad + eps)

        # Spatial sanctioned amount deviation
        if "financial__sanctioned_amount" in df.columns:
            sanc_med, sanc_mad = get_cluster_stats("financial__sanctioned_amount")
            raw_sanc = df["financial__sanctioned_amount"].values
            peer_dict["peer__spatial_sanctioned_diff"] = raw_sanc - sanc_med
            peer_dict["peer__spatial_sanctioned_ratio"] = (raw_sanc + eps) / (sanc_med + eps)
            peer_dict["peer__spatial_sanctioned_robust_z"] = (raw_sanc - sanc_med) / (mult * sanc_mad + eps)

        # Spatial estimated cost deviation
        if "financial__estimated_cost" in df.columns:
            est_med, est_mad = get_cluster_stats("financial__estimated_cost")
            raw_est = df["financial__estimated_cost"].values
            peer_dict["peer__spatial_estimated_diff"] = raw_est - est_med
            peer_dict["peer__spatial_estimated_ratio"] = (raw_est + eps) / (est_med + eps)
            peer_dict["peer__spatial_estimated_robust_z"] = (raw_est - est_med) / (mult * est_mad + eps)

        return pd.DataFrame(peer_dict, index=df.index)

    def fit(self, df: pd.DataFrame) -> "GeospatialPreprocessor":
        """Fit preprocessor, calculate spatial peer stats, and fit RobustScaler."""
        self._validate_safety(df)

        # 1. Compute spatial peer statistics
        self._compute_peer_stats(df)

        # 2. Extract base spatial features
        base_cols = [c for c in self.config.base_spatial_features if c in df.columns]
        if self.config.mode == "retrospective":
            base_cols.extend([c for c in self.config.retrospective_features if c in df.columns])
        self.selected_base_features_ = sorted(list(set(base_cols)))

        # 3. Compute spatial metrics (distances, density, DBSCAN, LOF)
        df_spatial = self._compute_spatial_metrics(df)

        # 4. Engineer peer features
        df_peer = self._engineer_peer_features(df)
        self.engineered_spatial_features_ = list(df_spatial.columns) + list(df_peer.columns)

        # 5. Assemble candidate matrix
        combined = pd.concat([df[self.selected_base_features_], df_spatial, df_peer], axis=1)

        # Exclude raw categorical or string columns from numeric ML matrix
        numeric_cols = []
        for c in combined.columns:
            if c == "spatial__dbscan_cluster_id":
                continue  # cluster ID is identifier/label, used for grouping, not direct scaling
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
            raise RuntimeError("GeospatialPreprocessor must be fitted before transforming.")

        self._validate_safety(df)
        project_ids = df["project_id"].values

        df_spatial = self._compute_spatial_metrics(df)
        df_peer = self._engineer_peer_features(df)

        combined = pd.concat([df[self.selected_base_features_], df_spatial, df_peer], axis=1)

        # Impute missing values deterministically
        df_imputed = combined[self.final_feature_names_].fillna(self.imputer_values_)
        X_scaled = self.scaler_.transform(df_imputed.values)

        # Preserve spatial metadata for downstream reasons/tables
        df_features_rich = combined.copy()
        for c, val in self.imputer_values_.items():
            if c in df_features_rich.columns:
                df_features_rich[c] = df_features_rich[c].fillna(val)

        return project_ids, df_features_rich, X_scaled

    def fit_transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame, np.ndarray]:
        """Fit on dataframe and return transformed project IDs, feature dataframe, and scaled matrix."""
        return self.fit(df).transform(df)

    def save(self, file_path: str) -> None:
        """Serialize fitted preprocessor to disk using joblib."""
        if not self.is_fitted_:
            raise RuntimeError("Cannot save unfitted preprocessor.")
        joblib.dump(self, file_path)

    @classmethod
    def load(cls, file_path: str) -> "GeospatialPreprocessor":
        """Load serialized preprocessor from disk."""
        return joblib.load(file_path)
