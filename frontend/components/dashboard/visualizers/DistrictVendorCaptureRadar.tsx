"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, ShieldAlert, FileWarning, ArrowRight, 
  Building2, CheckCircle2, SlidersHorizontal, Scale, Gavel, FileCheck
} from "lucide-react";
import { RiskBadge } from "../../ui/RiskBadge";

interface DistrictVendorCaptureRadarProps {
  jurisdiction: string;
  extraInsights: any;
}

export function DistrictVendorCaptureRadar({ jurisdiction, extraInsights }: DistrictVendorCaptureRadarProps) {
  const [activeTab, setActiveTab] = useState<"structuring" | "capture">("structuring");

  const structuringClusters = extraInsights?.structuring_clusters || [];
  const topAgencies = extraInsights?.top_agencies || [];
  const hhi = extraInsights?.vendor_concentration_hhi || 10000;
  const hhiCategory = extraInsights?.hhi_category || "Highly Cartelized / Monopolized";

  return (
    <div className="rounded-2xl border border-red-900/40 bg-[#0c0507] p-5 shadow-2xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-950/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-400">
              <Gavel className="h-3 w-3 text-red-400" />
              DM STATUTORY PRE-SANCTION VERIFIER
            </span>
            <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
              District: {jurisdiction}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-bold text-white tracking-tight sm:text-lg">
            Statutory ₹5L E-Tender Structuring Radar & Single-Agency Capture Audit
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Enforces Rule 14.2 of MPLADS guidelines before public funds are released from the District Treasury.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            onClick={() => setActiveTab("structuring")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-all ${
              activeTab === "structuring" ? "bg-red-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileWarning className="h-3.5 w-3.5" />
            <span>₹5L Smurfing Radar</span>
          </button>
          <button
            onClick={() => setActiveTab("capture")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition-all ${
              activeTab === "capture" ? "bg-red-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Vendor Capture (HHI)</span>
          </button>
        </div>
      </div>

      {/* Forensic Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            Tender Structuring Smurfing Alarms
          </span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {structuringClusters.length} <span className="text-xs text-red-300">Proposals Flagged</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Clustered between ₹4,80,000 and ₹4,99,000
          </span>
        </div>

        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-red-400" />
            District Vendor Concentration (HHI)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-red-400 font-mono">{hhi.toFixed(0)}</span>
            <span className="text-[11px] text-slate-400">/ 10,000</span>
          </div>
          <span className="text-[11px] text-red-300 font-bold block mt-1">
            ⚠ {hhiCategory}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Statutory E-Tender Compliance Directive
            </span>
            <p className="text-[11px] text-slate-300 mt-1">
              Rule 14.2: Multiple works of similar nature within same ward must be clubbed into open e-tenders.
            </p>
          </div>
          <Link
            href="/cases"
            className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 mt-2"
          >
            Issue Formal Audit Notice <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* TAB 1: ₹5L SMURFING SCATTER RADAR */}
      {activeTab === "structuring" && (
        <div className="space-y-3 rounded-xl border border-red-900/30 bg-slate-950 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileWarning className="h-4 w-4 text-red-400" />
              Proposals Sitting Just Below ₹5,00,000 Statutory E-Tendering Threshold
            </span>
            <span className="rounded bg-red-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-red-400 border border-red-500/30">
              Smurfing Risk Zone
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                  <th className="p-2.5 font-bold">Work ID</th>
                  <th className="p-2.5 font-bold">Proposal Title</th>
                  <th className="p-2.5 font-bold">Sanction Amount</th>
                  <th className="p-2.5 font-bold">Threshold Proximity Delta</th>
                  <th className="p-2.5 font-bold">Executing Agency</th>
                  <th className="p-2.5 font-bold text-right">Pre-Sanction Directive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {structuringClusters.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-red-950/20 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-blue-400">
                      <Link href={`/works/${item.id}`} className="hover:underline">
                        {item.id}
                      </Link>
                    </td>
                    <td className="p-2.5 text-white font-medium truncate max-w-[200px]" title={item.work}>
                      {item.work}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-white">
                      ₹{item.amount.toLocaleString()}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-red-400">
                      -₹{item.delta.toLocaleString()} below ₹5L
                    </td>
                    <td className="p-2.5 text-slate-300 truncate max-w-[150px]" title={item.ida}>
                      {item.ida}
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                        Halt & Club into Open Tender
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR CAPTURE */}
      {activeTab === "capture" && (
        <div className="space-y-3 rounded-xl border border-red-900/30 bg-slate-950 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-amber-400" />
              Agency Market Share Breakdown in {jurisdiction}
            </span>
            <span className="text-[11px] text-slate-400">HHI Score: {hhi.toFixed(0)}</span>
          </div>

          <div className="space-y-2">
            {topAgencies.map((agency: any, idx: number) => (
              <div 
                key={idx}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white">{agency.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {agency.works_count} works assigned • ₹{(agency.amount / 10000000).toFixed(2)} Cr Outlay
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-red-400 font-mono">{agency.share_pct}% Capture</div>
                  <div className="text-[10px] text-slate-500">Sole Execution Monopoly</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
