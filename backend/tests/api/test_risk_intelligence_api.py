"""Integration tests for SETU Risk Intelligence FastAPI Endpoints.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_get_risk_summary(client: TestClient):
    """Test /api/risk-intelligence/summary endpoint."""
    response = client.get("/api/risk-intelligence/summary")
    assert response.status_code == 200
    data = response.json()
    assert "risk_tier_distribution" in data
    assert "investigation_priority_distribution" in data
    assert data["total_projects_evaluated"] == 5000
    assert data["risk_tier_distribution"]["CRITICAL"] > 0
    assert data["risk_tier_distribution"]["LOW"] > 0


def test_list_fused_projects_pagination(client: TestClient):
    """Test /api/risk-intelligence/projects with pagination."""
    response = client.get("/api/risk-intelligence/projects?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5000
    assert data["page"] == 1
    assert data["limit"] == 10
    assert len(data["items"]) == 10

    item = data["items"][0]
    assert "project_id" in item
    assert "overall_risk_score" in item
    assert "risk_level" in item
    assert "investigation_priority" in item
    assert "domain_scores" in item


def test_list_fused_projects_filtering(client: TestClient):
    """Test /api/risk-intelligence/projects with risk_level and typology filter."""
    response = client.get("/api/risk-intelligence/projects?risk_level=CRITICAL&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["items"]:
        assert item["risk_level"] == "CRITICAL"
        assert item["investigation_priority"] == "IMMEDIATE"


def test_get_project_risk_detail_success(client: TestClient):
    """Test /api/risk-intelligence/projects/{project_id} for a valid project."""
    response = client.get("/api/risk-intelligence/projects/MPLADS-000010")
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "MPLADS-000010"
    assert data["overall_risk_score"] >= 80.0
    assert data["risk_level"] == "CRITICAL"
    assert "domain_scores" in data
    assert len(data["domain_scores"]) == 7
    assert len(data["synthesized_reasons"]) > 0


def test_get_project_risk_detail_not_found(client: TestClient):
    """Test /api/risk-intelligence/projects/{project_id} for an invalid project."""
    response = client.get("/api/risk-intelligence/projects/NONEXISTENT-PROJECT")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_live_fuse_signals(client: TestClient):
    """Test /api/risk-intelligence/fuse interactive simulation endpoint."""
    payload = {
        "project_id": "SIMULATION-TEST-001",
        "financial_anomaly_score": 90.0,
        "geospatial_anomaly_score": 15.0,
        "procurement_anomaly_score": 85.0,
        "contractor_anomaly_score": 60.0,
        "payment_anomaly_score": 80.0,
        "progress_anomaly_score": 95.0,
        "graph_anomaly_score": 40.0,
        "fraud_probability": 0.95,
        "predicted_typology": "GHOST_WORK",
    }
    response = client.post("/api/risk-intelligence/fuse", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "SIMULATION-TEST-001"
    assert data["overall_risk_score"] >= 80.0
    assert data["risk_level"] == "CRITICAL"
    assert data["investigation_priority"] == "IMMEDIATE"
    assert len(data["synthesized_reasons"]) > 0


def test_list_available_audit_reports(client: TestClient):
    """Test /api/risk-intelligence/reports list endpoint."""
    response = client.get("/api/risk-intelligence/reports")
    assert response.status_code == 200
    data = response.json()
    assert data["total_reports"] >= 8
    report_names = [r["report_name"] for r in data["reports"]]
    assert "RISK_FUSION_REPORT" in report_names
    assert "SUPERVISED_MODEL_REPORT" in report_names


def test_get_audit_report_content(client: TestClient):
    """Test /api/risk-intelligence/reports/{report_name} detail endpoint."""
    response = client.get("/api/risk-intelligence/reports/RISK_FUSION_REPORT")
    assert response.status_code == 200
    data = response.json()
    assert "RISK_FUSION_REPORT" in data["report_name"]
    assert "Administrative Risk Tier Breakdown" in data["content"]
