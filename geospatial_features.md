# SETU Geospatial Intelligence & Forensic GIS Architecture
**Next-Generation Anti-Corruption & Public Procurement Anomaly Detection**

---

## Executive Overview
The **SETU Geospatial Risk Analyzer** is designed to transcend conventional administrative mapping. Rather than acting as a passive choropleth map, it serves as an **active forensic investigation suite** for MoSPI, the Comptroller and Auditor General (CAG), State Nodal Authorities, and District Collectors.

This document outlines the architectural blueprints for the **6 Breakthrough Forensic GIS Features** designed to elevate SETU into a globally competitive, high-impact civic intelligence platform.

---

## 1. Cross-Border Cartel Conduits (Forensic Flow Arcs)

### The Forensic Problem
Procurement syndicates and political contractors do not observe administrative borders. A shell entity registered in one district often captures works across multiple adjacent constituencies using front companies, circular bank guarantees, and identical signatory directors. Standard choropleth maps isolate constituencies into distinct bins, hiding these inter-district conduits.

### Architectural Solution
* **Animated Curved Arcs (Bézier Curves)**: When a user selects a contractor or enables *Cartel Conduit Mode*, parabolic SVG arcs are rendered across the map connecting the contractor's registered office or nodal base to all parliamentary constituencies where they hold active contracts.
* **Particle Flow Intensity**: The frequency and speed of animated particles travelling along the arc represent the monetary volume (`total_allocation`) and anomaly density (`structuring_risk`).
* **Multi-Constituency Syndicate Cluster**: Highlighting a constituency displays an automated convex hull (bounding boundary) showing the cartel's geographic sphere of influence.

### Technical Implementation
* **Renderer**: Native SVG `<path d="M x1,y1 Q cx,cy x2,y2" />` with SVG `stroke-dasharray` and CSS keyframe particle animation, or Canvas overlay.
* **Backend Contract**: `/api/geo/cartel-conduits?constituency={name}&threshold=0.65` returning coordinate pairs, contractor metadata, and multi-state conduit weights.
* **Color Encoding**: High-risk conduits rendered in Crimson (`#EF4444`) with outer radial glow; moderate cross-border ties in Warm Amber (`#F59E0B`).

---

## 2. 4D Temporal Audit Scrubber (Time-Lapse Anomaly Playback)

### The Forensic Problem
Corruption in public works follows pronounced temporal spikes:
1. **The "March Rush"**: Upwards of 40% of unspent fiscal year allocations are hastily sanctioned within the final 14 days of March to avoid fund lapsing.
2. **Pre-Election Allocation Surges**: Unprecedented spikes in work sanctions immediately preceding the Election Commission's Model Code of Conduct.

### Architectural Solution
* **Timeline Scrubber**: An interactive time slider docked at the bottom of the map spanning from 2019 to 2026, segmented into Fiscal Years, Quarters, and Months.
* **Automated Playback**: Clicking **"Play Audit Time-Lapse"** steps through monthly intervals at 60 FPS.
* **Heatmap Contagion**: Watch constituencies dynamically transition from emerald green (`#10B981`) to critical crimson (`#EF4444`) as seasonal funds dump, demonstrating the exact velocity of fund distribution anomalies.

### Technical Implementation
* **Client-Side State**: Pre-indexed temporal matrix `Map<month_key, Map<constituency_id, RiskScore>>` loaded as a single lightweight binary/JSON buffer (~85 KB compressed).
* **UI Controls**: Play/Pause, 1x/2x/4x scrub speed, leap-to-March-Rush, leap-to-Election-Quarter shortcuts.

---

## 3. Ghost Asset & GPS Collision Detector (Ground-Truth Satellite Audit)

### The Forensic Problem
One of the most persistent frauds uncovered by field audits is **"Ghost Works"**—such as high-mast solar lighting, borewells, or paving projects that exist solely on paper, or multiple work orders billed against the exact same physical coordinates.

### Architectural Solution
* **Spatial Collision Detection**: Algorithms flag clusters of distinct work orders claiming separate public outlays within an impossible proximity threshold ($< 15\text{ meters}$).
* **Satellite Ground-Truth Toggle**: Clicking on a flagged pin opens high-resolution satellite imagery with an automated AI asset overlay verifying whether physical construction is present or if identical assets are being billed repeatedly.
* **Telemetry Badge**: Pins tagged with *"Duplicate Asset Collision (3 works claimed at same GPS point)"*.

