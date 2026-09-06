"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import IndiaMap from "@svg-maps/india";
import {
  Search,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  X,
  Maximize2,
  ChevronRight,
  Sun,
  Moon,
  Info
} from "lucide-react";
import {
  fetchConstituenciesRisk,
  ConstituencyRiskItem,
  ConstituencyDetailResponse,
} from "../../lib/api";
import { ConstituencyDetailDrawer } from "./ConstituencyDetailDrawer";

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
  selectedConstituency?: string;
  onSelectConstituency?: (constituency: ConstituencyRiskItem) => void;
}

interface SvgConstituency {
  id: number;
  name: string;
  state: string;
  category: string;
  centroid: [number, number];
  bounds: [[number, number], [number, number]];
  path: string;
}

interface SvgStateInfo {
  state: string;
  count: number;
  centroid: [number, number];
  bounds: [[number, number], [number, number]];
}

interface SvgDataset {
  viewBox: string;
  states: SvgStateInfo[];
  constituencies: SvgConstituency[];
}

// Fallback state SVG map data from @svg-maps/india
const rawMapData: any = (IndiaMap as any).default || IndiaMap;
const GIS_LOCATIONS: Array<{ id: string; name: string; path: string }> =
  rawMapData?.locations || [];

const normalizeKey = (s: string) =>
  (s || "").toUpperCase().replace(/\s*\([^)]*\)/g, "").replace(/[^A-Z0-9]/g, "");

// Alias mapping for constituency naming variations
const CONSTITUENCY_ALIASES: Record<string, string> = {
  BELGAUM: "BELAGAVI",
  PEDDAPALLE: "PEDDAPALLI",
  UJJARPUR: "UJIARPUR",
  JANJGIRCHAMPA: "JANJGIRCHAMPA",
  CHIKKODI: "CHIKKODI",
  DHARAMAPURI: "DHARMAPURI",
  GUWAHATI: "GAUHATI",
  ANAKAPALLE: "ANAKAPALLI",
  AURANGABADBR: "AURANGABAD",
  KANNIYAKUMARI: "KANNIYAKUMARI",
  ANANTAPUR: "ANANTAPUR",
  NAINITALUDHAMSINGHNAG: "NAINITALUDHAMSINGHNAGAR",
  SONEPAT: "SONIPAT",
  DAVANAGERE: "DAVANAGERE",
  WARANGEL: "WARANGAL",
  MAHARAJGANJBR: "MAHARAJGANJ",
  CHELVELLA: "CHEVELLA",
  HAMIRPURHP: "HAMIRPUR",
  PURNEA: "PURNIA",
  FIROZPUR: "FIROZPUR",
  MAYILADUTHURAI: "MAYILADUTURAI",
  HARDWAR: "HARIDWAR",
  BARRACKPUR: "BARRACKPORE",
  BHATINDA: "BATHINDA",
  BARAMULLAH: "BARAMULLA",
  HAMIRPURUP: "HAMIRPUR",
  TIRUVALLUR: "THIRUVALLUR",
  MAHARAJGANJUP: "MAHARAJGANJ",
  MANDSOUR: "MANDSAUR",
};

