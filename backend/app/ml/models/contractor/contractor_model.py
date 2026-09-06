"""Contractor Isolation Forest Anomaly Model.

Implements the standalone unsupervised Isolation Forest model for contractor & agency monopolization,
continuous score normalization (0-100), percentile computation, flag thresholding,
and explainable reason trace generation.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest
import joblib

from .config import ContractorModelConfig


class ContractorIsolationForestModel:
    """SETU Contractor & Agency Monopolization Anomaly Isolation Forest Model."""

    def __init__(self, config: Optional[ContractorModelConfig] = None):
        self.config = config or ContractorModelConfig()
        self.model_: Optional[IsolationForest] = None
        self.raw_score_p1_: float = 0.0
        self.raw_score_p99_: float = 1.0
        self.is_fitted_: bool = False

    def fit(self, X: np.ndarray, feature_names: List[str]) -> "ContractorIsolationForestModel":
        """Train Isolation Forest on preprocessed contractor feature matrix."""
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
        """Compute continuous normalized contractor anomaly score in [0.0, 100.0]."""
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
        """Generate explainable, non-accusatory contractor reason traces for every project."""
        reasons_list = []

        for idx in range(len(df_features)):
            row = df_features.iloc[idx]
            pct = percentiles[idx]
            cand_reasons = []

            # 1. Capacity strain / over-allocation
            val_to_cap = row.get("contract__contract_value_to_capacity", 0.0)
            strain = row.get("contractor__capacity_strain_index", 0.0)
            if val_to_cap > 1.2 or strain > 0.2:
                cand_reasons.append((
                    val_to_cap * 3.0,
                    f"Contractor backlog exceeds registered financial capacity (value-to-capacity ratio {val_to_cap:.2f})"
                ))

            # 2. Corporate collusion / shared corporate links
            collusion_idx = row.get("contractor__corporate_collusion_index", 0.0)
            dirs = row.get("contractor__shared_directors", 0.0)
            addr = row.get("contractor__shared_address", 0.0)
            own = row.get("contractor__shared_ownership", 0.0)
            if collusion_idx > 0.20 or dirs == 1.0 or addr == 1.0 or own == 1.0:
                flags_found = []
                if dirs == 1.0:
                    flags_found.append("shared directors")
                if addr == 1.0:
                    flags_found.append("shared address")
                if own == 1.0:
                    flags_found.append("common ownership")
                found_str = ", ".join(flags_found) if flags_found else "interlocking entity ties"
                cand_reasons.append((
                    8.5,
                    f"Contractor identified with corporate collusion risk indicators ({found_str})"
                ))

            # 3. Agency capture & monopolization
            agency_conc = row.get("contractor__contractor_agency_concentration", 0.5)
            rep_pair = row.get("contractor__repeated_agency_contractor_pair", 0.0)
            capture_score = row.get("contractor__agency_capture_score", 0.0)
            if agency_conc > 0.65 and rep_pair == 1.0:
                cand_reasons.append((
                    agency_conc * 8.0,
                    f"Heavy agency monopolization ({agency_conc*100:.1f}% funding channeled through repeated agency-contractor pair)"
                ))
            elif agency_conc > 0.70:
                cand_reasons.append((
                    agency_conc * 6.0,
                    f"Elevated agency concentration ({agency_conc*100:.1f}% of vendor work tied to single implementing agency)"
                ))

            # 4. Governance instability
            own_chg = row.get("contractor__company_ownership_change", 0.0)
            dir_chg = row.get("contractor__director_change", 0.0)
            if own_chg == 1.0:
                cand_reasons.append((
                    7.0,
                    "Recent corporate ownership change registered prior to developmental contract award"
                ))
            elif dir_chg == 1.0:
                cand_reasons.append((
                    5.0,
                    "Recent corporate board/director replacement registered for contractor"
                ))

            # 5. Historical irregularity / delay rate
            irreg_rate = row.get("contractor__past_irregularity_rate", 0.0)
            prev_irreg = row.get("contractor__contractor_previous_irregularities", 0.0)
            if irreg_rate > 0.25 or prev_irreg >= 2:
                cand_reasons.append((
                    irreg_rate * 10.0,
                    f"Elevated historical irregularity record ({int(prev_irreg)} past statutory audit findings)"
                ))

            # 6. Constituency concentration
            const_conc = row.get("contractor__contractor_constituency_concentration", 0.0)
            if const_conc > 0.60:
                cand_reasons.append((
                    const_conc * 5.0,
                    f"High constituency allocation concentration ({const_conc*100:.1f}% of works in single constituency)"
                ))

            # Sort candidate reasons by weight
            cand_reasons.sort(key=lambda x: x[0], reverse=True)

            primary = cand_reasons[0][1] if len(cand_reasons) > 0 else "Contractor capacity and agency pairing metrics within normal parameters"
            secondary = cand_reasons[1][1] if len(cand_reasons) > 1 else "Vendor registration profile and governance structure compliant"
            tertiary = cand_reasons[2][1] if len(cand_reasons) > 2 else "Allocation distribution across implementing agencies well balanced"

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
    def load(cls, file_path: str) -> "ContractorIsolationForestModel":
        """Load serialized model from disk."""
        return joblib.load(file_path)
