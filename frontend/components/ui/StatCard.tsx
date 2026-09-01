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
    default: "border-slate-800 bg-slate-900/60 text-slate-100",
    danger: "border-red-900/40 bg-red-950/20 text-red-100",
    warning: "border-amber-900/40 bg-amber-950/20 text-amber-100",
    success: "border-emerald-900/40 bg-emerald-950/20 text-emerald-100",
    accent: "border-blue-900/40 bg-blue-950/20 text-blue-100",
  };

  const iconColors = {
    default: "text-slate-400 bg-slate-800/80",
    danger: "text-red-400 bg-red-900/30",
    warning: "text-amber-400 bg-amber-900/30",
    success: "text-emerald-400 bg-emerald-900/30",
    accent: "text-blue-400 bg-blue-900/30",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 backdrop-blur-md transition-all duration-200 hover:border-slate-700 hover:shadow-lg ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 sm:p-3 ${iconColors[variant]}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2.5">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive ? "text-emerald-400" : "text-red-400"
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
