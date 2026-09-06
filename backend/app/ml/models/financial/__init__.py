"""SETU Financial Anomaly Model Package.

Standalone unsupervised financial anomaly detection for MPLADS projects.
"""

from .config import FinancialModelConfig
from .preprocessor import FinancialPreprocessor
from .isolation_forest_model import FinancialIsolationForestModel
from .baseline_detectors import PeerCostDeviationBaseline, MultiAttributeRobustZScoreBaseline
from .evaluator import FinancialModelEvaluator
from .pipeline import FinancialModelPipeline

__all__ = [
    "FinancialModelConfig",
    "FinancialPreprocessor",
    "FinancialIsolationForestModel",
    "PeerCostDeviationBaseline",
    "MultiAttributeRobustZScoreBaseline",
    "FinancialModelEvaluator",
    "FinancialModelPipeline",
]
