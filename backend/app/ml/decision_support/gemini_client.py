"""Thin wrapper around google.genai.Client with timeout and exponential backoff.

MoSPI SETU MPLADS Platform.
"""

import os
import time
import logging
from typing import Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger("setu.decision_support.gemini")

# Lazy import to avoid loading issues when package is optional
try:
    from google import genai
    # pyrefly: ignore [missing-import]
    from google.genai import types
    # pyrefly: ignore [missing-import]
    from google.genai.errors import APIError
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    genai = None
    types = None
    APIError = Exception


class GeminiDecisionSupportClient:
    """Client for generating grounded structured recommendations via Gemini API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
        max_retries: int = 3,
        initial_backoff: float = 1.0,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL_NAME or "gemini-3.5-flash"
        self.timeout_seconds = timeout_seconds or settings.DECISION_SUPPORT_TIMEOUT_SECONDS or 15.0
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self._client: Optional[Any] = None

    def _get_client(self) -> Any:
        if not HAS_GENAI:
            raise RuntimeError("google-genai package is not installed. Install with `pip install google-genai`.")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def is_available(self) -> bool:
        """Check if Gemini client has API key configured and library available."""
        return bool(HAS_GENAI and self.api_key)

    def generate_structured(
        self,
        contents: str,
        system_instruction: str,
        response_schema: Dict[str, Any],
    ) -> str:
        """Call Gemini generate_content with structured output, timeout, and retry on 429."""
        client = self._get_client()

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.2,  # Low temperature for deterministic, strictly grounded procedural text
            max_output_tokens=4096,
        )

        candidate_models = [
            self.model_name or "gemini-3.5-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-3.7-flash",
            "gemini-3.8-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.6-flash",
        ]
        candidate_models = list(dict.fromkeys(candidate_models))
        last_exception = None

        for model_candidate in candidate_models:
            backoff = self.initial_backoff
            skip_to_next_model = False
            for attempt in range(1, self.max_retries + 1):
                try:
                    response = client.models.generate_content(
                        model=model_candidate,
                        contents=contents,
                        config=config,
                    )
                    if response and response.text:
                        logger.info("Gemini decision support successfully generated using model: %s", model_candidate)
                        return response.text
                    raise RuntimeError(f"Empty response received from Gemini model {model_candidate}.")
                except Exception as e:
                    last_exception = e
                    err_str = str(e)
                    is_rate_limit = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str.upper()
                    is_not_found = "404" in err_str or "NOT_FOUND" in err_str.upper() or "no longer available" in err_str.lower()
                    is_transient = "503" in err_str or "UNAVAILABLE" in err_str.upper() or "DEADLINE" in err_str.upper()

                    # Fast-fallback: If daily quota is exhausted or model is sunset, switch candidate immediately!
                    if is_rate_limit or is_not_found:
                        logger.warning(
                            "Gemini model %s quota exhausted or unavailable (%s). Fast-falling back to next model candidate...",
                            model_candidate, err_str[:120]
                        )
                        skip_to_next_model = True
                        break

                    if is_transient and attempt < self.max_retries:
                        logger.warning(
                            "Gemini model %s transient error on attempt %d/%d. Backing off %.1fs...",
                            model_candidate, attempt, self.max_retries, backoff
                        )
                        time.sleep(backoff)
                        backoff *= 1.5
                        continue
                    break

            if skip_to_next_model:
                continue

        raise last_exception or RuntimeError("Gemini API call failed with unknown error across all candidate models.")
