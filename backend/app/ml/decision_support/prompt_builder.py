"""Prompt builder for grounded, schema-constrained Gemini decision support.

Constructs structured requests using ONLY data already computed by the existing pipeline:
sub_scores (7 domain scores), risk_level, risk_reasons, predicted_fraud_type.
Guarantees ZERO raw PII leakage and schema enforcement.

MoSPI SETU MPLADS Platform.
"""

import json
from typing import Any, Dict, List, Tuple

DECISION_SUPPORT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "triggered_domains": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "List of domain names with elevated anomaly scores (score >= 50.0).",
        },
        "recommendations": {
            "type": "OBJECT",
            "properties": {
                "mp": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Exactly 2 procedural action items for the Member of Parliament.",
                },
                "district": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Exactly 2 procedural action items for the District Authority / District Magistrate.",
                },
                "state": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Exactly 2 procedural action items for the State Nodal Authority.",
                },
                "ministry": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Exactly 2 procedural action items for the Ministry of Statistics and Programme Implementation (MoSPI).",
                },
            },
            "required": ["mp", "district", "state", "ministry"],
        },
        "confidence_note": {
            "type": "STRING",
            "description": "A concise one-sentence note summarizing the data grounding and evidence confidence.",
        },
    },
    "required": ["triggered_domains", "recommendations", "confidence_note"],
}

SYSTEM_INSTRUCTION = """You are the AI Administrative Decision Support Engine for SETU, the Indian Ministry of Statistics and Programme Implementation (MoSPI) platform monitoring the Member of Parliament Local Area Development Scheme (MPLADS).

Your role is to synthesize the provided quantitative anomaly evidence and project parameters for an individual public work and generate role-scoped, legally sound procedural recommendations calibrated against MoSPI MPLADS Operational Guidelines.

STRICT OPERATIONAL CONSTRAINTS:
1. STRICT GROUNDING: Reference ONLY domain signals, risk scores, work descriptions, and evidence reasons present in the input. Never invent unmentioned fraud typologies, fictitious company names, or statutory sections.
2. DIVERSE, CONTEXT-SPECIFIC DIRECTIVES: DO NOT repeat generic boilerplate across different projects. Each recommendation must be directly calibrated to that project's specific category, allocation outlay, delay duration, and primary anomaly triggers (e.g. procurement cartel vs financial outlay deviation vs payment milestone diversion vs physical progress delay vs geospatial clustering).
3. ACTIONABLE ADMINISTRATIVE PROCEDURES: Each recommendation must be exactly ONE actionable statutory, inspection, or administrative procedure under Indian administrative governance:
   - For Procurement / Contractor flags: e.g. CVC guidelines tender scrutiny, GeM price-index benchmarking, debarment review, performance guarantee verification, multi-bidder independence verification.
   - For Financial / Payment flags: e.g. Measurement Book (MB) physical reconciliation, Utilization Certificate (UC) audit, escrow freeze, milestone disbursement audit, bank guarantee review.
   - For Progress / Delay flags: e.g. physical milestone re-inspection by Executive Engineer, liquidated damages assessment under contract clause, physical photographic geotag audit.
   - For Geospatial / Duplicate flags: e.g. GPS co-location field verification, drone survey, asset geo-tagging validation against PM GatiShakti portal.
4. ROLE-APPROPRIATE SCOPE:
   - MP (Member of Parliament): Constituency oversight, demanding physical milestone inspections, tabling status reviews with the District Authority, requesting photographic evidence of completed work.
   - District (District Magistrate / Collector / Deputy Commissioner): Direct executive authority: impounding Measurement Book, freezing disbursement, issuing show-cause notices to implementing agencies, ordering third-party quality inspections.
   - State (State Nodal Department): Inter-district agency workload reviews, cross-constituency contractor audits, withholding subsequent scheme tranche releases.
   - Ministry (MoSPI Central): National scheme audit deployment, policy compliance verification, performance ranking adjustments, referral to central vigilance if critical.
5. TIER-PROPORTIONAL TONE:
   - MEDIUM Risk: Lighter-touch monitoring, documentary clarification, routine milestone verification.
   - HIGH / CRITICAL Risk: Decisive administrative intervention, immediate technical re-assessment, disbursement holds, vigilance referral.
6. LENGTH & FORMAT: Output valid JSON strictly conforming to the response schema. Each role array must contain exactly 2 crisp, high-impact recommendations. No verbose commentary outside the schema.
"""


