"""
SETU — Stage 2G: Progress vs. Execution Trajectory Model Configuration.

This module defines configuration parameters, execution divergence thresholds,
feature subsets, hyperparameters, and directory paths for the progress model.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List


@dataclass
class ProgressModelConfig:
    """Configuration parameters for the Progress Execution Trajectory Model."""

    # Model metadata
    model_name: str = "progress_isolation_forest"
    model_version: str = "1.0.0"
    mode: str = "early_warning"
    random_state: int = 42

    # Isolation Forest hyperparameters
    n_estimators: int = 200
    max_samples: str = "auto"
    contamination: float = 0.05
    bootstrap: bool = False
    n_jobs: int = -1

    # Domain threshold rules
    divergence_threshold: float = 30.0    # Financial minus physical % gap
    extreme_gap_threshold: float = 50.0   # Severe physical-financial divergence
    stall_duration_days: float = 180.0    # Days past planned schedule with low velocity
    ghost_physical_max: float = 5.0       # Max physical % for ghost work indicator

    # Peer grouping columns for localized benchmarking
    peer_group_cols: List[str] = field(
        default_factory=lambda: ["project__work_type", "project__category"]
    )

    # Base progress features from project_master_features.csv
    base_progress_features: List[str] = field(
        default_factory=lambda: [
            "progress__latest_physical_progress",
            "progress__latest_financial_progress",
            "progress__latest_planned_progress",
            "progress__latest_completion_percentage",
            "progress__latest_progress_mismatch",
            "progress__latest_progress_gap",
            "progress__financial_minus_physical_progress",
            "progress__actual_vs_planned_progress",
            "progress__physical_progress_slope",
            "progress__financial_progress_slope",
            "progress__planned_progress_slope",
            "progress__progress_gap_slope",
            "progress__progress_velocity_latest",
            "progress__progress_acceleration_latest",
            "progress__latest_delay_days",
            "progress__max_delay_days",
            "progress__extension_count",
            "progress__planned_duration_days",
            "progress__actual_duration_days",
            "progress__duration_overrun_days",
            "progress__duration_overrun_ratio",
            "progress__geotag_available_rate",
            "progress__geotag_consistency_rate",
            "progress__measurement_book_verified_rate",
        ]
    )

    # Document & inspection context features from master table
    context_features: List[str] = field(
        default_factory=lambda: [
            "document__missing_document_ratio",
            "document__asset_completion_evidence_score",
            "document__data_completeness_score",
        ]
    )

    # Engineered progress features
    engineered_features: List[str] = field(
        default_factory=lambda: [
            "progress__divergence_penalty",
            "progress__ghost_work_index",
            "progress__execution_stall_score",
            "progress__verification_deficit_index",
            "progress__peer_physical_slope_z",
            "progress__peer_duration_overrun_z",
        ]
    )

    # Data & artifact file paths
    data_dir: Path = Path("backend/app/ml/data/processed")
    master_features_path: Path = Path("backend/app/ml/data/processed/project_master_features.csv")
    labels_path: Path = Path("backend/app/ml/data/processed/project_labels.csv")
    output_scores_path: Path = Path("backend/app/ml/data/processed/progress_execution_anomaly_scores.csv")
    artifacts_dir: Path = Path("backend/app/ml/models/progress/artifacts")
    reports_dir: Path = Path("backend/app/ml/reports")
