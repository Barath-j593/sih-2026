"""FastAPI Router for SETU Multi-Signal Risk Intelligence and ML Evidence.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
import pandas as pd

from app.core.config import settings
from app.ml.models.risk_fusion_engine import RiskFusionEngine
from app.schemas.risk_intelligence import (
    LiveFusionRequest,
    LiveFusionResponse,
    ProjectRiskDetailResponse,
    RiskIntelligenceSummaryResponse,
)

router = APIRouter(prefix="/risk-intelligence", tags=["Risk Intelligence & ML Evidence"])

engine = RiskFusionEngine()


@router.get("/summary", response_model=RiskIntelligenceSummaryResponse)
def get_risk_summary():
    """Retrieve macro-level risk intelligence summary across all 5,000 national MPLADS projects."""
    json_path = engine.reports_dir / "risk_fusion_report.json"
    if not json_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk fusion report has not been generated yet.",
        )

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return RiskIntelligenceSummaryResponse(**data)


@router.get("/projects")
def list_fused_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    risk_level: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    investigation_priority: Optional[str] = Query(None, description="IMMEDIATE, PRIORITY, ROUTINE"),
    primary_typology: Optional[str] = Query(None, description="Typology archetype"),
    search: Optional[str] = Query(None, description="Search project_id"),
    sort_by: Optional[str] = Query("overall_risk_score", description="Column to sort by"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
):
    """Query paginated fused risk projects with multi-criteria filtering."""
    csv_path = engine.data_dir / "fused_risk_intelligence.csv"
    if not csv_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fused risk intelligence dataset not found.",
        )

    df = pd.read_csv(csv_path)

    # Filter
    if risk_level:
        df = df[df["risk_level"].str.upper() == risk_level.upper()]
    if investigation_priority:
        df = df[df["investigation_priority"].str.upper() == investigation_priority.upper()]
    if primary_typology:
        df = df[df["primary_typology"].str.upper() == primary_typology.upper()]
    if search:
        s = search.strip().lower()
        df = df[df["project_id"].str.lower().str.contains(s)]

    # Sort
    valid_sort_cols = [
        "overall_risk_score",
        "fraud_probability",
        "financial_anomaly_score",
        "progress_anomaly_score",
        "procurement_anomaly_score",
    ]
    col = sort_by if sort_by in valid_sort_cols else "overall_risk_score"
    ascending = sort_order.lower() == "asc"
    df = df.sort_values(by=col, ascending=ascending)

    total = len(df)
    offset = (page - 1) * limit
    page_df = df.iloc[offset : offset + limit]

    items = []
    for _, row in page_df.iterrows():
        reasons_list = json.loads(row["synthesized_reasons"]) if pd.notna(row["synthesized_reasons"]) else []
        items.append(
            {
                "project_id": row["project_id"],
                "overall_risk_score": float(row["overall_risk_score"]),
                "risk_level": row["risk_level"],
                "investigation_priority": row["investigation_priority"],
                "primary_typology": row["primary_typology"],
                "fraud_probability": float(row["fraud_probability"]),
                "primary_reason": row["primary_reason"],
                "secondary_reason": row.get("secondary_reason"),
                "synthesized_reasons": reasons_list,
                "domain_scores": {
                    "financial": float(row["financial_anomaly_score"]),
                    "geospatial": float(row["geospatial_anomaly_score"]),
                    "procurement": float(row["procurement_anomaly_score"]),
                    "contractor": float(row["contractor_anomaly_score"]),
                    "payment": float(row["payment_anomaly_score"]),
                    "progress": float(row["progress_anomaly_score"]),
                    "graph": float(row["graph_anomaly_score"]),
                },
            }
        )

    total_pages = (total + limit - 1) // limit if limit > 0 else 1

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "items": items,
    }


@router.get("/projects/{project_id}", response_model=ProjectRiskDetailResponse)
def get_project_risk_detail(project_id: str):
    """Retrieve comprehensive 8-model evidence dossier and Tree SHAP attributions for a project."""
    csv_path = engine.data_dir / "fused_risk_intelligence.csv"
    if not csv_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fused risk intelligence dataset not found.",
        )

    df = pd.read_csv(csv_path)
    match = df[df["project_id"] == project_id]
    if match.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found in fused risk intelligence store.",
        )

    row = match.iloc[0]
    reasons_list = json.loads(row["synthesized_reasons"]) if pd.notna(row["synthesized_reasons"]) else []
    contribs_dict = (
        json.loads(row["feature_importance_contributions"])
        if pd.notna(row.get("feature_importance_contributions"))
        else {}
    )

    domain_scores = {
        "financial_anomaly_score": float(row["financial_anomaly_score"]),
        "geospatial_anomaly_score": float(row["geospatial_anomaly_score"]),
        "procurement_anomaly_score": float(row["procurement_anomaly_score"]),
        "contractor_anomaly_score": float(row["contractor_anomaly_score"]),
        "payment_anomaly_score": float(row["payment_anomaly_score"]),
        "progress_anomaly_score": float(row["progress_anomaly_score"]),
        "graph_anomaly_score": float(row["graph_anomaly_score"]),
    }

    return ProjectRiskDetailResponse(
        project_id=row["project_id"],
        overall_risk_score=float(row["overall_risk_score"]),
        risk_level=row["risk_level"],
        investigation_priority=row["investigation_priority"],
        primary_typology=row["primary_typology"],
        fraud_probability=float(row["fraud_probability"]),
        synthesized_reasons=reasons_list,
        primary_reason=row["primary_reason"],
        secondary_reason=row.get("secondary_reason"),
        tertiary_reason=row.get("tertiary_reason"),
        domain_scores=domain_scores,
        feature_importance_contributions=contribs_dict,
        scored_at=str(row["scored_at"]),
    )


@router.post("/fuse", response_model=LiveFusionResponse)
def live_fuse_signals(request: LiveFusionRequest):
    """Live interactive fusion simulator: Triangulates custom evidence inputs and generates real-time risk scores."""
    domain_scores = {
        "financial_anomaly_score": request.financial_anomaly_score,
        "geospatial_anomaly_score": request.geospatial_anomaly_score,
        "procurement_anomaly_score": request.procurement_anomaly_score,
        "contractor_anomaly_score": request.contractor_anomaly_score,
        "payment_anomaly_score": request.payment_anomaly_score,
        "progress_anomaly_score": request.progress_anomaly_score,
        "graph_anomaly_score": request.graph_anomaly_score,
    }

    domain_reasons = request.domain_reasons or {}

    result = engine.fuse_project(
        project_id=request.project_id,
        domain_scores=domain_scores,
        domain_reasons=domain_reasons,
        fraud_probability=request.fraud_probability,
        predicted_typology=request.predicted_typology,
    )

    return LiveFusionResponse(**result)


@router.get("/reports")
def list_available_audit_reports():
    """List all available ML model reports and summaries."""
    report_files = list(engine.reports_dir.glob("*.md"))
    return {
        "total_reports": len(report_files),
        "reports": [
            {
                "report_name": p.stem,
                "filename": p.name,
                "size_bytes": p.stat().st_size,
                "modified_at": p.stat().st_mtime,
            }
            for p in sorted(report_files)
        ],
    }


@router.get("/reports/{report_name}")
def get_audit_report_content(report_name: str):
    """Retrieve full Markdown content of a specific model audit report."""
    target_name = report_name if report_name.endswith(".md") else f"{report_name}.md"
    target_path = engine.reports_dir / target_name

    if not target_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {target_name} not found.",
        )

    with open(target_path, "r", encoding="utf-8") as f:
        content = f.read()

    return {"report_name": target_name, "content": content}
