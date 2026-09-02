"use client";

import React from "react";
import { useRole } from "../context/RoleContext";
import { usePathname } from "next/navigation";
import { Shield, Building2, MapPin, UserCheck, ChevronDown, Check } from "lucide-react";
import { UserRole } from "../lib/types";

const STATE_OPTIONS = [
  "Bihar",
  "Rajasthan",
  "Uttar Pradesh",
  "Odisha",
  "Andhra Pradesh",
  "Karnataka",
  "Telangana",
  "Uttarakhand",
  "Jharkhand",
  "Tamil Nadu",
  "Punjab",
  "Haryana",
  "Assam",
  "Madhya Pradesh",
  "Gujarat",
  "Himachal Pradesh",
  "Meghalaya",
  "West Bengal",
  "Kerala",
  "Jammu And Kashmir",
  "Arunachal Pradesh",
  "Chhattisgarh",
  "Maharashtra",
  "Tripura",
  "Delhi",
];

const DISTRICT_OPTIONS = [
  "DARBHANGA",
  "DHOLPUR",
  "KARAULI-DHOLPUR(SC)",
  "NALANDA",
  "PATNA",
  "ALMORA(SC)",
  "PEDDAPALLE",
  "ONGOLE",
  "ZAHIRABAD",
  "SAMBALPUR",
  "DUMKA(ST)",
  "RAJMAHAL(ST)",
  "TEHRI GARHWAL",
  "RAJAMPET",
  "KALAHANDI",
  "JAGATSINGHPUR(SC)",
  "ARUNACHAL WEST",
  "ATTINGAL",
  "ANANTNAG",
  "FIROZPUR",
  "SHILLONG",
  "LUDHIANA",
  "MANDI",
  "NAINITAL UDHAM SINGH NAG.",
  "JAIPUR",
  "VARANASI",
  "PUNE",
];

const MP_OPTIONS = [
  "Mr Gopal Jee Thakur",
  "Manoj Rajoria",
  "Ajay Tamta",
  "Venkatesh Netha Borlakunta",
  "Magunta Sreenivasulu Reddy",
  "Bheemrao Baswanthrao Patil",
  "Nitesh Ganga Deb",
  "Sunil Soren",
  "Vijay Kumar Hansdak",
  "Mala Rajya Laxmi Shah",
  "Midhun Reddy",
  "Smt Jaya Bachchan",
  "Basanta Kumar Panda",
  "Smt Rajashree Mallick",
  "Kiren Rijiju",
  "Adv Adoor Prakash",
  "Hasnain Masoodi",
  "Sukhbir Singh Badal",
  "Vincent H Pala",
  "Ravneet Singh",
  "Geeta Kora",
  "Smt Pratibha Singh",
  "Ajay Bhatt",
  "Kaushalendra Kumar",
];

export function RoleSwitcher() {
  const pathname = usePathname();
  const { role, setRole, jurisdiction, setJurisdiction, availableRoles } = useRole();

  // If on landing page "/", don't show sticky role switcher
  if (pathname === "/") {
    return null;
  }

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 px-4 py-2 text-xs backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Left: Role Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
            Active Governance Tier:
          </span>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            {availableRoles.map((r) => {
              const isActive = role === r.role || role === r.id;
              return (
                <button
                  key={r.role || r.id}
                  onClick={() => handleRoleChange(r.role || r.id)}
                  type="button"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                      : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={isActive ? "text-amber-400" : "text-slate-500"}>
                    {getIcon(r.role || r.id)}
                  </span>
                  <span>{r.label || r.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Dynamic Place / Entity Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
            <span>📍 Location Scope:</span>
          </div>

          {role === "ministry" && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 font-bold text-slate-800 shadow-2xs">
              <span className="text-base">🇮🇳</span>
              <span>All India (60,356 Works | ₹906.2 Cr)</span>
            </div>
          )}

          {role === "state" && (
            <div className="relative">
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-9 text-xs font-bold text-slate-900 shadow-2xs hover:border-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
              >
                {STATE_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    🏛️ State: {st}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            </div>
          )}

          {role === "district" && (
            <div className="relative">
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-9 text-xs font-bold text-slate-900 shadow-2xs hover:border-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
              >
                {DISTRICT_OPTIONS.map((dst) => (
                  <option key={dst} value={dst}>
                    📍 District: {dst}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            </div>
          )}

          {role === "mp" && (
            <div className="relative">
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-9 text-xs font-bold text-slate-900 shadow-2xs hover:border-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
              >
                {MP_OPTIONS.map((mp) => (
                  <option key={mp} value={mp}>
                    👤 MP: {mp}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            </div>
          )}

          {/* Active scope indicator badge */}
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Scoped: {jurisdiction}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
