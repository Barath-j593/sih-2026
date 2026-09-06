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
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { ConstituencyMap } from "../maps/ConstituencyMap";
import { FraudEvidenceVisualizer } from "../ui/FraudEvidenceVisualizer";
import { DistrictVendorCaptureRadar } from "./visualizers/DistrictVendorCaptureRadar";

interface DistrictMagistrateViewProps {
  data: DashboardData;
  pinsData: any[];
}

export function DistrictMagistrateView({ data, pinsData }: DistrictMagistrateViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, jurisdiction, extra_insights } = data;
  const topFlaggedWork = top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null;

  // Count structuring works specifically
  const structuringItem = fraud_breakdown.find(
    (f) => f.fraud_type === "structuring"
  );
  const structuringCount = structuringItem ? structuringItem.count : 0;
  const structuringAmount = structuringItem ? structuringItem.total_amount : 0;

  return (
    <div className="space-y-6">
      {/* Statutory DM Sanctioning Authority Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-red-900/60 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 p-5 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-300 border border-red-400/30">
                STATUTORY SANCTIONING AUTHORITY • {jurisdiction.toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-300">District Magistrate & Collectorate</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Pre-Sanction Anomaly Triage & Statutory Tender Verifier
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Detect duplicate proposals, cost escalations, and statutory ₹5 Lakh tender structuring <em>before</em> signing administrative and financial sanctions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cases"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition-all shadow-md hover:shadow-lg"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Open DM Triage Kanban</span>
            </Link>
          </div>
        </div>
      </div>

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
          title="₹5L Structuring Smurfing Alarms"
          value={structuringCount > 0 ? `${structuringCount} works` : "0 flagged"}
          subtitle={`₹${(structuringAmount / 100000).toFixed(1)}L near tender thresholds`}
          icon={AlertTriangle}
          variant={structuringCount > 0 ? "danger" : "success"}
          trend={{
            value: "Bypasses e-tender limits",
            isPositive: false,
          }}
        />
        <StatCard
          title="Pre-Sanction Triage Queue"
          value={`${summary.flagged_works_count} proposals`}
          subtitle={`${summary.critical_cases_count} critical audit flags`}
          icon={ShieldAlert}
          variant={summary.flagged_works_count > 0 ? "warning" : "success"}
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
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Pre-Sanction Stop-Work Alert ({topFlaggedWork.id})
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/cases"
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
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
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">District Anomaly Signatures</h3>
              <p className="text-xs text-slate-500">Distribution of flagged proposals in {jurisdiction}</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
              Block Level
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {fraud_breakdown.map((item) => (
              <div key={item.fraud_type} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="font-mono font-bold text-red-700">{item.count} proposals</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-600"
                    style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                  <span>₹{(item.total_amount / 100000).toFixed(1)}L affected</span>
                  <span>{item.percentage}% of district flags</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DM Pre-Sanction Triage Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pre-Sanction Approval Queue</h3>
            <p className="text-xs text-slate-500">Review and triage proposals before releasing funds</p>
          </div>
          <Link
            href="/cases"
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            Manage All Cases in Kanban <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 pl-3">Work ID</th>
                <th className="py-3">Proposal Title</th>
                <th className="py-3">Recommending MP</th>
                <th className="py-3">Nominated IDA</th>
                <th className="py-3 text-right">Estimate</th>
                <th className="py-3 text-center">Risk Score</th>
                <th className="py-3 pr-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top_flagged_works.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-3 font-mono font-bold text-slate-900">{w.id}</td>
                  <td className="py-3 font-medium text-slate-800 max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-slate-600 font-semibold">{w.mp_name}</td>
                  <td className="py-3 text-slate-500 max-w-[140px] truncate">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-3">
                    <Link
                      href={`/works/${w.id}`}
                      className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition-all inline-flex items-center gap-1"
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
      </div>
    </div>
  );
}
