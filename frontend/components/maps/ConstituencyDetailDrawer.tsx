"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  MapPin,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  Building2,
  ExternalLink,
  Coins,
  Briefcase,
  Layers,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import { RiskBadge } from "../ui/RiskBadge";
import { ConstituencyRiskItem, ConstituencyDetailResponse, fetchConstituencyDetail } from "../../lib/api";

interface ConstituencyDetailDrawerProps {
  constituencyName: string | null;
  initialData?: ConstituencyRiskItem | null;
  onClose: () => void;
  onSelectWork?: (workId: string) => void;
}

export function ConstituencyDetailDrawer({
  constituencyName,
  initialData,
  onClose,
  onSelectWork,
}: ConstituencyDetailDrawerProps) {
  const [detail, setDetail] = useState<ConstituencyDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!constituencyName) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchConstituencyDetail(constituencyName)
      .then((data) => {
        if (!isMounted) return;
        if ((data as any).error) {
          setError((data as any).error);
        } else {
          setDetail(data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load constituency detail:", err);
        setError("Could not load telemetry for this constituency");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [constituencyName]);

  if (!constituencyName) return null;

  // Use initial data as fallback while loading
  const displayData = detail || initialData;
  const avgRisk = displayData?.avg_risk_score ?? 0;
  const riskTier = displayData?.risk_level ?? (avgRisk >= 65 ? "Critical" : avgRisk >= 50 ? "High" : avgRisk >= 35 ? "Medium" : "Low");

  const getRiskColorClasses = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "critical":
        return {
          bg: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-900",
          bar: "bg-rose-600",
          ring: "ring-rose-500/20",
        };
      case "high":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-900",
          bar: "bg-orange-500",
          ring: "ring-orange-500/20",
        };
      case "medium":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-800",
          bar: "bg-amber-500",
          ring: "ring-amber-500/20",
        };
      default:
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-900",
          bar: "bg-emerald-500",
          ring: "ring-emerald-500/20",
        };
    }
  };

  const riskColors = getRiskColorClasses(riskTier);

  return (
    <div
      role="dialog"
      aria-label={`Constituency Details for ${constituencyName}`}
      className="absolute top-3 right-3 bottom-3 z-30 w-full sm:w-96 max-w-[calc(100%-24px)] rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200 transition-all font-sans"
    >
      {/* Drawer Header */}
      <div className="flex items-start justify-between border-b border-[#E5DFD3] bg-[#FAF7F2] p-4">
        <div className="space-y-1 max-w-[80%]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded bg-[#6E4529] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5EBE1]">
              Constituency Audit
            </span>
            {displayData?.state && (
              <span className="rounded border border-[#D9D2C5] bg-[#FFFDF9] px-2 py-0.5 text-[10px] font-mono font-semibold text-stone-600">
                {displayData.state}
              </span>
            )}
          </div>
          <h3 className="text-lg font-serif font-bold text-[#1C1917] tracking-tight truncate">
            {constituencyName}
          </h3>
          {displayData?.district && displayData.district !== constituencyName && (
            <p className="text-xs text-stone-500 font-mono">
              Admin District: {displayData.district}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="rounded-lg p-1.5 text-stone-400 hover:bg-[#F0ECE1] hover:text-stone-800 transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Risk Score Gauge Banner */}
        <div
          className={`rounded-xl border p-4 space-y-3 ${riskColors.bg} ${riskColors.border} ${riskColors.text}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              Constituency Risk Score
            </span>
            <span className="font-mono font-bold text-lg">
              {avgRisk.toFixed(1)}
              <span className="text-xs text-stone-500 font-normal">/100</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${riskColors.bar}`}
              style={{ width: `${Math.min(100, Math.max(5, avgRisk))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="font-semibold capitalize">Classification: {riskTier}</span>
            <span className="text-stone-600">
              {displayData?.flagged_works_count || 0} flagged anomalies
            </span>
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase text-stone-500 block flex items-center gap-1">
              <Coins className="h-3 w-3 text-[#8C5D3B]" /> Total Outlay
            </span>
            <span className="text-base font-bold font-mono text-[#6E4529] block">
              ₹{(((displayData?.total_allocation || 0) / 10000000)).toFixed(2)} Cr
            </span>
            <span className="text-[10px] text-stone-500 block">
              {(displayData?.total_works || 0)} Sanctioned Works
            </span>
          </div>

          <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase text-stone-500 block flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-[#8C5D3B]" /> Flagged Works
            </span>
            <span className="text-base font-bold font-mono text-rose-800 block">
              {displayData?.flagged_works_count || 0}
            </span>
            <span className="text-[10px] text-stone-500 block">
              {displayData?.total_works && displayData.total_works > 0
                ? `${Math.round(((displayData.flagged_works_count || 0) / displayData.total_works) * 100)}% anomaly rate`
                : "No anomaly flagged"}
            </span>
          </div>
        </div>

        {/* Incumbent Member of Parliament Card */}
        {displayData?.mp_name && (
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 font-mono text-[10px] uppercase">
              <span className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-[#8C5D3B]" /> Incumbent MP
              </span>
              <span>Lok Sabha</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1C1917]">{displayData.mp_name}</h4>
              <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                Representing {constituencyName} ({displayData.state})
              </p>
            </div>
          </div>
        )}

        {/* Top Flagged Works Preview */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold text-stone-700">
            <span className="flex items-center gap-1 text-[#6E4529]">
              <Layers className="h-3.5 w-3.5 text-[#8C5D3B]" />
              Top Flagged Works ({detail?.top_works?.length || 0})
            </span>
            {detail?.top_works && detail.top_works.length > 0 && (
              <Link
                href={`/works?search=${encodeURIComponent(constituencyName)}`}
                className="text-[10px] text-[#8C5D3B] hover:text-[#6E4529] underline flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="py-6 text-center text-stone-500 space-y-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#8C5D3B] border-t-transparent mx-auto" />
              <p className="text-[11px]">Loading top forensic cases...</p>
            </div>
          ) : detail?.top_works && detail.top_works.length > 0 ? (
            <div className="space-y-2">
              {detail.top_works.map((work) => (
                <div
                  key={work.id}
                  className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3 space-y-1.5 hover:border-[#8C5D3B] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#1C1917] text-[11px]">
                      {work.id}
                    </span>
                    <RiskBadge score={work.risk_score} level={work.risk_level} size="sm" />
                  </div>
                  <p className="text-stone-800 font-medium line-clamp-1">{work.work}</p>
                  {work.reasons && work.reasons.length > 0 && (
                    <p className="text-[10px] text-red-700 line-clamp-1">
                      • {work.reasons[0]}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E5DFD3] text-[10px] font-mono text-stone-500">
                    <span className="font-bold text-stone-800">
                      ₹{work.allocation_amount.toLocaleString()}
                    </span>
                    <Link
                      href={`/works/${work.id}`}
                      className="inline-flex items-center gap-1 font-bold text-[#6E4529] hover:underline"
                    >
                      <span>Explain</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D9D2C5] p-4 text-center text-stone-500 text-[11px]">
              No flagged high-risk works currently recorded in this constituency.
            </div>
          )}
        </div>
      </div>

      {/* Action CTA Footer */}
      <div className="border-t border-[#E5DFD3] bg-[#FAF7F2] p-3.5 flex flex-col gap-2">
        <Link
          href={`/works?search=${encodeURIComponent(constituencyName)}`}
          className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#6E4529] py-2 text-xs font-bold text-[#F5EBE1] hover:bg-[#5A361F] transition-all shadow-xs"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Audit in Works Explorer</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href={`/graph?district=${encodeURIComponent(constituencyName)}`}
          className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-[#D9D2C5] bg-[#FFFDF9] py-1.5 text-xs font-semibold text-stone-700 hover:bg-white hover:text-stone-900 transition-all shadow-2xs"
        >
          <Building2 className="h-3.5 w-3.5 text-[#8C5D3B]" />
          <span>Inspect Agency Cartel Graph</span>
        </Link>
      </div>
    </div>
  );
}
