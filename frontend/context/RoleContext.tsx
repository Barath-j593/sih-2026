"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "../lib/types";

export interface RoleConfig {
  role: UserRole;
  title: string;
  name: string;
  jurisdiction: string;
  department: string;
  badgeColor: string;
}

export interface RoleOption {
  id: UserRole;
  role: UserRole;
  name: string;
  label: string;
  desc: string;
  defaultJurisdiction: string;
}

const DEFAULT_ROLES: Record<UserRole, RoleConfig> = {
  ministry: {
    role: "ministry",
    title: "Central Monitoring Directorate",
    name: "Ministry of Statistics & Programme Implementation (MoSPI)",
    jurisdiction: "All India",
    department: "Government of India",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
  },
  state: {
    role: "state",
    title: "State Nodal Authority",
    name: "Planning & Development Department",
    jurisdiction: "Bihar",
    department: "Government of Bihar",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
  },
  district: {
    role: "district",
    title: "District Authority / Collector",
    name: "District Magistrate (Darbhanga)",
    jurisdiction: "Darbhanga",
    department: "District Collectorate, Darbhanga",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  mp: {
    role: "mp",
    title: "Member of Parliament",
    name: "Mr Gopal Jee Thakur (MP)",
    jurisdiction: "Mr Gopal Jee Thakur",
    department: "Lok Sabha Secretariat (Darbhanga)",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
  },
};

const AVAILABLE_ROLES: RoleOption[] = [
  {
    id: "ministry",
    role: "ministry",
    name: "MoSPI (National)",
    label: "MoSPI (National)",
    desc: "National oversight, State risk choropleth & inter-state equity",
    defaultJurisdiction: "All India",
  },
  {
    id: "state",
    role: "state",
    name: "State Nodal Authority",
    label: "State Nodal Authority",
    desc: "District drill-down, IDA monopolies & cross-constituency audit",
    defaultJurisdiction: "Bihar",
  },
  {
    id: "district",
    role: "district",
    name: "District Authority (DM)",
    label: "District Authority (DM)",
    desc: "Ground inspections, pending approvals & high-risk work triage",
    defaultJurisdiction: "Darbhanga",
  },
  {
    id: "mp",
    role: "mp",
    name: "Member of Parliament",
    label: "Member of Parliament (MP)",
    desc: "Constituency fund tracker, transparency score & stall alert",
    defaultJurisdiction: "Mr Gopal Jee Thakur",
  },
];

interface RoleContextType {
  role: UserRole;
  roleConfig: RoleConfig;
  jurisdiction: string;
  setRole: (r: UserRole, customJurisdiction?: string) => void;
  setJurisdiction: (j: string) => void;
  availableRoles: RoleOption[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("ministry");
  const [jurisdiction, setJurisdictionState] = useState<string>("All India");

  // Load from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("setu_user_role") as UserRole;
    const savedJur = localStorage.getItem("setu_jurisdiction");
    if (savedRole && DEFAULT_ROLES[savedRole]) {
      setRoleState(savedRole);
      setJurisdictionState(savedJur || DEFAULT_ROLES[savedRole].jurisdiction);
    }
  }, []);

  const setRole = (newRole: UserRole, customJurisdiction?: string) => {
    setRoleState(newRole);
    const newJur = customJurisdiction || DEFAULT_ROLES[newRole]?.jurisdiction || "All India";
    setJurisdictionState(newJur);
    try {
      localStorage.setItem("setu_user_role", newRole);
      localStorage.setItem("setu_jurisdiction", newJur);
    } catch {}
  };

  const setJurisdiction = (newJur: string) => {
    setJurisdictionState(newJur);
    try {
      localStorage.setItem("setu_jurisdiction", newJur);
    } catch {}
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        roleConfig: { ...(DEFAULT_ROLES[role] || DEFAULT_ROLES.ministry), jurisdiction },
        jurisdiction,
        setRole,
        setJurisdiction,
        availableRoles: AVAILABLE_ROLES,
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

