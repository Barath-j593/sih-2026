"""Batch generator for persisting decision support recommendations in database.

Processes works with risk level Medium, High, or Critical.
Includes rate limiting, resume / idempotent skipping, and safe fallback.

MoSPI SETU MPLADS Platform.
"""

from datetime import datetime, timezone
import logging
import time
from typing import Any, Dict, Optional
import uuid
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.work import Work
from app.models.decision_support import DecisionSupport
from .engine import generate_decision_support

logger = logging.getLogger("setu.decision_support.batch")


def run_batch_decision_support(
    db: Session,
    limit: Optional[int] = None,
    force: bool = False,
    sleep_between_calls: float = 0.2,
) -> Dict[str, int]:
    """Batch generate and persist decision support records for elevated-risk works.

    Idempotent: skips works that already have an entry unless force=True.
    """
    query = db.query(Work).filter(
        (Work.risk_score >= 40.0) |
        (Work.risk_level.in_(["Medium", "High", "Critical", "MEDIUM", "HIGH", "CRITICAL"]))
    ).order_by(Work.risk_score.desc())

    if limit:
        query = query.limit(limit)

    works = query.all()
    stats = {
        "total_eligible": len(works),
        "generated": 0,
        "skipped": 0,
        "gemini_count": 0,
        "fallback_count": 0,
    }

    logger.info("Starting decision support batch generation for %d eligible works...", len(works))

    for work in works:
        # Check if already processed (resumable / idempotent)
        existing = db.query(DecisionSupport).filter(DecisionSupport.work_id == work.id).first()
        if existing and not force:
            stats["skipped"] += 1
            continue

        work_data = {
            "id": work.id,
            "work": work.work,
            "work_category": work.category,
            "overall_risk_score": work.risk_score,
            "risk_level": work.risk_level,
            "primary_typology": work.predicted_fraud_type,
            "sub_scores": work.sub_scores or {},
            "synthesized_reasons": work.risk_reasons or [],
        }

        # Generate grounded recommendations (tries Gemini, falls back seamlessly)
        res = generate_decision_support(work_data)

        if existing:
            existing.triggered_domains = res["triggered_domains"]
            existing.recommendations = res["recommendations"]
            existing.source = res["source"]
            existing.confidence_note = res["confidence_note"]
            existing.generated_at = datetime.now(timezone.utc)
        else:
            rec = DecisionSupport(
                id=f"DS-{str(uuid.uuid4())[:12]}",
                work_id=work.id,
                triggered_domains=res["triggered_domains"],
                recommendations=res["recommendations"],
                source=res["source"],
                confidence_note=res["confidence_note"],
                generated_at=datetime.now(timezone.utc),
            )
            db.add(rec)

        stats["generated"] += 1
        if res["source"] == "gemini":
            stats["gemini_count"] += 1
        else:
            stats["fallback_count"] += 1

        db.commit()

        if sleep_between_calls > 0:
            time.sleep(sleep_between_calls)

    logger.info("Completed decision support batch run: %s", stats)
    return stats


if __name__ == "__main__":
    from app.core.database import SessionLocal, engine, Base
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        run_batch_decision_support(session, limit=50, force=False)
    finally:
        session.close()
