from typing import Dict, Any, List

def format_risk_explanation(work_dict: dict) -> Dict[str, Any]:
    """
    Produces a rich explainability payload for a single work,
    including radar breakdown, feature contributions, and plain-language audit traces.
    """
    sub = work_dict.get("sub_scores", {}) or {}
    score = work_dict.get("risk_score", 0.0)
    level = work_dict.get("risk_level", "Low")
    reasons = work_dict.get("risk_reasons", []) or []

    # Support 7 domain models if present, else fallback to legacy
    if "financial" in sub or "financial_anomaly_score" in sub:
        radar_signals = [
            {"signal": "Financial Anomaly", "score": float(sub.get("financial", sub.get("financial_anomaly_score", 0.0))), "fullMark": 100},
            {"signal": "Geospatial Clustering", "score": float(sub.get("geospatial", sub.get("geospatial_anomaly_score", 0.0))), "fullMark": 100},
            {"signal": "Procurement / Tender", "score": float(sub.get("procurement", sub.get("procurement_anomaly_score", 0.0))), "fullMark": 100},
            {"signal": "Contractor Capacity", "score": float(sub.get("contractor", sub.get("contractor_anomaly_score", 0.0))), "fullMark": 100},
            {"signal": "Payment Structuring", "score": float(sub.get("payment", sub.get("payment_anomaly_score", 0.0))), "fullMark": 100},
            {"signal": "Physical-Financial Gap", "score": float(sub.get("progress", sub.get("progress_anomaly_score", 0.0))), "fullMark": 100},
            {"signal": "Entity Graph Risk", "score": float(sub.get("graph", sub.get("graph_anomaly_score", 0.0))), "fullMark": 100},
        ]
    else:
        radar_signals = [
            {"signal": "Peer Cost Variance", "score": sub.get("cost_anomaly", 0.0), "fullMark": 100},
            {"signal": "Duplicate Density", "score": sub.get("duplicate_risk", 0.0), "fullMark": 100},
            {"signal": "Threshold Structuring", "score": sub.get("structuring_risk", 0.0), "fullMark": 100},
            {"signal": "Agency Concentration", "score": sub.get("vendor_concentration", 0.0), "fullMark": 100},
            {"signal": "Execution Stalling", "score": sub.get("stall_risk", 0.0), "fullMark": 100},
            {"signal": "ML Statistical Outlier", "score": sub.get("unsupervised_anomaly", 0.0), "fullMark": 100},
        ]

    return {
        "work_id": work_dict.get("id", ""),
        "risk_score": score,
        "risk_level": level,
        "predicted_fraud_type": work_dict.get("predicted_fraud_type", "none"),
        "reasons": reasons,
        "sub_scores": sub,
        "radar_breakdown": radar_signals,
        "is_auditable": True
    }
