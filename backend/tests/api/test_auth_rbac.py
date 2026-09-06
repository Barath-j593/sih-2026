"""Tests for Authentication & Role-Based Access Control (RBAC).

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from fastapi.testclient import TestClient
import pytest

from app.core.security import create_access_token
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_unauthenticated_me_returns_401(client):
    """Calling /api/auth/me without Bearer token must return 401 Unauthorized."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert "Authentication credentials were not provided" in response.json()["detail"]


def test_authenticated_me_returns_user_profile(client):
    """Calling /api/auth/me with valid Bearer token returns User profile."""
    # Login as ministry admin
    login_res = client.post(
        "/api/auth/login",
        json={"username": "ministry_admin", "password": "ministry123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["username"] == "ministry_admin"
    assert user_data["role"] == "ministry"
    assert user_data["jurisdiction"] == "National"


def test_cases_rbac_unauthenticated_mutation(client):
    """Case creation without auth header must return 401 Unauthorized."""
    payload = {
        "title": "Unauthenticated Investigation Case",
        "description": "Attempting to create case without token",
        "work_id": "MPLADS-000001",
    }
    response = client.post("/api/cases", json=payload)
    assert response.status_code == 401


def test_cases_rbac_forbidden_for_mp_role(client):
    """MP role cannot create an investigation case (returns 403 Forbidden)."""
    mp_token = create_access_token(subject="usr-mp-gopal", role="mp", jurisdiction="Mr Gopal Jee Thakur")
    payload = {
        "title": "Unauthorized Case By MP",
        "description": "MP attempting vigilance creation",
        "work_id": "MPLADS-000001",
    }
    response = client.post(
        "/api/cases",
        json=payload,
        headers={"Authorization": f"Bearer {mp_token}"},
    )
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_cases_rbac_allowed_for_ministry_role(client):
    """Ministry admin role can create an investigation case (returns 200 OK)."""
    min_token = create_access_token(subject="usr-ministry", role="ministry", jurisdiction="National")
    payload = {
        "title": "Vigilance Case Authorized by Ministry",
        "description": "Formal multi-signal investigation file",
        "work_id": "MPLADS-000001",
        "priority": "critical",
    }
    response = client.post(
        "/api/cases",
        json=payload,
        headers={"Authorization": f"Bearer {min_token}"},
    )
    assert response.status_code == 200
    case_data = response.json()
    assert "id" in case_data
    assert case_data["priority"] == "critical"
