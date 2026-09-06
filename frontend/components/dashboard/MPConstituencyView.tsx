"use client";

import React from "react";
import Link from "next/link";
import {
  UserCheck,
  Coins,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Send,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { ConstituencyMap } from "../maps/ConstituencyMap";
import { FraudEvidenceVisualizer } from "../ui/FraudEvidenceVisualizer";
import { ConstituencyDeliveryPipeline } from "./visualizers/ConstituencyDeliveryPipeline";
import { MagicCard } from "../ui/MagicCard";

interface MPConstituencyViewProps {
  data: DashboardData;
  pinsData: any[];
}

export function MPConstituencyView({ data, pinsData }: MPConstituencyViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, extra_insights, jurisdiction } = data;
  const topFlaggedWork = top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null;

  // Stalled works count
  const stalledItem = fraud_breakdown.find(
    (f) => f.fraud_type === "ghost_project"
  );
  const stalledCount = stalledItem ? stalledItem.count : 0;
  const stalledAmount = stalledItem ? stalledItem.total_amount : 0;

  // Utilization calculation (% of ₹5 Crore annual allocation)
  const annualLimit = 50000000; // ₹5 Crore
  const utilizationPct = Math.min(100, Math.round((summary.total_allocation / annualLimit) * 100));

  return (
    <div className="space-y-6">
      {/* MP Parliamentary Accountability Banner */}
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
                PARLIAMENTARY CONSTITUENCY • {jurisdiction.toUpperCase()}
              </span>
              <span className="text-[11px] text-[#F5EBE1]/80 font-mono">Member of Parliament Dashboard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-white">
              Constituency Fund Utilization & Progress Cockpit
            </h2>
            <p className="text-xs text-[#F5EBE1]/90 max-w-2xl font-sans">
              Monitor recommended development works, track project execution timelines, prevent stalling by implementing agencies, and showcase transparent governance to your constituents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="border border-[#F5EBE1]/80 hover:bg-[#F5EBE1] hover:text-[#6E4529] text-[#F5EBE1] px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] shadow-sm flex items-center gap-2 group"
            >
              <FileCheck2 className="h-4 w-4 text-[#FDE68A] group-hover:text-[#6E4529]" />
              <span>Constituent Transparency Report ↗</span>
            </Link>
          </div>
        </div>
      </MagicCard>

      {/* 4 MP Parliamentary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Constituency Works Sanctioned"
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${pinsData.length || summary.total_works} village panchayats`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="₹5 Cr Annual Fund Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle={`${utilizationPct}% utilized of statutory allocation`}
          icon={Coins}
          variant="accent"
          trend={{
            value: `${utilizationPct}% utilized`,
            isPositive: utilizationPct >= 60,
          }}
        />
        <StatCard
          title="Stalled / Delayed Projects"
          value={stalledCount > 0 ? `${stalledCount} works` : "0 stalled"}
          subtitle={`₹${(stalledAmount / 100000).toFixed(1)}L pending execution`}
          icon={Clock}
          variant={stalledCount > 0 ? "warning" : "success"}
          trend={{
            value: ">180 days in pending status",
            isPositive: false,
          }}
        />
        <StatCard
          title="Constituency Governance Score"
          value={`${extra_insights.compliance_rate || 94.2}%`}
          subtitle="Audit compliance & public transparency"
          icon={ShieldCheck}
          variant="success"
        />
      </div>

      {/* Local Constituency Progress Map */}
      <div className="space-y-2">
        <ConstituencyMap
          pins={pinsData}
          title={`${jurisdiction} Constituency Physical Progress & Asset Audit`}
        />
        {/* Bespoke MP Visualizer: Recommendation-to-Asset Pipeline & Delay Sinks */}
        <ConstituencyDeliveryPipeline 
          jurisdiction={jurisdiction} 
          summary={summary} 
          extraInsights={extra_insights} 
        />
      </div>

      {/* Constituency Typologies & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Constituency Anomaly Signatures */}
        <MagicCard 
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="lg:col-span-12 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
        >
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <div>
              <h3 className="text-base font-editorial font-bold text-[#1C1917]">Constituency Risk Profile</h3>
              <p className="text-xs text-stone-500 font-sans">Anomaly signatures detected in recommended projects</p>
            </div>
            <span className="rounded bg-[#FAF7F2] px-2.5 py-0.5 text-xs font-mono font-bold text-[#6E4529] border border-[#D9D2C5]">
              Transparency
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {fraud_breakdown.map((item) => (
              <div key={item.fraud_type} className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1C1917]">{item.label}</span>
                  <span className="font-mono font-bold text-[#6E4529]">{item.count} projects</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#6E4529] to-rose-600"
                    style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-stone-500 font-mono">
                  <span>₹{(item.total_amount / 100000).toFixed(1)}L allocated</span>
                  <span>{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </MagicCard>
      </div>

      {/* Highest Priority Project Spotlight */}
      {topFlaggedWork && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold text-[#6E4529] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Constituency High-Priority Project Spotlight ({topFlaggedWork.id})
            </span>
            <Link
              href={`/works/${topFlaggedWork.id}`}
              className="text-xs font-mono font-bold text-[#6E4529] hover:text-[#3D2312] hover:underline flex items-center gap-1"
            >
              Review Execution Trace <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FraudEvidenceVisualizer work={topFlaggedWork} />
        </div>
      )}

      {/* MP Constituency Works Table */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={false}
        className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
          <div>
            <h3 className="text-base font-editorial font-bold text-[#1C1917]">Recommended Constituency Projects</h3>
            <p className="text-xs text-stone-500 font-sans">Track progress of physical assets for your constituents</p>
          </div>
          <Link
            href="/works"
            className="text-xs font-mono font-bold text-[#6E4529] hover:underline flex items-center gap-1"
          >
            View All Constituency Works <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9D2C5] text-stone-600 uppercase tracking-wider bg-[#F0ECE1] font-mono text-[11px]">
                <th className="py-2.5 pl-3">Work ID</th>
                <th className="py-2.5">Project Title</th>
                <th className="py-2.5">Block / Village</th>
                <th className="py-2.5">Executing Agency (IDA)</th>
                <th className="py-2.5 text-right">Outlay</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 pr-3">Integrity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60">
              {top_flagged_works.map((w) => (
                <tr key={w.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 pl-3 font-mono font-bold text-[#1C1917]">{w.id}</td>
                  <td className="py-3 font-medium text-stone-800 max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-stone-600">{w.constituency}</td>
                  <td className="py-3 text-stone-600 max-w-[140px] truncate font-mono">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-[#1C1917] font-tabular">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <span className="rounded px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FAF7F2] text-stone-700 border border-[#E5DFD3]">
                      {w.status || "Sanctioned"}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
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
