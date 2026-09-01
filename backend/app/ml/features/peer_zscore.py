import pandas as pd
import numpy as np

def compute_peer_zscores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes peer-relative allocation cost z-scores grouped by:
    1. (STATE)
    2. (WORK_TYPE)
    """
    df = df.copy()

    # State z-score
    if "ALLOC_ZSCORE_STATE" not in df.columns or df["ALLOC_ZSCORE_STATE"].isnull().any():
        if "STATE_MEAN_ALLOC" not in df.columns or df["STATE_MEAN_ALLOC"].isnull().any():
            state_mean = df.groupby("STATE")["ALLOCATION_AMOUNT"].transform("mean")
            state_std = df.groupby("STATE")["ALLOCATION_AMOUNT"].transform("std").replace(0, np.nan).fillna(1.0)
            df["STATE_MEAN_ALLOC"] = state_mean
            df["STATE_STD_ALLOC"] = state_std
        df["ALLOC_ZSCORE_STATE"] = (df["ALLOCATION_AMOUNT"] - df["STATE_MEAN_ALLOC"]) / df["STATE_STD_ALLOC"]
        df["ALLOC_ZSCORE_STATE"] = pd.to_numeric(df["ALLOC_ZSCORE_STATE"], errors="coerce").fillna(0.0).clip(lower=-3.0, upper=10.0)

    # Work type z-score
    if "ALLOC_ZSCORE_WORKTYPE" not in df.columns or df["ALLOC_ZSCORE_WORKTYPE"].isnull().any():
        if "WORKTYPE_MEAN_ALLOC" not in df.columns or df["WORKTYPE_MEAN_ALLOC"].isnull().any():
            wt_mean = df.groupby("WORK_TYPE")["ALLOCATION_AMOUNT"].transform("mean")
            wt_std = df.groupby("WORK_TYPE")["ALLOCATION_AMOUNT"].transform("std").replace(0, np.nan).fillna(1.0)
            df["WORKTYPE_MEAN_ALLOC"] = wt_mean
            df["WORKTYPE_STD_ALLOC"] = wt_std
        df["ALLOC_ZSCORE_WORKTYPE"] = (df["ALLOCATION_AMOUNT"] - df["WORKTYPE_MEAN_ALLOC"]) / df["WORKTYPE_STD_ALLOC"]
        df["ALLOC_ZSCORE_WORKTYPE"] = pd.to_numeric(df["ALLOC_ZSCORE_WORKTYPE"], errors="coerce").fillna(0.0).clip(lower=-3.0, upper=10.0)

    return df
