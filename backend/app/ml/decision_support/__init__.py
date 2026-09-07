"""Decision Support Subsystem for SETU MPLADS Platform.

Provides role-scoped administrative recommendations powered by the Gemini API
with deterministic fallback policies.
"""

from .engine import generate_decision_support
from .prompt_builder import build_decision_support_prompt, DECISION_SUPPORT_SCHEMA
from .fallback_templates import get_fallback_recommendations

__all__ = [
    "generate_decision_support",
    "build_decision_support_prompt",
    "DECISION_SUPPORT_SCHEMA",
    "get_fallback_recommendations",
]
