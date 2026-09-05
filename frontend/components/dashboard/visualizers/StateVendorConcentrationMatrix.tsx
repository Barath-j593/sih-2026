"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, Scale, AlertTriangle, ArrowUpRight, BarChart3, 
  MapPin, ShieldAlert, CheckCircle2, ChevronRight, PieChart
} from "lucide-react";
import { RiskBadge } from "../../ui/RiskBadge";

interface StateVendorConcentrationMatrixProps {
  jurisdiction: string;
  extraInsights: any;
  districtData: any[];
}

export function StateVendorConcentrationMatrix({ 
  jurisdiction, 
  extraInsights, 
  districtData 
}: StateVendorConcentrationMatrixProps) {
  const [selectedView, setSelectedView] = useState<"hhi" | "districts">("hhi");

  const hhi = extraInsights?.vendor_concentration_hhi || 799.8;
  const hhiCategory = extraInsights?.hhi_category || "Competitive Allocation Spread";
  const cr3 = extraInsights?.cr3_concentration_ratio || 39.1;
  const topAgencies = extraInsights?.top_agencies || [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#060c19] p-5 shadow-2xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-950/70 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
              <Scale className="h-3 w-3 text-amber-400" />
              STATE PLANNING & VENDOR VIGILANCE
            </span>
            <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
              State: {jurisdiction}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-bold text-white tracking-tight sm:text-lg">
            Statewide Vendor Concentration (HHI) & District Equity Barometer
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Monitors whether public tenders are monopolized by select state corporations and audits inter-district fund equity.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            onClick={() => setSelectedView("hhi")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-all ${
              selectedView === "hhi" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Vendor HHI Index</span>
          </button>
          <button
            onClick={() => setSelectedView("districts")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-all ${
              selectedView === "districts" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>District Equity Disparity</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            State Vendor HHI Score
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">{hhi.toFixed(1)}</span>
            <span className="text-[11px] text-slate-500">/ 10,000 pts</span>
          </div>
          <span className="mt-1 text-[11px] text-emerald-400 font-semibold block flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> {hhiCategory}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Top-3 Agency Concentration (CR3)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono">{cr3.toFixed(1)}%</span>
            <span className="text-[11px] text-slate-500">of total state funds</span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400 block">
            Held by Saran, Bhojpur & Katihar IDAs
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Active Executing Entities
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-400 font-mono">
              {extraInsights?.total_active_idas || 41}
            </span>
            <span className="text-[11px] text-slate-500">State Agencies</span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400 block">
            Operating across {extraInsights?.total_active_mps || 45} parliamentary constituencies
          </span>
        </div>
      </div>

      {/* VIEW 1: VENDOR HHI INDEX & MONOPOLY BREAKDOWN */}
      {selectedView === "hhi" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-400" />
                Dominant Executing Agencies Ranked by Capital Capture in {jurisdiction}
              </span>
              <Link href="/graph" className="text-amber-400 hover:underline flex items-center gap-1 font-semibold">
                Open Cartel Graph <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {topAgencies.map((agency: any, idx: number) => {
                const isMonopoly = agency.share_pct >= 20.0;
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 hover:border-slate-700 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800 font-mono text-[11px] font-bold text-slate-300">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-white truncate max-w-sm" title={agency.name}>
                          {agency.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {agency.works_count} works • <span className="text-amber-400 font-mono font-semibold">₹{(agency.amount / 10000000).toFixed(2)} Cr</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-28 hidden sm:block">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Capture:</span>
                          <span className="font-bold font-mono text-white">{agency.share_pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isMonopoly ? "bg-amber-500" : "bg-cyan-500"}`} 
                            style={{ width: `${agency.share_pct * 3}%` }} 
                          />
                        </div>
                      </div>
                      <RiskBadge score={agency.avg_risk} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DISTRICT EQUITY DISPARITY */}
      {selectedView === "districts" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-cyan-400" />
              Inter-District Allocation Spread & Risk Distribution
            </span>
            <span className="text-slate-400 text-[11px]">Ranking by Anomaly Concentration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {districtData.slice(0, 9).map((dist: any, idx: number) => (
              <div 
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate">{dist.district || dist.name}</span>
                  <RiskBadge score={dist.avg_risk_score || dist.avg_risk || 45} size="sm" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Sanctioned Works:</span>
                  <span className="font-bold text-slate-200">{dist.total_works || dist.works_count}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Funds Allocated:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    ₹{((dist.total_allocation || dist.total_amount || 0) / 10000000).toFixed(2)} Cr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
