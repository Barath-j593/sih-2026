import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.ensemble import GradientBoostingClassifier

class XGBoostFraudClassifier:
    def __init__(self, random_state: int = 42):
        try:
            self.model = XGBClassifier(
                n_estimators=120,
                max_depth=5,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                eval_metric="logloss",
                random_state=random_state,
                n_jobs=-1
            )
        except Exception:
            # Fallback to sklearn GBDT
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.08,
                random_state=random_state
            )
        self.is_fitted = False
        self.feature_names = []

    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: list = None):
        self.feature_names = feature_names or []
        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            return np.zeros(len(X))
        
        probas = self.model.predict_proba(X)
        if probas.shape[1] > 1:
            return probas[:, 1]
        return probas.ravel()

    def get_feature_importances(self) -> dict:
        if not self.is_fitted or not hasattr(self.model, "feature_importances_"):
            return {}
        
        importances = self.model.feature_importances_
        names = self.feature_names or [f"f_{i}" for i in range(len(importances))]
        return dict(sorted(zip(names, [float(x) for x in importances]), key=lambda x: x[1], reverse=True))
