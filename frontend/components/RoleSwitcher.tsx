"use client";

import React, { useState, useEffect } from "react";
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

import { SearchableSelect, SearchableOption } from "./ui/SearchableSelect";
import { fetchGraphEntities } from "../lib/api";

export function RoleSwitcher() {
  const pathname = usePathname();
  const { role, setRole, jurisdiction, setJurisdiction, availableRoles } = useRole();

  const [districts, setDistricts] = useState<string[]>(DISTRICT_OPTIONS);
  const [mps, setMps] = useState<SearchableOption[]>(
    MP_OPTIONS.map((mp) => ({ label: mp, value: mp }))
  );
  const [states, setStates] = useState<string[]>(STATE_OPTIONS);

  // Dynamically load all nationwide districts and all MPs from database
  useEffect(() => {
    let isMounted = true;
    async function loadAllEntities() {
      try {
        const data = await fetchGraphEntities();
        if (!isMounted) return;
        if (data?.districts && data.districts.length > 0) {
          setDistricts(data.districts);
        }
        if (data?.mps && data.mps.length > 0) {
          setMps(
            data.mps.map((m: any) => ({
              label: typeof m === "string" ? m : m.name,
              value: typeof m === "string" ? m : m.name,
              subtitle:
                typeof m === "object" && m.works_count
                  ? `${m.works_count} works • ₹${((m.total_capital || 0) / 10000000).toFixed(2)} Cr`
                  : undefined,
            }))
          );
        }
        if (data?.states && data.states.length > 0) {
          setStates(data.states);
        }
      } catch (err) {
        console.warn("Could not load dynamic entity options, using fallback", err);
      }
    }
    loadAllEntities();
    return () => {
      isMounted = false;
    };
  }, []);

  // If on landing page "/" or forensic audit ledger "/works", don't show sticky role switcher
  if (pathname === "/" || pathname?.startsWith("/works")) {
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
    <header className="sticky top-0 z-40 w-full border-b border-[#E5DFD3] bg-[#FAF7F2]/95 px-4 py-2 text-xs backdrop-blur-md shadow-[0_2px_10px_rgba(40,20,10,0.03)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Left: Role Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-[#8C5D3B]">
            Active Governance Tier:
          </span>

          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#F0ECE1] p-1 border border-[#E5DFD3]">
            {availableRoles.map((r) => {
              const isActive = role === r.role || role === r.id;
              return (
                <button
                  key={r.role || r.id}
                  onClick={() => handleRoleChange(r.role || r.id)}
                  type="button"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all ${
                    isActive
                      ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs ring-1 ring-[#5A361F] font-bold"
                      : "bg-[#FFFDF9] text-stone-700 border border-[#E5DFD3] hover:bg-white hover:text-stone-900 font-semibold"
                  }`}
                >
                  <span className={isActive ? "text-[#FDE68A]" : "text-[#8C5D3B]"}>
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
          <div className="flex items-center gap-1.5 text-stone-700 font-mono font-bold text-xs">
            <span>📍 Location Scope:</span>
          </div>

          {role === "ministry" && (
            <div className="flex items-center gap-2 rounded-md border border-[#D9D2C5] bg-[#FFFDF9] px-3 py-1.5 font-mono font-bold text-[#1C1917] shadow-xs">
              <span className="text-base">🇮🇳</span>
              <span>All India (15,000 Works | ₹223.1 Cr)</span>
            </div>
          )}

          {role === "state" && (
            <SearchableSelect
              value={jurisdiction}
              onChange={setJurisdiction}
              options={states}
              prefixLabel="State:"
              placeholder="Search state (e.g. Tamil Nadu, Bihar)..."
              icon={<Building2 className="h-3.5 w-3.5" />}
            />
          )}

          {role === "district" && (
            <SearchableSelect
              value={jurisdiction}
              onChange={setJurisdiction}
              options={districts}
              prefixLabel="District:"
              placeholder="Search district (e.g. Karur, Krishnagiri)..."
              icon={<MapPin className="h-3.5 w-3.5" />}
              maxDisplay={120}
            />
          )}

          {role === "mp" && (
            <SearchableSelect
              value={jurisdiction}
              onChange={setJurisdiction}
              options={mps}
              prefixLabel="MP:"
              placeholder="Search MP (e.g. Rudy, Shashi, Kaushalendra)..."
              icon={<UserCheck className="h-3.5 w-3.5" />}
              maxDisplay={120}
            />
          )}

          {/* Active scope indicator badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#065F46]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Scoped: {jurisdiction}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
