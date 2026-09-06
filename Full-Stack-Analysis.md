# Technical Analysis, Deployment & Architectural Deep Dive: SETU (Smart Expenditure Tracking & Understanding)

**Repository:** `https://github.com/Barath-j593/sih-2026.git`  
**Problem Statement:** SIH26102 — Ministry of Statistics and Programme Implementation (MoSPI)  
**Target Domain:** MPLADS (Member of Parliament Local Area Development Scheme) Anomaly, Fraud & Inefficiency Detection Platform  

---

## 1. Deployment Status

| Service | Environment | Status | Port | Engine / Runtime |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | Local Daemon | **ONLINE / HEALTHY** | `8000` | FastAPI 0.141.1 + Uvicorn + SQLite 3 (15,000 scored records) |
| **Frontend UI** | Local Daemon | **ONLINE / HEALTHY** | `3000` | Next.js 14.2.35 (App Router) + React 18 + Tailwind CSS |
| **ML Engine** | In-Process Embedded | **ACTIVE** | N/A | XGBoost + Isolation Forest + LOF + NetworkX Centrality |
| **Test Suite** | Pytest | **13/13 PASSED (100%)**| N/A | Feature tests, Model tests, API endpoint integration tests |
| **Production Container**| Docker & Compose | **READY** | `3000`, `8000` | Multi-stage Dockerfiles + `docker-compose.yml` created |

---

## 2. Live URL(s)

* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend API Root:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **Interactive API Documentation (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **OpenAPI Specification JSON:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)
* **Backend Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

*(Note on cloud deployment: Production-ready multi-stage Dockerfiles and `docker-compose.yml` have been created in the project root for single-command deployment to Render, Railway, Fly.io, or any cloud/VPS instance).*

---

## 3. Local Setup Instructions

### Prerequisites
* **Python 3.10+** (Tested on Python 3.12.3)
* **Node.js 18+** and **npm 9+** (Tested on Node v22.22.2, npm 10.9.7)
* **Git**

### Step-by-Step Setup

#### A. Clone & Prepare Environment
```bash
git clone https://github.com/Barath-j593/sih-2026.git
cd sih-2026
```

#### B. Backend Setup (FastAPI & ML Ensemble)
```bash
# 1. Create and activate Python virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# 2. Install Python dependencies
pip install -r backend/requirements.txt

# 3. Configure environment variables
cp backend/.env.example backend/.env

# 4. Ingest and score real MPLADS dataset (populates SQLite DB)
python backend/app/ml/data/real_data_loader.py

# 5. Execute automated test suite
PYTHONPATH=. pytest backend/app/tests/

# 6. Start the FastAPI backend server
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### C. Frontend Setup (Next.js 14)
```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Configure environment variables
cp .env.example .env.local

# 3. Install NPM packages
npm install --legacy-peer-deps

