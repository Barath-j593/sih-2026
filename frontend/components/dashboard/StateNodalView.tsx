"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  ShieldAlert,
  Coins,
  Layers,
  Activity,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Send,
  FileCheck2,
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { DistrictDrilldownMap } from "../maps/DistrictDrilldownMap";
import { FraudEvidenceVisualizer } from "../ui/FraudEvidenceVisualizer";
import { StateVendorConcentrationMatrix } from "./visualizers/StateVendorConcentrationMatrix";

interface StateNodalViewProps {
  data: DashboardData;
  districtData: any[];
}

export function StateNodalView({ data, districtData }: StateNodalViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, extra_insights, jurisdiction } = data;
  const topFlaggedWork = top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null;
  const highestRiskDistrict = districtData.length > 0 ? districtData[0] : null;

  return (
    <div className="space-y-6">
      {/* State Nodal Vigilance Directive Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-900 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300 border border-blue-400/30">
                STATE NODAL OVERSIGHT • {jurisdiction.toUpperCase()}
              </span>
              <span className="text-[11px] text-blue-200">Department of Planning & Development</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {jurisdiction} Statewide Implementation & Equity Monitor
            </h2>
            <p className="text-xs text-blue-100 max-w-2xl">
              Surveillance of inter-district fund allocation parity, cross-constituency contractor syndicates, and state-level audit compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-400 transition-all shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4" />
              <span>Export State Compliance CSV</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 State KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`Total Works in ${jurisdiction}`}
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${districtData.length} monitored districts`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="State Fund Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle="Sanctioned across state MPs"
          icon={Coins}
          variant="accent"
        />
        <StatCard
          title="State Funds at Risk"
          value={`₹${(summary.amount_at_risk / 100000).toFixed(1)} Lakhs`}
          subtitle={`${summary.flagged_works_count} high-risk projects flagged`}
          icon={ShieldAlert}
          variant={summary.flagged_works_count > 0 ? "danger" : "success"}
          trend={{
            value: `${((summary.flagged_works_count / Math.max(1, summary.total_works)) * 100).toFixed(1)}% of state works`,
            isPositive: false,
          }}
        />
        <StatCard
          title="Highest Anomaly District"
          value={highestRiskDistrict ? highestRiskDistrict.district : "N/A"}
          subtitle={
            highestRiskDistrict
              ? `Avg Risk Score: ${highestRiskDistrict.avg_risk_score.toFixed(1)}/100`
              : "No district anomalies"
          }
          icon={MapPin}
          variant="warning"
        />
      </div>

      {/* District Drill-down Map of the State */}
      {districtData.length > 0 && (
        <div className="space-y-2">
          <DistrictDrilldownMap districts={districtData} selectedStateName={jurisdiction} />
        </div>
      )}

      {/* Bespoke SNA Visualizer: Statewide Vendor Concentration & District Equity */}
      <StateVendorConcentrationMatrix 
        jurisdiction={jurisdiction} 
        extraInsights={extra_insights} 
        districtData={districtData} 
      />

      {/* State Typologies & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* State Anomaly Breakdown */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{jurisdiction} Anomaly Typologies</h3>
              <p className="text-xs text-slate-500">Breakdown of ML detections across state districts</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
              State Profile
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {fraud_breakdown.map((item) => (
              <div key={item.fraud_type} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="font-mono font-bold text-amber-700">{item.count} flagged</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-500"
                    style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                  <span>₹{(item.total_amount / 100000).toFixed(1)}L Affected</span>
                  <span>{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Highest Risk State Project Spotlight */}
      {topFlaggedWork && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              State Inspection Priority ({topFlaggedWork.id})
            </span>
            <Link
              href={`/works/${topFlaggedWork.id}`}
              className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
            >
              Issue State Inquiry Notice <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FraudEvidenceVisualizer work={topFlaggedWork} />
        </div>
      )}

      {/* State Priority Inspection Works Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{jurisdiction} Priority Inspection Queue</h3>
            <p className="text-xs text-slate-500">Flagged projects requiring state nodal inspection notices</p>
          </div>
          <Link
            href="/works"
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            View All State Works <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 pl-3">Work ID</th>
                <th className="py-3">Description</th>
                <th className="py-3">District & MP</th>
                <th className="py-3">Agency (IDA)</th>
                <th className="py-3 text-right">Amount</th>
                <th className="py-3 text-center">Risk Score</th>
                <th className="py-3 pr-3">Anomaly Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top_flagged_works.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-3 font-mono font-bold text-slate-900">{w.id}</td>
                  <td className="py-3 font-medium text-slate-800 max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-slate-600">
                    <p className="font-semibold text-slate-900">{w.constituency}</p>
                    <p className="text-[10px] text-slate-400">{w.mp_name}</p>
                  </td>
                  <td className="py-3 text-slate-500 max-w-[140px] truncate">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-3 text-slate-600 max-w-sm truncate text-[11px]">
                    {w.risk_reasons[0] || "High risk score"}
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
