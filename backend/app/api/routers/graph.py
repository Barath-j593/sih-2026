from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.graph_service import get_network_graph_data, get_available_entities

router = APIRouter(prefix="/graph", tags=["Network Graph"])

@router.get("/entities")
def get_graph_entities(
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns live distinct states, districts (constituencies), and MPs from the database
    to power dynamic, stakeholder-friendly dropdowns.
    """
    return get_available_entities(db=db, state=state)

@router.get("/network")
def get_graph_network(
    max_nodes: int = Query(120, le=400),
    min_risk: float = Query(0.0),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    mp_name: Optional[str] = Query(None),
    role: Optional[str] = Query("ministry"),
    jurisdiction: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return get_network_graph_data(
        db=db,
        max_nodes=max_nodes,
        min_risk=min_risk,
        state=state,
        district=district,
        mp_name=mp_name,
        role=role,
        jurisdiction=jurisdiction
    )
