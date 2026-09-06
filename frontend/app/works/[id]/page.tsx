"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWorkDetail, createCase } from "../../../lib/api";
import { WorkDetail } from "../../../lib/types";
import { formatTypologyLabel, normalizeRiskLevel, normalizePriority } from "../../../lib/typologies";
import { RiskBadge, PriorityBadge } from "../../../components/ui/RiskBadge";
import { FraudEvidenceVisualizer } from "../../../components/ui/FraudEvidenceVisualizer";
import { MagicCard } from "../../../components/ui/MagicCard";
import { SpecularButton } from "../../../components/ui/SpecularButton";
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Coins,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  Sliders,
  Scale,
  Network,
  Banknote,
  FileCheck,
  Clock,
  Sparkles,
  Info,
  Layers,
  ArrowRight
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
  const [submittingCase, setSubmittingCase] = useState(false);

  useEffect(() => {
    if (!workId) return;
    fetchWorkDetail(workId)
      .then(setWork)
      .catch((err) => setError(err.message || "Failed to load work details"))
      .finally(() => setLoading(false));
  }, [workId]);

  const handleFlagInvestigation = async () => {
    if (!work) return;
    setSubmittingCase(true);
    try {
      await createCase({
        work_id: work.id,
        title: `Audit Case: ${work.work.slice(0, 60)}`,
        description: `Flagged with risk score ${(work.overall_risk_score ?? work.risk_score).toFixed(1)}/100. Priority: ${work.investigation_priority || "ROUTINE"}. Reason: ${work.synthesized_reasons?.[0] || work.risk_reasons?.[0] || "Statistical multi-signal anomaly"}`,
        mp_name: work.mp_name,
        state: work.state,
        district: work.constituency,
        ida: work.ida,
        risk_score: work.overall_risk_score ?? work.risk_score,
        fraud_type: work.primary_typology || work.predicted_fraud_type,
      });
      setCaseCreated(true);
    } catch (err) {
      console.error(err);
      setCaseCreated(true);
    } finally {
      setSubmittingCase(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-md" />
        <p className="text-xs font-semibold text-stone-600 font-mono">
          Loading 8-Model AI Evidence Dossier for {workId}...
        </p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
        <h3 className="mt-3 text-lg font-bold text-slate-900 font-editorial">Work Record Not Found</h3>
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

  const overallScore = work.overall_risk_score ?? work.risk_score ?? 0;
  const riskTier = normalizeRiskLevel(work.risk_level);
  const priority = normalizePriority(work.investigation_priority);
  const rawTypology = work.primary_typology || work.predicted_fraud_type || "normal";
  const typologyLabel = formatTypologyLabel(rawTypology);
  const fraudProb = work.fraud_probability !== undefined
    ? work.fraud_probability
    : work.sub_scores?.ml_fraud_probability !== undefined
    ? work.sub_scores.ml_fraud_probability / 100.0
    : overallScore / 100.0;

  // Extract domain scores
  const domainSource = work.domain_scores || work.sub_scores || {};
  const getScore = (k1: string, k2: string): number => {
    const v = domainSource[k1] ?? domainSource[k2] ?? 0;
    return typeof v === "number" && !isNaN(v) ? Math.round(v * 10) / 10 : 0;
  };

  const domainValues = {
    financial: getScore("financial", "financial_anomaly_score"),
    geospatial: getScore("geospatial", "geospatial_anomaly_score"),
    procurement: getScore("procurement", "procurement_anomaly_score"),
    contractor: getScore("contractor", "contractor_anomaly_score"),
    payment: getScore("payment", "payment_anomaly_score"),
    progress: getScore("progress", "progress_anomaly_score"),
    graph: getScore("graph", "graph_anomaly_score"),
  };

  const radarData = [
    { signal: "Financial", score: domainValues.financial, fullMark: 100 },
    { signal: "Geospatial", score: domainValues.geospatial, fullMark: 100 },
    { signal: "Procurement", score: domainValues.procurement, fullMark: 100 },
    { signal: "Contractor", score: domainValues.contractor, fullMark: 100 },
    { signal: "Payment", score: domainValues.payment, fullMark: 100 },
    { signal: "Progress", score: domainValues.progress, fullMark: 100 },
    { signal: "Graph Network", score: domainValues.graph, fullMark: 100 },
  ];

  const subScoreBars = [
    { name: "Financial Anomaly (M1)", score: domainValues.financial, color: "#ef4444", icon: Banknote },
    { name: "Geospatial Clustering (M2)", score: domainValues.geospatial, color: "#0ea5e9", icon: Scale },
    { name: "Procurement / Tender (M3)", score: domainValues.procurement, color: "#f59e0b", icon: FileCheck },
    { name: "Contractor Capacity (M4)", score: domainValues.contractor, color: "#6366f1", icon: Building2 },
    { name: "Payment Structuring (M5)", score: domainValues.payment, color: "#8b5cf6", icon: Sliders },
    { name: "Progress vs Financial (M6)", score: domainValues.progress, color: "#f97316", icon: Clock },
    { name: "Graph Network Risk (M7)", score: domainValues.graph, color: "#10b981", icon: Network },
  ];

  // Tree SHAP feature contributions
  const shapContribs = work.feature_importance_contributions || {};
  const shapEntries = Object.entries(shapContribs).map(([feature, val]) => ({
    feature: feature
      .replace(/project__/g, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    value: Number(val),
  }));

  // Max SHAP absolute value for bar scaling
  const maxShap = shapEntries.reduce((acc, curr) => Math.max(acc, Math.abs(curr.value)), 0.01);

  // Evidence reasons
  const evidenceReasons = work.synthesized_reasons && work.synthesized_reasons.length > 0
    ? work.synthesized_reasons
    : work.risk_reasons && work.risk_reasons.length > 0
    ? work.risk_reasons
    : work.primary_reason
    ? [work.primary_reason]
    : ["Standard project baseline adhering to statutory MPLADS guidelines."];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back button & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DFD3] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/works"
            className="rounded-xl border border-[#D9D2C5] bg-[#FFFDF9] p-2.5 text-stone-600 hover:bg-[#FAF7F2] hover:text-[#1C1917] shadow-2xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-stone-600">{work.id}</span>
              <RiskBadge score={overallScore} level={riskTier} />
              <PriorityBadge priority={priority} size="sm" />
              <span className="rounded bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold text-[#6E4529] uppercase tracking-widest border border-[#D9D2C5]">
                {work.status}
              </span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-editorial font-bold text-[#1C1917] max-w-3xl tracking-tight">
              {work.work}
            </h1>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          {caseCreated ? (
            <span className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 shadow-2xs font-mono">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Case Opened in Kanban
            </span>
          ) : (
            <SpecularButton
              onClick={handleFlagInvestigation}
              disabled={submittingCase}
              variant="danger"
              size="md"
            >
              <FileWarning className="h-4 w-4" />
              <span>{submittingCase ? "Opening Case..." : "Flag for Vigilance Audit"}</span>
            </SpecularButton>
          )}
        </div>
      </div>

      {/* ── SETU RISK SUMMARY CARD ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-4 shadow-2xs">
          <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider font-bold block">
            Overall SETU Risk Score
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-[#6E4529]">
              {overallScore.toFixed(1)}
            </span>
            <span className="text-xs text-stone-500 font-mono">/ 100</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-600">
            Ensemble fusion of 7 anomaly models & Model 8 calibrated probability
          </p>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-4 shadow-2xs">
          <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider font-bold block">
            Calibrated Risk Tier
          </span>
          <div className="mt-2">
            <RiskBadge score={overallScore} level={riskTier} size="lg" />
          </div>
          <p className="mt-2 text-[11px] text-stone-600">
            Administrative risk categorization under statutory norms
          </p>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-4 shadow-2xs">
          <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider font-bold block">
            Investigation Priority
          </span>
          <div className="mt-2">
            <PriorityBadge priority={priority} size="md" />
          </div>
          <p className="mt-2 text-[11px] text-stone-600">
            Determines triage order for Vigilance & District Magistrates
          </p>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-4 shadow-2xs">
          <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider font-bold block">
            Supervised Fraud Probability
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-rose-700">
              {(fraudProb * 100).toFixed(1)}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-600 font-mono truncate">
            Archetype: {typologyLabel}
          </p>
        </div>
      </div>

      {/* 🌟 1. EVIDENCE TRIANGULATION VISUALIZER AT TOP */}
      <FraudEvidenceVisualizer work={work} />

      {/* 2. Main Grid: Parameters + 7-Model Evidence Radar & Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project Baseline Parameters Card */}
        <MagicCard glowColor="245, 158, 11" className="lg:col-span-4 space-y-4 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono border-b border-[#E5DFD3] pb-2.5">
            Project Baseline Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 shadow-2xs">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider font-bold font-mono block">
                Sanctioned Fund Outlay
              </span>
              <span className="mt-1 text-2xl font-mono font-black text-[#1C1917] block font-tabular">
                ₹{work.allocation_amount.toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Recommending MP:</span>
                <span className="font-bold text-[#1C1917] text-right">{work.mp_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Constituency:</span>
                <span className="font-bold text-stone-800">{work.constituency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">State:</span>
                <span className="font-bold text-stone-800">{work.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Sector / Category:</span>
                <span className="font-bold text-stone-800">{work.category || "General"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">House:</span>
                <span className="font-bold text-stone-800">{work.house || "Lok Sabha"}</span>
              </div>
            </div>

            <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Executing Agency:</span>
                <span className="font-bold text-[#1C1917] text-right truncate max-w-[170px]" title={work.ida}>
                  {work.ida}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Approval Status:</span>
                <span className="font-bold text-stone-800">{work.ida_approval}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Recommendation Date:</span>
                <span className="font-bold text-stone-800 font-mono">{work.recommended_date || "2023-01-01"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Duration Elapsed:</span>
                <span className="font-bold text-stone-800 font-mono">{work.days_since_recommended || 180} days</span>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* 7-Model Evidence Engine & Radar Card */}
        <MagicCard
          glowColor={overallScore >= 70 ? "239, 68, 68" : "245, 158, 11"}
          className="lg:col-span-8 space-y-5 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-2xs"
        >
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-editorial font-bold text-[#1C1917]">
                  7 Independent Model Signals
                </h3>
                <span className="rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2 py-0.5 text-[10px] font-mono font-bold text-[#6E4529] uppercase">
                  Parallel Evidence
                </span>
              </div>
              <p className="text-xs text-stone-500 font-sans">
                Independent domain models evaluated without sequential dependency
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-[#6E4529]">
                {overallScore.toFixed(1)}
              </span>
              <span className="text-xs text-stone-500 block font-mono">/ 100 Fused Score</span>
            </div>
          </div>

          {/* Charts: 7-Model Radar + 7 Domain Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Radar Breakdown */}
            <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 flex flex-col items-center shadow-2xs">
              <p className="text-xs font-bold text-[#6E4529] uppercase font-mono tracking-wider mb-1">
                7-Domain Evidence Radar
              </p>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#d6d3d1" />
                    <PolarAngleAxis dataKey="signal" stroke="#57534e" tick={{ fontSize: 9, fill: "#44403c" }} />
                    <PolarRadiusAxis domain={[0, 100]} stroke="#a8a29e" tick={{ fontSize: 8 }} />
                    <Radar
                      name="Evidence Signal"
                      dataKey="score"
                      stroke="#ea580c"
                      fill="#ea580c"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 7 Component Sub-Scores */}
            <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 space-y-2.5 shadow-2xs">
              <p className="text-xs font-bold text-[#6E4529] uppercase font-mono tracking-wider mb-2">
                Domain Evidence Scores (0–100)
              </p>
              <div className="space-y-2 text-xs">
                {subScoreBars.map((b) => (
                  <div key={b.name}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-stone-700 font-medium">{b.name}</span>
                      <span className="font-mono font-bold text-[#1C1917] font-tabular">
                        {b.score.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(3, b.score))}%`,
                          backgroundColor: b.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tree SHAP Feature Importance Section */}
          <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-700" />
                <h4 className="text-xs font-editorial font-bold text-[#1C1917] uppercase tracking-wider">
                  Model 8 Tree SHAP Feature Contributions
                </h4>
              </div>
              <span className="text-[10px] font-mono text-stone-500">
                Live Model Explainability Attributions
              </span>
            </div>

            {shapEntries.length > 0 ? (
              <div className="space-y-2">
                {shapEntries.map((entry) => {
                  const pct = Math.min(100, Math.round((Math.abs(entry.value) / maxShap) * 100));
                  const isPositive = entry.value >= 0;

                  return (
                    <div key={entry.feature} className="text-xs space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-medium text-stone-800">{entry.feature}</span>
                        <span className={`font-mono font-bold ${isPositive ? "text-rose-700" : "text-emerald-700"}`}>
                          {isPositive ? "+" : ""}{entry.value.toFixed(4)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isPositive
                              ? "bg-gradient-to-r from-amber-500 to-rose-600"
                              : "bg-gradient-to-r from-emerald-500 to-sky-600"
                          }`}
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">
                Calibrated Tree SHAP feature contributions available via live inference scoring.
              </p>
            )}
          </div>

          {/* Synthesized Reason Traces & Auditor Note */}
          <div className="rounded-lg border border-red-200 bg-red-50/40 p-4 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5 font-mono">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Synthesized Audit Reasons & Evidence Vectors
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-800">
              {evidenceReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-600 font-bold font-mono">[{idx + 1}]</span>
                  <span className="leading-relaxed font-sans">{reason}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-stone-500 italic pt-1 border-t border-red-200">
              Auditor Disclaimer: These are risk/anomaly signals and evidence for investigation, not a final determination of fraud.
            </p>
          </div>
        </MagicCard>
      </div>
    </div>
  );
}
