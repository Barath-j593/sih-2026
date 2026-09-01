"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  Download
} from "lucide-react";

export default function WorksExplorerPage() {
  const { role, jurisdiction } = useRole();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
          limit: 25,
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
  }, [page, search, state, riskLevel, fraudType, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-saffron-950 px-2 py-0.5 text-xs font-bold text-saffron-400 border border-saffron-500/30">
              AUDIT DATASET
            </span>
            <span className="text-xs text-slate-400 font-mono">60,356 Scored Public Works</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">MPLADS Works Explorer</h1>
          <p className="mt-1 text-xs text-slate-400">
            Multi-signal risk scores, duplicate candidate flags, and explainability traces for every project.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Download className="h-4 w-4 text-saffron-400" />
            <span>Export CSV</span>
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search work, MP, agency, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-saffron-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-saffron-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-saffron-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-saffron-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-saffron-500 focus:outline-none"
            >
              <option value="risk_score-desc">Highest Risk First</option>
              <option value="risk_score-asc">Lowest Risk First</option>
              <option value="allocation_amount-desc">Highest Amount First</option>
              <option value="allocation_amount-asc">Lowest Amount First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Works Data Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-saffron-500 border-t-transparent" />
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
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 pl-4 font-mono font-bold text-saffron-400 whitespace-nowrap">
                      {w.id}
                    </td>
                    <td className="py-3.5 max-w-sm">
                      <p className="font-semibold text-white line-clamp-1">{w.work}</p>
                      {w.risk_reasons && w.risk_reasons.length > 0 && (
                        <p className="text-[11px] text-red-300 line-clamp-1 mt-0.5">
                          • {w.risk_reasons[0]}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      <p className="font-bold text-white">{w.mp_name}</p>
                      <p className="text-[10px] text-slate-500">{w.constituency}, {w.state}</p>
                    </td>
                    <td className="py-3.5 text-slate-400 max-w-[130px] truncate">{w.ida}</td>
                    <td className="py-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                      ₹{w.allocation_amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 pr-4 text-center whitespace-nowrap">
                      <Link
                        href={`/works/${w.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-saffron-400 hover:bg-saffron-600 hover:text-white transition-all shadow-sm"
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
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{works.length}</span> of{" "}
            <span className="font-bold text-white">{total.toLocaleString()}</span> works
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="font-mono text-xs">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
