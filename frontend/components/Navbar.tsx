"use client";

import React from "react";
import Link from "next/link";
import { useRole } from "../context/RoleContext";
import { ShieldAlert, Bell, Download, FileText, Search, Activity } from "lucide-react";

export function Navbar() {
  const { roleConfig } = useRole();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950 px-4 lg:px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Government Emblem Symbol */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 via-amber-600 to-blue-900 p-0.5 shadow-lg shadow-saffron-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950 font-black text-saffron-400">
                <Activity className="h-5 w-5 text-saffron-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white group-hover:text-saffron-400 transition-colors">
                  SETU
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest border border-slate-700">
                  SIH26102
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                MPLADS AI Anomaly & Fraud Detection Directorate
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Search info */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 w-72">
          <Search className="h-4 w-4 text-slate-500" />
          <span>Search works, MPs, IDAs, or states...</span>
        </div>

        {/* Right Action Icons & User Info */}
        <div className="flex items-center gap-3">
          {/* Quick PDF Report download */}
          <Link
            href="/reports"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-saffron-400" />
            <span>Audit Report</span>
          </Link>

          {/* Alerts Bell */}
          <Link
            href="/alerts"
            className="relative rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
              7
            </span>
          </Link>

          {/* User Badge */}
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron-500/20 text-xs font-bold text-saffron-400 border border-saffron-500/30">
              {roleConfig.role.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-white leading-tight">{roleConfig.name}</p>
              <p className="text-[10px] text-slate-400">{roleConfig.department}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
