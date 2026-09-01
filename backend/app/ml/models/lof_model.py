import numpy as np
from sklearn.neighbors import LocalOutlierFactor

class LOFAnomalyDetector:
    def __init__(self, n_neighbors: int = 20, contamination: float = 0.10):
        self.model = LocalOutlierFactor(
            n_neighbors=n_neighbors,
            contamination=contamination,
            novelty=True,
            n_jobs=-1
        )
        self.is_fitted = False

    def fit(self, X: np.ndarray):
        self.model.fit(X)
        self.is_fitted = True
        return self

    def predict_anomaly_score(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            return np.zeros(len(X))
        
        # decision_function outputs negative outlier factors
        raw_scores = self.model.decision_function(X)
        min_val, max_val = -1.5, 1.0
        norm_scores = (max_val - raw_scores) / (max_val - min_val)
        return np.clip(norm_scores, 0.0, 1.0)
