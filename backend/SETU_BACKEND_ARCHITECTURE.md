# SETU Backend Architecture & Technical Implementation Manual

> **Platform**: SETU — AI-Powered MPLADS Anomaly, Fraud & Inefficiency Detection Platform  
> **Stakeholder**: Ministry of Statistics and Programme Implementation (MoSPI), Government of India  
> **Repository**: `Barath-j593/sih-2026`  
> **Workspace**: `backend/`  
> **Status**: **100% Implemented & Verified (136 / 136 Pytest Tests Passing)**

---

## 1. Executive Summary

The **SETU** backend is an enterprise-grade, high-density AI platform designed to monitor, detect, and explain anomalies, inefficiencies, and corrupt practices in India's **Member of Parliament Local Area Development Scheme (MPLADS)** fund utilization.

The backend synthesizes **8 distinct machine learning models** (7 specialized unsupervised domain detectors + 1 calibrated supervised classifier) with multi-evidence risk fusion, relational database synchronization, real-time live proposal scoring ($< 250\text{ms}$ latency), and strict Role-Based Access Control (RBAC) governed by JSON Web Tokens (JWT).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SETU BACKEND ARCHITECTURE OVERVIEW                                   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                          
 ┌───────────────────────┐                                                                               
 │ 12 Relational CSVs    │ ───► Ingestion & Referential Integrity Validation (Stage 1)                  
 └───────────────────────┘                                                                               
             │                                                                                            
             ▼                                                                                            
 ┌───────────────────────┐                                                                               
 │ Master Feature Store  │ ───► 5,000 Projects × 239 Non-Leaking Canonical Features (Stage 2A)           
 └───────────────────────┘                                                                               
             │                                                                                            
             ├──────────────────────────┬──────────────────────────┬──────────────────────────┐          
             ▼                          ▼                          ▼                          ▼          
    ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐ 
    │ Model 1: Finan. │        │ Model 2: Geo.   │        │ Model 3: Proc.  │        │ Model 4: Contr. │ 
    │ IsolationForest │        │ DBSCAN/LOF/Dist │        │ Rigging/Benford │        │ HHI/Capacity    │ 
    └─────────────────┘        └─────────────────┘        └─────────────────┘        └─────────────────┘ 
             │                          │                          │                          │          
             ├──────────────────────────┼──────────────────────────┼──────────────────────────┘          
             ▼                          ▼                          ▼                                     
    ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐                            
    │ Model 5: Paym.  │        │ Model 6: Progr. │        │ Model 7: Graph  │                            
    │ Smurfing/Burst  │        │ Phys/Fin Diverg │        │ Louvain/Centr.  │                            
    └─────────────────┘        └─────────────────┘        └─────────────────┘                            
             │                          │                          │                                     
             └──────────────────────────┼──────────────────────────┘                                     
                                        ▼                                                                
                        ┌───────────────────────────────┐                                                
                        │ 7 Domain Anomaly Scores (0-100)│                                               
                        └───────────────────────────────┘                                                
                                        │                                                                
                                        ▼                                                                
                        ┌───────────────────────────────┐                                                
                        │ Model 8: Supervised Calibrated│ ───► Calibrated Probability P(fraud)           
                        │ Classifier (XGBoost Ensemble) │      ROC-AUC: 0.9500 | PR-AUC: 0.9361          
                        └───────────────────────────────┘                                                
                                        │                                                                
                                        ▼                                                                
                        ┌───────────────────────────────┐                                                
                        │ Multi-Signal Risk Fusion      │ ───► 60% Supervised + 40% Unsupervised Blending
                        │ Engine (Stage 4)              │      Critical & High Anomaly Overrides         
                        └───────────────────────────────┘      Reason Trace Synthesizer & Typologies     
                                        │                                                                
                                        ├──────────────────────────────────────────────┐                 
                                        ▼                                              ▼                 
                        ┌───────────────────────────────┐              ┌───────────────────────────────┐ 
                        │ Database Sync Pipeline        │              │ Live Inference Service        │ 
                        │ 5,000 Works | 906 Alerts      │              │ In-Memory 8-Model Scoring     │ 
                        │ 30 Cases | 903 MPs | 1,211 IDA│              │ Unseen Proposals (< 250ms)    │ 
                        └───────────────────────────────┘              └───────────────────────────────┘ 
                                        │                                              │                 
                                        └──────────────────────┬───────────────────────┘                 
                                                               ▼                                         
                                                ┌───────────────────────────────┐                        
                                                │ FastAPI Serving Layer         │                        
                                                │ JWT Auth & Role-Based Access  │                        
                                                │ REST Endpoints (/api/...)     │                        
                                                └───────────────────────────────┘                        
