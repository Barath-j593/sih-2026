"use client";

import React from "react";
import { Sparkles, Calendar, Layers, ShieldCheck, X } from "lucide-react";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: {
    title: string;
    phase: string;
    description: string;
    architecture: string[];
    governanceImpact: string;
  };
}

export function ComingSoonModal({ isOpen, onClose, feature }: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="rounded-xl bg-saffron-500/20 p-2.5 text-saffron-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-saffron-950/80 px-2 py-0.5 text-xs font-semibold text-saffron-400 border border-saffron-500/40">
                ROADMAP ARCHITECTURE
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {feature.phase}
              </span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">{feature.title}</h3>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-300">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Purpose & Specification</h4>
            <p className="mt-1 text-slate-300 leading-relaxed">{feature.description}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-400" /> Planned Technical Implementation
            </h4>
            <ul className="mt-2 space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              {feature.architecture.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-saffron-400 font-mono font-bold">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-3.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Governance & Anti-Fraud Impact
            </div>
            <p className="mt-1 text-xs text-emerald-200/90 leading-relaxed">
              {feature.governanceImpact}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Close Roadmap Spec
          </button>
        </div>
      </div>
    </div>
  );
}
