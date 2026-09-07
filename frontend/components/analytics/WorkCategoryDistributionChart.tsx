"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PieChart as PieIcon, BarChart3, RotateCcw, Check } from "lucide-react";

interface WorkCategoryDistributionProps {
  categories?: string[];
  totalWorks?: number;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  className?: string;
}

// 8 Well-Differentiated Semantic Colors (Blue, Emerald, Orange, Purple, Red, Teal, Amber, Pink)
const STATUTORY_CATEGORIES = [
  { name: "Drinking Water", count: 652, pct: 13.0, color: "#0284C7", delay: 90 },
  { name: "Public Health", count: 649, pct: 13.0, color: "#10B981", delay: 210 },
  { name: "Roads & Bridges", count: 638, pct: 12.8, color: "#EA580C", delay: 180 },
  { name: "Education Infrastructure", count: 625, pct: 12.5, color: "#7C3AED", delay: 150 },
  { name: "Mega Infrastructure", count: 623, pct: 12.5, color: "#DC2626", delay: 400 },
  { name: "Irrigation & Agriculture", count: 620, pct: 12.4, color: "#0D9488", delay: 160 },
  { name: "Community Infrastructure", count: 613, pct: 12.2, color: "#D97706", delay: 120 },
  { name: "Renewable Energy", count: 580, pct: 11.6, color: "#EC4899", delay: 60 },
];

export function WorkCategoryAnalytics({
  categories = [],
  totalWorks = 5000,
  selectedCategory = "",
  onSelectCategory,
  className = "",
}: WorkCategoryDistributionProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = STATUTORY_CATEGORIES;
  const activeItem = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;

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

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-3 shadow-lg text-xs font-sans">
          <div className="flex items-center gap-2 font-bold text-[#1C1917]">
            <span
              className="h-3 w-3 rounded-full shadow-xs"
              style={{ backgroundColor: d.color }}
            />
            <span>{d.name}</span>
          </div>
          <div className="mt-1 space-y-0.5 text-stone-600 font-mono text-[11px]">
            <p>
              Sanctioned Works: <span className="font-bold text-[#1C1917]">{d.count}</span> ({d.pct}%)
            </p>
            <p>
              Average Execution Delay: <span className="font-bold text-amber-700">{d.delay} days</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const delayBarData = [
    { sector: "Mega Infra", days: 400 },
    { sector: "Public Health", days: 210 },
    { sector: "Roads & Bridges", days: 180 },
    { sector: "Irrigation", days: 160 },
    { sector: "Education", days: 150 },
    { sector: "Community", days: 120 },
    { sector: "Drinking Water", days: 90 },
    { sector: "Renewable", days: 60 },
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* 1. Category Distribution Donut with In-Slice Percentages */}
      <div className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-stone-700" />
            <h3 className="text-base font-bold tracking-tight text-[#1C1917]">
              Work Categories Distribution
            </h3>
          </div>
          <span className="text-xs font-mono font-medium text-stone-500">
            {totalWorks.toLocaleString()} Total Works
          </span>
        </div>

        {/* Donut with persistent percentages and center metric */}
        <div className="relative my-2 flex items-center justify-center">
          {mounted ? (
            <div className="relative h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2.5}
                    dataKey="count"
                    label={renderCustomizedLabel}
                    labelLine={false}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(entry) => onSelectCategory && onSelectCategory(entry.name)}
                  >
                    {data.map((entry, index) => {
                      const isSelected = selectedCategory === entry.name;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={isSelected ? "#1C1917" : "#FFFDF9"}
                          strokeWidth={isSelected ? 3.5 : 1.5}
                          className="transition-all duration-200 cursor-pointer outline-none hover:opacity-95"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Interactive Center Hole Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-2xl font-mono font-black text-[#1C1917] leading-tight">
                  {activeItem
                    ? `${activeItem.pct.toFixed(0)}%`
                    : `${totalWorks.toLocaleString()}`}
                </span>
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider max-w-[85px] truncate text-center">
                  {activeItem ? activeItem.name : "All Works"}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-60 w-full animate-pulse rounded-lg bg-stone-100 flex items-center justify-center">
              <span className="text-xs text-stone-400 font-mono">Loading chart...</span>
            </div>
          )}
        </div>

        {/* Clickable Legend with Badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 pt-3 border-t border-[#F0ECE1]">
          {data.map((item) => {
            const isSelected = selectedCategory === item.name;
            return (
              <button
                key={item.name}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? "" : item.name)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#6E4529] text-white shadow-xs font-bold"
                    : "hover:bg-stone-100 text-stone-700 bg-[#FAF7F2] border border-[#E5DFD3]"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-sans">{item.name}</span>
                <span
                  className={`font-mono text-[10px] font-bold px-1 rounded ${
                    isSelected ? "bg-white/20 text-white" : "text-stone-600 bg-stone-200/70"
                  }`}
                >
                  {item.pct.toFixed(0)}%
                </span>
                {isSelected && <Check className="h-3 w-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Sector Delays Horizontal Bar Chart */}
      <div className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-stone-700" />
            <h3 className="text-base font-bold tracking-tight text-[#1C1917]">
              Infrastructure Category Delay Profile
            </h3>
          </div>
          <span className="text-xs font-mono font-medium text-stone-500">
            Average Delay (Days)
          </span>
        </div>

        <div className="my-2 h-[260px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={delayBarData}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 24, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  type="number"
                  domain={[0, 420]}
                  ticks={[0, 100, 200, 300, 400]}
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
                  width={95}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} days average delay`, "Delay"]}
                />
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
            <div className="h-full w-full animate-pulse rounded-lg bg-stone-100" />
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE1] text-[10px] font-mono text-stone-500">
          <span>Click any category on the left to filter the audit ledger</span>
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory && onSelectCategory("")}
              className="text-[#6E4529] font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="h-2.5 w-2.5" /> Clear Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
