"""
test_aggregators.py - Unit tests for payment and progress transaction aggregators.
"""

import pytest
import pandas as pd
import numpy as np
from app.ml.data.aggregators import aggregate_payments, aggregate_progress


def test_payment_aggregation_deterministic_fixture():
    """Test payment aggregation formulas against a deterministic fixture."""
    fixture_data = pd.DataFrame([
        {
            "payment_id": "P1-1",
            "project_id": "PROJ-1",
            "payment_amount": 1000.0,
            "payment_date": "2023-01-01",
            "payment_velocity": 50.0,
            "payment_frequency": 30.0,
            "payment_concentration": 0.333,
            "is_round_number": 1,
            "is_final_installment": 0,
            "duplicate_payment_flag": 0,
            "payment_timing_anomaly": 0,
            "measurement_book_verified": True,
        },
        {
            "payment_id": "P1-2",
            "project_id": "PROJ-1",
            "payment_amount": 2000.0,
            "payment_date": "2023-01-31",
            "payment_velocity": 60.0,
            "payment_frequency": 30.0,
            "payment_concentration": 0.667,
            "is_round_number": 0,
            "is_final_installment": 1,
            "duplicate_payment_flag": 1,
            "payment_timing_anomaly": 1,
            "measurement_book_verified": False,
        },
        {
            "payment_id": "P2-1",
            "project_id": "PROJ-2",
            "payment_amount": 500.0,
            "payment_date": "2023-06-01",
            "payment_velocity": 20.0,
            "payment_frequency": 0.0,
            "payment_concentration": 1.0,
            "is_round_number": 1,
            "is_final_installment": 1,
            "duplicate_payment_flag": 0,
            "payment_timing_anomaly": 0,
            "measurement_book_verified": True,
        },
    ])
    
    agg = aggregate_payments(fixture_data)
    
    assert len(agg) == 2  # 2 unique projects
    assert set(agg["project_id"]) == {"PROJ-1", "PROJ-2"}
    
    # PROJ-1 assertions
    p1 = agg[agg["project_id"] == "PROJ-1"].iloc[0]
    assert p1["payment_count"] == 2
    assert p1["total_paid"] == 3000.0
    assert p1["average_payment"] == 1500.0
    assert p1["min_payment"] == 1000.0
    assert p1["max_payment"] == 2000.0
    assert p1["payment_span_days"] == 30
    assert p1["average_days_between_payments"] == 30.0
    assert p1["duplicate_payment_count"] == 1
    assert p1["duplicate_payment_rate"] == 0.5
    assert p1["payment_timing_anomaly_count"] == 1
    assert p1["payment_timing_anomaly_rate"] == 0.5
    assert p1["unverified_payment_count"] == 1
    assert p1["unverified_payment_rate"] == 0.5
    assert p1["final_installment_count"] == 1
    assert p1["final_installment_amount"] == 2000.0
    assert p1["final_installment_share"] == pytest.approx(0.6667, rel=1e-2)
    
    # PROJ-2 assertions (single observation edge case)
    p2 = agg[agg["project_id"] == "PROJ-2"].iloc[0]
    assert p2["payment_count"] == 1
    assert p2["total_paid"] == 500.0
    assert p2["payment_span_days"] == 0
    assert p2["average_days_between_payments"] == 0.0
    assert p2["duplicate_payment_count"] == 0
    assert p2["duplicate_payment_rate"] == 0.0


def test_progress_aggregation_chronological_ordering():
    """Test progress observation ordering and slope calculation across irregular intervals."""
    # Shuffled input order
    fixture_data = pd.DataFrame([
        {
            "progress_id": "PR-2",
            "project_id": "PROJ-1",
            "record_date": "2023-03-01",
            "physical_progress": 80.0,
            "financial_progress": 90.0,
            "planned_progress": 85.0,
            "completion_percentage": 80.0,
            "physical_progress_delay": 10.0,
            "progress_mismatch": 10.0,
            "progress_gap": 10.0,
            "progress_velocity": 0.5,
            "progress_acceleration": 0.01,
            "planned_duration_days": 100,
            "actual_duration_days": 120,
            "extension_count": 1,
            "geo_tag_available": True,
            "geo_tag_progress_consistency": 1,
            "measurement_book_verified": True,
        },
        {
            "progress_id": "PR-1",
            "project_id": "PROJ-1",
            "record_date": "2023-01-01",
            "physical_progress": 20.0,
            "financial_progress": 30.0,
            "planned_progress": 25.0,
            "completion_percentage": 20.0,
            "physical_progress_delay": 0.0,
            "progress_mismatch": 10.0,
            "progress_gap": 10.0,
            "progress_velocity": 0.3,
            "progress_acceleration": 0.02,
            "planned_duration_days": 100,
            "actual_duration_days": 100,
            "extension_count": 0,
            "geo_tag_available": True,
            "geo_tag_progress_consistency": 1,
            "measurement_book_verified": True,
        },
    ])
    
    agg = aggregate_progress(fixture_data)
    assert len(agg) == 1
    p1 = agg.iloc[0]
    
    # Latest observation selected from PR-2 (2023-03-01)
    assert p1["progress_observation_count"] == 2
    assert p1["latest_physical_progress"] == 80.0
    assert p1["latest_financial_progress"] == 90.0
    assert p1["latest_delay_days"] == 10.0
    assert p1["max_delay_days"] == 10.0
    assert p1["extension_count"] == 1
    assert p1["duration_overrun_days"] == 20.0
    assert p1["duration_overrun_ratio"] == 1.2
    
    # Slopes: change in progress (80 - 20 = 60) over 59 days = 1.0169 %/day
    assert p1["physical_progress_slope"] == pytest.approx(60.0 / 59.0, rel=1e-2)
