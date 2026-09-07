"use client";

import React from "react";
import { AnomalyCategoryDonut } from "./AnomalyCategoryDonut";
import { DelayedSectorsBarChart } from "./DelayedSectorsBarChart";
import { FraudTypeBreakdownItem } from "../../lib/types";

interface SectorAnalyticsGridProps {
  fraudBreakdown?: FraudTypeBreakdownItem[];
  totalFlagged?: number;
  className?: string;
}

export function SectorAnalyticsGrid({
  fraudBreakdown,
  totalFlagged,
  className = "",
}: SectorAnalyticsGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      <AnomalyCategoryDonut
        fraudBreakdown={fraudBreakdown}
        totalFlagged={totalFlagged}
      />
      <DelayedSectorsBarChart />
    </div>
  );
}
