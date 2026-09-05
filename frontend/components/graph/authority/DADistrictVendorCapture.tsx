"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, ShieldAlert, Users, Network, TrendingUp, 
  ArrowRight, AlertTriangle, Layers, MapPin, Search, 
  Info, ExternalLink, Activity, Filter, CheckCircle2, ChevronRight, BarChart3, AlertOctagon, Target
} from "lucide-react";

interface DADistrictVendorCaptureProps {
  telemetry: any;
  districtName: string;
  availableDistricts?: string[];
  onSelectDistrict?: (district: string) => void;
}

export function DADistrictVendorCapture({
  telemetry,
  districtName,
  availableDistricts = [],
  onSelectDistrict
}: DADistrictVendorCaptureProps) {
  const [activeTab, setActiveTab] = useState<"smurfing" | "monopoly" | "blocks">("smurfing");
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);

  const forensics = telemetry?.district_forensics || {
    district_name: districtName || "DARBHANGA",
    district_hhi: 10000.0,
    district_hhi_category: "Absolute Single-Agency Monopoly (100% Capture)",
    total_district_capital: 0,
    total_district_works: 0,
    sole_agency: {
      name: "District Authority IDA",
      capital: 0,
      works_count: 0,
      share_pct: 100.0,
      avg_risk: 72.3
    },
    all_agencies: [],
    block_distribution: [],
    structuring_clusters: []
  };

  const soleAgency = forensics.sole_agency;
  const blocks = forensics.block_distribution || [];
  const structWorks = forensics.structuring_clusters || [];
  const totalDistCap = forensics.total_district_capital || soleAgency.capital || (telemetry?.total_capital || 1.0);

  return (
    <div className="space-y-5">
      {/* Sleek Sub-Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {forensics.district_name} Pre-Sanction Structuring Radar & Monopoly
            </h3>
            <span className="text-[11px] text-slate-500">
              Statutory verification for District Magistrates under GFR Rule 155 and CVC tender guidelines.
            </span>
          </div>
        </div>

        {/* Clean Pill Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
          <button
            onClick={() => setActiveTab("smurfing")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "smurfing" 
                ? "bg-white text-rose-900 shadow-xs border border-rose-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            ₹5L Smurfing Radar ({structWorks.length})
          </button>
          <button
            onClick={() => setActiveTab("monopoly")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "monopoly" 
                ? "bg-white text-amber-900 shadow-xs border border-amber-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Agency Capture ({forensics.all_agencies?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab("blocks")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "blocks" 
                ? "bg-white text-blue-900 shadow-xs border border-blue-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Block Disparity ({blocks.length})
          </button>
        </div>
      </div>

      {/* Streamlined District Barometer HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              District Vendor HHI
            </span>
            <span className="text-[10px] font-mono text-rose-700 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 font-bold">
              {forensics.district_name}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600 font-mono">
              {forensics.district_hhi?.toFixed(0) || "10,000"}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">/ 10,000</span>
          </div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1 block truncate">
            {forensics.district_hhi_category}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Sole Agency Capture
            </span>
            <span className="text-[10px] font-mono text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-bold">
              Dominant
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 font-mono">{soleAgency.share_pct}%</span>
            <span className="text-[11px] text-slate-500 font-medium">of district fund</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate font-medium">
            ₹{(soleAgency.capital / 10000000).toFixed(2)} Cr to {soleAgency.name}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ₹5L Smurfing Contracts
            </span>
            <span className="text-[10px] font-mono text-rose-700 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 font-bold">
              Critical
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600 font-mono">
              {structWorks.length}
            </span>
            <span className="text-xs text-rose-600 font-bold">Split Proposals</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate font-medium">
            Clustered in ₹4.5L - ₹5.0L band
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total District Outlay
            </span>
            <span className="text-[10px] font-mono text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-bold">
              Total
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ₹{(totalDistCap / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate font-medium">
            Across {blocks.length} monitored blocks
          </span>
        </div>
      </div>

      {/* TAB 1: STATUTORY ₹5L SMURFING SCATTER RADAR */}
      {activeTab === "smurfing" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 flex items-start gap-3">
            <AlertOctagon className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                Statutory Vigilance Warning: Artificial Tender Slicing (GFR Rule 155 Bypass)
              </h4>
              <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                General Financial Rules strictly prohibit dividing contracts to avoid open national e-tenders. In {forensics.district_name}, 
                SETU AI has isolated {structWorks.length} proposals artificially pegged in the ₹4.5L–₹5.0L band, sitting just below the statutory ₹5 Lakh e-tender ceiling.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-rose-600" />
                  Pre-Sanction Structuring Radar ({forensics.district_name}: Works in ₹4.5L – ₹5.0L Band)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any proposal to review exact statutory delta and halt pre-sanction release.
                </p>
              </div>
              <span className="rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200 font-mono">
                Mandatory DM Review
              </span>
            </div>

            {structWorks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {structWorks.map((work: any, idx: number) => {
                  const isSelected = selectedCluster?.id === work.id;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCluster(work)}
                      className={`rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected 
                          ? "border-rose-400 bg-rose-50/60 shadow-md ring-2 ring-rose-400 scale-[1.01]" 
                          : "border-slate-200 bg-slate-50/50 hover:border-rose-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-rose-700">{work.id}</span>
                          <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-mono font-bold text-rose-800 border border-rose-200">
                            -₹{work.delta?.toLocaleString()} Below ₹5L
                          </span>
                        </div>
                        <h4 className="mt-2 text-xs font-bold text-slate-900 line-clamp-2" title={work.work}>
                          {work.work}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Amount:</span>
                          <strong className="text-slate-900 font-mono">₹{work.amount?.toLocaleString()}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Risk Score:</span>
                          <strong className="text-rose-600 font-mono font-bold">{work.risk_score} / 100</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-1">
                          IDA: {work.ida}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-bold text-slate-900 text-sm">No Artificial Structuring Clusters Detected in {forensics.district_name}</p>
                <p className="mt-1">All monitored works in this jurisdiction maintain clean allocation spacing outside the statutory avoidance band.</p>
              </div>
            )}

            {/* Selected Work Inspection Callout */}
            {selectedCluster && (
              <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900">Inspecting Structuring Candidate: <strong>{selectedCluster.id}</strong></span>
                  <p className="text-rose-900 text-[11px]">
                    Pegged at <strong>₹{selectedCluster.amount?.toLocaleString()}</strong> with an exact delta of <strong>-₹{selectedCluster.delta?.toLocaleString()}</strong> below the e-tender threshold.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/works/${selectedCluster.id}`}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-500 transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    Open Forensic Audit <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => setSelectedCluster(null)}
                    className="rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AGENCY CAPTURE CLUSTERMAP */}
      {activeTab === "monopoly" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3.5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Executive Implementing Agency Allocation Clustermap ({forensics.district_name})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evaluates single-agency lock-in vs multi-agency execution across the district.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600">
              HHI: {forensics.district_hhi?.toFixed(1) || "10,000.0"} ({forensics.district_hhi_category})
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: District Treasury */}
            <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <span className="rounded bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                Sanctioning Authority
              </span>
              <h4 className="text-base font-black text-slate-900">DM / Collectorate {forensics.district_name}</h4>
              <p className="text-xs text-slate-500">Total Sanctioned Outlay</p>
              <div className="text-xl font-black text-slate-900 font-mono">
                ₹{(totalDistCap / 10000000).toFixed(2)} Cr
              </div>
            </div>

            {/* Middle: Pipe Vector */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center space-y-2 py-4">
              <div className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <ShieldAlert className="h-4 w-4 text-rose-600" /> 
                {soleAgency.share_pct >= 95 ? "100% Monopolized Conduit" : `${soleAgency.share_pct}% Top Capture`}
              </div>
              <div className="h-2.5 w-full bg-rose-500 rounded-full shadow-xs" />
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {forensics.all_agencies?.length || 1} Active IDAs Monitored
              </span>
            </div>

            {/* Right: Dominant Agency */}
            <div className="lg:col-span-4 p-6 rounded-2xl border border-rose-300 bg-rose-50/50 text-center space-y-3 shadow-xs">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-rose-600" />
              </div>
              <span className="rounded bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                Primary Recipient Agency
              </span>
              <h4 className="text-sm font-black text-slate-900 truncate" title={soleAgency.name}>{soleAgency.name}</h4>
              <p className="text-xs text-slate-500">{soleAgency.works_count} Works Captured</p>
              <div className="text-xl font-black text-rose-600 font-mono">
                {soleAgency.share_pct}% (₹{(soleAgency.capital / 10000000).toFixed(2)} Cr)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BLOCK DISPARITY TABLE */}
      {activeTab === "blocks" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Block Allocation Disparity & Local Vendor Concentrations ({forensics.district_name})
            </span>
            <span className="text-xs text-slate-500 font-medium">Distribution across administrative blocks</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                <th className="pb-3 font-semibold">Block Name</th>
                <th className="pb-3 font-semibold">Works Count</th>
                <th className="pb-3 font-semibold">Total Allocation</th>
                <th className="pb-3 font-semibold">District Share</th>
                <th className="pb-3 font-semibold">Avg Risk</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blocks.map((blk: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-bold text-slate-900">📍 {blk.block}</td>
                  <td className="py-3 text-slate-700 font-mono">{blk.works_count}</td>
                  <td className="py-3 font-mono text-amber-700 font-bold">
                    ₹{(blk.capital / 100000).toFixed(1)} Lakhs
                  </td>
                  <td className="py-3 text-slate-700 font-mono">{blk.share_pct}%</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      blk.avg_risk >= 70 
                        ? "bg-rose-50 text-rose-700 border border-rose-200" 
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {blk.avg_risk} / 100
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {blk.works_count >= 15 ? "Heavy Allocation Hub" : "Standard Allocation"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
