import pandas as pd
import numpy as np

COMMON_THRESHOLDS = [500_000, 1_000_000, 2_500_000, 5_000_000]

def detect_structuring(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    amounts = df["ALLOCATION_AMOUNT"].values
    structuring_scores = np.zeros(len(df))
    is_structured = np.zeros(len(df), dtype=bool)
    
    for i, amt in enumerate(amounts):
        if amt <= 0:
            continue
        for thresh in COMMON_THRESHOLDS:
            # If amount is within 95% to 99.9% of threshold
            ratio = amt / thresh
            if 0.94 <= ratio <= 0.999:
                # Higher score if closer to threshold
                score = (ratio - 0.94) / (1.0 - 0.94)
                if score > structuring_scores[i]:
                    structuring_scores[i] = score
                    is_structured[i] = True
                    
    df["STRUCTURING_SCORE"] = structuring_scores
    df["IS_STRUCTURED_CANDIDATE"] = is_structured
    return df
