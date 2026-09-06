"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  RotateCcw,
  Sliders,
  Scale,
  Network,
  Banknote,
  FileCheck,
  Clock,
  Building2,
  ArrowLeft,
  Check,
  Info
} from "lucide-react";
import { scoreRawProposal } from "../../lib/api";
import { RawProposalScoringRequest, RawProposalScoringResponse } from "../../lib/types";
import { formatTypologyLabel, normalizeRiskLevel, normalizePriority } from "../../lib/typologies";
import { RiskBadge, PriorityBadge } from "../../components/ui/RiskBadge";
import { MagicCard } from "../../components/ui/MagicCard";
import { SpecularButton } from "../../components/ui/SpecularButton";
import { STATE_DISTRICTS, getDistrictsForState, formatDistrictName } from "../../lib/districts";

const SAMPLE_PRESETS: Array<{
  name: string;
  badge: string;
  badgeColor: string;
  data: RawProposalScoringRequest;
}> = [
  {
    name: "Compliant Community Center",
    badge: "Routine",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    data: {
      work_name: "Construction of Multi-Purpose Community Hall",
      category: "Public Infrastructure",
      state: "Bihar",
      constituency: "Darbhanga",
      district: "Darbhanga",
      ida: "District Planning Authority",
      contractor_name: "Apex Infrastructure Ltd",
      sanctioned_amount: 2500000,
      estimated_cost: 2450000,
      planned_duration_days: 180,
      work_type: "Civil Infrastructure",
      num_bidders: 4,
      is_single_bid: false,
      contractor_past_delays: 0,
      latitude: 26.1542,
      longitude: 85.8918,
    },
  },
  {
    name: "Threshold Structuring (₹4.92 Lakhs)",
    badge: "Structuring Flag",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    data: {
      work_name: "Paver Block Pavement at Ward-04",
      category: "Roads & Bridges",
      state: "Bihar",
      constituency: "Darbhanga",
      district: "Darbhanga",
      ida: "District Rural Development Agency",
      contractor_name: "Chandra Civil Works",
      sanctioned_amount: 492000,
      estimated_cost: 490000,
      planned_duration_days: 90,
      work_type: "Paver Road",
      num_bidders: 2,
      is_single_bid: false,
      contractor_past_delays: 0,
      latitude: 26.148,
      longitude: 85.901,
    },
  },
  {
    name: "Single-Bid Cartel Procurement",
    badge: "Procurement Flag",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    data: {
      work_name: "Solar High-Mast Lighting Tower Installation",
      category: "Electricity & Lighting",
      state: "Uttar Pradesh",
      constituency: "Varanasi",
      district: "Varanasi",
      ida: "Varanasi Smart City Authority",
      contractor_name: "Surya Urja Consortium",
      sanctioned_amount: 3850000,
      estimated_cost: 3100000,
      planned_duration_days: 120,
      work_type: "Solar Installation",
      num_bidders: 1,
      is_single_bid: true,
      contractor_past_delays: 2,
      latitude: 25.3176,
      longitude: 82.9739,
    },
  },
  {
    name: "High Cost Escalation + Delay Risk",
    badge: "Cost Escalation",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    data: {
      work_name: "RCC Bridge across Irrigation Canal at Belaur",
      category: "Roads & Bridges",
      state: "Bihar",
      constituency: "Darbhanga",
      district: "Darbhanga",
      ida: "District Planning Authority",
      contractor_name: "Mithila Construction Pvt Ltd",
      sanctioned_amount: 8500000,
      estimated_cost: 4200000,
      planned_duration_days: 360,
      work_type: "Bridge Work",
      num_bidders: 2,
      is_single_bid: false,
      contractor_past_delays: 4,
      latitude: 26.17,
      longitude: 85.92,
    },
  },
];