# 4. Build or run dev server
npm run dev -- -p 3000
# OR for production build:
# npm run build && npm start -- -p 3000
```

#### D. Production Docker Deployment (Alternative)
```bash
# Launch both services in isolated containers
docker compose up --build -d
```

---

## 4. Architecture Overview

SETU implements a **Two-Track Data & Machine Learning Architecture** designed specifically for government public-works auditability where true negative and positive ground truths are absent in raw government gazettes.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 SETU PLATFORM OVERVIEW                 │
                  └────────────────────────────────────────────────────────┘
                  
  Track 1: Supervised Model Training               Track 2: Real Data Ingestion & Scoring
┌──────────────────────────────────────┐        ┌─────────────────────────────────────────┐
│       synthetic_generator.py         │        │       MPLADS_cleaned_featured.csv       │
│  20,000 ground-truth labeled records │        │       60,356 real government works      │
└──────────────────┬───────────────────┘        └────────────────────┬────────────────────┘
                   │                                                 │
                   ▼                                                 ▼
┌──────────────────────────────────────┐        ┌─────────────────────────────────────────┐
│             train_all.py             │        │          real_data_loader.py            │
│  Fits XGBoost, IsoForest, LOF, Graph │        │    12-dimensional feature extraction    │
└──────────────────┬───────────────────┘        └────────────────────┬────────────────────┘
                   │                                                 │
                   ▼                                                 ▼
┌──────────────────────────────────────┐        ┌─────────────────────────────────────────┐
│     saved_models/*.joblib Artifacts  │───────>│           Batch ML Inference            │
│       metrics.json (AUC: 0.980)      │        │      Risk Fusion Engine (0-100)         │
└──────────────────────────────────────┘        └────────────────────┬────────────────────┘
                                                                     │
                                                                     ▼
                                                ┌─────────────────────────────────────────┐
                                                │      SQLite / PostgreSQL Storage        │
                                                │  (Works, MPs, IDAs, Cases, Alerts, Geo) │
                                                └────────────────────┬────────────────────┘
                                                                     │
                                                                     ▼
                                                ┌─────────────────────────────────────────┐
                                                │              FastAPI Layer              │
                                                │       Role-Scoped API Endpoints         │
                                                └────────────────────┬────────────────────┘
                                                                     │
                                                                     ▼
                                                ┌─────────────────────────────────────────┐
                                                │       Next.js 14 App Router UI          │
                                                │   Role Switcher: Ministry | State |     │
                                                │             District | MP               │
                                                └─────────────────────────────────────────┘
```

### Why the Dual-Track Architecture?
1. **The Public Data Dilemma:** Government records in `MPLADS_cleaned_featured.csv` contain real financial transactions and dates, but lack explicit labels (`is_fraud`). Without ground truth, standard classification metrics (Precision, Recall, ROC-AUC) cannot be computed.
2. **Track 1 (Supervised Ground Truth):** `synthetic_generator.py` injects 5 realistic corruption typologies into 20,000 synthetic records with known labels. `train_all.py` fits the supervised models, yielding benchmarked holdout metrics (**ROC-AUC 0.980**, Precision 77.4%, Recall 79.1%).
3. **Track 2 (Inference & Audit Scoring):** The trained model artifacts (`xgb_classifier.joblib`, `iso_forest.joblib`, `lof.joblib`, `graph_model.joblib`) are loaded by `real_data_loader.py`. It extracts 12 feature vectors from the 60,356 real records, runs ensemble inference, passes outputs into the `RiskFusionEngine`, and seeds the database with risk scores, sub-scores, and human-readable audit reason traces.

---

## 5. Detailed Technical Explanation

### A. Frontend Architecture
* **Framework:** Next.js 14.2.35 with React 18 and TypeScript.
* **Routing Strategy:** Next.js App Router (`frontend/app/`):
  * `/`: Role-scoped landing dashboard with dynamic KPI cards, state choropleth, fraud breakdown, and flagged works.
  * `/works`: Fast client/server paginated data matrix with full-text search and multi-parameter filtering (state, category, risk level, fraud typology).
  * `/works/[id]`: Project Digital Twin & Work Audit Detail featuring a 6-axis **Recharts Radar chart**, individual signal sub-scores, and an actionable "Flag for Investigation" button.
  * `/maps`: Multi-tier geospatial visualizer (National State Choropleth, District Risk Ranking, and Village GPS Pin clustering).
  * `/graph`: Interactive force-directed canvas (`react-force-graph-2d`) depicting the bipartite network of MPs and Implementing District Authorities (IDAs), highlighting cartel monopolization.
  * `/cases`: 3-stage Kanban board (`flagged` $\to$ `under_review` $\to$ `resolved`) with persistent audit note logging.
  * `/alerts`: Real-time anomaly notification feed with severity indicators.
  * `/reports`: Statutory compliance dossier exporter streaming certified multi-page PDF documents and CSV dumps.
  * `/model-metrics`: Model transparency portal displaying holdout metrics, 2x2 confusion matrix, and XGBoost feature importance rankings.
  * `/roadmap`: Institutional architecture specifications for PWD Schedule of Rates (SoR), GeM debarred registries, and citizen geotagging.
