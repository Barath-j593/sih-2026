from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class NoteItem(BaseModel):
    author: str
    text: str
    timestamp: str
    status_change: Optional[str] = None

class CaseBase(BaseModel):
    case_number: str
    title: str
    description: str
    status: str = "flagged"  # flagged, under_review, resolved
    priority: str = "high"
    work_id: Optional[str] = None
    mp_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    ida: Optional[str] = None
    risk_score: float = 0.0
    fraud_type: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: List[Dict[str, Any]] = []

class CaseCreate(BaseModel):
    title: str
    description: str
    work_id: Optional[str] = None
    mp_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    ida: Optional[str] = None
    risk_score: float = 0.0
    fraud_type: Optional[str] = None
    priority: Optional[str] = "high"
    assigned_to: Optional[str] = None

class CaseUpdateStatus(BaseModel):
    status: str
    note: Optional[str] = None
    author: Optional[str] = "Admin Officer"

class CaseAddNote(BaseModel):
    text: str
    author: Optional[str] = "Investigating Officer"

class CaseResponse(CaseBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
