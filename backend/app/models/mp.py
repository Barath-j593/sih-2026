from sqlalchemy import Column, String, Float, Integer, JSON
from app.core.database import Base

class MP(Base):
    __tablename__ = "mps"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    state = Column(String(100), index=True)
    constituency = Column(String(255), index=True)
    house = Column(String(50), default="Lok Sabha")
    total_works = Column(Integer, default=0)
    total_allocation = Column(Float, default=0.0)
    avg_risk_score = Column(Float, default=0.0)
    flagged_works_count = Column(Integer, default=0)
    top_work_categories = Column(JSON, default=list)
    top_idas = Column(JSON, default=list)
