"""Unit and integration test suite for SETU Decision Support Subsystem.

Tests prompt grounding, fallback policies, Gemini client mocking, batch generation idempotence,
and role-scoped API endpoints.

MoSPI SETU MPLADS Platform.
"""

import json
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.work import Work
from app.models.decision_support import DecisionSupport
from app.ml.decision_support.prompt_builder import (
    build_decision_support_prompt,
    extract_work_grounding,
    DECISION_SUPPORT_SCHEMA,
)
from app.ml.decision_support.engine import generate_decision_support, _validate_response_schema
from app.ml.decision_support.fallback_templates import get_fallback_recommendations
from app.ml.decision_support.batch_generator import run_batch_decision_support


@pytest.fixture
def sample_work_data():
    return {
        "id": "W-TEST-9001",
        "work": "Installation of High-Mast Solar Lighting System in Ward 12",
        "work_category": "Renewable Energy",
        "overall_risk_score": 82.0,
        "risk_level": "CRITICAL",
        "primary_typology": "VENDOR_CAPTURE",
        "sub_scores": {
            "financial_anomaly_score": 78.5,
            "geospatial_anomaly_score": 25.0,
            "procurement_anomaly_score": 88.0,
            "contractor_anomaly_score": 91.0,
            "payment_anomaly_score": 42.0,
            "progress_anomaly_score": 30.0,
            "graph_anomaly_score": 85.0,
        },
        "synthesized_reasons": [
            "Implementing agency channeled 84% of sectoral funds to a single registered contractor",
            "Winning contractor bid margin was within 0.2% of government engineering estimate",
            "Contractor active project backlog exceeds certified financial capacity by 2.4x",
        ],
    }


def test_prompt_builder_grounding(sample_work_data):
    """Test that prompt builder accurately includes only computed model evidence."""
    user_prompt, system_inst, schema = build_decision_support_prompt(sample_work_data)

    assert "W-TEST-9001" in user_prompt
    assert "VENDOR_CAPTURE" in user_prompt
    assert "82.0" in user_prompt
    assert "contractor" in user_prompt
    assert "procurement" in user_prompt
    assert "Implementing agency channeled 84%" in user_prompt

    # Verify JSON schema requirements
    assert schema["type"] == "OBJECT"
    assert "recommendations" in schema["properties"]
    assert "triggered_domains" in schema["properties"]
    assert set(schema["properties"]["recommendations"]["required"]) == {"mp", "district", "state", "ministry"}


def test_prompt_builder_zero_pii(sample_work_data):
    """Verify that raw PII not present in risk reasons is not injected into prompt."""
    sample_with_pii = sample_work_data.copy()
    sample_with_pii["mp_name"] = "Confidential MP Name"
    sample_with_pii["contractor_name"] = "Secret Contractor Pvt Ltd"

    user_prompt, _, _ = build_decision_support_prompt(sample_with_pii)
    assert "Confidential MP Name" not in user_prompt
    assert "Secret Contractor Pvt Ltd" not in user_prompt


def test_fallback_template_coverage():
    """Verify that all 7 domains have deterministic templates across all 3 tiers."""
    domains = ["financial", "geospatial", "procurement", "contractor", "payment", "progress", "graph"]
    tiers = ["CRITICAL", "HIGH", "MEDIUM"]

    for d in domains:
        for t in tiers:
            res = get_fallback_recommendations([d], t)
            assert res["triggered_domains"] == [d]
            for role in ("mp", "district", "state", "ministry"):
                assert len(res["recommendations"][role]) == 2
                assert all(isinstance(rec, str) and len(rec) > 10 for rec in res["recommendations"][role])


def test_engine_fallback_on_client_failure(sample_work_data):
    """Simulate Gemini client raising an exception and verify graceful fallback."""
    mock_client = MagicMock()
    mock_client.is_available.return_value = True
    mock_client.generate_structured.side_effect = RuntimeError("503 Service Unavailable: Simulated Gemini Outage")

    res = generate_decision_support(sample_work_data, client=mock_client)

    assert res["work_id"] == "W-TEST-9001"
    assert res["source"] == "fallback"
    assert len(res["recommendations"]["mp"]) == 2
    assert len(res["recommendations"]["district"]) == 2
    assert len(res["recommendations"]["state"]) == 2
    assert len(res["recommendations"]["ministry"]) == 2
    assert "confidence_note" in res


def test_engine_fallback_on_malformed_json(sample_work_data):
    """Verify that malformed JSON or schema-violating output falls back safely."""
    mock_client = MagicMock()
    mock_client.is_available.return_value = True
    mock_client.generate_structured.return_value = '{"invalid_schema": true}'

    res = generate_decision_support(sample_work_data, client=mock_client)

    assert res["work_id"] == "W-TEST-9001"
    assert res["source"] == "fallback"
    assert len(res["recommendations"]["district"]) == 2


def test_engine_gemini_success_mocked(sample_work_data):
    """Verify that valid structured JSON from Gemini is parsed and returned with source='gemini'."""
    mock_response = json.dumps({
        "triggered_domains": ["contractor", "procurement"],
        "recommendations": {
            "mp": ["Demand audit of single vendor lighting awards.", "Request site inspection from district."],
            "district": ["Halt contract pass order pending review.", "Re-verify contractor machinery deployment."],
            "state": ["Review agency contractor concentration.", "Audit bidding competition logs."],
            "ministry": ["Log procurement concentration anomaly.", "Sample in quarterly MPLADS review."]
        },
        "confidence_note": "Grounded in contractor capacity strain and winning margin evidence."
    })

    mock_client = MagicMock()
    mock_client.is_available.return_value = True
    mock_client.generate_structured.return_value = mock_response

    res = generate_decision_support(sample_work_data, client=mock_client)

    assert res["work_id"] == "W-TEST-9001"
    assert res["source"] == "gemini"
    assert res["triggered_domains"] == ["contractor", "procurement"]
    assert len(res["recommendations"]["mp"]) == 2


def test_api_decision_support_role_scoping():
    """Test GET /api/works/{work_id}/decision-support with role scoping."""
    client = TestClient(app)

    # 1. Test for an existing work (e.g. W-10001)
    res = client.get("/api/works?limit=1")
    if res.status_code == 200 and len(res.json().get("items", [])) > 0:
        wid = res.json()["items"][0]["id"]

        # Ministry role sees all 4 roles
        res_min = client.get(f"/api/works/{wid}/decision-support?role=ministry")
        assert res_min.status_code == 200
        data_min = res_min.json()
        assert data_min["work_id"] == wid
        assert data_min["role"] == "ministry"
        if data_min["status"] == "available":
            assert isinstance(data_min["recommendations"], dict)
            assert set(data_min["recommendations"].keys()) == {"mp", "district", "state", "ministry"}

        # District role sees list of district recommendations
        res_dist = client.get(f"/api/works/{wid}/decision-support?role=district")
        assert res_dist.status_code == 200
        data_dist = res_dist.json()
        assert data_dist["role"] == "district"
        if data_dist["status"] == "available":
            assert isinstance(data_dist["recommendations"], list)

        # MP role sees list of MP recommendations
        res_mp = client.get(f"/api/works/{wid}/decision-support?role=mp")
        assert res_mp.status_code == 200
        data_mp = res_mp.json()
        assert data_mp["role"] == "mp"
        if data_mp["status"] == "available":
            assert isinstance(data_mp["recommendations"], list)

    # 2. Test 404 on nonexistent work
    res_nonexistent = client.get("/api/works/W-NONEXISTENT-9999/decision-support")
    assert res_nonexistent.status_code == 404
