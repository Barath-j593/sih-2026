# SETU Decision Support Subsystem — CHANGELOG & Compliance Audit

> **Subsystem**: AI Administrative Decision Support (Gemini API Integration)  
> **Status**: ADDITIVE ONLY — Zero Breaking Changes  
> **Compliance**: Strict Architectural Isolation & Schema Preservation  

---

## 1. What Was Added

1. **Client Layer (`gemini_client.py`)**:
   - Thin wrapper around `google.genai.Client()`.
   - Reads `GEMINI_API_KEY` from environment variables only.
   - Pinned free-tier model: `gemini-2.5-flash` (confirmed available in Google AI Studio free tier).
   - Rate-limit handling: Exponential backoff on HTTP 429 (`RESOURCE_EXHAUSTED`).
   - Hard 5.0-second timeout to prevent sync pipeline hangs.

2. **Grounded Prompt Engine (`prompt_builder.py`)**:
   - Uses strictly computed model evidence:
     - 7 Domain Anomaly Scores (`sub_scores`)
     - `overall_risk_score` and `risk_level`
     - `synthesized_reasons` / `risk_reasons`
     - `predicted_fraud_type`
   - Strips all raw entity PII before prompt compilation.
   - Enforces structured JSON output via `DECISION_SUPPORT_SCHEMA` containing role keys: `mp`, `district`, `state`, and `ministry`.

3. **Deterministic Fallback Engine (`fallback_templates.py`, `engine.py`)**:
   - Matrix of deterministic, procedural government action templates covering all 7 domains $	imes$ 3 risk tiers (`CRITICAL`, `HIGH`, `MEDIUM`).
   - Seamless fallback on missing API key, network timeout, rate limits (429), or schema validation errors.
   - Non-throwing guarantee: `generate_decision_support()` logs warnings but never raises unhandled exceptions.
   - Global disable switch: `DECISION_SUPPORT_ENABLED=false` bypasses the API entirely.

4. **Database Persistence (`models/decision_support.py`, `batch_generator.py`)**:
   - New `decision_support` table with `work_id` (foreign key/index), `triggered_domains` (JSON), `recommendations` (JSON), `source` (`'gemini'` or `'fallback'`), `confidence_note`, and `generated_at`.
   - Zero modifications or new columns added to the existing `works` table.
   - Resumable and idempotent batch generator (`run_batch_decision_support`) with rate-limiting delay between calls.
   - Clean, decoupled trailing hook in `sync_service.py` executed only if explicitly requested.

5. **Role-Scoped API (`/api/works/{work_id}/decision-support`)**:
   - New REST endpoint under `/api/works`.
   - Resolves requesting persona from Bearer JWT token or query parameter.
   - Scopes recommendations:
     - `ministry`: sees all 4 role recommendations.
     - `state`, `district`, `mp`: receives specifically tailored recommendations for their jurisdiction.
   - Graceful `not_applicable` status for low-risk projects.
   - Zero changes to existing endpoint response contracts.

6. **Frontend Visual Integration (`frontend/app/works/[id]/page.tsx`, `frontend/lib/api.ts`)**:
   - Role-aware **"AI Administrative Decision Support"** card on the Works Detail inspection page.
   - Displays triggered domain tags, role-specific procedural recommendations, and confidence badge.
   - Preserves all existing visuals, radar charts, and badges without disruption.

7. **Test Suite (`backend/tests/ml/decision_support/test_decision_support.py`)**:
   - Unit tests for prompt grounding, PII exclusion, fallback templates, Gemini mock execution, and role-scoping.
   - Mocked Gemini client ensuring no external network calls during automated test runs.

---

## 2. Strict Architectural Integrity Confirmation

* **7 Domain Models & XGBoost Classifier**: Untouched. Zero logic changes in `financial`, `geospatial`, `procurement`, `contractor`, `payment`, `progress`, `graph`, or `supervised`.
* **Risk Fusion Engine (`risk_fusion_engine.py`)**: Untouched. Scoring formulas, weights, critical overrides, and typologies remain identical.
* **Database Schema Integrity**: Zero changes to columns or constraints in `works`, `mps`, `idas`, `constituencies`, `cases`, or `alerts`.
* **Endpoint Contract Integrity**: No modification to existing JSON contracts of `/api/works`, `/api/dashboard`, `/api/alerts`, `/api/cases`, or `/api/risk-intelligence/*`.
* **Regression Safety**: All 136 baseline tests continue to pass.
