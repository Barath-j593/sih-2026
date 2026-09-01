import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.case import Case
from app.schemas.case import CaseResponse, CaseCreate, CaseUpdateStatus, CaseAddNote

def get_cases(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 100
) -> List[CaseResponse]:
    query = db.query(Case)
    if status:
        query = query.filter(func.lower(Case.status) == status.lower())
    if priority:
        query = query.filter(func.lower(Case.priority) == priority.lower())
    
    cases = query.order_by(desc(Case.updated_at)).limit(limit).all()
    return [CaseResponse.from_orm(c) for c in cases]

def get_case_by_id(db: Session, case_id: str) -> Optional[CaseResponse]:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return None
    return CaseResponse.from_orm(case)

def update_case_status(
    db: Session,
    case_id: str,
    payload: CaseUpdateStatus
) -> Optional[CaseResponse]:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return None

    old_status = case.status
    case.status = payload.status
    case.updated_at = datetime.utcnow()

    note_text = payload.note or f"Investigation status transitioned from '{old_status}' to '{payload.status}'"
    new_note = {
        "author": payload.author or "Investigating Officer",
        "text": note_text,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "status_change": payload.status
    }

    current_notes = list(case.notes or [])
    current_notes.append(new_note)
    case.notes = current_notes

    db.commit()
    db.refresh(case)
    return CaseResponse.from_orm(case)

def add_case_note(
    db: Session,
    case_id: str,
    payload: CaseAddNote
) -> Optional[CaseResponse]:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return None

    new_note = {
        "author": payload.author or "Investigating Officer",
        "text": payload.text,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "status_change": None
    }

    current_notes = list(case.notes or [])
    current_notes.append(new_note)
    case.notes = current_notes
    case.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(case)
    return CaseResponse.from_orm(case)

def create_case(db: Session, payload: CaseCreate) -> CaseResponse:
    count = db.query(Case).count()
    case_num = f"SETU-2026-CASE-{1001 + count}"
    
    init_note = {
        "author": "SETU System",
        "text": f"Case created for work {payload.work_id or 'Work'}.",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "status_change": "flagged"
    }

    case = Case(
        id=f"CASE-{str(uuid.uuid4())[:8]}",
        case_number=case_num,
        title=payload.title,
        description=payload.description,
        status="flagged",
        priority=payload.priority or "high",
        work_id=payload.work_id,
        mp_name=payload.mp_name,
        state=payload.state,
        district=payload.district,
        ida=payload.ida,
        risk_score=payload.risk_score,
        fraud_type=payload.fraud_type,
        assigned_to=payload.assigned_to or "District Vigilance Cell",
        notes=[init_note]
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return CaseResponse.from_orm(case)
