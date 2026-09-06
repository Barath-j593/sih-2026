import React from "react";

interface RiskBadgeProps {
  score?: number;
  level?: string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function RiskBadge({ score, level, size = "md", showScore = true }: RiskBadgeProps) {
  const calculatedLevel =
    level ||
    (score !== undefined
      ? score >= 80
        ? "Critical"
        : score >= 60
        ? "High"
        : score >= 35
        ? "Medium"
        : "Low"
      : "Low");

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
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono ${colors[calculatedLevel] || colors.Low} ${sizeStyles[size]}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {calculatedLevel === "Critical" && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors.Critical}`} />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            dotColors[calculatedLevel] || "bg-emerald-600"
          }`}
        />
      </span>
      <span>{calculatedLevel}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80 font-mono font-medium">({score.toFixed(0)})</span>
      )}
    </span>
  );
}
