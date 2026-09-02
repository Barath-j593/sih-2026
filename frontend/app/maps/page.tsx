"use client";

import React, { useEffect, useState } from "react";
import { useRole } from "../../context/RoleContext";
import { fetchStateChoropleth, fetchDistrictDrilldown, fetchConstituencyPins } from "../../lib/api";
import { StateChoroplethMap } from "../../components/maps/StateChoroplethMap";
import { DistrictDrilldownMap } from "../../components/maps/DistrictDrilldownMap";
import { ConstituencyMap } from "../../components/maps/ConstituencyMap";
import { IndiaSvgMap } from "../../components/maps/IndiaSvgMap";
import { Map, Layers, Building2, MapPin, Eye } from "lucide-react";

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
        const districtParam = role === "district" ? jurisdiction : undefined;
        const mpParam = role === "mp" ? jurisdiction : undefined;

        const [st, dist, pins] = await Promise.all([
          fetchStateChoropleth(),
          fetchDistrictDrilldown(selectedState),
          fetchConstituencyPins(districtParam, mpParam, 150),
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
  }, [selectedState, role, jurisdiction]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900 border border-blue-200">
              GEOSPATIAL INTELLIGENCE
            </span>
            <span className="text-xs font-mono text-slate-500">
              Active Scope: {jurisdiction} ({role.toUpperCase()})
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            Geospatial Risk Visualizer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Multi-tiered spatial resolution from National State Choropleth down to local Village/Ward audit markers.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("national")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "national"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <Map className="h-4 w-4" />
            <span>National Choropleth</span>
          </button>
          <button
            onClick={() => setActiveTab("district")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "district"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>District Drill-down</span>
          </button>
          <button
            onClick={() => setActiveTab("constituency")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "constituency"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Audit Pins Map</span>
          </button>
        </div>
      </div>

      {/* Map views */}
      {loading ? (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-md" />
          <p className="text-xs font-semibold text-slate-600">Loading geospatial layers for {jurisdiction}...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "national" && (
            <div className="space-y-6">
              <IndiaSvgMap
                stateData={stateData}
                onSelectState={(st) => {
                  setSelectedState(st);
                  setActiveTab("district");
                }}
              />
              <StateChoroplethMap
                data={stateData}
                onSelectState={(st) => {
                  setSelectedState(st);
                  setActiveTab("district");
                }}
              />
            </div>
          )}

          {activeTab === "district" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-3 shadow-2xs">
                <span className="text-xs font-bold text-slate-700">
                  Inspecting State: <span className="text-amber-700">{selectedState}</span>
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {districtData.length} Districts Analyzed
                </span>
              </div>
              <DistrictDrilldownMap districts={districtData} selectedStateName={selectedState} />
            </div>
          )}

          {activeTab === "constituency" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-3 shadow-2xs">
                <span className="text-xs font-bold text-slate-700">
                  Live GPS Audit Coordinates for: <span className="text-amber-700">{jurisdiction}</span>
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {pinsData.length} Geo-tagged works plotted
                </span>
              </div>
              <ConstituencyMap
                pins={pinsData}
                title={`GPS Location Verification & Progress (${jurisdiction})`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
