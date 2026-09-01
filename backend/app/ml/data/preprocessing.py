import re
import pandas as pd
import numpy as np
from datetime import datetime

def clean_work_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    # Strip leading "NA - ", "NA – ", etc.
    cleaned = re.sub(r'^(?:NA\s*[-–]\s*)+', '', text, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    return cleaned

def extract_work_type(text: str) -> str:
    cleaned = clean_work_text(text).lower()
    
    keywords = [
        ("street light", "street lights"),
        ("community hall", "community hall"),
        ("community center", "community centers and halls"),
        ("road", "repair and construction of roads"),
        ("pathway", "repair and construction of roads"),
        ("drainage", "drainage system"),
        ("hand pump", "hand pumps and borewells"),
        ("borewell", "hand pumps and borewells"),
        ("school", "government school building"),
        ("solar", "solar street lights and energy"),
        ("toilet", "public toilet complex"),
        ("anganwadi", "anganwadi center"),
        ("water", "drinking water supply and plants"),
        ("purification", "drinking water supply and plants"),
        ("cctv", "cctv surveillance system"),
        ("boundary wall", "boundary wall construction"),
        ("park", "public park development"),
        ("cremation", "cremation ground shed"),
        ("health", "health center and sub-center"),
        ("hospital", "hospital infrastructure"),
    ]
    for key, normalized in keywords:
        if key in cleaned:
            return normalized
    
    # Fallback to truncated cleaned text
    return cleaned[:40] if cleaned else "general public works"

def compute_days_since_recommended(date_series: pd.Series, ref_date_str: str = "2024-03-31") -> pd.Series:
    ref_date = pd.to_datetime(ref_date_str)
    parsed_dates = pd.to_datetime(date_series, errors="coerce")
    days = (ref_date - parsed_dates).dt.days.fillna(0).clip(lower=0).astype(int)
    return days

def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    # Normalize column names
    df.columns = [c.strip() for c in df.columns]
    
    # Text cleaning
    if "WORK" in df.columns:
        df["CLEANED_WORK"] = df["WORK"].apply(clean_work_text)
        if "WORK_TYPE" not in df.columns or df["WORK_TYPE"].isnull().all():
            df["WORK_TYPE"] = df["WORK"].apply(extract_work_type)
    
    # Amount validation
    if "ALLOCATION_AMOUNT" in df.columns:
        df["ALLOCATION_AMOUNT"] = pd.to_numeric(df["ALLOCATION_AMOUNT"], errors="coerce").fillna(0.0).clip(lower=0)
    
    # Dates & Stall proxy
    if "RECOMMENDED_DATE" in df.columns:
        df["DAYS_SINCE_RECOMMENDED"] = compute_days_since_recommended(df["RECOMMENDED_DATE"])
    else:
        df["DAYS_SINCE_RECOMMENDED"] = 0
        
    # Strings fillna
    str_cols = ["MP_NAME", "STATE", "CONSTITUENCY", "IDA", "STATUS", "IDA_APPROVAL", "CATEGORY", "HOUSE", "CITY", "WARD", "BLOCK", "VILLAGE"]
    for col in str_cols:
        if col in df.columns:
            df[col] = df[col].fillna("").astype(str)
            
    return df
