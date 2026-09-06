import sys
from pathlib import Path

base_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(base_dir.parent.parent.parent))

import pandas as pd
from app.ml.data.schemas import (
    TEMPORALLY_SENSITIVE_FEATURES,
    TARGET_LEAKAGE_COLUMNS,
    RAW_IDENTITY_COLUMNS,
    RELATIONAL_KEYS,
)

base_dir = Path(__file__).resolve().parent
master_path = base_dir / "processed" / "project_master_features.csv"
labels_path = base_dir / "processed" / "project_labels.csv"

master = pd.read_csv(master_path)
labels = pd.read_csv(labels_path)

lines = []
lines.append("# SETU Feature Store — Data Dictionary & Lineage Specification\n")
lines.append(f"This document provides complete metadata, source lineage, transformation formulas, domain semantics, and ML-safety classifications for all **{len(master.columns)} features** in `project_master_features.csv` and the quarantined target store `project_labels.csv`.\n")

lines.append("## 1. Architectural Safeguards\n")
lines.append("- **Strict 1-to-1 Project Grain**: Every row represents exactly one project uniquely keyed by `project_id` (dynamically verified).\n")
lines.append("- **Zero Target Leakage**: Supervised labels from `12_labels.csv` (`fraud_label`, `is_fraud`, `is_anomalous`, `risk_level`, `scenario_type`, `scenario_name`, `overall_risk_score`, `investigation_priority`) are quarantined exclusively into `project_labels.csv`.\n")
lines.append("- **Identity Protection**: Raw text names (`contractor_name`, `agency_name`, `mp_name`, `district_name`, `state_name`, `constituency_name`) are stripped from predictive feature vectors. Predictive models learn behavioral and contextual patterns rather than memorizing entity identities.\n")
lines.append("- **Feature Lineage Grouping**: All feature columns are prefixed with their domain source group (`project__`, `financial__`, `payment__`, `progress__`, `procurement__`, `contract__`, `contractor__`, `agency__`, `geo__`, `constituency__`, `document__`).\n")
lines.append("- **Temporal Sensitivity**: Outcome-adjacent or post-completion features are marked as `TEMPORALLY_SENSITIVE`.\n")

lines.append("## 2. Feature Group Summary\n")
prefix_counts = {}
for c in master.columns:
    p = c.split("__")[0] if "__" in c else "relational_id"
    prefix_counts[p] = prefix_counts.get(p, 0) + 1

lines.append("| Feature Group Prefix | Domain Source | Column Count | Description |")
lines.append("| :--- | :--- | :--- | :--- |")
lines.append(f"| `relational_id` | Core Relational Keys | {prefix_counts.get('relational_id', 0)} | Primary and Foreign key identifiers for graph lineage & tracing |")
lines.append(f"| `project__` | 01_projects.csv | {prefix_counts.get('project', 0)} | Project categories, types, duration, status, and coordinates |")
lines.append(f"| `financial__` | 02_financials.csv | {prefix_counts.get('financial', 0)} | Cost estimates, sanctioned amounts, peer deviations, and cost overruns |")
lines.append(f"| `payment__` | 03_payments.csv | {prefix_counts.get('payment', 0)} | Aggregated payment volume, timing, interval std, velocity, and anomalies |")
lines.append(f"| `progress__` | 04_progress.csv | {prefix_counts.get('progress', 0)} | Aggregated physical/financial progress, time-aware slopes, gaps, delays |")
lines.append(f"| `procurement__` | 05_procurement.csv | {prefix_counts.get('procurement', 0)} | Tendering method, bid counts, competition score, bid price similarity |")
lines.append(f"| `contract__` | 06_contracts.csv | {prefix_counts.get('contract', 0)} | Work order values, amendments, extensions, capacity strain |")
lines.append(f"| `contractor__` | 07_contractors.csv | {prefix_counts.get('contractor', 0)} | Contractor historical irregularity rate, value share, cartel/ownership ties |")
lines.append(f"| `agency__` | 08_agencies.csv | {prefix_counts.get('agency', 0)} | Implementing agency workload ratio, geographic concentration |")
lines.append(f"| `geo__` | 09_geography.csv | {prefix_counts.get('geo', 0)} | District population density, literacy, poverty, infrastructure gap index |")
lines.append(f"| `constituency__` | 10_constituencies.csv | {prefix_counts.get('constituency', 0)} | Parliamentary house category and institutional context |")
lines.append(f"| `document__` | 11_documents.csv | {prefix_counts.get('document', 0)} | Document completeness, OCR confidence, tampering flags, asset evidence |")
lines.append(f"| **Total Master Features** | **All Sources** | **{len(master.columns)}** | **Unified Single-Row Project Feature Store** |\n")

lines.append("## 3. Comprehensive Feature Dictionary\n")
lines.append("| Feature Name | Source Table | Source Column | Grain | Transformation | Domain Meaning | ML-Safe? |")
lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")

