"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchWorks, fetchFilters } from "../../lib/api";
import { WorkItem } from "../../lib/types";
import { RiskBadge } from "../../components/ui/RiskBadge";
import { MagicCard } from "../../components/ui/MagicCard";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  AlertTriangle,
  Download,
  Copy,
  Table,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Building2,
  Clock,
  Check,
  X
} from "lucide-react";

export default function WorksExplorerPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "duplicate_groups">("table");

  // Filters (Uncoupled from persona/role switcher for pure forensic autonomy)
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [fraudType, setFraudType] = useState("");
  const [sortBy, setSortBy] = useState("risk_score");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Filter options from API
  const [options, setOptions] = useState<{
    states: string[];
    categories: string[];
    statuses: string[];
    fraud_types: string[];
    risk_levels: string[];
  }>({
    states: [],
    categories: [],
    statuses: [],
    fraud_types: [],
    risk_levels: [],
  });

  useEffect(() => {
    fetchFilters().then(setOptions).catch(console.error);
  }, []);

  useEffect(() => {
    async function loadWorks() {
      setLoading(true);
      try {
        const res = await fetchWorks({
          page,
          limit: viewMode === "duplicate_groups" ? 100 : 25,
          search: search || undefined,
          state: state || undefined,
          risk_level: riskLevel || undefined,
          fraud_type: fraudType || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
        setWorks(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err) {
        console.error("Failed to load works:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorks();
  }, [page, search, state, riskLevel, fraudType, sortBy, sortOrder, viewMode]);

  // Handle Preset Clicks
  const applyPreset = (presetKey: string) => {
    setPage(1);
    if (activePreset === presetKey) {
      // Toggle off
      setActivePreset(null);
      setRiskLevel("");
      setFraudType("");
      setViewMode("table");
      return;
    }

    setActivePreset(presetKey);
    switch (presetKey) {
      case "critical":
        setRiskLevel("Critical");
        setFraudType("");
        setViewMode("table");
        break;
      case "duplicate":
        setFraudType("duplicate");
        setRiskLevel("");
        setViewMode("duplicate_groups");
        break;
      case "overpricing":
        setFraudType("overpricing");
        setRiskLevel("");
        setViewMode("table");
        break;
      case "structuring":
        setFraudType("structuring");
        setRiskLevel("");
        setViewMode("table");
        break;
      case "vendor_capture":
        setFraudType("vendor_capture");
        setRiskLevel("");
        setViewMode("table");
        break;
      case "ghost_project":
        setFraudType("ghost_project");
        setRiskLevel("");
        setViewMode("table");
        break;
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setState("");
    setRiskLevel("");
    setFraudType("");
    setSortBy("risk_score");
    setSortOrder("desc");
    setActivePreset(null);
    setViewMode("table");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || state || riskLevel || fraudType || sortBy !== "risk_score" || sortOrder !== "desc" || activePreset
  );

  // Group works by duplicate cluster key (MP + Work Title + Amount)
  const duplicateClusters = useMemo(() => {
    const map = new Map<string, WorkItem[]>();
    works.forEach((w) => {
      const key = `${w.mp_name} ::: ${w.work} ::: ${w.allocation_amount}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(w);
    });

    return Array.from(map.entries()).map(([key, items]) => {
      const [mp_name, workTitle, amountStr] = key.split(" ::: ");
      return {
        key,
        mp_name,
        workTitle,
        amount: Number(amountStr),
        items,
        count: items.length,
        totalAmount: Number(amountStr) * items.length,
        avgRisk: items.reduce((acc, curr) => acc + curr.risk_score, 0) / items.length,
        state: items[0]?.state,
        constituency: items[0]?.constituency,
        ida: items[0]?.ida,
      };
    });
  }, [works]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5DFD3] pb-5 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#6E4529] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5EBE1]">
              National Audit Ledger
            </span>
            <span className="text-xs text-stone-500 font-mono">
              15,000 Scored Works • ₹223.1 Cr Monitored
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-serif font-bold text-[#1C1917] sm:text-3xl tracking-tight">
            MPLADS Works Explorer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-3xl">
            Cross-jurisdictional forensic audit ledger. Search project anomalies, duplicate candidate clusters, and inspect explainability traces across all MPs and Implementing Agencies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-[#D9D2C5] bg-[#F0ECE1] p-1 text-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                viewMode === "table"
                  ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs"
                  : "text-stone-700 hover:bg-white hover:text-stone-900"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode("duplicate_groups")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                viewMode === "duplicate_groups"
                  ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs"
                  : "text-stone-700 hover:bg-white hover:text-stone-900"
              }`}
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicate Clusters</span>
            </button>
          </div>

          <Link
            href="/reports"
            className="flex items-center gap-1.5 rounded-xl border border-[#D9D2C5] bg-[#FFFDF9] px-3.5 py-2 text-xs font-bold text-[#6E4529] hover:bg-white transition-all shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#8C5D3B]" />
            <span>Export CSV</span>
          </Link>
        </div>
      </div>

      {/* Forensic Audit Anomaly Presets (One-Click Investigation Filters) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-[#8C5D3B]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#8C5D3B]" />
            Forensic Audit Presets:
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset("critical")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "critical"
                ? "bg-rose-900 text-white shadow-xs ring-2 ring-rose-500"
                : "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>🚨 All Critical (Risk &gt; 80)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("duplicate")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "duplicate"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
            }`}
          >
            <Copy className="h-3.5 w-3.5" />
            <span>🔄 Duplicate Recommendation Shells</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("overpricing")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "overpricing"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-amber-700" />
            <span>📈 Cost Escalation (&gt;+2.0σ)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("structuring")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "structuring"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-blue-700" />
            <span>⚡ ₹5L Threshold Structuring</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("vendor_capture")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "vendor_capture"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-purple-700" />
            <span>🏢 Single-Agency Monopolies</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("ghost_project")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "ghost_project"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-stone-600" />
            <span>⏳ Stalled / Dwell Anomalies</span>
          </button>
        </div>
      </div>

      {/* Forensic Multi-Facet Query & Filter Bar */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={false}
        className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] p-4 shadow-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Universal Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search Work ID, MP, agency, title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActivePreset(null);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] py-2 pl-9 pr-8 text-xs text-[#1C1917] placeholder-stone-400 focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] font-sans transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* State / UT Filter */}
          <div>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
            >
              <option value="">All States ({options.states.length || 31})</option>
              {options.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={(e) => {
                setRiskLevel(e.target.value);
                setActivePreset(null);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
            >
              <option value="">All Risk Tiers</option>
              <option value="Critical">Critical (&gt; 80)</option>
              <option value="High">High (60 – 80)</option>
              <option value="Medium">Medium (35 – 60)</option>
              <option value="Low">Clean / Low (&lt; 35)</option>
            </select>
          </div>

          {/* Fraud Typology Filter */}
          <div>
            <select
              value={fraudType}
              onChange={(e) => {
                setFraudType(e.target.value);
                setActivePreset(null);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
            >
              <option value="">All Anomaly Typologies</option>
              <option value="duplicate">Duplicate Cloned Works</option>
              <option value="overpricing">Peer Cost Escalation</option>
              <option value="structuring">Threshold Structuring (&lt;₹5L)</option>
              <option value="vendor_capture">Single-Agency Capture</option>
              <option value="ghost_project">Stalled / Ghost Projects</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split("-");
                setSortBy(by);
                setSortOrder(ord);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
            >
              <option value="risk_score-desc">Risk: Highest First</option>
              <option value="risk_score-asc">Risk: Lowest First</option>
              <option value="allocation_amount-desc">Amount: Highest First</option>
              <option value="allocation_amount-asc">Amount: Lowest First</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Row & Live Counter */}
        <div className="mt-3 pt-3 border-t border-[#E5DFD3] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-stone-500 font-medium">
              Filtered Scope:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#F0ECE1] px-2 py-0.5 text-[11px] font-mono text-stone-800">
                Keyword: &quot;{search}&quot;
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {state && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#F0ECE1] px-2 py-0.5 text-[11px] font-mono text-stone-800">
                State: {state}
                <button
                  type="button"
                  onClick={() => setState("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {riskLevel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-mono text-rose-800 font-bold">
                Tier: {riskLevel}
                <button
                  type="button"
                  onClick={() => setRiskLevel("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {fraudType && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-mono text-amber-900 font-bold">
                Anomaly: {fraudType}
                <button
                  type="button"
                  onClick={() => setFraudType("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {!hasActiveFilters && (
              <span className="text-[11px] text-stone-400 font-mono italic">
                Showing all nationwide public works (No filter applied)
              </span>
            )}
          </div>

          <div className="font-mono text-xs text-stone-600">
            Matching Records:{" "}
            <strong className="text-[#6E4529] font-bold">
              {total.toLocaleString()} works
            </strong>
          </div>
        </div>
      </MagicCard>

      {/* VIEW 1: GROUPED DUPLICATE CLUSTERS VIEW */}
      {viewMode === "duplicate_groups" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold text-[#6E4529] uppercase tracking-wider">
              Identified Duplicate Recommendation Clusters
            </span>
            <span className="text-xs text-[#8C5D3B] font-mono font-bold">
              {duplicateClusters.filter((c) => c.count > 1).length} Multi-Work Duplicate Clusters Found
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-stone-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8C5D3B] border-t-transparent mx-auto mb-2" />
              <span>Analyzing duplicate recommendation clusters...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateClusters.map((cluster) => (
                <div
                  key={cluster.key}
                  className={`rounded-2xl border p-5 shadow-xs transition-all ${
                    cluster.count > 1
                      ? "border-amber-300 bg-amber-50/40 shadow-sm"
                      : "border-[#E5DFD3] bg-[#FFFDF9]"
                  }`}
                >
                  {/* Cluster Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        {cluster.count > 1 ? (
                          <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-bold text-amber-900 flex items-center gap-1">
                            <Copy className="h-3.5 w-3.5" /> Duplicate Cluster ({cluster.count} Identical Works)
                          </span>
                        ) : (
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600 font-medium">
                            Single Recommendation
                          </span>
                        )}
                        <span className="text-xs text-stone-500 font-mono">
                          {cluster.constituency}, {cluster.state}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1C1917]">{cluster.workTitle}</h3>
                      <p className="text-xs text-stone-600">
                        MP: <strong className="text-stone-900">{cluster.mp_name}</strong> • Agency:{" "}
                        <strong className="text-stone-900">{cluster.ida}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-500 block font-mono">Total Cloned Value</span>
                      <span className="text-lg font-mono font-bold text-amber-800">
                        ₹{(cluster.totalAmount / 100000).toFixed(2)} Lakhs
                      </span>
                      <span className="text-[11px] text-stone-400 block font-mono">
                        ₹{cluster.amount.toLocaleString()} per work
                      </span>
                    </div>
                  </div>

                  {/* Individual Works Inside this Cluster */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {cluster.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-3 space-y-2 flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-stone-700">{item.id}</span>
                            <RiskBadge score={item.risk_score} level={item.risk_level} size="sm" />
                          </div>
                          <p className="text-xs text-[#1C1917] font-medium mt-1 line-clamp-1">
                            {item.work}
                          </p>
                          <span className="text-[10px] text-stone-500 block mt-0.5 font-mono">
                            Status: {item.status}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#1C1917]">
                            ₹{item.allocation_amount.toLocaleString()}
                          </span>
                          <Link
                            href={`/works/${item.id}`}
                            className="inline-flex items-center gap-1 rounded bg-[#F0ECE1] hover:bg-[#6E4529] hover:text-[#F5EBE1] px-2 py-0.5 text-[11px] font-bold text-stone-800 transition-all"
                          >
                            <span>Trace</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: STANDARD DATA TABLE VIEW */
        <MagicCard 
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] shadow-xs overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5DFD3] bg-[#FAF7F2] text-stone-600 uppercase tracking-wider font-mono text-[11px] font-bold">
                  <th className="py-3.5 pl-4">Work ID</th>
                  <th className="py-3.5">Work Recommendation</th>
                  <th className="py-3.5">MP & Jurisdiction</th>
                  <th className="py-3.5">Agency (IDA)</th>
                  <th className="py-3.5 text-right">Amount (INR)</th>
                  <th className="py-3.5 text-center">Status</th>
                  <th className="py-3.5 text-center">Risk Score</th>
                  <th className="py-3.5 pr-4 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-stone-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#8C5D3B] border-t-transparent" />
                        <span>Querying nationwide public works ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-stone-500">
                      <p className="font-semibold text-stone-700">No works match the selected filters.</p>
                      <button
                        onClick={clearAllFilters}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#6E4529] font-bold underline"
                      >
                        Reset filters to view all works
                      </button>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => (
                    <tr key={w.id} className="hover:bg-[#FAF7F2] transition-colors group">
                      <td className="py-3.5 pl-4 font-mono font-bold text-[#1C1917] whitespace-nowrap">
                        {w.id}
                      </td>
                      <td className="py-3.5 max-w-sm">
                        <p className="font-semibold text-[#1C1917] line-clamp-1">{w.work}</p>
                        {w.risk_reasons && w.risk_reasons.length > 0 && (
                          <p className="text-[11px] text-red-700 line-clamp-1 mt-0.5">
                            • {w.risk_reasons[0]}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 text-stone-600">
                        <p className="font-bold text-[#1C1917]">{w.mp_name}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {w.constituency}, {w.state}
                        </p>
                      </td>
                      <td className="py-3.5 text-stone-600 max-w-[140px] truncate">{w.ida}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-[#1C1917] whitespace-nowrap">
                        ₹{w.allocation_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-center whitespace-nowrap">
                        <span className="rounded-md border border-[#E5DFD3] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-mono font-medium text-stone-700">
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-center whitespace-nowrap">
                        <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                      </td>
                      <td className="py-3.5 pr-4 text-center whitespace-nowrap">
                        <Link
                          href={`/works/${w.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#D9D2C5] bg-[#FFFDF9] px-2.5 py-1 text-xs font-bold text-stone-800 hover:bg-[#6E4529] hover:text-[#F5EBE1] hover:border-[#6E4529] transition-all shadow-2xs"
                        >
                          <span>Explain Trace</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between border-t border-[#E5DFD3] bg-[#FAF7F2] px-4 py-3 text-xs text-stone-600 gap-3">
            <div className="font-mono">
              Showing <span className="font-bold text-[#1C1917]">{works.length}</span> of{" "}
              <span className="font-bold text-[#1C1917]">{total.toLocaleString()}</span> works
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-[#D9D2C5] bg-[#FFFDF9] px-3 py-1.5 font-bold text-stone-700 hover:bg-[#F0ECE1] disabled:opacity-40 shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="font-mono text-xs font-bold text-[#1C1917] px-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#D9D2C5] bg-[#FFFDF9] px-3 py-1.5 font-bold text-stone-700 hover:bg-[#F0ECE1] disabled:opacity-40 shadow-2xs cursor-pointer"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </MagicCard>
      )}
    </div>
  );
}
