import pandas as pd
import numpy as np
from app.ml.features.peer_zscore import compute_peer_zscores
from app.ml.features.duplicate_detector import detect_exact_duplicates
from app.ml.features.structuring_detector import detect_structuring
from app.ml.features.stall_detector import detect_stall_risk
from app.ml.features.vendor_concentration import compute_vendor_concentration

def test_peer_zscore_calculation():
    df = pd.DataFrame({
        "STATE": ["Bihar", "Bihar", "Bihar"],
        "WORK_TYPE": ["street lights", "street lights", "street lights"],
        "ALLOCATION_AMOUNT": [100000, 200000, 300000]
    })
    featured = compute_peer_zscores(df)
    assert "ALLOC_ZSCORE_STATE" in featured.columns
    assert "ALLOC_ZSCORE_WORKTYPE" in featured.columns
    assert featured["ALLOC_ZSCORE_STATE"].iloc[2] > featured["ALLOC_ZSCORE_STATE"].iloc[0]

def test_duplicate_detection():
    df = pd.DataFrame({
        "MP_NAME": ["MP 001", "MP 001", "MP 002"],
        "WORK": ["Installation of solar pump", "Installation of solar pump", "Different work"],
        "ALLOCATION_AMOUNT": [250000, 250000, 180000]
    })
    featured = detect_exact_duplicates(df)
    assert featured["DUPLICATE_COUNT"].iloc[0] == 2
    assert featured["IS_DUPLICATE_CANDIDATE"].iloc[0] == True
    assert featured["IS_DUPLICATE_CANDIDATE"].iloc[2] == False

def test_structuring_detection():
    df = pd.DataFrame({
        "ALLOCATION_AMOUNT": [495000, 990000, 120000]
    })
    featured = detect_structuring(df)
    assert featured["IS_STRUCTURED_CANDIDATE"].iloc[0] == True
    assert featured["IS_STRUCTURED_CANDIDATE"].iloc[1] == True
    assert featured["IS_STRUCTURED_CANDIDATE"].iloc[2] == False

def test_vendor_concentration():
    df = pd.DataFrame({
        "MP_NAME": ["MP A"] * 10,
        "IDA": ["IDA X"] * 8 + ["IDA Y"] * 2,
        "ALLOCATION_AMOUNT": [100000] * 10
    })
    featured = compute_vendor_concentration(df)
    assert featured["IDA_MP_WORK_SHARE"].iloc[0] == 0.80
    assert featured["IS_VENDOR_MONOPOLY"].iloc[0] == True
