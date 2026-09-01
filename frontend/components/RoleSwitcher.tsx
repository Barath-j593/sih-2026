"use client";

import React from "react";
import { useRole } from "../context/RoleContext";
import { Shield, Building2, MapPin, UserCheck, ChevronDown } from "lucide-react";
import { UserRole } from "../lib/types";

const STATE_OPTIONS = [
  "Bihar",
  "Rajasthan",
  "Uttar Pradesh",
  "Maharashtra",
  "Madhya Pradesh",
  "West Bengal",
  "Tamil Nadu",
  "Karnataka",
  "Gujarat",
  "Odisha",
  "Assam",
  "Punjab",
  "Haryana",
  "Chhattisgarh",
  "Jharkhand",
  "Kerala",
  "Delhi",
  "Uttarakhand",
  "Andhra Pradesh",
  "Telangana"
];

const DISTRICT_OPTIONS = [
  "DARBHANGA",
  "DHOLPUR",
  "BHADOHI",
  "JALORE",
  "JAIPUR",
  "PATNA",
  "GAYA",
  "KARAULI",
  "MUZAFFARPUR",
  "VARANASI",
  "PUNE",
  "NAGPUR"
];

const MP_OPTIONS = [
  "Mr Gopal Jee Thakur",
  "Manoj Rajoria",
  "Smt Jaya Bachchan",
  "SHRI Rajendra Gehlot",
  "Ram Charan Bohra"
];

export function RoleSwitcher() {
  const { role, setRole, jurisdiction, setJurisdiction, roleConfig, availableRoles } = useRole();

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
        {/* Active persona info + Dynamic Place Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* Place Selector Dropdown based on Role */}
          {role === "ministry" && (
            <span className="rounded border border-blue-900/60 bg-blue-950/80 px-2 py-0.5 text-xs font-mono font-bold text-blue-300">
              National (All India)
            </span>
          )}

          {role === "state" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">State:</span>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="rounded-lg border border-amber-500/50 bg-slate-900 px-2.5 py-1 text-xs font-bold text-amber-300 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {STATE_OPTIONS.map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-white">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === "district" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">District:</span>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="rounded-lg border border-emerald-500/50 bg-slate-900 px-2.5 py-1 text-xs font-bold text-emerald-300 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {DISTRICT_OPTIONS.map((dist) => (
                  <option key={dist} value={dist} className="bg-slate-900 text-white">
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === "mp" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">MP:</span>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="rounded-lg border border-purple-500/50 bg-slate-900 px-2.5 py-1 text-xs font-bold text-purple-300 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                {MP_OPTIONS.map((mp) => (
                  <option key={mp} value={mp} className="bg-slate-900 text-white">
                    {mp}
                  </option>
                ))}
              </select>
            </div>
          )}
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
