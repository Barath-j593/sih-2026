"""Configuration for Stage 3 Supervised Calibrated Risk Predictor.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List


@dataclass
class SupervisedModelConfig:
    """Hyperparameters and configuration for Supervised Fraud Model."""

    # Reproducibility
    random_state: int = 42
    n_splits: int = 5

    # XGBoost Classifier Hyperparameters
    n_estimators: int = 150
    max_depth: int = 4
    learning_rate: float = 0.05
    subsample: float = 0.85
    colsample_bytree: float = 0.85
    eval_metric: str = "logloss"

    # Calibration settings
    calibration_method: str = "isotonic"
    calibration_cv: int = 3

    # Typology Classifier settings
    typology_n_estimators: int = 100
    typology_max_depth: int = 4
    typology_learning_rate: float = 0.08

    # Paths
    base_dir: Path = field(default_factory=lambda: Path(__file__).resolve().parent)
    data_dir: Path = field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "data" / "processed"
    )
    reports_dir: Path = field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "reports"
    )
    artifacts_dir: Path = field(
        default_factory=lambda: Path(__file__).resolve().parent / "artifacts"
    )

    # Input CSV files
    master_features_file: str = "project_master_features.csv"
    labels_file: str = "project_labels.csv"

    intermediate_score_files: Dict[str, str] = field(
        default_factory=lambda: {
            "financial": "financial_anomaly_scores.csv",
            "geospatial": "geospatial_anomaly_scores.csv",
            "procurement": "procurement_anomaly_scores.csv",
            "contractor": "contractor_anomaly_scores.csv",
            "payment": "payment_anomaly_scores.csv",
            "progress": "progress_execution_anomaly_scores.csv",
            "graph": "graph_anomaly_scores.csv",
        }
    )

    # Output file
    output_scores_file: str = "supervised_fraud_scores.csv"

    # Feature definitions
    score_columns: List[str] = field(
        default_factory=lambda: [
            "financial_anomaly_score",
            "geospatial_anomaly_score",
            "procurement_anomaly_score",
            "contractor_anomaly_score",
            "payment_anomaly_score",
            "progress_anomaly_score",
            "graph_anomaly_score",
        ]
    )

    percentile_columns: List[str] = field(
        default_factory=lambda: [
            "financial_anomaly_percentile",
            "geospatial_anomaly_percentile",
            "procurement_anomaly_percentile",
            "contractor_anomaly_percentile",
            "payment_anomaly_percentile",
            "progress_anomaly_percentile",
            "graph_anomaly_percentile",
        ]
    )

    composite_columns: List[str] = field(
        default_factory=lambda: [
            "max_anomaly_score",
            "mean_anomaly_score",
            "std_anomaly_score",
            "num_flagged_models",
        ]
    )

    context_columns: List[str] = field(
        default_factory=lambda: [
            "project__planned_duration_days",
            "project_size_code",
            "geo__population_density",
            "geo__infrastructure_gap_index",
            "financial__sanctioned_amount",
        ]
    )

    # Performance targets
    min_roc_auc: float = 0.95
    min_pr_auc: float = 0.85
    min_top1_enrichment: float = 4.0
    max_hard_negative_fpr: float = 0.05