* **State Management:** React Context API via `RoleContext.tsx`, which persists the active persona (`ministry`, `state`, `district`, `mp`) and jurisdiction in `localStorage`, propagating role changes to all downstream API queries.
* **Styling & Tokens:** Tailwind CSS 3.4 with custom design tokens for risk tiers (Emerald for Low, Amber for Medium, Orange for High, and Red with glowing pulse for Critical).

### B. Backend Architecture
* **Framework:** FastAPI 0.141.1 running on Uvicorn ASGI.
* **Application Lifespan:** Handled via `@asynccontextmanager lifespan(app: FastAPI)` in `main.py`, which initializes database schemas via SQLAlchemy and loads the singleton model registry into memory on server boot.
* **Modular Routing:** 10 decoupled APIRouters under `/api`:
  * `auth.py`: JWT-based token generation and authentication.
  * `dashboard.py`: Aggregated KPI cards, risk distribution, and fraud typology counts scoped to the calling persona.
  * `works.py`: Filterable, paginated queries against the `works` table.
  * `geo.py`: Pre-aggregated geospatial choropleth, district drilldowns, and GPS coordinates.
  * `graph.py`: NetworkX-backed node/link serialization for force-directed graphing.
  * `cases.py`: Case lifecycle management (status transitions, priority updates, audit note appending).
  * `alerts.py`: Anomaly alerts list and read status toggling.
  * `reports.py`: Dynamic ReportLab PDF rendering and streaming CSV exporter.
  * `model_metrics.py`: Serves `saved_models/metrics.json` directly to the client.
  * `future_stubs.py`: Architectural specs for Phase 2 modules.
* **Validation:** Pydantic v2 schemas across all request/response models.

### C. Database Architecture
* **Storage Engine:** SQLite 3 (default file-backed at `backend/setu_mplads.db`, with native support for PostgreSQL via `DATABASE_URL` environment variable).
* **ORM:** SQLAlchemy 2.0 with declarative base mapping.
* **Entity Relational Models:**
  1. **`Work` (`works` table):** 48 columns containing administrative metadata (`id`, `mp_name`, `work`, `category`, `state`, `constituency`, `ida`, `allocation_amount`, `status`, `recommended_date`), pre-calculated peer benchmarks (`state_mean_alloc`, `alloc_zscore_state`, `worktype_mean_alloc`, `alloc_zscore_worktype`), and ML risk fields (`risk_score`, `risk_level`, `risk_reasons` [JSON], `sub_scores` [JSON], `predicted_fraud_type`).
  2. **`MP` (`mps` table):** Aggregated parliamentary profiles (`mp_name`, `state`, `house`, `total_allocation`, `total_works`, `avg_risk_score`, `flagged_works_count`, `top_ida`).
  3. **`IDA` (`idas` table):** Implementing District Authorities (`name`, `state`, `district`, `total_works`, `total_amount`, `avg_risk_score`, `unique_mps_count`, `max_mp_share`).
  4. **`Constituency` (`constituencies` table):** Geographical constituencies with latitude/longitude centroids and risk averages.
  5. **`Case` (`cases` table):** Formal investigation files (`id`, `case_number`, `title`, `description`, `status`, `priority`, `work_id`, `mp_name`, `state`, `district`, `risk_score`, `assigned_to`, `notes` [JSON chronological logs]).
  6. **`Alert` (`alerts` table):** Automated anomaly alerts (`id`, `title`, `description`, `severity`, `work_id`, `mp_name`, `fraud_type`, `risk_score`, `is_read`).
  7. **`User` (`users` table):** Scoped user accounts with salted password hashes.

### D. AI/ML Components & The 6 Signal Vectors

Every public work is evaluated against 6 discrete signal detectors combined by the **Risk Fusion Engine**:

