"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, ShieldAlert, Users, Network, TrendingUp, 
  ArrowRight, AlertTriangle, Layers, MapPin, Search, 
  Info, ExternalLink, Activity, Filter, CheckCircle2, ChevronRight, BarChart3
} from "lucide-react";

interface MoSPINationalFlowProps {
  telemetry: any;
  nodes: any[];
  links: any[];
  selectedState: string;
  availableStates?: string[];
  onSelectState: (state: string) => void;
}

export function MoSPINationalFlow({
  telemetry,
  nodes,
  links,
  selectedState,
  availableStates = [],
  onSelectState
}: MoSPINationalFlowProps) {
  const [activeTab, setActiveTab] = useState<"flow" | "syndicates" | "states">("flow");
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const forensics = telemetry?.ministry_forensics || {
    national_hhi: 622.5,
    national_hhi_category: "Competitive Federal Allocation Spread",
    national_cr5: 28.4,
    top_states: [],
    interstate_syndicates: [],
    zonal_breakdown: []
  };

  const zones = forensics.zonal_breakdown || [];
  const totalZonalCap = zones.reduce((acc: number, z: any) => acc + (z.capital || 0), 0) || (telemetry?.total_capital || 1.0);
  const totalZonalWorks = zones.reduce((acc: number, z: any) => acc + (z.works || 0), 0) || (telemetry?.total_works || 0);

  return (
    <div className="space-y-5">
      {/* Sleek Sub-Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Network className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Federal Capital Allocation & Interstate Syndicates
            </h3>
            <span className="text-[11px] text-slate-500">
              National radar tracking budget dispersion and cross-state executing bodies.
            </span>
          </div>
        </div>

        {/* Clean Pill Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
          <button
            onClick={() => setActiveTab("flow")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "flow" 
                ? "bg-white text-cyan-950 shadow-xs border border-cyan-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Zonal Flow ({zones.length})
          </button>
          <button
            onClick={() => setActiveTab("syndicates")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "syndicates" 
                ? "bg-white text-rose-900 shadow-xs border border-rose-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Interstate Cartels ({forensics.interstate_syndicates?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("states")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "states" 
                ? "bg-white text-amber-900 shadow-xs border border-amber-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            State Outlays ({forensics.top_states?.length || 0})
          </button>
        </div>
      </div>

      {/* Streamlined Federal Barometer HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Federal Concentration (HHI)
            </span>
            <span className="text-[10px] font-mono text-cyan-800 px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 font-bold">
              National
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-700 font-mono">{forensics.national_hhi}</span>
            <span className="text-[11px] text-slate-500 font-mono">/ 10,000</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            ✓ {forensics.national_hhi_category}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Top-5 States Share (CR5)
            </span>
            <span className="text-[10px] font-mono text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-bold">
              Macro CR
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 font-mono">{forensics.national_cr5}%</span>
            <span className="text-[11px] text-slate-500 font-medium">of federal pool</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            Disbursed across top 5 states
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              National Capital Analyzed
            </span>
            <span className="text-[10px] font-mono text-blue-700 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-bold">
              Total
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ₹{(totalZonalCap / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            Across {totalZonalWorks.toLocaleString()} monitored works
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Interstate Cartels
            </span>
            <span className="text-[10px] font-mono text-rose-700 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 font-bold">
              Cross-Border
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600 font-mono">
              {forensics.interstate_syndicates?.length || 0}
            </span>
            <span className="text-xs text-rose-600 font-bold">Multi-State IDAs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            District bodies operating across borders
          </span>
        </div>
      </div>

      {/* TAB 1: ZONAL FLOW CONDUIT */}
      {activeTab === "flow" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-cyan-600" />
                Inter-Zonal Flow Conduit & Federal Capital Distribution
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Hover zone to inspect capital flow</span>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Ministry Central Node */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center p-6 rounded-2xl border border-cyan-200 bg-cyan-50/40 text-center space-y-3 shadow-xs">
              <div className="h-16 w-16 rounded-2xl bg-cyan-100 border border-cyan-200 flex items-center justify-center shadow-xs">
                <Building2 className="h-8 w-8 text-cyan-700" />
              </div>
              <div>
                <span className="rounded bg-cyan-100 text-cyan-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                  Central Treasury
                </span>
                <h4 className="text-base font-black text-slate-900 mt-1.5">MoSPI Central Treasury</h4>
                <p className="text-xs text-slate-500 mt-0.5">National MPLADS Allocation</p>
                <div className="text-lg font-black text-cyan-700 font-mono mt-2">
                  ₹{(totalZonalCap / 10000000).toFixed(2)} Cr
                </div>
              </div>
            </div>

            {/* Middle: Zonal Conduits */}
            <div className="lg:col-span-6 space-y-3">
              {zones.map((z: any, idx: number) => {
                const pct = ((z.capital / totalZonalCap) * 100).toFixed(1);
                const isHovered = hoveredZone === z.zone;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredZone(z.zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                    className={`rounded-xl border p-3.5 transition-all cursor-pointer ${
                      isHovered 
                        ? "border-cyan-400 bg-cyan-50/70 shadow-sm translate-x-1" 
                        : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{z.zone}</span>
                      <span className="font-mono font-black text-cyan-800">
                        ₹{(z.capital / 10000000).toFixed(2)} Cr ({pct}%)
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          z.risk >= 65 ? "bg-rose-500" : z.risk >= 60 ? "bg-amber-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{z.works?.toLocaleString()} works monitored</span>
                      <span className="flex items-center gap-1">
                        Avg Risk: <strong className={z.risk >= 65 ? "text-rose-600 font-bold" : "text-amber-700 font-bold"}>{z.risk}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: State Quick Jump */}
            <div className="lg:col-span-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-2">
                Filter by State Portal
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(availableStates.length > 0 ? availableStates.slice(0, 8) : ["Bihar", "Uttar Pradesh", "Tamil Nadu", "Karnataka", "Andhra Pradesh", "West Bengal"]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onSelectState(st)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      selectedState === st
                        ? "bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">📍 {st}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERSTATE CARTEL SYNDICATES */}
      {activeTab === "syndicates" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                CAG Parliamentary Audit Finding: Multi-State Contractor Networks
              </h4>
              <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                These entities operate across multiple state jurisdictions under proxy IDA accounts to evade state-level procurement blacklists and monopolize public works contracts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(forensics.interstate_syndicates || []).map((syn: any, idx: number) => (
              <div 
                key={idx}
                className="rounded-xl border border-rose-200 bg-white p-5 space-y-3 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-black uppercase font-mono border border-rose-200">
                      {syn.syndicate_id || `SYNDICATE-0${idx + 1}`}
                    </span>
                    <span className="text-xs font-black text-rose-600 font-mono">Risk: {syn.risk_score}</span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 truncate" title={syn.syndicate_name}>
                    {syn.syndicate_name}
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(syn.states_spanned || []).map((st: string) => (
                      <span key={st} className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Capital Siphoned:</span>
                    <strong className="text-slate-900 font-mono font-bold">₹{(syn.capital_diverted / 10000000).toFixed(2)} Cr</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Works Monitored:</span>
                    <strong className="text-slate-900 font-mono font-bold">{syn.works_count}</strong>
                  </div>
                  <p className="text-[11px] text-amber-900 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    Pattern: {syn.pattern}
                  </p>
                  <Link
                    href="/cases"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors mt-2 shadow-xs"
                  >
                    Open Federal Investigation <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STATE OUTLAYS TABLE */}
      {activeTab === "states" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              State-by-State Capital Allocation & Vendor Risk Distribution
            </span>
            <span className="text-xs text-slate-500 font-medium">Top Indian States Ranked by Total MPLADS Outlay</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                <th className="pb-3 font-semibold">State</th>
                <th className="pb-3 font-semibold">Works Monitored</th>
                <th className="pb-3 font-semibold">Allocated Outlay</th>
                <th className="pb-3 font-semibold">Federal Share</th>
                <th className="pb-3 font-semibold">Avg Anomaly Risk</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(forensics.top_states || []).map((st: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-bold text-slate-900">📍 {st.state}</td>
                  <td className="py-3 text-slate-700 font-mono">{st.works_count?.toLocaleString()}</td>
                  <td className="py-3 font-mono text-cyan-700 font-bold">
                    ₹{(st.total_capital / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-3 text-slate-700 font-mono">{st.share_pct}%</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      st.avg_risk >= 65 
                        ? "bg-rose-50 text-rose-700 border border-rose-200" 
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {st.avg_risk} / 100
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onSelectState(st.state)}
                      className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      Inspect <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
