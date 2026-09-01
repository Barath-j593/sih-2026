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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-950 px-2 py-0.5 text-[11px] font-bold text-purple-400 border border-purple-500/30">
              LOCAL PIN MAP
            </span>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Work-level location pins colored by ML anomaly score across villages and wards. ({pins?.length || 0} locations mapped)
          </p>
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          {["all", "critical", "high", "medium", "low"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                filterLevel === lvl
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {pins && pins.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Interactive List of Pins */}
          <div className="lg:col-span-7 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredPins.length > 0 ? (
              filteredPins.map((p) => {
                const isSelected = selectedPin?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPin(p)}
                    className={`flex items-start justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-saffron-500 bg-saffron-950/20 shadow-md ring-1 ring-saffron-500/40"
                        : "border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/70"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                        <RiskBadge score={p.risk_score} level={p.risk_level} size="sm" />
                        <span className="text-[11px] text-slate-500">({p.village || "Panchayat Area"})</span>
                      </div>
                      <p className="text-xs font-medium text-white line-clamp-2">{p.work}</p>
                      <p className="text-[11px] text-slate-400">
                        MP: {p.mp_name} • Agency: {p.ida}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white">₹{p.allocation_amount.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{p.status}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No pins match the &apos;{filterLevel}&apos; risk filter.
              </div>
            )}
          </div>

          {/* Detailed Work Card for Selected Pin */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950/80 p-4.5 flex flex-col justify-between">
            {selectedPin ? (
              <div className="space-y-3.5">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-saffron-400">{selectedPin.id}</span>
                    <RiskBadge score={selectedPin.risk_score} level={selectedPin.risk_level} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">{selectedPin.work}</h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between rounded-lg bg-slate-900/60 p-2">
                    <span className="text-slate-400">Allocation:</span>
                    <span className="font-bold text-white">₹{selectedPin.allocation_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-slate-900/60 p-2">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-medium text-slate-200">{selectedPin.village || "Panchayat Area"}, {selectedPin.constituency}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-slate-900/60 p-2">
                    <span className="text-slate-400">Executing Agency:</span>
                    <span className="font-medium text-slate-200">{selectedPin.ida}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-slate-900/60 p-2">
                    <span className="text-slate-400">Current Status:</span>
                    <span className="font-semibold text-emerald-400">{selectedPin.status}</span>
                  </div>
                </div>

                {selectedPin.reasons && selectedPin.reasons.length > 0 && (
                  <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 text-xs">
                    <p className="font-semibold text-red-400 mb-1">Explainable Anomaly Traces:</p>
                    <ul className="space-y-1 text-slate-300">
                      {selectedPin.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-red-400">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Select a work pin to inspect
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Location: Village/Ward Pin</span>
              <span className="text-purple-400 font-semibold">GPS Tagged</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400">
          <Layers className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p>No localized GPS pins mapped for this jurisdiction yet.</p>
        </div>
      )}
    </div>
  );
}
