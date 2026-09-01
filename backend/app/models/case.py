from sqlalchemy import Column, String, Float, DateTime, Text, JSON
from datetime import datetime
from app.core.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(64), primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="flagged", index=True)  # flagged, under_review, resolved
    priority = Column(String(50), default="high", index=True)  # critical, high, medium, low
    work_id = Column(String(64), index=True, nullable=True)
    mp_name = Column(String(255), index=True, nullable=True)
    state = Column(String(100), index=True, nullable=True)
    district = Column(String(100), index=True, nullable=True)
    ida = Column(String(255), nullable=True)
    risk_score = Column(Float, default=0.0)
    fraud_type = Column(String(100), nullable=True)
    assigned_to = Column(String(255), nullable=True)
    notes = Column(JSON, default=list)  # list of note objects: {author, text, timestamp, status_change}
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
