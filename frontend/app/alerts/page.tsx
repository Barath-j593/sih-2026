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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-950 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-500/30">
              REAL-TIME DETECTION
            </span>
            <span className="text-xs text-slate-400">Automated Multi-Signal Triggers</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">System Anomaly Alerts</h1>
          <p className="mt-1 text-xs text-slate-400">
            High-severity notifications triggered by the multi-model ensemble on recent parliamentary sanctions.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
          {["all", "unread", "critical", "high"].map((f) => (
            <button
              key={f}
              onClick={() => setSeverityFilter(f)}
              className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition-all ${
                severityFilter === f
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-saffron-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
            <CheckCheck className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-white">No active alerts for the selected filter.</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border p-4.5 transition-all ${
                alert.is_read
                  ? "border-slate-800/60 bg-slate-950/40 opacity-70"
                  : "border-slate-800 bg-slate-900/80 shadow-md hover:border-slate-700"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <RiskBadge score={alert.risk_score} level={alert.severity} size="sm" />
                    <span className="font-mono text-xs font-bold text-saffron-400">{alert.id}</span>
                    <span className="text-[11px] text-slate-400">• {alert.fraud_type || "Anomaly"}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{alert.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono pt-1">
                    Triggered: {alert.created_at} • State: {alert.state}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Dismiss</span>
                    </button>
                  )}
                  {alert.work_id && (
                    <Link
                      href={`/works/${alert.work_id}`}
                      className="flex items-center gap-1 rounded-lg bg-saffron-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-saffron-500 transition-colors shadow-sm"
                    >
                      <span>Audit Work</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
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
