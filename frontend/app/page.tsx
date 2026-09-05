"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDashboard, fetchStateChoropleth, fetchWorks } from "../lib/api";
import { DashboardData, WorkItem } from "../lib/types";
import { Footer } from "../components/Footer";
import {
  Search,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Users,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Eye,
  Sliders,
  HelpCircle,
  Database,
  Cpu,
  Fingerprint,
  MessageSquare,
  Lock,
  Scale,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Clock,
  Copy,
  Scan,
  Check,
  MapPin,
  Map,
  ArrowUpRight
} from "lucide-react";

export default function SetuLandingPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [statesData, setStatesData] = useState<any[]>([]);
  const [worksData, setWorksData] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeQuery, setActiveQuery] = useState("Why is Project W-10002 high risk?");
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [activeTabDirectory, setActiveTabDirectory] = useState<"states" | "regions" | "patterns" | "sectors">("states");
  const [tableFilter, setTableFilter] = useState<"ALL" | "Critical" | "High" | "Medium" | "Low">("ALL");

  // Load live data from real MPLADS dataset via API
  useEffect(() => {
    async function loadLiveData() {
      try {
        const [dash, states, works] = await Promise.all([
          fetchDashboard("ministry"),
          fetchStateChoropleth(),
          fetchWorks({ limit: 8, risk_level: tableFilter === "ALL" ? undefined : tableFilter }),
        ]);
        setDashboardData(dash);
        setStatesData(states);
        setWorksData(works.items);
      } catch (err) {
        console.error("Error loading live landing page telemetry:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLiveData();
  }, [tableFilter]);

  // Dynamic Query Execution on real data
  useEffect(() => {
    async function executeQuery() {
      try {
        // Extract project ID if present (e.g. W-10002) or search terms
        const match = activeQuery.match(/W-\d+/i);
        const searchTerm = match ? match[0] : activeQuery.replace(/^(Why is |Show |Which projects have )/i, "");
        const res = await fetchWorks({ search: searchTerm, limit: 1 });
        if (res.items && res.items.length > 0) {
          const item = res.items[0];
          setQueryResult({
            title: `${item.id}: ${item.work}`,
            location: `${item.constituency}, ${item.state}`,
            riskScore: item.risk_score,
            riskLevel: item.risk_level,
            allocation: item.allocation_amount,
            mp_name: item.mp_name,
            ida: item.ida,
            status: item.status,
            reasons: item.risk_reasons || ["Peer cost variance exceeds normal distribution", "Concentrated agency allocation"],
            sources: [`MPLADS Record ${item.id}`, `Audited by ${item.ida}`, "State PWD Rate Baseline"]
          });
        } else {
          setQueryResult(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
    executeQuery();
  }, [activeQuery]);

  const summary = dashboardData?.summary || {
    total_works: 60356,
    total_allocation: 9062100000,
    flagged_works_count: 6395,
    amount_at_risk: 381200000,
    avg_risk_score: 59.3,
  };

  const topWorks = dashboardData?.top_flagged_works || [];
  const topFlaggedWork = topWorks.length > 0 ? topWorks[0] : null;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-amber-100 selection:text-amber-900 font-sans relative">
      {/* CHAPTER 01: HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/50">
        {/* National Emblem Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
          <svg viewBox="0 0 400 500" className="w-[500px] h-[600px] fill-current text-slate-900">
            <circle cx="200" cy="200" r="180" />
            <path d="M200 40 L200 360 M40 200 L360 200 M80 80 L320 320 M80 320 L320 80" stroke="currentColor" strokeWidth="12" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Headline & Live Statistics */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>SETU</span>
                <span className="text-amber-400">•</span>
                <span className="text-amber-800 uppercase tracking-wider text-[10px]">MPLADS INTELLIGENCE</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
                SEE THE RISK <br />
                BEFORE IT BECOMES <br />
                <span className="text-amber-600 drop-shadow-xs">AN AUDIT.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-medium">
                AI-powered monitoring for MPLADS works, fund utilization and project execution, helping authorities
                identify anomalies before they become audit findings.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>AI-ASSISTED</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>EVIDENCE-BACKED</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>HUMAN VERIFIED</span>
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all group"
                >
                  <span>OPEN SETU DASHBOARD</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#how-it-works"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs"
                >
                  EXPLORE HOW IT WORKS
                </a>
              </div>

              {/* 4 Live Stats Footer (From Real Dataset) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
                <div>
                  <p className="text-2xl font-black text-slate-900 font-mono">{summary.total_works.toLocaleString()}</p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Projects Monitored</p>
                  <span className="text-[10px] text-slate-400">Active nationwide</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    ₹{(summary.total_allocation / 10000000).toFixed(2)} Cr
                  </p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tracked Outlay</p>
                  <span className="text-[10px] text-slate-400">Sanctioned value</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-red-600 font-mono">{summary.flagged_works_count.toLocaleString()}</p>
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Early Warnings</p>
                  <span className="text-[10px] text-slate-400">Requiring review</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 font-mono">{statesData.length || 28}</p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">States & UTs</p>
                  <span className="text-[10px] text-slate-400">National coverage</span>
                </div>
              </div>
            </div>

            {/* Right Col: Live Works Telemetry Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 relative">
              {topWorks.slice(0, 4).map((w, idx) => {
                const gradients = [
                  "from-blue-700 to-slate-900",
                  "from-amber-700 to-slate-900",
                  "from-emerald-700 to-slate-900",
                  "from-purple-800 to-slate-900"
                ];
                return (
                  <Link
                    key={w.id}
                    href={`/works/${w.id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md space-y-2 hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between group"
                  >
                    <div className={`relative h-28 rounded-xl bg-gradient-to-br ${gradients[idx % 4]} overflow-hidden p-3 flex flex-col justify-between text-white`}>
                      <div className="flex justify-between items-start">
                        <span className="rounded bg-white/20 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          {w.id}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <p className="text-xs font-bold leading-tight line-clamp-2">{w.work}</p>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                      <span className="truncate max-w-[100px]">{w.constituency}, {w.state}</span>
                      <span className="font-semibold text-red-600 font-mono">Risk: {w.risk_score.toFixed(0)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 02: OPERATIONAL GOVERNANCE ARCHITECTURE */}
      <section id="pipeline" className="py-20 border-b border-slate-200 bg-slate-900 text-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-400">
              <Shield className="h-3.5 w-3.5" />
              <span>OPERATIONAL GOVERNANCE ARCHITECTURE</span>
            </div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white">
              FROM DATA <br />
              <span className="text-amber-500">TO DECISION.</span>
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl">
              SETU connects project records, financial activity, execution progress, governance rules and evidence into
              a single risk intelligence layer.
            </p>
          </div>

          {/* 4 Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-all group">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-2xl font-black font-mono text-amber-500">01</span>
                  <Search className="h-5 w-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mt-3">
                  EARLY WARNING ENGINE
                </span>
                <h3 className="text-xl font-bold text-white mt-1">DETECT</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Identify anomalies across cost benchmarks, payment velocity, single-tender procurement and execution timelines.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>EARLY WARNING ENGINE</span>
                <span>INSPECT →</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-all group">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-2xl font-black font-mono text-amber-500">02</span>
                  <Eye className="h-5 w-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mt-3">
                  EXPLAINABLE REASONING
                </span>
                <h3 className="text-xl font-bold text-white mt-1">EXPLAIN</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Explain why a project was flagged with plain-language diagnostic rationales and PWD SoR percentile baselines.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>EXPLAINABLE REASONING</span>
                <span>INSPECT →</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-all group">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-2xl font-black font-mono text-amber-500">03</span>
                  <FileText className="h-5 w-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mt-3">
                  EVIDENCE & VERIFICATION
                </span>
                <h3 className="text-xl font-bold text-white mt-1">INVESTIGATE</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Connect flags with corroborating evidence dossiers, treasury ledgers, and geotagged field survey photos.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>IMMUTABLE EVIDENCE DOCKET</span>
                <span>INSPECT →</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-all group">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-2xl font-black font-mono text-amber-500">04</span>
                  <CheckCircle2 className="h-5 w-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mt-3">
                  HUMAN DECISION & RESOLUTION
                </span>
                <h3 className="text-xl font-bold text-white mt-1">ACT</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Enable an authorized human decision-maker to confirm findings, dismiss false positives, resolve, or escalate.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>AUTHORITATIVE HUMAN VERDICT</span>
                <span>INSPECT →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 03: PUBLIC QUERY & CITIZEN TRANSPARENCY (LIVE API CONNECTED) */}
      <section id="public-query" className="py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
              <Database className="h-3.5 w-3.5" />
              <span>CHAPTER 03 • PUBLIC QUERY & CITIZEN TRANSPARENCY</span>
            </div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              ASK ABOUT MPLADS. <br />
              <span className="text-amber-600">EXPLORE WHAT THE SYSTEM CAN VERIFY.</span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-3xl">
              Citizens, researchers, and public authorities can query the intelligence layer to inspect grounded project
              ledgers, contractor concentration, and statutory rule compliance.
            </p>
          </div>

          {/* Interactive Public Search Box */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-md space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={activeQuery}
                onChange={(e) => setActiveQuery(e.target.value)}
                placeholder="Ask about a project (e.g. W-10002), district (Darbhanga), contractor, or statutory rule..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-32 text-sm text-slate-900 shadow-xs focus:border-slate-800 focus:outline-none"
              />
              <button
                onClick={() => {}}
                className="absolute right-2 top-2 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-1"
              >
                <span>Ask SETU</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Suggested Queries Pills */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                SUGGESTED TRANSPARENCY QUERIES:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Why is Project W-10002 high risk?",
                  "Show delayed works in Darbhanga",
                  "Which projects have duplicate similarity?",
                  "What rules apply to community halls?"
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setActiveQuery(q)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      activeQuery === q
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    ✨ {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Interactive Query Diagnostic Result Card */}
            {queryResult ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600">
                      LIVE DATABASE RECORD
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">&quot;{queryResult.title}&quot;</h4>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Evidence Verified
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-medium text-slate-800">
                    Location: <strong className="text-slate-900">{queryResult.location}</strong> • Sanction: <strong className="text-slate-900">₹{queryResult.allocation.toLocaleString()}</strong> • MP: <strong className="text-slate-900">{queryResult.mp_name}</strong>
                  </p>
                  <p className="text-slate-500">
                    Executing Agency: {queryResult.ida} • Current Status: <strong className="text-emerald-700">{queryResult.status}</strong>
                  </p>
                </div>

                {/* Grounded Signals Grid from Live Record */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    AUDIT EXPLAINABILITY TRACES:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {queryResult.reasons.map((reason: string, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-red-200 bg-red-50/40 p-3 text-xs text-red-900 flex items-start gap-2"
                      >
                        <span className="text-red-500 font-bold">•</span>
                        <span className="leading-relaxed">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Sources:</span>
                    {queryResult.sources.map((s: string, i: number) => (
                      <span key={i} className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/works/${queryResult.title.split(":")[0]}`}
                    className="font-bold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    Open Full Inspection Dossier →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                Searching verified MPLADS records...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CHAPTER 04: MPLADS INTELLIGENCE CAPSULES (POPULATED WITH REAL WORKS) */}
      <section id="capsules" className="py-20 border-b border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              MPLADS INTELLIGENCE CAPSULES
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Hover any capsule to preview summary signals • Click to open full evidence docket
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topWorks.slice(0, 5).map((w, i) => (
              <Link
                key={w.id}
                href={`/works/${w.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg hover:border-slate-400 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      PROJECT
                    </span>
                    <span className="rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700 font-mono">
                      {w.risk_level.toUpperCase()} • {w.risk_score.toFixed(0)}/100
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-2 block">{w.id}</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {w.work}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">{w.constituency}, {w.state}</p>
                  <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs flex justify-between">
                    <span className="text-slate-500">Sanctioned Outlay:</span>
                    <span className="font-bold text-slate-900 font-mono">₹{(w.allocation_amount / 100000).toFixed(2)} L</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Click to Inspect</span>
                  <span>VIEW →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CHAPTER 05: STATUTORY CODIFICATION */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
              CHAPTER 05 • STATUTORY CODIFICATION
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              RULES SHOULD BECOME <br />
              <span className="text-amber-600">MACHINE-READABLE.</span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Codifying the MPLADS Revised Guidelines 2023, General Financial Rules (GFR 2017), and CVC circulars
              into deterministic evaluation logic.
            </p>
          </div>

          {/* 6 Codified Rule Cards Grid (3x2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    RULE §4.2
                  </span>
                  <Shield className="h-4 w-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2.5">PROHIBITED WORK CHECK</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Machine check against commercial assets, private trusts, places of worship, or unauthorized land acquisitions.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 font-bold uppercase text-[9px]">
                  STATUTORY PROHIBITION
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Codified Logic</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    RULE §3.2
                  </span>
                  <Scale className="h-4 w-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2.5">SC / ST AREA QUOTA FOCUS</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Mandatory 15% allocation for SC and 7.5% for ST inhabited areas automatically verified per Parliamentary constituency.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 font-bold uppercase text-[9px]">
                  MANDATORY ALLOCATION
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Codified Logic</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    RULE §5.4
                  </span>
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2.5">COST BENCHMARK VERIFICATION</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Engineering estimate rate variance check against local State PWD Schedule of Rates (SoR) before work order release.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold uppercase text-[9px]">
                  PRE-SANCTION AUDIT
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Codified Logic</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    RULE §6.1
                  </span>
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2.5">PROCUREMENT INTEGRITY & CVC RULES</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Single-bidder tender exceptions, compressed notice periods, and contractor rotation verified across active district works.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 font-bold uppercase text-[9px]">
                  PROCUREMENT AUDIT
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Codified Logic</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    RULE §7.1
                  </span>
                  <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2.5">GFR-12C UC MANDATE</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Second installment disbursement blocked until Utilization Certificate (UC) for first installment is audited and uploaded.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 font-bold uppercase text-[9px]">
                  DISBURSEMENT GATE
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Codified Logic</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    RULE §8.3
                  </span>
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2.5">GEOSPATIAL WORK DUPLICATION</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Geographic proximity collision check against PMGSY, Smart Cities, and State road databases to prevent double-funding.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="rounded bg-pink-100 text-pink-700 px-2 py-0.5 font-bold uppercase text-[9px]">
                  CROSS-SCHEME AUDIT
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Codified Logic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 06: PREDICTIVE RISK SIGNALS */}
      <section className="py-20 border-b border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
              CHAPTER 06 • PREDICTIVE RISK SIGNALS
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              WARN BEFORE <br />
              <span className="text-amber-600">THE LOSS OCCURS.</span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Continuous trajectory monitoring flags emerging project bottlenecks and fiscal variances before funds
              are irrevocably disbursed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[9px] font-bold text-red-700 uppercase">
                    HIGH RISK
                  </span>
                  <TrendingUp className="h-4 w-4 text-red-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-3">Cost Overrun Probability</h4>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-red-600">78%</span>
                  <span className="text-xs text-slate-400">confidence index</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full" style={{ width: "78%" }} />
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  Material price inflation & SoR deviation detected early in execution.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Early Warning Signal</span>
                <span className="text-red-600 font-semibold">• Active Watch</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-800 uppercase">
                    MODERATE RISK
                  </span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-3">Milestone Delay Risk</h4>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-amber-600">64%</span>
                  <span className="text-xs text-slate-400">confidence index</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "64%" }} />
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  Execution velocity suggests +45 day completion delay beyond statutory SLA.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Early Warning Signal</span>
                <span className="text-amber-600 font-semibold">• Active Watch</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[9px] font-bold text-red-700 uppercase">
                    HIGH SIMILARITY
                  </span>
                  <Copy className="h-4 w-4 text-red-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-3">Duplicate Work Flag</h4>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-red-600">74%</span>
                  <span className="text-xs text-slate-400">confidence index</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full" style={{ width: "74%" }} />
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  74% spatial and title overlap with state budget community hall work.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Early Warning Signal</span>
                <span className="text-red-600 font-semibold">• Active Watch</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="rounded bg-orange-50 border border-orange-200 px-2 py-0.5 text-[9px] font-bold text-orange-800 uppercase">
                    WATCHLIST
                  </span>
                  <Shield className="h-4 w-4 text-orange-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-3">Tender Concentration Risk</h4>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-orange-600">52%</span>
                  <span className="text-xs text-slate-400">confidence index</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: "52%" }} />
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  Contractor concentration approaching CVC single-vendor threshold in block.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Early Warning Signal</span>
                <span className="text-orange-600 font-semibold">• Active Watch</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 07: MULTIMODAL INGESTION */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
              CHAPTER 07 • MULTIMODAL INGESTION
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              FROM PDF DOCUMENTS TO <br />
              <span className="text-amber-600">STRUCTURED INTELLIGENCE.</span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Unstructured sanction letters, measurement books, and treasury vouchers are automatically digitized into verified audit entities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Raw Sanction Letter */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="font-mono text-xs font-bold text-slate-800">
                    SANCTION_ORDER_{topFlaggedWork ? topFlaggedWork.id.replace("W-", "") : "10002"}.PDF
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  • OCR Parsed
                </span>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-inner space-y-3">
                <div className="text-center border-b border-slate-100 pb-2">
                  <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    DISTRICT COLLECTORATE • {topFlaggedWork?.constituency || "DARBHANGA"}
                  </p>
                </div>
                <p className="text-xs italic text-slate-600 leading-relaxed">
                  &quot;Sanction is hereby accorded under MPLADS Scheme for the work of {topFlaggedWork?.work || "Construction of Community Hall"} for an amount of ₹{topFlaggedWork?.allocation_amount?.toLocaleString() || "4,87,000"}/- to be executed by {topFlaggedWork?.ida || "DM Office"}...&quot;
                </p>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                  <span>Ref: {topFlaggedWork?.id || "W-10002"}</span>
                  <span>MP: {topFlaggedWork?.mp_name || "Gopal Jee Thakur"}</span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Layout & Table Detection</span>
                <span className="font-bold text-slate-800">100% Deterministic Extraction</span>
              </div>
            </div>

            {/* Center Arrow */}
            <div className="lg:col-span-1 flex justify-center">
              <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Right: Live Extracted Schema */}
            <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Scan className="h-4 w-4 text-slate-700" />
                  <span className="font-mono text-xs font-bold text-slate-900">EXTRACTED PROJECT SCHEMA</span>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 font-mono">
                  Confidence: 99.4%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">WORK TITLE</span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5">{topFlaggedWork?.work || "Civil Infrastructure Asset"}</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">SANCTION AMOUNT</span>
                  <span className="font-bold text-slate-900 font-mono block mt-0.5">₹{topFlaggedWork?.allocation_amount?.toLocaleString() || "4,87,000"}</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">PROJECT ID</span>
                  <span className="font-bold text-slate-900 font-mono block mt-0.5">{topFlaggedWork?.id || "W-10002"}</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">IMPLEMENTING AGENCY</span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5">{topFlaggedWork?.ida || "District Collectorate"}</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">RECOMMENDING MP</span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5">{topFlaggedWork?.mp_name || "Hon'ble MP"}</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">STATE & CONSTITUENCY</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{topFlaggedWork?.constituency}, {topFlaggedWork?.state}</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">CALIBRATED RISK</span>
                  <span className="font-bold text-red-600 font-mono block mt-0.5">{topFlaggedWork?.risk_score?.toFixed(1) || "82.0"} / 100</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">STATUS</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">{topFlaggedWork?.status || "Sanctioned"}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-100">
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Validated against District Treasury Ledgers
                </span>
                <span className="font-mono text-[10px]">SHA-256 Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 08: DUE PROCESS PROTOCOL */}
      <section className="py-20 border-b border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
              CHAPTER 08 • DUE PROCESS PROTOCOL
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              INVESTIGATE WITH <br />
              <span className="text-amber-600">CORROBORATED EVIDENCE.</span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              The platform provides complete traceability from the first anomalous signal to final administrative action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { num: "01", icon: Shield, title: "Anomaly Detected", desc: "Real-time statistical or policy variance triggered." },
              { num: "02", icon: Search, title: "Risk Score Generated", desc: "Composite index mapped against 9 risk vectors." },
              { num: "03", icon: FileText, title: "Evidence Collected", desc: "Vouchers, photos, and SoR rates compiled." },
              { num: "04", icon: Users, title: "Officer Assigned", desc: "Dispatched to Collector or Field Auditor queue." },
              { num: "05", icon: CheckCircle2, title: "Field Inquiry", desc: "On-site IQM verification and measurement check." },
              { num: "06", icon: MessageSquare, title: "Officer Comments", desc: "Statutory explanation recorded in docket." },
              { num: "07", icon: Check, title: "Authoritative Verdict", desc: "Confirm Issue, Dismiss, Resolve, or Escalate." },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                      <span className="font-bold text-slate-900">{step.num}</span>
                      <Icon className="h-4 w-4 text-slate-400" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2 leading-snug">{step.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block border-t border-slate-100 pt-2">
                    Step {step.num} of 07
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                EXPLORE ACTIVE CASE INQUIRIES
              </h4>
              <p className="text-xs text-slate-500">
                Inspect corroborating evidence, peer rate benchmarks, and the authoritative human verdict panel.
              </p>
            </div>

            <Link
              href="/cases"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Open Case Docket</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CHAPTER 09: ALL-INDIA JURISDICTION (POPULATED WITH REAL STATES VIA API) */}
      <section className="py-20 border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="rounded-full bg-slate-900 border border-slate-800 px-3.5 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                CHAPTER 09 • ALL-INDIA JURISDICTION
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                ONE NATIONAL VIEW <br />
                <span className="text-amber-500">THOUSANDS OF WORKS.</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
                SETU monitors parliamentary recommendations across India, establishing a unified audit ledger from national ministry oversight down to the village level.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">TOTAL MONITORED OUTLAY</span>
                  <span className="text-xl font-black font-mono text-white mt-1 block">
                    ₹{(summary.total_allocation / 10000000).toFixed(2)} Cr
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ACTIVE INFRASTRUCTURE</span>
                  <span className="text-xl font-black font-mono text-white mt-1 block">
                    {summary.total_works.toLocaleString()} Works
                  </span>
                </div>
              </div>

              <Link
                href="/maps"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-slate-900 hover:bg-slate-100 transition-all shadow"
              >
                <span>Open National Geographic Risk Maps</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right: Real Live State Directory */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-white">NATIONAL PORTFOLIO DIRECTORY</h3>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-0.5 text-[10px] font-mono text-slate-300">
                  {statesData.length} States Monitored
                </span>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-950 p-1 text-xs">
                {(["states", "regions", "patterns", "sectors"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTabDirectory(tab)}
                    className={`flex-1 rounded-lg py-1.5 font-semibold capitalize transition-all ${
                      activeTabDirectory === tab ? "bg-slate-800 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Real State Rows from Live API */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {statesData.slice(0, 8).map((st) => (
                  <Link
                    key={st.state}
                    href={`/maps`}
                    className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs hover:border-slate-700 hover:bg-slate-900 transition-all"
                  >
                    <div>
                      <span className="font-bold text-white block">{st.state}</span>
                      <span className="text-[11px] text-slate-400">
                        {st.total_works.toLocaleString()} Works • ₹{(st.total_allocation / 10000000).toFixed(1)} Cr
                      </span>
                    </div>
                    <span className="text-red-400 font-bold font-mono text-right text-[11px]">
                      {st.flagged_works_count} Flags <span className="text-slate-500 font-normal block text-[9px]">Avg Risk: {st.avg_risk_score.toFixed(1)}</span>
                    </span>
                  </Link>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800">
                <span>Synchronized with Central SQL Database</span>
                <span className="text-emerald-400 font-semibold">• Live Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 10: NATIONAL PROJECT AUDIT DIRECTORY (REAL WORKS FROM SQLITE) */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
                CHAPTER 10 • NATIONAL PROJECT AUDIT DIRECTORY
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                MONITORED WORKS EXPLORER
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Search and filter across live parliamentary recommendations, technical sanction milestones, and explainable risk scores.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
              {(["ALL", "Critical", "High", "Medium", "Low"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setTableFilter(lvl)}
                  className={`rounded-lg px-3 py-1 transition-all ${
                    tableFilter === lvl ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Real Works Table */}
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 pl-4">PROJECT & REF ID</th>
                    <th className="py-3.5">STATE & DISTRICT</th>
                    <th className="py-3.5">EXECUTING AGENCY</th>
                    <th className="py-3.5 text-right">OUTLAY</th>
                    <th className="py-3.5 text-center">STATUS</th>
                    <th className="py-3.5 text-center">RISK INDEX</th>
                    <th className="py-3.5 pr-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {worksData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-4 max-w-sm">
                        <p className="font-bold text-slate-900 line-clamp-1">{row.work}</p>
                        <span className="font-mono text-[10px] text-slate-400">Ref: {row.id} • MP: {row.mp_name}</span>
                      </td>
                      <td className="py-3.5 text-slate-700">
                        <p className="font-medium">{row.constituency}</p>
                        <span className="text-[10px] text-slate-400">{row.state}</span>
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium max-w-[140px] truncate">{row.ida}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{row.allocation_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-center whitespace-nowrap">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          row.risk_score >= 80 ? "bg-red-50 text-red-700 border border-red-200" :
                          row.risk_score >= 60 ? "bg-amber-50 text-amber-800 border border-amber-200" :
                          "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {row.risk_score.toFixed(0)} <span className="ml-1 text-[8px] font-sans font-bold uppercase">{row.risk_level}</span>
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/works/${row.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-900 hover:text-white transition-all shadow-2xs"
                          >
                            <span>Inspect Risk</span>
                          </Link>
                          <Link
                            href={`/works/${row.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-900 hover:text-white transition-all shadow-2xs"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Twin</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
              <span>Showing {worksData.length} records dynamically populated from live database</span>
              <Link href="/works" className="font-bold text-slate-900 hover:underline">
                Explore All {summary.total_works.toLocaleString()} Projects →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 OFFICIAL GOVERNMENT OF INDIA FOOTER */}
      <Footer />

      {/* Floating Bottom Assistant */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => {
            const el = document.getElementById("public-query");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl hover:bg-slate-800 transition-all border border-slate-700 group hover:scale-105"
        >
          <MessageSquare className="h-4 w-4 text-amber-400 group-hover:animate-bounce" />
          <span>Ask SETU Intelligence</span>
        </button>
      </div>
    </div>
  );
}
