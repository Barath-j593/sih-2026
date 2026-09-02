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
  FileCheck,
  Cpu,
  Sparkles,
  AlertTriangle,
  Home
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  // If on landing page "/", don't show sidebar to allow full-width landing experience
  if (pathname === "/") {
    return null;
  }

  const navItems = [
    { label: "Public Portal", href: "/", icon: Home },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Works Explorer", href: "/works", icon: Layers },
    { label: "Geospatial Maps", href: "/maps", icon: Map },
    { label: "Money Flow & Cartels", href: "/graph", icon: Network },
    { label: "Case Workflow", href: "/cases", icon: KanbanSquare },
    { label: "Risk Alerts", href: "/alerts", icon: AlertTriangle },
    { label: "Audit Reports", href: "/reports", icon: FileCheck },
    { label: "Model Metrics", href: "/model-metrics", icon: Cpu },
    { label: "Future Roadmap", href: "/roadmap", icon: Sparkles },
  ];

  return (
    <aside className="w-60 border-r border-slate-200/80 bg-white p-4 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-64px)] shadow-2xs">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          OPERATIONAL COMMAND
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Model & Dataset Status Badge at bottom */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between text-slate-600 font-bold">
          <span>AI Engine</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="text-slate-500 text-[10px]">
          XGBoost + Isolation Forest active on 60,356 records.
        </p>
        <div className="pt-1 border-t border-slate-200/80 flex justify-between text-[10px] text-slate-400">
          <span>Holdout ROC-AUC</span>
          <span className="font-mono font-bold text-slate-700">0.980</span>
        </div>
      </div>
    </aside>
  );
}
