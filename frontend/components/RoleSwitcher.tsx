"use client";

import React from "react";
import { useRole } from "../context/RoleContext";
import { Shield, Building2, MapPin, UserCheck, ChevronRight } from "lucide-react";
import { UserRole } from "../lib/types";

export function RoleSwitcher() {
  const { role, setRole, roleConfig, availableRoles } = useRole();

  const getIcon = (r: UserRole) => {
    switch (r) {
      case "ministry":
        return <Shield className="h-4 w-4" />;
      case "state":
        return <Building2 className="h-4 w-4" />;
      case "district":
        return <MapPin className="h-4 w-4" />;
      case "mp":
        return <UserCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Active persona info */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-2.5 w-2.5 items-center justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Persona:
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-saffron-400 shadow-sm">
            {roleConfig.title}
          </span>
          <span className="hidden text-xs text-slate-400 md:inline">
            ({roleConfig.jurisdiction})
          </span>
        </div>

        {/* Role Toggle Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 p-1">
          {availableRoles.map((item) => {
            const isActive = role === item.role;
            return (
              <button
                key={item.role}
                onClick={() => setRole(item.role)}
                title={item.desc}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {getIcon(item.role)}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
