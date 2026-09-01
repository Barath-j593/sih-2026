import pandas as pd
import numpy as np
from app.ml.data.preprocessing import preprocess_dataframe
from app.ml.features.peer_zscore import compute_peer_zscores
from app.ml.features.duplicate_detector import detect_exact_duplicates
from app.ml.features.fuzzy_duplicate import detect_fuzzy_duplicates
from app.ml.features.vendor_concentration import compute_vendor_concentration
from app.ml.features.structuring_detector import detect_structuring
from app.ml.features.stall_detector import detect_stall_risk

FEATURE_COLUMNS = [
    "ALLOCATION_AMOUNT",
    "ALLOC_ZSCORE_STATE",
    "ALLOC_ZSCORE_WORKTYPE",
    "DUPLICATE_COUNT",
    "FUZZY_SIMILARITY_SCORE",
    "IDA_MP_WORK_SHARE",
    "IDA_MP_ALLOC_SHARE",
    "STRUCTURING_SCORE",
    "DAYS_SINCE_RECOMMENDED",
    "STALL_RISK_SCORE",
    "MP_TOTAL_WORKS",
    "IDA_WORK_COUNT"
]

def build_feature_pipeline(df: pd.DataFrame, is_training: bool = False) -> pd.DataFrame:
    """
    Runs raw dataframe through the complete feature engineering pipeline.
    """
    df = preprocess_dataframe(df)
    df = compute_peer_zscores(df)
    df = detect_exact_duplicates(df)
    df = detect_fuzzy_duplicates(df)
    df = compute_vendor_concentration(df)
    df = detect_structuring(df)
    df = detect_stall_risk(df)
    
    # Fill any remaining NaNs in feature columns
    for col in FEATURE_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
            
    return df
