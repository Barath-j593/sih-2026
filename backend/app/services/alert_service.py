from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertCreate

def get_alerts(
    db: Session,
    severity: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = 50
) -> List[AlertResponse]:
    query = db.query(Alert)
    if severity:
        query = query.filter(func.lower(Alert.severity) == severity.lower())
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)
    
    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    return [AlertResponse.from_orm(a) for a in alerts]

def mark_alert_read(db: Session, alert_id: str) -> Optional[AlertResponse]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return AlertResponse.from_orm(alert)

def mark_all_alerts_read(db: Session) -> int:
    cnt = db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return cnt
