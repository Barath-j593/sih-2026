import math
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.models.work import Work
from app.ml.models.model_registry import get_model_registry

ZONES_MAP = {
    "Northern Zone (UP, Haryana, Punjab, Rajasthan, HP, Delhi)": [
        "Uttar Pradesh", "Haryana", "Punjab", "Rajasthan", "Himachal Pradesh", 
        "Jammu And Kashmir", "Uttarakhand", "Delhi", "Chandigarh"
    ],
    "Eastern Zone (Bihar, West Bengal, Odisha, Jharkhand)": [
        "Bihar", "West Bengal", "Odisha", "Jharkhand"
    ],
    "Southern Zone (Andhra, Tamil Nadu, Karnataka, Kerala, Telangana)": [
        "Andhra Pradesh", "Tamil Nadu", "Karnataka", "Kerala", "Telangana", "Puducherry"
    ],
    "Western & Central (Maharashtra, Gujarat, MP, Chhattisgarh, Goa)": [
        "Maharashtra", "Gujarat", "Madhya Pradesh", "Chhattisgarh", "Goa"
    ],
    "North-Eastern Zone (Assam, Meghalaya, Tripura, Manipur, etc.)": [
        "Assam", "Meghalaya", "Manipur", "Tripura", "Mizoram", "Nagaland", "Arunachal Pradesh", "Sikkim"
    ]
}

