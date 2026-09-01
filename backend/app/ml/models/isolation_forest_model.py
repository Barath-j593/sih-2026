import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

class IsolationForestAnomalyDetector:
    def __init__(self, contamination: float = 0.10, random_state: int = 42):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )
        self.is_fitted = False

    def fit(self, X: np.ndarray):
        self.model.fit(X)
        self.is_fitted = True
        return self

    def predict_anomaly_score(self, X: np.ndarray) -> np.ndarray:
        """
        Returns normalized anomaly score between 0.0 (normal) and 1.0 (highly anomalous).
        """
        if not self.is_fitted:
            # Fallback if unfitted
            return np.zeros(len(X))
        
        # Raw decision function: lower is more anomalous
        raw_scores = self.model.decision_function(X)
        # Normalize to 0 (normal) - 1 (anomalous)
        # Typically decision_function outputs values around -0.5 to +0.5
        min_val, max_val = -0.35, 0.35
        norm_scores = (max_val - raw_scores) / (max_val - min_val)
        return np.clip(norm_scores, 0.0, 1.0)