def extract_work_grounding(work_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract and sanitize only non-PII, model-computed evidence fields from work record."""
    # 7 domain sub-scores - handle both dict and json string
    raw_sub_scores = work_data.get("sub_scores") or {}
    if isinstance(raw_sub_scores, str):
        try:
            sub_scores = json.loads(raw_sub_scores)
        except Exception:
            sub_scores = {}
    elif isinstance(raw_sub_scores, dict):
        sub_scores = raw_sub_scores
    else:
        sub_scores = {}

    def _get_score(key: str) -> float:
        val = (
            sub_scores.get(key)
            if key in sub_scores
            else sub_scores.get(f"{key}_anomaly_score")
            if f"{key}_anomaly_score" in sub_scores
            else work_data.get(key)
            if key in work_data
            else work_data.get(f"{key}_anomaly_score")
            if f"{key}_anomaly_score" in work_data
            else 0.0
        )
        try:
            return float(val or 0.0)
        except (ValueError, TypeError):
            return 0.0

    domain_mapping = {
        "financial": _get_score("financial"),
        "geospatial": _get_score("geospatial"),
        "procurement": _get_score("procurement"),
        "contractor": _get_score("contractor"),
        "payment": _get_score("payment"),
        "progress": _get_score("progress"),
        "graph": _get_score("graph"),
    }

    # Identify triggered domains (score >= 50.0)
    triggered_domains = [domain for domain, score in domain_mapping.items() if score >= 50.0]
    if not triggered_domains:
        # If no domain is >= 50, select the top scoring domain
        top_domain = max(domain_mapping.items(), key=lambda x: x[1])[0]
        triggered_domains = [top_domain]

    overall_score = float(work_data.get("overall_risk_score") or work_data.get("risk_score") or 0.0)
    risk_level = str(work_data.get("risk_level") or ("CRITICAL" if overall_score >= 80 else "HIGH" if overall_score >= 60 else "MEDIUM" if overall_score >= 40 else "LOW")).upper()
    predicted_typology = str(work_data.get("primary_typology") or work_data.get("predicted_fraud_type") or "UNSPECIFIED_ANOMALY")

    # Reason traces (take top 4 synthesized or risk reasons)
    raw_reasons = work_data.get("synthesized_reasons") or work_data.get("risk_reasons") or []
    if isinstance(raw_reasons, str):
        try:
            raw_reasons = json.loads(raw_reasons)
        except Exception:
            raw_reasons = [raw_reasons]
    reasons = [str(r)[:200] for r in raw_reasons[:4] if r]

    # Category, title & administrative metadata
    work_id = str(work_data.get("id") or work_data.get("work_id") or "UNKNOWN")
    work_title = str(work_data.get("work") or work_data.get("title") or "Public Infrastructure Project")[:150]
    work_category = str(work_data.get("work_category") or work_data.get("category") or "Public Infrastructure")
    allocation = float(work_data.get("allocation_amount") or 0.0)
    status = str(work_data.get("status") or "Active")
    days_delayed = int(work_data.get("days_since_recommended") or work_data.get("days_delayed") or 0)
    constituency = str(work_data.get("constituency") or "Unspecified")
    state = str(work_data.get("state") or "Unspecified")
    ida = str(work_data.get("ida") or "District Implementing Agency")

    return {
        "work_id": work_id,
        "work_title": work_title,
        "work_category": work_category,
        "allocation_amount": round(allocation, 2),
        "status": status,
        "days_delayed": days_delayed,
        "constituency": constituency,
        "state": state,
        "ida": ida,
        "overall_risk_score": round(overall_score, 1),
        "risk_level": risk_level,
        "predicted_typology": predicted_typology,
        "sub_scores": {k: round(v, 1) for k, v in domain_mapping.items()},
        "triggered_domains": triggered_domains,
        "evidence_reasons": reasons,
    }


def build_decision_support_prompt(work_data: Dict[str, Any]) -> Tuple[str, str, Dict[str, Any]]:
    """Build the system instruction, user prompt, and JSON schema for one work."""
    grounding = extract_work_grounding(work_data)

    user_prompt = (
        f"PROJECT EVALUATION DOSSIER:\n"
        f"- Project Reference: {grounding['work_id']}\n"
        f"- Work Description: {grounding['work_title']}\n"
        f"- Work Category: {grounding['work_category']}\n"
        f"- Sanction / Allocation Outlay: INR {grounding['allocation_amount']:,.2f} Lakhs\n"
        f"- Administrative Status: {grounding['status']}\n"
        f"- Implementation Delay: {grounding['days_delayed']} days elapsed since sanction\n"
        f"- Administrative Jurisdiction: Constituency: {grounding['constituency']} ({grounding['state']}), Implementing Agency: {grounding['ida']}\n"
        f"- Overall Risk Score: {grounding['overall_risk_score']} / 100.0 (Classification: {grounding['risk_level']})\n"
        f"- Primary Anomaly Typology: {grounding['predicted_typology']}\n"
        f"- Triggered Domain Anomalies: {', '.join(grounding['triggered_domains'])}\n\n"
        f"7-DOMAIN ANOMALY SCORES (0-100):\n"
        f"{json.dumps(grounding['sub_scores'], indent=2)}\n\n"
        f"SPECIFIC EVIDENCE SIGNALS & RISK REASONS:\n"
    )
    if grounding["evidence_reasons"]:
        for i, reason in enumerate(grounding["evidence_reasons"], 1):
            user_prompt += f"{i}. {reason}\n"
    else:
        user_prompt += "1. Statistical risk trigger across elevated domain models exceeding baseline distribution.\n"

    user_prompt += (
        "\nTASK:\n"
        "Synthesize the specific project parameters, category, outlay, delay, and elevated domain scores provided above. "
        "Generate 2 specific, non-redundant procedural directives for each role (mp, district, state, ministry) "
        "strictly conforming to the JSON schema. Ensure directives directly reflect this project's unique domain risks "
        "and avoid generic boilerplate."
    )

    return user_prompt.strip(), SYSTEM_INSTRUCTION, DECISION_SUPPORT_SCHEMA

