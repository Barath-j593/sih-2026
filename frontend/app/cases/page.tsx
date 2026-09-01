"use client";

import React, { useEffect, useState } from "react";
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
  X
} from "lucide-react";

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

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

  const handleStatusChange = async (caseId: string, newStatus: "flagged" | "under_review" | "resolved") => {
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

  const handleAddNote = async () => {
    if (!selectedCase || !newNoteText.trim()) return;
    try {
      const updated = await addCaseNote(selectedCase.id, newNoteText.trim());
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)));
      setSelectedCase(updated);
      setNewNoteText("");
    } catch (err) {
      console.error(err);
    }
  };

  const flaggedCases = cases.filter((c) => c.status === "flagged");
  const reviewCases = cases.filter((c) => c.status === "under_review");
  const resolvedCases = cases.filter((c) => c.status === "resolved");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-950 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-500/30">
              INVESTIGATION WORKFLOW
            </span>
            <span className="text-xs text-slate-400">MoSPI Audit & Vigilance Triage</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Case Management Kanban</h1>
          <p className="mt-1 text-xs text-slate-400">
            Track high-risk work investigations from automated detection to field inquiry and statutory resolution.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>{flaggedCases.length} Flagged</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>{reviewCases.length} Under Review</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>{resolvedCases.length} Resolved</span>
          </span>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Flagged */}
        <div className="rounded-2xl border border-red-900/40 bg-red-950/10 p-4 flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between border-b border-red-900/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500" />
                <h3 className="text-sm font-bold text-white">Flagged by AI Engine</h3>
              </div>
              <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-xs font-bold text-red-300 font-mono">
                {flaggedCases.length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
              {flaggedCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    selectedCase?.id === c.id
                      ? "border-red-500 bg-red-950/40 shadow-lg ring-1 ring-red-500/50"
                      : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{c.case_number}</span>
                    <RiskBadge score={c.risk_score} size="sm" />
                  </div>
                  <h4 className="mt-1.5 text-xs font-bold text-white line-clamp-2">{c.title}</h4>
                  <p className="mt-1 text-[11px] text-slate-400 truncate">
                    MP: {c.mp_name} • {c.state}
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                    <span className="text-slate-500 font-mono">{c.fraud_type}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(c.id, "under_review");
                      }}
                      className="flex items-center gap-1 text-amber-400 font-bold hover:underline"
                    >
                      <span>Start Inquiry</span> <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Under Review */}
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-4 flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between border-b border-amber-900/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-white">Under Field Inquiry</h3>
              </div>
              <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs font-bold text-amber-300 font-mono">
                {reviewCases.length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
              {reviewCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    selectedCase?.id === c.id
                      ? "border-amber-500 bg-amber-950/40 shadow-lg ring-1 ring-amber-500/50"
                      : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{c.case_number}</span>
                    <RiskBadge score={c.risk_score} size="sm" />
                  </div>
                  <h4 className="mt-1.5 text-xs font-bold text-white line-clamp-2">{c.title}</h4>
                  <p className="mt-1 text-[11px] text-slate-400 truncate">
                    Assigned: {c.assigned_to || "District Vigilance"}
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                    <span className="text-amber-400 font-mono">{c.notes?.length || 1} audit logs</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(c.id, "resolved");
                      }}
                      className="flex items-center gap-1 text-emerald-400 font-bold hover:underline"
                    >
                      <span>Resolve Case</span> <CheckCircle2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Resolved */}
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/10 p-4 flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-900/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-white">Resolved & Cleared</h3>
              </div>
              <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs font-bold text-emerald-300 font-mono">
                {resolvedCases.length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
              {resolvedCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    selectedCase?.id === c.id
                      ? "border-emerald-500 bg-emerald-950/40 shadow-lg ring-1 ring-emerald-500/50"
                      : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{c.case_number}</span>
                    <RiskBadge score={c.risk_score} size="sm" />
                  </div>
                  <h4 className="mt-1.5 text-xs font-bold text-white line-clamp-2">{c.title}</h4>
                  <p className="mt-1 text-[11px] text-emerald-300 truncate">
                    Compliance Audit Completed
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Case Inspection & Notes Drawer */}
      {selectedCase && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-saffron-400">{selectedCase.case_number}</span>
                <RiskBadge score={selectedCase.risk_score} />
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Status: {selectedCase.status.replace("_", " ")}
                </span>
              </div>
              <h3 className="mt-1 text-base font-bold text-white">{selectedCase.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusChange(selectedCase.id, "flagged")}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Mark Flagged
              </button>
              <button
                onClick={() => handleStatusChange(selectedCase.id, "under_review")}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
              >
                Under Review
              </button>
              <button
                onClick={() => handleStatusChange(selectedCase.id, "resolved")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
              >
                Mark Resolved
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Case Details */}
            <div className="lg:col-span-6 space-y-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Audit Overview</p>
                <p className="text-slate-300 leading-relaxed">{selectedCase.description}</p>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                  <span>MP: {selectedCase.mp_name}</span>
                  <span>Jurisdiction: {selectedCase.state}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail & Note Logging */}
            <div className="lg:col-span-6 space-y-3">
              <p className="font-semibold text-slate-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-saffron-400" /> Statutory Audit Trail
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedCase.notes && selectedCase.notes.map((n, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-white">{n.author}</span>
                      <span className="font-mono text-[10px]">{n.timestamp}</span>
                    </div>
                    <p className="mt-1 text-slate-300">{n.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add field audit note or directive..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-saffron-500 focus:outline-none"
                />
                <button
                  onClick={handleAddNote}
                  className="rounded-xl bg-saffron-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-saffron-500 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
