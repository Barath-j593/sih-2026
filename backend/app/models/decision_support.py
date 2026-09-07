from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from app.core.database import Base


class DecisionSupport(Base):
    __tablename__ = "decision_support"

    id = Column(String(64), primary_key=True, index=True)
    work_id = Column(String(64), ForeignKey("works.id"), index=True, nullable=False, unique=True)
    triggered_domains = Column(JSON, default=list, nullable=False)
    recommendations = Column(JSON, default=dict, nullable=False)
    source = Column(String(20), default="fallback", nullable=False)  # "gemini" or "fallback"
    confidence_note = Column(String(500), nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
