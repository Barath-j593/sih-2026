"""
test_determinism.py - Verifies that the feature generation pipeline is 100% deterministic and reproducible.
"""

import pytest
import pandas as pd
from app.ml.data.setu_data_layer import SETUDataLayer
from app.ml.data.feature_builder import build_project_master_features


def test_feature_pipeline_determinism():
    """Assert running feature pipeline twice on identical input produces bitwise-identical feature tables."""
    layer = SETUDataLayer()
    tables1 = layer.load_raw_data()
    tables2 = layer.load_raw_data()
    
    master1, payments1, progress1, labels1 = build_project_master_features(tables1)
    master2, payments2, progress2, labels2 = build_project_master_features(tables2)
    
    # Assert exact bitwise match
    assert master1.equals(master2), "Master features differ across repeated runs!"
    assert payments1.equals(payments2), "Payment features differ across repeated runs!"
    assert progress1.equals(progress2), "Progress features differ across repeated runs!"
    assert labels1.equals(labels2), "Labels differ across repeated runs!"
    
    # Assert column ordering is identical
    assert list(master1.columns) == list(master2.columns)
