"""Contractor & Implementing Agency Model Configuration.

Defines all hyperparameters, peer group settings, temporal flags, and artifact paths
for the standalone unsupervised contractor/agency monopolization anomaly detector.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ContractorModelConfig:
    """Configuration for SETU Contractor & Agency Monopolization Anomaly Model."""

    # Model metadata
    model_name: str = "contractor_isolation_forest"
    model_version: str = "1.0.0"
    mode: str = "early_warning"  # "early_warning" (strictly no outcome leakage) or "retrospective"

    # Algorithm hyperparameters (Isolation Forest)
    random_state: int = 42
    n_estimators: int = 200
    contamination: float = 0.05
    max_samples: str = "auto"
    bootstrap: bool = False
    n_jobs: int = -1

    # Peer grouping configuration
    primary_peer_column: str = "project__work_type"
    secondary_peer_column: str = "project__category"
    peer_mad_multiplier: float = 1.4826  # Standard normal consistency constant for MAD
    peer_epsilon: float = 1e-6

    # Score thresholding
    anomaly_percentile_cutoff: float = 95.0  # Top 5% flagged as anomaly

    # Core contractor & agency base features to extract
    base_contractor_features: List[str] = field(default_factory=lambda: [
        "contractor__financial_capacity",
        "contractor__base_quality_score",
        "contractor__past_irregularity_rate",
        "contractor__contractor_project_count",
        "contractor__contractor_value_share",
        "contractor__contractor_district_concentration",
        "contractor__contractor_agency_concentration",
        "contractor__contractor_constituency_concentration",
        "contractor__contractor_previous_irregularities",
        "contractor__repeated_agency_contractor_pair",
        "contractor__shared_ownership",
        "contractor__shared_directors",
        "contractor__shared_shareholders",
        "contractor__shared_address",
        "contractor__beneficial_owner_overlap",
        "contractor__contractor_financial_health",
        "contractor__company_ownership_change",
        "contractor__director_change",
        "contractor__address_change",
        "agency__agency_workload_ratio",
        "agency__agency_geographic_concentration",
        "contract__contract_value_to_capacity",
        "contract__contract_delay_days",
        "contract__subcontractor_count",
        "contract__subcontractor_value_share",
    ])

    # Retrospective features (included ONLY when mode == "retrospective")
    retrospective_features: List[str] = field(default_factory=lambda: [
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
    output_scores_path: str = "backend/app/ml/data/processed/contractor_anomaly_scores.csv"
    artifacts_dir: str = "backend/app/ml/models/contractor/artifacts"
    report_json_path: str = "backend/app/ml/reports/contractor_model_report.json"
    report_md_path: str = "backend/app/ml/reports/CONTRACTOR_MODEL_REPORT.md"

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
            "primary_peer_column": self.primary_peer_column,
            "secondary_peer_column": self.secondary_peer_column,
            "peer_mad_multiplier": self.peer_mad_multiplier,
            "peer_epsilon": self.peer_epsilon,
            "anomaly_percentile_cutoff": self.anomaly_percentile_cutoff,
            "base_contractor_features_count": len(self.base_contractor_features),
            "retrospective_features_count": len(self.retrospective_features),
            "quarantined_labels_count": len(self.quarantined_labels),
            "master_features_path": self.master_features_path,
            "labels_path": self.labels_path,
            "output_scores_path": self.output_scores_path,
            "artifacts_dir": self.artifacts_dir,
            "report_json_path": self.report_json_path,
            "report_md_path": self.report_md_path,
        }
