"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  Coins,
  Layers,
  AlertTriangle,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardList,
  Filter,
  Zap,
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { ConstituencyMap } from "../maps/ConstituencyMap";
import { FraudEvidenceVisualizer } from "../ui/FraudEvidenceVisualizer";
import { DistrictVendorCaptureRadar } from "./visualizers/DistrictVendorCaptureRadar";
import { MagicCard } from "../ui/MagicCard";
import { formatTypologyLabel } from "../../lib/typologies";
import { formatDistrictName } from "../../lib/districts";

interface DistrictMagistrateViewProps {
  data: DashboardData;
  pinsData: any[];
}

export function DistrictMagistrateView({ data, pinsData }: DistrictMagistrateViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, jurisdiction, extra_insights } = data;
  const topFlaggedWork = top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null;

  // Count structuring works from extra_insights clusters or fraud_breakdown
  const structuringClusters = extra_insights?.structuring_clusters || [];
  const structuringItem = fraud_breakdown.find(
    (f) => f.fraud_type?.toLowerCase().includes("structuring")
  );
  const structuringCount = structuringClusters.length > 0
    ? structuringClusters.length
    : (structuringItem ? structuringItem.count : 0);
  const structuringAmount = structuringClusters.length > 0
    ? structuringClusters.reduce((sum: number, w: any) => sum + (w.amount || 0), 0)
    : (structuringItem ? structuringItem.total_amount : 0);

  return (
    <div className="space-y-6">
      {/* Statutory DM Sanctioning Authority Banner */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={true}
        className="relative overflow-hidden rounded-xl border border-[#4E2F1A] bg-[#6E4529] p-5 text-[#F5EBE1] shadow-[0_4px_20px_rgba(40,20,10,0.12)]"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#3D2312] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#FDE68A] border border-[#FDE68A]/30">
                STATUTORY SANCTIONING AUTHORITY • {formatDistrictName(jurisdiction).toUpperCase()}
              </span>
              <span className="text-[11px] text-[#F5EBE1]/80 font-mono">District Magistrate & Collectorate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-white">
              Pre-Sanction Anomaly Triage & Statutory Tender Verifier
            </h2>
            <p className="text-xs text-[#F5EBE1]/90 max-w-2xl font-sans">
              Detect duplicate proposals, cost escalations, and statutory ₹5 Lakh tender structuring <em>before</em> signing administrative and financial sanctions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/proposals"
              className="bg-[#FDE68A] hover:bg-[#FCD34D] text-[#3D2312] px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] shadow-sm flex items-center gap-1.5"
            >
              <Zap className="h-4 w-4 text-[#3D2312]" />
              <span>Feed Plan & Score ↗</span>
            </Link>
            <Link
              href="/cases"
              className="border border-[#F5EBE1]/80 hover:bg-[#F5EBE1] hover:text-[#6E4529] text-[#F5EBE1] px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] shadow-sm flex items-center gap-2 group"
            >
              <ClipboardList className="h-4 w-4 text-[#FDE68A] group-hover:text-[#6E4529]" />
              <span>Open DM Triage Kanban ↗</span>
            </Link>
          </div>
        </div>
      </MagicCard>

      {/* 4 DM Statutory KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Works Submitted for Sanction"
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${jurisdiction} rural & urban blocks`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="Sanctioned Capital Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle="Total district public expenditure"
          icon={Coins}
          variant="accent"
        />
        <StatCard
          title="Pre-Sanction Flagged Works"
          value={summary.flagged_works_count > 0 ? `${summary.flagged_works_count} flagged` : "0 flagged"}
          subtitle={`₹${(summary.amount_at_risk / 100000).toFixed(1)} Lakhs in flagged works`}
          icon={ShieldAlert}
          variant={summary.flagged_works_count > 0 ? "danger" : "success"}
          trend={{
            value: summary.flagged_works_count > 0 
              ? `${((summary.flagged_works_count / Math.max(1, summary.total_works)) * 100).toFixed(0)}% anomaly rate` 
              : "100% compliant",
            isPositive: summary.flagged_works_count === 0,
          }}
        />
        <StatCard
          title="₹5L Structuring Smurfing Alarms"
          value={structuringCount > 0 ? `${structuringCount} works` : "0 detected"}
          subtitle={
            structuringCount > 0 
              ? `₹${(structuringAmount / 100000).toFixed(1)}L near tender thresholds` 
              : `${summary.critical_cases_count} critical audit flags in queue`
          }
          icon={AlertTriangle}
          variant={structuringCount > 0 ? "danger" : (summary.critical_cases_count > 0 ? "warning" : "success")}
          trend={{
            value: structuringCount > 0 
              ? "Bypasses e-tender limits" 
              : (summary.critical_cases_count > 0 ? `${summary.critical_cases_count} critical proposals` : "Rule 14.2 compliant"),
            isPositive: structuringCount === 0 && summary.critical_cases_count === 0,
          }}
        />
      </div>

      {/* Local Village GPS Marker Pins Map */}
      <div className="space-y-2">
        <ConstituencyMap
          pins={pinsData}
          title={`${jurisdiction} Local Village & Ward Audit GPS Coordinates`}
        />
      </div>

      {/* High-Risk Pre-Sanction Proposal Spotlight */}
      {topFlaggedWork && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold text-[#6E4529] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Pre-Sanction Stop-Work Alert ({topFlaggedWork.id})
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/cases"
                className="text-xs font-mono font-bold text-[#6E4529] hover:text-[#3D2312] hover:underline flex items-center gap-1"
              >
                Send to Field Vigilance Team <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <FraudEvidenceVisualizer work={topFlaggedWork} />
        </div>
      )}

      {/* Bespoke DM Visualizer: Statutory ₹5L Smurfing Radar & Vendor Capture */}
      <DistrictVendorCaptureRadar 
        jurisdiction={jurisdiction} 
        extraInsights={extra_insights} 
      />

      {/* Pre-Sanction Directives & Typologies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* District Anomaly Breakdown */}
        <MagicCard 
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="lg:col-span-6 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
        >
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <div>
              <h3 className="text-base font-editorial font-bold text-[#1C1917]">District Anomaly Signatures</h3>
              <p className="text-xs text-stone-500 font-sans">Distribution of flagged proposals in {jurisdiction}</p>
            </div>
            <span className="rounded bg-[#FAF7F2] px-2.5 py-0.5 text-xs font-mono font-bold text-[#6E4529] border border-[#D9D2C5]">
              Block Level
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {fraud_breakdown.map((item) => (
              <div key={item.fraud_type} className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1C1917]">{formatTypologyLabel(item.label || item.fraud_type)}</span>
                  <span className="font-mono font-bold text-[#6E4529]">{item.count} proposals</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#6E4529] to-rose-600"
                    style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-stone-500 font-mono">
                  <span>₹{(item.total_amount / 100000).toFixed(1)}L affected</span>
                  <span>{item.percentage}% of district flags</span>
                </div>
              </div>
            ))}
          </div>
        </MagicCard>
      </div>

      {/* DM Pre-Sanction Triage Table */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={false}
        className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
          <div>
            <h3 className="text-base font-editorial font-bold text-[#1C1917]">Pre-Sanction Approval Queue</h3>
            <p className="text-xs text-stone-500 font-sans">Review and triage proposals before releasing funds</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/proposals"
              className="rounded-md bg-[#6E4529] px-3 py-1.5 text-xs font-mono font-bold text-white hover:bg-[#5A361F] transition-all inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Zap className="h-3.5 w-3.5 text-[#FDE68A]" />
              <span>+ Feed & Score New Proposal</span>
            </Link>
            <Link
              href="/cases"
              className="text-xs font-mono font-bold text-[#6E4529] hover:underline flex items-center gap-1"
            >
              Manage All Cases in Kanban <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9D2C5] text-stone-600 uppercase tracking-wider bg-[#F0ECE1] font-mono text-[11px]">
                <th className="py-2.5 pl-3">Work ID</th>
                <th className="py-2.5">Proposal Title</th>
                <th className="py-2.5">Recommending MP</th>
                <th className="py-2.5">Nominated IDA</th>
                <th className="py-2.5 text-right">Estimate</th>
                <th className="py-2.5 text-center">Risk Score</th>
                <th className="py-2.5 pr-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60">
              {top_flagged_works.map((w) => (
                <tr key={w.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 pl-3 font-mono font-bold text-[#1C1917]">{w.id}</td>
                  <td className="py-3 font-medium text-stone-800 max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-stone-600 font-semibold">{w.mp_name}</td>
                  <td className="py-3 text-stone-600 max-w-[140px] truncate font-mono">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-[#1C1917] font-tabular">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-3">
                    <Link
                      href={`/works/${w.id}`}
                      className="rounded-md bg-[#6E4529] px-2.5 py-1 text-[11px] font-mono font-bold text-white hover:bg-[#5A361F] transition-all inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Triage</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MagicCard>
    </div>
  );
}
