"use client";

import React, { useState, useMemo } from "react";
import { 
  Network, ShieldAlert, Users, Building, Filter, ArrowRight, 
  AlertTriangle, CheckCircle2, TrendingUp, BarChart3, Layers, 
  Sparkles, Search, SlidersHorizontal, Info, ExternalLink
} from "lucide-react";
import { RiskBadge } from "../ui/RiskBadge";

interface GraphNode {
  id: string;
  name: string;
  type: "mp" | "ida";
  total_amount: number;
  total_works: number;
  risk_score: number;
  val: number;
}

interface GraphLink {
  source: string | { id: string };
  target: string | { id: string };
  work_count: number;
  total_amount: number;
  share: number;
  is_high_risk: boolean;
}

interface NormalizedGraphLink extends GraphLink {
  sourceId: string;
  targetId: string;
}

interface MPIDANetworkGraphProps {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

export function MPIDANetworkGraph({ data }: MPIDANetworkGraphProps) {
  // Visual Mode Switcher: 'flow' (Sankey/Alluvial), 'matrix' (Cartel Matrix), 'network' (Constellation)
  const [viewMode, setViewMode] = useState<"flow" | "matrix" | "network">("flow");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<NormalizedGraphLink | null>(null);
  const [minRisk, setMinRisk] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minVolumeFilter, setMinVolumeFilter] = useState<number>(0); // in Rupees

  // Standardize links source/target IDs
  const normalizedLinks = useMemo(() => {
    return data.links.map((l) => ({
      ...l,
      sourceId: typeof l.source === "string" ? l.source : l.source.id,
      targetId: typeof l.target === "string" ? l.target : l.target.id,
    }));
  }, [data.links]);

