"use client";

import React, { useEffect, useState } from "react";
import { useRole } from "../../context/RoleContext";
import { fetchStateChoropleth, fetchDistrictDrilldown, fetchConstituencyPins } from "../../lib/api";
import { StateChoroplethMap } from "../../components/maps/StateChoroplethMap";
import { DistrictDrilldownMap } from "../../components/maps/DistrictDrilldownMap";
import { ConstituencyMap } from "../../components/maps/ConstituencyMap";
import { Map, Layers, Building2, MapPin } from "lucide-react";

export default function MapsPage() {
  const { role, jurisdiction } = useRole();
  const [activeTab, setActiveTab] = useState<"national" | "district" | "constituency">(
    role === "state" ? "district" : (role === "district" || role === "mp") ? "constituency" : "national"
  );
  const [stateData, setStateData] = useState<any[]>([]);
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [pinsData, setPinsData] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState(role === "state" ? jurisdiction : "Bihar");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "state") {
      setSelectedState(jurisdiction);
      setActiveTab("district");
    } else if (role === "district" || role === "mp") {
      setActiveTab("constituency");
    } else {
      setActiveTab("national");
    }
  }, [role, jurisdiction]);

  useEffect(() => {
    async function loadMaps() {
      setLoading(true);
      try {
        const [st, dist, pins] = await Promise.all([
          fetchStateChoropleth(),
          fetchDistrictDrilldown(selectedState),
          fetchConstituencyPins(undefined, undefined, 100),
        ]);
        setStateData(st);
        setDistrictData(dist);
        setPinsData(pins);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMaps();
  }, [selectedState]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-950 px-2 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
              GEOSPATIAL INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400">All India Parliamentary Mapping</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Geospatial Risk Visualizer</h1>
          <p className="mt-1 text-xs text-slate-400">
            Multi-tiered spatial resolution from National State Choropleth down to local Village/Ward markers.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setActiveTab("national")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "national"
                ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Map className="h-4 w-4" />
            <span>National Choropleth</span>
          </button>
          <button
            onClick={() => setActiveTab("district")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "district"
                ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>District Drill-down</span>
          </button>
          <button
            onClick={() => setActiveTab("constituency")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "constituency"
                ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Constituency Pins</span>
          </button>
        </div>
      </div>

      {/* Map views */}
      {loading ? (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-400">Loading geospatial layers...</p>
        </div>
      ) : (
        <div>
          {activeTab === "national" && (
            <StateChoroplethMap
              data={stateData}
              onSelectState={(st) => {
                setSelectedState(st);
                setActiveTab("district");
              }}
            />
          )}
          {activeTab === "district" && (
            <DistrictDrilldownMap districts={districtData} selectedStateName={selectedState} />
          )}
          {activeTab === "constituency" && <ConstituencyMap pins={pinsData} />}
        </div>
      )}
    </div>
  );
}
