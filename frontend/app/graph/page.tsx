"use client";

import React, { useEffect, useState } from "react";
import { fetchNetworkGraph } from "../../lib/api";
import { MPIDANetworkGraph } from "../../components/graph/MPIDANetworkGraph";
import { Network, ShieldAlert, Users, Building, Activity, Info } from "lucide-react";

export default function NetworkGraphPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [maxNodes, setMaxNodes] = useState(150);

  useEffect(() => {
    async function loadGraph() {
      setLoading(true);
      try {
        const res = await fetchNetworkGraph(maxNodes, 0);
        setGraphData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [maxNodes]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-900 border border-cyan-200">
              BIPARTITE GRAPH ANALYSIS
            </span>
            <span className="text-xs text-slate-500 font-mono">NetworkX Topology</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            MP–IDA Money Flow & Monopoly Visualizer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Interactive relationship visualizer surfacing contractor monopolies, high-weight edges, and fund concentration loops.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <span className="font-medium text-slate-500">Graph Complexity:</span>
            <select
              value={maxNodes}
              onChange={(e) => setMaxNodes(Number(e.target.value))}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value={80}>80 Key Nodes</option>
              <option value={150}>150 Standard Nodes</option>
              <option value={250}>250 Dense Network</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-md" />
          <p className="text-xs font-semibold text-slate-600">Computing bipartite graph topology & PageRank...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <MPIDANetworkGraph data={graphData} />

          {/* Network Graph Explanation Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <Users className="h-4 w-4 text-blue-600" /> MP Recommenders (Blue)
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Nodes sized by total MPLADS allocation volume recommended across parliamentary tenures.
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Building className="h-4 w-4 text-amber-600" /> Executing IDAs (Amber/Red)
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Implementing District Authorities colored red when vendor capture exceeds the 65% statutory threshold.
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4 text-red-600" /> Monopolistic Links
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Highlighted red links represent single-agency fund capture and tight allocation loops.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
