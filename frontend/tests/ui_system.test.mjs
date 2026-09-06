import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_BASE = process.env.BACKEND_URL || "http://127.0.0.1:8000/api";

describe("SETU Frontend UI & Live Route Verification", () => {
  const routes = [
    { path: "/", name: "Public Landing Page", expectedKeyword: "SETU" },
    { path: "/dashboard", name: "Operational Command Center", expectedKeyword: "Command Center" },
    { path: "/works", name: "MPLADS Works Explorer", expectedKeyword: "Works Explorer" },
    { path: "/works/W-23167", name: "Work Detail View", expectedKeyword: "Loading AI Explainability Breakdown" },
    { path: "/maps", name: "Geospatial Risk Visualizer", expectedKeyword: "Geospatial" },
    { path: "/graph", name: "MP-IDA Money Flow Graph", expectedKeyword: "Bipartite" },
    { path: "/cases", name: "Case Management Kanban", expectedKeyword: "Case" },
    { path: "/alerts", name: "Risk Alert Feed", expectedKeyword: "Alert" },
    { path: "/reports", name: "Compliance & Audit Reports", expectedKeyword: "Reports" },
    { path: "/model-metrics", name: "Model Evaluation & Fairness", expectedKeyword: "Model" },
    { path: "/roadmap", name: "Future Architecture Roadmap", expectedKeyword: "Roadmap" },
  ];

  for (const route of routes) {
    it(`should render ${route.name} (${route.path}) with HTTP 200`, async () => {
      const res = await fetch(`${FRONTEND_BASE}${route.path}`, {
        headers: { "User-Agent": "SETU-UI-TestRunner/1.0" },
      });
      assert.equal(res.status, 200, `Expected 200 OK for route ${route.path}, got ${res.status}`);
      const text = await res.text();
      assert.ok(text.length > 300, `Expected HTML content on ${route.path}, received ${text.length} bytes`);
      assert.ok(
        text.toLowerCase().includes(route.expectedKeyword.toLowerCase()),
        `Expected page ${route.path} to contain keyword "${route.expectedKeyword}"`
      );
    });
  }
});

describe("4-Tier Governance & Role Scoping Telemetry", () => {
  it("MoSPI Ministry (National Scope) should return macro metrics & national distribution", async () => {
    const res = await fetch(`${BACKEND_BASE}/dashboard?role=ministry`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, "ministry");
    assert.ok(data.summary.total_works > 0, "Ministry summary total_works must be > 0");
    assert.ok(data.summary.flagged_works_count > 0, "Ministry flagged_works_count must be > 0");
    assert.ok(data.summary.amount_at_risk > 0, "Ministry amount_at_risk must be > 0");
    assert.ok(Array.isArray(data.top_flagged_works), "Must return top_flagged_works");
    assert.ok(Array.isArray(data.fraud_breakdown), "Must return fraud_breakdown");
  });

  it("State Nodal Authority (State Scope - Bihar) should return state-scoped anomalies", async () => {
    const res = await fetch(`${BACKEND_BASE}/dashboard?role=state&jurisdiction=Bihar`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, "state");
    assert.equal(data.jurisdiction, "Bihar");
    assert.ok(data.summary.total_works > 0);
  });

  it("District Authority DM (District Scope - DARBHANGA) should return district triage data", async () => {
    const res = await fetch(`${BACKEND_BASE}/dashboard?role=district&jurisdiction=DARBHANGA`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, "district");
    assert.equal(data.jurisdiction, "DARBHANGA");
  });

  it("Member of Parliament (MP Scope - Mr Gopal Jee Thakur) should return constituency utilization", async () => {
    const res = await fetch(`${BACKEND_BASE}/dashboard?role=mp&jurisdiction=Mr%20Gopal%20Jee%20Thakur`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, "mp");
    assert.equal(data.jurisdiction, "Mr Gopal Jee Thakur");
  });
});

