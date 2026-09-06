"use client";

import React, { useState } from "react";
import { Building2, AlertTriangle, ShieldCheck, MapPin, Search } from "lucide-react";
import { RiskBadge } from "../ui/RiskBadge";

interface DistrictDrilldownProps {
  districts?: Array<{
    district: string;
    state: string;
    total_works: number;
    total_allocation: number;
    avg_risk_score: number;
    flagged_works_count: number;
    amount_at_risk: number;
    risk_level: string;
    lat?: number;
    lng?: number;
  }>;
  data?: Array<{
    district: string;
    state: string;
    total_works: number;
    total_allocation: number;
    avg_risk_score: number;
    flagged_works_count: number;
    amount_at_risk: number;
    risk_level: string;
    lat?: number;
    lng?: number;
  }>;
  selectedStateName?: string;
  stateName?: string;
  onSelectDistrict?: (distName: string) => void;
}

export function DistrictDrilldownMap({
  districts,
  data,
  selectedStateName,
  stateName,
  onSelectDistrict,
}: DistrictDrilldownProps) {
  const districtList = districts || data || [];
  const stateLabel = stateName || selectedStateName || "State";
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDistrict, setActiveDistrict] = useState<any>(districtList[0] || null);

  const filtered = districtList.filter((d) =>
    (d.district || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E4529]">
              STATE NODAL VIEW
            </span>
            <h3 className="text-base sm:text-lg font-editorial font-bold text-[#1C1917]">
              {stateLabel} — District & Constituency Risk Audit
            </h3>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-sans">
            Compare risk concentrations and vendor capture across districts in {stateLabel}.
          </p>
        </div>

        {/* Search filter */}
        <div className="flex items-center gap-2 rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#1C1917] shadow-2xs">
          <Search className="h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Filter district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-[#1C1917] placeholder-stone-400 focus:outline-none w-36 font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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
                className={`flex items-center justify-between rounded-lg border p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? "border-[#6E4529] bg-[#FFFDF9] shadow-2xs ring-1 ring-[#6E4529]"
                    : "border-[#E5DFD3] bg-[#FAF7F2] hover:border-[#D9D2C5] hover:bg-[#FFFDF9]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1C1917]">{d.district}</span>
                    <RiskBadge score={d.avg_risk_score} level={d.risk_level} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-stone-500 font-mono">
                    {d.total_works} works • ₹{(d.total_allocation / 100000).toFixed(1)}L Total Funds
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-700 font-mono">
                    {d.flagged_works_count} Flagged
                  </span>
                  <p className="text-[10px] text-stone-500 font-mono">₹{(d.amount_at_risk / 100000).toFixed(1)}L at risk</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected District Details */}
        <div className="lg:col-span-5 rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-5 space-y-4 shadow-2xs">
          {activeDistrict ? (
            <>
              <div className="border-b border-[#E5DFD3] pb-3">
                <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                  District Audit Dossier
                </span>
                <h4 className="text-xl font-editorial font-bold text-[#1C1917] mt-0.5">{activeDistrict.district}</h4>
                <p className="text-xs text-stone-500 font-sans">State of {stateLabel}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-[#FFFDF9] p-3 border border-[#E5DFD3] shadow-2xs">
                  <span className="text-stone-700 font-mono font-medium">Composite Risk Score</span>
                  <RiskBadge score={activeDistrict.avg_risk_score} level={activeDistrict.risk_level} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-[#FFFDF9] p-3 border border-[#E5DFD3] shadow-2xs">
                    <span className="text-stone-500 block text-[10px] font-mono font-bold uppercase">Total Projects</span>
                    <span className="font-bold font-mono font-tabular text-sm text-[#1C1917] mt-0.5 block">{activeDistrict.total_works}</span>
                  </div>
                  <div className="rounded-lg bg-[#FFFDF9] p-3 border border-[#E5DFD3] shadow-2xs">
                    <span className="text-stone-500 block text-[10px] font-mono font-bold uppercase">Total Allocation</span>
                    <span className="font-bold font-mono font-tabular text-sm text-[#6E4529] mt-0.5 block">
                      ₹{(activeDistrict.total_allocation / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-3 border border-rose-200 shadow-2xs">
                    <span className="text-rose-700 block text-[10px] font-mono font-bold uppercase">Flagged Works</span>
                    <span className="font-bold font-mono font-tabular text-sm text-rose-700 mt-0.5 block">
                      {activeDistrict.flagged_works_count}
                    </span>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 shadow-2xs">
                    <span className="text-amber-800 block text-[10px] font-mono font-bold uppercase">Amount at Risk</span>
                    <span className="font-bold font-mono font-tabular text-sm text-amber-800 mt-0.5 block">
                      ₹{(activeDistrict.amount_at_risk / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={`/works?search=${encodeURIComponent(activeDistrict.district)}`}
                    className="block w-full text-center rounded bg-[#6E4529] py-2.5 text-xs font-mono font-bold text-white hover:bg-[#5A361F] transition-all shadow-2xs"
                  >
                    Inspect Works in {activeDistrict.district} →
                  </a>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-stone-500 text-center py-12 font-sans">Select a district to view audit data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
