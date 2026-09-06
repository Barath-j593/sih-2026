import React from "react";
import { normalizeRiskLevel, normalizePriority } from "../../lib/typologies";

interface RiskBadgeProps {
  score?: number;
  level?: string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function RiskBadge({ score, level, size = "md", showScore = true }: RiskBadgeProps) {
  const normalizedLevel = level
    ? normalizeRiskLevel(level)
    : score !== undefined
    ? score >= 80
      ? "Critical"
      : score >= 60
      ? "High"
      : score >= 35
      ? "Medium"
      : "Low"
    : "Low";

  const colors: Record<string, string> = {
    Critical: "bg-rose-50 text-rose-800 border-rose-300 shadow-2xs",
    High: "bg-orange-50 text-orange-900 border-orange-300 shadow-2xs",
    Medium: "bg-amber-50 text-amber-900 border-amber-300 shadow-2xs",
    Low: "bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs",
  };

  const dotColors: Record<string, string> = {
    Critical: "bg-rose-600 animate-ping",
    High: "bg-orange-600",
    Medium: "bg-amber-600",
    Low: "bg-emerald-600",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 font-bold tracking-wider",
    md: "text-xs px-2.5 py-0.5 font-bold tracking-wider",
    lg: "text-xs px-3 py-1 font-bold tracking-wider",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono uppercase ${
        colors[normalizedLevel] || colors.Low
      } ${sizeStyles[size]}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {normalizedLevel === "Critical" && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors.Critical}`} />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            dotColors[normalizedLevel] || "bg-emerald-600"
          }`}
        />
      </span>
      <span>{normalizedLevel}</span>
      {showScore && score !== undefined && (
        <span className="opacity-85 font-mono font-medium">({score.toFixed(0)})</span>
      )}
    </span>
  );
}

export function PriorityBadge({
  priority,
  size = "md",
}: {
  priority?: string;
  size?: "sm" | "md";
}) {
  const norm = normalizePriority(priority);

  const styles: Record<string, string> = {
    IMMEDIATE: "bg-rose-100 text-rose-900 border-rose-300",
    PRIORITY: "bg-amber-100 text-amber-900 border-amber-300",
    ROUTINE: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono font-bold uppercase tracking-wider border ${
        styles[norm] || styles.ROUTINE
      } ${sizeClass}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          norm === "IMMEDIATE" ? "bg-rose-600 animate-pulse" : norm === "PRIORITY" ? "bg-amber-600" : "bg-slate-500"
        }`}
      />
      <span>{norm} Priority</span>
    </span>
  );
}
