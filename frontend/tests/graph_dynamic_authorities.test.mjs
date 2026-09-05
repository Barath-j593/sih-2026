import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_BASE = process.env.BACKEND_URL || "http://127.0.0.1:8000/api";

describe("Dynamic Authority Portal: Entity Discovery & Dropdowns", () => {
  it("should return nationwide available states, districts, and MPs", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/entities`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.states), "states should be an array");
    assert.ok(data.states.length >= 25, "states array should have >= 25 entries");
    assert.ok(data.states.includes("Bihar"));
    assert.ok(data.states.includes("Uttar Pradesh"));
    assert.ok(data.states.includes("Tamil Nadu"));
    assert.ok(Array.isArray(data.districts));
    assert.ok(Array.isArray(data.mps));
  });

  it("should dynamically filter districts and MPs when state=Bihar is specified", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/entities?state=Bihar`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.districts.includes("DARBHANGA"));
    assert.ok(data.districts.includes("SARAN"));
    assert.ok(data.districts.includes("PATNA SAHIB"));

    const mpNames = data.mps.map((m) => m.name);
    assert.ok(mpNames.some((name) => name.includes("Gopal Jee Thakur")));
    assert.ok(mpNames.some((name) => name.includes("Rajiv Pratap Rudy")));
  });

  it("should dynamically filter districts and MPs when state=Uttar Pradesh is specified", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/entities?state=${encodeURIComponent("Uttar Pradesh")}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.districts.length > 0);
    assert.ok(data.mps.length > 0);
    // Ensure Bihar-only districts are not returned under UP
    assert.ok(!data.districts.includes("DARBHANGA"));
  });
});

