"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRole } from "../../context/RoleContext";
import { fetchWorks, fetchFilters } from "../../lib/api";
import { WorkItem } from "../../lib/types";
import { RiskBadge } from "../../components/ui/RiskBadge";
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
  LayoutGrid
} from "lucide-react";

export default function WorksExplorerPage() {
  const { role, jurisdiction } = useRole();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "duplicate_groups">("table");

  // Filters
  const [search, setSearch] = useState("");
  const [state, setState] = useState(role === "state" ? jurisdiction : "");
  const [riskLevel, setRiskLevel] = useState("");
  const [fraudType, setFraudType] = useState("");
  const [sortBy, setSortBy] = useState("risk_score");
  const [sortOrder, setSortOrder] = useState("desc");

  // Keep state filter synced with role switcher
  useEffect(() => {
    if (role === "state") {
      setState(jurisdiction);
      setPage(1);
    } else if (role === "district" || role === "mp") {
      setSearch(jurisdiction);
      setPage(1);
    } else if (role === "ministry") {
      setState("");
      setSearch("");
      setPage(1);
    }
  }, [role, jurisdiction]);

  // Options
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadWorks();
  }, [page, search, state, riskLevel, fraudType, sortBy, sortOrder, viewMode]);

  // Group works by duplicate cluster key (MP + Work Title)
  const duplicateClusters = React.useMemo(() => {
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
        ida: items[0]?.ida
      };
    });
  }, [works]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-200">
              AUDIT DATASET
            </span>
            <span className="text-xs text-slate-500 font-mono">60,356 Scored Public Works</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            MPLADS Works Explorer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Multi-signal risk scores, duplicate candidate flags, and explainability traces for every project.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                viewMode === "table"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Table className="h-4 w-4" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode("duplicate_groups")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                viewMode === "duplicate_groups"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Copy className="h-4 w-4" />
              <span>Group Duplicate Clusters</span>
            </button>
          </div>

          <Link
            href="/reports"
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-2xs"
          >
            <Download className="h-4 w-4 text-amber-600" />
            <span>Export CSV</span>
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search work, MP, agency, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">All States ({options.states.length})</option>
              {options.states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={(e) => {
                setRiskLevel(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">All Risk Levels</option>
              <option value="Critical">Critical (&gt;80)</option>
              <option value="High">High (60–80)</option>
              <option value="Medium">Medium (35–60)</option>
              <option value="Low">Low (&lt;35)</option>
            </select>
          </div>

          {/* Fraud Typology Filter */}
          <div>
            <select
              value={fraudType}
              onChange={(e) => {
                setFraudType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">All Typologies</option>
              <option value="overpricing">Cost Escalation</option>
              <option value="duplicate">Duplicate Works</option>
              <option value="ghost_project">Stalled Projects</option>
              <option value="vendor_capture">Vendor Capture</option>
              <option value="structuring">Structuring / Smurfing</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split("-");
                setSortBy(by);
                setSortOrder(ord);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="risk_score-desc">Highest Risk First</option>
              <option value="risk_score-asc">Lowest Risk First</option>
              <option value="allocation_amount-desc">Highest Amount First</option>
              <option value="allocation_amount-asc">Lowest Amount First</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: GROUPED DUPLICATE CLUSTERS VIEW */}
      {viewMode === "duplicate_groups" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Identified Duplicate Recommendation Clusters
            </span>
            <span className="text-xs text-amber-800 font-mono font-bold">
              {duplicateClusters.filter((c) => c.count > 1).length} Multi-Work Clusters Found
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-2" />
              <span>Grouping duplicate recommendations...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateClusters.map((cluster) => (
                <div
                  key={cluster.key}
                  className={`rounded-2xl border p-5 shadow-xs transition-all ${
                    cluster.count > 1
                      ? "border-amber-300 bg-amber-50/40 shadow-sm"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Cluster Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        {cluster.count > 1 ? (
                          <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-bold text-amber-900 flex items-center gap-1">
                            <Copy className="h-3.5 w-3.5" /> Duplicate Cluster ({cluster.count} Identical Works)
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                            Single Recommendation
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {cluster.constituency}, {cluster.state}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{cluster.workTitle}</h3>
                      <p className="text-xs text-slate-600">
                        MP: <strong className="text-slate-900">{cluster.mp_name}</strong> • Agency:{" "}
                        <strong className="text-slate-900">{cluster.ida}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Total Cloned Value</span>
                      <span className="text-lg font-mono font-bold text-amber-700">
                        ₹{(cluster.totalAmount / 100000).toFixed(2)} Lakhs
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        ₹{cluster.amount.toLocaleString()} per work
                      </span>
                    </div>
                  </div>

                  {/* Individual Works Inside this Cluster */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {cluster.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-700">{item.id}</span>
                            <RiskBadge score={item.risk_score} level={item.risk_level} size="sm" />
                          </div>
                          <p className="text-xs text-slate-800 font-medium mt-1 line-clamp-1">
                            {item.work}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Status: {item.status}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            ₹{item.allocation_amount.toLocaleString()}
                          </span>
                          <Link
                            href={`/works/${item.id}`}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-900 hover:text-white px-2 py-0.5 text-[11px] font-bold text-slate-700 transition-all"
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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
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
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                        <span>Loading matching records...</span>
                      </div>
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      No works match the selected filters.
                    </td>
                  </tr>
                ) : (
                  works.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 pl-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {w.id}
                      </td>
                      <td className="py-3.5 max-w-sm">
                        <p className="font-semibold text-slate-900 line-clamp-1">{w.work}</p>
                        {w.risk_reasons && w.risk_reasons.length > 0 && (
                          <p className="text-[11px] text-red-700 line-clamp-1 mt-0.5">
                            • {w.risk_reasons[0]}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        <p className="font-bold text-slate-900">{w.mp_name}</p>
                        <p className="text-[10px] text-slate-400">{w.constituency}, {w.state}</p>
                      </td>
                      <td className="py-3.5 text-slate-500 max-w-[130px] truncate">{w.ida}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{w.allocation_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-center whitespace-nowrap">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-center whitespace-nowrap">
                        <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                      </td>
                      <td className="py-3.5 pr-4 text-center whitespace-nowrap">
                        <Link
                          href={`/works/${w.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white transition-all shadow-2xs"
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
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <div>
              Showing <span className="font-bold text-slate-900">{works.length}</span> of{" "}
              <span className="font-bold text-slate-900">{total.toLocaleString()}</span> works
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="font-mono text-xs font-bold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 shadow-2xs"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
