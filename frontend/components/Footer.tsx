"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#031326] text-white border-t border-slate-800">
      {/* Top CTA Banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-1 text-xs font-mono font-semibold text-slate-300 shadow-sm">
          <span>🏛️ SMART INDIA HACKATHON 2026 • PROBLEM STATEMENT PS-36502</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          BUILDING A MORE <br />
          <span className="text-amber-500">ACCOUNTABLE MPLADS.</span>
        </h2>

        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
          From project recommendation to physical completion, SETU helps authorities see risk earlier,
          understand evidence faster and act with confidence.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-slate-900 hover:bg-slate-100 transition-all shadow-md group"
          >
            <span>OPEN SETU DASHBOARD</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <a
            href="#how-it-works"
            className="rounded-full border border-slate-700 bg-slate-900/80 px-6 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-xs"
          >
            EXPLORE THE SYSTEM
          </a>
        </div>

        <p className="text-[11px] text-slate-500 font-mono pt-4">
          Decoupled frontend simulation • Ministry of Statistics & Programme Implementation (MoSPI)
        </p>
      </div>

      {/* 4 Column Directory Footer */}
      <div className="border-t border-slate-800/80 bg-[#020d1c] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-xs">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-900 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
                </svg>
              </div>
              <span className="text-base font-black tracking-tight text-white">SETU</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              AI-Powered Risk Intelligence & Investigation Decision Support for MPLADS.
            </p>
            <div className="pt-2">
              <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-400">
                GOVERNMENT OF INDIA • MoSPI
              </span>
            </div>
          </div>

          {/* Col 2: Operational Cockpits */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">OPERATIONAL COCKPITS</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition-colors">
                  Member of Parliament (MP) View
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition-colors">
                  District Command Centre
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition-colors">
                  State Nodal Authority (SNA)
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition-colors">
                  Ministry / DISHA National Centre
                </Link>
              </li>
              <li>
                <Link href="/works/W-10002" className="hover:text-amber-400 transition-colors">
                  Project Digital Twin (W-10002)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Audits & Evidence */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">AUDITS & EVIDENCE</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>
                <Link href="/alerts" className="hover:text-amber-400 transition-colors">
                  Active Risk Alerts Feed
                </Link>
              </li>
              <li>
                <Link href="/cases" className="hover:text-amber-400 transition-colors">
                  Case Investigation Workspace
                </Link>
              </li>
              <li>
                <Link href="/#capsules" className="hover:text-amber-400 transition-colors">
                  Codified Guidelines Repository
                </Link>
              </li>
              <li>
                <Link href="/graph" className="hover:text-amber-400 transition-colors">
                  Contractor Cartel Profiler
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-amber-400 transition-colors">
                  Official Audit PDF Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Institutional Governance */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">INSTITUTIONAL GOVERNANCE</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Compliant with Government of India Guidelines for Websites (GIGW) and WCAG 2.1 AA accessibility standards.
            </p>
            <ul className="space-y-1 text-[11px] text-slate-400 pt-1">
              <li className="flex items-center gap-1.5">
                <span className="text-amber-400">•</span>
                <span>Human Decisions Authoritative</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-amber-400">•</span>
                <span>Non-Overriding Advisory AI</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-amber-400">•</span>
                <span>Deterministic Audit Ledger</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-900 bg-[#010710] py-4 text-[11px] text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          <span>© 2026 Government of India • Ministry of Statistics and Programme Implementation (MoSPI).</span>
          <div className="flex items-center gap-4">
            <a href="#pipeline" className="hover:text-slate-400 transition-colors">Design System</a>
            <span>•</span>
            <a href="#how-it-works" className="hover:text-slate-400 transition-colors">Architecture</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