| Signal Vector | Mathematical / Algorithmic Basis | Detection Target | Audit Output String |
| :--- | :--- | :--- | :--- |
| **1. Peer Cost Z-Score**<br/>`peer_zscore.py` | $Z = \frac{X - \mu_{\text{State, WorkType}}}{\sigma_{\text{State, WorkType}}}$ | Cost Escalation / Overpricing | *"Peer cost is significantly higher (+4.9σ) than peer benchmark for construction of community centers (₹4,995,000)"* |
| **2. Duplicate & Cluster Density**<br/>`duplicate_detector.py`, `fuzzy_duplicate.py` | Exact matching on `(MP, Work, Amount)` + TF-IDF cosine similarity matrix on work descriptions | Duplicate funding of identical physical assets | *"High-density duplicate cluster: 22 identical works recommended by the same MP with matching amount"* |
| **3. Threshold Structuring**<br/>`structuring_detector.py` | Proximity calculation for amounts in range $[0.94 \times T, 0.999 \times T]$ for statutory thresholds $T \in \{₹5\text{L}, ₹10\text{L}, ₹25\text{L}, ₹50\text{L}\}$ | Smurfing / Tender Splitting to evade public e-tendering rules | *"Allocation amount ₹4,99,000 sits immediately below standard statutory approval threshold"* |
| **4. Agency Capture & Monopoly**<br/>`vendor_concentration.py`, `graph_risk_model.py` | NetworkX Bipartite Graph PageRank + Degree Centrality + MP-to-IDA allocation ratio ($>65\%$) | Vendor / Implementing Agency favoritism & cartel monopolization | *"Implementing Agency 'DISTRICT COLLECTOR X' captures 74% of all works recommended by this MP"* |
| **5. Execution Stall / Ghost Proxy**<br/>`stall_detector.py` | Non-linear decay function over elapsed days ($D \ge 180$) while status remains `Unsanctioned` or `Action Pending` | Stalled allocations, locked capital, ghost projects | *"Stalled project: Stagnant for 320 days in 'Unsanctioned' status without execution progress"* |
| **6. Unsupervised Outliers**<br/>`isolation_forest_model.py`, `lof_model.py` | Isolation Forest (100 isolation trees) + Local Outlier Factor (LOF, $k=20$) across all 12 feature dimensions | Multi-variate anomalies not captured by individual univariate rules | Statistical outlier score contribution |

#### Risk Fusion Formulation
In `risk_fusion_engine.py`, the individual signals are unified:

$$\text{RawScore} = 0.35 \cdot P_{\text{XGBoost}} + 0.18 \cdot S_{\text{Cost}} + 0.15 \cdot S_{\text{Duplicate}} + 0.10 \cdot S_{\text{Structuring}} + 0.10 \cdot S_{\text{Vendor}} + 0.07 \cdot S_{\text{Stall}} + 0.05 \cdot S_{\text{Unsupervised}}$$

$$\text{Composite Score} = \min\left(99.5, \max\left(\text{FloorBoost}, \text{RawScore} \times 100\right)\right)$$

* **Floor Boost Overrides:** If an extreme violation occurs (e.g., duplicate count $\ge 10$, or peer $Z \ge 4.0\sigma$), the risk score floor is programmatically elevated to $\ge 80.0$ (Critical), guaranteeing that critical corruption signals cannot be diluted by low variance on other dimensions.

---

