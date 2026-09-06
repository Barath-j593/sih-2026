"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCases, updateCaseStatus, addCaseNote } from "../../lib/api";
import { CaseItem } from "../../lib/types";
import { RiskBadge } from "../../components/ui/RiskBadge";
import {
  KanbanSquare,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  User,
  Plus,
  Send,
  X,
  Search,
  Filter,
  ExternalLink,
  FileCheck2,
} from "lucide-react";

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const NOTE_TEMPLATES = [
    "Site physically inspected. Project verified on ground.",
    "Estimate exceeds CPWD Schedule of Rates. Revised sanction issued.",
    "Duplicate proposal confirmed. Tender process cancelled.",
    "Sub-₹5L structuring confirmed. Clubbed into open e-tender.",
  ];

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    setLoading(true);
    try {
      const res = await fetchCases();
      setCases(res);
      if (res.length > 0 && !selectedCase) {
        setSelectedCase(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (
    caseId: string,
    newStatus: "flagged" | "under_review" | "resolved"
  ) => {
    try {
      const updated = await updateCaseStatus(caseId, newStatus);
      setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
      if (selectedCase?.id === caseId) {
        setSelectedCase(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (textToAdd?: string) => {
    const note = (textToAdd || newNoteText).trim();
    if (!selectedCase || !note) return;
    try {
      const updated = await addCaseNote(selectedCase.id, note);
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)));
      setSelectedCase(updated);
      setNewNoteText("");
    } catch (err) {
      console.error(err);
    }
  };

  // Filter cases by search and risk level
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.work_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.district && c.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.state && c.state.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRisk =
      riskFilter === "all" ||
      (c.risk_level && c.risk_level.toLowerCase() === riskFilter.toLowerCase());

    return matchesSearch && matchesRisk;
  });

  const flaggedCases = filteredCases.filter((c) => c.status === "flagged");
  const reviewCases = filteredCases.filter((c) => c.status === "under_review");
  const resolvedCases = filteredCases.filter((c) => c.status === "resolved");

  const totalAtRisk = filteredCases
    .filter((c) => c.status !== "resolved")
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-900 border border-red-200">
              INVESTIGATION WORKFLOW
            </span>
            <span className="text-xs text-slate-500 font-mono">
              MoSPI & District Authority Triage Kanban
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            Case Management Kanban
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Track high-risk work investigations from automated ML detection to field inquiry and statutory resolution.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Capital Under Review</span>
            <span className="font-mono font-bold text-slate-900">
              ₹{(totalAtRisk / 100000).toFixed(1)} Lakhs
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>{flaggedCases.length} Flagged</span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>{reviewCases.length} Under Review</span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>{resolvedCases.length} Resolved</span>
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case title, Work ID, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Risk Level Filter Chips */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase mr-1">Risk:</span>
          {["all", "critical", "high", "medium"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setRiskFilter(lvl)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-all ${
                riskFilter === lvl
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 3 Kanban Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Flagged */}
            <div className="rounded-2xl border border-red-200 bg-red-50/30 p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-red-200/80 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-red-600" /> Flagged ({flaggedCases.length})
                  </span>
                </div>

                <div className="mt-3 space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {flaggedCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        selectedCase?.id === c.id
                          ? "border-red-500 bg-white shadow-md ring-2 ring-red-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900">{c.work_id}</span>
                        <RiskBadge score={c.risk_score} level={c.risk_level || "Medium"} size="sm" />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-800 line-clamp-2">{c.title}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.district}, {c.state}</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{c.amount ? (c.amount / 100000).toFixed(1) + "L" : "N/A"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <Link
                          href={`/works/${c.work_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
                        >
                          Audit ↗
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(c.id, "under_review");
                          }}
                          className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 shadow-2xs"
                        >
                          Start Review →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Under Review */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-600" /> Under Review ({reviewCases.length})
                  </span>
                </div>

                <div className="mt-3 space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {reviewCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        selectedCase?.id === c.id
                          ? "border-amber-500 bg-white shadow-md ring-2 ring-amber-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900">{c.work_id}</span>
                        <RiskBadge score={c.risk_score} level={c.risk_level || "Medium"} size="sm" />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-800 line-clamp-2">{c.title}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.district}, {c.state}</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{c.amount ? (c.amount / 100000).toFixed(1) + "L" : "N/A"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <Link
                          href={`/works/${c.work_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
                        >
                          Audit ↗
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(c.id, "resolved");
                          }}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-2xs"
                        >
                          Resolve ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Resolved */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Resolved ({resolvedCases.length})
                  </span>
                </div>

                <div className="mt-3 space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {resolvedCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        selectedCase?.id === c.id
                          ? "border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900">{c.work_id}</span>
                        <RiskBadge score={c.risk_score} level={c.risk_level || "Medium"} size="sm" />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-800 line-clamp-2">{c.title}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.district}, {c.state}</span>
                        <span className="text-emerald-700 font-bold">Closed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Selected Case Details & Audit Log */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            {selectedCase ? (
              <>
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">{selectedCase.id}</span>
                    <RiskBadge score={selectedCase.risk_score} level={selectedCase.risk_level || "Medium"} size="sm" />
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900">{selectedCase.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{selectedCase.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Work ID</span>
                    <p className="font-mono font-bold text-slate-800">{selectedCase.work_id}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Sanction Amount</span>
                    <p className="font-mono font-bold text-slate-800">
                      ₹{selectedCase.amount ? selectedCase.amount.toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Location</span>
                    <p className="font-bold text-slate-800">{selectedCase.district}, {selectedCase.state}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Current Status</span>
                    <p className="font-bold text-slate-800 capitalize">{selectedCase.status.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Direct Link to Work Detail */}
                <Link
                  href={`/works/${selectedCase.work_id}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all shadow-2xs"
                >
                  <span>Open Full AI Explainability Audit</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>

                {/* Audit Notes Log */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-500" /> Field Inquiry & Audit Log
                  </span>

                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
                    {selectedCase.notes && selectedCase.notes.length > 0 ? (
                      selectedCase.notes.map((n, i) => (
                        <div key={i} className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                          <p className="text-slate-700">{n.text}</p>
                          <span className="mt-1 block text-[10px] text-slate-400 font-mono">
                            {n.author} • {n.timestamp}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No notes recorded for this case yet.</p>
                    )}
                  </div>

                  {/* Rapid Note Templates */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Inspection Templates:</span>
                    <div className="flex flex-wrap gap-1">
                      {NOTE_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAddNote(tmpl)}
                          className="text-left rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700 font-medium transition-colors"
                        >
                          + {tmpl.slice(0, 30)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add Note Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add inquiry note..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      onClick={() => handleAddNote()}
                      className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Select a case from the board to inspect audit details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
