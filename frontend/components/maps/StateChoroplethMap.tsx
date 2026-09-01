"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingUp, MapPin } from "lucide-react";

interface StateChoroplethProps {
  data: Array<{
    state: string;
    total_works: number;
    total_allocation: number;
    avg_risk_score: number;
    flagged_works_count: number;
    amount_at_risk: number;
    risk_level: string;
    lat: number;
    lng: number;
  }>;
  onSelectState?: (stateName: string) => void;
}

export function StateChoroplethMap({ data, onSelectState }: StateChoroplethProps) {
  const [selectedState, setSelectedState] = useState<any>(data[0] || null);

  const getRiskColor = (score: number) => {
    if (score >= 65) return "bg-red-500 border-red-400 text-red-200";
    if (score >= 50) return "bg-orange-500 border-orange-400 text-orange-200";
    if (score >= 35) return "bg-amber-500 border-amber-400 text-amber-200";
    return "bg-emerald-500 border-emerald-400 text-emerald-200";
  };

  const getBadgeBg = (score: number) => {
    if (score >= 65) return "bg-red-950/80 text-red-400 border-red-500/40";
    if (score >= 50) return "bg-orange-950/80 text-orange-400 border-orange-500/40";
    if (score >= 35) return "bg-amber-950/80 text-amber-400 border-amber-500/40";
    return "bg-emerald-950/80 text-emerald-400 border-emerald-500/40";
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-950 px-2 py-0.5 text-[11px] font-bold text-blue-400 border border-blue-500/30">
              NATIONAL MAP
            </span>
            <h3 className="text-base font-bold text-white">India State-Wise MPLADS Risk Distribution</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Click any state card or coordinate cluster to inspect state-level anomaly metrics.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Low (&lt;35)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-400">Medium (35–50)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-400">High (50–65)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-400 font-medium">Critical (&gt;65)</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Grid of State Tiles */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
          {data.map((st) => {
            const isSelected = selectedState?.state === st.state;
            return (
              <button
                key={st.state}
                onClick={() => {
                  setSelectedState(st);
                  if (onSelectState) onSelectState(st.state);
                }}
                className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-saffron-500 bg-saffron-950/30 shadow-lg shadow-saffron-500/10 ring-1 ring-saffron-500/50"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">{st.state}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold border ${getBadgeBg(st.avg_risk_score)}`}>
                    {st.avg_risk_score}
                  </span>
                </div>
                <div className="mt-3 w-full text-[11px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1.5">
                  <span>{st.total_works} works</span>
                  <span className="font-semibold text-slate-300">₹{(st.total_allocation / 10000000).toFixed(1)}Cr</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected State Inspection Panel */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4.5 flex flex-col justify-between">
          {selectedState ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-saffron-400 font-semibold">
                    <MapPin className="h-3.5 w-3.5" /> State Jurisdiction
                  </div>
                  <h4 className="text-lg font-bold text-white mt-0.5">{selectedState.state}</h4>
                </div>
                <div className={`rounded-xl px-3 py-1 text-xs font-bold border ${getBadgeBg(selectedState.avg_risk_score)}`}>
                  {selectedState.risk_level} Risk
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between rounded-lg bg-slate-900/60 p-2.5">
                  <span className="text-slate-400">Total Public Works:</span>
                  <span className="font-bold text-white">{selectedState.total_works.toLocaleString()}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-900/60 p-2.5">
                  <span className="text-slate-400">Total Sanctioned Funds:</span>
                  <span className="font-bold text-white">₹{selectedState.total_allocation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-900/60 p-2.5">
                  <span className="text-slate-400">Flagged Projects (&gt;60 Risk):</span>
                  <span className="font-bold text-red-400">{selectedState.flagged_works_count}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-900/60 p-2.5">
                  <span className="text-slate-400">Expenditure at Risk:</span>
                  <span className="font-bold text-amber-400">₹{selectedState.amount_at_risk.toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-300">
                <p className="font-semibold text-saffron-400 mb-1">State Nodal Directive:</p>
                <p>
                  High density of peer-cost outliers and contractor clustering detected in civil works across state implementing agencies.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select a state to inspect metrics</p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Geo Resolution: State Level</span>
            <span className="text-emerald-400 font-semibold">Live Scored</span>
          </div>
        </div>
      </div>
    </div>
  );
}
