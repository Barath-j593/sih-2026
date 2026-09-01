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
    Critical: "bg-red-950/80 text-red-300 border-red-500/50 shadow-red-950/50",
    High: "bg-orange-950/80 text-orange-300 border-orange-500/50 shadow-orange-950/50",
    Medium: "bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-950/50",
    Low: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50",
  };

  const dotColors: Record<string, string> = {
    Critical: "bg-red-500 animate-ping",
    High: "bg-orange-500",
    Medium: "bg-amber-500",
    Low: "bg-emerald-500",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1 font-medium",
    lg: "text-sm px-3 py-1.5 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${colors[calculatedLevel] || colors.Low} ${sizeStyles[size]}`}
    >
      <span className="relative flex h-2 w-2">
        {calculatedLevel === "Critical" && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors.Critical}`} />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            dotColors[calculatedLevel] || "bg-emerald-500"
          }`}
        />
      </span>
      <span>{calculatedLevel}</span>
      {showScore && score !== undefined && (
        <span className="opacity-90 font-mono">({score.toFixed(0)})</span>
      )}
    </span>
  );
}
