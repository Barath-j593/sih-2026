"use client";

import React, { useEffect, useState } from "react";
import { useRole } from "../../context/RoleContext";
import { fetchDashboard, fetchStateChoropleth, fetchDistrictDrilldown, fetchConstituencyPins, fetchNetworkGraph } from "../../lib/api";
import { DashboardData } from "../../lib/types";
import { StatCard } from "../../components/ui/StatCard";
import { RiskBadge } from "../../components/ui/RiskBadge";
import { StateChoroplethMap } from "../../components/maps/StateChoroplethMap";
import { DistrictDrilldownMap } from "../../components/maps/DistrictDrilldownMap";
import { ConstituencyMap } from "../../components/maps/ConstituencyMap";
import { MPIDANetworkGraph } from "../../components/graph/MPIDANetworkGraph";
import { FraudEvidenceVisualizer } from "../../components/ui/FraudEvidenceVisualizer";
import { ComingSoonModal } from "../../components/ui/ComingSoonModal";

import {
  ShieldAlert,
  Coins,
  Building2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Sparkles,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  Info,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default function OperationalDashboardPage() {
  const { role, jurisdiction, roleConfig } = useRole();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map & Graph states
  const [stateChoropleth, setStateChoropleth] = useState<any[]>([]);
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [pinsData, setPinsData] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  // Modal for roadmap
  const [modalFeature, setModalFeature] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const dash = await fetchDashboard(role, jurisdiction);
        setData(dash);

        // Fetch complementary geospatial and network layers based on active role
        if (role === "ministry") {
          const [st, gr] = await Promise.all([
            fetchStateChoropleth(),
            fetchNetworkGraph(100, 0),
          ]);
          setStateChoropleth(st);
          setGraphData(gr);
        } else if (role === "state") {
          const dist = await fetchDistrictDrilldown(jurisdiction);
          setDistrictData(dist);
        } else if (role === "district") {
          const pins = await fetchConstituencyPins(jurisdiction, undefined, 100);
          setPinsData(pins);
        } else if (role === "mp") {
          const pins = await fetchConstituencyPins(undefined, jurisdiction, 100);
          setPinsData(pins);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [role, jurisdiction]);

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-md" />
        <div className="text-center">
          <p className="text-base font-bold text-slate-900">Loading SANCHAY Operational Command Center</p>
          <p className="text-xs text-slate-500">Scoping real-time audit telemetry for {jurisdiction} ({role.toUpperCase()})...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 animate-bounce" />
        <h3 className="mt-3 text-lg font-bold text-slate-900">Error Connecting to SANCHAY Intelligence Server</h3>
        <p className="mt-1 text-xs text-red-700">{error || "Could not retrieve live risk telemetry."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-all shadow"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { summary, risk_distribution, fraud_breakdown, top_flagged_works, recent_alerts } = data;
  const topFlaggedWork = top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Navigation back to Public Portal */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Public Transparency Portal</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-400">
          SANCHAY OPERATIONAL TELEMETRY COCKPIT
        </span>
      </div>

      {/* Page Header with Scope Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-900 text-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
              {roleConfig.role.toUpperCase()} LEVEL
            </span>
            <span className="text-xs text-slate-500 font-mono">Active Jurisdiction: {data.jurisdiction}</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
            {role === "ministry" && "National MPLADS Fund Integrity & Risk Command"}
            {role === "state" && `${data.jurisdiction} State Nodal Monitoring Portal`}
            {role === "district" && `${data.jurisdiction} District Expenditure & Sanctions Triage`}
            {role === "mp" && `${data.jurisdiction} — Parliamentary Fund Tracker`}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time multi-signal ML detection across 60,356 public works records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/works"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-xs"
          >
            <span>Explore Works Table</span>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </Link>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sanctioned Works"
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${data.extra_insights.total_active_idas || 1} Implementing Agencies`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="Total Fund Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle="Sanctioned public expenditure"
          icon={Coins}
          variant="accent"
        />
        <StatCard
          title="Flagged High/Critical Risk"
          value={summary.flagged_works_count}
          subtitle={`₹${(summary.amount_at_risk / 100000).toFixed(1)} Lakhs at Risk`}
          icon={ShieldAlert}
          variant={summary.flagged_works_count > 0 ? "danger" : "success"}
          trend={{
            value: `${((summary.flagged_works_count / Math.max(1, summary.total_works)) * 100).toFixed(1)}% of total`,
            isPositive: summary.flagged_works_count === 0,
          }}
        />
        <StatCard
          title="Avg Composite Risk Score"
          value={`${summary.avg_risk_score} / 100`}
          subtitle={`Compliance: ${data.extra_insights.compliance_rate || 94.2}%`}
          icon={Activity}
          variant={summary.avg_risk_score > 50 ? "warning" : "success"}
        />
      </div>

      {/* Role-Specific Geospatial Map Component */}
      <div>
        {role === "ministry" && stateChoropleth.length > 0 && (
          <StateChoroplethMap data={stateChoropleth} />
        )}
        {role === "state" && districtData.length > 0 && (
          <DistrictDrilldownMap districts={districtData} selectedStateName={data.jurisdiction} />
        )}
        {(role === "district" || role === "mp") && (
          <ConstituencyMap
            pins={pinsData}
            title={role === "mp" ? "Constituency Works Progress & Fraud Verification" : `${data.jurisdiction} District Works Audit Pins`}
          />
        )}
      </div>

      {/* Visual Evidence Spotlight for Top Flagged Project */}
      {topFlaggedWork && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Highest Risk Anomaly Spotlight ({topFlaggedWork.id})
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

      {/* Mid-section: Fraud Typologies Breakdown + Network Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fraud Typologies Distribution */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Detected Fraud & Anomaly Typologies</h3>
              <p className="text-xs text-slate-500">Classified by multi-model ensemble & rule traces</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
              5 Typologies
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

        {/* MP-IDA Network Graph Preview */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">MP–IDA Concentration & Monopoly Risk</h3>
              <p className="text-xs text-slate-500">Money flow from MPs to Executing Agencies</p>
            </div>
            <Link
              href="/graph"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              Full Graph <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {graphData.nodes.length > 0 ? (
            <div className="my-3">
              <MPIDANetworkGraph data={graphData} />
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              <Building2 className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p>Network relationship graph available for cross-agency inspection.</p>
              <Link
                href="/graph"
                className="mt-3 inline-block rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Open Network Visualizer
              </Link>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex justify-between">
            <span>Algorithm: NetworkX Degree & Monopoly Share</span>
            <span className="text-emerald-600 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Flagged Works Requiring Attention */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Highest Risk Works Requiring Immediate Audit</h3>
            <p className="text-xs text-slate-500">Explainable risk scores with audit traces</p>
          </div>
          <Link
            href="/works"
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            View All {summary.total_works.toLocaleString()} Works <ChevronRight className="h-4 w-4" />
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
                <th className="py-3 pr-3">Primary Flag Reason</th>
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
