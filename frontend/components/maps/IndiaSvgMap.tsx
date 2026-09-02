"use client";

import React, { useState } from "react";

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

interface IndiaSvgMapProps {
  data: StateData[];
  selectedState?: string;
  onSelectState?: (stateName: string) => void;
}

// Stylized visual geo-grid coordinates & polygon representations for Indian States
const STATE_MAP_NODES: Array<{
  id: string;
  name: string;
  gridX: number;
  gridY: number;
  path: string;
  labelX: number;
  labelY: number;
}> = [
  { id: "JK", name: "Jammu & Kashmir", gridX: 2, gridY: 0, labelX: 180, labelY: 65, path: "M 140 40 L 220 40 L 230 90 L 150 90 Z" },
  { id: "HP", name: "Himachal Pradesh", gridX: 2, gridY: 1, labelX: 200, labelY: 110, path: "M 160 90 L 230 90 L 235 130 L 170 130 Z" },
  { id: "PB", name: "Punjab", gridX: 1, gridY: 2, labelX: 140, labelY: 145, path: "M 120 120 L 170 120 L 165 170 L 115 170 Z" },
  { id: "UT", name: "Uttarakhand", gridX: 3, gridY: 2, labelX: 245, labelY: 145, path: "M 220 115 L 270 130 L 260 170 L 210 155 Z" },
  { id: "HR", name: "Haryana", gridX: 2, gridY: 2, labelX: 185, labelY: 170, path: "M 165 140 L 210 140 L 205 195 L 160 195 Z" },
  { id: "DL", name: "Delhi", gridX: 2, gridY: 3, labelX: 195, labelY: 200, path: "M 185 190 L 205 190 L 205 210 L 185 210 Z" },
  { id: "RJ", name: "Rajasthan", gridX: 1, gridY: 3, labelX: 120, labelY: 235, path: "M 70 170 L 160 170 L 175 250 L 130 310 L 60 270 Z" },
  { id: "UP", name: "Uttar Pradesh", gridX: 3, gridY: 3, labelX: 275, labelY: 235, path: "M 205 175 L 310 195 L 345 260 L 250 280 L 195 240 Z" },
  { id: "BR", name: "Bihar", gridX: 4, gridY: 3, labelX: 375, labelY: 250, path: "M 340 220 L 420 225 L 415 285 L 340 280 Z" },
  { id: "WB", name: "West Bengal", gridX: 5, gridY: 4, labelX: 420, labelY: 330, path: "M 410 240 L 435 240 L 435 340 L 395 360 L 390 300 Z" },
  { id: "AS", name: "Assam", gridX: 6, gridY: 3, labelX: 485, labelY: 250, path: "M 445 230 L 525 230 L 530 270 L 450 270 Z" },
  { id: "GJ", name: "Gujarat", gridX: 0, gridY: 4, labelX: 75, labelY: 340, path: "M 30 275 L 120 290 L 135 375 L 60 395 L 30 330 Z" },
  { id: "MP", name: "Madhya Pradesh", gridX: 2, gridY: 4, labelX: 230, labelY: 335, path: "M 155 275 L 310 270 L 325 365 L 170 375 Z" },
  { id: "JH", name: "Jharkhand", gridX: 4, gridY: 4, labelX: 360, labelY: 320, path: "M 335 285 L 400 285 L 395 350 L 330 350 Z" },
  { id: "OD", name: "Odisha", gridX: 4, gridY: 5, labelX: 360, labelY: 410, path: "M 325 360 L 405 355 L 395 450 L 315 440 Z" },
  { id: "CG", name: "Chhattisgarh", gridX: 3, gridY: 5, labelX: 290, labelY: 395, path: "M 275 320 L 325 320 L 325 450 L 265 440 Z" },
  { id: "MH", name: "Maharashtra", gridX: 1, gridY: 5, labelX: 165, labelY: 425, path: "M 105 370 L 245 360 L 265 470 L 115 480 Z" },
  { id: "TS", name: "Telangana", gridX: 2, gridY: 6, labelX: 245, labelY: 480, path: "M 215 450 L 290 450 L 280 520 L 205 515 Z" },
  { id: "AP", name: "Andhra Pradesh", gridX: 3, gridY: 6, labelX: 275, labelY: 550, path: "M 265 480 L 340 450 L 305 600 L 250 560 Z" },
  { id: "KA", name: "Karnataka", gridX: 1, gridY: 7, labelX: 165, labelY: 540, path: "M 135 485 L 215 485 L 225 610 L 140 595 Z" },
  { id: "TN", name: "Tamil Nadu", gridX: 2, gridY: 8, labelX: 220, labelY: 650, path: "M 185 595 L 265 595 L 245 710 L 180 690 Z" },
  { id: "KL", name: "Kerala", gridX: 1, gridY: 8, labelX: 160, labelY: 660, path: "M 150 595 L 185 595 L 185 700 L 145 680 Z" },
];

