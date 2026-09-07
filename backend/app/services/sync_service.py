"""Service to synchronize 8-model fused risk intelligence into the relational database.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from datetime import datetime, timedelta
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings, BASE_DIR
from app.core.database import Base, engine
from app.core.security import get_password_hash
from app.models.alert import Alert
from app.models.case import Case
from app.models.constituency import Constituency
from app.models.ida import IDA
from app.models.mp import MP
from app.models.user import User
from app.models.work import Work
from app.core.district_names import resolve_district_name, resolve_constituency_name


def seed_demo_users(db: Session) -> None:
    """Ensure standard demo users are seeded for testing and frontend demonstration."""
    demo_users = [
        User(
            id="usr-ministry",
            username="ministry_admin",
            email="ministry@mospi.gov.in",
            hashed_password=get_password_hash("ministry123"),
            full_name="MoSPI Central Monitoring Directorate",
            role="ministry",
            jurisdiction="National",
            department="Ministry of Statistics and Programme Implementation",
        ),
        User(
            id="usr-state-bihar",
            username="state_nodal_bihar",
            email="nodal.bihar@gov.in",
            hashed_password=get_password_hash("state123"),
            full_name="State Nodal Officer (Bihar)",
            role="state",
            jurisdiction="Bihar",
            department="Planning & Development Department, Govt of Bihar",
        ),
        User(
            id="usr-state-rajasthan",
            username="state_nodal_rajasthan",
            email="nodal.rajasthan@gov.in",
            hashed_password=get_password_hash("state123"),
            full_name="State Nodal Officer (Rajasthan)",
            role="state",
            jurisdiction="Rajasthan",
            department="Department of Rural Development, Govt of Rajasthan",
        ),
        User(
            id="usr-district-darbhanga",
            username="district_darbhanga",
            email="dm.darbhanga@bihar.gov.in",
            hashed_password=get_password_hash("district123"),
            full_name="District Magistrate (Darbhanga)",
            role="district",
            jurisdiction="DARBHANGA",
            department="District Collectorate, Darbhanga",
        ),
        User(
            id="usr-mp-gopal",
            username="mp_gopal_jee",
            email="gopal.thakur@sansad.nic.in",
            hashed_password=get_password_hash("mp123"),
            full_name="Mr Gopal Jee Thakur (MP)",
            role="mp",
            jurisdiction="Mr Gopal Jee Thakur",
            department="Lok Sabha Secretariat (Darbhanga Constituency)",
        ),
    ]
    for u in demo_users:
        db.merge(u)
    db.commit()


def sync_fused_risk_to_database(
    db: Session,
    force: bool = False,
    data_dir: Optional[Path] = None,
) -> Dict[str, int]:
    """Sync the 5,000 national projects from fused_risk_intelligence.csv into Works, Alerts, Cases, and Aggregates."""
    base_data_dir = data_dir or (Path(BASE_DIR) / "app" / "ml" / "data" / "processed")
    synthetic_dir = Path(BASE_DIR) / "data" / "synthetic"

    fused_csv = base_data_dir / "fused_risk_intelligence.csv"
    projects_csv = synthetic_dir / "01_projects.csv"
    financials_csv = synthetic_dir / "02_financials.csv"
    constituencies_csv = synthetic_dir / "10_constituencies.csv"
    agencies_csv = synthetic_dir / "08_agencies.csv"

    if not fused_csv.exists():
        raise FileNotFoundError(f"Fused risk intelligence file missing: {fused_csv}")
    if not projects_csv.exists() or not financials_csv.exists():
        raise FileNotFoundError(f"Synthetic base CSVs missing in {synthetic_dir}")

    # Check existing works count
    existing_count = db.query(Work).count()
    if existing_count == 5000 and not force:
        # Also ensure demo users are present
        seed_demo_users(db)
        print(f"Database already synchronized with {existing_count} works. Skipping sync.")
        return {
            "works_synced": existing_count,
            "alerts_created": db.query(Alert).count(),
            "cases_created": db.query(Case).count(),
        }

    print("Reading fused intelligence, projects, financials, constituencies, and agencies...")
    df_fused = pd.read_csv(fused_csv)
    df_projects = pd.read_csv(projects_csv)
    df_financials = pd.read_csv(financials_csv)
    
    merged = df_fused.merge(df_projects, on="project_id", how="inner").merge(
        df_financials, on="project_id", how="inner"
    )

    if constituencies_csv.exists():
        df_const = pd.read_csv(constituencies_csv)[["constituency_id", "mp_name", "mp_house"]]
        merged = merged.merge(df_const, on="constituency_id", how="left")

    if agencies_csv.exists():
        df_agency = pd.read_csv(agencies_csv)[["agency_id", "agency_name"]]
        merged = merged.merge(df_agency, on="agency_id", how="left")

    print(f"Successfully merged {len(merged)} records.")

    # 1. Clean up existing records for clean sync
    print("Clearing previous database records for clean synchronization...")
    db.query(Alert).delete()
    db.query(Case).delete()
    db.query(Work).delete()
    db.query(MP).delete()
    db.query(IDA).delete()
    db.query(Constituency).delete()
    db.commit()

    # Ensure demo users are seeded
    seed_demo_users(db)

    # Precalculate aggregates for quick lookup
    mp_total_counts = merged.groupby("constituency_id")["project_id"].count().to_dict()
    mp_total_funds = merged.groupby("constituency_id")["sanctioned_amount"].sum().to_dict()
    ida_work_counts = merged.groupby("agency_id")["project_id"].count().to_dict()

    # 2. Insert Works
    print("Inserting 5,000 unified works into relational store...")
    work_objects: List[Work] = []
    alert_objects: List[Alert] = []
    case_objects: List[Case] = []

    for _, row in merged.iterrows():
        p_id = str(row["project_id"])
        risk_score = float(row["overall_risk_score"])
        risk_level = str(row["risk_level"]).capitalize()
        priority = str(row["investigation_priority"]).upper()
        typology = str(row["primary_typology"])

        reasons_list = (
            json.loads(row["synthesized_reasons"])
            if pd.notna(row["synthesized_reasons"])
            else [str(row["primary_reason"])]
        )

        sub_scores_dict = {
            "financial": float(row["financial_anomaly_score"]),
            "geospatial": float(row["geospatial_anomaly_score"]),
            "procurement": float(row["procurement_anomaly_score"]),
            "contractor": float(row["contractor_anomaly_score"]),
            "payment": float(row["payment_anomaly_score"]),
            "progress": float(row["progress_anomaly_score"]),
            "graph": float(row["graph_anomaly_score"]),
            "ml_fraud_probability": round(float(row["fraud_probability"]) * 100.0, 1),
        }

        cid = str(row.get("constituency_id", ""))
        aid = str(row.get("agency_id", ""))
        mp_name = str(row.get("mp_name", f"MP ({row.get('constituency_name', 'National')})"))
        agency_name = str(row.get("agency_name", f"District Authority {aid}"))
        house = str(row.get("mp_house", "Lok Sabha"))

        st_name = str(row.get("state_name", "National"))
        raw_dist = str(row.get("district_name", ""))
        raw_const = str(row.get("constituency_name", "Constituency"))
        resolved_dist = resolve_district_name(raw_dist, st_name)
        resolved_const = resolve_constituency_name(raw_const, st_name)

        if resolved_dist.lower() == "darbhanga":
            mp_name = "Mr Gopal Jee Thakur"
        elif resolved_dist.lower() == "saran":
            mp_name = "Rajiv Pratap Rudy"

        w_obj = Work(
            id=p_id,
            mp_name=mp_name,
            work=str(row.get("work_name", "Public Infrastructure Work")),
            category=str(row.get("category", "Public Infrastructure")),
            state=st_name,
            constituency=resolved_const,
            ida=agency_name,
            city=resolved_dist,
            recommended_date=str(row.get("recommendation_date", "2023-01-01")),
            allocation_amount=float(row.get("sanctioned_amount", 0.0) or 0.0),
            status=str(row.get("status", "SANCTIONED")),
            house=house,
            work_type=str(row.get("work_type", "General")),
            duplicate_count=1,
            ida_work_count=ida_work_counts.get(aid, 1),
            mp_total_works=mp_total_counts.get(cid, 1),
            mp_total_allocation=float(mp_total_funds.get(cid, 0.0)),
            risk_score=risk_score,
            risk_level=risk_level,
            risk_reasons=reasons_list,
            sub_scores=sub_scores_dict,
            predicted_fraud_type=typology.lower(),
            days_since_recommended=int(row.get("planned_duration_days", 180) or 180),
        )
        work_objects.append(w_obj)

        # Create Alert for CRITICAL and HIGH risk works
        if risk_level in ["Critical", "High"]:
            alert_obj = Alert(
                id=f"ALT-{p_id}",
                title=f"{risk_level} Anomaly: {typology.replace('_', ' ').title()} on {p_id}",
                description=str(row.get("primary_reason", "Statistical multi-signal anomaly detected")),
                severity=risk_level,
                work_id=p_id,
                mp_name=mp_name,
                state=st_name,
                district=resolved_dist,
                ida=agency_name,
                fraud_type=typology,
                risk_score=risk_score,
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=int(len(alert_objects) % 72)),
            )
            alert_objects.append(alert_obj)

        # Create formal Case for top critical projects (risk score >= 85.0)
        if risk_score >= 85.0:
            case_obj = Case(
                id=f"CASE-{p_id}",
                case_number=f"SETU-2026-{p_id}",
                title=f"Vigilance Investigation: {typology.replace('_', ' ').title()} ({p_id})",
                description=(
                    f"Automated case file opened following {risk_level} multi-evidence triangulation. "
                    f"Primary Evidence: {row.get('primary_reason', '')}. Investigation Priority: {priority}."
                ),
                status="flagged",
                priority="critical",
                work_id=p_id,
                mp_name=mp_name,
                state=st_name,
                district=resolved_dist,
                ida=agency_name,
                risk_score=risk_score,
                fraud_type=typology,
                assigned_to="Central Vigilance Directorate",
                notes=[
                    {
                        "author": "SETU Multi-Signal Risk Engine",
                        "text": f"Case automatically generated with calibrated composite risk score {risk_score:.1f}/100.",
                        "timestamp": datetime.utcnow().isoformat(),
                        "status_change": "flagged",
                    }
                ],
            )
            case_objects.append(case_obj)

        if len(work_objects) >= 500:
            db.add_all(work_objects)
            db.commit()
            work_objects = []

    if work_objects:
        db.add_all(work_objects)
        db.commit()

    print(f"Works synced: 5,000. Adding {len(alert_objects)} alerts and {len(case_objects)} cases...")
    db.add_all(alert_objects)
    db.add_all(case_objects)
    db.commit()

    # 3. Populate MP, IDA, and Constituency administrative aggregates
    print("Populating MP, Agency, and Constituency administrative aggregates...")
    
    # MP Aggregates
    # MP Aggregates
    seen_mp_names = set()
    mp_groups = merged.groupby("constituency_id")
    for const_id, grp in mp_groups:
        raw_mp_name = str(grp["mp_name"].iloc[0]) if "mp_name" in grp.columns and pd.notna(grp["mp_name"].iloc[0]) else f"MP ({grp['constituency_name'].iloc[0]})"
        mp_name = raw_mp_name
        if mp_name in seen_mp_names:
            mp_name = f"{raw_mp_name} ({const_id})"
        seen_mp_names.add(mp_name)

        house = str(grp["mp_house"].iloc[0]) if "mp_house" in grp.columns and pd.notna(grp["mp_house"].iloc[0]) else "Lok Sabha"
        top_idas = grp["agency_id"].value_counts().head(5).to_dict()
        top_cats = grp["category"].value_counts().head(5).to_dict()
        mp_rec = MP(
            id=f"MP-{str(const_id).replace(' ', '-').lower()[:32]}",
            name=mp_name,
            state=str(grp["state_name"].iloc[0]),
            constituency=str(grp["constituency_name"].iloc[0]),
            house=house,
            total_works=len(grp),
            total_allocation=float(grp["sanctioned_amount"].sum()),
            avg_risk_score=round(float(grp["overall_risk_score"].mean()), 1),
            flagged_works_count=int((grp["overall_risk_score"] >= 60.0).sum()),
            top_idas=[{"name": k, "count": int(v)} for k, v in top_idas.items()],
            top_work_categories=[{"category": k, "count": int(v)} for k, v in top_cats.items()],
        )
        db.add(mp_rec)

    # IDA Aggregates
    seen_ida_names = set()
    ida_groups = merged.groupby("agency_id")
    for ida_id, grp in ida_groups:
        raw_agency_name = str(grp["agency_name"].iloc[0]) if "agency_name" in grp.columns and pd.notna(grp["agency_name"].iloc[0]) else f"District Authority {ida_id}"
        agency_name = raw_agency_name
        if agency_name in seen_ida_names:
            agency_name = f"{raw_agency_name} ({ida_id})"
        seen_ida_names.add(agency_name)

        ida_state = str(grp["state_name"].iloc[0])
        ida_district = resolve_district_name(str(grp["district_name"].iloc[0]), ida_state)
        top_mps = grp["constituency_name"].value_counts().head(5).to_dict()
        ida_rec = IDA(
            id=f"IDA-{ida_id}",
            name=agency_name,
            state=ida_state,
            district=ida_district,
            total_works=len(grp),
            total_allocation=float(grp["sanctioned_amount"].sum()),
            avg_risk_score=round(float(grp["overall_risk_score"].mean()), 1),
            flagged_works_count=int((grp["overall_risk_score"] >= 60.0).sum()),
            concentration_ratio=round(float(grp["contractor_anomaly_score"].mean() / 100.0), 3),
            associated_mps=[{"name": f"MP ({k})", "works": int(v)} for k, v in top_mps.items()],
        )
        db.add(ida_rec)

    # Constituency Aggregates
    seen_const_names = set()
    for const_id, grp in mp_groups:
        const_state = str(grp["state_name"].iloc[0])
        raw_const_name = resolve_constituency_name(str(grp["constituency_name"].iloc[0]), const_state)
        const_name = raw_const_name
        if const_name in seen_const_names:
            const_name = f"{raw_const_name} ({const_id})"
        seen_const_names.add(const_name)

        raw_mp_name = str(grp["mp_name"].iloc[0]) if "mp_name" in grp.columns and pd.notna(grp["mp_name"].iloc[0]) else f"MP ({const_name})"
        const_district = resolve_district_name(str(grp["district_name"].iloc[0]) if "district_name" in grp.columns else "", const_state)
        const_rec = Constituency(
            id=f"CONST-{str(const_id).replace(' ', '-').lower()[:32]}",
            name=const_name,
            district=const_district,
            state=const_state,
            mp_name=raw_mp_name,
            total_works=len(grp),
            total_allocation=float(grp["sanctioned_amount"].sum()),
            avg_risk_score=round(float(grp["overall_risk_score"].mean()), 1),
            flagged_works_count=int((grp["overall_risk_score"] >= 60.0).sum()),
        )
        db.add(const_rec)

# Trailing Decision Support Generation Step (Optional / Fully Decoupled)
    ds_stats = None
    if generate_decisions:
        try:
            from app.ml.decision_support.batch_generator import run_batch_decision_support
            ds_stats = run_batch_decision_support(db, limit=decision_limit)
        except Exception as e:
            print(f"Warning: Decision support generation step skipped: {e}")

    db.commit()
    print("Database synchronization complete!")

    result = {
        "works_synced": 5000,
        "alerts_created": len(alert_objects),
        "cases_created": len(case_objects),
        "mps_populated": len(mp_groups),
        "idas_populated": len(ida_groups),
    }
    if ds_stats:
        result["decision_support"] = ds_stats
    return result
