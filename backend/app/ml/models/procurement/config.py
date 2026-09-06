"""Procurement & Tender Rigging Model Configuration.

Defines all hyperparameters, peer group settings, temporal flags, and artifact paths
for the standalone unsupervised procurement anomaly detector.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ProcurementModelConfig:
    """Configuration for SETU Procurement & Tender Rigging Anomaly Model."""

    # Model metadata
    model_name: str = "procurement_isolation_forest"
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

    # Core procurement & contract features to extract
    base_procurement_features: List[str] = field(default_factory=lambda: [
        "procurement__bid_count",
        "procurement__qualified_bid_count",
        "procurement__single_bid_flag",
        "procurement__bid_competition_score",
        "procurement__winning_bid_amount",
        "procurement__winning_bid_deviation",
        "procurement__winning_bid_vs_lowest_bid",
        "procurement__bid_price_similarity",
        "procurement__bidder_disqualification_rate",
        "procurement__re_tender_count",
        "procurement__repeated_winner_flag",
        "procurement__bid_rotation_score",
        "procurement__repeated_loser_score",
        "procurement__procurement_compliance_flag",
        "procurement__tender_duration",
        "contract__contract_value_change",
        "contract__contract_amendment_count",
        "contract__amendment_value",
        "contract__contract_value_to_capacity",
        "financial__tender_estimate_deviation",
        "geo__infrastructure_gap_index",
        "geo__population_density",
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
    output_scores_path: str = "backend/app/ml/data/processed/procurement_anomaly_scores.csv"
    artifacts_dir: str = "backend/app/ml/models/procurement/artifacts"
    report_json_path: str = "backend/app/ml/reports/procurement_model_report.json"
    report_md_path: str = "backend/app/ml/reports/PROCUREMENT_MODEL_REPORT.md"

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
            "base_procurement_features_count": len(self.base_procurement_features),
            "retrospective_features_count": len(self.retrospective_features),
            "quarantined_labels_count": len(self.quarantined_labels),
            "master_features_path": self.master_features_path,
            "labels_path": self.labels_path,
            "output_scores_path": self.output_scores_path,
            "artifacts_dir": self.artifacts_dir,
            "report_json_path": self.report_json_path,
            "report_md_path": self.report_md_path,
        }
