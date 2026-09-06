"""Core Supervised Fraud and Typology Model with Probability Calibration and Tree SHAP Explanations.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.calibration import CalibratedClassifierCV

from app.ml.models.supervised.config import SupervisedModelConfig


class SupervisedFraudClassifier(BaseEstimator, ClassifierMixin):
    """Dual-head supervised risk model: calibrated binary fraud probability + typology classifier + Tree SHAP attributions."""

    def __init__(self, config: Optional[SupervisedModelConfig] = None):
        self.config = config or SupervisedModelConfig()
        self.calibrated_model_: Optional[CalibratedClassifierCV] = None
        self.base_booster_: Optional[xgb.XGBClassifier] = None
        self.typology_model_: Optional[xgb.XGBClassifier] = None
        self.typology_classes_: List[str] = []
        self.feature_names_: List[str] = []
        self.is_fitted_: bool = False

    def fit(
        self,
        X: np.ndarray,
        y_binary: np.ndarray,
        y_typology: Optional[Union[np.ndarray, pd.Series]] = None,
        feature_names: Optional[List[str]] = None,
    ) -> "SupervisedFraudClassifier":
        """Fit calibrated binary fraud classifier, explanation booster, and multi-class typology classifier."""
        self.feature_names_ = feature_names or [f"f_{i}" for i in range(X.shape[1])]

        num_neg = (y_binary == 0).sum()
        num_pos = (y_binary == 1).sum()
        scale_pos_weight = float(num_neg / max(1, num_pos))

        # 1. Base booster for Tree SHAP attributions
        self.base_booster_ = xgb.XGBClassifier(
            n_estimators=self.config.n_estimators,
            max_depth=self.config.max_depth,
            learning_rate=self.config.learning_rate,
            subsample=self.config.subsample,
            colsample_bytree=self.config.colsample_bytree,
            scale_pos_weight=scale_pos_weight,
            random_state=self.config.random_state,
            eval_metric=self.config.eval_metric,
        )
        self.base_booster_.fit(X, y_binary)

        # 2. Calibrated binary fraud classifier
        base_estimator_for_cal = xgb.XGBClassifier(
            n_estimators=self.config.n_estimators,
            max_depth=self.config.max_depth,
            learning_rate=self.config.learning_rate,
            subsample=self.config.subsample,
            colsample_bytree=self.config.colsample_bytree,
            scale_pos_weight=scale_pos_weight,
            random_state=self.config.random_state,
            eval_metric=self.config.eval_metric,
        )
        self.calibrated_model_ = CalibratedClassifierCV(
            estimator=base_estimator_for_cal,
            method=self.config.calibration_method,
            cv=self.config.calibration_cv,
        )
        self.calibrated_model_.fit(X, y_binary)

        # 3. Typology classifier trained on positive fraud cases
        if y_typology is not None:
            fraud_mask = (y_binary == 1)
            if fraud_mask.sum() > 0:
                X_fraud = X[fraud_mask]
                y_fraud_series = pd.Series(y_typology)[fraud_mask].astype("category")
                self.typology_classes_ = list(y_fraud_series.cat.categories)
                codes = y_fraud_series.cat.codes.values

                self.typology_model_ = xgb.XGBClassifier(
                    n_estimators=self.config.typology_n_estimators,
                    max_depth=self.config.typology_max_depth,
                    learning_rate=self.config.typology_learning_rate,
                    random_state=self.config.random_state,
                    objective="multi:softprob",
                )
                self.typology_model_.fit(X_fraud, codes)

        self.is_fitted_ = True
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict calibrated probabilities [p(normal), p(fraud)]."""
        if not self.is_fitted_ or self.calibrated_model_ is None:
            raise RuntimeError("Model must be fitted before predict_proba")

        return self.calibrated_model_.predict_proba(X)

    def predict(self, X: np.ndarray, threshold: float = 0.50) -> np.ndarray:
        """Predict binary fraud labels based on calibrated probability threshold."""
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)

    def predict_typology(
        self,
        X: np.ndarray,
        fraud_probabilities: Optional[np.ndarray] = None,
        threshold: float = 0.50,
    ) -> List[str]:
        """Predict fraud typology archetype for high-risk projects and benign classification for normal projects."""
        if not self.is_fitted_:
            raise RuntimeError("Model must be fitted before predict_typology")

        if fraud_probabilities is None:
            fraud_probabilities = self.predict_proba(X)[:, 1]

        n = len(X)
        typology_preds = ["NORMAL"] * n

        if self.typology_model_ is not None and len(self.typology_classes_) > 0:
            typology_codes = self.typology_model_.predict(X)
            for i in range(n):
                if fraud_probabilities[i] >= threshold:
                    code = int(typology_codes[i])
                    typology_preds[i] = self.typology_classes_[code]
                else:
                    typology_preds[i] = "NORMAL"
        else:
            for i in range(n):
                if fraud_probabilities[i] >= threshold:
                    typology_preds[i] = "SUSPECTED_ANOMALY"

        return typology_preds

    def explain_sample_contributions(
        self, X: np.ndarray, top_k: int = 3
    ) -> List[Dict[str, float]]:
        """Extract Tree SHAP feature attributions per sample using XGBoost's native booster."""
        if not self.is_fitted_ or self.base_booster_ is None:
            raise RuntimeError("Model must be fitted before explain_sample_contributions")

        dmat = xgb.DMatrix(X, feature_names=self.feature_names_)
        contribs = self.base_booster_.get_booster().predict(dmat, pred_contribs=True)
        # contribs shape: (N, num_features + 1), where last column is bias

        results: List[Dict[str, float]] = []
        n_features = len(self.feature_names_)

        for i in range(len(X)):
            sample_contribs = contribs[i, :n_features]
            # Rank features by positive push toward fraud (or magnitude)
            sorted_indices = np.argsort(sample_contribs)[::-1]
            top_dict = {}
            for idx in sorted_indices[:top_k]:
                feat_name = self.feature_names_[idx]
                top_dict[feat_name] = round(float(sample_contribs[idx]), 4)
            results.append(top_dict)

        return results

    def get_global_feature_importances(self) -> Dict[str, float]:
        """Return global gain-based feature importances."""
        if not self.is_fitted_ or self.base_booster_ is None:
            raise RuntimeError("Model must be fitted before get_global_feature_importances")

        importances = self.base_booster_.feature_importances_
        return {
            name: round(float(imp), 4)
            for name, imp in zip(self.feature_names_, importances)
        }
