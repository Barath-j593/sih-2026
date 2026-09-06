"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, ShieldAlert, Users, Network, TrendingUp, 
  ArrowRight, AlertTriangle, Layers, MapPin, Search, 
  Info, ExternalLink, Activity, Filter, CheckCircle2, ChevronRight, BarChart3, PieChart
} from "lucide-react";

interface SNAStateVendorConcentrationProps {
  telemetry: any;
  stateName: string;
  availableStates?: string[];
  onSelectState?: (state: string) => void;
}

export function SNAStateVendorConcentration({
  telemetry,
  stateName,
  availableStates = [],
  onSelectState
}: SNAStateVendorConcentrationProps) {
  const [activeTab, setActiveTab] = useState<"treemap" | "districts" | "dominant">("treemap");
  const [selectedIda, setSelectedIda] = useState<any | null>(null);

  const forensics = telemetry?.state_forensics || {
    state_name: stateName || "Bihar",
    state_hhi: 799.8,
    state_hhi_category: "Competitive Spread with Dominant Hubs",
    state_cr3: 39.1,
    state_cr4: 47.1,
    total_state_capital: 0,
    ida_treemap: [],
    inter_district_matrix: []
  };

  const idas = forensics.ida_treemap || [];
  const districts = forensics.inter_district_matrix || [];
  const dominantIdas = idas.filter((i: any) => i.is_dominant);
  const totalStateCap = forensics.total_state_capital || idas.reduce((acc: number, item: any) => acc + (item.capital || 0), 0) || (telemetry?.total_capital || 1.0);

  return (
    <div className="space-y-5">
      {/* Sleek Sub-Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
            <PieChart className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {forensics.state_name} Vendor Concentration & Inter-District Matrix
            </h3>
            <span className="text-[11px] text-slate-500">
              Monitoring procurement equity, agency dominance, and inter-district dispersion across {districts.length} constituencies.
            </span>
          </div>
        </div>

        {/* Clean Pill Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
          <button
            onClick={() => setActiveTab("treemap")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "treemap" 
                ? "bg-white text-amber-900 shadow-xs border border-amber-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Vendor Treemap ({idas.length})
          </button>
          <button
            onClick={() => setActiveTab("dominant")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "dominant" 
                ? "bg-white text-rose-900 shadow-xs border border-rose-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Dominant IDAs ({dominantIdas.length})
          </button>
          <button
            onClick={() => setActiveTab("districts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "districts" 
                ? "bg-white text-blue-900 shadow-xs border border-blue-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            District Equity ({districts.length})
          </button>
        </div>
      </div>

      {/* Streamlined State Barometer HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              State Vendor HHI
            </span>
            <span className="text-[10px] font-mono text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-bold">
              {forensics.state_name}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 font-mono">{forensics.state_hhi}</span>
            <span className="text-[11px] text-slate-500 font-mono">/ 10,000</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block truncate">
            {forensics.state_hhi_category}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Top-3 Capture Ratio (CR3)
            </span>
            <span className="text-[10px] font-mono text-rose-700 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 font-bold">
              Top 3
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600 font-mono">{forensics.state_cr3}%</span>
            <span className="text-[11px] text-slate-500 font-medium">of state capital</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate font-medium">
            Concentrated in top 3 agencies
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Top-4 Ratio (CR4)
            </span>
            <span className="text-[10px] font-mono text-blue-700 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-bold">
              Top 4
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600 font-mono">{forensics.state_cr4}%</span>
            <span className="text-[11px] text-slate-500 font-medium">near half outlay</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate font-medium">
            Cumulative Top-4 concentration
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              State Capital Monitored
            </span>
            <span className="text-[10px] font-mono text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-bold">
              Total
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ₹{(totalStateCap / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate font-medium">
            Across {districts.length} constituencies
          </span>
        </div>
      </div>

      {/* TAB 1: VENDOR TREEMAP VIEW */}
      {activeTab === "treemap" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3.5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-amber-600" />
                Statewide Executing IDA Concentration Treemap ({forensics.state_name})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tile size corresponds to capital share; prominent borders indicate high-capture entities (&gt;10% state share).
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">Click any IDA tile to inspect breakdown</span>
          </div>

          {/* Dynamic Proportional Grid Treemap */}
          {idas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {idas.map((ida: any, idx: number) => {
                const isSelected = selectedIda?.name === ida.name;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedIda(ida)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      ida.is_dominant
                        ? "border-amber-300 bg-amber-50/50 shadow-xs hover:border-amber-400"
                        : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:shadow-xs"
                    } ${isSelected ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/80 scale-[1.01]" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-500 font-bold">#{idx + 1} IDA</span>
                        {ida.is_dominant && (
                          <span className="rounded bg-amber-200/80 text-amber-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border border-amber-300">
                            Dominant Capture
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1.5 text-xs font-bold text-slate-900 line-clamp-2 leading-snug" title={ida.name}>
                        {ida.name}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">State Share:</span>
                        <strong className="text-amber-700 font-mono text-sm font-black">{ida.share_pct}%</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Total Outlay:</span>
                        <strong className="text-slate-900 font-mono font-bold">₹{(ida.capital / 10000000).toFixed(2)} Cr</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{ida.works_count} sanctioned works</span>
                        <span className="flex items-center gap-1">
                          Risk: <strong className={ida.avg_risk >= 65 ? "text-rose-600 font-bold" : "text-amber-700 font-bold"}>{ida.avg_risk}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No executing IDAs found for {forensics.state_name}.
            </div>
          )}

          {/* Selected IDA Inspection Drawer */}
          {selectedIda && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-900">Inspecting: <strong>{selectedIda.name}</strong></span>
                <p className="text-amber-900 text-[11px]">
                  Controls <strong>₹{(selectedIda.capital / 10000000).toFixed(2)} Cr ({selectedIda.share_pct}% of state fund)</strong>. Anomaly score: <strong>{selectedIda.avg_risk}/100</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/reports"
                  className="rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white hover:bg-amber-500 transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  Issue State Audit Notice <ArrowRight className="h-3 w-3" />
                </Link>
                <button
                  onClick={() => setSelectedIda(null)}
                  className="rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOMINANT IDAS DOSSIER */}
      {activeTab === "dominant" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                CAG State Audit Flag: Unbalanced Executive Agency Capital Concentration
              </h4>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                When individual IDAs capture &gt;10% of total state capital, procurement oversight risks become concentrated. In {forensics.state_name}, 
                {dominantIdas.length > 0 
                  ? ` ${dominantIdas.length} executing agencies hold dominant shares exceeding 10% of total state outlay.`
                  : " capital is broadly disbursed without any single IDA exceeding the 10% threshold."}
              </p>
            </div>
          </div>

          {dominantIdas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dominantIdas.map((ida: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-amber-200 bg-white p-5 space-y-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider font-mono border border-amber-200">
                        HIGH-CAPTURE AGENCY #{idx + 1}
                      </span>
                      <h4 className="mt-1.5 text-sm font-bold text-slate-900 truncate" title={ida.name}>{ida.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-amber-600 font-mono">{ida.share_pct}%</span>
                      <span className="text-[10px] text-slate-500 block font-medium">of State Total</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Outlay</span>
                      <strong className="text-slate-900 font-mono font-bold">₹{(ida.capital / 10000000).toFixed(2)} Cr</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Works</span>
                      <strong className="text-slate-900 font-mono font-bold">{ida.works_count}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Avg Risk</span>
                      <strong className={ida.avg_risk >= 65 ? "text-rose-600 font-mono font-bold" : "text-amber-700 font-mono font-bold"}>
                        {ida.avg_risk}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Recommended State Directive: Implement mandatory dual-officer technical audit on all tender estimates above ₹50 Lakhs.
                  </p>

                  <Link
                    href="/cases"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500 transition-colors shadow-xs"
                  >
                    Create State Audit Case <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 shadow-xs">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <p className="font-bold text-slate-900 text-sm">No Single-Agency Monopolies Exceeding 10% in {forensics.state_name}</p>
              <p className="mt-1">All executing IDAs in this state maintain distributed allocations within balanced statutory limits.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTER-DISTRICT EQUITY DISPARITY */}
      {activeTab === "districts" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Inter-District Capital Allocation & Risk Disparity ({forensics.state_name})
            </span>
            <span className="text-xs text-slate-500 font-medium">Distribution across constituencies in {forensics.state_name}</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                <th className="pb-3 font-semibold">Constituency / District</th>
                <th className="pb-3 font-semibold">Works Monitored</th>
                <th className="pb-3 font-semibold">Allocated Outlay</th>
                <th className="pb-3 font-semibold">State Fund Share</th>
                <th className="pb-3 font-semibold">Risk Score</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {districts.map((d: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-bold text-slate-900">📍 {d.district}</td>
                  <td className="py-3 text-slate-700 font-mono">{d.works}</td>
                  <td className="py-3 font-mono text-amber-700 font-bold">
                    ₹{(d.capital / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-3 text-slate-700 font-mono">{d.concentration_share}%</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      d.risk >= 65 
                        ? "bg-rose-50 text-rose-700 border border-rose-200" 
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {d.risk} / 100
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {d.concentration_share >= 10.0 ? "High Concentration" : "Normal Spread"}
                    </span>
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
