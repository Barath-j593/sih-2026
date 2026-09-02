"use client";

import React, { useEffect, useRef, useState } from "react";
import { Network, ShieldAlert, Users, Building, Filter, ZoomIn, ZoomOut, RefreshCw, ArrowRight, AlertTriangle } from "lucide-react";
import { RiskBadge } from "../ui/RiskBadge";

interface GraphNode {
  id: string;
  name: string;
  type: "mp" | "ida";
  total_amount: number;
  total_works: number;
  risk_score: number;
  val: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string;
  target: string;
  work_count: number;
  total_amount: number;
  share: number;
  is_high_risk: boolean;
}

interface MPIDANetworkGraphProps {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

export function MPIDANetworkGraph({ data }: MPIDANetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [minRisk, setMinRisk] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>("all");

  const nodes = data.nodes.filter((n) => {
    if (minRisk > 0 && n.risk_score < minRisk) return false;
    if (filterType !== "all" && n.type !== filterType) return false;
    return true;
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const links = data.links.filter(
    (l) => nodeMap.has(typeof l.source === "string" ? l.source : (l.source as any).id) &&
           nodeMap.has(typeof l.target === "string" ? l.target : (l.target as any).id)
  );

  // Top monopoly links ranked
  const monopolyRankings = [...data.links]
    .sort((a, b) => b.share - a.share)
    .slice(0, 4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.parentElement?.clientWidth || 700;
    let height = 450;
    canvas.width = width;
    canvas.height = height;

    // Assign initial coordinates
    const simulationNodes = nodes.map((n, i) => {
      const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2;
      const radius = n.type === "mp" ? 110 + (i % 3) * 35 : 170 + (i % 4) * 25;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
        y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
      };
    });

    const simMap = new Map(simulationNodes.map((n) => [n.id, n]));

    let animationFrameId: number;
    let iteration = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background grid dots
      ctx.fillStyle = "#1e293b";
      for (let x = 20; x < width; x += 40) {
        for (let y = 20; y < height; y += 40) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }

      // Draw Links
      links.forEach((l) => {
        const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
        const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
        const sourceNode = simMap.get(sId);
        const targetNode = simMap.get(tId);

        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);

          if (l.is_high_risk || l.share > 0.60) {
            ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
            ctx.lineWidth = 2.5;
          } else {
            ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
            ctx.lineWidth = 1;
          }
          ctx.stroke();
        }
      });

      // Draw Nodes
      simulationNodes.forEach((n) => {
        if (!n.x || !n.y) return;

        const isSelected = selectedNode?.id === n.id;
        const isMP = n.type === "mp";
        const radius = isMP ? 9 : 7;

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + (isSelected ? 4 : 0), 0, Math.PI * 2);

        if (isMP) {
          ctx.fillStyle = isSelected ? "#38bdf8" : "#0284c7";
        } else {
          ctx.fillStyle = n.risk_score >= 60 ? "#ef4444" : isSelected ? "#f59e0b" : "#d97706";
        }
        ctx.fill();

        ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(15, 23, 42, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label for high risk or selected
        if (isSelected || n.risk_score >= 70 || n.total_works > 50) {
          ctx.fillStyle = isSelected ? "#ffffff" : "#94a3b8";
          ctx.font = isSelected ? "bold 11px sans-serif" : "9px sans-serif";
          ctx.fillText(n.name.substring(0, 18), n.x + 12, n.y + 3);
        }
      });

      iteration++;
      if (iteration < 60) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    // Click handler for canvas
    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      let found: GraphNode | null = null;
      for (const n of simulationNodes) {
        if (n.x && n.y) {
          const dist = Math.hypot(n.x - clickX, n.y - clickY);
          if (dist <= 14) {
            found = n;
            break;
          }
        }
      }
      setSelectedNode(found);
    };

