"""
SETU — Stage 2F: Granular Payment Structuring Model Configuration.

This module defines configuration parameters, statutory smurfing thresholds,
feature subsets, hyperparameters, and directory paths for the payment model.
Focuses on structural transaction behavior (unverified releases, statutory smurfing,
burst velocity, round amounts, timing anomalies) to prevent size-based confounding.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List


@dataclass
class PaymentModelConfig:
    """Configuration parameters for the Granular Payment Structuring Model."""

    # Model metadata
    model_name: str = "payment_isolation_forest"
    model_version: str = "1.0.0"
    mode: str = "early_warning"
    random_state: int = 42

    # Isolation Forest hyperparameters
    n_estimators: int = 200
    max_samples: str = "auto"
    contamination: float = 0.05
    bootstrap: bool = False
    n_jobs: int = -1

    # Statutory ceiling thresholds for smurfing detection (in INR)
    # 15 Lakhs (1.5M): Statutory decentralized tender ceiling in MPLADS
    # 25 Lakhs (2.5M): Major decentralized sanction threshold
    # 50 Lakhs (5.0M): Major milestone approval threshold
    smurfing_thresholds: List[float] = field(
        default_factory=lambda: [1500000.0, 2500000.0, 5000000.0]
    )
    smurfing_bandwidth: float = 25000.0  # Gaussian bandwidth (INR)
    smurfing_window_pct: float = 0.05    # Detection window [T - 5%, T]

    # Peer grouping columns for localized benchmarking
    peer_group_cols: List[str] = field(
        default_factory=lambda: ["project__work_type", "project__category"]
    )

    # Base payment features from project_master_features.csv (structural & ratio based)
    base_payment_features: List[str] = field(
        default_factory=lambda: [
            "payment__unverified_payment_rate",
            "payment__unverified_payment_count",
            "payment__round_number_payment_rate",
            "payment__round_number_payment_count",
            "payment__payment_timing_anomaly_rate",
            "payment__payment_timing_anomaly_count",
            "payment__payment_concentration_max",
            "payment__final_installment_share",
            "payment__payment_frequency_mean",
            "payment__payment_interval_std",
            "payment__average_days_between_payments",
            "payment__median_days_between_payments",
        ]
    )

    # Contextual features from master table (ratios & timeline, no raw currency)
    context_features: List[str] = field(
        default_factory=lambda: [
            "financial__fund_utilization_ratio",
            "financial__release_ratio",
            "financial__expenditure_ratio",
            "project__planned_duration_days",
        ]
    )

    # Engineered payment features
    engineered_features: List[str] = field(
        default_factory=lambda: [
            "payment__statutory_smurfing_score",
            "payment__unverified_exposure_index",
            "payment__disbursement_velocity_ratio",
            "payment__disbursement_lumpiness_index",
            "payment__rapid_disbursement_flag",
            "payment__payment_timing_risk_index",
            "payment__peer_velocity_mean_z",
            "payment__peer_concentration_z",
        ]
    )

    # Data & artifact file paths
    data_dir: Path = Path("backend/app/ml/data/processed")
    master_features_path: Path = Path("backend/app/ml/data/processed/project_master_features.csv")
    labels_path: Path = Path("backend/app/ml/data/processed/project_labels.csv")
    output_scores_path: Path = Path("backend/app/ml/data/processed/payment_anomaly_scores.csv")
    artifacts_dir: Path = Path("backend/app/ml/models/payment/artifacts")
    reports_dir: Path = Path("backend/app/ml/reports")
