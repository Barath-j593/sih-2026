import pandas as pd
import numpy as np

def compute_vendor_concentration(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # MP Totals
    if "MP_TOTAL_WORKS" not in df.columns or df["MP_TOTAL_WORKS"].isnull().any():
        df["MP_TOTAL_WORKS"] = df.groupby("MP_NAME")["ALLOCATION_AMOUNT"].transform("count")
    if "MP_TOTAL_ALLOCATION" not in df.columns or df["MP_TOTAL_ALLOCATION"].isnull().any():
        df["MP_TOTAL_ALLOCATION"] = df.groupby("MP_NAME")["ALLOCATION_AMOUNT"].transform("sum")

    # IDA Totals
    if "IDA_WORK_COUNT" not in df.columns or df["IDA_WORK_COUNT"].isnull().any():
        df["IDA_WORK_COUNT"] = df.groupby("IDA")["ALLOCATION_AMOUNT"].transform("count")

    # MP-IDA Pair Totals
    df["MP_IDA_PAIR_WORKS"] = df.groupby(["MP_NAME", "IDA"])["ALLOCATION_AMOUNT"].transform("count")
    df["MP_IDA_PAIR_ALLOC"] = df.groupby(["MP_NAME", "IDA"])["ALLOCATION_AMOUNT"].transform("sum")

    # Concentration ratio: share of MP's works given to this single IDA
    df["IDA_MP_WORK_SHARE"] = (df["MP_IDA_PAIR_WORKS"] / df["MP_TOTAL_WORKS"]).fillna(0.0).clip(0.0, 1.0)
    df["IDA_MP_ALLOC_SHARE"] = (df["MP_IDA_PAIR_ALLOC"] / df["MP_TOTAL_ALLOCATION"]).fillna(0.0).clip(0.0, 1.0)

    # Monopolization flag (> 65% of works to a single IDA when MP has > 5 works)
    df["IS_VENDOR_MONOPOLY"] = (df["IDA_MP_WORK_SHARE"] > 0.65) & (df["MP_TOTAL_WORKS"] > 5)

    return df
