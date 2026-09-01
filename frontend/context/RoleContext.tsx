"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "../lib/types";

interface RoleConfig {
  role: UserRole;
  title: string;
  name: string;
  jurisdiction: string;
  department: string;
  badgeColor: string;
}

const DEFAULT_ROLES: Record<UserRole, RoleConfig> = {
  ministry: {
    role: "ministry",
    title: "Central Monitoring Directorate",
    name: "Ministry of Statistics & Programme Implementation (MoSPI)",
    jurisdiction: "National",
    department: "Government of India",
    badgeColor: "bg-blue-900/60 text-blue-300 border-blue-500/40",
  },
  state: {
    role: "state",
    title: "State Nodal Authority",
    name: "Planning & Development Department",
    jurisdiction: "Bihar",
    department: "Government of Bihar",
    badgeColor: "bg-amber-900/60 text-amber-300 border-amber-500/40",
  },
  district: {
    role: "district",
    title: "District Authority / Collector",
    name: "District Magistrate (DARBHANGA)",
    jurisdiction: "DARBHANGA",
    department: "District Collectorate, Darbhanga",
    badgeColor: "bg-emerald-900/60 text-emerald-300 border-emerald-500/40",
  },
  mp: {
    role: "mp",
    title: "Member of Parliament",
    name: "Mr Gopal Jee Thakur (MP)",
    jurisdiction: "Mr Gopal Jee Thakur",
    department: "Lok Sabha Secretariat (Darbhanga)",
    badgeColor: "bg-purple-900/60 text-purple-300 border-purple-500/40",
  },
};

interface RoleContextType {
  role: UserRole;
  roleConfig: RoleConfig;
  jurisdiction: string;
  setRole: (r: UserRole) => void;
  setJurisdiction: (j: string) => void;
  availableRoles: Array<{ role: UserRole; label: string; desc: string }>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("ministry");
  const [jurisdiction, setJurisdictionState] = useState<string>("National");

  // Load from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("setu_user_role") as UserRole;
    const savedJur = localStorage.getItem("setu_jurisdiction");
    if (savedRole && DEFAULT_ROLES[savedRole]) {
      setRoleState(savedRole);
      setJurisdictionState(savedJur || DEFAULT_ROLES[savedRole].jurisdiction);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    const newJur = DEFAULT_ROLES[newRole].jurisdiction;
    setJurisdictionState(newJur);
    localStorage.setItem("setu_user_role", newRole);
    localStorage.setItem("setu_jurisdiction", newJur);
  };

  const setJurisdiction = (newJur: string) => {
    setJurisdictionState(newJur);
    localStorage.setItem("setu_jurisdiction", newJur);
  };

  const availableRoles = [
    { role: "ministry" as UserRole, label: "Ministry (MoSPI)", desc: "National oversight, State risk choropleth & inter-state equity" },
    { role: "state" as UserRole, label: "State Nodal Authority", desc: "District drill-down, IDA monopolies & cross-constituency audit" },
    { role: "district" as UserRole, label: "District Authority (DM)", desc: "Ground inspections, pending approvals & high-risk work triage" },
    { role: "mp" as UserRole, label: "Member of Parliament (MP)", desc: "Constituency fund tracker, transparency score & stall alert" },
  ];

  return (
    <RoleContext.Provider
      value={{
        role,
        roleConfig: { ...DEFAULT_ROLES[role], jurisdiction },
        jurisdiction,
        setRole,
        setJurisdiction,
        availableRoles,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within a RoleProvider");
  return context;
}
