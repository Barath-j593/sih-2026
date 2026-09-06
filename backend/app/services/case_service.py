import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.case import Case
from app.models.work import Work
from app.schemas.case import CaseResponse, CaseCreate, CaseUpdateStatus, CaseAddNote

def _compute_risk_level(risk_score: float) -> str:
    if risk_score >= 80:
        return "Critical"
    elif risk_score >= 60:
        return "High"
    elif risk_score >= 40:
        return "Medium"
    else:
        return "Low"

def _enrich_case(case: Case, work: Optional[Work] = None) -> CaseResponse:
    amount = float(work.allocation_amount) if work and work.allocation_amount else 0.0
    risk_level = getattr(work, "risk_level", None) or _compute_risk_level(case.risk_score)
    data = {
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "description": case.description,
        "status": case.status,
        "priority": case.priority,
        "work_id": case.work_id,
        "mp_name": case.mp_name,
        "state": case.state,
        "district": case.district,
        "ida": case.ida,
        "risk_score": case.risk_score,
        "risk_level": risk_level,
        "amount": amount,
        "fraud_type": case.fraud_type,
        "assigned_to": case.assigned_to,
        "notes": case.notes or [],
        "created_at": case.created_at,
        "updated_at": case.updated_at,
    }
    return CaseResponse.model_validate(data)

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
    work_ids = [c.work_id for c in cases if c.work_id]
    works_map = {}
    if work_ids:
        works = db.query(Work).filter(Work.id.in_(work_ids)).all()
        works_map = {w.id: w for w in works}
    return [_enrich_case(c, works_map.get(c.work_id)) for c in cases]

def get_case_by_id(db: Session, case_id: str) -> Optional[CaseResponse]:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return None
    work = db.query(Work).filter(Work.id == case.work_id).first() if case.work_id else None
    return _enrich_case(case, work)

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
    now_utc = datetime.now(timezone.utc)
    case.updated_at = now_utc

    note_text = payload.note or f"Investigation status transitioned from '{old_status}' to '{payload.status}'"
    new_note = {
        "author": payload.author or "Investigating Officer",
        "text": note_text,
        "timestamp": now_utc.strftime("%Y-%m-%d %H:%M"),
        "status_change": payload.status
    }

    current_notes = list(case.notes or [])
    current_notes.append(new_note)
    case.notes = current_notes

    db.commit()
    db.refresh(case)
    work = db.query(Work).filter(Work.id == case.work_id).first() if case.work_id else None
    return _enrich_case(case, work)

def add_case_note(
    db: Session,
    case_id: str,
    payload: CaseAddNote
) -> Optional[CaseResponse]:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return None

    now_utc = datetime.now(timezone.utc)
    new_note = {
        "author": payload.author or "Investigating Officer",
        "text": payload.text,
        "timestamp": now_utc.strftime("%Y-%m-%d %H:%M"),
        "status_change": None
    }

    current_notes = list(case.notes or [])
    current_notes.append(new_note)
    case.notes = current_notes
    case.updated_at = now_utc

    db.commit()
    db.refresh(case)
    work = db.query(Work).filter(Work.id == case.work_id).first() if case.work_id else None
    return _enrich_case(case, work)

def create_case(db: Session, payload: CaseCreate) -> CaseResponse:
    count = db.query(Case).count()
    case_num = f"SETU-2026-CASE-{1001 + count}"
    now_utc = datetime.now(timezone.utc)
    
    init_note = {
        "author": "SETU System",
        "text": f"Case created for work {payload.work_id or 'Work'}.",
        "timestamp": now_utc.strftime("%Y-%m-%d %H:%M"),
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
    work = db.query(Work).filter(Work.id == case.work_id).first() if case.work_id else None
    return _enrich_case(case, work)
