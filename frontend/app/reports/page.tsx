"use client";

import React, { useState } from "react";
import { useRole } from "../../context/RoleContext";
import { API_BASE } from "../../lib/api";
import { FileText, Download, CheckCircle, ShieldAlert, Sparkles, FileSpreadsheet, Lock } from "lucide-react";
import { MagicCard } from "../../components/ui/MagicCard";
import { SpecularButton } from "../../components/ui/SpecularButton";

export default function ReportsPage() {
  const { role, jurisdiction, roleConfig } = useRole();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const roleReportTitles: Record<string, { title: string; desc: string; badge: string; points: string[] }> = {
    ministry: {
      title: "National Parliamentary PAC Audit Dossier (PDF)",
      desc: "Comprehensive national audit brief for Public Accounts Committee (PAC) review. Includes macro expenditure, inter-state anomaly rankings, national fraud typology breakdowns, and top national priority inspection targets.",
      badge: "National PAC Dossier",
      points: [
        "Scope: All India (28 States & 8 UTs)",
        "Inter-state risk disparity & macro leakage proofs",
        "Certified for Parliamentary Committee submission",
      ],
    },
    state: {
      title: `Statewide Vigilance Audit Brief — ${jurisdiction} (PDF)`,
      desc: "State Nodal audit document for Planning & Development and State Vigilance Commission. Includes district anomaly rankings, cross-district agency monopoly proofs, and state inspection directives.",
      badge: "State Vigilance Brief",
      points: [
        `Scope: ${jurisdiction} (All Monitored Districts)`,
        "Inter-district equity spread & contractor syndicates",
        "State inspection notices queue",
      ],
    },
    district: {
      title: `Statutory Pre-Sanction & Structuring Audit — ${jurisdiction} (PDF)`,
      desc: "Statutory audit dossier for District Magistrate and Collectorate. Contains concrete evidence of sub-₹5 Lakh structuring/smurfing to bypass e-tenders, agency concentration, and pre-sanction triage queue.",
      badge: "Statutory Pre-Sanction Audit",
      points: [
        `Scope: ${jurisdiction} District Collectorate`,
        "Evidence of sub-₹5 Lakh contract splitting",
        "Pre-sanction triage queue before funds release",
      ],
    },
    mp: {
      title: `Constituency Fund Utilization & Progress Scorecard — ${jurisdiction} (PDF)`,
      desc: "Parliamentary constituency development report for public transparency. Details ₹5 Crore annual budget utilization, concrete evidence of stalled projects (>180 days delay) to hold agencies accountable, and clean governance score.",
      badge: "Constituency Transparency Scorecard",
      points: [
        `Scope: ${jurisdiction} (Parliamentary Seat)`,
        "₹5 Cr statutory fund utilization rate & asset audit",
        "Stalled project delay proofs (>180 days in pending)",
      ],
    },
  };

  const currentReport = roleReportTitles[role] || roleReportTitles.ministry;

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    const stateParam = role === "state" ? `&state=${encodeURIComponent(jurisdiction)}` : "";
    const url = `${API_BASE}/reports/audit-pdf?role=${role}&jurisdiction=${encodeURIComponent(jurisdiction)}${stateParam}`;
    window.open(url, "_blank");
    setTimeout(() => setDownloadingPdf(false), 2000);
  };

  const handleDownloadCsv = () => {
    setDownloadingCsv(true);
    const stateParam = role === "state" ? `&state=${encodeURIComponent(jurisdiction)}` : "";
    const url = `${API_BASE}/reports/csv?min_risk=40${stateParam}`;
    window.open(url, "_blank");
    setTimeout(() => setDownloadingCsv(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-200 uppercase">
              {currentReport.badge}
            </span>
            <span className="text-xs text-slate-500 font-mono">Jurisdiction: {jurisdiction} ({role.toUpperCase()})</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            Compliance & Audit Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Generate certified anomaly audit dossiers, role-tailored evidence packs, and raw ML feature matrices for parliamentary committees.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Executive Audit Report Card */}
        <MagicCard 
          glowColor="239, 68, 68"
          enableTilt={true}
          enableBorderGlow={true}
          clickEffect={true}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-red-100 p-3 text-red-600">
                <FileText className="h-7 w-7" />
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700">
                Role-Tailored PDF
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{currentReport.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentReport.desc}
            </p>

            <ul className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              {currentReport.points.map((pt, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <SpecularButton
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            variant="primary"
            size="md"
            className="w-full"
          >
            <Download className="h-4 w-4" />
            <span>{downloadingPdf ? "Generating Audit PDF..." : `Download ${currentReport.badge}`}</span>
          </SpecularButton>
        </MagicCard>

        {/* CSV Raw Data Export Card */}
        <MagicCard 
          glowColor="16, 185, 129"
          enableTilt={true}
          enableBorderGlow={true}
          clickEffect={true}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700">
                CSV / Excel Dataset
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">Flagged Works Feature Matrix (CSV)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export all 60,356 works records with their calculated engineered ML features (Peer Deviation Ratio, Vendor Capture Share, Benford Distribution conformity, Geographic Cluster IDs, and Predicted Fraud Typology).
            </p>

            <ul className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Complete multi-signal ML feature vectors</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Filtered to Risk Score ≥ 40 for vigilance priority</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Compatible with Excel, PowerBI, Tableau & Python</span>
              </li>
            </ul>
          </div>

          <SpecularButton
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            variant="success"
            size="md"
            className="w-full"
          >
            <Download className="h-4 w-4" />
            <span>{downloadingCsv ? "Exporting CSV..." : "Export ML Feature Matrix (CSV)"}</span>
          </SpecularButton>
        </MagicCard>
      </div>
    </div>
  );
}
