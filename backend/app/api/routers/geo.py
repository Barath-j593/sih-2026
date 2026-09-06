from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.geo_service import (
    get_state_choropleth_data,
    get_district_drilldown_data,
    get_constituency_pins,
    get_all_constituencies_risk_data,
    get_constituency_detail,
    get_cartel_conduits_data,
    get_temporal_risk_data
)

router = APIRouter(prefix="/geo", tags=["Geospatial Maps"])

@router.get("/states-choropleth")
def states_choropleth(db: Session = Depends(get_db)):
    return get_state_choropleth_data(db=db)

@router.get("/district-drilldown")
def district_drilldown(state: str = Query("Bihar"), db: Session = Depends(get_db)):
    return get_district_drilldown_data(db=db, state=state)

@router.get("/pins")
def constituency_pins(
    constituency: Optional[str] = Query(None),
    mp_name: Optional[str] = Query(None),
    limit: int = Query(150, le=500),
    db: Session = Depends(get_db)
):
    return get_constituency_pins(db=db, constituency_name=constituency, mp_name=mp_name, limit=limit)

@router.get("/constituencies-risk")
def constituencies_risk(
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return get_all_constituencies_risk_data(db=db, state=state)

@router.get("/constituency-detail")
def constituency_detail(
    name: str = Query(...),
    db: Session = Depends(get_db)
):
    res = get_constituency_detail(db=db, constituency_name=name)
    if not res:
        return {"error": "Constituency not found"}
    return res

@router.get("/cartel-conduits")
def cartel_conduits(
    min_risk: float = Query(45.0),
    limit: int = Query(40, le=100),
    db: Session = Depends(get_db)
):
    return get_cartel_conduits_data(db=db, min_risk=min_risk, limit=limit)

@router.get("/temporal-risk")
def temporal_risk(
    db: Session = Depends(get_db)
):
    return get_temporal_risk_data(db=db)