```

---

## 2. Core Subsystems & How Each Component Works

### Subsystem 1: Master Feature Store (`app/ml/data/`)

* **Source Data**: 12 relational synthetic tables (`01_projects.csv` through `12_labels.csv`) reflecting realistic Indian public procurement distributions across Lok Sabha and Rajya Sabha constituencies.
* **Feature Pipeline (`setu_data_layer.py`)**:
  * Enforces primary key uniqueness and foreign key referential integrity across all 12 tables.
  * Eliminates label contamination: 9 target columns from `12_labels.csv` (`fraud_label`, `risk_level`, `scenario_type`, etc.) are strictly quarantined into `project_labels.csv` and excluded from model inputs.
  * Eliminates raw entity strings from predictive feature matrices to prevent memorization.
  * Aggregates payment sequences (disbursement entropy, velocity bursts, smurfing ratios) and project milestones (stall indicators, physical-financial divergence).
* **Canonical Output**: `project_master_features.csv` ($5,000 \times 239$). Exactly 1 row per project.

---

### Subsystem 2: The 8 Machine Learning Models (`app/ml/models/`)

Every domain model is housed in its own modular package adhering to strict architectural isolation:
`config.py`, `preprocessor.py`, `baseline_detectors.py`, `<domain>_model.py`, `evaluator.py`, `pipeline.py`, and `artifacts/`.

```
backend/app/ml/models/
├── financial/     ── Model 1: Financial & Expenditure Deviation
├── geospatial/    ── Model 2: Geospatial Clustering & Ghost Work Detection
├── procurement/   ── Model 3: Tender Rigging & Bid Suppression
├── contractor/    ── Model 4: Contractor Capacity & Agency Monopolization
├── payment/       ── Model 5: Granular Payment Structuring & Smurfing
├── progress/      ── Model 6: Physical vs. Financial Progress Trajectory
├── graph/         ── Model 7: Entity Graph & Collusive Ring Mining
└── supervised/    ── Model 8: Calibrated Supervised Fraud Classifier
```

#### Model 1: Financial Execution Model (`models/financial/`)
* **Objective**: Detect uncalibrated project allocations, severe budget deviations, and cost padding.
* **Mechanism**:
  * Fits `RobustScaler` on peer-normalized financial metrics.
  * Calculates robust Median and Median Absolute Deviation (MAD) across localized `work_type` and `category` peer groups.
  * Trains `IsolationForest` to isolate outliers in multidimensional financial space.
  * Normalizes raw decision values to a continuous $[0.0, 100.0]$ anomaly score.

#### Model 2: Geospatial & Clustering Model (`models/geospatial/`)
* **Objective**: Detect phantom/ghost projects, artificial site clustering, and geographically isolated anomalies.
* **Mechanism**:
  * Converts coordinates $(\text{lat}, \text{lon})$ to radians and computes spherical Haversine distances.
  * Evaluates $k$-nearest neighbor distance ($k=15$) and local density within a $25\text{km}$ radius.
  * Runs spatial **DBSCAN** ($\varepsilon = 15\text{km}$) to isolate abnormal spatial project pockets.
  * Runs spatial **Local Outlier Factor (LOF)** to identify isolated works far from population centers or infrastructure gap corridors.
  * Implements fallback logic to support single-row proposal evaluation during live API scoring.

#### Model 3: Procurement & Tender Rigging Model (`models/procurement/`)
* **Objective**: Detect bid suppression, single-bidder captures, collusive bidding, and compressed tender publication windows.
* **Mechanism**:
  * Computes **bid suppression index** ($\text{disqualified bidders} / \text{total participants}$).
  * Measures **quotation similarity** among competing bids to identify collusive pricing rings.
  * Quantifies **tender window compression** (statutory norm $\ge 21$ days vs. compressed notice $\le 14$ days).
  * Tracks **post-award value leakage** ($\text{amendment value} / \text{initial contract value}$).
  * Scored using `IsolationForest` calibrated to $0\text{--}100$.

#### Model 4: Contractor & Agency Monopolization Model (`models/contractor/`)
* **Objective**: Detect contractor capture, agency favoritism, and execution capacity strain.
* **Mechanism**:
  * Computes **Herfindahl-Hirschman Index (HHI)** for vendor concentration within each agency jurisdiction.
  * Evaluates **contractor backlog strain**: ratio of active simultaneous projects to the vendor's empirical staff capacity.
  * Tracks historical execution failure rates and repeat contractor awards.

#### Model 5: Granular Payment Structuring Model (`models/payment/`)
* **Objective**: Detect statutory threshold smurfing, disbursement velocity bursts, and unverified releases.
* **Mechanism**:
  * Evaluates **smurfing density**: proportion of payment disbursements clustered just below audit thresholds (e.g., ₹49,000--₹49,999 and ₹98,000--₹99,999).
  * Measures **payment velocity bursts**: standard deviation and entropy of payment release dates.
  * Flags payments disbursed prior to certified stage-gate milestone completion.
  * Normalizes IsolationForest raw scores using empirical min-max training bounds $[-0.2270, 0.1175]$.

#### Model 6: Progress & Execution Trajectory Model (`models/progress/`)
* **Objective**: Detect physical vs. financial progress divergence, phantom execution stalls, and severe timeline overruns.
* **Mechanism**:
  * Computes **physical-financial divergence**: $\Delta = |\text{Financial Progress \%} - \text{Physical Progress \%}|$. A large divergence (e.g. 90% funds released, 15% ground completion) indicates fund diversion.
  * Calculates **timeline overrun index**: $(\text{Actual Days} - \text{Planned Days}) / \text{Planned Days}$.
  * Detects **execution stall proxy**: zero progress milestones recorded over multiple consecutive audit quarters.
  * Calibrated using empirical training bounds $[-0.2598, 0.1271]$.

#### Model 7: Entity Graph & Collusion Model (`models/graph/`)
* **Objective**: Uncover tripartite collusion networks between MPs, District Implementing Agencies (IDAs), and Contractors.
* **Mechanism**:
  * Constructs a weighted bipartite network using `NetworkX`.
  * Computes **PageRank centrality** and **Betweenness centrality** to locate dominant intermediary entities.
  * Runs **Louvain community detection** to detect closed cliques and monopolized procurement clusters.
  * Identifies triangular collusion cycles ($\text{MP} \leftrightarrow \text{IDA} \leftrightarrow \text{Contractor}$).
  * Calibrated using empirical training bounds $[-0.1946, 0.1454]$.

#### Model 8: Supervised Calibrated Risk Predictor (`models/supervised/`)
* **Objective**: High-precision probabilistic classification benchmarking all 7 domain indicators against verified ground-truth audit typologies.
* **Mechanism**:
  * Meta-feature vector composed of:
    * 7 continuous domain anomaly scores ($0\text{--}100$).
    * 7 empirical domain percentiles.
    * 4 statistical cross-domain aggregations ($\max, \text{mean}, \text{std}, \text{count}(\text{score} \ge 60)$).
    * 5 contextual baseline attributes (planned duration, project size, population density, infrastructure gap, sanctioned amount).
  * Architecture: **XGBoost Classifier** wrapped in **`CalibratedClassifierCV` (isotonic regression)**.
  * **Empirical Results**:
    * **ROC-AUC**: `0.9500` (target $\ge 0.88$).
    * **PR-AUC**: `0.9361` (target $\ge 0.85$).
    * **Top 1% Enrichment**: `4.98x` with **`100% purity`** (all projects in the top 1% risk percentile are genuine fraud cases).

---

### Subsystem 3: Multi-Signal Risk Fusion Engine (`models/risk_fusion_engine.py`)

Synthesizes intermediate domain signals and supervised probabilities into unified administrative risk intelligence:

```python
# Weighted blending formula
Unsupervised_Component = sum(Domain_Score_i * Weight_i) / sum(Weight_i)
Supervised_Component = Calibrated_Fraud_Probability * 100.0

