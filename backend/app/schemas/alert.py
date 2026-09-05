from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class AlertBase(BaseModel):
    title: str
    description: str
    severity: str = "High"
    work_id: Optional[str] = None
    mp_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    ida: Optional[str] = None
    fraud_type: Optional[str] = None
    risk_score: float = 0.0
    is_read: bool = False

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