export default function ProposalsPage() {
  const [formData, setFormData] = useState<RawProposalScoringRequest>(SAMPLE_PRESETS[0].data);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RawProposalScoringResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableDistricts = useMemo(() => {
    return getDistrictsForState(formData.state || "Bihar");
  }, [formData.state]);

  const handlePresetSelect = (preset: typeof SAMPLE_PRESETS[0]) => {
    setFormData({ ...preset.data });
    setResult(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await scoreRawProposal(formData);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Proposal evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5DFD3] pb-5 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#6E4529] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5EBE1]">
              Pre-Sanction AI Gate • Feed Project Plan
            </span>
            <span className="text-xs text-stone-500 font-mono">
              8-Model ML Inference Active (&lt; 200ms)
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-editorial font-bold text-[#1C1917] sm:text-3xl tracking-tight">
            Feed Project Plan & Live Risk Scorer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-3xl">
            Input proposed developmental project parameters to simulate real-time forensic risk scoring, domain anomaly triangulation (Models 1–7), and calibrated fraud probabilities (Model 8) before administrative or financial approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D2C5] bg-[#FFFDF9] px-3.5 py-2 text-xs font-bold text-[#6E4529] hover:bg-white transition-all shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Command Center</span>
          </Link>
        </div>
      </div>

      {/* Preset Pickers */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8C5D3B] flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Quick Test Scenario Presets:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className="text-left rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] hover:border-[#6E4529] hover:bg-[#FAF7F2] p-3 shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </div>
              <p className="text-xs font-bold text-[#1C1917] group-hover:text-[#6E4529] transition-colors">
                {p.name}
              </p>
              <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                ₹{p.data.sanctioned_amount.toLocaleString()} • {p.data.constituency}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Proposal Input Form */}
        <MagicCard
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="lg:col-span-7 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <div>
              <h3 className="text-base font-editorial font-bold text-[#1C1917]">
                Proposal Parameters & Metadata
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Enter details of the proposed project for multi-model inference
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePresetSelect(SAMPLE_PRESETS[0])}
              className="text-xs font-mono text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                Work Proposal Title *
              </label>
              <input
                type="text"
                name="work_name"
                required
                value={formData.work_name}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Sector Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] focus:border-[#6E4529] focus:outline-none"
                >
                  <option value="Public Infrastructure">Public Infrastructure</option>
                  <option value="Roads & Bridges">Roads & Bridges</option>
                  <option value="Drinking Water">Drinking Water</option>
                  <option value="Education">Education</option>
                  <option value="Health & Sanitation">Health & Sanitation</option>
                  <option value="Electricity & Lighting">Electricity & Lighting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Requested Sanction (INR) *
                </label>
                <input
                  type="number"
                  name="sanctioned_amount"
                  required
                  min={1000}
                  value={formData.sanctioned_amount}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] font-mono font-bold focus:border-[#6E4529] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  State *
                </label>
                <input
                  list="state-datalist"
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={(e) => {
                    handleInputChange(e);
                    const stateDistricts = getDistrictsForState(e.target.value);
                    if (stateDistricts && stateDistricts.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        district: stateDistricts[0],
                        constituency: stateDistricts[0],
                      }));
                    }
                  }}
                  placeholder="e.g. Bihar, Tamil Nadu"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
                <datalist id="state-datalist">
                  {Object.keys(STATE_DISTRICTS).map((st) => (
                    <option key={st} value={st} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  District *
                </label>
                <input
                  list="district-datalist"
                  type="text"
                  name="district"
                  required
                  value={formData.district || ""}
                  onChange={(e) => {
                    handleInputChange(e);
                    setFormData((prev) => ({ ...prev, constituency: e.target.value }));
                  }}
                  placeholder="e.g. Darbhanga, Salem"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
                <datalist id="district-datalist">
                  {availableDistricts.map((dst) => (
                    <option key={dst} value={dst} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Constituency *
                </label>
                <input
                  type="text"
                  name="constituency"
                  required
                  value={formData.constituency}
                  onChange={handleInputChange}
                  placeholder="e.g. Darbhanga"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Implementing Agency (IDA)
                </label>
                <input
                  type="text"
                  name="ida"
                  value={formData.ida || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Proposed Contractor
                </label>
                <input
                  type="text"
                  name="contractor_name"
                  value={formData.contractor_name || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Estimated Cost (INR)
                </label>
                <input
                  type="number"
                  name="estimated_cost"
                  value={formData.estimated_cost || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Planned Days
                </label>
                <input
                  type="number"
                  name="planned_duration_days"
                  value={formData.planned_duration_days || 180}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Number of Bidders
                </label>
                <input
                  type="number"
                  name="num_bidders"
                  min={1}
                  value={formData.num_bidders || 3}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_single_bid"
                  checked={formData.is_single_bid || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-stone-300 text-[#6E4529] focus:ring-[#6E4529]"
                />
                <span>Single-Bid Tender Only</span>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 font-mono uppercase mb-1">
                  Contractor Past Delays
                </label>
                <input
                  type="number"
                  name="contractor_past_delays"
                  min={0}
                  value={formData.contractor_past_delays || 0}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#1C1917] font-mono"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-stone-500 font-mono uppercase mb-0.5">
                    Lat
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    name="latitude"
                    value={formData.latitude || 26.1542}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-2 py-1 text-xs text-[#1C1917] font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-stone-500 font-mono uppercase mb-0.5">
                    Lng
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    name="longitude"
                    value={formData.longitude || 85.8918}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-2 py-1 text-xs text-[#1C1917] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-mono">
                Evaluates across Models 1–8 in backend memory
              </span>
              <SpecularButton
                type="submit"
                disabled={loading}
                variant="amber"
                size="md"
              >
                <Zap className="h-4 w-4" />
                <span>{loading ? "Running 8-Model Inference..." : "Evaluate Proposal Now"}</span>
              </SpecularButton>
            </div>
          </form>
        </MagicCard>

        {/* Live Evaluation Results Panel */}
        <div className="lg:col-span-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Inference Error</span>
              </div>
              <p>{error}</p>
            </div>
          )}

          {result ? (
            <MagicCard
              glowColor={result.overall_risk_score >= 60 ? "239, 68, 68" : "245, 158, 11"}
              enableBorderGlow={true}
              enableTilt={false}
              className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-xs space-y-4"
            >
              {/* Result Header */}
              <div className="border-b border-[#E5DFD3] pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-stone-500 uppercase">
                    Evaluation Dossier #{result.proposal_id}
                  </span>
                  {result.inference_time_ms !== undefined && (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                      ⚡ {result.inference_time_ms.toFixed(1)} ms
                    </span>
                  )}
                </div>

                {/* Recommendation Banner */}
                <div
                  className={`rounded-lg p-3 border flex items-center gap-2.5 ${
                    result.approval_recommendation === "AUTOMATIC_CLEARANCE"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : result.approval_recommendation === "CRITICAL_INTERVENTION_REQUIRED"
                      ? "bg-rose-50 border-rose-300 text-rose-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  {result.approval_recommendation === "AUTOMATIC_CLEARANCE" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                      {result.approval_recommendation.replace(/_/g, " ")}
                    </h4>
                    <p className="text-[11px] font-sans leading-tight mt-0.5">
                      {result.approval_recommendation === "AUTOMATIC_CLEARANCE"
                        ? "Low anomaly profile. Recommended for statutory administrative sanction."
                        : result.approval_recommendation === "CRITICAL_INTERVENTION_REQUIRED"
                        ? "Critical multi-signal indicators. Hold release pending vigilance audit."
                        : "Elevated risk signals detected. Secondary technical review advised."}
                    </p>
                  </div>
                </div>
              </div>

              {/* SETU Risk Scores Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-2.5">
                  <span className="text-[10px] text-stone-500 font-mono block">Overall Risk</span>
                  <span className="text-xl font-black font-mono text-[#6E4529] block">
                    {result.overall_risk_score.toFixed(1)}
                  </span>
                </div>

                <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-2.5">
                  <span className="text-[10px] text-stone-500 font-mono block">Risk Tier</span>
                  <div className="mt-1">
                    <RiskBadge score={result.overall_risk_score} level={result.risk_level} size="sm" />
                  </div>
                </div>

                <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-2.5">
                  <span className="text-[10px] text-stone-500 font-mono block">Priority</span>
                  <div className="mt-1">
                    <PriorityBadge priority={result.investigation_priority} size="sm" />
                  </div>
                </div>

                <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-2.5">
                  <span className="text-[10px] text-stone-500 font-mono block">Fraud Prob</span>
                  <span className="text-xl font-black font-mono text-rose-700 block">
                    {(result.fraud_probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Typology Badge */}
              <div className="flex items-center justify-between text-xs py-1 border-y border-[#E5DFD3]">
                <span className="text-stone-600 font-medium">Predicted Typology:</span>
                <span className="rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2 py-0.5 font-mono font-bold text-[#6E4529]">
                  {formatTypologyLabel(result.primary_typology)}
                </span>
              </div>

              {/* 7 Domain Anomaly Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-700 uppercase font-mono tracking-wider block">
                  7-Model Domain Breakdown (0–100)
                </span>
                <div className="space-y-1.5 text-xs">
                  {[
                    { name: "Financial (M1)", score: result.sub_scores?.financial || 0, color: "#ef4444" },
                    { name: "Geospatial (M2)", score: result.sub_scores?.geospatial || 0, color: "#0ea5e9" },
                    { name: "Procurement (M3)", score: result.sub_scores?.procurement || 0, color: "#f59e0b" },
                    { name: "Contractor (M4)", score: result.sub_scores?.contractor || 0, color: "#6366f1" },
                    { name: "Payment (M5)", score: result.sub_scores?.payment || 0, color: "#8b5cf6" },
                    { name: "Progress (M6)", score: result.sub_scores?.progress || 0, color: "#f97316" },
                    { name: "Graph Network (M7)", score: result.sub_scores?.graph || 0, color: "#10b981" },
                  ].map((d) => (
                    <div key={d.name} className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-stone-600 w-28 truncate">{d.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(3, d.score))}%`,
                            backgroundColor: d.color,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[#1C1917] w-8 text-right font-tabular">
                        {d.score.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesized Reason Traces */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-stone-700 uppercase font-mono tracking-wider block">
                  Synthesized Evidence Traces
                </span>
                <ul className="space-y-1 text-xs text-stone-800">
                  {result.synthesized_reasons?.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 bg-[#FAF7F2] p-2 rounded border border-[#E5DFD3] text-[11px]">
                      <span className="text-[#6E4529] font-bold font-mono">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </MagicCard>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D9D2C5] bg-[#FAF7F2]/60 p-8 text-center space-y-3">
              <Zap className="h-10 w-10 text-stone-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-stone-700 font-editorial">
                  Inference Results Waiting
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Configure proposal parameters or select a test scenario on the left and click &quot;Evaluate Proposal Now&quot;.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
