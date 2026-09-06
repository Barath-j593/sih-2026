"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRole } from "../../context/RoleContext";
import {
  fetchDashboard,
  fetchStateChoropleth,
  fetchDistrictDrilldown,
  fetchConstituencyPins,
  fetchNetworkGraph,
} from "../../lib/api";
import { DashboardData } from "../../lib/types";
import { MinistryView } from "../../components/dashboard/MinistryView";
import { StateNodalView } from "../../components/dashboard/StateNodalView";
import { DistrictMagistrateView } from "../../components/dashboard/DistrictMagistrateView";
import { MPConstituencyView } from "../../components/dashboard/MPConstituencyView";

import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  MapPin,
  Building2,
  UserCheck,
  Landmark,
} from "lucide-react";

export default function OperationalDashboardPage() {
  const { role, jurisdiction, roleConfig } = useRole();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map & Graph states
  const [stateChoropleth, setStateChoropleth] = useState<any[]>([]);
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [pinsData, setPinsData] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({
    nodes: [],
    links: [],
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const dash = await fetchDashboard(role, jurisdiction);
        setData(dash);

        // Fetch complementary geospatial and network layers based on active role
        if (role === "ministry") {
          const [st, gr] = await Promise.all([
            fetchStateChoropleth(),
            fetchNetworkGraph(100, 0),
          ]);
          setStateChoropleth(st);
          setGraphData(gr);
        } else if (role === "state") {
          const dist = await fetchDistrictDrilldown(jurisdiction);
          setDistrictData(dist);
        } else if (role === "district") {
          const pins = await fetchConstituencyPins(jurisdiction, undefined, 100);
          setPinsData(pins);
        } else if (role === "mp") {
          const pins = await fetchConstituencyPins(undefined, jurisdiction, 100);
          setPinsData(pins);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [role, jurisdiction]);

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#D97706] border-t-transparent shadow-sm" />
        <div className="text-center space-y-1">
          <p className="text-lg font-editorial font-bold text-[#1C1917]">
            Loading SETU Operational Command Center
          </p>
          <p className="text-xs font-mono text-stone-500">
            Scoping real-time audit telemetry for {jurisdiction} ({role.toUpperCase()})...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-[#FFF5F5] p-8 text-center max-w-xl mx-auto my-12 shadow-sm">
        <AlertTriangle className="mx-auto h-12 w-12 text-rose-600 animate-bounce" />
        <h3 className="mt-3 text-lg font-editorial font-bold text-[#1C1917]">
          Error Connecting to SETU Intelligence Server
        </h3>
        <p className="mt-1 text-xs text-rose-800 font-sans">
          {error || "Could not retrieve live risk telemetry."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-[#6E4529] px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase text-white hover:bg-[#5A361F] transition-all shadow-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const getRoleIcon = () => {
    switch (role) {
      case "ministry":
        return Landmark;
      case "state":
        return Building2;
      case "district":
        return MapPin;
      case "mp":
        return UserCheck;
      default:
        return Landmark;
    }
  };
  const RoleIcon = getRoleIcon();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Navigation back to Public Portal */}
      <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#6E4529] hover:text-[#3D2312] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>← Back to Public Transparency Portal</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-[#8C5D3B] uppercase tracking-wider">
            Live Telemetry Cockpit
          </span>
        </div>
      </div>

      {/* Role-Specific Operational Command Center Views */}
      {role === "ministry" && (
        <MinistryView
          data={data}
          stateChoropleth={stateChoropleth}
          graphData={graphData}
        />
      )}

      {role === "state" && (
        <StateNodalView data={data} districtData={districtData} />
      )}

      {role === "district" && (
        <DistrictMagistrateView data={data} pinsData={pinsData} />
      )}

      {role === "mp" && (
        <MPConstituencyView data={data} pinsData={pinsData} />
      )}
    </div>
  );
}