export function IndiaSvgMap({ data, selectedState, onSelectState }: IndiaSvgMapProps) {
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Map state data by name (lowercase for matching)
  const dataMap = new Map<string, StateData>();
  data.forEach((d) => {
    dataMap.set(d.state.toLowerCase(), d);
  });

  const getRiskColor = (score: number) => {
    if (score >= 75) return "#ef4444"; // Red (Critical)
    if (score >= 60) return "#f97316"; // Orange (High)
    if (score >= 40) return "#eab308"; // Amber (Medium)
    return "#10b981"; // Emerald (Low)
  };

  const getRiskGlow = (score: number) => {
    if (score >= 75) return "drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))";
    if (score >= 60) return "drop-shadow(0 0 6px rgba(249, 115, 22, 0.5))";
    if (score >= 40) return "drop-shadow(0 0 5px rgba(234, 179, 8, 0.4))";
    return "drop-shadow(0 0 4px rgba(16, 185, 129, 0.3))";
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Map Legend */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">State Anomaly Heatmap:</span>
          <span className="text-[11px] text-slate-500">(Click any state to drill down)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300 text-[11px]">Clean / Low (&lt;40)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-slate-300 text-[11px]">Medium (40-59)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
            <span className="text-slate-300 text-[11px]">High (60-74)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50" />
            <span className="text-slate-300 text-[11px]">Critical (&gt;75)</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div
        className="relative w-full max-w-[620px] aspect-[560/740] bg-slate-950/80 rounded-2xl border border-slate-800 p-2 shadow-2xl overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => setHoveredState(null)}
      >
        <svg viewBox="0 0 560 740" className="w-full h-full filter drop-shadow-lg">
          {/* Subtle grid background */}
          <defs>
            <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="560" height="740" fill="url(#mapGrid)" />

          {/* India States Path Polygons */}
          {STATE_MAP_NODES.map((node) => {
            const stateInfo = dataMap.get(node.name.toLowerCase());
            const score = stateInfo ? stateInfo.avg_risk_score : 45.0;
            const fillColor = getRiskColor(score);
            const isSelected = selectedState && selectedState.toLowerCase() === node.name.toLowerCase();
            const isHovered = hoveredState?.state.toLowerCase() === node.name.toLowerCase();

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectState && onSelectState(node.name)}
                onMouseEnter={() => setHoveredState(stateInfo || {
                  state: node.name,
                  total_works: 0,
                  total_allocation: 0,
                  avg_risk_score: 45,
                  flagged_works_count: 0,
                  amount_at_risk: 0,
                  risk_level: "Medium",
                  lat: 0,
                  lng: 0
                })}
              >
                {/* State Polygon */}
                <path
                  d={node.path}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
                  stroke={isSelected ? "#ffffff" : isHovered ? "#f59e0b" : "#334155"}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  style={{
                    filter: isSelected || isHovered ? getRiskGlow(score) : undefined,
                    transition: "all 0.2s ease-in-out"
                  }}
                />

                {/* State Label Text */}
                <text
                  x={node.labelX}
                  y={node.labelY}
                  textAnchor="middle"
                  className="pointer-events-none select-none text-[10px] font-bold fill-white"
                  style={{
                    textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                    letterSpacing: "0.2px"
                  }}
                >
                  {node.id}
                </text>

                {/* Risk Score Pill on State */}
                <text
                  x={node.labelX}
                  y={node.labelY + 11}
                  textAnchor="middle"
                  className="pointer-events-none select-none text-[8px] font-mono font-bold fill-slate-200"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
                >
                  {score.toFixed(0)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredState && (
          <div
            className="absolute pointer-events-none z-50 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md transition-all duration-75 min-w-[200px]"
            style={{
              left: `${Math.min(mousePos.x + 15, 380)}px`,
              top: `${Math.min(mousePos.y + 15, 550)}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-bold text-white text-sm">{hoveredState.state}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: getRiskColor(hoveredState.avg_risk_score) }}
              >
                {hoveredState.avg_risk_score.toFixed(1)} / 100
              </span>
            </div>

            <div className="space-y-1 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Sanctions:</span>
                <span className="font-bold text-white">{hoveredState.total_works.toLocaleString()} works</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Outlay:</span>
                <span className="font-mono font-bold text-white">
                  ₹{(hoveredState.total_allocation / 10000000).toFixed(2)} Cr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Flagged Anomalies:</span>
                <span className="font-bold text-red-400">{hoveredState.flagged_works_count} flagged</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Funds at Risk:</span>
                <span className="font-mono font-bold text-red-400">
                  ₹{(hoveredState.amount_at_risk / 100000).toFixed(1)} Lakhs
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-amber-400 font-semibold flex items-center justify-between">
              <span>Click to view district breakdown</span>
              <span>➔</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
