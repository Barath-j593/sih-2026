import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_cartel_conduits_endpoint():
    res = client.get("/api/geo/cartel-conduits?min_risk=40.0")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first = data[0]
        assert "agency_name" in first
        assert "source_constituency" in first
        assert "target_constituency" in first
        assert "total_capital" in first
        assert "avg_risk" in first
        assert "risk_level" in first

def test_temporal_risk_endpoint():
    res = client.get("/api/geo/temporal-risk")
    assert res.status_code == 200
    data = res.json()
    assert "months" in data
    assert "timeline" in data
    assert len(data["months"]) >= 3
    # Verify March 2024 surge
    if "2024-03" in data["timeline"]:
        mar = data["timeline"]["2024-03"]
        assert mar["is_surge"] is True
        assert mar["total_works"] > 0
        assert "constituencies" in mar
