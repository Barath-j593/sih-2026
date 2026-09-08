from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, or_
from app.models.work import Work
from app.schemas.work import WorkFilterParams, PaginatedWorksResponse, WorkResponse
from app.ml.inference.explain_risk import format_risk_explanation

def get_works_paginated(db: Session, params: WorkFilterParams) -> PaginatedWorksResponse:
    query = db.query(Work)

    if params.state:
        query = query.filter(func.lower(Work.state) == params.state.lower())
    if params.constituency:
        query = query.filter(func.lower(Work.constituency).like(f"%{params.constituency.lower()}%"))
    if params.mp_name:
        query = query.filter(func.lower(Work.mp_name).like(f"%{params.mp_name.lower()}%"))
    if params.ida:
        query = query.filter(func.lower(Work.ida).like(f"%{params.ida.lower()}%"))
    if params.status:
        query = query.filter(func.lower(Work.status) == params.status.lower())
    if params.category:
        query = query.filter(func.lower(Work.category) == params.category.lower())
    if params.risk_level:
        query = query.filter(func.lower(Work.risk_level) == params.risk_level.lower())
    if params.min_risk_score is not None:
        query = query.filter(Work.risk_score >= params.min_risk_score)
    if params.max_risk_score is not None:
        query = query.filter(Work.risk_score <= params.max_risk_score)
    if params.fraud_type:
        query = query.filter(func.lower(Work.predicted_fraud_type) == params.fraud_type.lower())
    if params.search:
        s = f"%{params.search.lower()}%"
        query = query.filter(
            or_(
                func.lower(Work.work).like(s),
                func.lower(Work.mp_name).like(s),
                func.lower(Work.ida).like(s),
                func.lower(Work.constituency).like(s),
                func.lower(Work.city).like(s),
                func.lower(Work.id).like(s)
            )
        )

    # Sorting
    sort_col = getattr(Work, params.sort_by, Work.risk_score)
    if params.sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    offset = (params.page - 1) * params.limit
    items = query.offset(offset).limit(params.limit).all()

    total_pages = (total + params.limit - 1) // params.limit if params.limit > 0 else 1

    return PaginatedWorksResponse(
        total=total,
        page=params.page,
        limit=params.limit,
        total_pages=total_pages,
        items=[WorkResponse.model_validate(item) for item in items]
    )

def get_work_detail(db: Session, work_id: str) -> Optional[Dict[str, Any]]:
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        return None
    
    work_dict = {
        "id": work.id,
        "mp_name": work.mp_name,
        "work": work.work,
        "category": work.category,
        "state": work.state,
        "constituency": work.constituency,
        "ida": work.ida,
        "city": work.city,
        "ward": work.ward,
        "block": work.block,
        "village": work.village,
        "recommended_date": work.recommended_date,
        "allocation_amount": work.allocation_amount,
        "ida_approval": work.ida_approval,
        "status": work.status,
        "house": work.house,
        "state_mean_alloc": work.state_mean_alloc,
        "alloc_zscore_state": work.alloc_zscore_state,
        "work_type": work.work_type,
        "alloc_zscore_worktype": work.alloc_zscore_worktype,
        "duplicate_count": work.duplicate_count,
        "is_duplicate_candidate": work.is_duplicate_candidate,
        "ida_work_count": work.ida_work_count,
        "mp_total_works": work.mp_total_works,
        "mp_total_allocation": work.mp_total_allocation,
        "risk_score": work.risk_score,
        "risk_level": work.risk_level,
        "risk_reasons": work.risk_reasons or [],
        "sub_scores": work.sub_scores or {},
        "predicted_fraud_type": work.predicted_fraud_type,
        "days_since_recommended": work.days_since_recommended
    }

    explanation = format_risk_explanation(work_dict)
    work_dict["explanation"] = explanation
    return work_dict

def get_filter_options(db: Session) -> Dict[str, Any]:
    states = [s[0] for s in db.query(Work.state).distinct().order_by(Work.state).all() if s[0]]
    categories = [c[0] for c in db.query(Work.category).distinct().order_by(Work.category).all() if c[0]]
    statuses = [st[0] for st in db.query(Work.status).distinct().order_by(Work.status).all() if st[0]]
    fraud_types = [
        ft[0] for ft in db.query(Work.predicted_fraud_type).distinct().order_by(Work.predicted_fraud_type).all()
        if ft[0] and ft[0].lower() != "normal"
    ]
    
    return {
        "states": states,
        "categories": categories,
        "statuses": statuses,
        "fraud_types": fraud_types,
        "risk_levels": ["Low", "Medium", "High", "Critical"]
    }

