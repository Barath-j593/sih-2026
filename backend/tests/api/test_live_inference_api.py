"""Tests for Live Proposal Scoring API and In-Memory Inference Service.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from fastapi.testclient import TestClient
import pytest

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_score_proposal_normal_project(client):
    """Test standard normal proposal receives low risk score and automated clearance."""
    payload = {
        "work_name": "Installation of 50 Solar Street Lights",
        "category": "Drinking Water & Sanitation",
        "state": "Bihar",
        "constituency": "Darbhanga",
        "sanctioned_amount": 1200000.0,
        "planned_duration_days": 120,
        "num_bidders": 4,
        "is_single_bid": False,
        "contractor_past_delays": 0,
    }
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "proposal_id" in data
    assert data["risk_level"] in ["LOW", "MEDIUM"]
    assert data["approval_recommendation"] in ["AUTOMATIC_CLEARANCE", "CONDITIONAL_APPROVAL"]
    assert "sub_scores" in data
    assert "financial" in data["sub_scores"]
    assert "geospatial" in data["sub_scores"]
    assert "procurement" in data["sub_scores"]
    assert "contractor" in data["sub_scores"]
    assert "payment" in data["sub_scores"]
    assert "progress" in data["sub_scores"]
    assert "graph" in data["sub_scores"]
    assert "ml_fraud_probability" in data["sub_scores"]
    assert data["inference_time_ms"] > 0.0


def test_score_proposal_anomalous_attributes(client):
    """Test proposal with single-bid and heavy contractor delays produces elevated risk."""
    payload = {
        "work_name": "Mega Highway Widening Package IV",
        "category": "Roads & Bridges",
        "state": "Bihar",
        "constituency": "Darbhanga",
        "sanctioned_amount": 95000000.0,
        "planned_duration_days": 1200,
        "num_bidders": 1,
        "is_single_bid": True,
        "contractor_past_delays": 8,
    }
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["overall_risk_score"] >= 0.0
    assert len(data["synthesized_reasons"]) > 0
    assert data["primary_reason"] != ""
    assert data["approval_recommendation"] in [
        "AUTOMATIC_CLEARANCE",
        "CONDITIONAL_APPROVAL",
        "MANDATORY_TECHNICAL_AUDIT",
        "REJECT_AND_INVESTIGATE",
    ]


def test_score_proposal_minimal_payload(client):
    """Test proposal scoring with only required / bare minimum fields."""
    payload = {
        "work_name": "Gram Panchayat Community Shed",
    }
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "proposal_id" in data
    assert 0.0 <= data["overall_risk_score"] <= 100.0
