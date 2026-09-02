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
    default: "border-slate-200 bg-white text-slate-900",
    danger: "border-red-200 bg-red-50/40 text-slate-900",
    warning: "border-amber-200 bg-amber-50/40 text-slate-900",
    success: "border-emerald-200 bg-emerald-50/40 text-slate-900",
    accent: "border-blue-200 bg-blue-50/40 text-slate-900",
  };

  const iconColors = {
    default: "text-slate-700 bg-slate-100",
    danger: "text-red-600 bg-red-100",
    warning: "text-amber-600 bg-amber-100",
    success: "text-emerald-600 bg-emerald-100",
    accent: "text-blue-600 bg-blue-100",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 sm:p-3 ${iconColors[variant]}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? "text-emerald-600" : "text-red-600"
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