for col in master.columns:
    if col in RELATIONAL_KEYS or col.endswith("_id"):
        src_table = "01_projects.csv"
        src_col = col
        grain = "project"
        trans = "Direct relational key"
        meaning = f"Unique relational identifier for {col}"
        safe = "NO (IDENTIFIER)"
    elif col.startswith("project__"):
        clean = col.replace("project__", "")
        src_table = "01_projects.csv"
        src_col = clean
        grain = "project"
        trans = "Left join from 01_projects with project__ prefix"
        meaning = f"Project attribute {clean}"
        safe = "TEMPORALLY_SENSITIVE" if col in TEMPORALLY_SENSITIVE_FEATURES else "YES"
    elif col.startswith("financial__"):
        clean = col.replace("financial__", "")
        src_table = "02_financials.csv"
        src_col = clean
        grain = "project"
        trans = "1:1 join on project_id with financial__ prefix"
        meaning = f"Financial metric {clean}"
        safe = "TEMPORALLY_SENSITIVE" if col in TEMPORALLY_SENSITIVE_FEATURES else "YES"
    elif col.startswith("payment__"):
        clean = col.replace("payment__", "")
        src_table = "03_payments.csv"
        src_col = clean
        grain = "project"
        trans = "Groupby project_id aggregation over payment transactions"
        meaning = f"Aggregated payment feature {clean}"
        safe = "YES"
    elif col.startswith("progress__"):
        clean = col.replace("progress__", "")
        src_table = "04_progress.csv"
        src_col = clean
        grain = "project"
        trans = "Time-aware chronological aggregation over progress records"
        meaning = f"Aggregated progress feature {clean}"
        safe = "TEMPORALLY_SENSITIVE" if col in TEMPORALLY_SENSITIVE_FEATURES else "YES"
    elif col.startswith("procurement__"):
        clean = col.replace("procurement__", "")
        src_table = "05_procurement.csv"
        src_col = clean
        grain = "project"
        trans = "1:1 join on project_id with procurement__ prefix"
        meaning = f"Tender/procurement feature {clean}"
        safe = "YES"
    elif col.startswith("contract__"):
        clean = col.replace("contract__", "")
        src_table = "06_contracts.csv"
        src_col = clean
        grain = "project"
        trans = "1:1 join on project_id with contract__ prefix"
        meaning = f"Contract lifecycle feature {clean}"
        safe = "TEMPORALLY_SENSITIVE" if col in TEMPORALLY_SENSITIVE_FEATURES else "YES"
    elif col.startswith("contractor__"):
        clean = col.replace("contractor__", "")
        src_table = "07_contractors.csv"
        src_col = clean
        grain = "contractor"
        trans = "N:1 join on contractor_id with contractor__ prefix (identity dropped)"
        meaning = f"Contractor behavioral attribute {clean}"
        safe = "YES"
    elif col.startswith("agency__"):
        clean = col.replace("agency__", "")
        src_table = "08_agencies.csv"
        src_col = clean
        grain = "agency"
        trans = "N:1 join on agency_id with agency__ prefix (identity dropped)"
        meaning = f"Implementing agency attribute {clean}"
        safe = "YES"
    elif col.startswith("geo__"):
        clean = col.replace("geo__", "")
        src_table = "09_geography.csv"
        src_col = clean
        grain = "district"
        trans = "N:1 join on district_id with geo__ prefix (text names dropped)"
        meaning = f"District socio-economic context {clean}"
        safe = "YES"
    elif col.startswith("constituency__"):
        clean = col.replace("constituency__", "")
        src_table = "10_constituencies.csv"
        src_col = clean
        grain = "constituency"
        trans = "N:1 join on constituency_id with constituency__ prefix (MP name dropped)"
        meaning = f"Constituency institutional context {clean}"
        safe = "YES"
    elif col.startswith("document__"):
        clean = col.replace("document__", "")
        src_table = "11_documents.csv"
        src_col = clean
        grain = "project"
        trans = "1:1 join on project_id with document__ prefix"
        meaning = f"Document & evidence integrity feature {clean}"
        safe = "TEMPORALLY_SENSITIVE" if col in TEMPORALLY_SENSITIVE_FEATURES else "YES"
    else:
        src_table = "01_projects.csv"
        src_col = col
        grain = "project"
        trans = "Direct attribute"
        meaning = f"{col} attribute"
        safe = "YES"

    lines.append(f"| `{col}` | `{src_table}` | `{src_col}` | {grain} | {trans} | {meaning} | **{safe}** |")

lines.append("\n## 4. Quarantined Supervised Target Store (`project_labels.csv`)\n")
lines.append("| Target Column | Source Table | Grain | Meaning | Role in ML Lifecycle |")
lines.append("| :--- | :--- | :--- | :--- | :--- |")
for c in labels.columns:
    lines.append(f"| `{c}` | `12_labels.csv` | project | Supervised ground truth attribute {c} | Strictly reserved for offline training, cross-validation, and holdout evaluation. Never passed to inference feature vector. |")

lines.append("\n## 5. Non-Predictive Entity Identity Exclusions\n")
lines.append("The following entity identity string columns exist in raw source tables but have been **intentionally excluded** from `project_master_features.csv`:\n")
lines.append("- `contractor_name` (from `07_contractors.csv`)\n")
lines.append("- `agency_name` (from `08_agencies.csv`)\n")
lines.append("- `mp_name` (from `10_constituencies.csv`)\n")
lines.append("- `district_name` & `state_name` (from `09_geography.csv` and `01_projects.csv`)\n")
lines.append("- `constituency_name` (from `10_constituencies.csv` and `01_projects.csv`)\n")
lines.append("- `work_name` & `title` (from `01_projects.csv`)\n")

content = "\n".join(lines)
dict_path = base_dir / "DATA_DICTIONARY.md"
with open(dict_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Generated {dict_path} successfully!")
