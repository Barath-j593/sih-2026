"use client";

import React, { useState, useMemo } from "react";
import IndiaMap from "@svg-maps/india";
import {
  Search,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  Info,
  Maximize2,
} from "lucide-react";

export interface StateData {
  state: string;
  total_works: number;
  total_allocation: number;
  avg_risk_score: number;
  flagged_works_count: number;
  amount_at_risk: number;
  risk_level: string;
  lat: number;
  lng: number;
}

export interface IndiaSvgMapProps {
  data?: StateData[];
  stateData?: StateData[];
  selectedState?: string;
  onSelectState?: (stateName: string) => void;
  onInspectState?: (stateName: string) => void;
}

// Extract official GIS administrative boundary vector paths from @svg-maps/india
const rawMapData: any = (IndiaMap as any).default || IndiaMap;
const GIS_LOCATIONS: Array<{ id: string; name: string; path: string }> =
  rawMapData?.locations || [];
const GIS_VIEWBOX: string = rawMapData?.viewBox || "0 0 612 696";

// Accurate centroid coordinates for state names and badges based on GIS boundaries
const STATE_CENTROIDS: Record<string, { shortName: string; cx: number; cy: number }> = {
  an: { shortName: "A&N Islands", cx: 521, cy: 609 },
  ap: { shortName: "Andhra", cx: 263, cy: 500 },
  ar: { shortName: "Arunachal", cx: 550, cy: 224 },
  as: { shortName: "Assam", cx: 505, cy: 271 },
  br: { shortName: "Bihar", cx: 369, cy: 275 },
  ch: { shortName: "Chandigarh", cx: 179, cy: 160 },
  ct: { shortName: "Chhattisgarh", cx: 296, cy: 388 },
  dn: { shortName: "D&NH", cx: 102, cy: 405 },
  dd: { shortName: "Daman & Diu", cx: 54, cy: 391 },
  dl: { shortName: "Delhi", cx: 186, cy: 210 },
  ga: { shortName: "Goa", cx: 122, cy: 512 },
  gj: { shortName: "Gujarat", cx: 72, cy: 345 },
  hr: { shortName: "Haryana", cx: 164, cy: 195 },
  hp: { shortName: "Himachal", cx: 191, cy: 133 },
  jk: { shortName: "J&K / Ladakh", cx: 173, cy: 65 },
  jh: { shortName: "Jharkhand", cx: 366, cy: 327 },
  ka: { shortName: "Karnataka", cx: 171, cy: 519 },
  kl: { shortName: "Kerala", cx: 166, cy: 615 },
  ld: { shortName: "Lakshadweep", cx: 99, cy: 627 },
  mp: { shortName: "Madhya Pradesh", cx: 214, cy: 325 },
  mh: { shortName: "Maharashtra", cx: 180, cy: 425 },
  mn: { shortName: "Manipur", cx: 545, cy: 301 },
  ml: { shortName: "Meghalaya", cx: 480, cy: 283 },
  mz: { shortName: "Mizoram", cx: 520, cy: 340 },
  nl: { shortName: "Nagaland", cx: 550, cy: 260 },
  or: { shortName: "Odisha", cx: 340, cy: 405 },
  py: { shortName: "Puducherry", cx: 268, cy: 546 },
  pb: { shortName: "Punjab", cx: 151, cy: 152 },
  rj: { shortName: "Rajasthan", cx: 119, cy: 257 },
  sk: { shortName: "Sikkim", cx: 425, cy: 228 },
  tn: { shortName: "Tamil Nadu", cx: 211, cy: 609 },
  tg: { shortName: "Telangana", cx: 237, cy: 457 },
  tr: { shortName: "Tripura", cx: 493, cy: 325 },
  up: { shortName: "Uttar Pradesh", cx: 265, cy: 245 },
  ut: { shortName: "Uttarakhand", cx: 232, cy: 175 },
  wb: { shortName: "West Bengal", cx: 405, cy: 310 },
};

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

