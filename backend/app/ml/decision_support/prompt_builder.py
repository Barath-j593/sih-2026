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

Your sole responsibility is to synthesize the provided quantitative anomaly evidence for an individual public work and generate role-scoped procedural recommendations.

STRICT OPERATIONAL CONSTRAINTS:
1. STRICT GROUNDING: Reference ONLY domain signals, risk scores, and evidence reasons present in the input. Never invent an unmentioned fraud typology, unprovided statistic, rule number, statutory section, or legal citation.
2. PROCEDURAL ACTIONS: Each recommendation must be exactly ONE actionable administrative or inspection procedure (e.g. physical milestone verification, technical estimate re-measurement, Measurement Book audit, Utilization Certificate demand, contractor capacity review, disbursement freeze, vigilance inquiry).
3. ROLE-APPROPRIATE SCOPE:
   - MP (Member of Parliament): Constituency-level transparency, demanding physical progress photos, scheduling site visits, requesting status briefings from District Authority.
   - District (District Authority / District Magistrate): Executive field actions: halt disbursement, dispatch Executive Engineer to inspect site, impound Measurement Book, re-tender, issue show-cause notice.
   - State (State Nodal Authority): Inter-district compliance, cross-constituency contractor audit, withholding state-share release, review of Implementing Agency workload.
   - Ministry (MoSPI Central): National oversight, policy compliance review, technical audit deployment, performance ranking adjustment.
4. TIER-PROPORTIONAL TONE:
   - MEDIUM Risk: Lighter-touch monitoring, documentary clarification, routine milestone verification.
   - HIGH / CRITICAL Risk: Decisive administrative intervention, immediate technical re-assessment, disbursement holds, vigilance referral.
5. LENGTH & FORMAT: Output valid JSON strictly conforming to the response schema. Each role array must have exactly 2 crisp recommendations. No verbose commentary outside the schema.
"""


def extract_work_grounding(work_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract and sanitize only non-PII, model-computed evidence fields from work record."""
    # 7 domain sub-scores
    sub_scores = work_data.get("sub_scores") or {}
    domain_mapping = {
        "financial_anomaly_score": float(sub_scores.get("financial_anomaly_score") or work_data.get("financial_anomaly_score") or 0.0),
        "geospatial_anomaly_score": float(sub_scores.get("geospatial_anomaly_score") or work_data.get("geospatial_anomaly_score") or 0.0),
        "procurement_anomaly_score": float(sub_scores.get("procurement_anomaly_score") or work_data.get("procurement_anomaly_score") or 0.0),
        "contractor_anomaly_score": float(sub_scores.get("contractor_anomaly_score") or work_data.get("contractor_anomaly_score") or 0.0),
        "payment_anomaly_score": float(sub_scores.get("payment_anomaly_score") or work_data.get("payment_anomaly_score") or 0.0),
        "progress_anomaly_score": float(sub_scores.get("progress_anomaly_score") or work_data.get("progress_anomaly_score") or 0.0),
        "graph_anomaly_score": float(sub_scores.get("graph_anomaly_score") or work_data.get("graph_anomaly_score") or 0.0),
    }

    # Identify triggered domains (score >= 50.0)
    triggered_domains = [domain.replace("_anomaly_score", "") for domain, score in domain_mapping.items() if score >= 50.0]
    if not triggered_domains:
        # If no domain is >= 50, select the top scoring domain
        top_domain = max(domain_mapping.items(), key=lambda x: x[1])[0].replace("_anomaly_score", "")
        triggered_domains = [top_domain]

    overall_score = float(work_data.get("overall_risk_score") or work_data.get("risk_score") or 0.0)
    risk_level = str(work_data.get("risk_level") or ("CRITICAL" if overall_score >= 80 else "HIGH" if overall_score >= 60 else "MEDIUM" if overall_score >= 40 else "LOW")).upper()
    predicted_typology = str(work_data.get("primary_typology") or work_data.get("predicted_fraud_type") or "UNSPECIFIED_ANOMALY")

    # Reason traces (take top 3 synthesized or risk reasons)
    raw_reasons = work_data.get("synthesized_reasons") or work_data.get("risk_reasons") or []
    if isinstance(raw_reasons, str):
        try:
            raw_reasons = json.loads(raw_reasons)
        except Exception:
            raw_reasons = [raw_reasons]
    reasons = [str(r)[:180] for r in raw_reasons[:3]]

    # Category / context (non-PII)
    work_category = str(work_data.get("work_category") or work_data.get("category") or "Public Infrastructure")

    return {
        "work_id": str(work_data.get("id") or work_data.get("work_id") or "UNKNOWN"),
        "work_category": work_category,
        "overall_risk_score": round(overall_score, 1),
        "risk_level": risk_level,
        "predicted_typology": predicted_typology,
        "sub_scores": {k.replace("_anomaly_score", ""): round(v, 1) for k, v in domain_mapping.items()},
        "triggered_domains": triggered_domains,
        "evidence_reasons": reasons,
    }


def build_decision_support_prompt(work_data: Dict[str, Any]) -> Tuple[str, str, Dict[str, Any]]:
    """Build the system instruction, user prompt, and JSON schema for one work."""
    grounding = extract_work_grounding(work_data)

    user_prompt = (
        f"PROJECT EVALUATION DOSSIER:\n"
        f"- Project Reference: {grounding['work_id']}\n"
        f"- Work Category: {grounding['work_category']}\n"
        f"- Overall Risk Score: {grounding['overall_risk_score']} / 100.0 (Risk Level: {grounding['risk_level']})\n"
        f"- Primary Detected Typology: {grounding['predicted_typology']}\n"
        f"- Triggered Domain Anomalies: {', '.join(grounding['triggered_domains'])}\n\n"
        f"DOMAIN ANOMALY SCORES:\n"
        f"{json.dumps(grounding['sub_scores'], indent=2)}\n\n"
        f"SPECIFIC EVIDENCE REASONS:\n"
    )
    for i, reason in enumerate(grounding["evidence_reasons"], 1):
        user_prompt += f"{i}. {reason}\n"

    user_prompt += (
        "\nTASK:\n"
        "Based strictly on the specific evidence reasons and elevated domain scores provided above, "
        "generate the role-scoped action items according to the JSON schema."
    )

    return user_prompt.strip(), SYSTEM_INSTRUCTION, DECISION_SUPPORT_SCHEMA