### Technical Implementation
* **Backend Route**: `/api/geo/gps-collisions?constituency={name}` utilizing PostGIS `ST_DWithin` spatial indexing.
* **Visuals**: Concentric pulsing radar rings in high-contrast amber/red centered on suspicious GPS clusters.

---

## 4. Executive Anomaly Tour ("Forensic Flight Path")

### The Forensic Problem
During high-level ministry reviews or live hackathon evaluations, manually searching and clicking through 543 constituencies can be cumbersome. Decision-makers require an automated, cinematic briefing highlighting the nation's most urgent audit concerns.

### Architectural Solution
* **"Start Executive Briefing" Action**: A prominent header action that triggers an autonomous, camera-choreographed flight path across India's top 5 critical corruption hotspots:
  1. **Hotspot 1 (Darbhanga, Bihar)**: Highlights ₹5 Lakh split-tender structuring and vendor monopoly capture.
  2. **Hotspot 2 (Murshidabad, West Bengal)**: Highlights cross-border shell agency conduit.
  3. **Hotspot 3 (Bellary, Karnataka)**: Highlights repetitive high-frequency single-bidder tenders.
* **Cinematic Viewport Transitions**: The map smoothly pans, tilts, and zooms to each hotspot with smooth cubic-bezier camera physics, locks for 6 seconds, displays an automated forensic HUD summary, and moves to the next.

### Technical Implementation
* **Camera Sequencer**: Waypoint state machine interpolating `zoom` and `pan` over predefined coordinate waypoints with audio/visual telemetry readouts.

---

## 5. Policy Simulation Sandbox ("What-If" Regulatory Engine)

### The Forensic Problem
Audit reports typically document past damage without providing actionable intelligence on what policy levers will prevent future losses.

### Architectural Solution
* **Interactive Policy Sliders**:
  * *Single-Tender Award Ceiling*: Adjust from ₹25 Lakh down to ₹2.5 Lakh.
  * *Vendor Dormancy Rule*: Automatically disqualify entities inactive for $> 180$ days.
  * *Cartel Interlocking Threshold*: Enforce immediate audit flags if 2 vendors share $> 30\%$ common board directors.
* **Live Recalculation**: Moving any slider triggers an instant recalculation of risk scores across all 543 constituencies.
* **National Impact Metric**: A dynamic header counter displays:
  > *"Proposed Policy Intervention Prevents ₹64.20 Crore in At-Risk Public Outlay Across 42 High-Risk Constituencies."*

### Technical Implementation
* **Fast Vector Math**: Vectorized evaluation in Web Worker or lightweight WASM/JS engine recalculating risk formulas against in-memory dataset in $< 16\text{ms}$.

---

## 6. Side-by-Side Split-Screen Forensic Comparison Lens

### The Forensic Problem
Auditors need to compare the operational integrity of two neighboring or peer constituencies that receive identical ₹5 Crore annual MPLADS allotments.

### Architectural Solution
* **Dual Viewport / Comparison Slider**:
  * Compare **Constituency A vs. Constituency B** side-by-side.
  * Compare **Sanctioned Outlay vs. Physical Completion Reality**.
  * Synchronized pan and zoom: navigating one pane locks and tracks the other.
* **Variance Delta Matrix**: Shows the comparative vendor capture HHI, structuring frequency, and completion velocity in a unified delta card.

---

## Roadmap & Prioritization Matrix

| Feature | Forensic Value | Visual "Wow" Factor | Implementation Effort | Recommended Order |
| :--- | :---: | :---: | :---: | :---: |
| **Cartel Flow Conduits** | Critical | Extraordinary | Medium | **Phase 1** |
| **4D Temporal Scrubber** | High | High | Medium | **Phase 2** |
| **Executive Anomaly Tour** | High | Very High | Low–Medium | **Phase 3** |
| **Ghost Asset Detector** | High | High | Medium | **Phase 4** |
| **Policy Sandbox Engine** | Very High | High | High | **Phase 5** |
| **Split-Screen Lens** | Medium | Medium | Medium | **Phase 6** |

---
*Authored by the SETU Core Architecture Team — SIH 2026*
