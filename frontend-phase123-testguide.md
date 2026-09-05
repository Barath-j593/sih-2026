# SETU Platform — Manual Testing Guide (Phase 1, 2 & 3)

**Document Reference**: `frontend-phase123-testguide.md`  
**Test Objective**: Verify that all design tokens, layout decoupling, SETU brand unification, and contract bug fixes (Phases 1, 2, and 3) function seamlessly in the browser.

---

## 1. Active Server Environments

Both daemons are already active in the background and listening:

| Service | Local URL | Health Check Endpoint | Expected Response |
|---|---|---|---|
| **Backend API** (FastAPI) | `http://127.0.0.1:8000` | `GET http://127.0.0.1:8000/health` | `{"status":"healthy","service":"setu-backend"}` |
| **Frontend UI** (Next.js 14) | `http://localhost:3000` | `GET http://localhost:3000/` | `HTTP 200 OK` |

> [!TIP]
> If you ever need to restart the servers manually from your terminal:
> ```bash
> # Terminal 1: Backend
> cd /home/jarvis/SIH-DEMOS/sih-2026/backend
> ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
>
> # Terminal 2: Frontend
> cd /home/jarvis/SIH-DEMOS/sih-2026/frontend
> npm run dev
> ```

---

## 2. Manual Test Cases (Step-by-Step)

---