export function IndiaSvgMap({
  data,
  stateData,
  selectedState,
  onSelectState,
  onInspectState,
}: IndiaSvgMapProps) {
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLabels, setShowLabels] = useState(true);
  const [isWhiteTheme, setIsWhiteTheme] = useState(true);

  const activeDataList = useMemo(() => data || stateData || [], [data, stateData]);

  // Index state data with normalized keys
  const dataMap = useMemo(() => {
    const map = new Map<string, StateData>();
    activeDataList.forEach((d) => {
      map.set(normalizeName(d.state), d);
    });
    return map;
  }, [activeDataList]);

  // Risk color scales matching user's color-coded GIS reference
  const getRiskColor = (score: number, hasData: boolean) => {
    if (!hasData) return isWhiteTheme ? "#94a3b8" : "#334155";
    if (score >= 65) return "#ef4444"; // Red - Critical Risk
    if (score >= 50) return "#f97316"; // Coral Orange - High Risk
    if (score >= 35) return "#eab308"; // Golden Amber - Medium Risk
    return "#10b981"; // Emerald Green - Low Risk
  };

  const getRiskLevelName = (score: number, hasData: boolean) => {
    if (!hasData) return "Baseline";
    if (score >= 65) return "Critical";
    if (score >= 50) return "High";
    if (score >= 35) return "Medium";
    return "Low";
  };

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return GIS_LOCATIONS;
    return GIS_LOCATIONS.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleStateInteraction = (stateName: string) => {
    if (onSelectState) {
      onSelectState(stateName);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center space-y-4">
      {/* Map Control Bar & Quick State Search */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Find state (e.g. Bihar, UP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 shadow-2xs focus:border-slate-800 focus:outline-none w-48 sm:w-56 transition-all"
            />
          </div>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              showLabels
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {showLabels ? "State Names: ON" : "State Names: OFF"}
          </button>
          <button
            onClick={() => setIsWhiteTheme(!isWhiteTheme)}
            title={isWhiteTheme ? "Switch to Dark GIS Radar Canvas" : "Switch to Crisp White Canvas"}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            {isWhiteTheme ? <Moon className="h-3 w-3 text-slate-600" /> : <Sun className="h-3 w-3 text-amber-500" />}
            <span>{isWhiteTheme ? "Dark Mode" : "Light Mode"}</span>
          </button>
        </div>

        {/* Dynamic Risk Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500 shadow-xs" />
            <span className="text-slate-600 text-[11px] font-medium">Low (&lt;35)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500 shadow-xs" />
            <span className="text-slate-600 text-[11px] font-medium">Medium (35-49)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-orange-500 shadow-xs" />
            <span className="text-slate-600 text-[11px] font-medium">High (50-64)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-red-500 animate-pulse shadow-xs" />
            <span className="text-slate-600 text-[11px] font-medium">Critical (&ge;65)</span>
          </div>
        </div>
      </div>

      {/* Official Vector GIS Map Canvas */}
      <div
        className={`relative w-full max-w-[620px] aspect-[612/696] rounded-3xl border transition-colors duration-300 p-2 sm:p-4 shadow-xl overflow-hidden group select-none ${
          isWhiteTheme
            ? "bg-white border-slate-200"
            : "bg-[#07111e] border-slate-800"
        }`}
      >
        <svg
          viewBox={GIS_VIEWBOX}
          className="w-full h-full filter drop-shadow-md"
          onMouseLeave={() => {
            setHoveredState(null);
          }}
        >
          <defs>
            {/* Subtle Grid Lines for GIS aesthetic */}
            <pattern id="gisPatternGrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path
                d="M 28 0 L 0 0 0 28"
                fill="none"
                stroke={isWhiteTheme ? "#f1f5f9" : "#17263b"}
                strokeWidth="0.5"
                opacity="0.8"
              />
            </pattern>
            {/* National Watermark Glow */}
            <radialGradient id="gisCenterGlow" cx="50%" cy="50%" r="55%">
              <stop
                offset="0%"
                stopColor={isWhiteTheme ? "#e2e8f0" : "#1e3a5f"}
                stopOpacity={isWhiteTheme ? "0.4" : "0.3"}
              />
              <stop
                offset="100%"
                stopColor={isWhiteTheme ? "#ffffff" : "#07111e"}
                stopOpacity="0"
              />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#gisPatternGrid)" />
          <circle cx="306" cy="348" r="280" fill="url(#gisCenterGlow)" />

          {/* Render All 36 Official Indian State & UT Vector Boundaries */}
          {GIS_LOCATIONS.map((loc) => {
            const normalizedKey = normalizeName(loc.name);
            const stateInfo = dataMap.get(normalizedKey);
            const hasData = !!stateInfo;
            const score = stateInfo ? stateInfo.avg_risk_score : 28.0;
            const fillColor = getRiskColor(score, hasData);
            const centroid = STATE_CENTROIDS[loc.id] || {
              shortName: loc.name,
              cx: 300,
              cy: 350,
            };

            const isSelected =
              selectedState &&
              normalizeName(selectedState) === normalizedKey;
            const isHovered =
              hoveredState &&
              normalizeName(hoveredState.state) === normalizedKey;
            const isSearchMatch =
              !searchQuery.trim() ||
              loc.name.toLowerCase().includes(searchQuery.toLowerCase());

            const effectiveOpacity = isSelected
              ? 1.0
              : isHovered
              ? 0.95
              : isSearchMatch
              ? 0.88
              : 0.2;

            const strokeColor = isSelected
              ? "#0f172a"
              : isHovered
              ? "#f59e0b"
              : isWhiteTheme
              ? "#334155"
              : "#1e293b";

            const strokeWidth = isSelected ? 2.5 : isHovered ? 2.0 : 0.75;

            return (
              <g
                key={loc.id}
                className="cursor-pointer transition-all duration-150"
                onClick={() => handleStateInteraction(loc.name)}
                onMouseEnter={() => {
                  const targetState: StateData = stateInfo || {
                    state: loc.name,
                    total_works: 0,
                    total_allocation: 0,
                    avg_risk_score: score,
                    flagged_works_count: 0,
                    amount_at_risk: 0,
                    risk_level: getRiskLevelName(score, hasData),
                    lat: 0,
                    lng: 0,
                  };
                  setHoveredState(targetState);
                }}
              >
                {/* Authentic Administrative GIS State Polygon */}
                <path
                  id={loc.id}
                  d={loc.path}
                  fill={fillColor}
                  fillOpacity={effectiveOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{
                    filter:
                      isSelected || isHovered
                        ? "drop-shadow(0 0 8px rgba(245, 158, 11, 0.75))"
                        : undefined,
                    transition: "fill 0.2s ease, stroke 0.2s ease, fill-opacity 0.2s ease",
                  }}
                />

                {/* State Name Label Tag at Centroid */}
                {showLabels && isSearchMatch && (
                  <g
                    transform={`translate(${centroid.cx}, ${centroid.cy})`}
                    className="pointer-events-none select-none"
                  >
                    <rect
                      x={-centroid.shortName.length * 3.3 - 4}
                      y="-7.5"
                      width={centroid.shortName.length * 6.6 + 8}
                      height="15"
                      rx="4"
                      fill={isWhiteTheme ? "#0f172a" : "#020617"}
                      fillOpacity={isHovered || isSelected ? 0.95 : 0.8}
                      stroke={isSelected ? "#f59e0b" : "#475569"}
                      strokeWidth={isSelected ? 1.2 : 0.5}
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      className="text-[8.5px] font-extrabold fill-white tracking-tighter"
                    >
                      {centroid.shortName}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic State Inspector Tooltip Overlay */}
        {hoveredState && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs rounded-2xl bg-slate-900/95 border border-slate-700 p-3.5 text-white shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white tracking-tight">
                  {hoveredState.state}
                </h4>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                  hoveredState.avg_risk_score >= 65
                    ? "bg-red-950 border border-red-500/50 text-red-400"
                    : hoveredState.avg_risk_score >= 50
                    ? "bg-orange-950 border border-orange-500/50 text-orange-400"
                    : hoveredState.avg_risk_score >= 35
                    ? "bg-amber-950 border border-amber-500/50 text-amber-400"
                    : "bg-emerald-950 border border-emerald-500/50 text-emerald-400"
                }`}
              >
                {hoveredState.risk_level || "Monitored"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Total Works
                </span>
                <p className="font-mono font-bold text-white">
                  {hoveredState.total_works ? hoveredState.total_works.toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Amount at Risk
                </span>
                <p className="font-mono font-bold text-amber-400">
                  ₹{(hoveredState.amount_at_risk / 10000000).toFixed(2)} Cr
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>
                Risk Score:{" "}
                <strong className="text-white font-mono">
                  {hoveredState.avg_risk_score.toFixed(1)} / 100
                </strong>
              </span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Click to inspect <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick State Chips Filter */}
      <div className="w-full flex flex-wrap items-center justify-center gap-1.5 pt-1 max-h-24 overflow-y-auto">
        {filteredLocations.map((loc) => {
          const normalizedKey = normalizeName(loc.name);
          const isSelected =
            selectedState && normalizeName(selectedState) === normalizedKey;
          const stateInfo = dataMap.get(normalizedKey);
          const hasData = !!stateInfo;
          const score = stateInfo ? stateInfo.avg_risk_score : 28;

          return (
            <button
              key={loc.id}
              onClick={() => handleStateInteraction(loc.name)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                isSelected
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getRiskColor(score, hasData) }}
              />
              <span>{loc.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
