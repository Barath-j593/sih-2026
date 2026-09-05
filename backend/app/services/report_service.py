import io
import csv
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
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
    if state and state != "National":
        query = query.filter(func.lower(Work.state) == state.strip().lower())
    
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


def _get_styles():
    styles = getSampleStyleSheet()
    header_title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        alignment=1,
        fontName='Helvetica-Bold'
    )
    header_sub_style = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#991b1b'),
        alignment=1,
        fontName='Helvetica-Bold'
    )
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1e293b')
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    return {
        'title': header_title_style,
        'subtitle': header_sub_style,
        'badge': badge_style,
        'section': section_title,
        'cell': cell_style,
        'cell_bold': cell_bold,
        'normal': styles['Normal']
    }


def generate_role_specific_audit_pdf(
    db: Session,
    role: str = "ministry",
    state: Optional[str] = None,
    jurisdiction: str = "National"
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=32, leftMargin=32, topMargin=32, bottomMargin=32)
    elements = []
    st = _get_styles()

    current_date = datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')

    # -------------------------------------------------------------
    # 1. MoSPI Ministry View (National PAC Dossier)
    # -------------------------------------------------------------
    if role == "ministry":
        elements.append(Paragraph("<b>GOVERNMENT OF INDIA • MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION</b>", st['title']))
        elements.append(Paragraph("<b>NATIONAL MPLADS PARLIAMENTARY AUDIT DOSSIER (PAC COMPLIANCE)</b>", ParagraphStyle('SubT', parent=st['title'], fontSize=12, leading=15, textColor=colors.HexColor('#b45309'))))
        elements.append(Paragraph(f"Official Parliamentary Record • Generated: {current_date} • Security Classification: OFFICIAL SENSITIVE", st['subtitle']))
        elements.append(Spacer(1, 12))

        # Macro Metrics
        total_works = db.query(func.count(Work.id)).scalar() or 0
        total_outlay = db.query(func.sum(Work.allocation_amount)).scalar() or 0.0
        flagged_count = db.query(func.count(Work.id)).filter(Work.risk_score >= 60).scalar() or 0
        amount_at_risk = db.query(func.sum(Work.allocation_amount)).filter(Work.risk_score >= 60).scalar() or 0.0

        macro_table = Table([
            ["National Sanctioned Works", "Total Public Capital Outlay", "High/Critical Risk Outliers", "National Capital at Risk"],
            [f"{total_works:,}", f"₹{total_outlay/10000000:,.2f} Cr", f"{flagged_count:,} ({(flagged_count/max(1, total_works))*100:.1f}%)", f"₹{amount_at_risk/10000000:,.2f} Cr"]
        ], colWidths=[135, 135, 135, 143])
        macro_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(macro_table)
        elements.append(Spacer(1, 14))

        # Top 5 Outlier States
        elements.append(Paragraph("<b>1. Macro Inter-State Anomaly Risk Rankings:</b>", st['section']))
        elements.append(Spacer(1, 6))

        state_stats = db.query(
            Work.state,
            func.count(Work.id).label('w_count'),
            func.avg(Work.risk_score).label('avg_score'),
            func.sum(Work.allocation_amount).label('alloc')
        ).group_by(Work.state).order_by(desc('avg_score')).limit(5).all()

        state_rows = [["State / UT", "Total Works", "Average Risk Score", "State Outlay", "PAC Priority Status"]]
        for row in state_stats:
            state_rows.append([
                Paragraph(f"<b>{row.state}</b>", st['cell']),
                Paragraph(str(row.w_count), st['cell']),
                Paragraph(f"<font color='#dc2626'><b>{row.avg_score:.1f} / 100</b></font>", st['cell']),
                Paragraph(f"₹{row.alloc/10000000:.2f} Cr", st['cell']),
                Paragraph("<font color='#991b1b'><b>High Vigilance Inspection</b></font>", st['cell'])
            ])

        t_states = Table(state_rows, colWidths=[120, 80, 110, 100, 138])
        t_states.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(t_states)
        elements.append(Spacer(1, 14))

        # Top National Anomalies
        elements.append(Paragraph("<b>2. Top National Priority Projects Flagged for Public Accounts Committee Audit:</b>", st['section']))
        elements.append(Spacer(1, 6))

        top_works = db.query(Work).filter(Work.risk_score >= 60).order_by(Work.risk_score.desc()).limit(12).all()
        w_rows = [["Work ID", "State & MP", "Description", "Outlay", "Risk", "PAC Anomaly Reason"]]
        for w in top_works:
            w_rows.append([
                Paragraph(f"<b>{w.id}</b>", st['cell_bold']),
                Paragraph(f"{w.state}<br/><font color='#64748b'>{w.mp_name}</font>", st['cell']),
                Paragraph(w.work[:55] + ("..." if len(w.work)>55 else ""), st['cell']),
                Paragraph(f"₹{w.allocation_amount:,.0f}", st['cell']),
                Paragraph(f"<font color='#dc2626'><b>{w.risk_score:.0f}</b></font>", st['cell']),
                Paragraph(w.risk_reasons[0] if w.risk_reasons else "Statistical cost outlier", st['cell'])
            ])
        t_w = Table(w_rows, colWidths=[55, 105, 145, 65, 45, 133])
        t_w.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_w)

    # -------------------------------------------------------------
    # 2. State Nodal Authority View
    # -------------------------------------------------------------
    elif role == "state":
        target_state = state or jurisdiction or "Bihar"
        elements.append(Paragraph(f"<b>GOVERNMENT OF {target_state.upper()} • PLANNING & DEVELOPMENT DEPARTMENT</b>", st['title']))
        elements.append(Paragraph("<b>STATEWIDE MPLADS IMPLEMENTATION & EQUITY VIGILANCE BRIEF</b>", ParagraphStyle('SubT', parent=st['title'], fontSize=12, leading=15, textColor=colors.HexColor('#2563eb'))))
        elements.append(Paragraph(f"Statewide Audit Dossier • Jurisdiction: {target_state} • Generated: {current_date}", st['subtitle']))
        elements.append(Spacer(1, 12))

        q_state = db.query(Work).filter(func.lower(Work.state) == target_state.strip().lower())
        total_st_works = q_state.count()
        total_st_outlay = q_state.with_entities(func.sum(Work.allocation_amount)).scalar() or 0.0
        flagged_st_count = q_state.filter(Work.risk_score >= 60).count()
        amount_st_risk = q_state.filter(Work.risk_score >= 60).with_entities(func.sum(Work.allocation_amount)).scalar() or 0.0

        macro_table = Table([
            [f"Total Works in {target_state}", "Total Sanctioned Outlay", "High-Risk Projects", "State Capital at Risk"],
            [f"{total_st_works:,}", f"₹{total_st_outlay/10000000:,.2f} Cr", f"{flagged_st_count:,}", f"₹{amount_st_risk/100000:,.1f} Lakhs"]
        ], colWidths=[135, 135, 135, 143])
        macro_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(macro_table)
        elements.append(Spacer(1, 14))

        # Inter-District Equity
        elements.append(Paragraph(f"<b>1. Inter-District Anomaly Spread across {target_state}:</b>", st['section']))
        elements.append(Spacer(1, 6))

        dist_stats = q_state.with_entities(
            Work.constituency,
            func.count(Work.id).label('w_count'),
            func.avg(Work.risk_score).label('avg_score'),
            func.sum(Work.allocation_amount).label('alloc')
        ).group_by(Work.constituency).order_by(desc('avg_score')).limit(5).all()

        d_rows = [["District / Constituency", "Works Count", "Avg Risk Score", "Allocated Outlay", "Vigilance Action"]]
        for d in dist_stats:
            d_rows.append([
                Paragraph(f"<b>{d.constituency}</b>", st['cell']),
                Paragraph(str(d.w_count), st['cell']),
                Paragraph(f"<font color='#dc2626'><b>{d.avg_score:.1f}</b></font>", st['cell']),
                Paragraph(f"₹{d.alloc/10000000:.2f} Cr", st['cell']),
                Paragraph("<font color='#b45309'><b>Issue State Inspection Notice</b></font>", st['cell'])
            ])
        t_dist = Table(d_rows, colWidths=[130, 80, 100, 100, 138])
        t_dist.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(t_dist)
        elements.append(Spacer(1, 14))

        # Top Flagged State Works
        elements.append(Paragraph(f"<b>2. High-Priority State Inquiry Queue ({target_state}):</b>", st['section']))
        elements.append(Spacer(1, 6))

        st_top = q_state.filter(Work.risk_score >= 60).order_by(Work.risk_score.desc()).limit(10).all()
        w_rows = [["Work ID", "Constituency & MP", "Description", "Outlay", "Risk", "Flag Reason"]]
        for w in st_top:
            w_rows.append([
                Paragraph(f"<b>{w.id}</b>", st['cell_bold']),
                Paragraph(f"{w.constituency}<br/><font color='#64748b'>{w.mp_name}</font>", st['cell']),
                Paragraph(w.work[:55] + "...", st['cell']),
                Paragraph(f"₹{w.allocation_amount:,.0f}", st['cell']),
                Paragraph(f"<font color='#dc2626'><b>{w.risk_score:.0f}</b></font>", st['cell']),
                Paragraph(w.risk_reasons[0] if w.risk_reasons else "Anomaly detected", st['cell'])
            ])
        t_w = Table(w_rows, colWidths=[55, 105, 145, 65, 45, 133])
        t_w.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_w)

    # -------------------------------------------------------------
    # 3. District Magistrate (DM) View
    # -------------------------------------------------------------
    elif role == "district":
        target_dist = jurisdiction or "DARBHANGA"
        elements.append(Paragraph(f"<b>OFFICE OF THE DISTRICT MAGISTRATE & COLLECTORATE • {target_dist.upper()}</b>", st['title']))
        elements.append(Paragraph("<b>STATUTORY PRE-SANCTION VERIFICATION & TENDER STRUCTURING AUDIT</b>", ParagraphStyle('SubT', parent=st['title'], fontSize=12, leading=15, textColor=colors.HexColor('#dc2626'))))
        elements.append(Paragraph(f"Statutory Collectorate Record • District: {target_dist} • Generated: {current_date}", st['subtitle']))
        elements.append(Spacer(1, 12))

        q_dist = db.query(Work).filter(
            or_(
                func.lower(Work.constituency).like(f"%{target_dist.strip().lower()}%"),
                func.lower(Work.ida).like(f"%{target_dist.strip().lower()}%"),
                func.lower(Work.city).like(f"%{target_dist.strip().lower()}%")
            )
        )
        total_dist_works = q_dist.count()
        total_dist_outlay = q_dist.with_entities(func.sum(Work.allocation_amount)).scalar() or 0.0
        
        # Structuring proofs count
        structuring_q = q_dist.filter(
            or_(
                Work.predicted_fraud_type == "structuring",
                and_(Work.allocation_amount >= 450000, Work.allocation_amount < 500000)
            )
        )
        structuring_count = structuring_q.count()
        structuring_amt = structuring_q.with_entities(func.sum(Work.allocation_amount)).scalar() or 0.0

        macro_table = Table([
            [f"Total Works Submitted ({target_dist})", "Approved Capital Outlay", "₹5L Structuring Smurfing Alarms", "Structured Outlay Under Review"],
            [f"{total_dist_works:,}", f"₹{total_dist_outlay/10000000:,.2f} Cr", f"{structuring_count} works", f"₹{structuring_amt/100000:,.1f} Lakhs"]
        ], colWidths=[135, 135, 135, 143])
        macro_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7f1d1d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(macro_table)
        elements.append(Spacer(1, 14))

        # Proof 1: Structuring Proofs
        elements.append(Paragraph("<b>1. Statutory Structuring / Smurfing Proofs (E-Tender Threshold Evasion):</b>", st['section']))
        elements.append(Paragraph("<i>The following proposals are clustered between ₹4,80,000 and ₹4,99,000, specifically calculated to bypass the statutory ₹5,00,000 open e-tendering requirement:</i>", st['subtitle']))
        elements.append(Spacer(1, 6))

        struct_items = structuring_q.order_by(Work.allocation_amount.desc()).limit(6).all()
        s_rows = [["Work ID", "Proposal Description", "Estimate (INR)", "Threshold Delta", "DM Recommended Action"]]
        for s in struct_items:
            delta = 500000 - s.allocation_amount
            s_rows.append([
                Paragraph(f"<b>{s.id}</b>", st['cell_bold']),
                Paragraph(s.work[:50] + "...", st['cell']),
                Paragraph(f"<b>₹{s.allocation_amount:,.0f}</b>", st['cell']),
                Paragraph(f"<font color='#dc2626'>-₹{delta:,.0f} below ₹5L</font>", st['cell']),
                Paragraph("<font color='#b91c1c'><b>Halt Sanction & Club into E-Tender</b></font>", st['cell'])
            ])
        if len(s_rows) > 1:
            t_struct = Table(s_rows, colWidths=[65, 170, 85, 95, 133])
            t_struct.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#991b1b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(t_struct)
        elements.append(Spacer(1, 14))

        # Proof 2: Pre-Sanction Priority Queue
        elements.append(Paragraph("<b>2. Pre-Sanction Triage Queue (Action Required by Collectorate):</b>", st['section']))
        elements.append(Spacer(1, 6))

        top_dist = q_dist.filter(Work.risk_score >= 60).order_by(Work.risk_score.desc()).limit(8).all()
        w_rows = [["Work ID", "Recommending MP", "Work Title", "Amount", "Risk Score", "Primary Anomaly Reason"]]
        for w in top_dist:
            w_rows.append([
                Paragraph(f"<b>{w.id}</b>", st['cell_bold']),
                Paragraph(w.mp_name, st['cell']),
                Paragraph(w.work[:50] + "...", st['cell']),
                Paragraph(f"₹{w.allocation_amount:,.0f}", st['cell']),
                Paragraph(f"<font color='#dc2626'><b>{w.risk_score:.0f}</b></font>", st['cell']),
                Paragraph(w.risk_reasons[0] if w.risk_reasons else "Anomaly detected", st['cell'])
            ])
        t_w = Table(w_rows, colWidths=[55, 110, 150, 65, 55, 113])
        t_w.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_w)

    # -------------------------------------------------------------
    # 4. Member of Parliament (MP) View
    # -------------------------------------------------------------
    else:
        target_mp = jurisdiction or "Mr Gopal Jee Thakur"
        elements.append(Paragraph(f"<b>PARLIAMENTARY CONSTITUENCY REPORT • {target_mp.upper()}</b>", st['title']))
        elements.append(Paragraph("<b>MPLADS CONSTITUENCY FUND UTILIZATION & ASSET EXECUTION SCORECARD</b>", ParagraphStyle('SubT', parent=st['title'], fontSize=12, leading=15, textColor=colors.HexColor('#047857'))))
        elements.append(Paragraph(f"Official Constituent Record • Representative: {target_mp} • Generated: {current_date}", st['subtitle']))
        elements.append(Spacer(1, 12))

        q_mp = db.query(Work).filter(func.lower(Work.mp_name) == target_mp.strip().lower())
        total_mp_works = q_mp.count()
        total_mp_outlay = q_mp.with_entities(func.sum(Work.allocation_amount)).scalar() or 0.0
        
        # Stalled works
        stalled_q = q_mp.filter(Work.days_since_recommended >= 180, Work.status != "Completed")
        stalled_count = stalled_q.count()
        stalled_amt = stalled_q.with_entities(func.sum(Work.allocation_amount)).scalar() or 0.0
        utilization_pct = min(100, round((total_mp_outlay / 50000000) * 100))

        macro_table = Table([
            ["Recommended Works", "Constituency Fund Outlay", "₹5 Cr Statutory Utilization", "Stalled Projects (>180 Days Delay)"],
            [f"{total_mp_works:,}", f"₹{total_mp_outlay/10000000:,.2f} Cr", f"{utilization_pct}% Utilized", f"{stalled_count} Delayed Works"]
        ], colWidths=[135, 135, 135, 143])
        macro_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#064e3b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(macro_table)
        elements.append(Spacer(1, 14))

        # Proof 1: Stalled Projects Evidence
        elements.append(Paragraph("<b>1. Stalled Project Accountability Evidence (Hold Executing Agencies Liable):</b>", st['section']))
        elements.append(Paragraph("<i>The following projects recommended by the MP have suffered excessive delays (>180 days) in administrative approval or execution:</i>", st['subtitle']))
        elements.append(Spacer(1, 6))

        stalled_items = stalled_q.order_by(Work.days_since_recommended.desc()).limit(6).all()
        s_rows = [["Work ID", "Project Title", "Nominated Agency (IDA)", "Delay", "Remedial Directive"]]
        for s in stalled_items:
            s_rows.append([
                Paragraph(f"<b>{s.id}</b>", st['cell_bold']),
                Paragraph(s.work[:50] + "...", st['cell']),
                Paragraph(s.ida[:25], st['cell']),
                Paragraph(f"<font color='#dc2626'><b>{s.days_since_recommended} Days</b></font>", st['cell']),
                Paragraph("<font color='#b45309'><b>Summon IDA to District Review</b></font>", st['cell'])
            ])
        if len(s_rows) > 1:
            t_stalled = Table(s_rows, colWidths=[65, 175, 105, 65, 138])
            t_stalled.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(t_stalled)
        elements.append(Spacer(1, 14))

        # Proof 2: Constituency Public Asset Audit
        elements.append(Paragraph("<b>2. Active Constituency Development Asset Ledger:</b>", st['section']))
        elements.append(Spacer(1, 6))

        mp_works = q_mp.order_by(Work.allocation_amount.desc()).limit(8).all()
        w_rows = [["Work ID", "Asset Description", "Panchayat / Location", "Sanction", "Status", "Integrity"]]
        for w in mp_works:
            w_rows.append([
                Paragraph(f"<b>{w.id}</b>", st['cell_bold']),
                Paragraph(w.work[:50] + "...", st['cell']),
                Paragraph(w.constituency, st['cell']),
                Paragraph(f"₹{w.allocation_amount:,.0f}", st['cell']),
                Paragraph(w.status, st['cell']),
                Paragraph(f"<font color='{'#16a34a' if w.risk_score<50 else '#dc2626'}'><b>{w.risk_score:.0f}/100</b></font>", st['cell'])
            ])
        t_w = Table(w_rows, colWidths=[55, 150, 110, 75, 75, 83])
        t_w.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_w)

    doc.build(elements)
    return buffer.getvalue()


# Alias for backward compatibility
def generate_audit_pdf(db: Session, state: str = None, jurisdiction: str = "National") -> bytes:
    return generate_role_specific_audit_pdf(db=db, role="ministry", state=state, jurisdiction=jurisdiction)
