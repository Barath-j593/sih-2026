"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock } from "lucide-react";
import { FraudTypeBreakdownItem } from "../../lib/types";

interface AnomalyCategoryDonutProps {
  fraudBreakdown?: FraudTypeBreakdownItem[];
  totalFlagged?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

// 5 Well-Differentiated Colors (Orange, Blue, Red, Green, Purple)
const DEFAULT_ANOMALY_DATA = [
  { name: "Split Sanction Smurfing", value: 48, color: "#EA580C", amount: 240.5 },
  { name: "Uncommenced Work (>90d)", value: 42, color: "#0284C7", amount: 185.2 },
  { name: "Single-Bid Collusion", value: 38, color: "#DC2626", amount: 310.0 },
  { name: "Missing Measurement Book", value: 32, color: "#059669", amount: 160.8 },
  { name: "Abnormal Cost Overrun", value: 24, color: "#7C3AED", amount: 195.4 },
];

const DISTINCT_PALETTE = [
  "#EA580C", // Vibrant Orange
  "#0284C7", // Sky/Cerulean Blue
  "#DC2626", // Crimson Red
  "#059669", // Emerald Green
  "#7C3AED", // Royal Purple
  "#D97706", // Golden Amber
  "#0D9488", // Teal
  "#EC4899", // Magenta Pink
];

const COLOR_MAP: Record<string, string> = {
  smurfing: "#EA580C",
  structuring: "#EA580C",
  delayed: "#0284C7",
  uncommenced: "#0284C7",
  ghost: "#0284C7",
  single_bid: "#DC2626",
  collusion: "#DC2626",
  cartel: "#DC2626",
  measurement: "#059669",
  verification: "#059669",
  missing: "#059669",
  overrun: "#7C3AED",
  overpricing: "#7C3AED",
  cost: "#7C3AED",
};

export function AnomalyCategoryDonut({
  fraudBreakdown,
  totalFlagged,
  title = "Anomaly Distribution by Category",
  subtitle,
  className = "",
}: AnomalyCategoryDonutProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Process data from props or fallback to calibrated default
  const chartData = useMemo(() => {
    if (!fraudBreakdown || fraudBreakdown.length === 0) {
      return DEFAULT_ANOMALY_DATA;
    }

    return fraudBreakdown.map((item, idx) => {
      let color = DISTINCT_PALETTE[idx % DISTINCT_PALETTE.length];
      const lower = (item.fraud_type + " " + (item.label || "")).toLowerCase();
      for (const [key, val] of Object.entries(COLOR_MAP)) {
        if (lower.includes(key)) {
          color = val;
          break;
        }
      }
      return {
        name: item.label || item.fraud_type.replace(/_/g, " "),
        value: item.count || 1,
        color,
        amount: item.total_amount ? item.total_amount / 100000 : 0,
      };
    });
  }, [fraudBreakdown]);

  const totalIncidents = totalFlagged ?? chartData.reduce((acc, curr) => acc + curr.value, 0);
  const activeItem = activeIndex !== null && chartData[activeIndex] ? chartData[activeIndex] : null;

  // Render clean, persistent percentage label centered inside each donut slice
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.04) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[11px] font-mono font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] pointer-events-none select-none tracking-tight"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalIncidents > 0 ? ((data.value / totalIncidents) * 100).toFixed(1) : 0;
      return (
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-3 shadow-lg text-xs font-sans">
          <div className="flex items-center gap-2 font-bold text-[#1C1917]">
            <span
              className="h-3 w-3 rounded-full shadow-xs"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.name}</span>
          </div>
          <div className="mt-1.5 space-y-0.5 text-stone-600 font-mono text-[11px]">
            <p>
              Incidents: <span className="font-bold text-[#1C1917]">{data.value}</span> ({pct}%)
            </p>
            {data.amount > 0 && (
              <p>
                Value at Risk: <span className="font-bold text-[#6E4529]">₹{data.amount.toFixed(1)} Lakhs</span>
              </p>
            )}
          </div>
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
          <Clock className="h-4 w-4 text-stone-700" />
          <h3 className="text-base font-bold tracking-tight text-[#1C1917]">
            {title}
          </h3>
        </div>
        <span className="text-xs font-mono font-medium text-stone-500">
          {subtitle || `${totalIncidents} Flagged Incidents`}
        </span>
      </div>

      {/* Donut Chart with Center Hole Stat & Persistent Percentage Labels */}
      <div className="relative my-2 flex items-center justify-center">
        {mounted ? (
          <div className="relative h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#FFFDF9"
                      strokeWidth={activeIndex === index ? 3.5 : 2}
                      className="transition-all duration-200 cursor-pointer outline-none hover:opacity-95"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Interactive Center Hole Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-2xl font-mono font-black text-[#1C1917] leading-tight">
                {activeItem
                  ? `${((activeItem.value / totalIncidents) * 100).toFixed(0)}%`
                  : totalIncidents}
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider max-w-[90px] truncate text-center">
                {activeItem ? activeItem.name : "Total Flagged"}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-60 w-full animate-pulse rounded-lg bg-stone-100 flex items-center justify-center">
            <span className="text-xs text-stone-400 font-mono">Loading chart...</span>
          </div>
        )}
      </div>

      {/* Clean, Informative Legend with Category Swatch, Name & Percentage Badge */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pt-3 border-t border-[#F0ECE1]">
        {chartData.map((item, idx) => {
          const pct = totalIncidents > 0 ? ((item.value / totalIncidents) * 100).toFixed(0) : "0";
          const isHovered = activeIndex === idx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
                isHovered
                  ? "bg-stone-100 ring-1 ring-stone-300 shadow-2xs"
                  : "hover:bg-stone-50"
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className="h-3 w-3 rounded-xs shrink-0 shadow-2xs"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-medium text-stone-800 font-sans">
                {item.name}
              </span>
              <span
                className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-2xs"
                style={{ backgroundColor: item.color }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
