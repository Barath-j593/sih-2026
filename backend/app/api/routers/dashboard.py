from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import get_role_scoped_dashboard

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard_data(
    role: str = Query("ministry", description="User role: ministry, state, district, or mp"),
    jurisdiction: Optional[str] = Query(None, description="Jurisdiction scope (e.g. Bihar, DARBHANGA, MP name)"),
    db: Session = Depends(get_db)
):
    return get_role_scoped_dashboard(db=db, role=role, jurisdiction=jurisdiction)
