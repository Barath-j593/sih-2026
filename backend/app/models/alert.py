from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, JSON
from datetime import datetime
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), default="High", index=True)  # Critical, High, Medium, Low
    work_id = Column(String(64), index=True, nullable=True)
    mp_name = Column(String(255), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)
    ida = Column(String(255), nullable=True)
    fraud_type = Column(String(100), nullable=True)
    risk_score = Column(Float, default=0.0)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
