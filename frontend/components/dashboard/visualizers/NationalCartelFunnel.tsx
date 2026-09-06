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
    <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] space-y-5">
      {/* Header with PAC Forensic Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E4529]">
              <Landmark className="h-3 w-3 text-[#6E4529]" />
              MoSPI NATIONAL AUDIT OVERSIGHT
            </span>
            <span className="rounded bg-[#FAF7F2] border border-[#E5DFD3] px-2 py-0.5 text-[10px] font-mono text-stone-600">
              PAC / CAG Mandate
            </span>
          </div>
          <h3 className="mt-1.5 text-base sm:text-lg font-editorial font-bold text-[#1C1917] tracking-tight">
            National Capital Pipeline & Cross-State Vendor Capture Barometer
          </h3>
          <p className="mt-0.5 text-xs text-stone-500 font-sans">
            Monitors macro fund flow from Consolidated Fund of India across state borders to isolate contractor syndicates.
          </p>
        </div>

        {/* Forensic Mode Switcher */}
        <div className="flex items-center rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-1 text-xs">
          <button
            onClick={() => setActiveTab("conduit")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition-all ${
              activeTab === "conduit" ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Macro Flow Conduit</span>
          </button>
          <button
            onClick={() => setActiveTab("syndicates")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition-all ${
              activeTab === "syndicates" ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Cross-State Syndicates</span>
          </button>
        </div>
      </div>

      {/* CAG Macro Market Concentration (HHI) Barometer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 font-mono">
              <Scale className="h-3.5 w-3.5 text-[#6E4529]" />
              National Vendor Concentration HHI
            </span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
              hhi >= 2500 ? "bg-rose-50 text-rose-800 border border-rose-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}>
              {hhiCategory}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1C1917] font-mono font-tabular">{hhi.toFixed(1)}</span>
            <span className="text-xs text-stone-500 font-mono">/ 10,000 pts</span>
          </div>

          {/* HHI Visual Gradient Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 transition-all duration-700" 
                style={{ width: `${Math.min(100, (hhi / 3500) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>Competitive (&lt;1500)</span>
              <span>Moderate (2500)</span>
              <span>Cartel (&gt;2500)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5DFD3] flex justify-between text-xs font-mono">
            <span className="text-stone-500">Top-3 Ratio (CR3):</span>
            <span className="font-bold text-[#6E4529] font-tabular">{cr3.toFixed(1)}% of Capital</span>
          </div>
        </div>

        <div className="md:col-span-7 rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 font-mono">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              Parliamentary PAC Alert: Capital Funneling Indicators
            </span>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Section 3.4 of MPLADS Guidelines prohibits concentration of multiple parliamentary grants into exclusive non-competitive executing bodies.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
            <div className="rounded-lg bg-[#FFFDF9] p-2.5 border border-[#E5DFD3] shadow-2xs">
              <span className="text-[10px] text-stone-500 block font-mono">Total Active IDAs</span>
              <span className="text-sm font-bold text-[#1C1917] font-mono font-tabular">{extraInsights?.total_active_idas || 68} Agencies</span>
            </div>
            <div className="rounded-lg bg-[#FFFDF9] p-2.5 border border-[#E5DFD3] shadow-2xs">
              <span className="text-[10px] text-stone-500 block font-mono">Active Recommenders</span>
              <span className="text-sm font-bold text-[#6E4529] font-mono font-tabular">{extraInsights?.total_active_mps || 78} MPs</span>
            </div>
            <div className="rounded-lg bg-[#FFFDF9] p-2.5 border border-[#E5DFD3] shadow-2xs">
              <span className="text-[10px] text-stone-500 block font-mono">Flagged Capital</span>
              <span className="text-sm font-bold text-rose-700 font-mono font-tabular">₹{(summary.amount_at_risk / 10000000).toFixed(1)} Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: MACRO FLOW CONDUIT */}
      {activeTab === "conduit" && (
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-600 border-b border-[#E5DFD3] pb-2 font-mono">
            <span>Macro Allocation Flow: Recommending MPs ➔ Dominant National Implementing Authorities</span>
            <Link href="/graph" className="text-[#6E4529] font-bold hover:underline flex items-center gap-1">
              Explore State Scoped Graph <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {topAgencies.slice(0, 5).map((agency: any, idx: number) => (
              <div 
                key={idx}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] p-3 hover:bg-[#F5EBE1]/40 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#F0ECE1] text-xs font-bold text-[#6E4529] border border-[#D9D2C5] font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-[#1C1917] truncate" title={agency.name}>
                      {agency.name}
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{agency.works_count} sanctioned projects</span>
                      <span>•</span>
                      <span className="text-[#6E4529] font-bold font-tabular">₹{(agency.amount / 10000000).toFixed(2)} Cr Outlay</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-black text-[#6E4529] font-mono font-tabular">{agency.share_pct}% Share</div>
                    <div className="text-[10px] text-stone-500">of jurisdiction funds</div>
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
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 font-mono">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            High-Weight Single-Agency Capture Corridors (&ge; 40% Share of MP Outlay)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monopolyLinks.map((link: any, idx: number) => (
              <div 
                key={idx}
                className="rounded-lg border border-rose-200 bg-[#FFFDF9] p-3 text-xs space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1C1917] truncate max-w-[160px]">
                    {typeof link.source === "string" ? link.source.replace("MP_", "") : "Recommending MP"}
                  </span>
                  <span className="rounded bg-rose-50 text-rose-800 px-2 py-0.5 font-mono font-bold border border-rose-200 text-[10px]">
                    {(link.share * 100).toFixed(1)}% Monopoly
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                  <ArrowRight className="h-3 w-3 text-rose-600 shrink-0" />
                  <span className="truncate">{typeof link.target === "string" ? link.target.replace("IDA_", "") : "Executing IDA"}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-500 border-t border-[#E5DFD3] pt-1.5 font-mono">
                  <span>{link.work_count} Works Contracted</span>
                  <span className="font-bold text-[#6E4529] font-tabular">₹{(link.total_amount / 100000).toFixed(1)} Lakhs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
