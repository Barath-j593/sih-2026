"use client";

import React, { useState, useEffect } from "react";
import { MapPin, AlertCircle, CheckCircle, ArrowUpRight, Search, Layers } from "lucide-react";
import { RiskBadge } from "../ui/RiskBadge";

interface ConstituencyPin {
  id: string;
  work: string;
  mp_name: string;
  ida: string;
  state: string;
  constituency: string;
  village: string;
  allocation_amount: number;
  status: string;
  risk_score: number;
  risk_level: string;
  predicted_fraud_type?: string;
  reasons: string[];
  lat: number;
  lng: number;
}

interface ConstituencyMapProps {
  pins: ConstituencyPin[];
  title?: string;
}

export function ConstituencyMap({ pins, title = "Constituency Works Geo-Verification" }: ConstituencyMapProps) {
  const [selectedPin, setSelectedPin] = useState<ConstituencyPin | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("all");

  // Keep selected pin in sync when pins prop changes
  useEffect(() => {
    if (pins && pins.length > 0) {
      setSelectedPin(pins[0]);
    } else {
      setSelectedPin(null);
    }
  }, [pins]);

  const filteredPins = (pins || []).filter((p) => {
    if (filterLevel === "all") return true;
    return p.risk_level.toLowerCase() === filterLevel.toLowerCase();
  });

  return (
    <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E4529]">
              LOCAL PIN MAP
            </span>
            <h3 className="text-base sm:text-lg font-editorial font-bold text-[#1C1917]">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-sans">
            Work-level location pins colored by ML anomaly score across villages and wards. ({pins?.length || 0} locations mapped)
          </p>
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-1 text-xs">
          {["all", "critical", "high", "medium", "low"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`rounded px-2.5 py-1 text-xs font-mono font-bold capitalize transition-all ${
                filterLevel === lvl
                  ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {pins && pins.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Interactive List of Pins */}
          <div className="lg:col-span-7 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredPins.length > 0 ? (
              filteredPins.map((p) => {
                const isSelected = selectedPin?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPin(p)}
                    className={`flex items-start justify-between rounded-lg border p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#6E4529] bg-[#FFFDF9] shadow-2xs ring-1 ring-[#6E4529]"
                        : "border-[#E5DFD3] bg-[#FAF7F2] hover:border-[#D9D2C5] hover:bg-[#FFFDF9]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#1C1917]">{p.id}</span>
                        <RiskBadge score={p.risk_score} level={p.risk_level} size="sm" />
                        <span className="text-[11px] text-stone-500 font-mono">({p.village || "Panchayat Area"})</span>
                      </div>
                      <p className="text-xs font-medium text-stone-800 line-clamp-2">{p.work}</p>
                      <p className="text-[11px] text-stone-500 font-mono">
                        MP: {p.mp_name} • Agency: {p.ida}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-[#1C1917] font-tabular">₹{p.allocation_amount.toLocaleString()}</p>
                      <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{p.status}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-stone-500 font-sans">
                No pins match the &apos;{filterLevel}&apos; risk filter.
              </div>
            )}
          </div>

          {/* Detailed Work Card for Selected Pin */}
          <div className="lg:col-span-5 rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-4.5 flex flex-col justify-between shadow-2xs">
            {selectedPin ? (
              <div className="space-y-3.5">
                <div className="border-b border-[#E5DFD3] pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#6E4529]">{selectedPin.id}</span>
                    <RiskBadge score={selectedPin.risk_score} level={selectedPin.risk_level} size="sm" />
                  </div>
                  <h4 className="text-sm font-editorial font-bold text-[#1C1917] mt-1.5 leading-snug">{selectedPin.work}</h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between rounded-lg bg-[#FFFDF9] p-2.5 border border-[#E5DFD3] shadow-2xs">
                    <span className="text-stone-500 font-mono">Allocation:</span>
                    <span className="font-mono font-bold text-[#6E4529] font-tabular">₹{selectedPin.allocation_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#FFFDF9] p-2.5 border border-[#E5DFD3] shadow-2xs">
                    <span className="text-stone-500 font-mono">Location:</span>
                    <span className="font-medium text-stone-800">{selectedPin.village || "Panchayat Area"}, {selectedPin.constituency}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#FFFDF9] p-2.5 border border-[#E5DFD3] shadow-2xs">
                    <span className="text-stone-500 font-mono">Executing Agency:</span>
                    <span className="font-mono text-stone-800">{selectedPin.ida}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#FFFDF9] p-2.5 border border-[#E5DFD3] shadow-2xs">
                    <span className="text-stone-500 font-mono">Current Status:</span>
                    <span className="font-mono font-bold text-emerald-800">{selectedPin.status}</span>
                  </div>
                </div>

                {selectedPin.reasons && selectedPin.reasons.length > 0 && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-xs">
                    <p className="font-mono font-bold text-rose-800 mb-1">Explainable Anomaly Traces:</p>
                    <ul className="space-y-1 text-stone-700 font-sans">
                      {selectedPin.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-stone-500 font-sans">
                Select a work pin to inspect
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#E5DFD3] text-[11px] text-stone-500 font-mono flex items-center justify-between">
              <span>Location: Village/Ward Pin</span>
              <span className="text-[#6E4529] font-bold">GPS Tagged</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-stone-500">
          <Layers className="mx-auto h-8 w-8 text-stone-400 mb-2" />
          <p>No localized GPS pins mapped for this jurisdiction yet.</p>
        </div>
      )}
    </div>
  );
}
