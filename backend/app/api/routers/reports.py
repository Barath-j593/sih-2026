from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.report_service import generate_works_csv, generate_role_specific_audit_pdf

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/csv")
def download_csv(
    min_risk: float = Query(50.0),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    csv_content = generate_works_csv(db=db, min_risk=min_risk, state=state)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=setu_mplads_anomaly_report.csv"}
    )

@router.get("/audit-pdf")
def download_pdf(
    role: str = Query("ministry", description="User governance tier: ministry, state, district, or mp"),
    state: Optional[str] = Query(None),
    jurisdiction: str = Query("National"),
    db: Session = Depends(get_db)
):
    pdf_bytes = generate_role_specific_audit_pdf(
        db=db,
        role=role,
        state=state,
        jurisdiction=jurisdiction
    )
    filename_map = {
        "ministry": f"SETU_National_PAC_Audit_Dossier_{jurisdiction.replace(' ', '_')}.pdf",
        "state": f"SETU_Statewide_Vigilance_Brief_{jurisdiction.replace(' ', '_')}.pdf",
        "district": f"SETU_DM_PreSanction_Structuring_Audit_{jurisdiction.replace(' ', '_')}.pdf",
        "mp": f"SETU_MP_Constituency_Transparency_Scorecard_{jurisdiction.replace(' ', '_')}.pdf",
    }
    filename = filename_map.get(role, f"SETU_Audit_Report_{jurisdiction.replace(' ', '_')}.pdf")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
