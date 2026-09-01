import pandas as pd

def detect_exact_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    # Exact match on MP_NAME, WORK, ALLOCATION_AMOUNT
    group_cols = ["MP_NAME", "WORK", "ALLOCATION_AMOUNT"]
    
    # Calculate group count
    if "DUPLICATE_COUNT" not in df.columns or df["DUPLICATE_COUNT"].isnull().all():
        counts = df.groupby(group_cols).size().reset_index(name="DUPLICATE_COUNT")
        df = df.merge(counts, on=group_cols, how="left")
    
    df["DUPLICATE_COUNT"] = df["DUPLICATE_COUNT"].fillna(1).astype(int)
    df["IS_DUPLICATE_CANDIDATE"] = df["DUPLICATE_COUNT"] > 1
    
    return df