## 6. Technical Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Next.js 14 Frontend Application (Port 3000)"]
        RS["RoleContext & Sticky Role Switcher<br/>(Ministry | State | District | MP)"]
        P1["Live Dashboard Page (/)"]
        P2["Works Explorer Matrix (/works)"]
        P3["Work Audit Detail & Radar (/works/[id])"]
        P4["Geospatial Multi-Tier Maps (/maps)"]
        P5["MP-IDA Network Graph (/graph)"]
        P6["Case Kanban Workflow (/cases)"]
        P7["Alerts & Reports (/alerts, /reports)"]
        
        RS --> P1 & P2 & P3 & P4 & P5 & P6 & P7
    end

    subgraph API["FastAPI Application Layer (Port 8000)"]
        AUTH["/api/auth (JWT)"]
        DASH["/api/dashboard"]
        WRK["/api/works"]
        GEO["/api/geo"]
        GRP["/api/graph"]
        CAS["/api/cases"]
        REP["/api/reports (PDF & CSV)"]
        MET["/api/model-metrics"]
    end

    subgraph Service["Backend Services & Business Logic"]
        DS["dashboard_service.py"]
        WS["work_service.py"]
        GS["geo_service.py"]
        GRS["graph_service.py"]
        CS["case_service.py"]
        RSV["report_service.py (ReportLab)"]
    end

    subgraph Engine["AI / ML Ensemble & Fusion Pipeline"]
        REG["Model Registry (Singleton)"]
        XGB["XGBoost Supervised Classifier (ROC-AUC: 0.980)"]
        IF["Isolation Forest Anomaly Detector"]
        LOF["Local Outlier Factor (LOF)"]
        NX["NetworkX Bipartite Graph Centrality"]
        FEAT["12-Feature Pipeline (Z-Score, Dupe, Structuring, Stall)"]
        FUS["Risk Fusion Engine (0-100 Score + Explainable Traces)"]
        
        FEAT --> XGB & IF & LOF & NX
        XGB & IF & LOF & NX --> FUS
        REG --> FUS
    end

    subgraph Data["Persistent Storage Layer"]
        DB[("SQLite Database<br/>setu_mplads.db (17MB)<br/>Works | MPs | IDAs | Cases | Alerts")]
        CSV[("Raw Dataset<br/>MPLADS_cleaned_featured.csv<br/>(60,356 Public Works)")]
        MODELS[("Saved Joblib Artifacts<br/>xgb, iso_forest, lof, graph")]
    end

    %% Connections
    P1 & P2 & P3 & P4 & P5 & P6 & P7 -->|REST HTTP / JSON| API
    DASH --> DS
    WRK --> WS
    GEO --> GS
    GRP --> GRS
    CAS --> CS
    REP --> RSV
    
    DS & WS & GS & CS & RSV --> DB
    GRS --> NX
    WS --> FUS
    
    CSV -->|Batch Ingestion & Scoring| FEAT
    MODELS --> REG
    FUS -->|Populates Scored Tables| DB
```

---

## 7. End-to-End Data Flow: A Real User Journey

Here is the exact trace of how data flows through the application when an audit inquiry is conducted on a flagged public work:

```
[District Magistrate] ──(1) Views Flagged Work W-23167──> [Next.js Frontend /works/W-23167]
                                                                    │
                                                               (2) GET /api/works/W-23167
                                                                    ▼
                                                            [FastAPI Router]
                                                                    │
                                                       (3) work_service.py queries DB
                                                                    ▼
                                                         [SQLite: works table]
                                                                    │
                                                       (4) Returns stored ML risk_score (85.0),
                                                           sub_scores, and risk_reasons:
                                                           "Peer cost +4.9σ variance"
                                                           "Near-duplicate description"
                                                           "Allocation immediately below ₹50L"
                                                                    ▼
[DM clicks 'Flag for Investigation'] ──(5) POST /api/cases──> [cases.py Router]
                                                                    │
                                                       (6) Creates Case entity:
                                                           status="flagged", priority="critical",
                                                           assigned_to="District Vigilance Cell"
                                                                    ▼
                                                         [SQLite: cases table]
                                                                    │
                                                       (7) Case displays on Kanban Board (/cases)
                                                                    ▼
[Officer adds inspection note] ──(8) POST /api/cases/CASE-xyz/notes ──> [case_service.py]
                                                                    │
                                                       (9) Appends JSON note & updates status
                                                           to "under_review"
                                                                    ▼
