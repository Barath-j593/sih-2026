"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, ShieldAlert, AlertTriangle, Layers, TrendingUp, 
  ArrowRight, Landmark, FileText, CheckCircle2, ChevronRight,
  ExternalLink, BarChart3, Scale
} from "lucide-react";
import { RiskBadge } from "../../ui/RiskBadge";

interface NationalCartelFunnelProps {
  summary: any;
  extraInsights: any;
  graphData: { nodes: any[]; links: any[] };
}

export function NationalCartelFunnel({ summary, extraInsights, graphData }: NationalCartelFunnelProps) {
  const [activeTab, setActiveTab] = useState<"conduit" | "syndicates">("conduit");

  const topAgencies = extraInsights?.top_agencies || [];
  const hhi = extraInsights?.vendor_concentration_hhi || 850;
  const hhiCategory = extraInsights?.hhi_category || "Competitive National Spread";
  const cr3 = extraInsights?.cr3_concentration_ratio || 35.4;

  // Filter top monopoly links from graph
  const monopolyLinks = (graphData?.links || [])
    .filter((l: any) => l.share >= 0.40)
    .sort((a: any, b: any) => b.total_amount - a.total_amount)
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#040914] p-5 shadow-2xl backdrop-blur-md space-y-5">
      {/* Header with PAC Forensic Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-950/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-400">
              <Landmark className="h-3 w-3 text-cyan-400" />
              MoSPI NATIONAL AUDIT OVERSIGHT
            </span>
            <span className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
              PAC / CAG Mandate
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-bold text-white tracking-tight sm:text-lg">
            National Capital Pipeline & Cross-State Vendor Capture Barometer
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Monitors macro fund flow from Consolidated Fund of India across state borders to isolate contractor syndicates.
          </p>
        </div>

        {/* Forensic Mode Switcher */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            onClick={() => setActiveTab("conduit")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-all ${
              activeTab === "conduit" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Macro Flow Conduit</span>
          </button>
          <button
            onClick={() => setActiveTab("syndicates")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-all ${
              activeTab === "syndicates" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Cross-State Syndicates</span>
          </button>
        </div>
      </div>

      {/* CAG Macro Market Concentration (HHI) Barometer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-amber-400" />
              National Vendor Concentration HHI
            </span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
              hhi >= 2500 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}>
              {hhiCategory}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{hhi.toFixed(1)}</span>
            <span className="text-xs text-slate-500 font-mono">/ 10,000 pts</span>
          </div>

          {/* HHI Visual Gradient Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-700" 
                style={{ width: `${Math.min(100, (hhi / 3500) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Competitive (&lt;1500)</span>
              <span>Moderate (2500)</span>
              <span>Cartel (&gt;2500)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900 flex justify-between text-xs">
            <span className="text-slate-400">Top-3 Concentration Ratio (CR3):</span>
            <span className="font-bold text-amber-400 font-mono">{cr3.toFixed(1)}% of Capital</span>
          </div>
        </div>

        <div className="md:col-span-7 rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
              Parliamentary PAC Alert: Capital Funneling Indicators
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Section 3.4 of MPLADS Guidelines prohibits concentration of multiple parliamentary grants into exclusive non-competitive executing bodies.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
            <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Total Active IDAs</span>
              <span className="text-sm font-bold text-white font-mono">{extraInsights?.total_active_idas || 68} Agencies</span>
            </div>
            <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Active Recommenders</span>
              <span className="text-sm font-bold text-blue-400 font-mono">{extraInsights?.total_active_mps || 78} MPs</span>
            </div>
            <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">National Flagged Capital</span>
              <span className="text-sm font-bold text-red-400 font-mono">₹{(summary.amount_at_risk / 10000000).toFixed(1)} Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: MACRO FLOW CONDUIT */}
      {activeTab === "conduit" && (
        <div className="rounded-xl border border-slate-800/90 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-2">
            <span>Macro Allocation Flow: Recommending MPs ➔ Dominant National Implementing Authorities</span>
            <Link href="/graph" className="text-amber-400 font-bold hover:underline flex items-center gap-1">
              Explore State Scoped Graph <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {topAgencies.slice(0, 5).map((agency: any, idx: number) => (
              <div 
                key={idx}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-400 border border-amber-500/20 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate" title={agency.name}>
                      {agency.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{agency.works_count} sanctioned projects</span>
                      <span>•</span>
                      <span className="text-amber-400 font-mono font-semibold">₹{(agency.amount / 10000000).toFixed(2)} Cr Outlay</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-400 font-mono">{agency.share_pct}% Share</div>
                    <div className="text-[10px] text-slate-500">of jurisdiction funds</div>
                  </div>
                  <RiskBadge score={agency.avg_risk} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-STATE SYNDICATES LEADERBOARD */}
      {activeTab === "syndicates" && (
        <div className="rounded-xl border border-red-900/30 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            High-Weight Single-Agency Capture Corridors (&ge; 40% Share of MP Outlay)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monopolyLinks.map((link: any, idx: number) => (
              <div 
                key={idx}
                className="rounded-lg border border-red-900/40 bg-red-950/10 p-3 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 truncate max-w-[160px]">
                    {typeof link.source === "string" ? link.source.replace("MP_", "") : "Recommending MP"}
                  </span>
                  <span className="rounded bg-red-500/20 text-red-400 px-2 py-0.5 font-mono font-bold border border-red-500/30 text-[10px]">
                    {(link.share * 100).toFixed(1)}% Monopoly
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <ArrowRight className="h-3 w-3 text-red-400 shrink-0" />
                  <span className="truncate">{typeof link.target === "string" ? link.target.replace("IDA_", "") : "Executing IDA"}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-1.5">
                  <span>{link.work_count} Works Contracted</span>
                  <span className="font-bold text-amber-400 font-mono">₹{(link.total_amount / 100000).toFixed(1)} Lakhs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
