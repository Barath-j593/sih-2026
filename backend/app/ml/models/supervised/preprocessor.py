"""Data Preprocessor for Stage 3 Supervised Calibrated Risk Predictor.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

from app.ml.models.supervised.config import SupervisedModelConfig


class SupervisedDataPreprocessor(BaseEstimator, TransformerMixin):
    """Merges 7 intermediate anomaly scores with project context and extracts engineered meta-features."""

    def __init__(self, config: Optional[SupervisedModelConfig] = None):
        self.config = config or SupervisedModelConfig()
        self.feature_names_: List[str] = []
        self.impute_values_: Dict[str, float] = {}
        self.is_fitted_: bool = False

    def load_intermediate_scores(
        self, data_dir: Optional[Union[str, Path]] = None
    ) -> pd.DataFrame:
        """Load and merge all 7 intermediate model score files."""
        dir_path = Path(data_dir) if data_dir else self.config.data_dir

        merged_df: Optional[pd.DataFrame] = None

        for domain, filename in self.config.intermediate_score_files.items():
            filepath = dir_path / filename
            if not filepath.exists():
                raise FileNotFoundError(f"Missing intermediate score file: {filepath}")

            df_score = pd.read_csv(filepath)
            if "project_id" not in df_score.columns:
                raise ValueError(f"Missing project_id in {filepath}")

            # Identify score and percentile columns
            score_col = f"{domain}_anomaly_score"
            if domain == "contractor" and score_col not in df_score.columns:
                # Contractor model can be contractor_agency_anomaly_score or contractor_anomaly_score
                if "contractor_agency_anomaly_score" in df_score.columns:
                    df_score = df_score.rename(
                        columns={"contractor_agency_anomaly_score": "contractor_anomaly_score"}
                    )
            if domain == "progress" and score_col not in df_score.columns:
                if "progress_execution_anomaly_score" in df_score.columns:
                    df_score = df_score.rename(
                        columns={"progress_execution_anomaly_score": "progress_anomaly_score"}
                    )

            pct_col = f"{domain}_anomaly_percentile"
            if domain == "contractor" and pct_col not in df_score.columns:
                if "contractor_agency_percentile" in df_score.columns:
                    df_score = df_score.rename(
                        columns={"contractor_agency_percentile": "contractor_anomaly_percentile"}
                    )

            cols_to_keep = ["project_id", score_col, pct_col]
            missing_cols = [c for c in cols_to_keep if c not in df_score.columns]
            if missing_cols:
                raise ValueError(f"Expected columns {missing_cols} not found in {filepath}")

            df_sub = df_score[cols_to_keep].copy()

            if merged_df is None:
                merged_df = df_sub
            else:
                merged_df = merged_df.merge(df_sub, on="project_id", how="inner")

        return merged_df

    def load_master_context(
        self, data_dir: Optional[Union[str, Path]] = None
    ) -> pd.DataFrame:
        """Load contextual non-leaking features from master features CSV."""
        dir_path = Path(data_dir) if data_dir else self.config.data_dir
        master_path = dir_path / self.config.master_features_file

        if not master_path.exists():
            raise FileNotFoundError(f"Master features file missing: {master_path}")

        master_df = pd.read_csv(master_path)
        required_cols = [
            "project_id",
            "project__planned_duration_days",
            "project__project_size",
            "geo__population_density",
            "geo__infrastructure_gap_index",
            "financial__sanctioned_amount",
        ]
        for col in required_cols:
            if col not in master_df.columns:
                raise ValueError(f"Required context column {col} not found in master features")

        sub_df = master_df[required_cols].copy()

        # Encode project_size ordinally
        size_map = {"Small": 0, "Medium": 1, "Large": 2, "Mega": 3}
        sub_df["project_size_code"] = (
            sub_df["project__project_size"].map(size_map).fillna(1.0).astype(float)
        )
        sub_df = sub_df.drop(columns=["project__project_size"])
        return sub_df

    def assemble_feature_matrix(
        self,
        scores_df: pd.DataFrame,
        context_df: pd.DataFrame,
    ) -> pd.DataFrame:
        """Assemble all 7 domain scores, context, and engineered composite features."""
        df = scores_df.merge(context_df, on="project_id", how="inner")

        # 1. Composite statistical features across the 7 models
        score_cols = self.config.score_columns
        pct_cols = self.config.percentile_columns

        df["max_anomaly_score"] = df[score_cols].max(axis=1)
        df["mean_anomaly_score"] = df[score_cols].mean(axis=1)
        df["std_anomaly_score"] = df[score_cols].std(axis=1).fillna(0.0)

        # Count of models flagging high anomaly (>= 95th percentile)
        df["num_flagged_models"] = (df[pct_cols] >= 95.0).sum(axis=1).astype(float)

        return df

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> "SupervisedDataPreprocessor":
        """Compute imputation medians on training feature matrix."""
        all_features = (
            self.config.score_columns
            + self.config.percentile_columns
            + self.config.composite_columns
            + self.config.context_columns
        )

        for col in all_features:
            if col in X.columns:
                val = float(X[col].median()) if not X[col].dropna().empty else 0.0
                self.impute_values_[col] = val
            else:
                self.impute_values_[col] = 0.0

        self.feature_names_ = all_features
        self.is_fitted_ = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Impute and transform dataframe into contiguous numpy feature matrix."""
        if not self.is_fitted_:
            raise RuntimeError("SupervisedDataPreprocessor must be fitted before transform")

        X_out = pd.DataFrame(index=X.index)
        for col in self.feature_names_:
            if col in X.columns:
                X_out[col] = X[col].fillna(self.impute_values_.get(col, 0.0)).astype(float)
            else:
                X_out[col] = float(self.impute_values_.get(col, 0.0))

        return X_out.values.astype(np.float64)

    def fit_transform(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> np.ndarray:
        """Fit and transform in a single call."""
        return self.fit(X, y).transform(X)
