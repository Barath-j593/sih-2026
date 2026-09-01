import os
from pathlib import Path
import joblib
from app.core.config import settings
from app.ml.models.isolation_forest_model import IsolationForestAnomalyDetector
from app.ml.models.lof_model import LOFAnomalyDetector
from app.ml.models.xgboost_classifier import XGBoostFraudClassifier
from app.ml.models.graph_risk_model import MPIDAGraphRiskModel
from app.ml.models.risk_fusion_engine import RiskFusionEngine

class ModelRegistry:
    def __init__(self):
        self.models_dir = Path(settings.SAVED_MODELS_DIR)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        self.iso_forest = IsolationForestAnomalyDetector()
        self.lof = LOFAnomalyDetector()
        self.xgb = XGBoostFraudClassifier()
        self.graph_model = MPIDAGraphRiskModel()
        self.fusion_engine = RiskFusionEngine()

    def save_models(self):
        joblib.dump(self.iso_forest, self.models_dir / "iso_forest.joblib")
        joblib.dump(self.lof, self.models_dir / "lof.joblib")
        joblib.dump(self.xgb, self.models_dir / "xgb_classifier.joblib")
        joblib.dump(self.graph_model, self.models_dir / "graph_model.joblib")

    def load_models(self) -> bool:
        try:
            iso_path = self.models_dir / "iso_forest.joblib"
            lof_path = self.models_dir / "lof.joblib"
            xgb_path = self.models_dir / "xgb_classifier.joblib"
            graph_path = self.models_dir / "graph_model.joblib"

            if iso_path.exists():
                self.iso_forest = joblib.load(iso_path)
            if lof_path.exists():
                self.lof = joblib.load(lof_path)
            if xgb_path.exists():
                self.xgb = joblib.load(xgb_path)
            if graph_path.exists():
                self.graph_model = joblib.load(graph_path)
            return True
        except Exception as e:
            print(f"Notice: Failed to load some saved models: {e}")
            return False

_registry_instance = None

def get_model_registry() -> ModelRegistry:
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = ModelRegistry()
        _registry_instance.load_models()
    return _registry_instance