### Test Case 1: Public Landing Page Layout & SETU Branding Unification
* **Target Route**: [`http://localhost:3000/`](http://localhost:3000/)
* **Phase Addressed**: Phase 1 & 2 (Layout Decoupling & Complete Brand Unification)

#### Execution Steps:
1. Open [`http://localhost:3000/`](http://localhost:3000/) in your browser.
2. Inspect the **Navbar**:
   - Check the top-left branding badge: It reads **SETU** with a gold pill labeled **MPLADS INTELLIGENCE**.
   - Check the top-right button in the navbar (1.1): It now reads **"Open SETU Dashboard"**.
3. Inspect the **Hero Section**:
   - Notice the pulsating chip badge: `SETU • MPLADS INTELLIGENCE`.
   - Primary Hero CTA button reads: **"OPEN SETU DASHBOARD"**.
4. Check **Operational Governance Architecture (Chapter 2)** (1.2):
   - Below the title, confirm text reads: *"SETU connects project records, financial activity, execution progress, governance rules and evidence into a single risk intelligence layer."*
5. Check **Public Query Dashboard (Chapter 3)** (1.3):
   - Look at the search input bar: The button now reads **"Ask SETU"**.
   - Look at the floating bottom-right action pill: It reads **"Ask SETU Intelligence"**.
6. Check **All-India Jurisdiction (Chapter 9)** (1.5):
   - Below the chapter title, confirm text reads: *"SETU monitors parliamentary recommendations across India..."*
7. Inspect any **Work Detail Page** (1.4):
   - Navigate to [`http://localhost:3000/works/W-23167`](http://localhost:3000/works/W-23167) or click any project from the table.
   - Inspect the Explainability card: It now reads **"SETU AI Risk Fusion & Explainability Trace"**.
8. Check **Dashboard Loading & Error Screens** (1.6):
   - Navigate to [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard).
   - The loading screen and cockpit banner display **"Loading SETU Operational Command Center"** and **"SETU OPERATIONAL TELEMETRY COCKPIT"**.
9. Scroll down to the **Footer**:
   - Confirm banner text: *"From project recommendation to physical completion, SETU helps authorities..."*
   - Confirm CTA reads: *"OPEN SETU DASHBOARD"*.
   - Confirm Column 1 brand header reads **SETU**.

- [ ] **Pass**: Layout is full-bleed, all 6 branding locations display SETU consistently, and no Sanchay branding remains anywhere.

---

### Test Case 2: Case Management Kanban (Verifying the `₹NaN L` & Risk Badge Fix)
* **Target Route**: [`http://localhost:3000/cases`](http://localhost:3000/cases)
* **Phase Addressed**: Phase 3 (Case Contract & Type Remediation)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/cases`](http://localhost:3000/cases).
2. Look at the Kanban columns: **Flagged for Review**, **Under Investigation**, and **Resolved**.
3. Inspect any case card (e.g., `W-10002` or `SETU-2026-CASE-1001`):
   - Check the bottom right of the card where the project cost is displayed.
   - **Previously**: Displayed `₹NaN L`.
   - **Now**: Displays formatted project outlay (e.g., `₹24.5L`, `₹4.9L`).
4. Check the **Risk Badge**:
   - Verify that each card renders a styled risk badge (e.g., `Critical`, `High`, or `Medium`) with distinct colored rings instead of being unstyled or blank.
5. Click on any case card to open the **Right Detail Drawer**:
   - Inspect the **Sanction Amount** tile: Confirms formatted currency (e.g., `₹2,450,000` or `₹490,000`) instead of `₹NaN`.
   - Click **"Start Review →"** or **"Resolve ✓"**: Observe the card moving across columns and updating status.

- [ ] **Pass**: No `₹NaN L` appears anywhere; costs and risk badges are properly formatted and interactive.

---

### Test Case 3: Geospatial Maps (Authentic GIS Vector Map, Color-Coded Risk Status, State Names & No Auto-Redirect)
* **Target Route**: [`http://localhost:3000/maps`](http://localhost:3000/maps)
* **Phase Addressed**: Phase 3 (Official GIS Boundaries, Color-Coded Risk Levels, State Names & Navigation Stability)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/maps`](http://localhost:3000/maps) (regardless of which role is active in the top switcher).
2. Verify **No Auto-Redirect**:
   - The page stays reliably on the **National Choropleth** tab and **does not** automatically bounce you to the Audit pins map.
3. Verify **Authentic GIS Administrative Boundaries**:
   - The map now renders the exact official GIS vector boundaries for all 36 Indian states and union territories (matching the user reference image: Gujarat, Rajasthan, MP, UP, Maharashtra, Karnataka, Tamil Nadu, Andhra, Telangana, Kerala, Bihar, WB, Odisha, J&K, Ladakh, Northeast states, etc.).
4. Verify **Color-Coded Risk Status**:
   - Each state polygon is filled with its color-coded risk status:
     - **Red (`#ef4444`)**: Critical Risk (&ge; 65)
     - **Orange (`#f97316`)**: High Risk (50–64)
     - **Amber (`#eab308`)**: Medium Risk (35–49)
     - **Emerald Green (`#10b981`)**: Low Risk (&lt; 35)
     - **Slate (`#94a3b8`)**: Unmonitored / Baseline
5. Verify **State Names & Centroid Labels**:
   - Notice that state names are displayed clearly in readable badges at each state's centroid (e.g. `Bihar`, `Uttar Pradesh`, `Maharashtra`, `Rajasthan`, `Gujarat`, `West Bengal`, etc.).
   - Click `State Names: ON / OFF` to toggle labels on or off.
6. Verify **Theme Switcher**:
   - Click `Dark Mode` / `Light Mode`: Toggle between the crisp White Cartographic theme (matching your reference image) and the Dark Radar command center theme.
7. Test the **Interactive Controls & Inspection**:
   - **Search Bar**: Type "Bihar" or "UP" in the search box above the map to highlight that specific state.
   - **Hover Inspector**: Hover over any state to see the instant inspector card (State Name, Risk Score / 100, Total Works, Amount at Risk in ₹ Cr).
   - **Click State**: Clicking any state updates the active state overview card on the right; double-clicking or clicking "Drill Down into Districts" opens the district-level drill-down.

- [ ] **Pass**: No unwanted redirect occurs, authentic GIS boundaries render with color-coded risk levels, state names are clearly visible, theme toggle works, and state inspection/drilldown is functional.

---

### Test Case 4: Risk Alert Feed (Severity Casing & Filter Checks)
* **Target Route**: [`http://localhost:3000/alerts`](http://localhost:3000/alerts)
* **Phase Addressed**: Phase 3 (Alert Severity Casing Bug TS2367)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/alerts`](http://localhost:3000/alerts).
2. Examine the alert cards:
   - Inspect the alert badge icon and severity pill:
     - **Critical** alerts render with red shield icons (`bg-red-100 text-red-600`) and a red border.
     - **High** alerts render with amber shield icons (`bg-amber-100 text-amber-600`) and an amber border.
3. Test the filter buttons at the top (**All**, **Critical**, **High**, **Medium**):
   - Click **"Critical"**: Verifies that only critical-severity alerts are shown.
   - Click **"High"**: Verifies that high-severity alerts are shown.
   - Click **"Mark as Read"**: Verifies the alert dims and is marked acknowledged.

- [ ] **Pass**: Alert severity colors render properly for both Critical and High, and filtering functions without type discrepancies.

---

### Test Case 5: Audit Reports Download via `API_BASE`
* **Target Route**: [`http://localhost:3000/reports`](http://localhost:3000/reports)
* **Phase Addressed**: Phase 3 (Dynamic API URL Resolution)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/reports`](http://localhost:3000/reports).
2. Locate the **"Download Certified PAC Audit Report (PDF)"** button.
3. Click the button:
   - Verify it initiates a download or opens a new browser tab pointing to `${API_BASE}/reports/audit-pdf...` (resolving through the backend API).
4. Locate the **"Export Raw Audit Data (CSV)"** button.
5. Click the button:
   - Verify that `setu_audit_export_risk_gt40.csv` downloads with real flagged records.

- [ ] **Pass**: Both PDF and CSV download actions trigger through the centralized API configuration without hardcoded hostname failures.

---

### Test Case 6: 4-Tier Role-Scoped Dashboard Experience (Phase 4)
* **Target Route**: [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard)
* **Phase Addressed**: Phase 4 (Dedicated Views for Ministry, State Nodal, District Magistrate, and MP)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard).
2. Look at the top sticky header banner with the **OPERATIONAL GOVERNANCE LEVEL** switcher:
3. **Role 1: MoSPI Ministry (National Oversight)**:
   - Click **"MoSPI Ministry"** (Jurisdiction: *National*):
   - Verify the dark navy/black banner: *"MoSPI NATIONAL CENTRAL COMMAND — National Parliamentary Audit & Anomaly Intelligence"*.
   - Verify the **"Generate PAC Audit Dossier"** button (linking to certified audit reports).
   - Observe the **4 National Macro Stat Cards** (National Sanctioned Works, Total Outlay in Cr, National Outliers at Risk, National Risk Index).
   - Observe the **National GIS State Choropleth Map** with color-coded states and the **National Agency Monopoly Graph**.
4. **Role 2: State Nodal Authority (State Level — Bihar)**:
   - Click **"State Nodal"** (Jurisdiction: *Bihar*):
   - Notice the dashboard immediately updates to the **State Planning & Equity Monitor**.
   - Verify the **"Export State Compliance CSV"** button.
   - Observe the **Statewide KPI Stat Cards** (Total Works in Bihar: 1,156; Outlay in Cr; State Funds at Risk; Highest Anomaly District).
   - Observe the **District Risk Drill-Down Map** ranking Bihar's districts (Darbhanga, Patna, Gaya, etc.).
   - Observe the **Cross-District Agency Monopoly Alert** card for dominant IDAs.
5. **Role 3: District Authority / DM (District Level — Darbhanga)**:
   - Click **"District Authority"** (Jurisdiction: *DARBHANGA*):
   - Notice the view transforms into the **Pre-Sanction Anomaly Triage & Statutory Tender Verifier**.
   - Verify the **"Open DM Triage Kanban"** button.
   - Observe the **Statutory Structuring Smurfing Alarms card** detecting works clustered just below the ₹5 Lakh statutory e-tender threshold (e.g. ₹4.87L - ₹4.99L).
   - Observe the **Local Village GPS Marker Pins Map** plotting projects across Darbhanga villages.
   - Inspect the **Pre-Sanction Approval Queue** with direct "Triage" buttons.
6. **Role 4: Member of Parliament (Constituency Level — Mr Gopal Jee Thakur)**:
   - Click **"Member of Parliament"** (Jurisdiction: *Mr Gopal Jee Thakur*):
   - Notice the dashboard transforms into the **Constituency Fund Utilization & Progress Cockpit**.
   - Verify the **"Constituent Transparency Report"** action button.
   - Observe the **₹5 Cr Annual Fund Outlay & Utilization Rate** card (% of ₹5 Crore budget utilized).
   - Observe the **Stalled / Delayed Projects card** flagging projects in "Action Pending" $>180$ days.
   - Observe the **Constituency Governance Transparency Score** (e.g. 94.2%).
   - Observe the **Constituency Physical Progress & Asset Audit Map**.

- [ ] **Pass**: All 4 tiers render distinctly tailored governance cockpits with role-specific KPIs, specialized alert widgets, and authentic operational actions.

---

### Test Case 8: Role-Specific PDF Export with Mathematical Proofs & Custom Insights (Phase 5)
* **Target Route**: [`http://localhost:3000/reports`](http://localhost:3000/reports)
* **Phase Addressed**: Phase 5 (Bespoke Role-Scoped PDF Dossiers replacing generic templates)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/reports`](http://localhost:3000/reports).
2. **MoSPI Ministry PDF Test**:
   - In the top role switcher, select **MoSPI Ministry**.
   - Note the report card heading: **"National Parliamentary Audit Dossier (PAC Compliance)"**.
   - Subtitle specifies: *"Official submission package for Parliamentary Standing Committee & Public Accounts Committee (PAC)"*.
   - Click **"Download National PAC Audit Dossier (PDF)"**:
   - File downloaded: `SETU_MoSPI_National_Audit_Dossier.pdf`.
   - Open and inspect the PDF:
     - Header: Ministry of Statistics and Programme Implementation emblem & National PAC submission title.
     - Proofs & Insights: Macro national financial telemetry (sanctioned outlays, total anomaly exposure, high-risk works count).
     - Inter-state risk distribution table ranking state allocations and risk exposure.
     - Top priority PAC intervention works with exact risk index, IDA, and district.
3. **State Nodal (Bihar) PDF Test**:
   - In the top role switcher, select **State Nodal** (Jurisdiction: *Bihar*).
   - Note the report card heading updates to: **"Statewide MPLADS Implementation & Equity Vigilance Brief"**.
   - Click **"Download State Equity & Vigilance Brief (PDF)"**:
   - File downloaded: `SETU_State_Bihar_Vigilance_Brief.pdf`.
   - Open and inspect the PDF:
     - Header: State Planning & Monitoring Authority (State: Bihar).
     - Proofs & Insights: Statewide funds at risk, district anomaly rankings table (Darbhanga, Patna, Gaya, Muzaffarpur, Bhagalpur), and cross-district contractor monopoly alerts.
     - State-level statutory audit priority queue.
4. **District Magistrate (Darbhanga) PDF Test**:
   - In the top role switcher, select **District Authority** (Jurisdiction: *DARBHANGA*).
   - Note the report card heading updates to: **"Statutory Pre-Sanction Verification & Tender Structuring Audit"**.
   - Click **"Download DM Pre-Sanction Structuring Audit (PDF)"**:
   - File downloaded: `SETU_DM_DARBHANGA_Tender_Structuring_Audit.pdf`.
   - Open and inspect the PDF:
     - Header: Office of the District Magistrate & Collector, District: DARBHANGA.
     - **Concrete Mathematical Structuring Proof**: Highlights contracts clustered just below the ₹5,00,000 statutory e-tendering threshold with exact delta calculations (e.g. `Sanctioned: ₹4,87,000 | Below Threshold: -₹13,000 | IDA: District Engineer Office | Violation: Smurfing / Rule 14.2 Evasion`).
     - Actionable DM Pre-Sanction Inspection Checklist & Statutory Directive.
5. **Member of Parliament PDF Test**:
   - In the top role switcher, select **Member of Parliament** (Jurisdiction: *Mr Gopal Jee Thakur*).
   - Note the report card heading updates to: **"Constituency Fund Utilization & Asset Execution Scorecard"**.
   - Click **"Download MP Constituency Scorecard (PDF)"**:
   - File downloaded: `SETU_MP_Mr_Gopal_Jee_Thakur_Scorecard.pdf`.
   - Open and inspect the PDF:
     - Header: Member of Parliament — Darbhanga Parliamentary Constituency.
     - Proofs & Insights: ₹5.00 Cr annual budget utilization rate percentage, constituency governance transparency score.
     - **Accountability Delay Proofs Table**: Explicitly lists stalled works stuck in "Action Pending" $>180$ days, showing days elapsed, responsible IDA agency, and delayed capital.
     - Asset registry of physically completed projects.

- [ ] **Pass**: Every role generates a completely separate, beautifully structured PDF with role-specific proofs (e.g., threshold delta math for DM, stall delay accountability for MP, interstate distribution for MoSPI) rather than generic labels.

---

### Test Case 9: Case Investigation Workspace Interactive Triage (Phase 5)
* **Target Route**: [`http://localhost:3000/cases`](http://localhost:3000/cases)
* **Phase Addressed**: Phase 5 (Case Triage Workflows, Search, Filters, One-Click Advancement & Note Templates)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/cases`](http://localhost:3000/cases).
2. **Search & Filter Chips**:
   - Type `W-10002` or `Solar` in the search box: Watch cards filter instantaneously in real time.
   - Click the risk filter chips (**Critical**, **High**, **Medium**): Verify that cards match the active filter criteria.
   - Clear search to restore all cards.
3. **One-Click Card Advancement**:
   - In the **Flagged for Review** column, find any card and click **"Start Review →"**:
   - The card instantly transitions across into the **Under Investigation** column with updated timestamp and stage status.
   - On the card in **Under Investigation**, click **"Resolve ✓"**:
   - The card transitions to the **Resolved** column.
4. **Direct Work Audit Link**:
   - On any case card, click the link icon next to the Work ID (e.g. `W-10002`):
   - Opens the detailed audit page for that project in a new tab.
5. **Quick Note Templates in Drawer**:
   - Click any card to open the right inspection drawer.
   - Click any of the 4 quick note templates:
     - `"Requested physical milestone inspection"`
     - `"Flagged for tender structuring audit"`
     - `"Issued notice to Implementing Agency"`
     - `"Reconciled measurement book entry"`
   - Note the text populates into the investigation notes field instantly.

- [ ] **Pass**: Case searching, risk filtering, one-click stage advancement, direct work audit links, and quick note templates operate smoothly.

---

### Test Case 10: Contractor Cartel Profiler & Geospatial Breadcrumbs (Phase 5)
* **Target Routes**: [`http://localhost:3000/graph`](http://localhost:3000/graph) & [`http://localhost:3000/maps`](http://localhost:3000/maps)
* **Phase Addressed**: Phase 5 (Graph Cartel Exploration & Hierarchical GIS Navigation)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/graph`](http://localhost:3000/graph):
   - In the search box, type `District Engineer` or an agency name: Node highlights with active pulse.
   - Click the minimum volume filter buttons (**All**, **> ₹25L**, **> ₹50L**, **> ₹1 Cr**): Graph dynamically filters links based on capital flow.
   - Click any agency node: The right drawer reveals its connected counterparties with individual allocation sums and share percentages.
2. Navigate to [`http://localhost:3000/maps`](http://localhost:3000/maps):
   - Observe the new **Hierarchical Breadcrumb Navigation Bar** at the top of the map:
     - Shows: `All India (National Risk Choropleth)`.
   - Click on the state of **Bihar** or switch tab to **District Drilldown (Bihar)**:
     - Breadcrumbs update to: `All India > State: Bihar`.
   - Click on the **Village Audit Pins (Darbhanga)** tab:
     - Breadcrumbs update to: `All India > State: Bihar > GPS Village Audit Pins (Darbhanga)`.
   - Click `All India` in the breadcrumbs: Instantly returns to the National Choropleth view.

- [ ] **Pass**: Graph filtering/inspection and map breadcrumb navigation allow smooth, non-disruptive exploration.

---

### Test Case 11: Direct Flagging from Project Detail View (Phase 5)
* **Target Route**: [`http://localhost:3000/works/W-23167`](http://localhost:3000/works/W-23167)
* **Phase Addressed**: Phase 5 (End-to-End Investigation Case Creation)

#### Execution Steps:
1. Navigate to [`http://localhost:3000/works/W-23167`](http://localhost:3000/works/W-23167).
2. Click the red **"Flag for Investigation"** button.
3. Observe the dialog modal prompting for Case Title and Priority.
4. Click **"Confirm & Create Case"**:
   - The button initiates a live API request (`POST /api/cases`).
   - Displays confirmation: *"Case SETU-CASE-... registered successfully"*.
5. Navigate to [`http://localhost:3000/cases`](http://localhost:3000/cases):
   - Verify that the newly created case appears in the **Flagged for Review** column.

- [ ] **Pass**: New cases can be registered directly from individual work audits and show up immediately in the Kanban board.

---

### Test Case 13: Dynamic Authority-Specific Forensic Visualizers & Vendor Concentration Radar
* **Target Route**: [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard)
* **Objective**: Verify that switching governance authorities dynamically renders distinct, purpose-built CAG forensic visualizations reflecting each tier's legal mandate and political stakes, eliminating generic visualization duplication.

#### Execution Steps:
1. Navigate to [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard) in your browser.
2. **Inspect Ministry of Statistics and Programme Implementation (MoSPI) View**:
   - In the top governance role banner, select **"Ministry (MoSPI)"**.
   - Locate the primary visualizer section: **"National MPLADS Allocation Flow & Anti-Cartel Funnel"**.
   - Confirm the **National Fund Pipeline**: Trace the 4 stages from Parliamentary Recommendations (₹1,000+ Cr) &rarr; Administrative Sanction &rarr; Treasury Disbursement &rarr; Physical Asset Handover.
   - Confirm the **National Market Concentration (HHI)** gauge: Displays Herfindahl-Hirschman Index ($850 / 10,000$) indicating a competitive national distribution, along with the **CR3 Ratio** ($28.4\%$).
   - Inspect the **Cross-State High-Exposure Syndicates** leaderboard: Notice highlighted cartel corridors across major states.
3. **Switch to State Nodal Authority (SNA - Bihar) View**:
   - In the top banner, switch to **"State Nodal (Bihar)"**.
   - Observe the visualizer completely dynamically transform to: **"Statewide Vendor Concentration & Inter-District Equity Matrix"**.
   - Confirm the **State Vendor Concentration HHI Barometer**: Real database calculation displays $799.8 / 10,000$ with $CR3 = 39.1\%$.
   - Confirm the **Dominant State Executing IDAs**: Ranked list shows `SARAN CHAPRA IDA` capturing $20.8\%$ of state capital and `BHOJPUR ARRAH IDA` capturing $10.3\%$.
   - Inspect the **Inter-District Capital Allocation & Risk Disparity**: Real-time distribution matrix across Darbhanga, Patna, Gaya, Saran, and Bhagalpur.
4. **Switch to District Magistrate / DA (Darbhanga) View**:
   - In the top banner, switch to **"District Authority (Darbhanga)"**.
   - Observe the visualizer transform into the DM's statutory command radar: **"Statutory Pre-Sanction ₹5L Smurfing Radar & Vendor Capture Clustermap"**.
   - Inspect the **Statutory ₹5L Structuring Radar**: Live query detects 8+ proposals artificially structured at ₹4,92,000 (e.g. `W-23275`, `W-23276`, `W-23277`).
   - Notice the exact mathematical delta badge: **$-\text{₹}8,000$ Below ₹5L Limit**, alerting the DM to bypass of mandatory e-tendering rules.
   - Inspect the **Vendor / Agency Concentration Gauge**: Flags pure single-agency monopoly ($HHI = 10,000.0$) with 100% of district funds (₹5.21 Cr) routed into `DISTRICT MAGISTRATE DARBANGA_IDA`.
5. **Switch to Member of Parliament (Mr Gopal Jee Thakur) View**:
   - In the top banner, switch to **"MP (Gopal Jee Thakur)"**.
   - Observe the visualizer transform into the political accountability engine: **"Constituency Recommendation-to-Asset Delivery Pipeline"**.
   - Inspect the **4-Stage Delivery Pipeline**: Recommendation &rarr; Sanction &rarr; Work Order &rarr; Physical Completion ($37.8\%$ completion rate).
   - Inspect the **Agency Delay Sink Log (>180 Days)**: Direct accountability roster identifying executing agencies responsible for delayed citizen assets.

- [ ] **Pass**: Every authority renders a completely unique, dynamic visualizer with live forensic CAG metrics and zero duplicate layouts.

---

### Test Case 15: Dynamic Authority Visualizations for Money Flow & Cartels (`/graph`)
* **Target Route**: [`http://localhost:3000/graph`](http://localhost:3000/graph)
* **Objective**: Verify that the **Money Flow & Cartels page (`/graph`)** dynamically alters its entire visualization architecture across all 4 authorities, exposing vendor concentration, GFR tender structuring/smurfing, agency capture, and delivery dwell time.

#### Execution Steps:
1. Navigate to [`http://localhost:3000/graph`](http://localhost:3000/graph) in your browser.
2. **MoSPI Central Ministry Mode**:
   - Click the **"🏛️ MoSPI Ministry"** pill under the command header.
   - Observe the visualizer render the **"National Allocation Flow Conduit & Interstate Cartel Funnel"**.
   - Review the **Federal HHI Barometer**: $850.0 / 10,000$ (indicating competitive federal spread) and $CR5 = 28.4\%$.
   - Switch tabs to **"Interstate Cartels"**: Inspect the 3 flagged cross-state syndicates (e.g. Eastern PWD Syndicate with ₹48.25 Cr diverted across Bihar, UP, West Bengal with risk score 88.5).
   - Switch tabs to **"State Disparity Table"**: Inspect top 8 states ranked by total capital outlay.
3. **State Nodal Authority (SNA - Bihar) Mode**:
   - Click the **"⚖️ State Nodal (Bihar)"** pill.
   - Watch the visualizer transform into the **"Statewide Vendor Concentration Treemap & Inter-District Cartel Matrix"**.
   - Review the **State Concentration Barometer**: State HHI ($799.8$) and Top-3 Agency Concentration Ratio ($CR3 = 39.1\%$).
   - In the **Vendor Treemap**, notice how dominant IDAs (>10% share) have glowing amber borders. Click on **`DISTRICT PLANNING OFFICE SARAN CHAPRA_IDA`** (holding ₹19.4 Cr, 20.8% of state fund) to open its inspection drawer.
   - Switch tabs to **"Dominant IDAs"** to view the high-capture agency dossiers.
4. **District Magistrate (DA - Darbhanga) Mode**:
   - Click the **"🛡️ District DM (Darbhanga)"** pill.
   - Observe the transformation into the **"District Single-Vendor Capture Clustermap & Statutory Structuring Radar"**.
   - Review the **Monopoly Index**: Flags absolute single-agency monopoly ($HHI = 10,000.0$) with 100% of district funds (₹5.21 Cr across 128 works) captured by `DISTRICT MAGISTRATE DARBANGA_IDA`.
   - In the **₹5L Smurfing Radar**, inspect the 8 street light proposals clustered at ₹4.92 Lakhs with exact $-\text{₹}8,000$ statutory delta badges below the ₹5L e-tender limit and risk scores of 82.0. Click any card to open the pre-sanction inspection callout.
   - Switch tabs to **"100% Monopoly Clustermap"** to view the single-pipeline capture conduit.
5. **Member of Parliament (Mr Gopal Jee Thakur) Mode**:
   - Click the **"🗳️ MP (Gopal Jee Thakur)"** pill.
   - Observe the transformation into the **"Constituency Fund Flow, Block Allocation & Agency Delivery Velocity"** cockpit.
   - Review the **4-Stage Statutory Lifecycle Conduit**: Trace ₹5.21 Cr across Recommended (128 works) &rarr; Sanctioned (98 works) &rarr; Work Order (64 works) &rarr; Completed (48 works, $37.8\%$ completion rate).
   - Switch tabs to **"Agency Delay Sinks"**: Inspect the accountability log showing executing IDAs holding 98 works in delay with max dwell time of 245 days (>180 days).
6. **Raw Bipartite Network Exploration**:
   - Click the **"Show Bipartite Network"** button at the top right of the switcher bar.
   - Verify that the raw bipartite force-directed and alluvial graph expands below, allowing full node-and-link exploration if desired.

- [ ] **Pass**: Every authority on `/graph` receives an entirely customized, purpose-built visualization engine modeling real-world vendor concentration and cartel dynamics.

---

### Test Case 16: Automated Verification Commands
Run these commands in your terminal to re-verify compilation and regression suites at any time:

```bash
# 1. Type Safety Check (Zero errors)
cd /home/jarvis/SIH-DEMOS/sih-2026/frontend && npx tsc --noEmit

# 2. Automated UI Integration Test Suite (21/21 passing)
cd /home/jarvis/SIH-DEMOS/sih-2026/frontend && npm test

# 3. Production Bundle Build Verification (Static generation passes)
cd /home/jarvis/SIH-DEMOS/sih-2026/frontend && npm run build

# 4. Backend Regression Pytest Suite (13/13 passing)
cd /home/jarvis/SIH-DEMOS/sih-2026 && ./backend/venv/bin/pytest backend/app/tests/
```

- [ ] **Pass**: All automated suites report 100% success with 0 errors.

---

## 3. Test Summary Checklist

| # | Feature / Fix Verified | Phase | Status |
|---|---|---|---|
| 1 | Full-bleed landing page layout & SETU branding | Phase 1 & 2 | [ ] Pass |
| 2 | Case management outlay `₹NaN L` fixed & risk level badge | Phase 3 | [ ] Pass |
| 3 | Authentic 36-State GIS administrative boundaries & risk colors | Phase 3 | [ ] Pass |
| 4 | Alert severity casing & color formatting on `/alerts` | Phase 3 | [ ] Pass |
| 5 | Dynamic `API_BASE` in `/reports` PDF/CSV downloads | Phase 3 | [ ] Pass |
| 6 | 4-Tier governance role switcher telemetry on `/dashboard` | Phase 4 | [ ] Pass |
| 7 | Role-specific PDF Dossiers with bespoke proofs & insights (MoSPI, State, DM, MP) | Phase 5 | [ ] Pass |
| 8 | Case Kanban search, risk chips, one-click advance & note templates | Phase 5 | [ ] Pass |
| 9 | Cartel graph node search, volume filter & connected counterparties | Phase 5 | [ ] Pass |
| 10 | Geospatial hierarchical breadcrumb navigation on `/maps` | Phase 5 | [ ] Pass |
| 11 | Work detail "Flag for Investigation" live case creation | Phase 5 | [ ] Pass |
| 12 | Dynamic State-scoped MP-IDA Cartel Visualizer on `/graph` (19 states) | Phase 5.5 | [ ] Pass |
| 13 | Dynamic Authority-Specific Forensic Visualizers & Vendor Concentration Radar on `/dashboard` | Phase 6 | [ ] Pass |
| 14 | Dynamic Authority Visualizations for Money Flow & Cartels on `/graph` | Phase 7 | [ ] Pass |
| 15 | Zero TypeScript errors, 21/21 UI tests & 13/13 pytest pass | Phases 1–7 | [ ] Pass |



