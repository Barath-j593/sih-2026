from sqlalchemy import Column, String, Float, Integer, JSON
from app.core.database import Base

class Constituency(Base):
    __tablename__ = "constituencies"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    state = Column(String(100), index=True)
    district = Column(String(100), index=True)
    mp_name = Column(String(255), index=True)
    total_works = Column(Integer, default=0)
    total_allocation = Column(Float, default=0.0)
    avg_risk_score = Column(Float, default=0.0)
    flagged_works_count = Column(Integer, default=0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
