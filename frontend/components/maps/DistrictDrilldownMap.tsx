"use client";

import React, { useState } from "react";
import { Building2, AlertTriangle, ShieldCheck, MapPin, Search } from "lucide-react";
import { RiskBadge } from "../ui/RiskBadge";

interface DistrictDrilldownProps {
  districts: Array<{
    district: string;
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
  selectedStateName?: string;
  onSelectDistrict?: (distName: string) => void;
}

export function DistrictDrilldownMap({
  districts,
  selectedStateName = "Bihar",
  onSelectDistrict,
}: DistrictDrilldownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDistrict, setActiveDistrict] = useState<any>(districts[0] || null);

  const filtered = districts.filter((d) =>
    d.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-950 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/30">
              STATE NODAL VIEW
            </span>
            <h3 className="text-base font-bold text-white">
              {selectedStateName} — District & Constituency Risk Audit
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Compare risk concentrations and vendor capture across districts in {selectedStateName}.
          </p>
        </div>

        {/* Search filter */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-36"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* District list */}
        <div className="lg:col-span-7 space-y-2 max-h-[440px] overflow-y-auto pr-1">
          {filtered.map((d) => {
            const isSelected = activeDistrict?.district === d.district;
            return (
              <div
                key={d.district}
                onClick={() => {
                  setActiveDistrict(d);
                  if (onSelectDistrict) onSelectDistrict(d.district);
                }}
                className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? "border-amber-500 bg-amber-950/20 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40"
                    : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{d.district}</span>
                    <RiskBadge score={d.avg_risk_score} level={d.risk_level} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {d.total_works} works • ₹{(d.total_allocation / 100000).toFixed(1)}L Total Funds
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-red-400">
                    {d.flagged_works_count} Flagged
                  </span>
                  <p className="text-[10px] text-slate-500">₹{(d.amount_at_risk / 100000).toFixed(1)}L at risk</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected district summary card */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950/80 p-4.5 flex flex-col justify-between">
          {activeDistrict ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                  District Audit Scope
                </span>
                <h4 className="text-lg font-bold text-white mt-1">{activeDistrict.district}</h4>
                <p className="text-xs text-slate-400">{activeDistrict.state} State Jurisdiction</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between rounded-lg bg-slate-900/70 p-2.5">
                  <span className="text-slate-400">Average District Risk:</span>
                  <span className="font-bold text-white">{activeDistrict.avg_risk_score}/100</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-900/70 p-2.5">
                  <span className="text-slate-400">High Risk Sanctions:</span>
                  <span className="font-bold text-red-400">{activeDistrict.flagged_works_count} works</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-900/70 p-2.5">
                  <span className="text-slate-400">Total Sanctioned Value:</span>
                  <span className="font-bold text-white">₹{activeDistrict.total_allocation.toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-xs text-amber-200/90">
                <p className="font-semibold text-amber-400">State Nodal Observation:</p>
                <p className="mt-1 leading-relaxed">
                  District Collectorate has ongoing works pending administrative clearance beyond statutory 75-day turnaround. Field audit advised.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select a district to view details</p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Level: District / IDA</span>
            <span className="text-amber-400 font-semibold">Priority Triage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
