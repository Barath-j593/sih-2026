from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class MetricCurvePoint(BaseModel):
    threshold: float
    precision: float
    recall: float
    fpr: Optional[float] = None
    tpr: Optional[float] = None

class ConfusionMatrixData(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int

class ModelPerformanceMetrics(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: ConfusionMatrixData
    feature_importance: List[Dict[str, Any]]
    pr_curve: List[MetricCurvePoint]
    roc_curve: List[MetricCurvePoint]
    training_sample_size: int
    fraud_rate: float
    timestamp: str
    disclosure: str