    canvas.addEventListener("click", handleCanvasClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [nodes.length, minRisk, filterType, selectedNode?.id]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-950 px-2 py-0.5 text-[11px] font-bold text-cyan-400 border border-cyan-500/30">
              MONEY FLOW VISUALIZER
            </span>
            <h3 className="text-base font-bold text-white">MP ➔ Implementing Agency Money Flow & Monopoly Inspector</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Visually reveals where public funds flow from MPs to District Agencies, highlighting single-agency monopolies.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`rounded px-2 py-0.5 font-medium ${filterType === "all" ? "bg-slate-800 text-white" : "text-slate-400"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("mp")}
              className={`rounded px-2 py-0.5 font-medium ${filterType === "mp" ? "bg-slate-800 text-white" : "text-slate-400"}`}
            >
              MPs
            </button>
            <button
              onClick={() => setFilterType("ida")}
              className={`rounded px-2 py-0.5 font-medium ${filterType === "ida" ? "bg-slate-800 text-white" : "text-slate-400"}`}
            >
              Agencies
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5 text-saffron-400" />
            <span>Min Risk:</span>
            <select
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value={0} className="bg-slate-900">All (0+)</option>
              <option value={40} className="bg-slate-900">Medium (40+)</option>
              <option value={60} className="bg-slate-900">High (60+)</option>
              <option value={75} className="bg-slate-900">Critical (75+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Guide Legend Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-blue-500 shrink-0" />
          <span className="text-slate-300 font-medium">🔵 Blue Circles: MPs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-slate-300 font-medium">🟠 Amber Circles: Normal Agencies</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
          <span className="text-red-300 font-bold">🔴 Red Circles: High-Capture Agencies</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1 w-6 bg-red-500 shrink-0" />
          <span className="text-red-400 font-bold">🔴 Red Lines: Monopoly (&gt;65%)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Canvas visualizer */}
        <div className="lg:col-span-8 relative rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden flex items-center justify-center min-h-[440px]">
          <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

          <div className="absolute top-3 left-3 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-[11px] text-slate-400">
            Click on any circle to inspect fund concentration
          </div>
        </div>

        {/* Right Side: Selected Node Inspector + Top Monopoly Findings */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Node Inspector */}
          {selectedNode ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs text-saffron-400 font-semibold uppercase">
                  {selectedNode.type === "mp" ? <Users className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                  {selectedNode.type === "mp" ? "Member of Parliament" : "Executing Agency"}
                </div>
                <RiskBadge score={selectedNode.risk_score} size="sm" />
              </div>

              <h4 className="text-sm font-bold text-white leading-snug">{selectedNode.name}</h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between rounded-lg bg-slate-900/70 p-2">
                  <span className="text-slate-400">Total Sanctioned:</span>
                  <span className="font-bold text-white">₹{(selectedNode.total_amount / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-900/70 p-2">
                  <span className="text-slate-400">Total Works Count:</span>
                  <span className="font-bold text-white">{selectedNode.total_works} works</span>
                </div>
              </div>

              <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-2.5 text-[11px] text-red-200">
                <span className="font-bold text-red-400 block mb-0.5">Monopoly Finding:</span>
                {selectedNode.risk_score >= 60
                  ? "Captures disproportionately high share of funding from recommended projects."
                  : "Diversified allocation profile across regular public works."}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-center text-xs text-slate-500">
              Click any circle on the canvas to inspect agency allocations.
            </div>
          )}

          {/* Top Monopoly Findings Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-slate-800 pb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span>Highest Captured MP-Agency Loops</span>
            </div>

            <div className="space-y-2">
              {monopolyRankings.map((l, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-red-900/40 bg-slate-900/60 p-2 text-xs space-y-1"
                >
                  <div className="flex justify-between font-semibold text-white text-[11px]">
                    <span className="truncate max-w-[120px]">{typeof l.source === "string" ? l.source : (l.source as any).name}</span>
                    <span className="text-red-400 font-bold">{Math.round(l.share * 100)}% of Funds</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 text-saffron-400 shrink-0" />
                    <span className="truncate">{typeof l.target === "string" ? l.target : (l.target as any).name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
