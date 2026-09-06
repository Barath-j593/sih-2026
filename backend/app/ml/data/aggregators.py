"""
aggregators.py - Time-aware transaction aggregators for payment and progress observations.
Produces strictly 1 row per project with full aggregation statistics.
"""

from typing import Dict, List, Optional
import pandas as pd
import numpy as np


def aggregate_payments(payments_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregates transaction-level payment records (MANY rows per project)
    into project-level payment features (1 row per project).
    
    Dynamically supports any number of projects and payment rows.
    """
    if payments_df.empty or "project_id" not in payments_df.columns:
        return pd.DataFrame(columns=["project_id"])
    
    df = payments_df.copy()
    
    # Ensure payment_date is datetime
    if "payment_date" in df.columns:
        df["payment_date_dt"] = pd.to_datetime(df["payment_date"], errors="coerce")
    else:
        df["payment_date_dt"] = pd.NaT
        
    # Sort chronologically
    df = df.sort_values(by=["project_id", "payment_date_dt"])
    
    grouped = df.groupby("project_id", sort=True)
    
    records = []
    for project_id, group in grouped:
        p_count = len(group)
        amounts = group["payment_amount"].values if "payment_amount" in group.columns else np.array([0.0])
        total_paid = float(np.sum(amounts))
        avg_payment = float(np.mean(amounts))
        med_payment = float(np.median(amounts))
        min_payment = float(np.min(amounts))
        max_payment = float(np.max(amounts))
        std_payment = float(np.std(amounts, ddof=1)) if p_count > 1 else 0.0
        
        # Timing features
        dates = group["payment_date_dt"].dropna()
        if len(dates) > 0:
            first_date = dates.min()
            last_date = dates.max()
            span_days = max(0, (last_date - first_date).days)
            first_date_str = str(first_date.date())
            last_date_str = str(last_date.date())
        else:
            first_date_str = ""
            last_date_str = ""
            span_days = 0
            
        if len(dates) > 1:
            diffs = dates.diff().dropna().dt.days.values
            avg_interval = float(np.mean(diffs))
            med_interval = float(np.median(diffs))
            std_interval = float(np.std(diffs, ddof=1)) if len(diffs) > 1 else 0.0
        else:
            avg_interval = 0.0
            med_interval = 0.0
            std_interval = 0.0
            
        # Velocity and frequency
        if "payment_velocity" in group.columns:
            vel_mean = float(group["payment_velocity"].mean())
            vel_max = float(group["payment_velocity"].max())
        else:
            vel_mean = total_paid / max(1, span_days)
            vel_max = vel_mean
            
        if "payment_frequency" in group.columns:
            freq_mean = float(group["payment_frequency"].mean())
        else:
            freq_mean = float(avg_interval)
            
        if "payment_concentration" in group.columns:
            conc_max = float(group["payment_concentration"].max())
        else:
            conc_max = (max_payment / total_paid) if total_paid > 0 else 0.0
            
        # Anomaly indicators
        dup_count = int(group["duplicate_payment_flag"].sum()) if "duplicate_payment_flag" in group.columns else 0
        dup_rate = dup_count / p_count if p_count > 0 else 0.0
        
        timing_anomaly_cnt = int(group["payment_timing_anomaly"].sum()) if "payment_timing_anomaly" in group.columns else 0
        timing_anomaly_rate = timing_anomaly_cnt / p_count if p_count > 0 else 0.0
        
        if "measurement_book_verified" in group.columns:
            # Handle booleans and integers
            verified_bools = group["measurement_book_verified"].astype(bool)
            unverified_cnt = int((~verified_bools).sum())
        else:
            unverified_cnt = 0
        unverified_rate = unverified_cnt / p_count if p_count > 0 else 0.0
        
        round_num_cnt = int(group["is_round_number"].sum()) if "is_round_number" in group.columns else 0
        round_num_rate = round_num_cnt / p_count if p_count > 0 else 0.0
        
        # Installment behavior
        if "is_final_installment" in group.columns and "payment_amount" in group.columns:
            final_mask = group["is_final_installment"].astype(bool)
            final_count = int(final_mask.sum())
            final_amt = float(group.loc[final_mask, "payment_amount"].sum())
        else:
            final_count = 0
            final_amt = 0.0
        final_share = (final_amt / total_paid) if total_paid > 0 else 0.0
        
        records.append({
            "project_id": project_id,
            "payment_count": p_count,
            "total_paid": round(total_paid, 2),
            "average_payment": round(avg_payment, 2),
            "median_payment": round(med_payment, 2),
            "min_payment": round(min_payment, 2),
            "max_payment": round(max_payment, 2),
            "payment_amount_std": round(std_payment, 2),
            "first_payment_date": first_date_str,
            "last_payment_date": last_date_str,
            "payment_span_days": span_days,
            "average_days_between_payments": round(avg_interval, 2),
            "median_days_between_payments": round(med_interval, 2),
            "payment_interval_std": round(std_interval, 2),
            "payment_velocity_mean": round(vel_mean, 2),
            "payment_velocity_max": round(vel_max, 2),
            "payment_frequency_mean": round(freq_mean, 2),
            "payment_concentration_max": round(conc_max, 4),
            "duplicate_payment_count": dup_count,
            "duplicate_payment_rate": round(dup_rate, 4),
            "payment_timing_anomaly_count": timing_anomaly_cnt,
            "payment_timing_anomaly_rate": round(timing_anomaly_rate, 4),
            "unverified_payment_count": unverified_cnt,
            "unverified_payment_rate": round(unverified_rate, 4),
            "round_number_payment_count": round_num_cnt,
            "round_number_payment_rate": round_num_rate,
            "final_installment_count": final_count,
            "final_installment_amount": round(final_amt, 2),
            "final_installment_share": round(final_share, 4),
        })
        
    res_df = pd.DataFrame(records)
    return res_df


def aggregate_progress(progress_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregates temporal progress observations (1 to N rows per project)
    into project-level progress features (1 row per project).
    
    Extracts latest states, calculates time-aware slopes (rate of progress per day),
    and derives observation quality rates.
    """
    if progress_df.empty or "project_id" not in progress_df.columns:
        return pd.DataFrame(columns=["project_id"])
        
    df = progress_df.copy()
    
    # Identify date column
    date_col = "record_date" if "record_date" in df.columns else ("report_date" if "report_date" in df.columns else None)
    if date_col:
        df["record_date_dt"] = pd.to_datetime(df[date_col], errors="coerce")
    else:
        df["record_date_dt"] = pd.NaT
        
    # Sort chronologically per project
    df = df.sort_values(by=["project_id", "record_date_dt"])
    
    grouped = df.groupby("project_id", sort=True)
    
    records = []
    for project_id, group in grouped:
        obs_count = len(group)
        latest = group.iloc[-1]
        first = group.iloc[0]
        
        # Latest states
        latest_phys = float(latest.get("physical_progress", 0.0))
        latest_fin = float(latest.get("financial_progress", 0.0))
        latest_plan = float(latest.get("planned_progress", 0.0))
        latest_comp = float(latest.get("completion_percentage", latest_phys))
        
        # Mismatch and gaps
        latest_mismatch = float(latest.get("progress_mismatch", abs(latest_fin - latest_phys)))
        latest_gap = float(latest.get("progress_gap", latest.get("financial_physical_gap", latest_fin - latest_phys)))
        fin_minus_phys = float(latest_fin - latest_phys)
        actual_vs_plan = float(latest.get("actual_vs_planned_progress", latest_phys - latest_plan))
        
        # Time-aware trends (slopes per day)
        dates = group["record_date_dt"].dropna()
        if len(dates) > 1:
            span_days = max(1, (dates.max() - dates.min()).days)
            first_phys = float(first.get("physical_progress", 0.0))
            first_fin = float(first.get("financial_progress", 0.0))
            first_plan = float(first.get("planned_progress", 0.0))
            first_gap = float(first.get("progress_gap", first.get("financial_physical_gap", first_fin - first_phys)))
            
            phys_slope = (latest_phys - first_phys) / span_days
            fin_slope = (latest_fin - first_fin) / span_days
            plan_slope = (latest_plan - first_plan) / span_days
            gap_slope = (latest_gap - first_gap) / span_days
        else:
            # Single observation: use velocity if present, else zero slope
            phys_slope = float(latest.get("progress_velocity", 0.0))
            fin_slope = 0.0
            plan_slope = 0.0
            gap_slope = 0.0
            
        vel_latest = float(latest.get("progress_velocity", 0.0))
        acc_latest = float(latest.get("progress_acceleration", 0.0))
        
        # Delay and overrun
        latest_delay = float(latest.get("physical_progress_delay", 0.0))
        max_delay = float(group["physical_progress_delay"].max()) if "physical_progress_delay" in group.columns else latest_delay
        ext_count = int(group["extension_count"].max()) if "extension_count" in group.columns else 0
        
        planned_dur = float(latest.get("planned_duration_days", 0.0))
        actual_dur = float(latest.get("actual_duration_days", planned_dur))
        dur_overrun = max(0.0, actual_dur - planned_dur)
        dur_overrun_ratio = actual_dur / max(1.0, planned_dur)
        
        # Observation quality
        if "geo_tag_available" in group.columns:
            geotag_avail_rate = float(group["geo_tag_available"].astype(bool).mean())
        else:
            geotag_avail_rate = 1.0
            
        if "geo_tag_progress_consistency" in group.columns:
            geotag_cons_rate = float(group["geo_tag_progress_consistency"].astype(bool).mean())
        else:
            geotag_cons_rate = 1.0
            
        if "measurement_book_verified" in group.columns:
            mb_rate = float(group["measurement_book_verified"].astype(bool).mean())
        else:
            mb_rate = 1.0
            
        records.append({
            "project_id": project_id,
            "progress_observation_count": obs_count,
            "latest_physical_progress": round(latest_phys, 2),
            "latest_financial_progress": round(latest_fin, 2),
            "latest_planned_progress": round(latest_plan, 2),
            "latest_completion_percentage": round(latest_comp, 2),
            "latest_progress_mismatch": round(latest_mismatch, 2),
            "latest_progress_gap": round(latest_gap, 2),
            "financial_minus_physical_progress": round(fin_minus_phys, 2),
            "actual_vs_planned_progress": round(actual_vs_plan, 2),
            "physical_progress_slope": round(phys_slope, 4),
            "financial_progress_slope": round(fin_slope, 4),
            "planned_progress_slope": round(plan_slope, 4),
            "progress_gap_slope": round(gap_slope, 4),
            "progress_velocity_latest": round(vel_latest, 4),
            "progress_acceleration_latest": round(acc_latest, 4),
            "latest_delay_days": round(latest_delay, 2),
            "max_delay_days": round(max_delay, 2),
            "extension_count": ext_count,
            "planned_duration_days": planned_dur,
            "actual_duration_days": actual_dur,
            "duration_overrun_days": round(dur_overrun, 2),
            "duration_overrun_ratio": round(dur_overrun_ratio, 4),
            "geotag_available_rate": round(geotag_avail_rate, 4),
            "geotag_consistency_rate": round(geotag_cons_rate, 4),
            "measurement_book_verified_rate": round(mb_rate, 4),
        })
        
    res_df = pd.DataFrame(records)
    return res_df
