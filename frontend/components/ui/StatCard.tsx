import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "danger" | "warning" | "success" | "accent";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "border-[#E5DFD3] bg-[#FFFDF9] text-[#1C1917]",
    danger: "border-rose-200 bg-[#FFF5F5] text-[#1C1917]",
    warning: "border-[#FDE68A] bg-[#FEFDF7] text-[#1C1917]",
    success: "border-emerald-200 bg-[#F4FBF7] text-[#1C1917]",
    accent: "border-[#E5DFD3] bg-[#FAF7F2] text-[#1C1917]",
  };

  const iconColors = {
    default: "text-[#6E4529] bg-[#F0ECE1] border border-[#E5DFD3]",
    danger: "text-rose-700 bg-rose-100/70 border border-rose-200",
    warning: "text-amber-800 bg-amber-100/70 border border-amber-200",
    success: "text-emerald-800 bg-emerald-100/70 border border-emerald-200",
    accent: "text-[#6E4529] bg-[#F0ECE1] border border-[#E5DFD3]",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 shadow-[0_2px_10px_rgba(40,20,10,0.03)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(40,20,10,0.06)] hover:-translate-y-0.5 ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">{title}</p>
          <p className="mt-1.5 text-2xl sm:text-3xl font-editorial font-bold tracking-tight text-[#1C1917] font-tabular">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 sm:p-3 shrink-0 ${iconColors[variant]}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-stone-500 border-t border-[#E5DFD3]/60 pt-2.5 font-sans">
          {subtitle && <span className="text-[11px] text-stone-500">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono font-bold text-xs ${
                trend.isPositive ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
