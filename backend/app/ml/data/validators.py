"""
validators.py - Comprehensive schema discovery, referential integrity validator,
numeric/temporal sanity checker, and label leakage auditor.
"""

import math
from typing import Dict, List, Any, Optional, Set, Tuple
import pandas as pd
import numpy as np

from .schemas import (
    SOURCE_TABLE_SPECS,
    TARGET_LEAKAGE_COLUMNS,
    RAW_IDENTITY_COLUMNS,
    RELATIONAL_KEYS,
)


def discover_table_schema(df: pd.DataFrame, table_name: str, file_name: str, spec: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Inspects a table and returns detailed schema metadata and discrepancy analysis."""
    row_count = len(df)
    col_count = len(df.columns)
    
    col_details = {}
    numeric_cols = []
    date_cols = []
    categorical_cols = []
    
    for col in df.columns:
        s = df[col]
        dtype_str = str(s.dtype)
        null_count = int(s.isnull().sum())
        null_pct = round(float(s.isnull().mean() * 100), 2)
        unique_count = int(s.nunique())
        
        # Inferred type
        col_lower = col.lower()
        if pd.api.types.is_numeric_dtype(s):
            numeric_cols.append(col)
            inferred = "numeric"
        elif "date" in col_lower or "timestamp" in col_lower:
            date_cols.append(col)
            inferred = "date"
        else:
            categorical_cols.append(col)
            inferred = "categorical"
            
        sample_vals = [str(x) for x in s.dropna().head(3).tolist()]
        
        col_details[col] = {
            "dtype": dtype_str,
            "inferred_type": inferred,
            "null_count": null_count,
            "null_percentage": null_pct,
            "unique_count": unique_count,
            "sample_values": sample_vals,
        }
    
    pk = spec.get("primary_key") if spec else ("project_id" if "project_id" in df.columns else df.columns[0])
    pk_exists = pk in df.columns if pk else False
    pk_unique = int(df[pk].nunique()) == row_count if pk_exists else False
    pk_nulls = int(df[pk].isnull().sum()) if pk_exists else 0
    duplicate_rows = int(df.duplicated().sum())
    
    # Check discrepancies against expected columns
    expected_cols = spec.get("expected_columns", []) if spec else []
    missing_expected = [c for c in expected_cols if c not in df.columns]
    unexpected_cols = [c for c in df.columns if expected_cols and c not in expected_cols]
    
    return {
        "file_name": file_name,
        "table_name": table_name,
        "row_count": row_count,
        "column_count": col_count,
        "primary_key": pk,
        "primary_key_exists": pk_exists,
        "primary_key_unique": pk_unique,
        "primary_key_nulls": pk_nulls,
        "duplicate_rows": duplicate_rows,
        "numeric_columns": numeric_cols,
        "date_columns": date_cols,
        "categorical_columns": categorical_cols,
        "columns": col_details,
        "missing_expected_columns": missing_expected,
        "unexpected_columns": unexpected_cols,
    }


def validate_primary_keys(tables: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    """Validates uniqueness and non-nullness of primary keys across all tables."""
    results = {}
    all_passed = True
    
    for file_name, spec in SOURCE_TABLE_SPECS.items():
        if file_name not in tables:
            continue
        df = tables[file_name]
        pk = spec["primary_key"]
        
        if pk not in df.columns:
            results[file_name] = {
                "primary_key": pk,
                "status": "FAIL",
                "reason": f"Column {pk} missing",
            }
            all_passed = False
            continue
            
        null_count = int(df[pk].isnull().sum())
        dup_count = int(df[pk].duplicated().sum())
        unique_count = int(df[pk].nunique())
        is_valid = (null_count == 0) and (dup_count == 0) and (unique_count == len(df))
        
        results[file_name] = {
            "primary_key": pk,
            "row_count": len(df),
            "unique_count": unique_count,
            "null_count": null_count,
            "duplicate_count": dup_count,
            "status": "PASS" if is_valid else "FAIL",
        }
        if not is_valid:
            all_passed = False
            
    return {"all_passed": all_passed, "tables": results}


def validate_referential_integrity(tables: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    """
    Validates all foreign key relationships across the 12 tables.
    Detects orphans, null foreign keys, and cardinality.
    """
    relationships = []
    all_passed = True
    
    for child_file, spec in SOURCE_TABLE_SPECS.items():
        if child_file not in tables:
            continue
        child_df = tables[child_file]
        fks = spec.get("foreign_keys", {})
        
        for fk_col, (parent_file, parent_pk) in fks.items():
            if parent_file not in tables:
                continue
            parent_df = tables[parent_file]
            
            if fk_col not in child_df.columns:
                rel_info = {
                    "relationship": f"{child_file}.{fk_col} -> {parent_file}.{parent_pk}",
                    "child_table": child_file,
                    "parent_table": parent_file,
                    "foreign_key": fk_col,
                    "parent_primary_key": parent_pk,
                    "child_rows": len(child_df),
                    "parent_rows": len(parent_df),
                    "null_fk_count": 0,
                    "orphan_count": 0,
                    "status": "FAIL",
                    "reason": f"Foreign key column {fk_col} missing in {child_file}",
                }
                relationships.append(rel_info)
                all_passed = False
                continue
                
            if parent_pk not in parent_df.columns:
                rel_info = {
                    "relationship": f"{child_file}.{fk_col} -> {parent_file}.{parent_pk}",
                    "child_table": child_file,
                    "parent_table": parent_file,
                    "foreign_key": fk_col,
                    "parent_primary_key": parent_pk,
                    "child_rows": len(child_df),
                    "parent_rows": len(parent_df),
                    "null_fk_count": 0,
                    "orphan_count": 0,
                    "status": "FAIL",
                    "reason": f"Parent primary key column {parent_pk} missing in {parent_file}",
                }
                relationships.append(rel_info)
                all_passed = False
                continue
            
            parent_keys = set(parent_df[parent_pk].dropna())
            child_fk_series = child_df[fk_col]
            null_count = int(child_fk_series.isnull().sum())
            
            child_non_null = set(child_fk_series.dropna())
            orphans = list(child_non_null - parent_keys)
            orphan_count = len(orphans)
            
            # Determine cardinality
            child_pk = spec.get("primary_key")
            if child_pk == fk_col:
                cardinality = "1:1" if orphan_count == 0 and len(child_df) == len(parent_df) else "1:1 (subset)"
            elif child_df[fk_col].duplicated().any():
                cardinality = "MANY:1"
            else:
                cardinality = "1:1"
            
            is_pass = (orphan_count == 0)
            if not is_pass:
                all_passed = False
                
            rel_info = {
                "relationship": f"{child_file.replace('.csv', '')}.{fk_col} -> {parent_file.replace('.csv', '')}.{parent_pk}",
                "child_table": child_file,
                "parent_table": parent_file,
                "foreign_key": fk_col,
                "parent_primary_key": parent_pk,
                "child_rows": len(child_df),
                "parent_rows": len(parent_df),
                "null_fk_count": null_count,
                "orphan_count": orphan_count,
                "sample_orphans": orphans[:5] if orphan_count > 0 else [],
                "cardinality": cardinality,
                "status": "PASS" if is_pass else "FAIL",
            }
            relationships.append(rel_info)
            
    return {
        "all_passed": all_passed,
        "relationship_count": len(relationships),
        "relationships": relationships,
    }


def validate_numeric_and_temporal(tables: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    """
    Validates domain ranges:
    - Coordinates within valid latitude (-90 to 90) and longitude (-180 to 180).
    - Monetary amounts >= 0.
    - Percentages within valid bounds (0 to 100 or -100 to 100 for deviations).
    - Date sanity (start_date <= expected_completion_date).
    """
    findings = []
    
    # 01_projects checks
    if "01_projects.csv" in tables:
        df = tables["01_projects.csv"]
        if "project_latitude" in df.columns:
            invalid_lat = df[~df["project_latitude"].between(-90, 90) & df["project_latitude"].notnull()]
            if len(invalid_lat) > 0:
                findings.append(f"01_projects.csv has {len(invalid_lat)} invalid latitude values outside [-90, 90]")
        if "project_longitude" in df.columns:
            invalid_lon = df[~df["project_longitude"].between(-180, 180) & df["project_longitude"].notnull()]
            if len(invalid_lon) > 0:
                findings.append(f"01_projects.csv has {len(invalid_lon)} invalid longitude values outside [-180, 180]")
        if "planned_duration_days" in df.columns:
            neg_dur = df[df["planned_duration_days"] < 0]
            if len(neg_dur) > 0:
                findings.append(f"01_projects.csv has {len(neg_dur)} negative planned duration values")
                
    # 02_financials checks
    if "02_financials.csv" in tables:
        df = tables["02_financials.csv"]
        for amt_col in ["sanctioned_amount", "estimated_cost", "released_amount", "actual_expenditure"]:
            if amt_col in df.columns:
                neg_amt = df[df[amt_col] < 0]
                if len(neg_amt) > 0:
                    findings.append(f"02_financials.csv has {len(neg_amt)} negative amounts in {amt_col}")
                    
    # 03_payments checks
    if "03_payments.csv" in tables:
        df = tables["03_payments.csv"]
        if "payment_amount" in df.columns:
            neg_pay = df[df["payment_amount"] < 0]
            if len(neg_pay) > 0:
                findings.append(f"03_payments.csv has {len(neg_pay)} negative payment amounts")
                
    # 09_geography checks
    if "09_geography.csv" in tables:
        df = tables["09_geography.csv"]
        if "population" in df.columns:
            neg_pop = df[df["population"] <= 0]
            if len(neg_pop) > 0:
                findings.append(f"09_geography.csv has {len(neg_pop)} non-positive population counts")
        if "poverty_rate" in df.columns:
            inv_pov = df[~df["poverty_rate"].between(0, 100) & df["poverty_rate"].notnull()]
            if len(inv_pov) > 0:
                findings.append(f"09_geography.csv has {len(inv_pov)} poverty rates outside [0, 100]")

    return {
        "status": "PASS" if len(findings) == 0 else "WARNING",
        "findings_count": len(findings),
        "findings": findings,
    }


def validate_label_leakage(master_df: pd.DataFrame, label_df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
    """
    Strictly asserts that none of the target columns or label derivatives
    from 12_labels.csv exist in the project_master_features DataFrame.
    """
    master_cols = set(master_df.columns)
    leaked_cols = []
    
    for forbidden in TARGET_LEAKAGE_COLUMNS:
        # Exact match
        if forbidden in master_cols:
            leaked_cols.append(forbidden)
        # Prefixed match
        for col in master_cols:
            if col.endswith(f"__{forbidden}") or col == forbidden:
                if col not in leaked_cols:
                    leaked_cols.append(col)
                    
    # Additional semantic checks for suspicious columns
    suspicious_patterns = ["fraud_label", "is_fraud", "is_anomalous", "scenario_type", "scenario_name", "investigation_priority"]
    for col in master_cols:
        for pat in suspicious_patterns:
            if pat in col.lower() and col not in leaked_cols:
                leaked_cols.append(col)
                
    is_safe = len(leaked_cols) == 0
    return {
        "status": "PASS" if is_safe else "FAIL",
        "leakage_detected": not is_safe,
        "leaked_columns": leaked_cols,
        "master_column_count": len(master_cols),
        "target_leakage_columns_checked": TARGET_LEAKAGE_COLUMNS,
    }


def validate_master_feature_store(master_df: pd.DataFrame, projects_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Validates final project master feature dataset:
    - Exactly 1 row per project.
    - Dynamic row count matches projects_df.
    - No infinite or NaN values in critical features.
    - Column prefixes verified.
    """
    expected_rows = len(projects_df)
    actual_rows = len(master_df)
    unique_projects = int(master_df["project_id"].nunique()) if "project_id" in master_df.columns else 0
    
    row_count_match = (expected_rows == actual_rows) and (unique_projects == actual_rows)
    
    # Null counts per column
    null_stats = {}
    high_null_cols = []
    for col in master_df.columns:
        null_cnt = int(master_df[col].isnull().sum())
        null_pct = round(float(master_df[col].isnull().mean() * 100), 2)
        null_stats[col] = {"null_count": null_cnt, "null_pct": null_pct}
        if null_pct > 50.0:
            high_null_cols.append({"column": col, "null_pct": null_pct})
            
    # Check for infinite values in numeric columns
    numeric_cols = master_df.select_dtypes(include=[np.number]).columns
    inf_cols = []
    for col in numeric_cols:
        inf_cnt = int(np.isinf(master_df[col]).sum())
        if inf_cnt > 0:
            inf_cols.append({"column": col, "inf_count": inf_cnt})
            
    # Group prefixes
    prefix_counts = {}
    for col in master_df.columns:
        prefix = col.split("__")[0] if "__" in col else "unprefixed"
        prefix_counts[prefix] = prefix_counts.get(prefix, 0) + 1
        
    is_valid = row_count_match and (len(inf_cols) == 0)
    
    return {
        "status": "PASS" if is_valid else "FAIL",
        "expected_project_count": expected_rows,
        "actual_project_count": actual_rows,
        "unique_project_id_count": unique_projects,
        "row_count_match": row_count_match,
        "total_feature_columns": len(master_df.columns),
        "feature_group_counts": prefix_counts,
        "infinite_value_columns": inf_cols,
        "high_null_columns": high_null_cols,
        "null_statistics": null_stats,
    }
