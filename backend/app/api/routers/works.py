from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.work import Work
from app.models.decision_support import DecisionSupport
from app.schemas.work import WorkFilterParams, PaginatedWorksResponse, WorkResponse
from app.services.work_service import get_works_paginated, get_work_detail, get_filter_options

router = APIRouter(prefix="/works", tags=["Works"])

@router.get("", response_model=PaginatedWorksResponse)
def list_works(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = None,
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
        category=category,
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


@router.get("/{work_id}/decision-support")
def get_work_decision_support(
    work_id: str,
    role: Optional[str] = Query(None, description="Requesting role: ministry, state, district, or mp"),
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Retrieve grounded role-scoped decision support recommendations for a work.

    Returns tailored recommendations for the requesting role (ministry sees all four roles).
    If no decision support entry exists (e.g. Low risk work), returns not_applicable status.
    """
    from app.models.decision_support import DecisionSupport
    from app.core.security import decode_access_token

    # Resolve requesting role from token or query param (defaulting to ministry if unspecified)
    effective_role = "ministry"
    if token:
        payload = decode_access_token(token)
        if payload and "role" in payload:
            effective_role = str(payload["role"]).lower()
    if role:
        effective_role = role.lower()

    # Find work
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work {work_id} not found"
        )

    # Check for stored decision support row
    ds = db.query(DecisionSupport).filter(DecisionSupport.work_id == work_id).first()

    # If fallback exists but API key is now configured, or if no row exists yet for an elevated work:
    is_elevated = (
        (work.risk_score is not None and float(work.risk_score) >= 40.0) or
        (work.risk_level and str(work.risk_level).upper() in ("MEDIUM", "HIGH", "CRITICAL"))
    )

    if not ds and is_elevated:
        # Dynamically generate on-demand using Gemini / Decision Support engine!
        import uuid
        from datetime import datetime, timezone
        from app.ml.decision_support import generate_decision_support

        work_dict = {
            "id": work.id,
            "work": work.work,
            "work_title": work.work,
            "work_category": work.category or "General",
            "category": work.category or "General",
            "allocation_amount": float(work.allocation_amount or 0.0),
            "status": work.status or "Unsanctioned",
            "days_since_recommended": int(work.days_since_recommended or 0),
            "constituency": work.constituency or "",
            "state": work.state or "",
            "ida": work.ida or "",
            "overall_risk_score": float(work.risk_score or 0.0),
            "risk_level": str(work.risk_level or "MEDIUM").upper(),
            "primary_typology": getattr(work, "predicted_fraud_type", "GENERAL_ANOMALY") or "GENERAL_ANOMALY",
            "sub_scores": work.sub_scores or {},
            "synthesized_reasons": work.risk_reasons or [],
        }
        res = generate_decision_support(work_dict)
        ds = DecisionSupport(
            id=str(uuid.uuid4()),
            work_id=work.id,
            triggered_domains=res.get("triggered_domains", []),
            recommendations=res.get("recommendations", {}),
            source=res.get("source", "gemini"),
            confidence_note=res.get("confidence_note", ""),
            generated_at=datetime.now(timezone.utc),
        )
        try:
            db.add(ds)
            db.commit()
            db.refresh(ds)
        except Exception:
            db.rollback()

    elif ds and ds.source == "fallback" and is_elevated:
        # Upgrade prior fallback record to live Gemini recommendations
        try:
            from datetime import datetime, timezone
            from app.ml.decision_support import generate_decision_support

            work_dict = {
                "id": work.id,
                "work": work.work,
                "work_title": work.work,
                "work_category": work.category or "General",
                "category": work.category or "General",
                "allocation_amount": float(work.allocation_amount or 0.0),
                "status": work.status or "Unsanctioned",
                "days_since_recommended": int(work.days_since_recommended or 0),
                "constituency": work.constituency or "",
                "state": work.state or "",
                "ida": work.ida or "",
                "overall_risk_score": float(work.risk_score or 0.0),
                "risk_level": str(work.risk_level or "MEDIUM").upper(),
                "primary_typology": getattr(work, "predicted_fraud_type", "GENERAL_ANOMALY") or "GENERAL_ANOMALY",
                "sub_scores": work.sub_scores or {},
                "synthesized_reasons": work.risk_reasons or [],
            }
            res = generate_decision_support(work_dict)
            if res.get("source") == "gemini":
                ds.triggered_domains = res.get("triggered_domains", [])
                ds.recommendations = res.get("recommendations", {})
                ds.source = "gemini"
                ds.confidence_note = res.get("confidence_note", "")
                ds.generated_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(ds)
        except Exception:
            db.rollback()

    if not ds:
        # Truly low risk work (routine monitoring)
        return {
            "work_id": work_id,
            "status": "not_applicable",
            "role": effective_role,
            "message": "Routine monitoring; no elevated anomaly triggers warranting decision support.",
            "recommendations": [] if effective_role != "ministry" else {"mp": [], "district": [], "state": [], "ministry": []},
            "triggered_domains": [],
            "source": None,
            "confidence_note": None,
            "generated_at": None,
        }

    raw_recs = ds.recommendations or {}
    # Scope recommendations according to role
    if effective_role == "ministry":
        scoped_recs = raw_recs
    else:
        scoped_recs = raw_recs.get(effective_role, [])

    return {
        "work_id": work_id,
        "status": "available",
        "role": effective_role,
        "source": ds.source,
        "confidence_note": ds.confidence_note,
        "triggered_domains": ds.triggered_domains or [],
        "recommendations": scoped_recs,
        "all_recommendations": raw_recs if effective_role == "ministry" else None,
        "generated_at": ds.generated_at.isoformat() if ds.generated_at else None,
    }
