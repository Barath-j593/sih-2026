import os
import sys
import uuid
import json
from pathlib import Path
from datetime import datetime, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.work import Work
from app.models.mp import MP
from app.models.ida import IDA
from app.models.constituency import Constituency
from app.models.user import User
from app.models.alert import Alert
from app.models.case import Case
from app.ml.inference.predict_risk_score import predict_works_risk

def load_real_mplads_data(db: Session, max_rows: int = None, force_reload: bool = False):
    """
    Loads and scores the real public MPLADS dataset (MPLADS_cleaned_featured.csv).
    Populates Works, MPs, IDAs, Constituencies, Alerts, Cases, and Demo Users.
    """
    # 1. Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # If force reload, clean up old records first
    if force_reload:
        print("Cleaning up existing database records before reload...")
        db.query(Alert).delete()
        db.query(Case).delete()
        db.query(Work).delete()
        db.query(MP).delete()
        db.query(IDA).delete()
        db.query(Constituency).delete()
        db.commit()

    # Check if fused 8-model intelligence CSV exists
    fused_csv = Path(__file__).resolve().parent / "processed" / "fused_risk_intelligence.csv"
    if fused_csv.exists():
        existing_works = db.query(Work).count()
        if existing_works == 5000 and not force_reload:
            print(f"Database already contains {existing_works} synced 8-model works. Skipping reload.")
            return existing_works
        print("Synchronizing relational database with 8-model fused risk intelligence...")
        from app.services.sync_service import sync_fused_risk_to_database
        res = sync_fused_risk_to_database(db, force=force_reload)
        return res["works_synced"]

    # Find the CSV file
    csv_candidates = [
        Path(settings.CSV_DATA_PATH),
        Path(__file__).resolve().parent.parent.parent.parent / "MPLADS_cleaned_featured.csv",
        Path(__file__).resolve().parent.parent.parent / "data" / "raw" / "MPLADS_cleaned_featured.csv"
    ]

    csv_path = None
    for cand in csv_candidates:
        if cand.exists():
            csv_path = cand
            break

    if not csv_path:
        print(f"Warning: CSV file not found at any candidate path. Checked: {csv_candidates}")
        return 0

    print(f"Reading real MPLADS data from: {csv_path}")
    df = pd.read_csv(csv_path, nrows=max_rows)
    print(f"Loaded {len(df)} records from CSV.")

    # 1. Run ML inference & scoring
    print("Executing ML scoring and risk explainability pipeline on real data...")
    scored_df = predict_works_risk(df)
    print("ML scoring completed successfully.")

    # 2. Recreate tables
    Base.metadata.create_all(bind=engine)

    # 3. Insert Works
    print(f"Inserting {len(scored_df)} scored works into database...")
    work_objects = []
    
    for idx, row in scored_df.iterrows():
        w_id = f"W-{idx+10001}"
        
        work_obj = Work(
            id=w_id,
            mp_name=str(row.get("MP_NAME", "Unknown MP")),
            work=str(row.get("WORK", "General Public Works")),
            category=str(row.get("CATEGORY", "Normal/Others")),
            state=str(row.get("STATE", "Unassigned")),
            constituency=str(row.get("CONSTITUENCY", "Unassigned")),
            ida=str(row.get("IDA", "District Authority")),
            city=str(row.get("CITY", "")) if pd.notnull(row.get("CITY")) else "",
            ward=str(row.get("WARD", "")) if pd.notnull(row.get("WARD")) else "",
            block=str(row.get("BLOCK", "")) if pd.notnull(row.get("BLOCK")) else "",
            village=str(row.get("VILLAGE", "")) if pd.notnull(row.get("VILLAGE")) else "",
            recommended_date=str(row.get("RECOMMENDED_DATE", "2024-01-01")),
            allocation_amount=float(row.get("ALLOCATION_AMOUNT", 0.0) or 0.0),
            ida_approval=str(row.get("IDA_APPROVAL", "Action Pending")),
            status=str(row.get("STATUS", "Unsanctioned")),
            house=str(row.get("HOUSE", "Lok Sabha")),
            
            state_mean_alloc=float(row.get("STATE_MEAN_ALLOC", 0.0) or 0.0),
            alloc_zscore_state=float(row.get("ALLOC_ZSCORE_STATE", 0.0) or 0.0),
            work_type=str(row.get("WORK_TYPE", "General")),
            alloc_zscore_worktype=float(row.get("ALLOC_ZSCORE_WORKTYPE", 0.0) or 0.0),
            duplicate_count=int(row.get("DUPLICATE_COUNT", 1) or 1),
            is_duplicate_candidate=bool(row.get("IS_DUPLICATE_CANDIDATE", False)),
            ida_work_count=int(row.get("IDA_WORK_COUNT", 1) or 1),
            mp_total_works=int(row.get("MP_TOTAL_WORKS", 1) or 1),
            mp_total_allocation=float(row.get("MP_TOTAL_ALLOCATION", 0.0) or 0.0),
            
            risk_score=float(row.get("RISK_SCORE", 0.0)),
            risk_level=str(row.get("RISK_LEVEL", "Low")),
            risk_reasons=row.get("RISK_REASONS", []),
            sub_scores=row.get("SUB_SCORES", {}),
            predicted_fraud_type=str(row.get("PREDICTED_FRAUD_TYPE", "none")),
            days_since_recommended=int(row.get("DAYS_SINCE_RECOMMENDED", 0) or 0)
        )
        work_objects.append(work_obj)

        if len(work_objects) >= 500:
            db.add_all(work_objects)
            db.commit()
            work_objects = []

    if work_objects:
        db.add_all(work_objects)
        db.commit()

    print("Works loaded. Aggregating MPs, IDAs, and Constituencies...")

    # 4. Populate MP Aggregates
    mp_groups = scored_df.groupby("MP_NAME")
    for mp_name, grp in mp_groups:
        top_idas = grp["IDA"].value_counts().head(5).to_dict()
        top_cats = grp["WORK_TYPE"].value_counts().head(5).to_dict()
        
        mp_rec = MP(
            id=f"MP-{str(uuid.uuid4())[:8]}",
            name=mp_name,
            state=grp["STATE"].iloc[0] if len(grp) else "India",
            constituency=grp["CONSTITUENCY"].iloc[0] if len(grp) else "Constituency",
            house=grp["HOUSE"].iloc[0] if "HOUSE" in grp.columns and len(grp) else "Lok Sabha",
            total_works=len(grp),
            total_allocation=float(grp["ALLOCATION_AMOUNT"].sum()),
            avg_risk_score=round(float(grp["RISK_SCORE"].mean()), 1),
            flagged_works_count=int((grp["RISK_SCORE"] >= 60).sum()),
            top_idas=[{"name": k, "count": int(v)} for k, v in top_idas.items()],
            top_work_categories=[{"category": k, "count": int(v)} for k, v in top_cats.items()]
        )
        db.add(mp_rec)

    # 5. Populate IDA Aggregates
    ida_groups = scored_df.groupby("IDA")
    for ida_name, grp in ida_groups:
        associated_mps = grp["MP_NAME"].value_counts().head(5).to_dict()
        ida_rec = IDA(
            id=f"IDA-{str(uuid.uuid4())[:8]}",
            name=ida_name,
            state=grp["STATE"].iloc[0] if len(grp) else "State",
            district=grp["CONSTITUENCY"].iloc[0].replace(" Constituency", "") if len(grp) else "District",
            total_works=len(grp),
            total_allocation=float(grp["ALLOCATION_AMOUNT"].sum()),
            avg_risk_score=round(float(grp["RISK_SCORE"].mean()), 1),
            flagged_works_count=int((grp["RISK_SCORE"] >= 60).sum()),
            concentration_ratio=round(float(grp["IDA_MP_WORK_SHARE"].max() if "IDA_MP_WORK_SHARE" in grp.columns else 0.5), 3),
            associated_mps=[{"name": k, "works": int(v)} for k, v in associated_mps.items()]
        )
        db.add(ida_rec)

    # 6. Populate Constituencies
    const_groups = scored_df.groupby("CONSTITUENCY")
    for const_name, grp in const_groups:
        const_rec = Constituency(
            id=f"CONST-{str(uuid.uuid4())[:8]}",
            name=const_name,
            state=grp["STATE"].iloc[0] if len(grp) else "State",
            district=const_name.split("(")[0].strip(),
            mp_name=grp["MP_NAME"].iloc[0] if len(grp) else "MP",
            total_works=len(grp),
            total_allocation=float(grp["ALLOCATION_AMOUNT"].sum()),
            avg_risk_score=round(float(grp["RISK_SCORE"].mean()), 1),
            flagged_works_count=int((grp["RISK_SCORE"] >= 60).sum()),
            latitude=20.5937 + (hash(const_name) % 100) / 20.0,
            longitude=78.9629 + (hash(const_name[::-1]) % 100) / 20.0
        )
        db.add(const_rec)

    # 7. Seed Demo Users
    demo_users = [
        User(
            id="usr-ministry",
            username="ministry_admin",
            email="ministry@mospi.gov.in",
            hashed_password=get_password_hash("ministry123"),
            full_name="MoSPI Central Monitoring Directorate",
            role="ministry",
            jurisdiction="National",
            department="Ministry of Statistics and Programme Implementation"
        ),
        User(
            id="usr-state-bihar",
            username="state_nodal_bihar",
            email="nodal.bihar@gov.in",
            hashed_password=get_password_hash("state123"),
            full_name="State Nodal Officer (Bihar)",
            role="state",
            jurisdiction="Bihar",
            department="Planning & Development Department, Govt of Bihar"
        ),
        User(
            id="usr-state-rajasthan",
            username="state_nodal_rajasthan",
            email="nodal.rajasthan@gov.in",
            hashed_password=get_password_hash("state123"),
            full_name="State Nodal Officer (Rajasthan)",
            role="state",
            jurisdiction="Rajasthan",
            department="Department of Rural Development, Govt of Rajasthan"
        ),
        User(
            id="usr-district-darbhanga",
            username="district_darbhanga",
            email="dm.darbhanga@bihar.gov.in",
            hashed_password=get_password_hash("district123"),
            full_name="District Magistrate (Darbhanga)",
            role="district",
            jurisdiction="DARBHANGA",
            department="District Collectorate, Darbhanga"
        ),
        User(
            id="usr-mp-gopal",
            username="mp_gopal_jee",
            email="gopal.thakur@sansad.nic.in",
            hashed_password=get_password_hash("mp123"),
            full_name="Mr Gopal Jee Thakur (MP)",
            role="mp",
            jurisdiction="Mr Gopal Jee Thakur",
            department="Lok Sabha Secretariat (Darbhanga Constituency)"
        ),
    ]
    for u in demo_users:
        db.merge(u)

    # 8. Seed Top Alerts
    top_flagged = scored_df[scored_df["RISK_SCORE"] >= 75].head(25)
    for idx, row in top_flagged.iterrows():
        reasons_text = " • ".join(row.get("RISK_REASONS", ["Anomalous allocation pattern detected"]))
        alert = Alert(
            id=f"ALT-{str(uuid.uuid4())[:8]}",
            title=f"High Risk Flag: {row.get('WORK', 'Work')} (Risk: {row.get('RISK_SCORE', 80):.0f})",
            description=f"{reasons_text}. MP: {row.get('MP_NAME')} | IDA: {row.get('IDA')} | Amount: ₹{row.get('ALLOCATION_AMOUNT', 0):,.0f}",
            severity="Critical" if row.get("RISK_SCORE", 80) >= 85 else "High",
            work_id=f"W-{idx+10001}",
            mp_name=str(row.get("MP_NAME", "")),
            state=str(row.get("STATE", "")),
            district=str(row.get("CONSTITUENCY", "")),
            ida=str(row.get("IDA", "")),
            fraud_type=str(row.get("PREDICTED_FRAUD_TYPE", "overpricing")),
            risk_score=float(row.get("RISK_SCORE", 80)),
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=int(idx * 3))
        )
        db.add(alert)

    # 9. Seed Investigation Cases
    case_samples = scored_df[scored_df["RISK_SCORE"] >= 70].head(12)
    statuses = ["flagged", "under_review", "under_review", "resolved"]
    for i, (_, row) in enumerate(case_samples.iterrows()):
        c_status = statuses[i % len(statuses)]
        c_num = f"SETU-2026-CASE-{1001 + i}"
        f_type = row.get("PREDICTED_FRAUD_TYPE", "overpricing")
        
        notes = [
            {
                "author": "SETU AI Anomaly Engine",
                "text": f"Automated flag triggered with composite risk score of {row.get('RISK_SCORE', 75):.1f}/100. Primary fraud typology: {f_type}.",
                "timestamp": (datetime.utcnow() - timedelta(days=5 - i)).strftime("%Y-%m-%d %H:%M"),
                "status_change": "flagged"
            }
        ]
        if c_status in ["under_review", "resolved"]:
            notes.append({
                "author": "District Inspection Officer",
                "text": f"Initiated field inquiry with {row.get('IDA')}. Requested technical estimate sheets and contractor work orders.",
                "timestamp": (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d %H:%M"),
                "status_change": "under_review"
            })
        if c_status == "resolved":
            notes.append({
                "author": "State Nodal Director",
                "text": "Corrective notice served. Allocation revised to match PWD rates. Overpricing variance recovered.",
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
                "status_change": "resolved"
            })

        case_obj = Case(
            id=f"CASE-{str(uuid.uuid4())[:8]}",
            case_number=c_num,
            title=f"Investigation: {f_type.replace('_', ' ').title()} in {row.get('WORK', 'Work')[:60]}",
            description=f"Automated risk detection identified potential {f_type} for allocation ₹{row.get('ALLOCATION_AMOUNT', 0):,.0f} in {row.get('STATE')}.",
            status=c_status,
            priority="critical" if row.get("RISK_SCORE", 75) >= 85 else "high",
            work_id=f"W-{10001 + int(row.name if isinstance(row.name, int) else 0)}",
            mp_name=str(row.get("MP_NAME", "")),
            state=str(row.get("STATE", "")),
            district=str(row.get("CONSTITUENCY", "")),
            ida=str(row.get("IDA", "")),
            risk_score=float(row.get("RISK_SCORE", 75)),
            fraud_type=f_type,
            assigned_to="District Vigilance Cell",
            notes=notes
        )
        db.add(case_obj)

    db.commit()
    print("Database seeding and aggregation completed successfully!")
    return len(scored_df)

if __name__ == "__main__":
    db = SessionLocal()
    try:
        load_real_mplads_data(db, max_rows=15000, force_reload=True)
    finally:
        db.close()
