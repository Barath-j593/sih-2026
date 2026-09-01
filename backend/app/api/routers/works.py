from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.work import WorkFilterParams, PaginatedWorksResponse, WorkResponse
from app.services.work_service import get_works_paginated, get_work_detail, get_filter_options

router = APIRouter(prefix="/works", tags=["Works"])

@router.get("", response_model=PaginatedWorksResponse)
def list_works(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    state: Optional[str] = None,
    constituency: Optional[str] = None,
    mp_name: Optional[str] = None,
    ida: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    min_risk_score: Optional[float] = None,
    max_risk_score: Optional[float] = None,
    fraud_type: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "risk_score",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db)
):
    params = WorkFilterParams(
        page=page,
        limit=limit,
        state=state,
        constituency=constituency,
        mp_name=mp_name,
        ida=ida,
        status=status,
        risk_level=risk_level,
        min_risk_score=min_risk_score,
        max_risk_score=max_risk_score,
        fraud_type=fraud_type,
        search=search,
        sort_by=sort_by or "risk_score",
        sort_order=sort_order or "desc"
    )
    return get_works_paginated(db=db, params=params)

@router.get("/filters")
def get_filters(db: Session = Depends(get_db)):
    return get_filter_options(db=db)

@router.get("/{work_id}")
def get_work(work_id: str, db: Session = Depends(get_db)):
    work = get_work_detail(db=db, work_id=work_id)
    if not work:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work with ID {work_id} not found"
        )
    return work
