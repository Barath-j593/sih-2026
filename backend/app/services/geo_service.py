from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from app.models.work import Work
from app.models.constituency import Constituency

# Representative coordinates for Indian States
STATE_COORDINATES = {
    "Uttar Pradesh": {"lat": 26.8467, "lng": 80.9462},
    "Maharashtra": {"lat": 19.7515, "lng": 75.7139},
    "Bihar": {"lat": 25.0961, "lng": 85.3131},
    "West Bengal": {"lat": 22.9868, "lng": 87.8550},
    "Madhya Pradesh": {"lat": 22.9734, "lng": 78.6569},
    "Tamil Nadu": {"lat": 11.1271, "lng": 78.6569},
    "Rajasthan": {"lat": 27.0238, "lng": 74.2179},
    "Karnataka": {"lat": 15.3173, "lng": 75.7139},
    "Gujarat": {"lat": 22.2587, "lng": 71.1924},
    "Andhra Pradesh": {"lat": 15.9129, "lng": 79.7400},
    "Odisha": {"lat": 20.9517, "lng": 85.0985},
    "Telangana": {"lat": 18.1124, "lng": 79.0193},
    "Kerala": {"lat": 10.8505, "lng": 76.2711},
    "Jharkhand": {"lat": 23.6102, "lng": 85.2799},
    "Assam": {"lat": 26.2006, "lng": 92.9376},
    "Punjab": {"lat": 31.1471, "lng": 75.3412},
    "Chhattisgarh": {"lat": 21.2787, "lng": 81.8661},
    "Haryana": {"lat": 29.0588, "lng": 76.0856},
    "Delhi": {"lat": 28.7041, "lng": 77.1025},
    "Uttarakhand": {"lat": 30.0668, "lng": 79.0193},
}

def get_state_choropleth_data(db: Session) -> List[Dict[str, Any]]:
    stats = db.query(
        Work.state,
        func.count(Work.id).label("total_works"),
        func.sum(Work.allocation_amount).label("total_allocation"),
        func.avg(Work.risk_score).label("avg_risk_score"),
        func.sum(case((Work.risk_score >= 60, 1), else_=0)).label("flagged_count"),
        func.sum(case((Work.risk_score >= 60, Work.allocation_amount), else_=0)).label("risk_amount")
    ).group_by(Work.state).all()

    result = []
    for row in stats:
        st_name = row.state or "India"
        avg_r = float(row.avg_risk_score or 0.0)
        coords = STATE_COORDINATES.get(st_name, {"lat": 20.5937, "lng": 78.9629})
        
        result.append({
            "state": st_name,
            "total_works": int(row.total_works or 0),
            "total_allocation": float(row.total_allocation or 0.0),
            "avg_risk_score": round(avg_r, 1),
            "flagged_works_count": int(row.flagged_count or 0),
            "amount_at_risk": float(row.risk_amount or 0.0),
            "risk_level": "Critical" if avg_r >= 65 else "High" if avg_r >= 50 else "Medium" if avg_r >= 30 else "Low",
            "lat": coords["lat"],
            "lng": coords["lng"]
        })
    return sorted(result, key=lambda x: x["avg_risk_score"], reverse=True)

def get_district_drilldown_data(db: Session, state: str) -> List[Dict[str, Any]]:
    query = db.query(Work).filter(func.lower(Work.state) == state.lower())
    
    stats = db.query(
        Work.constituency,
        func.count(Work.id).label("total_works"),
        func.sum(Work.allocation_amount).label("total_allocation"),
        func.avg(Work.risk_score).label("avg_risk_score"),
        func.sum(case((Work.risk_score >= 60, 1), else_=0)).label("flagged_count"),
        func.sum(case((Work.risk_score >= 60, Work.allocation_amount), else_=0)).label("risk_amount")
    ).filter(func.lower(Work.state) == state.lower()).group_by(Work.constituency).all()

    st_coords = STATE_COORDINATES.get(state, {"lat": 20.5937, "lng": 78.9629})
    result = []
    for i, row in enumerate(stats):
        avg_r = float(row.avg_risk_score or 0.0)
        c_name = row.constituency or "District"
        # Spread pins nicely around state center
        angle = (i * 360.0 / max(1, len(stats))) * (3.14159 / 180.0)
        radius = 0.5 + (i % 3) * 0.4
        
        result.append({
            "district": c_name,
            "state": state,
            "total_works": int(row.total_works or 0),
            "total_allocation": float(row.total_allocation or 0.0),
            "avg_risk_score": round(avg_r, 1),
            "flagged_works_count": int(row.flagged_count or 0),
            "amount_at_risk": float(row.risk_amount or 0.0),
            "risk_level": "Critical" if avg_r >= 65 else "High" if avg_r >= 50 else "Medium" if avg_r >= 30 else "Low",
            "lat": round(st_coords["lat"] + radius * 0.8 * float(np_cos(angle)), 4),
            "lng": round(st_coords["lng"] + radius * 0.8 * float(np_sin(angle)), 4)
        })
    return sorted(result, key=lambda x: x["avg_risk_score"], reverse=True)

import math
def np_cos(x):
    return math.cos(x)
def np_sin(x):
    return math.sin(x)

def get_constituency_pins(db: Session, constituency_name: Optional[str] = None, mp_name: Optional[str] = None, limit: int = 150) -> List[Dict[str, Any]]:
    query = db.query(Work)
    if mp_name and mp_name != "National":
        query = query.filter(func.lower(Work.mp_name).like(f"%{mp_name.strip().lower()}%"))
    elif constituency_name and constituency_name != "National":
        clean_c = constituency_name.strip().lower()
        query = query.filter(
            or_(
                func.lower(Work.constituency).like(f"%{clean_c}%"),
                func.lower(Work.ida).like(f"%{clean_c}%"),
                func.lower(Work.city).like(f"%{clean_c}%"),
                func.lower(Work.state).like(f"%{clean_c}%")
            )
        )

    works = query.order_by(desc(Work.risk_score)).limit(limit).all()
    
    # Base location
    base_state = works[0].state if works else "Delhi"
    base_coords = STATE_COORDINATES.get(base_state, {"lat": 26.0, "lng": 80.0})

    pins = []
    for i, w in enumerate(works):
        # Generate stable micro offsets for map points
        h = abs(hash(w.id))
        d_lat = ((h % 1000) / 1000.0 - 0.5) * 0.45
        d_lng = (((h // 1000) % 1000) / 1000.0 - 0.5) * 0.45
        
        pins.append({
            "id": w.id,
            "work": w.work,
            "mp_name": w.mp_name,
            "ida": w.ida,
            "state": w.state,
            "constituency": w.constituency,
            "village": w.village or w.ward or "Constituency Area",
            "allocation_amount": w.allocation_amount,
            "status": w.status,
            "risk_score": w.risk_score,
            "risk_level": w.risk_level,
            "predicted_fraud_type": w.predicted_fraud_type,
            "reasons": w.risk_reasons or [],
            "lat": round(base_coords["lat"] + d_lat, 5),
            "lng": round(base_coords["lng"] + d_lng, 5)
        })
    return pins