export function IndiaSvgMap({
  data,
  stateData,
  selectedState,
  onSelectState,
  onInspectState,
  selectedConstituency: controlledConstituency,
  onSelectConstituency,
}: IndiaSvgMapProps) {
  // SVG Vector dataset loaded dynamically from /data/india_constituencies_svg.json
  const [svgDataset, setSvgDataset] = useState<SvgDataset | null>(null);
  const [constituencyRisks, setConstituencyRisks] = useState<Map<string, ConstituencyRiskItem>>(
    new Map()
  );
  const [loadingSvg, setLoadingSvg] = useState(true);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  // Map engagement: true when user clicks into map, false when pointer leaves or user clicks outside
  const [isMapActive, setIsMapActive] = useState(false);

  // Interaction state
  const [selectedConstituency, setSelectedConstituency] = useState<string | null>(
    controlledConstituency || null
  );
  const [hoveredConstituency, setHoveredConstituency] = useState<{
    item: SvgConstituency;
    risk?: ConstituencyRiskItem;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLabels, setShowLabels] = useState(true);
  const [layerMode, setLayerMode] = useState<"auto" | "states" | "constituencies">("auto");
  const [isWhiteTheme, setIsWhiteTheme] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const activeStateList = useMemo(() => data || stateData || [], [data, stateData]);

  // Index state data for rapid lookup
  const stateDataMap = useMemo(() => {
    const map = new Map<string, StateData>();
    activeStateList.forEach((d) => {
      map.set(normalizeKey(d.state), d);
    });
    return map;
  }, [activeStateList]);

  // Load constituencies vector JSON and live risk data on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingSvg(true);

    Promise.all([
      fetch("/data/india_constituencies_svg.json").then((r) => r.json()),
      fetchConstituenciesRisk().catch(() => []),
    ])
      .then(([svgData, risks]) => {
        if (!isMounted) return;
        setSvgDataset(svgData);

        const rMap = new Map<string, ConstituencyRiskItem>();
        if (Array.isArray(risks)) {
          risks.forEach((r) => {
            const key = normalizeKey(r.name);
            rMap.set(key, r);
            if (CONSTITUENCY_ALIASES[key]) {
              rMap.set(CONSTITUENCY_ALIASES[key], r);
            }
            if (r.district) {
              const dKey = normalizeKey(r.district);
              if (!rMap.has(dKey)) rMap.set(dKey, r);
            }
          });
        }
        setConstituencyRisks(rMap);
      })
      .catch((err) => {
        console.error("Failed to load map assets:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingSvg(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selected constituency if controlled from parent
  useEffect(() => {
    if (controlledConstituency !== undefined) {
      setSelectedConstituency(controlledConstituency);
    }
  }, [controlledConstituency]);

  // Determine active LOD level
  const showConstituencies = useMemo(() => {
    if (layerMode === "constituencies") return true;
    if (layerMode === "states") return false;
    return zoom >= 1.7; // Auto semantic switch threshold
  }, [layerMode, zoom]);

  // Risk color scales matching design tokens
  const getRiskColor = (score: number, hasData: boolean = true) => {
    if (!hasData) return isWhiteTheme ? "#D9D2C5" : "#1E293B";
    if (score >= 65) return "#EF4444"; // Crimson - Critical Risk
    if (score >= 50) return "#F97316"; // Coral Orange - High Risk
    if (score >= 35) return "#F59E0B"; // Warm Amber - Medium Risk
    return "#10B981"; // Emerald Green - Low Risk
  };

  // Smooth Centering and Zoom to Target Bounding Box
  const zoomToTarget = useCallback(
    (bounds: [[number, number], [number, number]], isConstituency: boolean = false) => {
      const [[minX, minY], [maxX, maxY]] = bounds;
      const bWidth = Math.max(16, maxX - minX);
      const bHeight = Math.max(16, maxY - minY);

      const viewW = 800;
      const viewH = 920;

      let targetZoom: number;
      if (isConstituency) {
        // Balanced forensic scale: clamp between 2.1x and 2.4x
        // Keeps the constituency prominent while preserving full regional context
        const fitScale = Math.min(viewW / (bWidth * 3.0), viewH / (bHeight * 3.0));
        targetZoom = Math.min(2.4, Math.max(2.1, Number(fitScale.toFixed(2))));
      } else {
        // Fit state bounds comfortably with padding
        const padding = 100;
        const fitScale = Math.min((viewW - padding * 2) / bWidth, (viewH - padding * 2) / bHeight);
        targetZoom = Math.min(2.2, Math.max(1.5, Number(fitScale.toFixed(2))));
      }

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Determine target center in SVG coordinates (0-800, 0-920)
      let targetSvgX = 400;
      const targetSvgY = 460;

      if (isConstituency && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cWidth = rect.width || 800;
        const cHeight = rect.height || 640;

        // If desktop view (width >= 640), drawer occupies ~384px on right
        if (cWidth >= 640) {
          const drawerWidth = 384;
          const svgAspect = 800 / 920;
          const containerAspect = cWidth / cHeight;

          let renderedSvgWidth = cWidth;
          let offsetX = 0;
          if (containerAspect > svgAspect) {
            renderedSvgWidth = cHeight * svgAspect;
            offsetX = (cWidth - renderedSvgWidth) / 2;
          }

          const drawerLeft = cWidth - drawerWidth;
          const visibleSvgLeft = offsetX;
          const visibleSvgRight = Math.min(cWidth - offsetX, drawerLeft);

          if (visibleSvgRight > visibleSvgLeft + 80) {
            const visibleCenterScreen = (visibleSvgLeft + visibleSvgRight) / 2;
            const computedSvgX = ((visibleCenterScreen - offsetX) / renderedSvgWidth) * 800;
            targetSvgX = Math.min(360, Math.max(200, Number(computedSvgX.toFixed(1))));
          } else {
            targetSvgX = 260;
          }
        }
      }

      // Mathematical mapping in SVG user space:
      // When <g transform="translate(pan.x, pan.y) scale(zoom)">:
      // centerX is mapped to: targetPanX + targetZoom * centerX = targetSvgX
      // => targetPanX = targetSvgX - targetZoom * centerX
      // => targetPanY = targetSvgY - targetZoom * centerY
      const targetPanX = Number((targetSvgX - targetZoom * centerX).toFixed(1));
      const targetPanY = Number((targetSvgY - targetZoom * centerY).toFixed(1));

      setZoom(targetZoom);
      setPan({ x: targetPanX, y: targetPanY });
    },
    []
  );

  // Zoom to State when selectedState changes or clicked
  useEffect(() => {
    if (!selectedState || !svgDataset) return;
    const targetState = svgDataset.states.find(
      (s) => normalizeKey(s.state) === normalizeKey(selectedState)
    );
    if (targetState) {
      zoomToTarget(targetState.bounds, false);
    }
  }, [selectedState, svgDataset, zoomToTarget]);

  // Handle Search Query Filter & Auto-zoom
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !svgDataset) return;

    const qClean = normalizeKey(query);

    // First check constituency match
    const matchedC = svgDataset.constituencies.find(
      (c) => normalizeKey(c.name).includes(qClean) || qClean.includes(normalizeKey(c.name))
    );
    if (matchedC) {
      handleConstituencyClick(matchedC);
      return;
    }

    // Next check state match
    const matchedS = svgDataset.states.find(
      (s) => normalizeKey(s.state).includes(qClean) || qClean.includes(normalizeKey(s.state))
    );
    if (matchedS) {
      zoomToTarget(matchedS.bounds, false);
      if (onSelectState) onSelectState(matchedS.state);
    }
  };

  // Zoom In / Out Handlers (centered on map center)
  const handleZoomIn = () => {
    setZoom((prevZoom) => {
      const nextZoom = Math.min(12.0, Number((prevZoom * 1.3).toFixed(2)));
      setPan((prevPan) => {
        const gx = (400 - prevPan.x) / prevZoom;
        const gy = (460 - prevPan.y) / prevZoom;
        return {
          x: 400 - nextZoom * gx,
          y: 460 - nextZoom * gy,
        };
      });
      return nextZoom;
    });
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => {
      const nextZoom = Math.max(1.0, Number((prevZoom / 1.3).toFixed(2)));
      if (nextZoom <= 1.0) {
        setPan({ x: 0, y: 0 });
        return 1.0;
      }
      setPan((prevPan) => {
        const gx = (400 - prevPan.x) / prevZoom;
        const gy = (460 - prevPan.y) / prevZoom;
        return {
          x: 400 - nextZoom * gx,
          y: 460 - nextZoom * gy,
        };
      });
      return nextZoom;
    });
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedConstituency(null);
    setSearchQuery("");
  };

  // Mouse & Touch Pan Handling in SVG user units
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Accurate SVG user unit delta per screen pixel taking letterbox into account
    const svgAspect = 800 / 920;
    const containerAspect = rect.width / rect.height;
    const scaleFactor = containerAspect > svgAspect
      ? 920 / rect.height
      : 800 / rect.width;

    const dx = (e.clientX - dragStart.x) * scaleFactor;
    const dy = (e.clientY - dragStart.y) * scaleFactor;
    setPan({
      x: Number((panStart.x + dx).toFixed(1)),
      y: Number((panStart.y + dy).toFixed(1)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click outside & Escape key handler to disengage map
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMapActive(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMapActive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Native non-passive Wheel Listener centered on cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      if (!isMapActive) {
        // Map is not active: allow page scrollbar to behave normally!
        return;
      }

      // Map is active: prevent outer page scroll and zoom the map
      e.preventDefault();
      e.stopPropagation();

      const svg = svgRef.current;
      if (!svg) return;

      // Mouse position in SVG coordinates via native SVG matrix transform
      let cursorSvgX = 400;
      let cursorSvgY = 460;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(ctm.inverse());
        cursorSvgX = svgPt.x;
        cursorSvgY = svgPt.y;
      }

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(12.0, Math.max(1.0, Number((prevZoom * zoomFactor).toFixed(2))));
        if (nextZoom <= 1.0) {
          setPan({ x: 0, y: 0 });
          return 1.0;
        }

        setPan((prevPan) => {
          const gx = (cursorSvgX - prevPan.x) / prevZoom;
          const gy = (cursorSvgY - prevPan.y) / prevZoom;
          return {
            x: Number((cursorSvgX - nextZoom * gx).toFixed(1)),
            y: Number((cursorSvgY - nextZoom * gy).toFixed(1)),
          };
        });

        return nextZoom;
      });
    };

    container.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheelNative);
    };
  }, [isMapActive]);

  // Constituency Click Handler
  const handleConstituencyClick = (c: SvgConstituency) => {
    setSelectedConstituency(c.name);
    zoomToTarget(c.bounds, true);

    const cKey = normalizeKey(c.name);
    const riskData = constituencyRisks.get(cKey) || {
      id: `CONST-${c.id}`,
      name: c.name,
      state: c.state,
      district: c.name,
      mp_name: "Lok Sabha MP",
      total_works: 0,
      total_allocation: 0,
      avg_risk_score: 30.0,
      flagged_works_count: 0,
      risk_level: "Low",
    };

    if (onSelectConstituency) {
      onSelectConstituency(riskData);
    }
  };

  // State Click Handler (when at state level)
  const handleStateClick = (stateName: string) => {
    if (svgDataset) {
      const s = svgDataset.states.find(
        (st) => normalizeKey(st.state) === normalizeKey(stateName)
      );
      if (s) {
        setSelectedConstituency(null);
        zoomToTarget(s.bounds, false);
      }
    }
    if (onSelectState) onSelectState(stateName);
  };

  return (
    <div className="relative w-full flex flex-col items-center space-y-3 font-sans">
      {/* Top Map Control Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Left: Quick Geo Search & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search constituency or state..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] py-1.5 pl-8 pr-7 text-xs text-[#1C1917] shadow-2xs focus:border-[#6E4529] focus:outline-none w-52 sm:w-60 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearch("")}
                className="absolute right-2 top-2 text-stone-400 hover:text-stone-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Layer Mode Selector */}
          <div className="flex items-center rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] p-0.5 text-[11px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setLayerMode("auto")}
              className={`rounded px-2 py-1 transition-all ${
                layerMode === "auto"
                  ? "bg-[#6E4529] text-[#F5EBE1] shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Auto (LOD)
            </button>
            <button
              type="button"
              onClick={() => setLayerMode("states")}
              className={`rounded px-2 py-1 transition-all ${
                layerMode === "states"
                  ? "bg-[#6E4529] text-[#F5EBE1] shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              States
            </button>
            <button
              type="button"
              onClick={() => setLayerMode("constituencies")}
              className={`rounded px-2 py-1 transition-all ${
                layerMode === "constituencies"
                  ? "bg-[#6E4529] text-[#F5EBE1] shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Constituencies
            </button>
          </div>

          {/* Labels Toggle */}
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-mono font-bold transition-all ${
              showLabels
                ? "bg-[#6E4529] text-[#F5EBE1] border-[#6E4529]"
                : "bg-[#FAF7F2] text-stone-600 border-[#D9D2C5] hover:bg-[#FFFDF9]"
            }`}
          >
            {showLabels ? "Labels: ON" : "Labels: OFF"}
          </button>
        </div>

        {/* Right: Dynamic Risk Scale Legend */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 shadow-2xs" />
            <span className="text-stone-600 text-[10px] font-mono font-medium">Low (&lt;35)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 shadow-2xs" />
            <span className="text-stone-600 text-[10px] font-mono font-medium">Medium (35–49)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-orange-500 shadow-2xs" />
            <span className="text-stone-600 text-[10px] font-mono font-medium">High (50–64)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500 animate-pulse shadow-2xs" />
            <span className="text-stone-600 text-[10px] font-mono font-medium">Critical (≥65)</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas Container */}
      <div
        ref={containerRef}
        onClick={() => setIsMapActive(true)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setIsMapActive(false); // When pointer moves outside, restore normal page scroll immediately
        }}
        style={{
          touchAction: isMapActive ? "none" : "pan-y",
        }}
        className={`relative w-full aspect-[800/900] max-h-[720px] rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden select-none cursor-grab active:cursor-grabbing ${
          isMapActive
            ? "ring-2 ring-[#6E4529] border-[#6E4529] shadow-2xl"
            : isWhiteTheme
            ? "bg-[#FAF7F2] border-[#E5DFD3]"
            : "bg-[#0A101D] border-slate-800"
        }`}
      >
        {/* Floating Zoom Controls & Indicator Pill */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
          {/* Zoom Buttons Group */}
          <div className="flex flex-col rounded-xl border border-[#D9D2C5] bg-[#FFFDF9]/95 p-1 shadow-md backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              className="rounded-lg p-1.5 text-stone-700 hover:bg-[#F0ECE1] hover:text-stone-900 transition-colors cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="h-[1px] bg-[#E5DFD3] my-0.5" />
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="rounded-lg p-1.5 text-stone-700 hover:bg-[#F0ECE1] hover:text-stone-900 transition-colors cursor-pointer"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="h-[1px] bg-[#E5DFD3] my-0.5" />
            <button
              type="button"
              onClick={handleResetView}
              title="Reset View"
              className="rounded-lg p-1.5 text-stone-700 hover:bg-[#F0ECE1] hover:text-stone-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Active Semantic Zoom & Engagement Pill */}
          <div className="rounded-xl border border-[#D9D2C5] bg-[#FFFDF9]/95 px-3 py-1.5 shadow-md backdrop-blur-md text-[11px] font-mono font-bold flex items-center gap-2 text-[#6E4529]">
            <span
              className={`h-2 w-2 rounded-full ${
                isMapActive ? "bg-emerald-500 animate-pulse" : "bg-stone-300"
              }`}
            />
            <span>{zoom.toFixed(1)}x</span>
            <span className="text-stone-300">•</span>
            <span>
              {isMapActive
                ? "Map Engaged: Scroll zooms map (Move pointer outside or Esc to release page)"
                : "Click map to enable scroll zoom • Page scroll active"}
            </span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loadingSvg && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FAF7F2]/80 backdrop-blur-xs space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#8C5D3B] border-t-transparent" />
            <span className="text-xs font-mono font-bold text-[#6E4529]">
              Loading 543 Parliamentary Constituency Boundaries...
            </span>
          </div>
        )}

        {/* SVG Drawing Layer */}
        {svgDataset && (
          <svg
            ref={svgRef}
            viewBox={svgDataset.viewBox || "0 0 800 920"}
            className="w-full h-full select-none"
          >
            <defs>
              <pattern id="auditGridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path
                  d="M 30 0 L 0 0 0 30"
                  fill="none"
                  stroke={isWhiteTheme ? "#EAE4D7" : "#17263b"}
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#auditGridPattern)" />

            {/* Viewport Transform Group for Smooth Centered Zoom & Pan */}
            <g
              id="mapViewportGroup"
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
              style={{
                transition: isDragging ? "none" : "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* LAYER 1: 543 PARLIAMENTARY CONSTITUENCIES */}
              <g
                id="constituenciesLayer"
                style={{
                  opacity: showConstituencies ? 1 : 0.85,
                  transition: "opacity 0.3s ease",
                }}
              >
                {svgDataset.constituencies.map((c) => {
                  const cKey = normalizeKey(c.name);
                  const riskData = constituencyRisks.get(cKey);
                  const stateData = stateDataMap.get(normalizeKey(c.state));

                  // Determine risk score (constituency specific or fallback to state average)
                  const score = riskData
                    ? riskData.avg_risk_score
                    : stateData
                    ? stateData.avg_risk_score
                    : 32.0;

                  const hasRealData = Boolean(riskData || stateData);
                  const fillColor = getRiskColor(score, hasRealData);

                  const isSelected =
                    selectedConstituency &&
                    normalizeKey(selectedConstituency) === cKey;
                  const isHovered =
                    hoveredConstituency &&
                    normalizeKey(hoveredConstituency.item.name) === cKey;

                  return (
                    <path
                      key={`pc-${c.id}`}
                      d={c.path}
                      fill={fillColor}
                      fillOpacity={
                        isSelected
                          ? 1.0
                          : isHovered
                          ? 0.95
                          : showConstituencies
                          ? 0.88
                          : 0.75
                      }
                      stroke={
                        isSelected
                          ? "#1C1917"
                          : isHovered
                          ? "#6E4529"
                          : showConstituencies
                          ? "#FFFFFF"
                          : "transparent"
                      }
                      strokeWidth={
                        isSelected
                          ? Math.max(1.0, 2.5 / Math.sqrt(zoom))
                          : isHovered
                          ? Math.max(0.7, 1.8 / Math.sqrt(zoom))
                          : Math.max(0.15, 0.4 / Math.sqrt(zoom))
                      }
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-150 hover:brightness-105"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConstituencyClick(c);
                      }}
                      onMouseEnter={(e) => {
                        setHoveredConstituency({
                          item: c,
                          risk: riskData,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseLeave={() => setHoveredConstituency(null)}
                      style={{
                        filter:
                          isSelected || isHovered
                            ? "drop-shadow(0 0 6px rgba(110, 69, 41, 0.6))"
                            : undefined,
                      }}
                    />
                  );
                })}
              </g>

              {/* LAYER 2: STATE CONTAINMENT OUTLINES & CENTROIDS */}
              <g id="statesLayer" className="pointer-events-none">
                {svgDataset.states.map((s) => {
                  const sKey = normalizeKey(s.state);
                  const isStateSelected =
                    selectedState && normalizeKey(selectedState) === sKey;

                  return (
                    <g key={`state-group-${s.state}`}>
                      {/* State Centroid Label (Visible when zoomed out or in state mode) */}
                      {showLabels && (!showConstituencies || zoom < 2.5) && (
                        <g
                          transform={`translate(${s.centroid[0]}, ${s.centroid[1]})`}
                          className="select-none pointer-events-auto cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStateClick(s.state);
                          }}
                        >
                          <rect
                            x={-s.state.length * 3.4 - 5}
                            y="-8"
                            width={s.state.length * 6.8 + 10}
                            height="16"
                            rx="4"
                            fill={isStateSelected ? "#6E4529" : "#1C1917"}
                            fillOpacity="0.85"
                            stroke={isStateSelected ? "#FDE68A" : "#D9D2C5"}
                            strokeWidth={isStateSelected ? 1.5 : 0.6}
                            className="hover:fill-[#6E4529] transition-colors"
                          />
                          <text
                            x="0"
                            y="3.5"
                            textAnchor="middle"
                            className="text-[9px] font-mono font-bold fill-white pointer-events-none"
                          >
                            {s.state}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* LAYER 3: CONSTITUENCY LABELS (Visible at Zoom >= 2.0 with dynamic zoom-adaptive transparency) */}
              {showLabels && zoom >= 2.0 && (
                <g id="constituencyLabelsLayer" className="pointer-events-none select-none">
                  {svgDataset.constituencies.map((c) => {
                    const isSelected =
                      selectedConstituency &&
                      normalizeKey(selectedConstituency) === normalizeKey(c.name);

                    // Dynamic Transparency: as user zooms closer, increase label transparency (lower opacity)
                    // so high-zoom forensic polygon geometry and micro-features are not occluded
                    const labelOpacity = isSelected
                      ? 0.95
                      : Math.max(0.18, Math.min(0.9, 1.0 - (zoom - 2.0) * 0.1));

                    const dynamicFontSize = isSelected
                      ? Math.max(4.8, 9.0 / Math.pow(zoom, 0.42))
                      : Math.max(3.6, 7.2 / Math.pow(zoom, 0.42));

                    const dynamicStroke = isSelected
                      ? Math.max(0.8, 2.2 / Math.sqrt(zoom))
                      : Math.max(0.5, 1.5 / Math.sqrt(zoom));

                    return (
                      <text
                        key={`label-${c.id}`}
                        x={c.centroid[0]}
                        y={c.centroid[1]}
                        textAnchor="middle"
                        opacity={Number(labelOpacity.toFixed(2))}
                        className={`font-mono font-bold transition-opacity duration-200 ${
                          isSelected
                            ? "fill-[#1C1917] drop-shadow-sm font-black"
                            : "fill-stone-800"
                        }`}
                        style={{
                          fontSize: `${dynamicFontSize.toFixed(1)}px`,
                          paintOrder: "stroke",
                          stroke: "#FFFDF9",
                          strokeWidth: `${dynamicStroke.toFixed(1)}px`,
                          strokeLinejoin: "round",
                        }}
                      >
                        {c.name}
                      </text>
                    );
                  })}
                </g>
              )}
            </g>
          </svg>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredConstituency && !selectedConstituency && (
          <div className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-xs rounded-xl border border-[#E5DFD3] bg-[#FFFDF9]/95 p-3 text-[#1C1917] shadow-xl backdrop-blur-md animate-in fade-in duration-100 font-sans">
            <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-1.5">
              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase">
                  {hoveredConstituency.item.state}
                </span>
                <h4 className="text-sm font-bold font-serif text-[#1C1917]">
                  {hoveredConstituency.item.name}
                </h4>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                  (hoveredConstituency.risk?.avg_risk_score || 0) >= 65
                    ? "bg-rose-50 border border-rose-200 text-rose-800"
                    : (hoveredConstituency.risk?.avg_risk_score || 0) >= 50
                    ? "bg-orange-50 border border-orange-200 text-orange-800"
                    : (hoveredConstituency.risk?.avg_risk_score || 0) >= 35
                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                }`}
              >
                Risk: {hoveredConstituency.risk?.avg_risk_score?.toFixed(1) || "Baseline"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-stone-400 block">Outlay</span>
                <span className="font-bold text-[#6E4529]">
                  ₹{(((hoveredConstituency.risk?.total_allocation || 0) / 10000000)).toFixed(2)} Cr
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">Flagged Works</span>
                <span className="font-bold text-rose-700">
                  {hoveredConstituency.risk?.flagged_works_count || 0}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-[#F0ECE1] text-[10px] text-stone-400 italic">
              Click constituency to open forensic dossier
            </div>
          </div>
        )}

        {/* Slide-over Forensic Details Drawer (Phase 4) */}
        <ConstituencyDetailDrawer
          constituencyName={selectedConstituency}
          initialData={
            selectedConstituency
              ? constituencyRisks.get(normalizeKey(selectedConstituency))
              : null
          }
          onClose={() => setSelectedConstituency(null)}
        />
      </div>
    </div>
  );
}
