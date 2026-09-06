"""
SETU — Stage 2H: Graph & Entity Relationship Model Configuration.

This module defines configuration parameters, graph construction hyperparameters,
feature subsets, and directory paths for the graph anomaly detection model.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List


@dataclass
class GraphModelConfig:
    """Configuration parameters for the Graph & Entity Relationship Model."""

    # Model metadata
    model_name: str = "graph_isolation_forest"
    model_version: str = "1.0.0"
    mode: str = "early_warning"
    random_state: int = 42

    # Isolation Forest hyperparameters
    n_estimators: int = 200
    max_samples: str = "auto"
    contamination: float = 0.05
    bootstrap: bool = False
    n_jobs: int = -1

    # Graph construction & algorithm hyperparameters
    pagerank_alpha: float = 0.85
    pagerank_max_iter: int = 100
    louvain_seed: int = 42

    # Entity columns in master table
    entity_cols: List[str] = field(
        default_factory=lambda: [
            "project_id",
            "contractor_id",
            "agency_id",
            "constituency_id",
            "district_id",
            "state_id",
        ]
    )

    # Base entity relationship features from project_master_features.csv
    base_relationship_features: List[str] = field(
        default_factory=lambda: [
            "contractor__repeated_agency_contractor_pair",
            "contractor__shared_ownership",
            "contractor__shared_directors",
            "contractor__shared_shareholders",
            "contractor__shared_address",
            "contractor__beneficial_owner_overlap",
            "contractor__contractor_district_concentration",
            "contractor__contractor_agency_concentration",
            "contractor__contractor_constituency_concentration",
            "contractor__company_ownership_change",
            "contractor__director_change",
            "agency__agency_workload_ratio",
            "agency__agency_geographic_concentration",
        ]
    )

    # Peer grouping columns for localized benchmarking
    peer_group_cols: List[str] = field(
        default_factory=lambda: ["project__work_type", "project__category"]
    )

    # Engineered graph topological features
    engineered_features: List[str] = field(
        default_factory=lambda: [
            "graph__contractor_degree",
            "graph__agency_degree",
            "graph__constituency_degree",
            "graph__contractor_pagerank",
            "graph__agency_pagerank",
            "graph__pair_project_count",
            "graph__triad_project_count",
            "graph__agency_contractor_hhi",
            "graph__contractor_constituency_hhi",
            "graph__corporate_ties_composite",
            "graph__community_size",
            "graph__peer_pair_count_z",
        ]
    )

    # Data & artifact file paths
    data_dir: Path = Path("backend/app/ml/data/processed")
    master_features_path: Path = Path("backend/app/ml/data/processed/project_master_features.csv")
    labels_path: Path = Path("backend/app/ml/data/processed/project_labels.csv")
    output_scores_path: Path = Path("backend/app/ml/data/processed/graph_anomaly_scores.csv")
    artifacts_dir: Path = Path("backend/app/ml/models/graph/artifacts")
    reports_dir: Path = Path("backend/app/ml/reports")