describe("Dynamic Authority Visualizer Telemetry Contracts", () => {
  it("MoSPI Ministry: Live Federal HHI, multi-state syndicates & zonal conduit", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/network?role=ministry&state=All+India`);
    assert.equal(res.status, 200);
    const data = await res.json();
    const telemetry = data.telemetry;
    assert.ok(telemetry, "Telemetry object must be present");
    assert.ok(telemetry.ministry_forensics, "ministry_forensics must be present");

    const forensics = telemetry.ministry_forensics;
    assert.ok(forensics.national_hhi > 0, "national_hhi must be positive");
    assert.ok(forensics.national_cr5 > 0, "national_cr5 must be positive");
    assert.ok(Array.isArray(forensics.top_states));
    assert.ok(forensics.top_states.length > 0);
    assert.ok(Array.isArray(forensics.interstate_syndicates));
    assert.ok(forensics.interstate_syndicates.length > 0);

    const firstSyndicate = forensics.interstate_syndicates[0];
    assert.ok(firstSyndicate.syndicate_name);
    assert.ok(firstSyndicate.states_spanned.length > 1, "Syndicate must span >1 state");
    assert.ok(firstSyndicate.capital_diverted > 0);
  });

  it("SNA State Authority: Dynamic vendor treemap and inter-district cartel matrix for Bihar", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/network?role=state&state=Bihar`);
    assert.equal(res.status, 200);
    const data = await res.json();
    const forensics = data.telemetry?.state_forensics;
    assert.ok(forensics, "state_forensics must be present");
    assert.equal(forensics.state_name, "Bihar");
    assert.ok(forensics.state_hhi > 0);
    assert.ok(forensics.state_cr3 > 0);
    assert.ok(forensics.state_cr4 > 0);
    assert.ok(Array.isArray(forensics.ida_treemap));
    assert.ok(forensics.ida_treemap.length > 0);
    assert.ok(Array.isArray(forensics.inter_district_matrix));
  });

  it("SNA State Authority: Dynamically recalculates when state switches to Maharashtra", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/network?role=state&state=Maharashtra`);
    assert.equal(res.status, 200);
    const data = await res.json();
    const forensics = data.telemetry?.state_forensics;
    assert.ok(forensics, "state_forensics must be present");
    assert.equal(forensics.state_name, "Maharashtra");
    assert.ok(forensics.state_hhi > 0);
    assert.ok(forensics.ida_treemap.length > 0);
  });

  it("DA District Authority: Real-time single-agency monopoly and ₹5L structuring radar for DARBHANGA", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/network?role=district&state=Bihar&district=DARBHANGA`);
    assert.equal(res.status, 200);
    const data = await res.json();
    const forensics = data.telemetry?.district_forensics;
    assert.ok(forensics, "district_forensics must be present");
    assert.equal(forensics.district_name, "DARBHANGA");
    assert.equal(forensics.district_hhi, 10000.0, "Darbhanga has single-agency 10,000 monopoly");
    assert.equal(forensics.sole_agency.share_pct, 100.0);
    assert.ok(Array.isArray(forensics.block_distribution));
    assert.ok(forensics.block_distribution.length > 0);
    assert.ok(Array.isArray(forensics.structuring_clusters));
    assert.ok(forensics.structuring_clusters.length > 0);

    const firstStructuring = forensics.structuring_clusters[0];
    assert.ok(firstStructuring.amount < 500000.0, "Structured contract must be below ₹5,00,000");
    assert.ok(firstStructuring.delta > 0, "Structuring delta must be positive (e.g. 500k - cost)");
  });

  it("DA District Authority: Dynamically switches to SARAN district", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/network?role=district&state=Bihar&district=SARAN`);
    assert.equal(res.status, 200);
    const data = await res.json();
    const forensics = data.telemetry?.district_forensics;
    assert.ok(forensics, "district_forensics must be present");
    assert.equal(forensics.district_name, "SARAN");
    assert.ok(forensics.block_distribution.length > 0);
  });

  it("MP Recommender Authority: Dynamic 4-stage pipeline and dwell delays for Gopal Jee Thakur", async () => {
    const res = await fetch(
      `${BACKEND_BASE}/graph/network?role=mp&state=Bihar&mp_name=${encodeURIComponent("Mr Gopal Jee Thakur")}`
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    const forensics = data.telemetry?.mp_forensics;
    assert.ok(forensics, "mp_forensics must be present");
    assert.equal(forensics.mp_name, "Mr Gopal Jee Thakur");
    assert.equal(forensics.total_works, 128);
    assert.equal(forensics.pipeline_stages.recommended.works, 128);
    assert.ok(forensics.pipeline_stages.sanctioned.works >= 20);
    assert.ok(forensics.pipeline_stages.pending.works >= 100);
    assert.ok(forensics.block_allocations.length > 0);
    assert.ok(forensics.agency_dwell_matrix.length > 0);
  });

  it("MP Recommender Authority: Dynamically switches to Rajiv Pratap Rudy", async () => {
    const res = await fetch(
      `${BACKEND_BASE}/graph/network?role=mp&state=Bihar&mp_name=${encodeURIComponent("Rajiv Pratap Rudy")}`
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    const forensics = data.telemetry?.mp_forensics;
    assert.ok(forensics, "mp_forensics must be present");
    assert.equal(forensics.mp_name, "Rajiv Pratap Rudy");
    assert.equal(forensics.total_works, 13);
    assert.ok(forensics.total_recommended > 100000000.0);
  });
});

describe("Dynamic Authority Portal: Frontend UI Integration & Route Verification", () => {
  it("should render the Money Flow & Cartels page with dynamic authority telemetry container", async () => {
    const res = await fetch(`${FRONTEND_BASE}/graph`, {
      headers: { "User-Agent": "SETU-Authority-Dynamic-Test/1.0" },
    });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(
      html.includes("Aggregating Dynamic Forensic Telemetry") ||
      html.includes("Money Flow") ||
      html.includes("SETU"),
      "Should contain dynamic authority telemetry marker or SETU brand"
    );
    assert.ok(
      html.includes("Herfindahl Index") || html.includes("Forensic"),
      "Should contain forensic calculation indicator"
    );
  });
});
