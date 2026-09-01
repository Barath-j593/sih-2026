"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Map,
  Network,
  KanbanSquare,
  BellAlert,
  FileCheck,
  Cpu,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Works Explorer", href: "/works", icon: Layers },
    { label: "Geospatial Maps", href: "/maps", icon: Map },
    { label: "MP-IDA Network", href: "/graph", icon: Network },
    { label: "Case Workflow", href: "/cases", icon: KanbanSquare },
    { label: "Risk Alerts", href: "/alerts", icon: AlertTriangle },
    { label: "Audit Reports", href: "/reports", icon: FileCheck },
    { label: "Model Metrics", href: "/model-metrics", icon: Cpu },
    { label: "Future Roadmap", href: "/roadmap", icon: Sparkles },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Core Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-saffron-600/15 text-saffron-400 border border-saffron-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-saffron-400" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Model & Dataset Status Badge at bottom */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px]">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-semibold text-slate-300">Dataset Status</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <p className="mt-1 text-slate-400 font-mono text-[10px]">60,356 Public Works Scored</p>
        <div className="mt-2 text-[10px] text-slate-500 border-t border-slate-800 pt-2 flex justify-between">
          <span>Ensemble AUC:</span>
          <span className="font-bold text-emerald-400 font-mono">0.980</span>
        </div>
      </div>
    </aside>
  );
}