Composite_Score = (0.60 * Supervised_Component) + (0.40 * Unsupervised_Component)

# Critical Override: High-probability fraud is guaranteed CRITICAL tier
if Calibrated_Fraud_Probability >= 0.85:
    Composite_Score = max(Composite_Score, 80.0)

# High Override: Extreme anomaly in any domain with moderate fraud probability
if max(Domain_Scores) >= 95.0 and Calibrated_Fraud_Probability >= 0.35:
    Composite_Score = max(Composite_Score, 65.0)
```

* **Administrative Risk Tiers**:
  * `CRITICAL` ($\ge 80.0$ or $P(\text{fraud}) \ge 0.85$): Mandates immediate physical inspection and administrative freeze.
  * `HIGH` ($60.0 \le \text{Score} < 80.0$): Technical audit required; priority queue.
  * `MEDIUM` ($40.0 \le \text{Score} < 60.0$): Conditional clearance; periodic monitoring.
  * `LOW` ($< 40.0$): Green-channel automatic processing.
* **Workflow Priorities**: `IMMEDIATE` ($\text{CRITICAL}$), `PRIORITY` ($\text{HIGH}$), `ROUTINE` ($\text{MEDIUM} / \text{LOW}$).
* **Explainable Reason Traces**: Automatically ranks and formats human-readable evidence points from domains exceeding anomalous thresholds ($\ge 40.0$).

---

### Subsystem 4: Database Synchronization Pipeline (`services/sync_service.py`)

* **Purpose**: Bridges the ML feature space and the operational SQL database so all frontend portals (MoSPI Central, State Nodal, District Collector, MP Dashboard) render accurate 8-model risk metrics.
* **Execution**:
  * Reads `fused_risk_intelligence.csv`, `01_projects.csv`, `02_financials.csv`, `10_constituencies.csv`, and `08_agencies.csv`.
  * Upserts all **5,000 unified works** into the `works` table, populating:
    * `risk_score` (calibrated 0-100 composite score).
    * `risk_level` (`Critical`, `High`, `Medium`, `Low`).
    * `risk_reasons` (JSON list of synthesized reasons).
    * `sub_scores` (JSON dict of all 7 domain scores + `ml_fraud_probability`).
    * `predicted_fraud_type` (`overpricing`, `ghost_project`, `duplicate`, `single_bid_tender`, etc.).
  * Generates **906 high & critical alerts** into the `alerts` table.
  * Generates **30 formal vigilance investigation case files** into the `cases` table for top critical works ($\text{Score} \ge 85.0$).
  * Aggregates administrative portfolios across **903 MPs** and **1,211 IDAs** (calculating total works, allocations, average risk, and flagged counts).
  * Guarantees persistence of standard demo users (`ministry_admin`, `state_nodal_bihar`, `state_nodal_rajasthan`, `district_darbhanga`, `mp_gopal_jee`).
  * Integrated into `real_data_loader.py` for automated startup synchronization.

---

### Subsystem 5: Live Inference Pipeline for New Proposals (`services/live_inference_service.py`)

* **Purpose**: Evaluates unseen work proposals submitted by implementing agencies or MPs in real time before administrative sanction.
* **Architecture**:
  * Implemented as an in-memory **Singleton** (`LiveInferenceService.get_instance()`).
  * Loads all 8 production `joblib` estimators and preprocessors into RAM on server startup.
  * Caches a national baseline reference row template from `project_master_features.csv` to automatically impute any background indicators not provided in raw proposal forms.
* **Latency**: Evaluates a proposal across all 8 models in **$\approx 200\text{ms}$**.
* **Endpoint**: `POST /api/risk-intelligence/score-proposal`
* **Response Includes**:
  * `proposal_id`: Proposal ID.
  * `overall_risk_score`: Calibrated composite score (0-100).
  * `risk_level`: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
  * `investigation_priority`: `IMMEDIATE`, `PRIORITY`, `ROUTINE`.
  * `primary_typology`: Dominant anomaly archetype.
  * `fraud_probability`: Calibrated likelihood from Model 8.
  * `approval_recommendation`:
    * `AUTOMATIC_CLEARANCE`: Compliant project profile.
    * `CONDITIONAL_APPROVAL`: Minor deviations; requires milestone tracking.
    * `MANDATORY_TECHNICAL_AUDIT`: Substantial variance; rate verification required.
    * `REJECT_AND_INVESTIGATE`: Critical multi-model fraud flags detected.
  * `sub_scores`: Complete 8-element dictionary.
  * `synthesized_reasons`: Human-readable audit findings.
  * `inference_time_ms`: Execution time in milliseconds.

---

### Subsystem 6: Security, JWT & Role-Based Access Control (`core/security.py`)

* **JWT Standard**: Cryptographic tokens signed using `HS256` containing `sub` (User ID / Username), `role`, `jurisdiction`, and `exp`.
* **User Resolution (`get_current_user`)**:
  * Extracts Bearer token from the `Authorization` header.
  * Decodes payload and queries the `users` database table.
  * Supports seamless fallback for demo credentials and mock test tokens.
* **Role-Based Access Control (`require_roles(...)`)**:
  * Enforces role hierarchies on FastAPI routes:
    * `ministry`: Central MoSPI administrator; national visibility; case management.
    * `state`: State Nodal Officer; state-scoped jurisdiction.
    * `district`: District Collector / Magistrate; district-scoped operations.
    * `mp`: Member of Parliament; constituency-scoped work tracking.
* **Secured Routes**:
  * `POST /api/cases`: Restricted to `["ministry", "state", "district"]`.
  * `PATCH /api/cases/{case_id}/status`: Restricted to `["ministry", "state", "district"]`.
  * `POST /api/cases/{case_id}/notes`: Open to all authenticated stakeholder roles (`["ministry", "state", "district", "mp"]`).
  * `GET /api/auth/me`: Returns authenticated user identity and jurisdiction.

---

## 3. API Endpoint Directory

All routes are mounted under `/api` in `app/main.py`:

| HTTP Method | Endpoint Path | Description | Access Control |
| :--- | :--- | :--- | :--- |
| **Authentication** | | | |
| `POST` | `/api/auth/login` | Authenticate user credentials / role shortcut; returns JWT | Public |
| `GET` | `/api/auth/demo-users` | List preset demo credentials for evaluation | Public |
| `GET` | `/api/auth/me` | Retrieve profile and jurisdiction of logged-in user | **Bearer JWT** |
| **Risk Intelligence & ML Evidence** | | | |
| `POST` | `/api/risk-intelligence/score-proposal` | **Real-time 8-model evaluation of unseen proposal (< 250ms)** | Public / Auth |
| `GET` | `/api/risk-intelligence/summary` | Macro-level national risk distributions and typology shares | Public |
| `GET` | `/api/risk-intelligence/projects` | Paginated search across 5,000 scored works with filters | Public |
| `GET` | `/api/risk-intelligence/projects/{id}` | Detailed 8-model evidence dossier & Tree SHAP attributions | Public |
| `POST` | `/api/risk-intelligence/fuse` | Interactive multi-signal evidence fusion simulator | Public |
| `GET` | `/api/risk-intelligence/reports` | List generated model audit reports | Public |
| `GET` | `/api/risk-intelligence/reports/{name}` | Fetch full Markdown report content | Public |
| **Works & Proposals** | | | |
| `GET` | `/api/works` | Paginated project listing with risk score filters | Public |
| `GET` | `/api/works/filters` | Dynamic filter options (states, categories, IDAs) | Public |
| `GET` | `/api/works/{work_id}` | Detailed project metadata and sub-score breakdown | Public |
| **Dashboard & Analytics** | | | |
| `GET` | `/api/dashboard` | Role-scoped KPI dashboard (Ministry, State, District, MP) | Scoped |
| **Alerts & Cases** | | | |
| `GET` | `/api/alerts` | Filtered list of anomaly alerts | Public |
| `POST` | `/api/alerts/{id}/read` | Mark individual alert as read | Public / Auth |
| `POST` | `/api/alerts/read-all` | Mark all alerts as read | Public / Auth |
| `GET` | `/api/cases` | List vigilance investigation cases | Public |
| `GET` | `/api/cases/{id}` | View single case investigation dossier | Public |
| `POST` | `/api/cases` | Open formal investigation case | **RBAC: Ministry, State, District** |
| `PATCH` | `/api/cases/{id}/status` | Update case status (`flagged`, `under_review`, `resolved`) | **RBAC: Ministry, State, District** |
| `POST` | `/api/cases/{id}/notes` | Append audit note to investigation file | **RBAC: All Logged-in Roles** |
| **Platform Health & Metrics** | | | |
| `GET` | `/` | Platform version and API documentation index | Public |
| `GET` | `/health` | Service health status check | Public |
| `GET` | `/api/model-metrics` | Precision, recall, and ROC-AUC metrics | Public |

---

## 4. Verification & Testing Suite

The repository contains **136 automated tests** providing complete coverage of data validation, all 8 machine learning models, relational database synchronization, live scoring, and security:

```powershell
# Run the complete test suite from repository root
.\backend\venv\Scripts\pytest.exe backend/tests/ -v
```

### Test Suite Structure

| Test File | Description | Test Count |
| :--- | :--- | :---: |
| `backend/tests/api/test_auth_rbac.py` | JWT generation, 401 unauth checks, 403 role enforcement on cases | 5 |
| `backend/tests/api/test_live_inference_api.py` | Live proposal scoring: normal vs. anomalous works, latency benchmarks | 3 |
| `backend/tests/api/test_risk_intelligence_api.py` | Summary, paginated projects, single-dossier, interactive fusion simulator | 8 |
| `backend/tests/services/test_sync_service.py` | Relational sync: 5,000 works, 906 alerts, 30 cases, MPs, IDAs, demo users | 1 |
| `backend/tests/ml/data/test_aggregators.py` | Temporal payment and progress aggregators | 2 |
| `backend/tests/ml/data/test_determinism.py` | Reproducibility of master feature compilation | 1 |
| `backend/tests/ml/data/test_feature_audit.py` | Schema compliance and feature range bounds | 8 |
| `backend/tests/ml/data/test_feature_builder.py` | 239-column compilation from raw synthetic tables | 4 |
| `backend/tests/ml/data/test_leakage.py` | Strict quarantine validation against target leakage | 2 |
| `backend/tests/ml/data/test_referential_integrity.py` | Primary and foreign key referential integrity checks | 4 |
| `backend/tests/ml/models/test_financial_model.py` | Model 1: Peer MAD, Isolation Forest, score bounds | 10 |
| `backend/tests/ml/models/test_geospatial_model.py` | Model 2: Haversine distances, DBSCAN, LOF, ghost work capture | 11 |
| `backend/tests/ml/models/test_procurement_model.py` | Model 3: Single-bid flags, bid suppression, tender window compression | 11 |
| `backend/tests/ml/models/test_contractor_model.py` | Model 4: Vendor HHI, agency monopolization, capacity strain | 11 |
| `backend/tests/ml/models/test_payment_model.py` | Model 5: Smurfing thresholds, disbursement velocity, unverified releases | 11 |
| `backend/tests/ml/models/test_progress_model.py` | Model 6: Physical vs financial divergence, stall detection | 11 |
| `backend/tests/ml/models/test_graph_model.py` | Model 7: NetworkX centrality, Louvain community cliques | 11 |
| `backend/tests/ml/models/test_supervised_model.py` | Model 8: XGBoost classifier, isotonic calibration, PR-AUC / ROC-AUC | 11 |
| `backend/tests/ml/models/test_risk_fusion_engine.py` | Stage 4: Fusion blending, critical/high overrides, reason traces | 11 |
| **TOTAL** | **Full Backend Test Suite** | **136 / 136 Passed** |

---

## 5. Operations & Developer Guide

### 5.1 Environment Setup

```powershell
# Navigate to repository root
cd "c:\Personal projects\sih 2026"

