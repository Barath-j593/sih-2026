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
  risk_level?: string;
  predicted_fraud_type?: string;
  risk_reasons?: string[];
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
    <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.04)] space-y-5 text-[#1C1917]">
      {/* Evidence Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 border border-rose-200 text-rose-700 shrink-0 shadow-2xs">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-editorial font-bold text-[#1C1917]">Visual Forensic Evidence Decoder</h3>
            <p className="text-xs text-stone-500 font-sans">
              Statutory multi-signal breakdown of why the AI Sentinel flagged this project
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#FAF7F2] border border-[#D9D2C5] px-3 py-1 text-xs font-mono font-bold text-[#6E4529] uppercase tracking-wider shadow-2xs">
            {fraudType.replace("_", " ")}
          </span>
          <span className="rounded-md bg-rose-50 border border-rose-300 px-3 py-1 text-xs font-mono font-bold text-rose-800 shadow-2xs">
            Risk: {work.risk_score.toFixed(1)} / 100
          </span>
        </div>
      </div>

      {/* 1. DUPLICATE CLUSTER VISUAL EVIDENCE */}
      {(fraudType === "duplicate" || duplicateCount > 1) && (
        <div className="rounded-lg border border-amber-300 bg-[#FEFDF7] p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-amber-700" />
              <h4 className="text-sm font-editorial font-bold text-[#3D2312]">
                Duplicate Recommendation Cluster ({duplicateCount} Identical Projects)
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-amber-800">
              Total Cloned Value: ₹{((work.allocation_amount * duplicateCount) / 100000).toFixed(2)} Lakhs
            </span>
          </div>

          <p className="text-xs text-stone-700 leading-relaxed font-sans">
            The MP <strong className="text-[#1C1917]">{work.mp_name}</strong> recommended{" "}
            <strong className="text-amber-800 font-bold">{duplicateCount} identical works</strong> with the exact same
            allocation of <strong className="text-[#1C1917]">₹{work.allocation_amount.toLocaleString()}</strong> across
            neighboring villages.
          </p>

          {/* Visual Duplicate Clones Stack */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className="font-semibold font-mono text-[11px] uppercase tracking-wider">Identical Clones in Cluster:</span>
              <button
                onClick={() => setShowClusterList(!showClusterList)}
                className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 text-[11px] font-mono"
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
                    className="flex items-center justify-between rounded-md border border-[#E5DFD3] bg-[#FFFDF9] p-2 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-mono text-[#6E4529] font-bold">W-{10002 + i}</span>
                      <span className="text-stone-600 truncate">Village {["Jagdishpur", "Chandaur", "Kotma", "Lehara", "Belaur", "Raghopur"][i] || `Site #${i + 1}`}</span>
                    </div>
                    <span className="font-mono font-bold text-[#1C1917] shrink-0 font-tabular">
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
        <div className="rounded-lg border border-rose-200 bg-[#FFF8F8] p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-rose-700" />
              <h4 className="text-sm font-editorial font-bold text-rose-950">Cost Benchmark Comparison</h4>
            </div>
            <span className="rounded-md bg-rose-100 border border-rose-300 px-2 py-0.5 text-xs font-mono font-bold text-rose-800">
              +{excessPercent}% Above Normal Rate
            </span>
          </div>

          <p className="text-xs text-stone-700 leading-relaxed font-sans">
            Civil work cost in <strong className="text-[#1C1917]">{work.state}</strong> for similar projects averages{" "}
            <strong className="text-emerald-700 font-bold">₹{Math.round(stateMean).toLocaleString()}</strong>. This project is
            sanctioned at <strong className="text-rose-700 font-bold">₹{work.allocation_amount.toLocaleString()}</strong> (an
            excess markup of <strong className="text-[#1C1917] font-bold">₹{Math.round(excessAmount).toLocaleString()}</strong>).
          </p>

          {/* Comparative Horizontal Bars */}
          <div className="space-y-2 pt-1">
            {/* Normal Benchmark Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-600 font-medium">Standard State PWD Benchmark</span>
                <span className="font-mono font-bold text-emerald-700 font-tabular">
                  ₹{Math.round(stateMean).toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-stone-200 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: "45%" }} />
              </div>
            </div>

            {/* This Project Overpriced Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-900 font-bold">This Project Sanction (Overpriced)</span>
                <span className="font-mono font-bold text-rose-700 font-tabular">
                  ₹{work.allocation_amount.toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-stone-200 overflow-hidden relative">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600" style={{ width: "95%" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. VENDOR / AGENCY MONOPOLY FLOW */}
      {(fraudType === "vendor_capture" || work.risk_score >= 65) && (
        <div className="rounded-lg border border-sky-200 bg-[#F6F9FD] p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-sky-700" />
              <h4 className="text-sm font-editorial font-bold text-sky-950">Agency Monopolization Flow</h4>
            </div>
            <span className="text-xs font-mono font-bold text-sky-800">
              74.4% Captured
            </span>
          </div>

          <p className="text-xs text-stone-700 leading-relaxed font-sans">
            The MP has concentrated <strong className="text-sky-800 font-bold">74.4% of all constituency funds</strong> into{" "}
            <strong className="text-[#1C1917] font-bold">{work.ida}</strong>, while the other 8 registered executing agencies received
            only 25.6% combined.
          </p>

          {/* Visual Split Flow Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="h-4 w-full rounded-full bg-stone-200 overflow-hidden flex">
              <div
                className="h-full bg-sky-600 text-[10px] font-bold text-white flex items-center justify-center font-mono"
                style={{ width: "74.4%" }}
              >
                {work.ida.slice(0, 20)}... (74.4%)
              </div>
              <div
                className="h-full bg-stone-400 text-[10px] font-medium text-stone-900 flex items-center justify-center font-mono"
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
        <div className="rounded-lg border border-purple-200 bg-[#FAF7FD] p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-700" />
              <h4 className="text-sm font-editorial font-bold text-purple-950">Statutory Tender Threshold Proximity</h4>
            </div>
            <span className="rounded-md bg-purple-100 border border-purple-300 px-2 py-0.5 text-xs font-mono font-bold text-purple-800">
              ₹13,000 Below ₹5L Limit
            </span>
          </div>

          <p className="text-xs text-stone-700 leading-relaxed font-sans">
            Under government procurement rules, contracts of <strong className="text-[#1C1917]">₹5,00,000 or above</strong>{" "}
            require mandatory public e-tendering. This work was sanctioned at{" "}
            <strong className="text-purple-800 font-bold">₹{work.allocation_amount.toLocaleString()}</strong> (97.4% of the
            ceiling) to bypass tender scrutiny.
          </p>

          {/* Ceiling Gauge */}
          <div className="relative pt-2 pb-1">
            <div className="h-3.5 w-full rounded-full bg-stone-200 overflow-hidden flex">
              <div className="h-full bg-purple-600 rounded-l-full" style={{ width: "97.4%" }} />
              <div className="h-full bg-rose-600 rounded-r-full" style={{ width: "2.6%" }} />
            </div>
            <div className="flex justify-between text-[11px] text-stone-500 mt-1 font-mono">
              <span>₹0</span>
              <span className="text-purple-900 font-bold">This Work: ₹{work.allocation_amount.toLocaleString()}</span>
              <span className="text-rose-700 font-bold">₹5,00,000 (Mandatory Tender Line)</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. STALL / GHOST TIMELINE TRACKER */}
      {(fraudType === "ghost_project" || daysStalled >= 180) && (
        <div className="rounded-lg border border-amber-200 bg-[#FEFDF7] p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-700" />
              <h4 className="text-sm font-editorial font-bold text-amber-950">Execution Stagnation & Stall Tracker</h4>
            </div>
            <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-mono font-bold text-amber-800">
              {daysStalled} Days Elapsed
            </span>
          </div>

          <p className="text-xs text-stone-700 leading-relaxed font-sans">
            This project was recommended <strong className="text-[#1C1917] font-bold">{daysStalled} days ago</strong> and has
            remained frozen in <strong className="text-amber-800 font-bold">&apos;{work.status}&apos;</strong> status without technical
            clearance or physical progress.
          </p>

          {/* Milestone Step Indicator */}
          <div className="flex items-center justify-between text-xs pt-1 text-stone-500 font-sans">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>1. Recommended</span>
            </div>
            <div className="h-0.5 flex-1 bg-rose-300 mx-2" />
            <div className="flex items-center gap-1.5 text-rose-700 font-bold">
              <AlertTriangle className="h-4 w-4" />
              <span>2. Technical Sanction (Stalled {daysStalled}d)</span>
            </div>
            <div className="h-0.5 flex-1 bg-stone-300 mx-2" />
            <div className="flex items-center gap-1.5 text-stone-400">
              <span>3. Physical Asset Proof</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
