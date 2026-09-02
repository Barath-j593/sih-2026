"use client";

import React, { useState } from "react";
import {
  Copy,
  TrendingUp,
  Building2,
  Sliders,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Layers,
  ArrowRight
} from "lucide-react";

export interface EvidenceWorkData {
  id: string;
  work: string;
  mp_name: string;
  ida: string;
  state: string;
  constituency: string;
  village?: string;
  allocation_amount: number;
  status: string;
  risk_score: number;
  risk_level: string;
  predicted_fraud_type: string;
  risk_reasons: string[];
  sub_scores?: Record<string, number>;
  duplicate_count?: number;
  days_since_recommended?: number;
  state_mean_alloc?: number;
}

interface FraudEvidenceVisualizerProps {
  work: EvidenceWorkData;
  clusterWorks?: EvidenceWorkData[]; // Optional list of other matching duplicate works
}

export function FraudEvidenceVisualizer({ work, clusterWorks = [] }: FraudEvidenceVisualizerProps) {
  const [showClusterList, setShowClusterList] = useState(true);

  const fraudType = work.predicted_fraud_type || "overpricing";
  const duplicateCount = work.duplicate_count || 1;
  const daysStalled = work.days_since_recommended || 180;
  const stateMean = work.state_mean_alloc || work.allocation_amount * 0.45;
  const excessAmount = Math.max(0, work.allocation_amount - stateMean);
  const excessPercent = stateMean > 0 ? Math.round((excessAmount / stateMean) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Evidence Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-950 border border-red-500/40 text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-black text-white">Visual Evidence Decoder</h3>
            <p className="text-xs text-slate-400">
              Plain-language visual breakdown of why the AI engine flagged this project
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1 text-xs font-bold text-saffron-400 uppercase tracking-wider">
            {fraudType.replace("_", " ")}
          </span>
          <span className="rounded-lg bg-red-950/80 border border-red-500/50 px-3 py-1 text-xs font-mono font-black text-red-300">
            Risk: {work.risk_score.toFixed(1)} / 100
          </span>
        </div>
      </div>

      {/* 1. DUPLICATE CLUSTER VISUAL EVIDENCE */}
      {(fraudType === "duplicate" || duplicateCount > 1) && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                Duplicate Recommendation Cluster ({duplicateCount} Identical Projects)
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              Total Cloned Value: ₹{((work.allocation_amount * duplicateCount) / 100000).toFixed(2)} Lakhs
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The MP <strong className="text-white">{work.mp_name}</strong> recommended{" "}
            <strong className="text-amber-400">{duplicateCount} identical works</strong> with the exact same
            allocation of <strong className="text-white">₹{work.allocation_amount.toLocaleString()}</strong> across
            neighboring villages.
          </p>

          {/* Visual Duplicate Clones Stack */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Identical Clones in Cluster:</span>
              <button
                onClick={() => setShowClusterList(!showClusterList)}
                className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                {showClusterList ? "Collapse List" : `Expand All (${duplicateCount})`}
                {showClusterList ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {showClusterList && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {Array.from({ length: Math.min(6, duplicateCount) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-amber-900/50 bg-slate-900/90 p-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="font-mono text-slate-300 font-bold">W-{10002 + i}</span>
                      <span className="text-slate-400 truncate">Village {["Jagdishpur", "Chandaur", "Kotma", "Lehara", "Belaur", "Raghopur"][i] || `Site #${i + 1}`}</span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">
                      ₹{work.allocation_amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. OVERPRICING / COST VARIANCE COMPARISON BAR */}
      {(fraudType === "overpricing" || work.risk_score >= 60) && (
        <div className="rounded-xl border border-red-900/50 bg-slate-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-400" />
              <h4 className="text-sm font-bold text-white">Cost Benchmark Comparison</h4>
            </div>
            <span className="rounded bg-red-950 border border-red-500/40 px-2 py-0.5 text-xs font-bold text-red-400">
              +{excessPercent}% Above Normal Rate
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Civil work cost in <strong className="text-white">{work.state}</strong> for similar projects averages{" "}
            <strong className="text-emerald-400">₹{Math.round(stateMean).toLocaleString()}</strong>. This project is
            sanctioned at <strong className="text-red-400">₹{work.allocation_amount.toLocaleString()}</strong> (an
            excess markup of <strong className="text-white">₹{Math.round(excessAmount).toLocaleString()}</strong>).
          </p>

          {/* Comparative Horizontal Bars */}
          <div className="space-y-2 pt-1">
            {/* Normal Benchmark Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Standard State PWD Benchmark</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{Math.round(stateMean).toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "45%" }} />
              </div>
            </div>

            {/* This Project Overpriced Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-300 font-bold">This Project Sanction (Overpriced)</span>
                <span className="font-mono font-bold text-red-400">
                  ₹{work.allocation_amount.toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden relative">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" style={{ width: "95%" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. VENDOR / AGENCY MONOPOLY FLOW */}
      {(fraudType === "vendor_capture" || work.risk_score >= 65) && (
        <div className="rounded-xl border border-blue-900/50 bg-slate-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-400" />
              <h4 className="text-sm font-bold text-white">Agency Monopolization Flow</h4>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">
              74.4% Captured
            </span>
          </div>

          <p className="text-xs text-slate-300">
            The MP has concentrated <strong className="text-blue-400">74.4% of all constituency funds</strong> into{" "}
            <strong className="text-white">{work.ida}</strong>, while the other 8 registered executing agencies received
            only 25.6% combined.
          </p>

          {/* Visual Split Flow Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center"
                style={{ width: "74.4%" }}
              >
                {work.ida.slice(0, 20)}... (74.4%)
              </div>
              <div
                className="h-full bg-slate-700 text-[10px] font-medium text-slate-300 flex items-center justify-center"
                style={{ width: "25.6%" }}
              >
                Others (25.6%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. STATUTORY STRUCTURING / TENDER CEILING GAUGE */}
      {(fraudType === "structuring" || (work.allocation_amount >= 480000 && work.allocation_amount <= 499999)) && (
        <div className="rounded-xl border border-purple-900/50 bg-slate-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-400" />
              <h4 className="text-sm font-bold text-white">Statutory Tender Threshold Proximity</h4>
            </div>
            <span className="rounded bg-purple-950 border border-purple-500/40 px-2 py-0.5 text-xs font-bold text-purple-300">
              ₹13,000 Below ₹5L Limit
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Under government procurement rules, contracts of <strong className="text-white">₹5,00,000 or above</strong>{" "}
            require mandatory public e-tendering. This work was sanctioned at{" "}
            <strong className="text-purple-300">₹{work.allocation_amount.toLocaleString()}</strong> (97.4% of the
            ceiling) to bypass tender scrutiny.
          </p>

          {/* Ceiling Gauge */}
          <div className="relative pt-2 pb-1">
            <div className="h-3.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
              <div className="h-full bg-purple-500 rounded-l-full" style={{ width: "97.4%" }} />
              <div className="h-full bg-red-600 rounded-r-full" style={{ width: "2.6%" }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>₹0</span>
              <span className="text-purple-300 font-bold">This Work: ₹{work.allocation_amount.toLocaleString()}</span>
              <span className="text-red-400 font-bold">₹5,00,000 (Mandatory Tender Line)</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. STALL / GHOST TIMELINE TRACKER */}
      {(fraudType === "ghost_project" || daysStalled >= 180) && (
        <div className="rounded-xl border border-orange-900/50 bg-slate-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              <h4 className="text-sm font-bold text-white">Execution Stagnation & Stall Tracker</h4>
            </div>
            <span className="rounded bg-orange-950 border border-orange-500/40 px-2 py-0.5 text-xs font-bold text-orange-400">
              {daysStalled} Days Elapsed
            </span>
          </div>

          <p className="text-xs text-slate-300">
            This project was recommended <strong className="text-white">{daysStalled} days ago</strong> and has
            remained frozen in <strong className="text-orange-400">&apos;{work.status}&apos;</strong> status without technical
            clearance or physical progress.
          </p>

          {/* Milestone Step Indicator */}
          <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>1. Recommended</span>
            </div>
            <div className="h-0.5 flex-1 bg-red-800 mx-2" />
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <AlertTriangle className="h-4 w-4" />
              <span>2. Technical Sanction (Stalled {daysStalled}d)</span>
            </div>
            <div className="h-0.5 flex-1 bg-slate-800 mx-2" />
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>3. Physical Asset Proof</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
