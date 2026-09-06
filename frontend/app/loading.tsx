import React from "react";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-5 px-4 text-center">
      {/* SETU Pulsing Emblem */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 animate-ping rounded-full bg-amber-500/20" />
        <div className="absolute h-16 w-16 animate-pulse rounded-full bg-amber-500/30" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-2 text-white shadow-xl ring-2 ring-amber-500/40">
          <span className="text-sm font-black tracking-widest text-amber-400">SETU</span>
        </div>
      </div>

      {/* Loading Typography */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-bold text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          SETU MPLADS INTELLIGENCE
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Synchronizing Real-Time Audit Telemetry
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Loading parliamentary recommendations, fund flows, and anomaly fusion models from the official SETU intelligence layer.
        </p>
      </div>

      {/* Spinner bar */}
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-full origin-left animate-pulse bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
      </div>
    </div>
  );
}
