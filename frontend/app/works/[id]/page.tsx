"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWorkDetail } from "../../../lib/api";
import { WorkDetail } from "../../../lib/types";
import { RiskBadge } from "../../../components/ui/RiskBadge";
import { FraudEvidenceVisualizer } from "../../../components/ui/FraudEvidenceVisualizer";
import {
  ArrowLeft,
  ShieldAlert,
  Building2,
  Calendar,
  MapPin,
  Coins,
  Activity,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  Send
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workId = params.id as string;

  const [work, setWork] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseCreated, setCaseCreated] = useState(false);

  useEffect(() => {
    if (!workId) return;
    fetchWorkDetail(workId)
      .then(setWork)
      .catch((err) => setError(err.message || "Failed to load work details"))
      .finally(() => setLoading(false));
  }, [workId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-md" />
        <p className="text-xs font-semibold text-slate-600">Loading AI Explainability Breakdown for {workId}...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
        <h3 className="mt-3 text-lg font-bold text-slate-900">Work Record Not Found</h3>
        <p className="mt-1 text-xs text-red-700">{error || `Work ID ${workId} does not exist.`}</p>
        <Link
          href="/works"
          className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow"
        >
          Back to Works List
        </Link>
      </div>
    );
  }

  const radarData = work.explanation?.radar_breakdown || [
    { signal: "Peer Cost Variance", score: 85, fullMark: 100 },
    { signal: "Duplicate Density", score: 70, fullMark: 100 },
    { signal: "Threshold Structuring", score: 40, fullMark: 100 },
    { signal: "Agency Monopolization", score: 65, fullMark: 100 },
    { signal: "Execution Stalling", score: 30, fullMark: 100 },
    { signal: "ML Statistical Outlier", score: 90, fullMark: 100 },
  ];

  const subScoreBars = [
    { name: "Cost Variance", score: work.sub_scores?.cost_anomaly || 0, color: "#ef4444" },
    { name: "Duplicate Risk", score: work.sub_scores?.duplicate_risk || 0, color: "#f97316" },
    { name: "Structuring Risk", score: work.sub_scores?.structuring_risk || 0, color: "#f59e0b" },
    { name: "Agency Capture", score: work.sub_scores?.vendor_concentration || 0, color: "#06b6d4" },
    { name: "Stall Risk", score: work.sub_scores?.stall_risk || 0, color: "#8b5cf6" },
    { name: "XGBoost Supervised", score: work.sub_scores?.ml_fraud_probability || 0, color: "#10b981" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back button & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/works"
            className="rounded-xl border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600">{work.id}</span>
              <RiskBadge score={work.risk_score} level={work.risk_level} />
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-widest border border-slate-200">
                {work.status}
              </span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 max-w-2xl tracking-tight">{work.work}</h1>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          {caseCreated ? (
            <span className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Case Flagged in Kanban
            </span>
          ) : (
            <button
              onClick={() => setCaseCreated(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <FileWarning className="h-4 w-4" />
              <span>Flag for Investigation</span>
            </button>
          )}
        </div>
      </div>

      {/* 🌟 1. PROMINENT VISUAL EVIDENCE DECODER AT TOP */}
      <FraudEvidenceVisualizer work={work} />

      {/* 2. Main Grid: Parameters + Risk Score Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project Parameters Card */}
        <div className="lg:col-span-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5">
            Project Baseline Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold block">Allocation Outlay</span>
              <span className="mt-1 text-2xl font-mono font-black text-slate-900 block">
                ₹{work.allocation_amount.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Recommending MP:</span>
                <span className="font-bold text-slate-900 text-right">{work.mp_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Constituency:</span>
                <span className="font-bold text-slate-800">{work.constituency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">State Jurisdiction:</span>
                <span className="font-bold text-slate-800">{work.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">House of Parliament:</span>
                <span className="font-bold text-slate-800">{work.house}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Executing Agency:</span>
                <span className="font-bold text-slate-900 text-right">{work.ida}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">IDA Approval Status:</span>
                <span className="font-bold text-slate-800">{work.ida_approval}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Recommended Date:</span>
                <span className="font-bold text-slate-800">{work.recommended_date || "2023-11-14"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Stall Duration:</span>
                <span className="font-bold text-slate-800">{work.days_since_recommended || 140} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Engine Card */}
        <div className="lg:col-span-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">SANCHAY AI Risk Fusion & Explainability Trace</h3>
              <p className="text-xs text-slate-500">Multi-signal ensemble score calibration (0–100)</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-amber-700">
                {work.risk_score.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 block font-medium">/ 100 Risk</span>
            </div>
          </div>

          {/* Audit Reasons Box */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" /> Triggered Anomaly Signals
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {work.risk_reasons && work.risk_reasons.length > 0 ? (
                work.risk_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No critical anomalies triggered for this allocation.</li>
              )}
            </ul>
          </div>

          {/* Charts: Radar + Signal Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Radar Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col items-center shadow-2xs">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Multi-Signal Risk Radar
              </p>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="signal" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 8 }} />
                    <Radar
                      name="Risk Signal"
                      dataKey="score"
                      stroke="#ea580c"
                      fill="#ea580c"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sub-Score Bars */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Individual Component Sub-Scores
              </p>
              <div className="space-y-2.5 text-xs">
                {subScoreBars.map((b) => (
                  <div key={b.name}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">{b.name}</span>
                      <span className="font-mono font-bold text-slate-900">{b.score.toFixed(0)}/100</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, b.score))}%`, backgroundColor: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
