import numpy as np
import pandas as pd
from app.ml.models.isolation_forest_model import IsolationForestAnomalyDetector
from app.ml.models.lof_model import LOFAnomalyDetector
from app.ml.models.xgboost_classifier import XGBoostFraudClassifier
from app.ml.models.graph_risk_model import MPIDAGraphRiskModel
from app.ml.models.risk_fusion_engine import RiskFusionEngine

def test_anomaly_detectors():
    np.random.seed(42)
    X = np.random.randn(200, 5)
    
    # Test Isolation Forest
    iso = IsolationForestAnomalyDetector()
    iso.fit(X)
    scores = iso.predict_anomaly_score(X[:10])
    assert len(scores) == 10
    assert (scores >= 0.0).all() and (scores <= 1.0).all()

    # Test LOF
    lof = LOFAnomalyDetector()
    lof.fit(X)
    lof_scores = lof.predict_anomaly_score(X[:10])
    assert len(lof_scores) == 10
    assert (lof_scores >= 0.0).all() and (lof_scores <= 1.0).all()

def test_xgboost_classifier():
    np.random.seed(42)
    X = np.random.randn(200, 4)
    y = (X[:, 0] + X[:, 1] > 0.5).astype(int)

    xgb = XGBoostFraudClassifier()
    xgb.fit(X, y, feature_names=["f1", "f2", "f3", "f4"])
    probas = xgb.predict_proba(X[:10])
    assert len(probas) == 10
    assert (probas >= 0.0).all() and (probas <= 1.0).all()

def test_risk_fusion_engine():
    engine = RiskFusionEngine()
    row = {
        "ALLOC_ZSCORE_STATE": 3.8,
        "ALLOCATION_AMOUNT": 490000,
        "DUPLICATE_COUNT": 8,
        "IDA_MP_WORK_SHARE": 0.85,
        "STRUCTURING_SCORE": 0.95,
        "STALL_RISK_SCORE": 0.80,
        "DAYS_SINCE_RECOMMENDED": 320,
        "IDA": "DISTRICT MAGISTRATE X"
    }

    score, level, reasons, sub_scores, f_type = engine.fuse_signals(
        row_dict=row,
        xgb_proba=0.92,
        if_score=0.85,
        lof_score=0.75,
        graph_ida_risk=0.80
    )

    assert 0.0 <= score <= 100.0
    assert level in ["Critical", "High"]
    assert len(reasons) > 0
    assert "cost_anomaly" in sub_scores
    assert f_type in ["overpricing", "duplicate", "structuring", "vendor_capture", "ghost_project"]
