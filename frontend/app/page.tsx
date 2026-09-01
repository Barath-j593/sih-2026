"use client";

import React, { useEffect, useState } from "react";
import { useRole } from "../context/RoleContext";
import { fetchDashboard, fetchStateChoropleth, fetchDistrictDrilldown, fetchConstituencyPins, fetchNetworkGraph } from "../lib/api";
import { DashboardData } from "../lib/types";
import { StatCard } from "../components/ui/StatCard";
import { RiskBadge } from "../components/ui/RiskBadge";
import { StateChoroplethMap } from "../components/maps/StateChoroplethMap";
import { DistrictDrilldownMap } from "../components/maps/DistrictDrilldownMap";
import { ConstituencyMap } from "../components/maps/ConstituencyMap";
import { MPIDANetworkGraph } from "../components/graph/MPIDANetworkGraph";
import { ComingSoonModal } from "../components/ui/ComingSoonModal";

import {
  ShieldAlert,
  Coins,
  Building2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
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
        const res = await fetchDashboard(role, jurisdiction);
        setData(res);

        if (role === "ministry") {
          const choro = await fetchStateChoropleth();
          setStateChoropleth(choro);
          const grp = await fetchNetworkGraph(80, 0);
          setGraphData(grp);
        } else if (role === "state") {
          const dist = await fetchDistrictDrilldown(jurisdiction || "Bihar");
          setDistrictData(dist);
          const grp = await fetchNetworkGraph(60, 40);
          setGraphData(grp);
        } else {
          const pins = await fetchConstituencyPins(jurisdiction, role === "mp" ? jurisdiction : undefined);
          setPinsData(pins);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [role, jurisdiction]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
        <p className="text-sm font-semibold text-slate-400">Loading {roleConfig.title} Intelligence Feed...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
        <h3 className="mt-3 text-lg font-bold text-white">Error Loading Data</h3>
        <p className="mt-1 text-xs text-red-300">{error || "Could not retrieve API response."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { summary, risk_distribution, fraud_breakdown, top_flagged_works, recent_alerts } = data;

  return (
    <div className="space-y-6">
      {/* Page Header with Scope Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${roleConfig.badgeColor}`}>
              {roleConfig.role.toUpperCase()} LEVEL
            </span>
            <span className="text-xs text-slate-400 font-mono">Jurisdiction: {data.jurisdiction}</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white tracking-tight sm:text-3xl">
            {role === "ministry" && "National MPLADS Fund Integrity & Risk Dashboard"}
            {role === "state" && `${data.jurisdiction} State Nodal Monitoring Portal`}
            {role === "district" && `${data.jurisdiction} District Expenditure & Sanctions Triage`}
            {role === "mp" && `${data.jurisdiction} — Parliamentary Fund Tracker`}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time multi-signal ML detection across 60,356 public works records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/works"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-md"
          >
            <span>Explore Works Table</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
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

      {/* Mid-section: Fraud Typologies Breakdown + Network Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fraud Typologies Distribution */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Detected Fraud & Anomaly Typologies</h3>
              <p className="text-xs text-slate-400">Classified by multi-model ensemble & rule traces</p>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-saffron-400 border border-slate-700">
              5 Typologies
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {fraud_breakdown.map((item) => (
              <div key={item.fraud_type} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{item.label}</span>
                  <span className="font-mono font-bold text-saffron-400">{item.count} flagged</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>₹{(item.total_amount / 100000).toFixed(1)} Lakhs affected</span>
                  <span>{item.percentage}% of flagged items</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MP-IDA Network Graph Preview */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">MP–IDA Concentration & Monopoly Risk</h3>
              <p className="text-xs text-slate-400">Bipartite relationship clustering</p>
            </div>
            <Link
              href="/graph"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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
              <Building2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p>Network relationship graph available for cross-agency inspection.</p>
              <Link
                href="/graph"
                className="mt-3 inline-block rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-cyan-300"
              >
                Open Network Visualizer
              </Link>
            </div>
          )}

          <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400 flex justify-between">
            <span>Algorithm: NetworkX Degree & PageRank Centrality</span>
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Flagged Works Requiring Attention */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Highest Risk Works Requiring Immediate Audit</h3>
            <p className="text-xs text-slate-400">Explainable risk scores with audit traces</p>
          </div>
          <Link
            href="/works"
            className="text-xs font-bold text-saffron-400 hover:text-saffron-300 flex items-center gap-1"
          >
            View All {summary.total_works.toLocaleString()} Works <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Work ID</th>
                <th className="pb-3">Work Description</th>
                <th className="pb-3">MP & Location</th>
                <th className="pb-3">Agency (IDA)</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-center">Risk Score</th>
                <th className="pb-3 pr-2">Primary Flag Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {top_flagged_works.map((w) => (
                <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pl-2 font-mono font-bold text-saffron-400">{w.id}</td>
                  <td className="py-3 font-medium text-white max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-slate-300">
                    <p className="font-semibold text-white">{w.mp_name}</p>
                    <p className="text-[10px] text-slate-500">{w.constituency}, {w.state}</p>
                  </td>
                  <td className="py-3 text-slate-400 max-w-[140px] truncate">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-white">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-2 text-slate-300 max-w-sm truncate text-[11px]">
                    {w.risk_reasons[0] || "Statistical anomaly detected"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roadmap Architecture Highlights */}
      <div className="rounded-2xl border border-saffron-900/30 bg-gradient-to-br from-saffron-950/20 via-slate-900/60 to-slate-950 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-saffron-400" />
            <h3 className="text-base font-bold text-white">Upcoming Enhancements & Government Integrations</h3>
          </div>
          <Link href="/roadmap" className="text-xs font-bold text-saffron-400 hover:underline">
            View Full Roadmap
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() =>
              setModalFeature({
                title: "State PWD Schedule of Rates (SoR) Integration",
                phase: "Phase 2 (Q4 2026)",
                description: "Automated cross-referencing of civil work line-items against real-time State Public Works Department (PWD) official rate schedules to compute exact unit cost variance down to cement and asphalt rates.",
                architecture: [
                  "Daily ingestion of State PWD rate gazettes via OCR & PDF extractors.",
                  "Itemized cost matching engine linking work titles to CPWD / State SoR standard line items.",
                  "Statutory price ceiling alarms triggered during pre-sanction verification."
                ],
                governanceImpact: "Prevents overpricing at the tender estimation stage before public funds are disbursed."
              })
            }
            className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 cursor-pointer hover:border-saffron-500/50 hover:bg-slate-900 transition-all"
          >
            <span className="rounded bg-saffron-950 px-2 py-0.5 text-[10px] font-bold text-saffron-400 border border-saffron-500/30">
              PHASE 2
            </span>
            <h4 className="text-xs font-bold text-white mt-2">PWD Schedule of Rates</h4>
            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
              Automated line-item cost ceiling benchmarking against state gazettes.
            </p>
          </div>

          <div
            onClick={() =>
              setModalFeature({
                title: "GeM & Cross-Scheme Debarred Contractor Registry",
                phase: "Phase 2 (Q4 2026)",
                description: "Direct integration with Government e-Marketplace (GeM), PMGSY, and state debarment registries using fuzzy PAN/GSTIN resolution.",
                architecture: [
                  "API webhook to GeM Central Debarment Database.",
                  "Fuzzy entity resolution for contractor director PANs and GST numbers.",
                  "Automated instant blacklist warnings on high-value tender awards."
                ],
                governanceImpact: "Closes the loophole where blacklisted contractors bid under altered entity names."
              })
            }
            className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 cursor-pointer hover:border-saffron-500/50 hover:bg-slate-900 transition-all"
          >
            <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
              PHASE 2
            </span>
            <h4 className="text-xs font-bold text-white mt-2">GeM Contractor Blacklist</h4>
            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
              Cross-scheme entity matching across GeM, PMGSY, and CPWD registries.
            </p>
          </div>

          <div
            onClick={() =>
              setModalFeature({
                title: "Citizen Geotagged Field Verification Portal",
                phase: "Phase 3 (Q1 2027)",
                description: "Mobile PWA portal enabling local residents to snap GPS-stamped, timestamped photos of ongoing or completed works.",
                architecture: [
                  "PWA with strict GPS hardware verification and EXIF tamper validation.",
                  "Computer vision asset presence classifier verifying school walls, solar lights, and borewells.",
                  "Civic reward token system for verified ground truth feedback."
                ],
                governanceImpact: "Crowdsources ground-truth ghost project detection with zero district overhead."
              })
            }
            className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 cursor-pointer hover:border-saffron-500/50 hover:bg-slate-900 transition-all"
          >
            <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              PHASE 3
            </span>
            <h4 className="text-xs font-bold text-white mt-2">Citizen Geotag Uploads</h4>
            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
              Crowdsourced GPS-stamped photo verification for physical asset proof.
            </p>
          </div>

          <div
            onClick={() =>
              setModalFeature({
                title: "Pre-Sanction AI Viability & Stall Predictor",
                phase: "Phase 3 (Q1 2027)",
                description: "Predictive model evaluating proposal description and agency clearance latency before official sanction.",
                architecture: [
                  "LightGBM latency prediction model trained on historical sanction duration.",
                  "Work description clarity scorer checking for underspecified project scopes.",
                  "Pre-approval district clearance simulation widget."
                ],
                governanceImpact: "Proactively prevents project abandonment before government capital is locked up."
              })
            }
            className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 cursor-pointer hover:border-saffron-500/50 hover:bg-slate-900 transition-all"
          >
            <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/30">
              PHASE 3
            </span>
            <h4 className="text-xs font-bold text-white mt-2">Pre-Sanction AI Predictor</h4>
            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
              Stall probability estimation at the moment of MP recommendation.
            </p>
          </div>
        </div>
      </div>

      {/* Modal for Roadmaps */}
      {modalFeature && (
        <ComingSoonModal
          isOpen={!!modalFeature}
          onClose={() => setModalFeature(null)}
          feature={modalFeature}
        />
      )}
    </div>
  );
}
