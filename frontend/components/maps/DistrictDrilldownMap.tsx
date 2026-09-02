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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
              STATE NODAL VIEW
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {selectedStateName} — District & Constituency Risk Audit
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Compare risk concentrations and vendor capture across districts in {selectedStateName}.
          </p>
        </div>

        {/* Search filter */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-36"
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
                    ? "border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500/30"
                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{d.district}</span>
                    <RiskBadge score={d.avg_risk_score} level={d.risk_level} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {d.total_works} works • ₹{(d.total_allocation / 100000).toFixed(1)}L Total Funds
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-red-700">
                    {d.flagged_works_count} Flagged
                  </span>
                  <p className="text-[10px] text-slate-400">₹{(d.amount_at_risk / 100000).toFixed(1)}L at risk</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected District Details */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          {activeDistrict ? (
            <>
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  District Audit Dossier
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-0.5">{activeDistrict.district}</h4>
                <p className="text-xs text-slate-500">State of {selectedStateName}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
                  <span className="text-slate-600 font-medium">Composite Risk Score</span>
                  <RiskBadge score={activeDistrict.avg_risk_score} level={activeDistrict.risk_level} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Projects</span>
                    <span className="font-bold font-mono text-sm text-slate-900 mt-0.5 block">{activeDistrict.total_works}</span>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Allocation</span>
                    <span className="font-bold font-mono text-sm text-slate-900 mt-0.5 block">
                      ₹{(activeDistrict.total_allocation / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 border border-red-200 shadow-2xs">
                    <span className="text-red-700 block text-[10px] font-bold uppercase">Flagged Works</span>
                    <span className="font-bold font-mono text-sm text-red-700 mt-0.5 block">
                      {activeDistrict.flagged_works_count}
                    </span>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 shadow-2xs">
                    <span className="text-amber-800 block text-[10px] font-bold uppercase">Amount at Risk</span>
                    <span className="font-bold font-mono text-sm text-amber-800 mt-0.5 block">
                      ₹{(activeDistrict.amount_at_risk / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={`/works?search=${encodeURIComponent(activeDistrict.district)}`}
                    className="block w-full text-center rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-2xs"
                  >
                    Inspect Works in {activeDistrict.district} →
                  </a>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">Select a district to view audit data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