# Activate the virtual environment
.\backend\venv\Scripts\Activate.ps1

# Install / verify dependencies
pip install -r backend/requirements.txt
```

### 5.2 Synchronizing the Database

To synchronize or rebuild the SQLite database (`setu_mplads.db`) with the 5,000 multi-model projects:

```powershell
.\backend\venv\Scripts\python.exe -c "
import sys; sys.path.insert(0, 'backend')
from app.core.database import SessionLocal
from app.services.sync_service import sync_fused_risk_to_database
db = SessionLocal()
res = sync_fused_risk_to_database(db, force=True)
print('Database Sync Complete:', res)
db.close()
"
```

### 5.3 Starting the FastAPI Server

```powershell
# Start server with auto-reload
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
```

* **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 5.4 Testing Live Proposal Scoring via cURL / PowerShell

```powershell
# Test live proposal scoring (< 250ms)
Invoke-RestMethod -Uri "http://localhost:8000/api/risk-intelligence/score-proposal" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "work_name": "Installation of 100 High-Mast LED Solar Lights",
    "category": "Drinking Water & Sanitation",
    "state": "Bihar",
    "constituency": "Darbhanga",
    "sanctioned_amount": 1500000.0,
    "planned_duration_days": 180,
    "num_bidders": 3
  }'
```

### 5.5 Preset Demo Accounts for Evaluation

| Role | Username | Password | Jurisdiction | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Ministry Admin** | `ministry_admin` | `ministry123` | National | MoSPI Central Monitoring Directorate |
| **State Nodal (Bihar)** | `state_nodal_bihar` | `state123` | Bihar | Planning & Development Dept, Govt of Bihar |
| **State Nodal (Rajasthan)** | `state_nodal_rajasthan` | `state123` | Rajasthan | Dept of Rural Development, Govt of Rajasthan |
| **District Collector** | `district_darbhanga` | `district123` | DARBHANGA | District Collectorate, Darbhanga |
| **Member of Parliament** | `mp_gopal_jee` | `mp123` | Mr Gopal Jee Thakur | Lok Sabha Secretariat (Darbhanga) |
