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
      if (selectedState?.state.toLowerCase() === stateName.toLowerCase()) {
        // Double click / re-click drills down
        if (onSelectState) onSelectState(stateName);
      } else {
        setSelectedState(matched);
      }
    } else {
      if (onSelectState) onSelectState(stateName);
    }
  };

  return (
    <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E4529]">
              NATIONAL INTERACTIVE MAP
            </span>
            <h3 className="text-base sm:text-lg font-editorial font-bold text-[#1C1917]">All India State Risk & Anomaly Map</h3>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-sans">
            Click on any state in the interactive map or from the leaderboard to drill down into district anomalies.
          </p>
        </div>

        {/* Selected State indicator */}
        {selectedState && (
          <div className="flex items-center gap-2 rounded bg-[#F0ECE1] border border-[#D9D2C5] px-3 py-1.5 text-xs font-mono font-bold text-[#6E4529] shadow-2xs">
            <MapPin className="h-4 w-4 text-[#6E4529]" />
            <span>Active State: {selectedState.state}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Interactive Multi-Scale GIS Map */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
          <IndiaSvgMap
            data={data}
            selectedState={selectedState?.state}
            onSelectState={handleStateClick}
          />
        </div>

        {/* Right Col: Selected State Inspector & Leaderboard */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Active State Detail Card */}
          {selectedState ? (
            <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
                <div>
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-mono font-bold">
                    State Audit Overview
                  </span>
                  <h4 className="text-xl font-editorial font-bold text-[#1C1917] mt-0.5">{selectedState.state}</h4>
                </div>
                <div className={`rounded px-2.5 py-1 text-xs font-mono font-bold border ${getBadgeBg(selectedState.avg_risk_score)}`}>
                  {selectedState.risk_level} Risk ({selectedState.avg_risk_score.toFixed(1)}/100)
                </div>
              </div>

              {/* 4 Micro Stat Badges */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] p-3 shadow-2xs">
                  <span className="text-stone-500 block text-[11px] font-mono">Total Sanctioned Works</span>
                  <span className="text-base font-bold text-[#1C1917] font-mono font-tabular mt-0.5 block">
                    {selectedState.total_works.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] p-3 shadow-2xs">
                  <span className="text-stone-500 block text-[11px] font-mono">Total Public Outlay</span>
                  <span className="text-base font-bold text-[#6E4529] font-mono font-tabular mt-0.5 block">
                    ₹{(selectedState.total_allocation / 10000000).toFixed(2)} Cr
                  </span>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 shadow-2xs">
                  <span className="text-rose-700 block text-[11px] font-mono">Flagged High/Critical</span>
                  <span className="text-base font-bold text-rose-700 font-mono font-tabular mt-0.5 block">
                    {selectedState.flagged_works_count} works
                  </span>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 shadow-2xs">
                  <span className="text-amber-800 block text-[11px] font-mono">Public Funds at Risk</span>
                  <span className="text-base font-bold text-amber-800 font-mono font-tabular mt-0.5 block">
                    ₹{(selectedState.amount_at_risk / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
              </div>

              {/* Quick Directive / Action */}
              <div className="flex items-center justify-between rounded-lg bg-[#FFFDF9] border border-[#E5DFD3] p-3 text-xs shadow-2xs">
                <span className="text-stone-700 font-sans">
                  Ready to audit districts in <strong className="text-[#1C1917]">{selectedState.state}</strong>?
                </span>
                <button
                  onClick={() => onSelectState && onSelectState(selectedState.state)}
                  className="rounded bg-[#6E4529] px-3.5 py-1.5 font-mono text-xs font-bold text-white hover:bg-[#5A361F] transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>Drill Down</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-500 font-sans">Click a state on the map to inspect metrics</p>
          )}

          {/* State Risk Leaderboard List */}
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-2">
              <span className="text-xs font-mono font-bold text-[#1C1917] uppercase tracking-wider">
                State Risk Leaderboard (Top Outliers)
              </span>
              <span className="text-[11px] text-stone-500 font-mono">Sorted by Anomaly Density</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {data.slice(0, 8).map((st) => {
                const isSelected = selectedState?.state === st.state;
                return (
                  <div
                    key={st.state}
                    onClick={() => handleStateClick(st.state)}
                    className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#6E4529] bg-[#FFFDF9] shadow-2xs ring-1 ring-[#6E4529]"
                        : "border-[#E5DFD3] bg-[#FFFDF9] hover:bg-[#F5EBE1]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1C1917]">{st.state}</span>
                      <span className="text-[11px] text-stone-500 font-mono">({st.total_works} works)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#6E4529] font-tabular">
                        ₹{(st.total_allocation / 10000000).toFixed(1)}Cr
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold border ${getBadgeBg(st.avg_risk_score)}`}>
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
