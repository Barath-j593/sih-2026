"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface SectorDelayItem {
  sector: string;
  days: number;
  count?: number;
}

interface DelayedSectorsBarChartProps {
  data?: SectorDelayItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const DEFAULT_SECTOR_DELAYS: SectorDelayItem[] = [
  { sector: "Rural Roads", days: 146 },
  { sector: "Drinking Water", days: 120 },
  { sector: "Community Halls", days: 96 },
  { sector: "School Classrooms", days: 88 },
  { sector: "Irrigation Drains", days: 80 },
  { sector: "Primary Health", days: 73 },
  { sector: "Solar Lighting", days: 48 },
  { sector: "Public Sanitation", days: 40 },
];

export function DelayedSectorsBarChart({
  data = DEFAULT_SECTOR_DELAYS,
  title = "Top 8 Delayed Infrastructure Sectors",
  subtitle = "Average Delay (Days)",
  className = "",
}: DelayedSectorsBarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-3 shadow-lg text-xs font-sans">
          <p className="font-bold text-[#1C1917]">{item.sector}</p>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
            <span className="text-sm font-black text-blue-600">{item.days}</span>
            <span className="text-stone-500 text-[11px]">days avg. delay</span>
          </div>
          {item.count && (
            <p className="mt-0.5 text-[10px] text-stone-500 font-mono">
              Monitored Works: {item.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] flex flex-col justify-between ${className}`}
    >
      {/* Header matching user reference */}
      <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-stone-700" />
          <h3 className="text-base font-bold tracking-tight text-[#1C1917]">
            {title}
          </h3>
        </div>
        <span className="text-xs font-mono font-medium text-stone-500">
          {subtitle}
        </span>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="my-2 h-[260px] w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 20, left: 28, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#F1F5F9"
              />
              <XAxis
                type="number"
                domain={[0, 160]}
                ticks={[0, 40, 80, 120, 160]}
                stroke="#CBD5E1"
                tick={{ fontSize: 10, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                type="category"
                dataKey="sector"
                stroke="#CBD5E1"
                tick={{ fontSize: 10, fill: "#334155" }}
                axisLine={{ stroke: "#E2E8F0" }}
                width={105}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="days"
                fill="#3B82F6"
                radius={[0, 4, 4, 0]}
                barSize={15}
                className="hover:fill-blue-600 transition-colors cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg bg-stone-100 flex items-center justify-center">
            <span className="text-xs text-stone-400 font-mono">Loading chart...</span>
          </div>
        )}
      </div>

      {/* Footer subtle caption */}
      <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE1] text-[10px] font-mono text-stone-500">
        <span>Execution delay beyond approved administrative milestones</span>
        <span>Source: Stage 1 Pipeline</span>
      </div>
    </div>
  );
}
