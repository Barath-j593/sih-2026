"""Geospatial Isolation Forest Anomaly Model.

Implements the standalone unsupervised Isolation Forest model, continuous score
normalization (0-100), percentile computation, flag thresholding, and reason trace generation.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest
import joblib

from .config import GeospatialModelConfig


class GeospatialIsolationForestModel:
    """SETU Geospatial Anomaly Isolation Forest Model."""

    def __init__(self, config: Optional[GeospatialModelConfig] = None):
        self.config = config or GeospatialModelConfig()
        self.model_: Optional[IsolationForest] = None
        self.raw_score_p1_: float = 0.0
        self.raw_score_p99_: float = 1.0
        self.is_fitted_: bool = False

    def fit(self, X: np.ndarray, feature_names: List[str]) -> "GeospatialIsolationForestModel":
        """Train Isolation Forest on preprocessed spatial feature matrix."""
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
        """Compute continuous normalized geospatial anomaly score in [0.0, 100.0]."""
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
        """Generate explainable, non-accusatory spatial reason traces for every project."""
        reasons_list = []

        for idx in range(len(df_features)):
            row = df_features.iloc[idx]
            pct = percentiles[idx]
            cand_reasons = []

            # 1. Spatial cluster cost discrepancy
            unit_z = row.get("peer__spatial_unit_cost_robust_z", 0.0)
            unit_ratio = row.get("peer__spatial_unit_cost_ratio", 1.0)
            if unit_z > 1.8 or unit_ratio > 1.35:
                pct_above = (unit_ratio - 1.0) * 100.0
                cand_reasons.append((
                    abs(unit_z) * 1.5,
                    f"Elevated spatial unit cost (+{pct_above:.1f}% vs cluster median for work type)"
                ))
            elif unit_z < -1.8:
                cand_reasons.append((
                    abs(unit_z) * 1.1,
                    f"Substantial spatial cost deficit vs cluster median ({abs(unit_z):.1f} sigma below peer median)"
                ))

            # 2. Artificial geographic clustering / density in radius
            density_25km = row.get("spatial__density_in_radius", 1.0)
            cluster_size = row.get("spatial__dbscan_cluster_size", 1.0)
            if density_25km >= 12 or cluster_size >= 25:
                cand_reasons.append((
                    density_25km * 0.4,
                    f"High geographic clustering ({int(density_25km)} active works within 25 km radius)"
                ))

            # 3. Density vs population / infrastructure gap misalignment
            dens_to_pop = row.get("spatial__density_to_pop_ratio", 1.0)
            if dens_to_pop > 2.5:
                cand_reasons.append((
                    dens_to_pop * 1.2,
                    f"Disproportionate project density relative to local population density (ratio {dens_to_pop:.2f})"
                ))

            # 4. Local Outlier Factor (LOF) spatial isolation
            lof = row.get("spatial__lof_score", 1.0)
            nn_dist = row.get("spatial__nearest_neighbor_dist_km", 0.0)
            if lof > 1.4 and nn_dist > 15.0:
                cand_reasons.append((
                    lof * 2.0,
                    f"Geographic isolation outlier with distant nearest neighbor ({nn_dist:.1f} km away)"
                ))

            # 5. Spatial sanctioned amount deviation
            sanc_z = row.get("peer__spatial_sanctioned_robust_z", 0.0)
            sanc_ratio = row.get("peer__spatial_sanctioned_ratio", 1.0)
            if sanc_z > 2.0 or sanc_ratio > 1.5:
                pct_sanc = (sanc_ratio - 1.0) * 100.0
                cand_reasons.append((
                    abs(sanc_z) * 1.3,
                    f"High sanctioned funding allocation (+{pct_sanc:.1f}% above regional cluster median)"
                ))

            # Sort candidate reasons by weight
            cand_reasons.sort(key=lambda x: x[0], reverse=True)

            primary = cand_reasons[0][1] if len(cand_reasons) > 0 else "Spatial distribution and cluster costs within normal parameters"
            secondary = cand_reasons[1][1] if len(cand_reasons) > 1 else "Normal local project density and infrastructure alignment"
            tertiary = cand_reasons[2][1] if len(cand_reasons) > 2 else "Geographic coordinates and terrain profile match regional peers"

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
    def load(cls, file_path: str) -> "GeospatialIsolationForestModel":
        """Load serialized model from disk."""
        return joblib.load(file_path)