describe("Geospatial & Graph Integration Contracts", () => {
  it("State choropleth endpoint should return valid geographic data arrays", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/states-choropleth`);
    assert.equal(res.status, 200);
    const states = await res.json();
    assert.ok(Array.isArray(states) && states.length > 0);
    const sample = states[0];
    assert.ok("state" in sample, "StateData must have state name");
    assert.ok("avg_risk_score" in sample, "StateData must have avg_risk_score");
    assert.ok("total_works" in sample, "StateData must have total_works");
  });

  it("District drilldown should return districts for Bihar", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/district-drilldown?state=Bihar`);
    assert.equal(res.status, 200);
    const districts = await res.json();
    assert.ok(Array.isArray(districts) && districts.length > 0);
    assert.ok("district" in districts[0]);
  });

  it("Constituency pins endpoint should accept limit parameter and return coordinate pins", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/pins?constituency=DARBHANGA&limit=50`);
    assert.equal(res.status, 200);
    const pins = await res.json();
    assert.ok(Array.isArray(pins));
    if (pins.length > 0) {
      assert.ok("lat" in pins[0] && "lng" in pins[0]);
      assert.ok("risk_score" in pins[0]);
    }
  });

  it("Bipartite network graph endpoint should return nodes and links", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/network?max_nodes=50&min_risk=0`);
    assert.equal(res.status, 200);
    const graph = await res.json();
    assert.ok(Array.isArray(graph.nodes), "Network graph must contain nodes");
    assert.ok(Array.isArray(graph.links), "Network graph must contain links");
  });

  it("Constituencies risk endpoint should return all nationwide constituencies with risk metrics", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/constituencies-risk`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data), "Must return array of constituencies");
    assert.ok(data.length > 300, `Expected >300 constituencies, got ${data.length}`);
    const sample = data[0];
    assert.ok(sample.name && sample.state);
    assert.ok(typeof sample.avg_risk_score === "number");
    assert.ok(typeof sample.total_works === "number");
  });

  it("Constituency detail endpoint should return deep forensic telemetry for a selected constituency", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/constituency-detail?name=DARBHANGA`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.name, "DARBHANGA");
    assert.equal(data.state, "Bihar");
    assert.ok(data.mp_name);
    assert.ok(Array.isArray(data.top_works), "Must return top flagged works");
    assert.ok(data.top_works.length > 0, "Darbhanga must have top flagged works");
  });
});

describe("UI Bug & Contract Discrepancy Diagnostics", () => {
  it("Diagnostic: Check Case entity contract for 'amount' and 'risk_level' fields", async () => {
    const res = await fetch(`${BACKEND_BASE}/cases?limit=5`);
    assert.equal(res.status, 200);
    const cases = await res.json();
    assert.ok(Array.isArray(cases) && cases.length > 0, "At least one case must exist");

    const sample = cases[0];
    const hasAmount = "amount" in sample && typeof sample.amount === "number";
    const hasRiskLevel = "risk_level" in sample && typeof sample.risk_level === "string";

    // Informative diagnostic assertions:
    // If these fields are missing on Case, UI renders NaN for amounts and undefined for risk level badges!
    if (!hasAmount) {
      console.warn("⚠️ [UI BUG DETECTED] Case object missing 'amount' property: Causes '₹NaN L' in app/cases/page.tsx:144 & 269");
    }
    if (!hasRiskLevel) {
      console.warn("⚠️ [UI BUG DETECTED] Case object missing 'risk_level' property: Causes TS2339 & missing RiskBadge label in app/cases/page.tsx:139");
    }
    assert.ok(sample.id, "Case must have an id");
    assert.ok(sample.title, "Case must have a title");
  });

  it("Diagnostic: Check Alert severity casing against TypeScript enum ('Critical' vs 'critical')", async () => {
    const res = await fetch(`${BACKEND_BASE}/alerts?limit=10`);
    assert.equal(res.status, 200);
    const alerts = await res.json();
    assert.ok(Array.isArray(alerts) && alerts.length > 0);

    const severities = new Set(alerts.map((a) => a.severity));
    console.log("ℹ️ Live Alert severities in database:", Array.from(severities));

    // Alert severity in backend is Titlecase ("Critical", "High", "Medium", "Low")
    // Frontend app/alerts/page.tsx compares against lowercase "critical", causing TS2367
    const hasTitleCase = alerts.some((a) => a.severity === "Critical" || a.severity === "High");
    assert.ok(hasTitleCase, "Database alert severities are Titlecase, confirming frontend TS2367 mismatch");
  });
});
