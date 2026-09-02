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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 border border-amber-200">
                ROADMAP ARCHITECTURE
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Calendar className="h-3 w-3" /> {feature.phase}
              </span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{feature.title}</h3>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Purpose & Specification</h4>
            <p className="mt-1 text-slate-600 leading-relaxed text-xs">{feature.description}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-600" /> Planned Technical Implementation
            </h4>
            <ul className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              {feature.architecture.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-amber-600 font-mono font-bold">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Governance & Anti-Fraud Impact
            </div>
            <p className="mt-1 text-xs text-emerald-900 leading-relaxed">
              {feature.governanceImpact}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Close Roadmap Spec
          </button>
        </div>
      </div>
    </div>
  );
}