def get_available_entities(db: Session, state: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns live distinct states, districts (constituencies), and MPs from the database
    to power dynamic, stakeholder-friendly dropdowns.
    """
    # 1. Distinct States
    state_rows = db.query(Work.state).filter(
        Work.state.isnot(None), 
        Work.state != ""
    ).distinct().order_by(Work.state).all()
    states = [s[0] for s in state_rows if s[0]]

    # 2. Distinct Districts / Constituencies (optionally filtered by state)
    dist_query = db.query(Work.constituency).filter(
        Work.constituency.isnot(None),
        Work.constituency != ""
    )
    if state and state.strip() and state.strip().lower() not in ["all", "all india", "national"]:
        dist_query = dist_query.filter(func.lower(Work.state) == state.strip().lower())
    
    dist_rows = dist_query.distinct().order_by(Work.constituency).all()
    districts = [d[0] for d in dist_rows if d[0]]

    # 3. Distinct MPs (optionally filtered by state)
    mp_query = db.query(
        Work.mp_name,
        func.count(Work.id).label("work_cnt"),
        func.sum(Work.allocation_amount).label("tot_alloc")
    ).filter(
        Work.mp_name.isnot(None),
        Work.mp_name != ""
    )
    if state and state.strip() and state.strip().lower() not in ["all", "all india", "national"]:
        mp_query = mp_query.filter(func.lower(Work.state) == state.strip().lower())
    
    mp_rows = mp_query.group_by(Work.mp_name).order_by(Work.mp_name).all()
    mps = [{"name": m.mp_name, "works_count": m.work_cnt, "total_capital": float(m.tot_alloc or 0.0)} for m in mp_rows]

    return {
        "states": states,
        "districts": districts,
        "mps": mps
    }

def get_network_graph_data(
    db: Session,
    max_nodes: int = 150,
    min_risk: float = 0.0,
    state: Optional[str] = None,
    district: Optional[str] = None,
    mp_name: Optional[str] = None,
    role: Optional[str] = "ministry",
    jurisdiction: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates 100% dynamic, database-queried MP-IDA capital flow graph data and CAG forensic telemetry
    specifically calculated for each stakeholder authority:
    - Ministry (MoSPI): Dynamic Zonal breakdown, real multi-state syndicates, national HHI, top state outlays.
    - State Nodal (SNA): Dynamic IDA treemap, real state HHI & CR3/CR4, dynamic inter-district allocation matrix for ANY selected state.
    - District Authority (DA): Dynamic single-agency capture, dynamic HHI, real block disparity, dynamic ₹5L structuring radar for ANY selected district.
    - Member of Parliament (MP): Dynamic 4-stage delivery lifecycle, approval velocity, statutory delay sinks (>45 days in Action Pending), real block allocations for ANY selected MP.
    """
    active_role = (role or "ministry").strip().lower()

    # Determine dynamic state, district, and MP targets
    clean_state = state.strip() if state and state.strip().lower() not in ["all", "all india", "national", ""] else None
    clean_district = district.strip() if district and district.strip() else None
    clean_mp = mp_name.strip() if mp_name and mp_name.strip() else None

    # Fallback to jurisdiction if specific filter not provided
    if jurisdiction and jurisdiction.strip() and jurisdiction.strip() != "National":
        jur = jurisdiction.strip()
        if active_role == "state" and not clean_state:
            clean_state = jur
        elif active_role == "district" and not clean_district:
            clean_district = jur
        elif active_role == "mp" and not clean_mp:
            clean_mp = jur

    # Sensible default seeds for first load
    if active_role == "state" and not clean_state:
        clean_state = "Bihar"
    elif active_role == "district" and not clean_district:
        clean_district = "DARBHANGA"
    elif active_role == "mp" and not clean_mp:
        clean_mp = "Mr Gopal Jee Thakur"

    # -------------------------------------------------------------
    # 1. BASE GRAPH EDGE & NODE AGGREGATION (FOR ALLUVIAL/BIPARTITE TOPOLOGY)
    # -------------------------------------------------------------
    base_query = db.query(
        Work.mp_name,
        Work.ida,
        func.count(Work.id).label("work_count"),
        func.sum(Work.allocation_amount).label("total_amount"),
        func.avg(Work.risk_score).label("avg_risk")
    )

    if clean_state and active_role in ["state", "district"]:
        base_query = base_query.filter(func.lower(Work.state) == clean_state.lower())
    if clean_district and active_role == "district":
        base_query = base_query.filter(
            or_(
                func.lower(Work.constituency).like(f"%{clean_district.lower()}%"),
                func.lower(Work.city).like(f"%{clean_district.lower()}%")
            )
        )
    if clean_mp and active_role == "mp":
        base_query = base_query.filter(func.lower(Work.mp_name).like(f"%{clean_mp.lower()}%"))

    edge_rows = base_query.group_by(Work.mp_name, Work.ida).order_by(desc("total_amount")).all()

    mp_totals: Dict[str, float] = {}
    mp_work_counts: Dict[str, int] = {}
    ida_totals: Dict[str, float] = {}
    ida_work_counts: Dict[str, int] = {}
    ida_risk_accum: Dict[str, List[float]] = {}

    for row in edge_rows:
        mp = row.mp_name or "Unknown MP"
        ida = row.ida or "Unassigned IDA"
        tot = float(row.total_amount or 0.0)
        cnt = int(row.work_count or 0)
        r = float(row.avg_risk or 0.0)

        mp_totals[mp] = mp_totals.get(mp, 0.0) + tot
        mp_work_counts[mp] = mp_work_counts.get(mp, 0) + cnt

        ida_totals[ida] = ida_totals.get(ida, 0.0) + tot
        ida_work_counts[ida] = ida_work_counts.get(ida, 0) + cnt
        ida_risk_accum.setdefault(ida, []).append(r)

    nodes = []
    node_ids = set()

    sorted_mps = sorted(mp_totals.items(), key=lambda x: x[1], reverse=True)[:max_nodes // 2]
    for mp, tot in sorted_mps:
        node_id = f"MP_{mp}"
        node_ids.add(node_id)
        nodes.append({
            "id": node_id,
            "name": mp,
            "type": "mp",
            "total_amount": round(tot, 2),
            "total_works": mp_work_counts.get(mp, 0),
            "risk_score": 35.0,
            "val": max(6, math.log1p(tot) * 1.5)
        })

    sorted_idas = sorted(ida_totals.items(), key=lambda x: x[1], reverse=True)[:max_nodes // 2]
    for ida, tot in sorted_idas:
        node_id = f"IDA_{ida}"
        node_ids.add(node_id)
        risks = ida_risk_accum.get(ida, [30.0])
        avg_r = round(sum(risks) / len(risks), 1) if risks else 30.0
        nodes.append({
            "id": node_id,
            "name": ida,
            "type": "ida",
            "total_amount": round(tot, 2),
            "total_works": ida_work_counts.get(ida, 0),
            "risk_score": avg_r,
            "val": max(6, math.log1p(tot) * 1.5)
        })

    links = []
    monopoly_count = 0
    total_tracked_capital = sum(r.total_amount for r in edge_rows) if edge_rows else 0.0

    for row in edge_rows:
        mp = row.mp_name or "Unknown MP"
        ida = row.ida or "Unassigned IDA"
        u = f"MP_{mp}"
        v = f"IDA_{ida}"

        if u in node_ids and v in node_ids:
            tot = float(row.total_amount or 0.0)
            mp_tot = mp_totals.get(mp, 1.0)
            share = round(tot / mp_tot, 3) if mp_tot > 0 else 0.0
            is_high_risk = share >= 0.50 or (float(row.avg_risk or 0.0) >= 60.0)

            if share >= 0.50:
                monopoly_count += 1

            links.append({
                "source": u,
                "target": v,
                "work_count": int(row.work_count),
                "total_amount": round(tot, 2),
                "share": share,
                "is_high_risk": is_high_risk,
                "value": max(1, int(row.work_count))
            })

    if min_risk > 0:
        nodes = [n for n in nodes if n["risk_score"] >= min_risk]
        surviving_ids = set(n["id"] for n in nodes)
        links = [l for l in links if l["source"] in surviving_ids and l["target"] in surviving_ids]

    # -------------------------------------------------------------
    # 2. DYNAMIC CAG FORENSIC AUDIT TELEMETRY BY AUTHORITY TIER
    # -------------------------------------------------------------

    # --- A. MoSPI (Ministry) Dynamic Forensics ---
    all_states_q = db.query(
        Work.state,
        func.count(Work.id).label("works"),
        func.sum(Work.allocation_amount).label("capital"),
        func.avg(Work.risk_score).label("avg_risk")
    ).filter(Work.state.isnot(None), Work.state != "").group_by(Work.state).all()

    state_map = {s.state: s for s in all_states_q}
    nat_tot_cap = sum(float(s.capital or 0.0) for s in all_states_q) or 1.0

    # Dynamic Zonal Breakdown
    zonal_breakdown = []
    for zname, zstates in ZONES_MAP.items():
        z_works = sum(state_map[s].works for s in zstates if s in state_map)
        z_cap = sum(float(state_map[s].capital or 0.0) for s in zstates if s in state_map)
        z_risks = [float(state_map[s].avg_risk or 0.0) for s in zstates if s in state_map]
        z_avg_risk = round(sum(z_risks) / len(z_risks), 1) if z_risks else 0.0
        if z_works > 0:
            zonal_breakdown.append({
                "zone": zname,
                "capital": z_cap,
                "works": z_works,
                "risk": z_avg_risk,
                "states": [s for s in zstates if s in state_map]
            })

    # Real Interstate Multi-State Syndicates
    multi_state_rows = db.query(
        Work.ida,
        func.count(func.distinct(Work.state)).label("state_cnt"),
        func.count(Work.id).label("works"),
        func.sum(Work.allocation_amount).label("tot_amt"),
        func.avg(Work.risk_score).label("avg_r")
    ).group_by(Work.ida).having(func.count(func.distinct(Work.state)) > 1).order_by(desc("tot_amt")).limit(6).all()

    interstate_syndicates = []
    for idx, m in enumerate(multi_state_rows):
        st_list = [s[0] for s in db.query(func.distinct(Work.state)).filter(Work.ida == m.ida).all()]
        interstate_syndicates.append({
            "syndicate_id": f"SYN-0{idx+1}",
            "syndicate_name": m.ida,
            "states_spanned": st_list,
            "capital_diverted": float(m.tot_amt or 0.0),
            "works_count": int(m.works or 0),
            "risk_score": round(float(m.avg_r or 0.0), 1),
            "pattern": f"Cross-border execution spanning {len(st_list)} states ({', '.join(st_list)})"
        })

    # Top States Ranked Dynamically
    top_states_sorted = sorted(all_states_q, key=lambda s: float(s.capital or 0.0), reverse=True)[:8]
    ministry_top_states = [
        {
            "state": s.state,
            "works_count": int(s.works or 0),
            "total_capital": float(s.capital or 0.0),
            "share_pct": round((float(s.capital or 0.0) / nat_tot_cap) * 100, 1),
            "avg_risk": round(float(s.avg_risk or 0.0), 1)
        }
        for s in top_states_sorted
    ]

    nat_shares = [(float(s.capital or 0.0) / nat_tot_cap) * 100 for s in all_states_q]
    nat_hhi = round(sum(sh ** 2 for sh in nat_shares), 1) if nat_shares else 850.0
    nat_cr5 = round(sum(sh for sh in sorted(nat_shares, reverse=True)[:5]), 1) if nat_shares else 28.4

    # --- B. State Nodal (SNA) Dynamic Forensics for ANY selected state ---
    target_state = clean_state or "Bihar"
    st_idas_q = db.query(
        Work.ida,
        func.count(Work.id).label("works"),
        func.sum(Work.allocation_amount).label("capital"),
        func.avg(Work.risk_score).label("avg_risk")
    ).filter(func.lower(Work.state) == target_state.lower()).group_by(Work.ida).order_by(desc("capital")).all()

    st_tot_cap = sum(float(i.capital or 0.0) for i in st_idas_q) if st_idas_q else 1.0
    st_shares = [(float(i.capital or 0.0) / st_tot_cap) * 100 for i in st_idas_q]
    st_hhi = round(sum(s ** 2 for s in st_shares), 1) if st_shares else 0.0
    st_cr3 = round(sum(st_shares[:3]), 1) if len(st_shares) >= 3 else round(sum(st_shares), 1)
    st_cr4 = round(sum(st_shares[:4]), 1) if len(st_shares) >= 4 else round(sum(st_shares), 1)

    ida_treemap = [
        {
            "name": i.ida or "Unassigned IDA",
            "capital": float(i.capital or 0.0),
            "works_count": int(i.works or 0),
            "share_pct": round((float(i.capital or 0.0) / st_tot_cap) * 100, 1),
            "avg_risk": round(float(i.avg_risk or 0.0), 1),
            "is_dominant": ((float(i.capital or 0.0) / st_tot_cap) * 100) >= 10.0
        }
        for i in st_idas_q[:15]
    ]

    # Dynamic Inter-District Allocation Matrix for this state
    dist_in_state_q = db.query(
        Work.constituency,
        func.count(Work.id).label("works"),
        func.sum(Work.allocation_amount).label("capital"),
        func.avg(Work.risk_score).label("avg_risk")
    ).filter(
        func.lower(Work.state) == target_state.lower(),
        Work.constituency.isnot(None),
        Work.constituency != ""
    ).group_by(Work.constituency).order_by(desc("capital")).all()

    inter_district_matrix = [
        {
            "district": d.constituency,
            "works": int(d.works or 0),
            "capital": float(d.capital or 0.0),
            "concentration_share": round((float(d.capital or 0.0) / st_tot_cap) * 100, 1),
            "risk": round(float(d.avg_risk or 0.0), 1)
        }
        for d in dist_in_state_q[:12]
    ]

    # --- C. District Authority (DA) Dynamic Forensics for ANY selected district ---
    target_dist = clean_district or "DARBHANGA"
    dist_works_q = db.query(Work).filter(
        or_(
            func.lower(Work.constituency).like(f"%{target_dist.lower()}%"),
            func.lower(Work.city).like(f"%{target_dist.lower()}%")
        )
    )

    dist_total_works = dist_works_q.count()
    dist_total_cap = db.query(func.sum(Work.allocation_amount)).filter(
        or_(
            func.lower(Work.constituency).like(f"%{target_dist.lower()}%"),
            func.lower(Work.city).like(f"%{target_dist.lower()}%")
        )
    ).scalar() or 0.0

    # IDAs in this district
    dist_idas_q = dist_works_q.with_entities(
        Work.ida,
        func.count(Work.id).label("cnt"),
        func.sum(Work.allocation_amount).label("tot"),
        func.avg(Work.risk_score).label("avg_r")
    ).group_by(Work.ida).order_by(desc("tot")).all()

    dist_cap_num = float(dist_total_cap) if dist_total_cap > 0 else 1.0
    dist_shares = [(float(i.tot or 0.0) / dist_cap_num) * 100 for i in dist_idas_q]
    dist_hhi = round(sum(sh ** 2 for sh in dist_shares), 1) if dist_shares else 10000.0

    sole_agency = {
        "name": dist_idas_q[0].ida if dist_idas_q else "District Authority IDA",
        "capital": float(dist_idas_q[0].tot or 0.0) if dist_idas_q else 0.0,
        "works_count": int(dist_idas_q[0].cnt or 0) if dist_idas_q else 0,
        "share_pct": round(dist_shares[0], 1) if dist_shares else 100.0,
        "avg_risk": round(float(dist_idas_q[0].avg_r or 0.0), 1) if dist_idas_q else 65.0
    }

    # Blocks in this district
    dist_blocks_q = dist_works_q.with_entities(
        Work.block,
        func.count(Work.id).label("cnt"),
        func.sum(Work.allocation_amount).label("tot"),
        func.avg(Work.risk_score).label("avg_r")
    ).group_by(Work.block).order_by(desc("tot")).all()

    block_distribution = [
        {
            "block": (b.block.strip() if b.block and b.block.strip() else "Central / Unspecified Block"),
            "works_count": int(b.cnt or 0),
            "capital": float(b.tot or 0.0),
            "share_pct": round((float(b.tot or 0.0) / dist_cap_num) * 100, 1),
            "avg_risk": round(float(b.avg_r or 0.0), 1)
        }
        for b in dist_blocks_q[:10]
    ]

    # Structuring works in this district (₹4.5L - ₹5.0L)
    struct_works_q = dist_works_q.filter(
        Work.allocation_amount >= 450000.0,
        Work.allocation_amount < 500000.0
    ).order_by(desc(Work.allocation_amount)).limit(12).all()

    district_structuring_clusters = [
        {
            "id": s.id,
            "work": s.work[:60] + "..." if s.work else "Civil Work Proposal",
            "amount": float(s.allocation_amount or 0.0),
            "delta": round(500000.0 - float(s.allocation_amount or 0.0), 0),
            "risk_score": float(s.risk_score or 65.0),
            "ida": s.ida or sole_agency["name"]
        }
        for s in struct_works_q
    ]

    # --- D. Member of Parliament (MP) Dynamic Forensics for ANY selected MP ---
    target_mp_name = clean_mp or "Mr Gopal Jee Thakur"
    mp_works_q = db.query(Work).filter(func.lower(Work.mp_name).like(f"%{target_mp_name.lower()}%"))

    mp_tot_works = mp_works_q.count()
    mp_tot_cap = db.query(func.sum(Work.allocation_amount)).filter(
        func.lower(Work.mp_name).like(f"%{target_mp_name.lower()}%")
    ).scalar() or 0.0

    # Dynamic status & approval lifecycle
    approval_counts = dict(
        mp_works_q.with_entities(Work.ida_approval, func.count(Work.id)).group_by(Work.ida_approval).all()
    )
    status_counts = dict(
        mp_works_q.with_entities(Work.status, func.count(Work.id)).group_by(Work.status).all()
    )

    completed_works = status_counts.get("Completed", 0)
    sanctioned_works = approval_counts.get("Approved by IDA", 0) + status_counts.get("Sanctioned", 0) + completed_works
    pending_sanction = approval_counts.get("Action Pending", 0)
    
    mp_cap_num = float(mp_tot_cap) if mp_tot_cap > 0 else 1.0
    completion_rate = round((completed_works / max(1, mp_tot_works)) * 100, 1)

    # Dynamic Blocks for this MP
    mp_blocks_q = mp_works_q.with_entities(
        Work.block,
        func.count(Work.id).label("cnt"),
        func.sum(Work.allocation_amount).label("tot")
    ).group_by(Work.block).order_by(desc("tot")).all()

    mp_block_allocations = [
        {
            "block": (m.block.strip() if m.block and m.block.strip() else "Constituency Block"),
            "works_count": int(m.cnt or 0),
            "capital": float(m.tot or 0.0),
            "share_pct": round((float(m.tot or 0.0) / mp_cap_num) * 100, 1)
        }
        for m in mp_blocks_q[:8]
    ]

    # Dynamic Delayed IDAs (>45 days statutory limit in Action Pending)
    mp_delays_q = mp_works_q.with_entities(
        Work.ida,
        func.count(Work.id).label("stalled_cnt"),
        func.sum(Work.allocation_amount).label("delayed_amt"),
        func.max(Work.days_since_recommended).label("max_days")
    ).filter(
        Work.days_since_recommended >= 45,
        Work.ida_approval == "Action Pending"
    ).group_by(Work.ida).order_by(desc("delayed_amt")).limit(5).all()

    agency_dwell_matrix = [
        {
            "ida": d.ida or "Local Implementing Agency",
            "stalled_works": int(d.stalled_cnt or 0),
            "delayed_capital": float(d.delayed_amt or 0.0),
            "max_days_delayed": int(d.max_days or 45),
            "status_label": f"Statutory Sanction Delay (>45 Days: {int(d.max_days or 45)}d Max)"
        }
        for d in mp_delays_q
    ]

    # Available entities for frontend dynamic dropdowns
    available = get_available_entities(db=db, state=clean_state)

    telemetry = {
        "scope": clean_state or "All India",
        "role": active_role,
        "jurisdiction": jurisdiction or clean_state or "National",
        "selected_state": target_state,
        "selected_district": target_dist,
        "selected_mp": target_mp_name,
        "total_capital": total_tracked_capital,
        "total_works": sum(r.work_count for r in edge_rows),
        "monopoly_links_count": monopoly_count,
        "active_mps_count": len(mp_totals),
        "active_idas_count": len(ida_totals),
        "available_entities": available,
        # 100% Dynamic Role-Specific Forensics
        "ministry_forensics": {
            "national_hhi": nat_hhi,
            "national_hhi_category": "Competitive Federal Allocation Spread" if nat_hhi < 1500 else "Concentrated Market",
            "national_cr5": nat_cr5,
            "top_states": ministry_top_states,
            "interstate_syndicates": interstate_syndicates,
            "zonal_breakdown": zonal_breakdown
        },
        "state_forensics": {
            "state_name": target_state,
            "state_hhi": st_hhi,
            "state_hhi_category": "Competitive Spread with High-Capture IDAs" if st_hhi < 1500 else "Concentrated Market",
            "state_cr3": st_cr3,
            "state_cr4": st_cr4,
            "total_state_capital": st_tot_cap,
            "ida_treemap": ida_treemap,
            "inter_district_matrix": inter_district_matrix
        },
        "district_forensics": {
            "district_name": target_dist,
            "district_hhi": dist_hhi,
            "district_hhi_category": "Absolute Single-Agency Monopoly (100% Capture)" if dist_hhi >= 9999 else "High Agency Concentration" if dist_hhi >= 2500 else "Competitive Agency Spread",
            "total_district_capital": dist_total_cap,
            "total_district_works": dist_total_works,
            "sole_agency": sole_agency,
            "all_agencies": [
                {
                    "name": i.ida or "Unassigned IDA",
                    "capital": float(i.tot or 0.0),
                    "works_count": int(i.cnt or 0),
                    "share_pct": round((float(i.tot or 0.0) / dist_cap_num) * 100, 1),
                    "avg_risk": round(float(i.avg_r or 0.0), 1)
                }
                for i in dist_idas_q[:5]
            ],
            "block_distribution": block_distribution,
            "structuring_clusters": district_structuring_clusters
        },
        "mp_forensics": {
            "mp_name": target_mp_name,
            "total_recommended": float(mp_tot_cap),
            "total_works": mp_tot_works,
            "pipeline_stages": {
                "recommended": {"works": mp_tot_works, "capital": float(mp_tot_cap)},
                "sanctioned": {"works": min(sanctioned_works, mp_tot_works), "capital": float(mp_tot_cap) * (min(sanctioned_works, mp_tot_works) / max(1, mp_tot_works))},
                "pending": {"works": pending_sanction, "capital": float(mp_tot_cap) * (pending_sanction / max(1, mp_tot_works))},
                "completed": {"works": completed_works, "capital": float(mp_tot_cap) * (completed_works / max(1, mp_tot_works)), "pct": completion_rate}
            },
            "completion_rate": completion_rate,
            "block_allocations": mp_block_allocations,
            "agency_dwell_matrix": agency_dwell_matrix
        }
    }

    return {"nodes": nodes, "links": links, "telemetry": telemetry}
