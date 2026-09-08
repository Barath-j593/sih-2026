"""Automated Live Gemini API Integration Test Suite.

Validates that:
1. Live API responses are received from Google Gemini using the configured API key.
2. Structured decision support adheres strictly to DECISION_SUPPORT_SCHEMA.
3. Role scoping operates as expected across MP, District, State, and Ministry roles.
4. Recommendations generated across distinct projects are non-redundant and differentiated.
5. FastAPI endpoint /api/works/{id}/decision-support returns live 'gemini' source.

MoSPI SETU MPLADS Platform.
"""

import json
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.ml.decision_support.gemini_client import GeminiDecisionSupportClient
from app.ml.decision_support.prompt_builder import (
    build_decision_support_prompt,
    extract_work_grounding,
    DECISION_SUPPORT_SCHEMA,
    SYSTEM_INSTRUCTION,
)
from app.ml.decision_support.engine import generate_decision_support, _validate_response_schema
from app.main import app

client = TestClient(app)


@pytest.fixture
def gemini_client():
    return GeminiDecisionSupportClient()


@pytest.fixture
def sample_procurement_work():
    return {
        "id": "MPLADS-TEST-PROC",
        "work": "Procurement of High-Capacity Medical Waste Incinerators for Sub-Divisional Hospital",
        "work_category": "Health Infrastructure",
        "allocation_amount": 75.0,
        "status": "Tender Finalized",
        "days_since_recommended": 120,
        "constituency": "Varanasi",
        "state": "Uttar Pradesh",
        "ida": "District Health Society Varanasi",
        "overall_risk_score": 84.5,
        "risk_level": "CRITICAL",
        "predicted_fraud_type": "vendor_capture",
        "sub_scores": {
            "financial": 45.0,
            "geospatial": 15.0,
            "procurement": 92.5,
            "contractor": 89.0,
            "payment": 30.0,
            "progress": 25.0,
            "graph": 87.0,
        },
        "synthesized_reasons": [
            "Single-bid tender awarded with zero competitive bidding variance",
            "Winning vendor captured 88% of district medical supply tenders in current fiscal year",
            "Contractor registered address is co-located with non-operational holding entity",
        ],
    }


@pytest.fixture
def sample_delay_payment_work():
    return {
        "id": "MPLADS-TEST-DELAY",
        "work": "Widening and Bituminous Macadam Surfacing of Major District Road MDR-44",
        "work_category": "Roads & Bridges",
        "allocation_amount": 120.0,
        "status": "In Progress",
        "days_since_recommended": 480,
        "constituency": "Darbhanga",
        "state": "Bihar",
        "ida": "Rural Works Department (RWD) Darbhanga",
        "overall_risk_score": 81.0,
        "risk_level": "CRITICAL",
        "predicted_fraud_type": "delayed_work",
        "sub_scores": {
            "financial": 68.0,
            "geospatial": 20.0,
            "procurement": 15.0,
            "contractor": 40.0,
            "payment": 86.5,
            "progress": 88.0,
            "graph": 22.0,
        },
        "synthesized_reasons": [
            "Physical progress certified at 32% while 94% of sanctioned funds have been disbursed",
            "Work stalled for 210 consecutive days with unverified Measurement Book records",
            "Third-party technical quality verification has not been recorded since inception",
        ],
    }


def test_live_gemini_api_key_connection(gemini_client):
    """Verify live connectivity to Gemini API using configured key."""
    assert gemini_client.is_available(), "Gemini client must have an active API key and library configured"
    
    # Generate structured output using minimal prompt
    raw_response = gemini_client.generate_structured(
        contents="Project Reference: MPLADS-TEST-CONN\nRisk: 75.0\nTypology: cost_overrun\nDomain: financial",
        system_instruction=SYSTEM_INSTRUCTION,
        response_schema=DECISION_SUPPORT_SCHEMA,
    )
    assert raw_response is not None and len(raw_response) > 0, "Response must not be empty"
    data = json.loads(raw_response)
    assert "recommendations" in data
    assert "triggered_domains" in data


def test_live_gemini_response_schema_conformance(sample_procurement_work):
    """Verify that live Gemini response adheres strictly to the decision support schema."""
    result = generate_decision_support(sample_procurement_work)
    
    # Must be generated from live Gemini
    assert result["source"] == "gemini", f"Expected 'gemini' source but got '{result.get('source')}'"
    assert "procurement" in result["triggered_domains"] or "contractor" in result["triggered_domains"]
    
    recs = result["recommendations"]
    for role in ("mp", "district", "state", "ministry"):
        assert role in recs, f"Role '{role}' missing in recommendations"
        assert isinstance(recs[role], list), f"Recommendations for '{role}' must be a list"
        assert len(recs[role]) == 2, f"Expected exactly 2 recommendations for '{role}', got {len(recs[role])}"
        for item in recs[role]:
            assert isinstance(item, str) and len(item) > 15, f"Directive must be a descriptive string: {item}"

    assert len(result["confidence_note"]) > 10, "Confidence note must be populated"


def test_live_decision_support_diversity_across_projects(sample_procurement_work, sample_delay_payment_work):
    """Verify that distinct projects receive distinct, non-redundant directives from Gemini."""
    res_proc = generate_decision_support(sample_procurement_work)
    res_delay = generate_decision_support(sample_delay_payment_work)
    
    assert res_proc["source"] == "gemini"
    assert res_delay["source"] == "gemini"

    # The triggered domains must reflect the distinct project models
    assert set(res_proc["triggered_domains"]) != set(res_delay["triggered_domains"])
    
    # The generated district directives must not be identical copies
    district_proc = res_proc["recommendations"]["district"]
    district_delay = res_delay["recommendations"]["district"]
    assert district_proc != district_delay, "Directives across distinct projects must not be identical copies"
    
    # Check that procurement recommendations reference procurement/tender/vendor context
    proc_text = " ".join(district_proc).lower()
    delay_text = " ".join(district_delay).lower()
    assert any(term in proc_text for term in ("tender", "vendor", "bid", "contractor", "procurement", "cvc", "award"))
    assert any(term in delay_text for term in ("progress", "disbursement", "measurement", "physical", "delay", "fund", "milestone"))


def test_live_decision_support_api_endpoint():
    """Verify the live FastAPI endpoint returns 200 with 'gemini' source for elevated work."""
    response = client.get("/api/works/MPLADS-000010/decision-support?role=district")
    assert response.status_code == 200
    data = response.json()
    assert data["work_id"] == "MPLADS-000010"
    assert data["status"] == "available"
    assert data["source"] == "gemini", f"Expected live 'gemini' source from API, got '{data.get('source')}'"
    assert isinstance(data["recommendations"], list)
    assert len(data["recommendations"]) == 2
