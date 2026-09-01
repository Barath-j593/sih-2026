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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              OFFICIAL COMPLIANCE EXPORTER
            </span>
            <span className="text-xs text-slate-400">MoSPI Statutory Audit Format</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Compliance & Audit Reports</h1>
          <p className="mt-1 text-xs text-slate-400">
            Generate certified anomaly audit sheets, executive summaries, and raw feature matrices for parliamentary committees.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Executive Audit Report Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-red-950/80 p-3 text-red-400 border border-red-500/30">
                <FileText className="h-7 w-7" />
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-bold text-slate-300">
                Official PDF Format
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">Confidential Statutory Audit Dossier (PDF)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Produces a formatted government audit document complete with National/State jurisdiction header, risk metrics, high-priority project tables, explainable anomaly reason traces, and compliance sign-off blocks.
            </p>

            <ul className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Scope: <b>{roleConfig.jurisdiction}</b></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Includes top flagged civil & community works</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ready for Public Accounts Committee (PAC) submission</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-600 py-3 text-xs font-bold text-white hover:bg-saffron-500 transition-all shadow-lg shadow-saffron-600/30 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{downloadingPdf ? "Generating Audit PDF..." : "Generate Official PDF Audit Report"}</span>
          </button>
        </div>

        {/* CSV Raw Data Export Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-950/80 p-3 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-bold text-slate-300">
                CSV / Excel Dataset
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">Flagged Works Feature Matrix (CSV)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Export all scored records with pre-engineered peer z-scores, duplicate counts, IDA work share ratios, composite risk scores, and anomaly typology tags for external spreadsheets or data pipelines.
            </p>

            <ul className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>All 27 raw and engineered feature columns included</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Filters applied: Works with Risk Score &gt;= 40.0</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>UTF-8 encoded for Excel, Python, and R analytics</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-md disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>{downloadingCsv ? "Preparing CSV Export..." : "Download Scored Works CSV"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
