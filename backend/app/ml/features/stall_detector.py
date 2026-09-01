import pandas as pd
import numpy as np

def detect_stall_risk(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    if "DAYS_SINCE_RECOMMENDED" not in df.columns:
        df["DAYS_SINCE_RECOMMENDED"] = 0
        
    days = df["DAYS_SINCE_RECOMMENDED"].values
    statuses = df["STATUS"].fillna("").astype(str).str.lower().values
    approvals = df["IDA_APPROVAL"].fillna("").astype(str).str.lower().values
    
    stall_scores = np.zeros(len(df))
    is_ghost_candidate = np.zeros(len(df), dtype=bool)
    
    for i in range(len(df)):
        d = days[i]
        st = statuses[i]
        app = approvals[i]
        
        # Stuck in Unsanctioned or Action Pending
        if "unsanctioned" in st or "pending" in app:
            if d >= 300:
                stall_scores[i] = 0.90
                is_ghost_candidate[i] = True
            elif d >= 180:
                stall_scores[i] = 0.65
            elif d >= 90:
                stall_scores[i] = 0.35
            else:
                stall_scores[i] = 0.10
        elif "ongoing" in st or "sanctioned" in st:
            if d >= 300:
                stall_scores[i] = 0.75
                is_ghost_candidate[i] = True
            elif d >= 180:
                stall_scores[i] = 0.40
            else:
                stall_scores[i] = 0.05
        else:
            # Completed
            stall_scores[i] = 0.0
            
    df["STALL_RISK_SCORE"] = stall_scores
    df["IS_GHOST_CANDIDATE"] = is_ghost_candidate
    return df