  // Nodes indexed by ID
  const nodeMap = useMemo(() => {
    return new Map(data.nodes.map((n) => [n.id, n]));
  }, [data.nodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return data.nodes.filter((n) => {
      if (minRisk > 0 && n.risk_score < minRisk) return false;
      if (minVolumeFilter > 0 && n.total_amount < minVolumeFilter) return false;
      if (searchQuery.trim() && !n.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [data.nodes, minRisk, minVolumeFilter, searchQuery]);

  const filteredNodeSet = useMemo(() => {
    return new Set(filteredNodes.map((n) => n.id));
  }, [filteredNodes]);

  // Active links connected to filtered nodes
  const activeLinks = useMemo(() => {
    return normalizedLinks.filter((l) => {
      if (!filteredNodeSet.has(l.sourceId) || !filteredNodeSet.has(l.targetId)) {
        return false;
      }
      if (minVolumeFilter > 0 && l.total_amount < minVolumeFilter) return false;
      return true;
    });
  }, [normalizedLinks, filteredNodeSet, minVolumeFilter]);

  // Separate MPs and IDAs for the Flow (Alluvial) view
  const mpNodes = useMemo(() => {
    const mps = filteredNodes.filter((n) => n.type === "mp");
    return mps.sort((a, b) => b.total_amount - a.total_amount).slice(0, 10);
  }, [filteredNodes]);

  const idaNodes = useMemo(() => {
    const idas = filteredNodes.filter((n) => n.type === "ida");
    return idas.sort((a, b) => b.total_amount - a.total_amount).slice(0, 10);
  }, [filteredNodes]);

  // Ranked monopolies (high share)
  const rankedMonopolies = useMemo(() => {
    return [...normalizedLinks]
      .filter((l) => l.share >= 0.40)
      .sort((a, b) => b.share - a.share)
      .slice(0, 4);
  }, [normalizedLinks]);

  // Details for selected node
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;
  const selectedNodeLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    return normalizedLinks.filter(
      (l) => l.sourceId === selectedNodeId || l.targetId === selectedNodeId
    );
  }, [selectedNodeId, normalizedLinks]);

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Visualizer Top Bar & Multi-View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-cyan-900 shadow-xs">
              <Layers className="h-3 w-3 text-cyan-700" />
              CAPITAL FLOW INTELLIGENCE
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight sm:text-lg">
              MP ➔ Agency Money Conduit & Syndicate Profiler
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Traces parliamentary recommendations to executing agencies, graphically revealing funding funnels and contractor capture.
          </p>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs shadow-xs">
          <button
            onClick={() => setViewMode("flow")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              viewMode === "flow"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Alluvial Flow</span>
          </button>
          <button
            onClick={() => setViewMode("matrix")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              viewMode === "matrix"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
            <span>Syndicate Matrix</span>
          </button>
          <button
            onClick={() => setViewMode("network")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              viewMode === "network"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Network className="h-3.5 w-3.5 text-cyan-600" />
            <span>Constellation</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3 text-amber-600" />
            Minimum Outlay:
          </span>
          <button
            onClick={() => setMinVolumeFilter(0)}
            className={`rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
              minVolumeFilter === 0 
                ? "bg-white text-amber-900 border border-amber-300 shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            All Flows
          </button>
          <button
            onClick={() => setMinVolumeFilter(2500000)}
            className={`rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
              minVolumeFilter === 2500000 
                ? "bg-white text-amber-900 border border-amber-300 shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            &gt; ₹25 Lakhs
          </button>
          <button
            onClick={() => setMinVolumeFilter(5000000)}
            className={`rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
              minVolumeFilter === 5000000 
                ? "bg-white text-amber-900 border border-amber-300 shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            &gt; ₹50 Lakhs
          </button>
          <button
            onClick={() => setMinVolumeFilter(10000000)}
            className={`rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
              minVolumeFilter === 10000000 
                ? "bg-white text-amber-900 border border-amber-300 shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            &gt; ₹1.00 Crore
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search MP or Agency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 sm:w-56 rounded-xl border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs font-medium"
          />
        </div>
      </div>

      {/* Top Monopoly Alerts Strip */}
      {rankedMonopolies.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-black text-rose-900 mb-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 animate-pulse" />
            CRITICAL AGENCY MONOPOLY ALARMS (Fund Capture &ge; 40%)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {rankedMonopolies.map((m, idx) => {
              const mpNode = nodeMap.get(m.sourceId);
              const idaNode = nodeMap.get(m.targetId);
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedNodeId(m.targetId)}
                  className="group cursor-pointer rounded-xl border border-rose-200 bg-white p-3 transition-all hover:border-rose-300 hover:shadow-sm shadow-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-800 truncate max-w-[110px]" title={mpNode?.name}>
                      {mpNode?.name || m.sourceId}
                    </span>
                    <span className="rounded-md bg-rose-100 px-1.5 py-0.5 font-mono font-bold text-rose-800 border border-rose-200">
                      {(m.share * 100).toFixed(1)}% Share
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-black text-slate-900 group-hover:text-amber-800">
                    <ArrowRight className="h-3 w-3 text-rose-600 shrink-0" />
                    <span className="truncate" title={idaNode?.name}>{idaNode?.name || m.targetId}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>{m.work_count} Works</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(m.total_amount / 100000).toFixed(1)}L Funneled</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 1: ALLUVIAL FLOW CONDUIT (SANKEY-STYLE) */}
      {viewMode === "flow" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            <div className="flex items-center gap-2 text-blue-800 font-bold">
              <Users className="h-4 w-4 text-blue-600" /> Recommending MPs ({mpNodes.length})
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium lowercase">
              <Info className="h-3.5 w-3.5 text-amber-600" />
              hover ribbons to trace funding conduits
            </div>
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <Building className="h-4 w-4 text-amber-600" /> Executing IDAs / Contractors ({idaNodes.length})
            </div>
          </div>

          <div className="relative grid grid-cols-12 gap-2 min-h-[460px] rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            {/* Left Column: MPs */}
            <div className="col-span-4 space-y-2.5">
              {mpNodes.map((mp, index) => {
                const isSelected = selectedNodeId === mp.id;
                const isHovered = hoveredLink?.sourceId === mp.id;
                return (
                  <div
                    key={mp.id}
                    onClick={() => setSelectedNodeId(isSelected ? null : mp.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all shadow-xs ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/80 shadow-sm ring-1 ring-blue-400"
                        : isHovered
                        ? "border-blue-300 bg-blue-50/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800 border border-blue-200">
                          {index + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={mp.name}>
                          {mp.name}
                        </h4>
                      </div>
                      <span className="shrink-0 text-[10px] font-mono text-slate-500 font-medium">
                        {mp.total_works} works
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Allocated:</span>
                      <span className="font-bold text-blue-700 font-mono">
                        ₹{(mp.total_amount / 10000000).toFixed(2)} Cr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center Flow SVG Canvas */}
            <div className="col-span-4 relative flex items-center justify-center">
              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {activeLinks.slice(0, 30).map((link, idx) => {
                  const mpIdx = mpNodes.findIndex((n) => n.id === link.sourceId);
                  const idaIdx = idaNodes.findIndex((n) => n.id === link.targetId);

                  if (mpIdx === -1 || idaIdx === -1) return null;

                  const y1 = ((mpIdx + 0.5) / Math.max(1, mpNodes.length)) * 100;
                  const y2 = ((idaIdx + 0.5) / Math.max(1, idaNodes.length)) * 100;

                  const isHighMonopoly = link.share >= 0.50 || link.is_high_risk;
                  const isModerate = link.share >= 0.25;
                  const isHovered = hoveredLink === link;
                  const isConnectedToSelected = selectedNodeId && (link.sourceId === selectedNodeId || link.targetId === selectedNodeId);

                  const strokeWidth = Math.max(1.5, Math.min(8, (link.total_amount / 5000000) * 3));
                  const strokeColor = isHighMonopoly
                    ? "url(#grad-red)"
                    : isModerate
                    ? "url(#grad-amber)"
                    : "url(#grad-cyan)";

                  return (
                    <g key={idx}>
                      <path
                        d={`M 0 ${y1} C 45 ${y1}, 55 ${y2}, 100 ${y2}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHovered || isConnectedToSelected ? strokeWidth * 1.8 : strokeWidth}
                        strokeOpacity={
                          selectedNodeId
                            ? isConnectedToSelected ? 0.95 : 0.08
                            : isHovered ? 1.0 : 0.45
                        }
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredLink(link)}
                        onMouseLeave={() => setHoveredLink(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Ribbon Tooltip */}
              {hoveredLink && (
                <div className="pointer-events-none absolute bottom-4 z-30 w-64 rounded-2xl border border-slate-300 bg-white/95 p-3.5 shadow-xl text-xs backdrop-blur-md animate-fadeIn">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Fund Flow Conduit Details
                  </div>
                  <div className="mt-1 text-slate-900 font-bold truncate">
                    {nodeMap.get(hoveredLink.sourceId)?.name} ➔ {nodeMap.get(hoveredLink.targetId)?.name}
                  </div>
                  <div className="mt-2 space-y-1 text-slate-600 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transferred Outlay:</span>
                      <span className="font-bold text-amber-800 font-mono">₹{(hoveredLink.total_amount / 100000).toFixed(1)} Lakhs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contracted Works:</span>
                      <span className="font-bold text-slate-800">{hoveredLink.work_count} projects</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">MP Fund Share:</span>
                      <span className={`font-bold font-mono ${hoveredLink.share >= 0.5 ? "text-rose-600" : "text-cyan-700"}`}>
                        {(hoveredLink.share * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {hoveredLink.share >= 0.5 && (
                    <div className="mt-2 rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 text-center border border-rose-200">
                      ⚠ CRITICAL MONOPOLY CONCENTRATION
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: IDAs */}
            <div className="col-span-4 space-y-2.5">
              {idaNodes.map((ida, index) => {
                const isSelected = selectedNodeId === ida.id;
                const isHovered = hoveredLink?.targetId === ida.id;
                return (
                  <div
                    key={ida.id}
                    onClick={() => setSelectedNodeId(isSelected ? null : ida.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all shadow-xs ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/80 shadow-sm ring-1 ring-amber-400"
                        : isHovered
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-900 border border-amber-200">
                          {index + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={ida.name}>
                          {ida.name}
                        </h4>
                      </div>
                      <span className="shrink-0 text-[10px] font-mono text-slate-500 font-medium">
                        {ida.total_works} works
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Risk:</span>
                        <RiskBadge score={ida.risk_score} size="sm" />
                      </div>
                      <span className="font-bold text-amber-800 font-mono">
                        ₹{(ida.total_amount / 10000000).toFixed(2)} Cr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SYNDICATE & CONCENTRATION MATRIX (HEATMAP VIEW) */}
      {viewMode === "matrix" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-slate-600">
            <span className="font-semibold">Rows: Recommending MPs &nbsp;|&nbsp; Columns: Top Executing Agencies</span>
            <span className="text-[11px] text-amber-800 font-bold">
              Cells display % of MP's fund directed to each agency
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] text-slate-600">
                  <th className="p-3 font-black uppercase tracking-wider text-slate-800 rounded-l-lg">Recommending MP</th>
                  {idaNodes.slice(0, 6).map((ida) => (
                    <th key={ida.id} className="p-3 font-bold text-amber-900 max-w-[120px] truncate" title={ida.name}>
                      {ida.name.substring(0, 16)}...
                    </th>
                  ))}
                  <th className="p-3 font-black text-right text-slate-800 rounded-r-lg">Total Outlay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mpNodes.slice(0, 8).map((mp) => (
                  <tr key={mp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-bold text-slate-900 truncate max-w-[160px]" title={mp.name}>
                      <span className="text-blue-600 mr-1.5 font-black">•</span>
                      {mp.name}
                    </td>
                    {idaNodes.slice(0, 6).map((ida) => {
                      const link = activeLinks.find(
                        (l) => l.sourceId === mp.id && l.targetId === ida.id
                      );

                      if (!link) {
                        return (
                          <td key={ida.id} className="p-3 text-center text-slate-300">
                            —
                          </td>
                        );
                      }

                      const isCritical = link.share >= 0.50;
                      const isHigh = link.share >= 0.25;

                      return (
                        <td key={ida.id} className="p-3 text-center">
                          <span
                            onClick={() => setSelectedNodeId(ida.id)}
                            className={`cursor-pointer inline-flex flex-col items-center justify-center rounded-xl px-2.5 py-1.5 font-mono text-[11px] font-bold transition-transform hover:scale-105 shadow-2xs ${
                              isCritical
                                ? "bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200"
                                : isHigh
                                ? "bg-amber-50 text-amber-900 border border-amber-300"
                                : "bg-slate-100 text-slate-800 border border-slate-200"
                            }`}
                            title={`₹${(link.total_amount / 100000).toFixed(1)}L across ${link.work_count} works`}
                          >
                            <span>{(link.share * 100).toFixed(0)}%</span>
                            <span className="text-[9px] font-normal text-slate-500">
                              ₹{(link.total_amount / 100000).toFixed(0)}L
                            </span>
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-3 text-right font-black text-blue-700 font-mono">
                      ₹{(mp.total_amount / 10000000).toFixed(2)} Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: CONSTELLATION NETWORK (UPGRADED RADAR) */}
      {viewMode === "network" && (
        <div className="relative min-h-[460px] rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-3 text-[11px] font-bold text-slate-700 bg-white/95 px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" /> MP Recommenders</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-600 inline-block" /> Executing IDAs</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-600 inline-block" /> Monopoly &ge;50%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full pt-8">
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase tracking-wider text-blue-900">Top Recommenders</h5>
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {mpNodes.map((mp) => (
                  <div
                    key={mp.id}
                    onClick={() => setSelectedNodeId(mp.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all shadow-xs ${
                      selectedNodeId === mp.id 
                        ? "bg-blue-50/80 border-blue-500 text-blue-950 ring-1 ring-blue-400" 
                        : "bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="font-bold truncate text-slate-900">{mp.name}</div>
                    <div className="text-[10px] text-slate-500 flex justify-between mt-1.5 font-medium">
                      <span>{mp.total_works} works</span>
                      <span className="text-blue-700 font-bold font-mono">₹{(mp.total_amount / 10000000).toFixed(2)} Cr</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <h5 className="text-xs font-black uppercase tracking-wider text-amber-900">Dominant Contractor & Agency Hubs</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {idaNodes.map((ida) => {
                  const isHighRisk = ida.risk_score >= 60;
                  return (
                    <div
                      key={ida.id}
                      onClick={() => setSelectedNodeId(ida.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all shadow-xs ${
                        selectedNodeId === ida.id
                          ? "bg-amber-50/80 border-amber-500 text-amber-950 ring-1 ring-amber-400"
                          : "bg-white border-slate-200 text-slate-800 hover:border-amber-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 truncate" title={ida.name}>{ida.name}</span>
                        <RiskBadge score={ida.risk_score} size="sm" />
                      </div>
                      <div className="mt-2 text-[11px] flex justify-between text-slate-500 font-medium">
                        <span>{ida.total_works} works contracted</span>
                        <span className="text-amber-800 font-bold font-mono">₹{(ida.total_amount / 10000000).toFixed(2)} Cr</span>
                      </div>
                      {isHighRisk && (
                        <div className="mt-2 text-[10px] text-rose-700 font-bold flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="h-3 w-3 text-rose-600" /> High Risk Concentration Index
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Entity Inspector Drawer / Overlay */}
      {selectedNode && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4 shadow-sm text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase shadow-2xs ${
                selectedNode.type === "mp" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-amber-100 text-amber-900 border border-amber-200"
              }`}>
                {selectedNode.type === "mp" ? "Member of Parliament" : "Executing Agency (IDA)"}
              </span>
              <h4 className="text-sm font-black text-slate-900">{selectedNode.name}</h4>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-slate-600 hover:text-slate-900 text-xs font-bold underline cursor-pointer"
            >
              Close Inspector
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-wider">Total Capital Volume</span>
              <span className="text-sm font-black text-amber-800 font-mono mt-0.5 block">₹{(selectedNode.total_amount / 10000000).toFixed(2)} Cr</span>
            </div>
            <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-wider">Sanctioned Works</span>
              <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">{selectedNode.total_works} projects</span>
            </div>
            <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-wider">Risk Index</span>
              <div className="mt-1"><RiskBadge score={selectedNode.risk_score} size="sm" /></div>
            </div>
            <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-wider">Connected Counterparties</span>
              <span className="text-sm font-black text-cyan-800 font-mono mt-0.5 block">{selectedNodeLinks.length} entities</span>
            </div>
          </div>

          {/* Connected Links Breakdown */}
          <div>
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2">
              Connected Funding Allocations ({selectedNodeLinks.length})
            </h5>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {selectedNodeLinks.map((link, idx) => {
                const otherNodeId = link.sourceId === selectedNode.id ? link.targetId : link.sourceId;
                const otherNode = nodeMap.get(otherNodeId);
                const isMonopoly = link.share >= 0.50;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-200 text-[11px] shadow-xs"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[220px]">
                      <span className={`h-2 w-2 rounded-full ${isMonopoly ? "bg-rose-600 animate-pulse" : "bg-cyan-600"}`} />
                      <span className="text-slate-900 font-bold truncate">{otherNode?.name || otherNodeId}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500 font-medium">{link.work_count} works</span>
                      <span className="font-mono font-bold text-amber-800">₹{(link.total_amount / 100000).toFixed(1)}L</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
                        isMonopoly ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {(link.share * 100).toFixed(1)}% Share
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
