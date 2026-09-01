"use client";

import React, { useEffect, useState } from "react";
import { fetchModelMetrics } from "../../lib/api";
import { ModelMetricsData } from "../../lib/types";
import {
  Cpu,
  ShieldCheck,
  Activity,
  Award,
  Info,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid
} from "recharts";

export default function ModelMetricsPage() {
  const [metrics, setMetrics] = useState<ModelMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
        <p className="text-sm font-semibold text-slate-400">Loading ML evaluation metrics...</p>
      </div>
    );
  }

  const { confusion_matrix } = metrics;
  const totalPreds = confusion_matrix.tn + confusion_matrix.fp + confusion_matrix.fn + confusion_matrix.tp;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-950 px-2 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/30">
              TRANSPARENT AI BENCHMARKS
            </span>
            <span className="text-xs text-slate-400 font-mono">20,000 Labeled Synthetic Records</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Model Evaluation & Fairness Panel</h1>
          <p className="mt-1 text-xs text-slate-400">
            Precision, Recall, ROC-AUC curves, Confusion Matrix, and feature importances for the trained multi-signal ensemble.
          </p>
        </div>
      </div>

      {/* 4 Core ML Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Area Under ROC (AUC)</span>
          <p className="mt-2 text-3xl font-black text-white font-mono">{metrics.roc_auc.toFixed(3)}</p>
          <p className="mt-1 text-[11px] text-emerald-300">High discrimination power across fraud types</p>
        </div>

        <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Precision</span>
          <p className="mt-2 text-3xl font-black text-white font-mono">{(metrics.precision * 100).toFixed(1)}%</p>
          <p className="mt-1 text-[11px] text-blue-300">Low false-positive rate for audit efficiency</p>
        </div>

        <div className="rounded-2xl border border-purple-900/40 bg-purple-950/20 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Recall / Sensitivity</span>
          <p className="mt-2 text-3xl font-black text-white font-mono">{(metrics.recall * 100).toFixed(1)}%</p>
          <p className="mt-1 text-[11px] text-purple-300">Captures ~80% of all injected synthetic anomalies</p>
        </div>

        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Overall Accuracy</span>
          <p className="mt-2 text-3xl font-black text-white font-mono">{(metrics.accuracy * 100).toFixed(1)}%</p>
          <p className="mt-1 text-[11px] text-amber-300">Evaluated on 4,000 holdout test split</p>
        </div>
      </div>

      {/* Confusion Matrix + Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-base font-bold text-white">Holdout Confusion Matrix</h3>
            <p className="text-xs text-slate-400">Test split classification matrix (N = {totalPreds})</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            {/* True Negative */}
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-4">
              <span className="text-[11px] font-bold text-emerald-400 uppercase block">True Negative (Normal)</span>
              <p className="text-2xl font-black text-white font-mono mt-1">{confusion_matrix.tn}</p>
              <p className="text-[10px] text-emerald-300 mt-0.5">Correctly classified clean works</p>
            </div>

            {/* False Positive */}
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/30 p-4">
              <span className="text-[11px] font-bold text-amber-400 uppercase block">False Positive (False Alarm)</span>
              <p className="text-2xl font-black text-white font-mono mt-1">{confusion_matrix.fp}</p>
              <p className="text-[10px] text-amber-300 mt-0.5">Normal works flagged as suspicious</p>
            </div>

            {/* False Negative */}
            <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4">
              <span className="text-[11px] font-bold text-red-400 uppercase block">False Negative (Missed)</span>
              <p className="text-2xl font-black text-white font-mono mt-1">{confusion_matrix.fn}</p>
              <p className="text-[10px] text-red-300 mt-0.5">Undetected anomalies</p>
            </div>

            {/* True Positive */}
            <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/30 p-4">
              <span className="text-[11px] font-bold text-cyan-400 uppercase block">True Positive (Fraud Detected)</span>
              <p className="text-2xl font-black text-white font-mono mt-1">{confusion_matrix.tp}</p>
              <p className="text-[10px] text-cyan-300 mt-0.5">Successfully captured anomalies</p>
            </div>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">XGBoost & Ensemble Feature Weights</h3>
              <p className="text-xs text-slate-400">Relative statistical contribution to risk classification</p>
            </div>

            <div className="space-y-3">
              {metrics.feature_importance.map((f) => (
                <div key={f.feature} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono font-bold text-slate-300">{f.feature}</span>
                    <span className="font-mono text-saffron-400">{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${Math.max(8, f.importance * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Primary drivers: Peer cost deviation (z-score), duplicate density, and agency monopoly ratio.</span>
          </div>
        </div>
      </div>

      {/* Dataset & Methodology Disclosure Banner */}
      <div className="rounded-2xl border border-blue-900/30 bg-blue-950/20 p-5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-white text-sm">Two-Track Methodology & Public Data Integrity</h4>
            <p className="text-slate-300 leading-relaxed">{metrics.disclosure}</p>
            <p className="text-slate-400 pt-1">
              Synthetic labeled records allow objective, reproducible supervised validation without contaminating real public records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
