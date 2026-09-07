"""Core Decision Support Engine for SETU MPLADS Platform.

Orchestrates Gemini API structured generation with fail-safe fallback policies,
schema validation, rate-limit protection, and execution telemetry.
Never raises unhandled exceptions to calling pipelines.

MoSPI SETU MPLADS Platform.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, Optional

from app.core.config import settings
from .gemini_client import GeminiDecisionSupportClient
from .prompt_builder import build_decision_support_prompt, extract_work_grounding
from .fallback_templates import get_fallback_recommendations

logger = logging.getLogger("setu.decision_support.engine")


def _validate_response_schema(data: Any) -> bool:
    """Validate that response dictionary matches expected structural schema."""
    if not isinstance(data, dict):
        return False
    if "triggered_domains" not in data or not isinstance(data["triggered_domains"], list):
        return False
    if "recommendations" not in data or not isinstance(data["recommendations"], dict):
        return False
    recs = data["recommendations"]
    for role in ("mp", "district", "state", "ministry"):
        if role not in recs or not isinstance(recs[role], list) or len(recs[role]) == 0:
            return False
    if "confidence_note" not in data or not isinstance(data["confidence_note"], str):
        return False
    return True


def generate_decision_support(
    work_data: Dict[str, Any],
    client: Optional[GeminiDecisionSupportClient] = None,
) -> Dict[str, Any]:
    """Generate role-scoped administrative recommendations for a single work.

    Tries Gemini API first if configured and enabled; falls back gracefully to
    deterministic grounded administrative templates on any failure, timeout, or missing key.
    Guarantees non-throwing behavior.
    """
    grounding = extract_work_grounding(work_data)
    work_id = grounding["work_id"]
    risk_level = grounding["risk_level"]
    triggered_domains = grounding["triggered_domains"]

    now_iso = datetime.now(timezone.utc).isoformat()

    # Check if feature is globally disabled
    if not settings.DECISION_SUPPORT_ENABLED:
        logger.info("Decision support disabled via DECISION_SUPPORT_ENABLED. Using fallback policy for %s.", work_id)
        fallback = get_fallback_recommendations(triggered_domains, risk_level)
        return {
            "work_id": work_id,
            "triggered_domains": fallback["triggered_domains"],
            "recommendations": fallback["recommendations"],
            "confidence_note": fallback["confidence_note"],
            "source": "fallback",
            "generated_at": now_iso,
        }

    # Initialize client if not injected
    gemini_client = client or GeminiDecisionSupportClient()

    # If Gemini is not configured or available, use fallback immediately
    if not gemini_client.is_available():
        logger.debug("Gemini client unavailable (no GEMINI_API_KEY). Using fallback policy for %s.", work_id)
        fallback = get_fallback_recommendations(triggered_domains, risk_level)
        return {
            "work_id": work_id,
            "triggered_domains": fallback["triggered_domains"],
            "recommendations": fallback["recommendations"],
            "confidence_note": fallback["confidence_note"],
            "source": "fallback",
            "generated_at": now_iso,
        }

    # Attempt Gemini generation
    try:
        user_prompt, system_instruction, schema = build_decision_support_prompt(work_data)
        raw_response = gemini_client.generate_structured(
            contents=user_prompt,
            system_instruction=system_instruction,
            response_schema=schema,
        )

        parsed = json.loads(raw_response)

        if not _validate_response_schema(parsed):
            logger.warning("Gemini output failed schema validation for %s. Reverting to fallback.", work_id)
            fallback = get_fallback_recommendations(triggered_domains, risk_level)
            return {
                "work_id": work_id,
                "triggered_domains": fallback["triggered_domains"],
                "recommendations": fallback["recommendations"],
                "confidence_note": fallback["confidence_note"],
                "source": "fallback",
                "generated_at": now_iso,
            }

        logger.info("Successfully generated Gemini decision support for work %s.", work_id)
        return {
            "work_id": work_id,
            "triggered_domains": parsed["triggered_domains"],
            "recommendations": parsed["recommendations"],
            "confidence_note": parsed["confidence_note"],
            "source": "gemini",
            "generated_at": now_iso,
        }

    except Exception as e:
        logger.warning(
            "Gemini decision support generation failed for %s (%s). Falling back safely to policy templates.",
            work_id, str(e)
        )
        fallback = get_fallback_recommendations(triggered_domains, risk_level)
        return {
            "work_id": work_id,
            "triggered_domains": fallback["triggered_domains"],
            "recommendations": fallback["recommendations"],
            "confidence_note": fallback["confidence_note"],
            "source": "fallback",
            "generated_at": now_iso,
        }
