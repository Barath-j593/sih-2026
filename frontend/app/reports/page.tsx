"use client";

import React, { useState } from "react";
import { useRole } from "../../context/RoleContext";
import { FileText, Download, CheckCircle, ShieldAlert, Sparkles, FileSpreadsheet, Lock } from "lucide-react";

export default function ReportsPage() {
  const { roleConfig } = useRole();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    const url = `http://127.0.0.1:8000/api/reports/audit-pdf?jurisdiction=${encodeURIComponent(roleConfig.jurisdiction)}`;
    window.open(url, "_blank");
    setTimeout(() => setDownloadingPdf(false), 2000);
  };

  const handleDownloadCsv = () => {
    setDownloadingCsv(true);
    const url = `http://127.0.0.1:8000/api/reports/csv?min_risk=40`;
    window.open(url, "_blank");
    setTimeout(() => setDownloadingCsv(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-200">
              OFFICIAL COMPLIANCE EXPORTER
            </span>
            <span className="text-xs text-slate-500 font-mono">MoSPI Statutory Audit Format</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            Compliance & Audit Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Generate certified anomaly audit sheets, executive summaries, and raw feature matrices for parliamentary committees.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Executive Audit Report Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-red-100 p-3 text-red-600">
                <FileText className="h-7 w-7" />
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700">
                Official PDF Format
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">Confidential Statutory Audit Dossier (PDF)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Produces a formatted government audit document complete with National/State jurisdiction header, risk metrics, high-priority project tables, explainable anomaly reason traces, and compliance sign-off blocks.
            </p>

            <ul className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Scope: <b className="text-slate-900">{roleConfig.jurisdiction}</b></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Includes top flagged civil & community works</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Ready for Public Accounts Committee (PAC) submission</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{downloadingPdf ? "Generating Audit PDF..." : "Generate Official PDF Audit Report"}</span>
          </button>
        </div>

        {/* CSV Raw Data Export Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
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

          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 py-3 text-xs font-bold text-slate-900 hover:bg-slate-100 transition-all shadow-2xs disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{downloadingCsv ? "Exporting CSV..." : "Export ML Feature Matrix (CSV)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
