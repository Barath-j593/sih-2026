import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_graph_entities_national():
    """Verify GET /api/graph/entities returns nationwide states, districts, and MPs."""
    res = client.get("/api/graph/entities")
    assert res.status_code == 200
    data = res.json()
    assert "states" in data
    assert "districts" in data
    assert "mps" in data
    assert len(data["states"]) >= 25
    assert "Bihar" in data["states"]
    assert "Uttar Pradesh" in data["states"]
    assert "Tamil Nadu" in data["states"]
    assert len(data["districts"]) > 0
    assert len(data["mps"]) > 0

def test_graph_entities_filtered_by_state():
    """Verify GET /api/graph/entities?state=Bihar dynamically restricts districts and MPs."""
    res = client.get("/api/graph/entities?state=Bihar")
    assert res.status_code == 200
    data = res.json()
    assert "DARBHANGA" in data["districts"]
    assert "SARAN" in data["districts"]
    assert "PATNA SAHIB" in data["districts"]
    
    mp_names = [m["name"] for m in data["mps"]]
    assert any("Gopal Jee Thakur" in name for name in mp_names)
    assert any("Rajiv Pratap Rudy" in name for name in mp_names)

def test_mospi_ministry_dynamic_radar():
    """Verify MoSPI National Flow calculates live federal HHI, zonal breakdown, and interstate cartels."""
    res = client.get("/api/graph/network?role=ministry&state=All+India")
    assert res.status_code == 200
    data = res.json()
    telemetry = data.get("telemetry")
    assert telemetry is not None
    assert "ministry_forensics" in telemetry
    
    m_forensics = telemetry["ministry_forensics"]
    assert m_forensics["national_hhi"] > 0
    assert m_forensics["national_cr5"] > 0
    assert len(m_forensics["top_states"]) > 0
    assert len(m_forensics["zonal_breakdown"]) >= 5
    
    # Verify multi-state syndicates are queried from DB
    syndicates = m_forensics["interstate_syndicates"]
    assert len(syndicates) > 0
    first_syn = syndicates[0]
    assert "syndicate_name" in first_syn
    assert len(first_syn["states_spanned"]) > 1
    assert first_syn["capital_diverted"] > 0

def test_sna_state_vendor_concentration_bihar():
    """Verify State Nodal Authority telemetry for Bihar."""
    res = client.get("/api/graph/network?role=state&state=Bihar")
    assert res.status_code == 200
    data = res.json()
    telemetry = data.get("telemetry")
    assert telemetry is not None
    assert "state_forensics" in telemetry
    
    s_forensics = telemetry["state_forensics"]
    assert s_forensics["state_name"] == "Bihar"
    assert s_forensics["state_hhi"] > 0
    assert s_forensics["state_cr3"] > 0
    assert len(s_forensics["ida_treemap"]) > 0
    assert len(s_forensics["inter_district_matrix"]) > 0

def test_sna_state_vendor_concentration_tamil_nadu():
    """Verify State Nodal Authority switches dynamically to Tamil Nadu."""
    res = client.get("/api/graph/network?role=state&state=Tamil+Nadu")
    assert res.status_code == 200
    data = res.json()
    telemetry = data.get("telemetry")
    assert telemetry is not None
    assert "state_forensics" in telemetry
    
    s_forensics = telemetry["state_forensics"]
    assert s_forensics["state_name"] == "Tamil Nadu"
    assert s_forensics["state_hhi"] > 0
    # Must have Tamil Nadu executing agencies, not Bihar agencies
    assert len(s_forensics["ida_treemap"]) > 0
    assert not any("PATNA" in ida["name"] for ida in s_forensics["ida_treemap"])

def test_da_district_vendor_capture_darbhanga():
    """Verify District Authority telemetry for Darbhanga (single-agency monopoly + smurfing radar)."""
    res = client.get("/api/graph/network?role=district&state=Bihar&district=DARBHANGA")
    assert res.status_code == 200
    data = res.json()
    telemetry = data.get("telemetry")
    assert telemetry is not None
    assert "district_forensics" in telemetry
    
    d_forensics = telemetry["district_forensics"]
    assert d_forensics["district_name"] == "DARBHANGA"
    # Darbhanga has a 100% single-agency monopoly
    assert d_forensics["district_hhi"] == 10000.0
    assert d_forensics["sole_agency"]["share_pct"] == 100.0
    assert len(d_forensics["block_distribution"]) > 0
    # Smurfing contracts below statutory ₹5,00,000 limit
    assert len(d_forensics["structuring_clusters"]) > 0
    first_cluster = d_forensics["structuring_clusters"][0]
    assert first_cluster["amount"] < 500000.0
    assert first_cluster["amount"] >= 400000.0
    assert first_cluster["delta"] > 0

def test_da_district_vendor_capture_saran():
    """Verify District Authority switches dynamically to SARAN."""
    res = client.get("/api/graph/network?role=district&state=Bihar&district=SARAN")
    assert res.status_code == 200
    data = res.json()
    telemetry = data.get("telemetry")
    assert telemetry is not None
    assert "district_forensics" in telemetry
    
    d_forensics = telemetry["district_forensics"]
    assert d_forensics["district_name"] == "SARAN"
    assert len(d_forensics["block_distribution"]) > 0

def test_mp_constituency_fund_velocity_gopal_jee_thakur():
    """Verify MP Constituency Fund Velocity for Gopal Jee Thakur."""
    res = client.get("/api/graph/network?role=mp&state=Bihar&mp_name=Mr+Gopal+Jee+Thakur")
    assert res.status_code == 200
    data = res.json()
    telemetry = data.get("telemetry")
    assert telemetry is not None
    assert "mp_forensics" in telemetry
    
    mp_forensics = telemetry["mp_forensics"]
    assert mp_forensics["mp_name"] == "Mr Gopal Jee Thakur"
    assert mp_forensics["total_works"] == 128
    assert mp_forensics["pipeline_stages"]["recommended"]["works"] == 128
    assert mp_forensics["pipeline_stages"]["sanctioned"]["works"] >= 20
    assert mp_forensics["pipeline_stages"]["pending"]["works"] >= 100
    assert len(mp_forensics["block_allocations"]) > 0
    # Statutory dwell delay (>45 days Action Pending)
    assert len(mp_forensics["agency_dwell_matrix"]) > 0

def test_mp_constituency_fund_velocity_rajiv_pratap_rudy():
    """Verify MP Constituency Fund Velocity switches dynamically to Rajiv Pratap Rudy."""
    res = client.get("/api/graph/network?role=mp&state=Bihar&mp_name=Rajiv+Pratap+Rudy")
    assert res.status_code == 200
    data = res.json()
    telemetry = data.get("telemetry")
    assert telemetry is not None
    assert "mp_forensics" in telemetry
    
    mp_forensics = telemetry["mp_forensics"]
    assert mp_forensics["mp_name"] == "Rajiv Pratap Rudy"
    assert mp_forensics["total_works"] == 13
    assert mp_forensics["total_recommended"] > 100000000.0  # ~19 Cr
