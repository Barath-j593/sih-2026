from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.alert import AlertResponse
from app.services.alert_service import get_alerts, mark_alert_read, mark_all_alerts_read

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    severity: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    return get_alerts(db=db, severity=severity, is_read=is_read, limit=limit)

@router.post("/{alert_id}/read", response_model=AlertResponse)
def read_alert(alert_id: str, db: Session = Depends(get_db)):
    res = mark_alert_read(db=db, alert_id=alert_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found"
        )
    return res

@router.post("/read-all")
def read_all_alerts(db: Session = Depends(get_db)):
    count = mark_all_alerts_read(db=db)
    return {"message": "All alerts marked as read", "count": count}
