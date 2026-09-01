from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class IDABase(BaseModel):
    id: str
    name: str
    state: str
    district: Optional[str] = None
    total_works: int = 0
    total_allocation: float = 0.0
    avg_risk_score: float = 0.0
    flagged_works_count: int = 0
    concentration_ratio: float = 0.0
    associated_mps: List[Dict[str, Any]] = []

class IDAResponse(IDABase):
    class Config:
        from_attributes = True
