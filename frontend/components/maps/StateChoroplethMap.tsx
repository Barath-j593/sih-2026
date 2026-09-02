"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingUp, MapPin, ChevronRight, Layers } from "lucide-react";
import { IndiaSvgMap, StateData } from "./IndiaSvgMap";

interface StateChoroplethProps {
  data: StateData[];
  onSelectState?: (stateName: string) => void;
}

export function StateChoroplethMap({ data, onSelectState }: StateChoroplethProps) {
  const [selectedState, setSelectedState] = useState<StateData>(data[0] || null);

  const getBadgeBg = (score: number) => {
    if (score >= 65) return "bg-red-100 text-red-900 border-red-200";
    if (score >= 50) return "bg-orange-100 text-orange-900 border-orange-200";
    if (score >= 35) return "bg-amber-100 text-amber-900 border-amber-200";
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  };

  const handleStateClick = (stateName: string) => {
    const matched = data.find((d) => d.state.toLowerCase() === stateName.toLowerCase());
    if (matched) {
      setSelectedState(matched);
    }
    if (onSelectState) {
      onSelectState(stateName);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-200">
              NATIONAL INTERACTIVE MAP
            </span>
            <h3 className="text-base font-bold text-slate-900">All India State Risk & Anomaly Map</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Click on any state in the interactive map or from the leaderboard to drill down into district anomalies.
          </p>
        </div>

        {/* Selected State indicator */}
        {selectedState && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs">
            <MapPin className="h-4 w-4 text-amber-600" />
            <span>Active State: {selectedState.state}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Interactive SVG India Map */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <IndiaSvgMap
            stateData={data}
            selectedState={selectedState?.state}
            onSelectState={handleStateClick}
          />
        </div>

        {/* Right Col: Selected State Inspector & Leaderboard */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active State Detail Card */}
          {selectedState ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                    State Audit Overview
                  </span>
                  <h4 className="text-xl font-black text-slate-900 mt-0.5">{selectedState.state}</h4>
                </div>
                <div className={`rounded-xl px-3 py-1 text-xs font-bold border ${getBadgeBg(selectedState.avg_risk_score)}`}>
                  {selectedState.risk_level} Risk ({selectedState.avg_risk_score.toFixed(1)}/100)
                </div>
              </div>

              {/* 4 Micro Stat Badges */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <span className="text-slate-500 block text-[11px] font-medium">Total Sanctioned Works</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {selectedState.total_works.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <span className="text-slate-500 block text-[11px] font-medium">Total Public Outlay</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    ₹{(selectedState.total_allocation / 10000000).toFixed(2)} Cr
                  </span>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 shadow-2xs">
                  <span className="text-red-700 block text-[11px] font-medium">Flagged High/Critical Risk</span>
                  <span className="text-base font-bold text-red-700 font-mono mt-0.5 block">
                    {selectedState.flagged_works_count} works
                  </span>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-2xs">
                  <span className="text-amber-800 block text-[11px] font-medium">Public Funds at Risk</span>
                  <span className="text-base font-bold text-amber-800 font-mono mt-0.5 block">
                    ₹{(selectedState.amount_at_risk / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
              </div>

              {/* Quick Directive / Action */}
              <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-3 text-xs shadow-2xs">
                <span className="text-slate-700 font-medium">
                  Ready to audit districts in <strong className="text-slate-900">{selectedState.state}</strong>?
                </span>
                <button
                  onClick={() => onSelectState && onSelectState(selectedState.state)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>Drill Down</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Click a state on the map to inspect metrics</p>
          )}

          {/* State Risk Leaderboard List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                State Risk Leaderboard (Top Outliers)
              </span>
              <span className="text-[11px] text-slate-500">Sorted by Anomaly Density</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {data.slice(0, 8).map((st) => {
                const isSelected = selectedState?.state === st.state;
                return (
                  <div
                    key={st.state}
                    onClick={() => handleStateClick(st.state)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{st.state}</span>
                      <span className="text-[11px] text-slate-500">({st.total_works} works)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-700">
                        ₹{(st.total_allocation / 10000000).toFixed(1)}Cr
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${getBadgeBg(st.avg_risk_score)}`}>
                        {st.avg_risk_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
