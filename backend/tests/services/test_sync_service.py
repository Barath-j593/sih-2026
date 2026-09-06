"""Tests for Database Synchronization Pipeline and Entity Aggregations.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

import pytest
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.alert import Alert
from app.models.case import Case
from app.models.constituency import Constituency
from app.models.ida import IDA
from app.models.mp import MP
from app.models.user import User
from app.models.work import Work
from app.services.sync_service import sync_fused_risk_to_database


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


def test_database_sync_records_and_aggregates(db_session: Session):
    """Test that the 5,000 national works, alerts, cases, and demo users are present and correctly populated."""
    # Ensure database is synchronized
    work_count = db_session.query(Work).count()
    if work_count < 5000:
        res = sync_fused_risk_to_database(db_session, force=True)
        assert res["works_synced"] == 5000

    # 1. Works verification
    assert db_session.query(Work).count() == 5000
    sample_work = db_session.query(Work).filter(Work.id == "MPLADS-000001").first()
    assert sample_work is not None
    assert 0.0 <= sample_work.risk_score <= 100.0
    assert sample_work.risk_level in ["Critical", "High", "Medium", "Low"]
    assert isinstance(sample_work.sub_scores, dict)
    assert "financial" in sample_work.sub_scores
    assert "ml_fraud_probability" in sample_work.sub_scores

    # 2. Alerts verification
    alert_count = db_session.query(Alert).count()
    assert alert_count > 800  # 906 high & critical alerts

    # 3. Cases verification
    case_count = db_session.query(Case).count()
    assert case_count >= 30

    # 4. MPs and IDAs verification
    mp_count = db_session.query(MP).count()
    ida_count = db_session.query(IDA).count()
    assert mp_count > 0
    assert ida_count > 0

    # 5. Demo users verification
    demo_users = db_session.query(User).all()
    usernames = [u.username for u in demo_users]
    assert "ministry_admin" in usernames
    assert "district_darbhanga" in usernames
