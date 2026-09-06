from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.geo_service import (
    get_state_choropleth_data,
    get_district_drilldown_data,
    get_constituency_pins,
    get_all_constituencies_risk_data,
    get_constituency_detail
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
