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
import { MagicCard } from "../../components/ui/MagicCard";

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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-md" />
        <p className="text-xs font-semibold text-slate-600">Loading ML evaluation metrics...</p>
      </div>
    );
  }

  const { confusion_matrix } = metrics;
  const totalPreds = confusion_matrix.tn + confusion_matrix.fp + confusion_matrix.fn + confusion_matrix.tp;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-900 border border-purple-200">
              TRANSPARENT AI BENCHMARKS
            </span>
            <span className="text-xs text-slate-500 font-mono">20,000 Labeled Synthetic Records</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            Model Evaluation & AI Fairness Panel
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Precision, Recall, ROC-AUC curves, Confusion Matrix, and feature importances for the trained multi-signal ensemble.
          </p>
        </div>
      </div>

      {/* 4 Core ML Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MagicCard 
          glowColor="16, 185, 129"
          enableTilt={true}
          enableBorderGlow={true}
          clickEffect={true}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Area Under ROC (AUC)</span>
          <p className="mt-2 text-3xl font-black text-slate-900 font-mono">{metrics.roc_auc.toFixed(3)}</p>
          <p className="mt-1 text-[11px] text-emerald-700">High discrimination power across fraud types</p>
        </MagicCard>

        <MagicCard 
          glowColor="59, 130, 246"
          enableTilt={true}
          enableBorderGlow={true}
          clickEffect={true}
          className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-xs"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Precision</span>
          <p className="mt-2 text-3xl font-black text-slate-900 font-mono">{(metrics.precision * 100).toFixed(1)}%</p>
          <p className="mt-1 text-[11px] text-blue-700">Low false-positive rate for audit efficiency</p>
        </MagicCard>

        <MagicCard 
          glowColor="168, 85, 247"
          enableTilt={true}
          enableBorderGlow={true}
          clickEffect={true}
          className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-xs"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-purple-900">Recall / Sensitivity</span>
          <p className="mt-2 text-3xl font-black text-slate-900 font-mono">{(metrics.recall * 100).toFixed(1)}%</p>
          <p className="mt-1 text-[11px] text-purple-700">Captures ~80% of all injected synthetic anomalies</p>
        </MagicCard>

        <MagicCard 
          glowColor="245, 158, 11"
          enableTilt={true}
          enableBorderGlow={true}
          clickEffect={true}
          className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Overall Accuracy</span>
          <p className="mt-2 text-3xl font-black text-slate-900 font-mono">{(metrics.accuracy * 100).toFixed(1)}%</p>
          <p className="mt-1 text-[11px] text-amber-700">Evaluated on 4,000 holdout test split</p>
        </MagicCard>
      </div>

      {/* Confusion Matrix + Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix */}
        <MagicCard 
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">Holdout Confusion Matrix</h3>
            <p className="text-xs text-slate-500">Test split classification matrix (N = {totalPreds})</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            {/* True Negative */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">True Negative (Normal)</span>
              <p className="text-2xl font-black text-emerald-950 font-mono mt-1">{confusion_matrix.tn}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Correctly classified clean works</p>
            </div>

            {/* False Positive */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">False Positive (False Alarm)</span>
              <p className="text-2xl font-black text-amber-950 font-mono mt-1">{confusion_matrix.fp}</p>
              <p className="text-[10px] text-amber-700 mt-0.5">Normal works flagged as suspicious</p>
            </div>

            {/* False Negative */}
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
              <span className="text-[11px] font-bold text-red-800 uppercase block">False Negative (Missed)</span>
              <p className="text-2xl font-black text-red-950 font-mono mt-1">{confusion_matrix.fn}</p>
              <p className="text-[10px] text-red-700 mt-0.5">Undetected anomalies</p>
            </div>

            {/* True Positive */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <span className="text-[11px] font-bold text-blue-800 uppercase block">True Positive (Fraud Detected)</span>
              <p className="text-2xl font-black text-blue-950 font-mono mt-1">{confusion_matrix.tp}</p>
              <p className="text-[10px] text-blue-700 mt-0.5">Successfully captured anomalies</p>
            </div>
          </div>
        </MagicCard>

        {/* Feature Importance */}
        <MagicCard 
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">XGBoost & Ensemble Feature Weights</h3>
              <p className="text-xs text-slate-500">Relative statistical contribution to risk classification</p>
            </div>

            <div className="space-y-3">
              {metrics.feature_importance.map((f) => (
                <div key={f.feature} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono font-bold text-slate-800">{f.feature}</span>
                    <span className="font-mono font-bold text-amber-700">{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                      style={{ width: `${Math.max(8, f.importance * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Primary drivers: Peer cost deviation (z-score), duplicate density, and agency monopoly ratio.</span>
          </div>
        </MagicCard>
      </div>

      {/* Dataset & Methodology Disclosure Banner */}
      <MagicCard 
        glowColor="59, 130, 246"
        enableBorderGlow={true}
        enableTilt={true}
        className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs"
      >
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">Two-Track Methodology & Public Data Integrity</h4>
            <p className="text-slate-700 leading-relaxed">{metrics.disclosure}</p>
            <p className="text-slate-500 pt-1">
              Synthetic labeled records allow objective, reproducible supervised validation without contaminating real public records.
            </p>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
