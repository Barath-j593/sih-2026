"""Financial Anomaly Model Configuration.

Defines all hyperparameters, peer group settings, temporal flags, and artifact paths
for the standalone unsupervised financial anomaly detector.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class FinancialModelConfig:
    """Configuration for SETU Financial Anomaly Isolation Forest Model."""

    # Model metadata
    model_name: str = "financial_isolation_forest"
    model_version: str = "1.0.0"
    mode: str = "early_warning"  # "early_warning" (strictly no outcome leakage) or "retrospective"

    # Algorithm hyperparameters
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

    # Core financial base features to extract (excluding zero-variance & collinear duplicates)
    base_financial_features: List[str] = field(default_factory=lambda: [
        # Financial deviations & normalized ratios
        "financial__cost_deviation",
        "financial__tender_estimate_deviation",
        "financial__actual_sanction_deviation",
        "financial__sor_deviation",
        "financial__market_rate_deviation",
        "financial__inflation_adjusted_cost_deviation",
        "financial__fund_utilization_ratio",
        "financial__expenditure_ratio",
        # Payment dynamics (rates, intervals, distributions)
        "payment__payment_count",
        "payment__average_payment",
        "payment__median_payment",
        "payment__payment_amount_std",
        "payment__payment_span_days",
        "payment__average_days_between_payments",
        "payment__payment_interval_std",
        "payment__payment_frequency_mean",
        "payment__payment_concentration_max",
        "payment__payment_timing_anomaly_rate",
        "payment__unverified_payment_rate",
        "payment__round_number_payment_rate",
        "payment__final_installment_share",
        # Contract financial dynamics
        "contract__contract_value_change",
        "contract__contract_amendment_count",
        "contract__amendment_value",
        "contract__extension_duration",
        "contract__contract_delay_days",
        "contract__contract_value_to_capacity",
        "contract__subcontractor_count",
        "contract__subcontractor_value_share",
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

    # File paths (resolved relative to workspace)
    master_features_path: str = "backend/app/ml/data/processed/project_master_features.csv"
    labels_path: str = "backend/app/ml/data/processed/project_labels.csv"
    output_scores_path: str = "backend/app/ml/data/processed/financial_anomaly_scores.csv"
    artifacts_dir: str = "backend/app/ml/models/financial/artifacts"
    report_json_path: str = "backend/app/ml/reports/financial_model_report.json"
    report_md_path: str = "backend/app/ml/reports/FINANCIAL_MODEL_REPORT.md"

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
            "base_financial_features_count": len(self.base_financial_features),
            "retrospective_features_count": len(self.retrospective_features),
            "quarantined_labels_count": len(self.quarantined_labels),
            "master_features_path": self.master_features_path,
            "labels_path": self.labels_path,
            "output_scores_path": self.output_scores_path,
            "artifacts_dir": self.artifacts_dir,
            "report_json_path": self.report_json_path,
            "report_md_path": self.report_md_path,
        }
