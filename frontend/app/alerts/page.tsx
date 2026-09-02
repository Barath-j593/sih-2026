"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAlerts, markAlertAsRead } from "../../lib/api";
import { AlertItem } from "../../lib/types";
import { RiskBadge } from "../../components/ui/RiskBadge";
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ExternalLink,
  Filter,
  Check
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const res = await fetchAlerts();
      setAlerts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertAsRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = alerts.filter((a) => {
    if (severityFilter === "all") return true;
    if (severityFilter === "unread") return !a.is_read;
    return a.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-900 border border-red-200">
              REAL-TIME DETECTION
            </span>
            <span className="text-xs text-slate-500 font-mono">Automated Multi-Signal Triggers</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            System Anomaly Alerts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            High-severity notifications triggered by the multi-model ensemble on recent parliamentary sanctions.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
          {["all", "unread", "critical", "high"].map((f) => (
            <button
              key={f}
              onClick={() => setSeverityFilter(f)}
              className={`rounded-lg px-3 py-1.5 font-bold capitalize transition-all ${
                severityFilter === f
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex h-48 items-center justify-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent shadow-md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
            <CheckCheck className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-800">No active alerts for the selected filter.</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                alert.is_read
                  ? "border-slate-200 bg-white opacity-85"
                  : "border-red-200 bg-red-50/25 ring-1 ring-red-500/20"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-xl p-2.5 ${
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{alert.work_id}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          alert.severity === "critical"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : "Live Trigger"}
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{alert.title}</h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{alert.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/works/${alert.work_id}`}
                    className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    <span>Inspect Work</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Dismiss</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
