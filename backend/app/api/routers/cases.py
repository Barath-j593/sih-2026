from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User
from app.schemas.case import CaseResponse, CaseCreate, CaseUpdateStatus, CaseAddNote
from app.services.case_service import (
    get_cases, get_case_by_id, update_case_status,
    add_case_note, create_case
)

router = APIRouter(prefix="/cases", tags=["Case Management"])

@router.get("", response_model=List[CaseResponse])
def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(100, le=300),
    db: Session = Depends(get_db)
):
    return get_cases(db=db, status=status, priority=priority, limit=limit)

@router.get("/{case_id}", response_model=CaseResponse)
def get_single_case(case_id: str, db: Session = Depends(get_db)):
    case = get_case_by_id(db=db, case_id=case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case {case_id} not found"
        )
    return case

@router.post("", response_model=CaseResponse)
def new_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ministry", "state", "district"]))
):
    return create_case(db=db, payload=payload)

@router.patch("/{case_id}/status", response_model=CaseResponse)
def patch_status(
    case_id: str,
    payload: CaseUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ministry", "state", "district"]))
):
    updated = update_case_status(db=db, case_id=case_id, payload=payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case {case_id} not found"
        )
    return updated

@router.post("/{case_id}/notes", response_model=CaseResponse)
def append_note(
    case_id: str,
    payload: CaseAddNote,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ministry", "state", "district", "mp"]))
):
    updated = add_case_note(db=db, case_id=case_id, payload=payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case {case_id} not found"
        )
    return updated
