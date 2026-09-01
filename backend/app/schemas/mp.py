from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class MPBase(BaseModel):
    id: str
    name: str
    state: str
    constituency: str
    house: Optional[str] = "Lok Sabha"
    total_works: int = 0
    total_allocation: float = 0.0
    avg_risk_score: float = 0.0
    flagged_works_count: int = 0
    top_work_categories: List[Dict[str, Any]] = []
    top_idas: List[Dict[str, Any]] = []

class MPResponse(MPBase):
    class Config:
        from_attributes = True
