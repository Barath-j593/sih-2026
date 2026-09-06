"""Geospatial / Spatial Anomaly Model Configuration.

Defines all hyperparameters, spatial clustering settings, peer group settings,
temporal flags, and artifact paths for the standalone unsupervised spatial anomaly detector.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class GeospatialModelConfig:
    """Configuration for SETU Geospatial Anomaly Model."""

    # Model metadata
    model_name: str = "geospatial_isolation_forest"
    model_version: str = "1.0.0"
    mode: str = "early_warning"  # "early_warning" (strictly no outcome leakage) or "retrospective"

    # Algorithm hyperparameters (Isolation Forest)
    random_state: int = 42
    n_estimators: int = 200
    contamination: float = 0.05
    max_samples: str = "auto"
    bootstrap: bool = False
    n_jobs: int = -1

    # Spatial clustering settings
    earth_radius_km: float = 6371.0088
    dbscan_eps_km: float = 25.0
    dbscan_min_samples: int = 5
    lof_n_neighbors: int = 15
    local_density_radius_km: float = 25.0
    k_nearest_neighbors: int = 5

    # Spatial peer grouping configuration
    primary_cluster_column: str = "geo__geographic_cluster_id"
    peer_work_type_column: str = "project__work_type"
    peer_category_column: str = "project__category"
    peer_mad_multiplier: float = 1.4826  # Standard normal consistency constant for MAD
    peer_epsilon: float = 1e-6

    # Score thresholding
    anomaly_percentile_cutoff: float = 95.0  # Top 5% flagged as anomaly

    # Core spatial base features to extract
    base_spatial_features: List[str] = field(default_factory=lambda: [
        "project__project_latitude",
        "project__project_longitude",
        "geo__population",
        "geo__population_density",
        "geo__literacy_rate",
        "geo__poverty_rate",
        "geo__infrastructure_gap_index",
        "financial__sanctioned_amount",
        "financial__estimated_cost",
        "financial__cost_per_unit",
    ])

    # Retrospective features (included ONLY when mode == "retrospective")
    retrospective_features: List[str] = field(default_factory=lambda: [
        "financial__actual_expenditure",
        "financial__unspent_balance",
        "financial__cost_overrun",
        "contract__final_contract_value",
        "contract__end_period_expenditure_ratio",
    ])

    # Target & label columns to strictly quarantine (NEVER used as model input)
    quarantined_labels: List[str] = field(default_factory=lambda: [
        "fraud_label",
        "is_fraud",
        "is_anomalous",
        "is_hard_negative",
        "risk_level",
        "scenario_type",
        "scenario_name",
        "overall_risk_score",
        "investigation_priority",
    ])

    # File paths (resolved relative to workspace root)
    master_features_path: str = "backend/app/ml/data/processed/project_master_features.csv"
    labels_path: str = "backend/app/ml/data/processed/project_labels.csv"
    output_scores_path: str = "backend/app/ml/data/processed/geospatial_anomaly_scores.csv"
    artifacts_dir: str = "backend/app/ml/models/geospatial/artifacts"
    report_json_path: str = "backend/app/ml/reports/geospatial_model_report.json"
    report_md_path: str = "backend/app/ml/reports/GEOSPATIAL_MODEL_REPORT.md"

    def to_dict(self) -> dict:
        """Serialize configuration to a JSON-serializable dictionary."""
        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "mode": self.mode,
            "random_state": self.random_state,
            "n_estimators": self.n_estimators,
            "contamination": self.contamination,
            "max_samples": self.max_samples,
            "bootstrap": self.bootstrap,
            "earth_radius_km": self.earth_radius_km,
            "dbscan_eps_km": self.dbscan_eps_km,
            "dbscan_min_samples": self.dbscan_min_samples,
            "lof_n_neighbors": self.lof_n_neighbors,
            "local_density_radius_km": self.local_density_radius_km,
            "k_nearest_neighbors": self.k_nearest_neighbors,
            "primary_cluster_column": self.primary_cluster_column,
            "peer_work_type_column": self.peer_work_type_column,
            "peer_category_column": self.peer_category_column,
            "peer_mad_multiplier": self.peer_mad_multiplier,
            "peer_epsilon": self.peer_epsilon,
            "anomaly_percentile_cutoff": self.anomaly_percentile_cutoff,
            "base_spatial_features_count": len(self.base_spatial_features),
            "retrospective_features_count": len(self.retrospective_features),
            "quarantined_labels_count": len(self.quarantined_labels),
            "master_features_path": self.master_features_path,
            "labels_path": self.labels_path,
            "output_scores_path": self.output_scores_path,
            "artifacts_dir": self.artifacts_dir,
            "report_json_path": self.report_json_path,
            "report_md_path": self.report_md_path,
        }