[DM clicks 'Generate PDF Dossier'] ──(10) GET /api/reports/audit-pdf?jurisdiction=DARBHANGA ──> [report_service.py]
                                                                    │
                                                       (11) Queries DB for flagged works & cases;
                                                            ReportLab compiles official PDF dossier
                                                            with MoSPI header & audit tables
                                                                    ▼
[Officer receives certified PDF] <──(12) HTTP 200 application/pdf streamed to browser
```

---

## 8. AI/ML Pipeline Deep-Dive

### A. Model Specifications & Training Configuration
* **Supervised Classifier:** XGBoost (`n_estimators=120`, `max_depth=5`, `learning_rate=0.08`, `subsample=0.85`, `colsample_bytree=0.85`, `eval_metric="logloss"`).
  * *Training Data:* 20,000 synthetic records (`synthetic_mplads.csv`) generated with mathematical fraud injection parameters (cost escalation multipliers, duplicate injection loops, smurfing clusters, vendor monopolization).
  * *Train/Test Split:* 80/20 stratified split (16,000 train, 4,000 test).
  * *Holdout Evaluation:*
    * **ROC-AUC:** `0.9795` (~0.980)
    * **Precision:** `77.38%`
    * **Recall / Sensitivity:** `79.06%`
    * **F1-Score:** `78.21%`
    * **Overall Accuracy:** `93.42%`
    * **Confusion Matrix:** True Negatives: 3,262 | False Positives: 187 | False Negatives: 167 | True Positives: 384.
* **Unsupervised Anomaly Detectors:**
  * *Isolation Forest:* `n_estimators=100`, `contamination=0.08`, `max_samples="auto"`.
  * *Local Outlier Factor (LOF):* `n_neighbors=20`, `contamination=0.08`, `novelty=True`.
* **Bipartite Network Graph:**
  * NetworkX bipartite graph with MPs and IDAs as node partitions, weighted by total allocation currency. PageRank and degree centrality identify single-agency monopolies where an MP awards $>65\%$ of all projects to one contractor.

### B. Feature Importance Ranking (XGBoost)
Extracted directly from `metrics.json`:
1. `ALLOC_ZSCORE_STATE` (34.2%): Relative overpricing against same-state civil works.
2. `DUPLICATE_COUNT` (22.8%): Frequency of identical work titles and matching financial outlays.
3. `IDA_MP_WORK_SHARE` (18.1%): Proportion of MP funds captured by a single executing agency.
4. `STRUCTURING_SCORE` (12.4%): Proximity to statutory public tender ceilings.
5. `STALL_RISK_SCORE` (7.6%): Latency in unsanctioned status.
6. `ALLOC_ZSCORE_WORKTYPE` (4.9%): Variance from national work-type norms.

---

## 9. Important Files and Their Roles

| File Path | Component | Exact Technical Responsibility |
| :--- | :--- | :--- |
| `MPLADS_cleaned_featured.csv` | Real Dataset | 60,356 real government public works records with financial and administrative fields. |
| `backend/app/main.py` | Application Entrypoint | FastAPI app declaration, lifespan startup data seeder, CORS middleware, and router mounting. |
| `backend/app/core/config.py` | Configuration | Pydantic Settings class managing environment variables, paths, and defaults. |
| `backend/app/core/database.py` | Database Engine | SQLAlchemy engine, session maker, and `get_db` dependency provider. |
| `backend/app/models/work.py` | Data Model | ORM model defining the schema for the `works` table, including risk and ML fields. |
| `backend/app/models/case.py` | Data Model | ORM model for investigations, tracking statuses (`flagged`, `under_review`, `resolved`) and JSON audit notes. |
| `backend/app/ml/features/feature_pipeline.py` | ML Pipeline | 12-dimensional feature extraction orchestrating z-scores, duplicates, structuring, and stall signals. |
| `backend/app/ml/models/risk_fusion_engine.py` | ML Ensemble | Calibrates composite 0–100 scores, determines risk tiers, and builds human-readable audit reason traces. |
| `backend/app/ml/models/graph_risk_model.py` | Network Graph | Builds bipartite NetworkX graph of MPs and IDAs, calculating PageRank and monopolization ratios. |
| `backend/app/ml/data/real_data_loader.py` | Data Ingestion | Ingests CSV, runs batch ML inference, and populates SQLite database tables. |
| `backend/app/services/report_service.py` | Compliance Exporter | Dynamically generates certified PDF audit dossiers using ReportLab and CSV exports. |
| `frontend/context/RoleContext.tsx` | Frontend State | Persistent Role Switcher state (`ministry`, `state`, `district`, `mp`), scoping all dashboard queries. |
| `frontend/app/page.tsx` | Frontend View | Role-scoped live dashboard with KPI cards, choropleth maps, fraud typologies, and flagged works. |
| `frontend/app/works/[id]/page.tsx` | Frontend View | Project Digital Twin page featuring 6-axis Recharts radar and audit reason breakdown. |
| `frontend/app/cases/page.tsx` | Frontend View | Interactive 3-column Kanban board for investigation management with audit note logging. |
| `frontend/components/graph/MPIDANetworkGraph.tsx` | Frontend Component | Force-directed 2D canvas displaying MP-IDA cartels and concentration edges. |

---

## 10. Audit: Issues Discovered, Risks & Fixes Made

### A. Confirmed Issues Discovered & Fixed

1. **Missing Environment Configuration Files:**
   * *Issue:* The repository did not include `.env.example` or `.env` files for either backend or frontend, making initial setup and environment variable discovery difficult.
   * *Fix Made:* Created `backend/.env.example`, `backend/.env`, `frontend/.env.example`, and `frontend/.env.local` with clear documentation and safe placeholders.
2. **Untracked Environment Files in `.gitignore`:**
   * *Issue:* `.gitignore` lacked rules for `.env` and `.env.local`, creating a risk that developers might accidentally commit secrets to version control.
   * *Fix Made:* Updated `.gitignore` with explicit exclusions for all `.env*` local files.
3. **Database Dependency in Test Suite Execution:**
   * *Issue:* Running `pytest app/tests/` failed 4 tests with `sqlite3.OperationalError: no such table: alerts` because `TestClient(app)` does not automatically execute the FastAPI `lifespan` context manager where `Base.metadata.create_all` resides.
   * *Fix Made:* Initialized and seeded the database via `real_data_loader.py`. Now all **13/13 tests pass**.
4. **Missing Containerization for Production Deployment:**
   * *Issue:* No Dockerfiles or deployment manifests were present in the repository.
   * *Fix Made:* Authored `backend/Dockerfile`, `frontend/Dockerfile`, and root `docker-compose.yml` with optimized multi-stage builds.

### B. Potential Risks & Technical Debt Identified (Codebase Review)

1. **Static Salt & SHA-256 in Security Module:**
   * *Location:* `backend/app/core/security.py`
   * *Risk:* Uses a static salt (`"setu_mplads_sih_2026_secure_salt"`) with a single round of SHA-256 rather than bcrypt or Argon2 with adaptive cost factors. Additionally, `verify_password` contains `if plain_password == hashed_password: return True`, which allows plaintext matching if unhashed passwords exist in the database.
   * *Recommendation:* Switch to `passlib.context.CryptContext(schemes=["bcrypt"])` and enforce password hashing on user creation.
2. **Wildcard CORS with Credentials:**
   * *Location:* `backend/app/core/config.py`
   * *Risk:* `CORS_ORIGINS` includes `*` alongside `allow_credentials=True`. Standard browsers reject credentialed requests when origin is wildcard `*`.
   * *Recommendation:* In production, remove `*` and restrict `CORS_ORIGINS` to explicit production domain origins.
3. **Python 3.12+ Deprecations:**
   * *Location:* `datetime.utcnow()` across multiple backend files (`real_data_loader.py`, `work.py`, `case_service.py`).
   * *Risk:* `datetime.utcnow()` is deprecated in Python 3.12 and scheduled for deprecation in Python 3.14.
   * *Recommendation:* Refactor to `datetime.now(timezone.utc)`.
4. **Pydantic v1 Syntax Deprecations:**
   * *Location:* Pydantic schemas using class-based `class Config:` and `.from_orm()`.
   * *Risk:* Generates runtime deprecation warnings in Pydantic v2.13+.
   * *Recommendation:* Refactor to `model_config = ConfigDict(from_attributes=True)` and `model_validate()`.
5. **Partial Dataset Loading in Default Config:**
   * *Location:* `real_data_loader.py` (`max_rows=12000` in `main.py`, `max_rows=15000` in script).
   * *Risk:* For demonstration speed, only 15,000 of the 60,356 works are loaded by default.
   * *Recommendation:* Provide an explicit CLI flag `--full-load` to ingest the complete 60,356 dataset into PostgreSQL or SQLite when running in staging/production.

---

## 11. Recommended Improvements

1. **Database Migration Pipeline (Alembic):**
   * Integrate Alembic for version-controlled database schema migrations rather than relying on `Base.metadata.create_all()`.
2. **PostgreSQL + PostGIS in Production:**
   * While SQLite works well for local evaluation and demos, deploying on PostgreSQL with PostGIS will enable spatial queries (e.g. finding duplicate projects within a 500-meter radius using spatial indexing).
3. **Redis Caching for Heavy Aggregations:**
   * Cache responses for `/api/dashboard`, `/api/geo/states-choropleth`, and `/api/graph/network` using Redis to maintain sub-10ms response times under high concurrency.
4. **SHAP (SHapley Additive exPlanations) Integration:**
   * Augment the rule-based reason strings with local SHAP feature force plots on `/works/[id]` to visualize feature contributions for each prediction.
5. **Role-Based Access Control (RBAC):**
   * While the sticky Role Switcher is convenient for hackathon evaluators to test all 4 government tiers, production deployment should enforce JWT claims verification on endpoints according to the authenticated user's jurisdiction.

---

## 12. "How the Entire App Works" — Technical Interview Pitch

> *"**SETU** is an explainable AI surveillance and decision-support platform built for India's Member of Parliament Local Area Development Scheme (MPLADS) under MoSPI.*
>
> *MPLADS distributes ₹5 Crore annually per MP for localized development, but real-world execution suffers from cost inflation, duplicate sanctions, vendor cartels, and contract structuring below statutory tender thresholds. Because real government gazettes lack ground-truth fraud labels, SETU solves this with a **Two-Track Machine Learning Architecture**:*
>
> *In **Track 1**, we mathematically model 5 real-world corruption typologies in a synthetic generator with 20,000 ground-truth labeled cases to train a multi-signal ensemble combining an **XGBoost classifier**, **Isolation Forest**, **Local Outlier Factor**, and a **NetworkX bipartite graph** for MP-IDA cartel centrality. On holdout validation, this achieves an **ROC-AUC of 0.980** with 93.4% accuracy.*
>
> *In **Track 2**, the pre-trained ensemble ingests 60,356 real government project records, extracts 12 feature vectors, and passes them through a calibrated **Risk Fusion Engine** that computes a normalized 0 to 100 risk score and human-readable audit reason traces.*
>
> *The backend is built on **FastAPI** with SQLite/PostgreSQL, featuring role-scoped endpoints. The frontend is a **Next.js 14** application with a sticky **4-Role Persona Switcher** (Ministry, State, District, and MP). Users can inspect geospatial choropleths, interact with force-directed network graphs of vendor capture, examine 6-axis explainability radar charts for individual projects, transition cases through an active **Kanban workflow**, and dynamically compile **certified PDF audit dossiers** for the Public Accounts Committee in a single click."*
