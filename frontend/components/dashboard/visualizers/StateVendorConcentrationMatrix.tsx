"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, Scale, AlertTriangle, ArrowUpRight, BarChart3, 
  MapPin, ShieldAlert, CheckCircle2, ChevronRight, PieChart
} from "lucide-react";
import { RiskBadge } from "../../ui/RiskBadge";

interface StateVendorConcentrationMatrixProps {
  jurisdiction?: string;
  stateName?: string;
  summary?: any;
  extraInsights?: any;
  districtData?: any[];
}

export function StateVendorConcentrationMatrix({ 
  jurisdiction, 
  stateName,
  summary,
  extraInsights, 
  districtData = []
}: StateVendorConcentrationMatrixProps) {
  const [selectedView, setSelectedView] = useState<"hhi" | "districts">("hhi");

  const stateLabel = jurisdiction || stateName || "State";
  const insights = extraInsights || summary?.extra_insights || {};
  const hhi = insights?.vendor_concentration_hhi || 799.8;
  const hhiCategory = insights?.hhi_category || "Competitive Allocation Spread";
  const cr3 = insights?.cr3_concentration_ratio || 39.1;
  const topAgencies = insights?.top_agencies || [];

  return (
    <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E4529]">
              <Scale className="h-3 w-3 text-[#6E4529]" />
              STATE PLANNING & VENDOR VIGILANCE
            </span>
            <span className="rounded bg-[#FAF7F2] border border-[#E5DFD3] px-2 py-0.5 text-[10px] font-mono text-stone-600">
              State: {stateLabel}
            </span>
          </div>
          <h3 className="mt-1.5 text-base sm:text-lg font-editorial font-bold text-[#1C1917] tracking-tight">
            Statewide Vendor Concentration (HHI) & District Equity Barometer
          </h3>
          <p className="mt-0.5 text-xs text-stone-500 font-sans">
            Monitors whether public tenders are monopolized by select state corporations and audits inter-district fund equity.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-1 text-xs">
          <button
            onClick={() => setSelectedView("hhi")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition-all ${
              selectedView === "hhi" ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Vendor HHI Index</span>
          </button>
          <button
            onClick={() => setSelectedView("districts")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition-all ${
              selectedView === "districts" ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>District Equity Disparity</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
            State Vendor HHI Score
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#1C1917] font-mono font-tabular">{hhi.toFixed(1)}</span>
            <span className="text-[11px] text-stone-500 font-mono">/ 10,000 pts</span>
          </div>
          <span className="mt-1 text-[11px] text-emerald-800 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {hhiCategory}
          </span>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
            Top-3 Agency Concentration (CR3)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#6E4529] font-mono font-tabular">{cr3.toFixed(1)}%</span>
            <span className="text-[11px] text-stone-500 font-mono">of state outlay</span>
          </div>
          <span className="mt-1 text-[11px] text-stone-600 block font-sans">
            Primary state infrastructure authorities
          </span>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
            Active Executing Entities
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#1C1917] font-mono font-tabular">
              {insights?.total_active_idas || 41}
            </span>
            <span className="text-[11px] text-stone-500 font-mono">Registered IDAs</span>
          </div>
          <span className="mt-1 text-[11px] text-stone-600 block font-sans">
            Operating across {insights?.total_active_mps || 45} constituencies
          </span>
        </div>
      </div>

      {/* VIEW 1: VENDOR HHI INDEX & MONOPOLY BREAKDOWN */}
      {selectedView === "hhi" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#6E4529]" />
                Dominant Executing Agencies Ranked by Capital Capture in {stateLabel}
              </span>
              <Link href="/graph" className="text-[#6E4529] hover:underline flex items-center gap-1 font-semibold">
                Open Cartel Graph <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {topAgencies.map((agency: any, idx: number) => {
                const isMonopoly = agency.share_pct >= 20.0;
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] p-3 hover:bg-[#F5EBE1]/40 transition-colors text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F0ECE1] font-mono text-[11px] font-bold text-[#6E4529] border border-[#D9D2C5]">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-[#1C1917] truncate max-w-sm" title={agency.name}>
                          {agency.name}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5 font-mono">
                          {agency.works_count} works • <span className="text-[#6E4529] font-bold font-tabular">₹{(agency.amount / 10000000).toFixed(2)} Cr</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-28 hidden sm:block">
                        <div className="flex justify-between text-[10px] text-stone-500 mb-1 font-mono">
                          <span>Capture:</span>
                          <span className="font-bold text-[#1C1917] font-tabular">{agency.share_pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isMonopoly ? "bg-amber-600" : "bg-[#6E4529]"}`} 
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
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-[#E5DFD3] pb-2 font-mono">
            <span className="font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#6E4529]" />
              Inter-District Allocation Spread & Risk Distribution
            </span>
            <span className="text-stone-500 text-[11px]">Ranking by Anomaly Concentration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {districtData.slice(0, 9).map((dist: any, idx: number) => (
              <div 
                key={idx}
                className="rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] p-3 text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1C1917] truncate">{dist.district || dist.name}</span>
                  <RiskBadge score={dist.avg_risk_score || dist.avg_risk || 45} size="sm" />
                </div>
                <div className="flex justify-between text-[11px] text-stone-500 font-mono">
                  <span>Sanctioned Works:</span>
                  <span className="font-bold text-[#1C1917] font-tabular">{dist.total_works || dist.works_count}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-500 font-mono">
                  <span>Funds Allocated:</span>
                  <span className="font-bold text-[#6E4529] font-tabular">
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
