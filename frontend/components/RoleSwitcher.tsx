"use client";

import React from "react";
import { useRole } from "../context/RoleContext";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const { role, setRole, jurisdiction, setJurisdiction, roleConfig, availableRoles } = useRole();

  // If on landing page "/", don't show sticky role switcher
  if (pathname === "/") {
    return null;
  }

  const getIcon = (r: UserRole) => {
    switch (r) {
      case "ministry":
        return <Shield className="h-3.5 w-3.5" />;
      case "state":
        return <Building2 className="h-3.5 w-3.5" />;
      case "district":
        return <MapPin className="h-3.5 w-3.5" />;
      case "mp":
        return <UserCheck className="h-3.5 w-3.5" />;
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "ministry") {
      setJurisdiction("All India");
    } else if (newRole === "state") {
      setJurisdiction("Bihar");
    } else if (newRole === "district") {
      setJurisdiction("DARBHANGA");
    } else if (newRole === "mp") {
      setJurisdiction("Mr Gopal Jee Thakur");
    }
  };

  return (
    <div className="sticky top-0 z-40 w-full border-b border-slate-200 bg-slate-50/95 px-4 py-2 text-xs backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Left: Role Switcher Buttons */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
            ACTIVE GOVERNANCE TIER:
          </span>

          <div className="flex items-center gap-1 rounded-xl bg-slate-200/80 p-1">
            {availableRoles.map((r) => {
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleRoleChange(r.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {getIcon(r.id)}
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Dynamic Place / Entity Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Scoping:</span>

          {role === "ministry" && (
            <span className="rounded-lg bg-white border border-slate-200 px-3 py-1 font-bold text-slate-800 shadow-2xs">
              🇮🇳 All India (15,000 Works | ₹906.21 Cr)
            </span>
          )}

          {role === "state" && (
            <div className="relative">
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-1 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:border-slate-800 focus:outline-none cursor-pointer"
              >
                {STATE_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    State: {st}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}

          {role === "district" && (
            <div className="relative">
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-1 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:border-slate-800 focus:outline-none cursor-pointer"
              >
                {DISTRICT_OPTIONS.map((dst) => (
                  <option key={dst} value={dst}>
                    District: {dst}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}

          {role === "mp" && (
            <div className="relative">
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-1 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:border-slate-800 focus:outline-none cursor-pointer"
              >
                {MP_OPTIONS.map((mp) => (
                  <option key={mp} value={mp}>
                    MP: {mp}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
