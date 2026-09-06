"""
feature_builder.py - Assembles the project master feature store with consistent prefixes,
entity context enrichment, identity protection, and strict label isolation.
"""

from typing import Dict, Tuple, Optional
import pandas as pd
import numpy as np

from .schemas import (
    TARGET_LEAKAGE_COLUMNS,
    RAW_IDENTITY_COLUMNS,
)
from .aggregators import aggregate_payments, aggregate_progress


def extract_contractor_features(contractors_df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts contractor behavioral/contextual features with 'contractor__' prefix.
    Excludes raw identity string 'contractor_name' and redundant geo keys.
    """
    if contractors_df.empty or "contractor_id" not in contractors_df.columns:
        return pd.DataFrame(columns=["contractor_id"])
        
    df = contractors_df.copy()
    
    # Exclude raw identity and redundant foreign keys
    drop_cols = ["contractor_name", "home_district_id", "home_state_id"]
    cols_to_keep = [c for c in df.columns if c not in drop_cols]
    df = df[cols_to_keep]
    
    # Prefix columns uniquely
    rename_map = {}
    for col in df.columns:
        if col != "contractor_id":
            rename_map[col] = f"contractor__{col}"
            
    return df.rename(columns=rename_map)


def extract_agency_features(agencies_df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts implementing agency contextual features with 'agency__' prefix.
    Excludes raw identity string 'agency_name' and redundant geo keys.
    """
    if agencies_df.empty or "agency_id" not in agencies_df.columns:
        return pd.DataFrame(columns=["agency_id"])
        
    df = agencies_df.copy()
    
    drop_cols = ["agency_name", "district_id", "state_id"]
    cols_to_keep = [c for c in df.columns if c not in drop_cols]
    df = df[cols_to_keep]
    
    rename_map = {}
    for col in df.columns:
        if col != "agency_id":
            rename_map[col] = f"agency__{col}"
            
    return df.rename(columns=rename_map)


def extract_geography_features(geography_df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts district socio-economic and geographic contextual features with 'geo__' prefix.
    Excludes raw textual names (district_name, state_name, state_id).
    """
    if geography_df.empty or "district_id" not in geography_df.columns:
        return pd.DataFrame(columns=["district_id"])
        
    df = geography_df.copy()
    
    drop_cols = ["district_name", "state_name", "state_id"]
    cols_to_keep = [c for c in df.columns if c not in drop_cols]
    df = df[cols_to_keep]
    
    rename_map = {}
    for col in df.columns:
        if col != "district_id":
            rename_map[col] = f"geo__{col}"
            
    return df.rename(columns=rename_map)


def extract_constituency_features(constituencies_df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts parliamentary constituency contextual features with 'constituency__' prefix.
    Excludes raw identity strings (constituency_name, mp_name) and redundant geo keys.
    """
    if constituencies_df.empty or "constituency_id" not in constituencies_df.columns:
        return pd.DataFrame(columns=["constituency_id"])
        
    df = constituencies_df.copy()
    
    drop_cols = ["constituency_name", "mp_name", "district_id", "state_id"]
    cols_to_keep = [c for c in df.columns if c not in drop_cols]
    df = df[cols_to_keep]
    
    rename_map = {}
    for col in df.columns:
        if col != "constituency_id":
            rename_map[col] = f"constituency__{col}"
            
    return df.rename(columns=rename_map)


def prepare_project_base(projects_df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepares the core project backbone with 'project__' prefix,
    retaining project_id and join keys for relational merging.
    """
    df = projects_df.copy()
    
    # Exclude raw free text titles from ML features
    # (Retain category, work_type, sizes, status, duration, coordinates)
    drop_cols = ["work_name", "title", "district_name", "state_name", "constituency_name"]
    cols_to_keep = [c for c in df.columns if c not in drop_cols]
    df = df[cols_to_keep]
    
    rename_map = {}
    join_keys = ["project_id", "contractor_id", "agency_id", "district_id", "constituency_id", "state_id"]
    
    for col in df.columns:
        if col not in join_keys:
            rename_map[col] = f"project__{col}"
            
    return df.rename(columns=rename_map)


def prepare_prefixed_table(df: pd.DataFrame, prefix: str, drop_cols: Optional[list] = None) -> pd.DataFrame:
    """Helper to prefix all non-project_id columns with a standard feature group prefix."""
    res = df.copy()
    if drop_cols:
        res = res.drop(columns=[c for c in drop_cols if c in res.columns])
        
    rename_map = {}
    for col in res.columns:
        if col != "project_id":
            rename_map[col] = f"{prefix}__{col}"
            
    return res.rename(columns=rename_map)


def build_project_master_features(tables: Dict[str, pd.DataFrame]) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Builds the project master feature store, payment features, progress features,
    and isolated project labels from the 12 source tables.
    
    Guarantees:
    - Exactly 1 row per project in project_master_features.
    - Zero label leakage from 12_labels.csv.
    - Consistent feature group prefixes.
    - Identity protection (raw names excluded).
    
    Returns:
        (master_features_df, payment_features_df, progress_features_df, project_labels_df)
    """
    projects_df = tables["01_projects.csv"]
    financials_df = tables["02_financials.csv"]
    payments_df = tables["03_payments.csv"]
    progress_df = tables["04_progress.csv"]
    procurement_df = tables["05_procurement.csv"]
    contracts_df = tables["06_contracts.csv"]
    contractors_df = tables["07_contractors.csv"]
    agencies_df = tables["08_agencies.csv"]
    geography_df = tables["09_geography.csv"]
    constituencies_df = tables["10_constituencies.csv"]
    documents_df = tables["11_documents.csv"]
    labels_df = tables["12_labels.csv"]
    
    initial_project_count = len(projects_df)
    
    # 1. Aggregate transactional tables to project level
    payment_features = aggregate_payments(payments_df)
    progress_features = aggregate_progress(progress_df)
    
    # Prefix payment and progress features
    prefixed_payments = prepare_prefixed_table(payment_features, "payment")
    prefixed_progress = prepare_prefixed_table(progress_features, "progress")
    
    # 2. Extract entity context features
    contractor_context = extract_contractor_features(contractors_df)
    agency_context = extract_agency_features(agencies_df)
    geo_context = extract_geography_features(geography_df)
    constituency_context = extract_constituency_features(constituencies_df)
    
    # 3. Prepare direct project-level tables
    prefixed_financials = prepare_prefixed_table(financials_df, "financial")
    prefixed_procurement = prepare_prefixed_table(procurement_df, "procurement", drop_cols=["tender_id"])
    prefixed_contracts = prepare_prefixed_table(contracts_df, "contract", drop_cols=["contract_id", "contractor_id"])
    prefixed_documents = prepare_prefixed_table(documents_df, "document", drop_cols=["document_id", "asset_id"])
    
    # 4. Start from project base
    master = prepare_project_base(projects_df)
    
    # 5. Progressive controlled left joins
    master = master.merge(prefixed_financials, on="project_id", how="left")
    master = master.merge(prefixed_payments, on="project_id", how="left")
    master = master.merge(prefixed_progress, on="project_id", how="left")
    master = master.merge(prefixed_procurement, on="project_id", how="left")
    master = master.merge(prefixed_contracts, on="project_id", how="left")
    
    # Entity context joins
    master = master.merge(contractor_context, on="contractor_id", how="left")
    master = master.merge(agency_context, on="agency_id", how="left")
    master = master.merge(geo_context, on="district_id", how="left")
    master = master.merge(constituency_context, on="constituency_id", how="left")
    
    # Document bundle join
    master = master.merge(prefixed_documents, on="project_id", how="left")
    
    # 6. Invariant check: row count preservation
    assert len(master) == initial_project_count, (
        f"Row count mismatch: expected {initial_project_count}, got {len(master)}"
    )
    assert master["project_id"].nunique() == initial_project_count, (
        f"Duplicate project_ids detected in master feature store!"
    )
    
    # 7. Check no duplicate column names exist
    dup_cols = master.columns[master.columns.duplicated()].tolist()
    assert len(dup_cols) == 0, f"Duplicate columns detected in master: {dup_cols}"
    
    # 8. Strictly isolate labels
    project_labels = labels_df.copy()
    
    # 9. Assert ZERO label leakage into master
    for label_col in TARGET_LEAKAGE_COLUMNS:
        assert label_col not in master.columns, f"LEAKAGE DETECTED: {label_col} found in master features!"
        assert f"target__{label_col}" not in master.columns, f"LEAKAGE DETECTED: target__{label_col} in master!"
        
    return master, payment_features, progress_features, project_labels
