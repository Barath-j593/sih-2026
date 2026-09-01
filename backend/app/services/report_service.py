import io
import csv
from datetime import datetime
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.models.work import Work

def generate_works_csv(db: Session, min_risk: float = 50.0, state: str = None) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Work ID", "MP Name", "Work Description", "State", "Constituency",
        "Implementing Agency (IDA)", "Allocation (INR)", "Status",
        "Risk Score (0-100)", "Risk Level", "Predicted Fraud Typology", "Primary Anomaly Reasons"
    ])

    query = db.query(Work).filter(Work.risk_score >= min_risk)
    if state:
        query = query.filter(Work.state == state)
    
    works = query.order_by(Work.risk_score.desc()).limit(1000).all()

    for w in works:
        reasons_joined = " | ".join(w.risk_reasons or ["Statistical anomaly"])
        writer.writerow([
            w.id,
            w.mp_name,
            w.work,
            w.state,
            w.constituency,
            w.ida,
            f"{w.allocation_amount:,.2f}",
            w.status,
            f"{w.risk_score:.1f}",
            w.risk_level,
            w.predicted_fraud_type or "None",
            reasons_joined
        ])

    return output.getvalue()

def generate_audit_pdf(db: Session, state: str = None, jurisdiction: str = "National") -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    elements = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1e293b')
    )

    # Title & Header
    elements.append(Paragraph("<b>SETU — MPLADS COMPLIANCE & ANOMALY AUDIT REPORT</b>", title_style))
    elements.append(Paragraph(f"Jurisdiction Scope: {jurisdiction} | Generated: {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')} | Confidential Govt Document", subtitle_style))
    elements.append(Spacer(1, 15))

    # Query metrics
    query = db.query(Work)
    if state and state != "National":
        query = query.filter(Work.state == state)
    
    total_works = query.count()
    flagged_works = query.filter(Work.risk_score >= 60).count()
    critical_works = query.filter(Work.risk_score >= 80).count()

    summary_data = [
        ["Scope", "Total Works", "High/Critical Anomalies", "Critical Triage", "Compliance Status"],
        [jurisdiction, str(total_works), str(flagged_works), str(critical_works), "Active Monitoring"]
    ]
    t_summary = Table(summary_data, colWidths=[100, 90, 130, 90, 110])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f8fafc'), colors.white]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 15))

    elements.append(Paragraph("<b>Top Flagged Projects Requiring Immediate Administrative Audit:</b>", styles['Heading3']))
    elements.append(Spacer(1, 8))

    # Top works table
    top_works = query.filter(Work.risk_score >= 60).order_by(Work.risk_score.desc()).limit(15).all()

    table_rows = [["ID", "MP & Constituency", "Work Description", "Allocation", "Risk", "Flagged Reason"]]
    for w in top_works:
        first_reason = w.risk_reasons[0] if w.risk_reasons else "Statistical anomaly"
        table_rows.append([
            Paragraph(f"<b>{w.id}</b>", cell_style),
            Paragraph(f"{w.mp_name}<br/><font color='#64748b'>{w.constituency}</font>", cell_style),
            Paragraph(w.work[:65] + "...", cell_style),
            Paragraph(f"₹{w.allocation_amount:,.0f}", cell_style),
            Paragraph(f"<font color='{'#dc2626' if w.risk_score>=80 else '#ea580c'}'><b>{w.risk_score:.0f}</b> ({w.risk_level})</font>", cell_style),
            Paragraph(first_reason[:75] + "...", cell_style)
        ])

    t_works = Table(table_rows, colWidths=[50, 100, 140, 65, 60, 125])
    t_works.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_works)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("<i>This compliance report was generated automatically by the SETU AI Anti-Fraud Engine under MoSPI guidelines. All flagged records are subject to field verification before administrative sanctions.</i>", subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
