"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Coins,
  Layers,
  Activity,
  FileSpreadsheet,
  Download,
  Building2,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { StateChoroplethMap } from "../maps/StateChoroplethMap";
import { NationalCartelFunnel } from "./visualizers/NationalCartelFunnel";
import { FraudEvidenceVisualizer } from "../ui/FraudEvidenceVisualizer";

interface MinistryViewProps {
  data: DashboardData;
  stateChoropleth: any[];
  graphData: { nodes: any[]; links: any[] };
}

export function MinistryView({ data, stateChoropleth, graphData }: MinistryViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, extra_insights } = data;
  const topFlaggedWork = top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null;

  return (
    <div className="space-y-6">
      {/* Parliamentary Oversight & PAC Dossier Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0c182b] p-5 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                MoSPI NATIONAL CENTRAL COMMAND
              </span>
              <span className="text-[11px] text-slate-300">New Delhi Headquarters</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              National Parliamentary Audit & Anomaly Intelligence
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Continuous multi-signal algorithmic surveillance across all 790+ parliamentary seats, 28 States, and 8 Union Territories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md hover:shadow-lg"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Generate PAC Audit Dossier</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 National Macro Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="National Sanctioned Works"
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${extra_insights.total_active_idas || 1,480} Registered IDAs`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="Total National Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle="Parliamentary allocations tracked"
          icon={Coins}
          variant="accent"
        />
        <StatCard
          title="National Outliers at Risk"
          value={summary.flagged_works_count.toLocaleString()}
          subtitle={`₹${(summary.amount_at_risk / 100000).toFixed(1)} Lakhs in flagged works`}
          icon={ShieldAlert}
          variant={summary.flagged_works_count > 0 ? "danger" : "success"}
          trend={{
            value: `${((summary.flagged_works_count / Math.max(1, summary.total_works)) * 100).toFixed(1)}% anomaly rate`,
            isPositive: false,
          }}
        />
        <StatCard
          title="National Risk Index"
          value={`${summary.avg_risk_score} / 100`}
          subtitle={`Compliance: ${extra_insights.compliance_rate || 94.2}% statutory adherence`}
          icon={Activity}
          variant={summary.avg_risk_score > 50 ? "warning" : "success"}
        />
      </div>

      {/* National GIS State Risk Choropleth Map */}
      <div className="space-y-2">
        <StateChoroplethMap data={stateChoropleth} />
      </div>

      {/* Highest Risk National Project Spotlight */}
      {topFlaggedWork && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Top National Anomaly Spotlight ({topFlaggedWork.id})
            </span>
            <Link
              href={`/works/${topFlaggedWork.id}`}
              className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
            >
              Inspect Full Investigation <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FraudEvidenceVisualizer work={topFlaggedWork} />
        </div>
      )}

      {/* Fraud Typologies Distribution + Network Monopoly Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Typologies */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">National Fraud Typologies Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution across 5 ML detection families</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
              {fraud_breakdown.length} Typologies
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {fraud_breakdown.map((item) => (
              <div key={item.fraud_type} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="font-mono font-bold text-amber-700">{item.count} flagged</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>₹{(item.total_amount / 100000).toFixed(1)} Lakhs affected</span>
                  <span>{item.percentage}% of flagged items</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bespoke MoSPI Visualizer: National Capital Flow & Cartel Funnel */}
        <div className="lg:col-span-6">
          <NationalCartelFunnel 
            summary={summary} 
            extraInsights={extra_insights} 
            graphData={graphData} 
          />
        </div>
      </div>

      {/* Top Flagged Works Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Top National Audit Outliers</h3>
            <p className="text-xs text-slate-500">Highest composite risk scores across all states</p>
          </div>
          <Link
            href="/works"
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            View All Works <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 pl-3">Work ID</th>
                <th className="py-3">Work Description</th>
                <th className="py-3">MP & Location</th>
                <th className="py-3">Agency (IDA)</th>
                <th className="py-3 text-right">Amount</th>
                <th className="py-3 text-center">Risk Score</th>
                <th className="py-3 pr-3">Flag Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top_flagged_works.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-3 font-mono font-bold text-slate-900">{w.id}</td>
                  <td className="py-3 font-medium text-slate-800 max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-slate-600">
                    <p className="font-semibold text-slate-900">{w.mp_name}</p>
                    <p className="text-[10px] text-slate-400">{w.constituency}, {w.state}</p>
                  </td>
                  <td className="py-3 text-slate-500 max-w-[140px] truncate">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-3 text-slate-600 max-w-sm truncate text-[11px]">
                    {w.risk_reasons[0] || "Statistical anomaly detected"}
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
