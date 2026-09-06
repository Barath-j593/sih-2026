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
    <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E4529]">
              <Gavel className="h-3 w-3 text-[#6E4529]" />
              DM STATUTORY PRE-SANCTION VERIFIER
            </span>
            <span className="rounded bg-[#FAF7F2] border border-[#E5DFD3] px-2 py-0.5 text-[10px] font-mono text-stone-600">
              District: {jurisdiction}
            </span>
          </div>
          <h3 className="mt-1.5 text-base sm:text-lg font-editorial font-bold text-[#1C1917] tracking-tight">
            Statutory ₹5L E-Tender Structuring Radar & Single-Agency Capture Audit
          </h3>
          <p className="mt-0.5 text-xs text-stone-500 font-sans">
            Enforces Rule 14.2 of MPLADS guidelines before public funds are released from the District Treasury.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-1 text-xs">
          <button
            onClick={() => setActiveTab("structuring")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition-all ${
              activeTab === "structuring" ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <FileWarning className="h-3.5 w-3.5" />
            <span>₹5L Smurfing Radar</span>
          </button>
          <button
            onClick={() => setActiveTab("capture")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition-all ${
              activeTab === "capture" ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Vendor Capture (HHI)</span>
          </button>
        </div>
      </div>

      {/* Forensic Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 block flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            Tender Structuring Smurfing Alarms
          </span>
          <div className="text-2xl font-black text-[#1C1917] font-mono font-tabular mt-1">
            {structuringClusters.length} <span className="text-xs text-rose-700 font-sans font-normal">Proposals Flagged</span>
          </div>
          <span className="text-[11px] text-stone-500 font-mono mt-1 block">
            Clustered between ₹4,80,000 and ₹4,99,000
          </span>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 block flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-[#6E4529]" />
            District Vendor Concentration (HHI)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#6E4529] font-mono font-tabular">{hhi.toFixed(0)}</span>
            <span className="text-[11px] text-stone-500 font-mono">/ 10,000</span>
          </div>
          <span className="text-[11px] text-amber-800 font-medium block mt-1">
            ⚠ {hhiCategory}
          </span>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
              Statutory E-Tender Compliance Directive
            </span>
            <p className="text-[11px] text-stone-600 mt-1 font-sans">
              Rule 14.2: Multiple works of similar nature within same ward must be clubbed into open e-tenders.
            </p>
          </div>
          <Link
            href="/cases"
            className="text-[11px] font-mono font-bold text-[#6E4529] hover:text-[#4A2E1B] hover:underline flex items-center gap-1 mt-2"
          >
            Issue Formal Audit Notice <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* TAB 1: ₹5L SMURFING SCATTER RADAR */}
      {activeTab === "structuring" && (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/20 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <FileWarning className="h-4 w-4 text-rose-600" />
              Proposals Sitting Just Below ₹5,00,000 Statutory E-Tendering Threshold
            </span>
            <span className="rounded bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-800 border border-rose-200">
              Smurfing Risk Zone
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#D9D2C5] bg-[#F0ECE1] text-stone-600 font-mono text-[11px]">
                  <th className="py-2.5 pl-3 font-bold">Work ID</th>
                  <th className="py-2.5 font-bold">Proposal Title</th>
                  <th className="py-2.5 font-bold">Sanction Amount</th>
                  <th className="py-2.5 font-bold">Threshold Proximity Delta</th>
                  <th className="py-2.5 font-bold">Executing Agency</th>
                  <th className="py-2.5 pr-3 font-bold text-right">Pre-Sanction Directive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3]/60">
                {structuringClusters.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 pl-3 font-mono font-bold text-[#1C1917]">
                      <Link href={`/works/${item.id}`} className="hover:underline text-[#6E4529]">
                        {item.id}
                      </Link>
                    </td>
                    <td className="py-3 text-stone-800 font-medium truncate max-w-[200px]" title={item.work}>
                      {item.work}
                    </td>
                    <td className="py-3 font-mono font-bold text-[#1C1917] font-tabular">
                      ₹{item.amount.toLocaleString()}
                    </td>
                    <td className="py-3 font-mono font-bold text-rose-700 font-tabular">
                      -₹{item.delta.toLocaleString()} below ₹5L
                    </td>
                    <td className="py-3 text-stone-600 font-mono truncate max-w-[150px]" title={item.ida}>
                      {item.ida}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-800 border border-rose-200">
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
        <div className="space-y-3 rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-[#6E4529]" />
              Agency Market Share Breakdown in {jurisdiction}
            </span>
            <span className="text-[11px] text-stone-500">HHI Score: {hhi.toFixed(0)}</span>
          </div>

          <div className="space-y-2">
            {topAgencies.map((agency: any, idx: number) => (
              <div 
                key={idx}
                className="flex items-center justify-between rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] p-3 text-xs shadow-2xs"
              >
                <div>
                  <div className="font-bold text-[#1C1917]">{agency.name}</div>
                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                    {agency.works_count} works assigned • <span className="text-[#6E4529] font-bold font-tabular">₹{(agency.amount / 10000000).toFixed(2)} Cr Outlay</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#6E4529] font-mono font-tabular">{agency.share_pct}% Capture</div>
                  <div className="text-[10px] text-stone-500 font-sans">Sole Execution Monopoly</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
