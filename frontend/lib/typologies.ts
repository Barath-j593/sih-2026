export interface TypologyMeta {
  key: string;
  label: string;
  description: string;
  badgeClass: string;
  dotColor: string;
}

export const TYPOLOGY_REGISTRY: Record<string, TypologyMeta> = {
  cost_overrun: {
    key: "cost_overrun",
    label: "Cost Overrun",
    description: "Expenditure or sanction significantly exceeds statistical benchmarks for similar peer works.",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotColor: "bg-rose-600",
  },
  ghost_work: {
    key: "ghost_work",
    label: "Ghost Work",
    description: "High financial disbursement with absent or negligible physical asset verification on site.",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    dotColor: "bg-purple-600",
  },
  single_bid_tender: {
    key: "single_bid_tender",
    label: "Single-Bid Tender",
    description: "Procurement executed with restricted single-bid participation bypassing competitive tender rules.",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotColor: "bg-amber-600",
  },
  procurement_single_bid: {
    key: "procurement_single_bid",
    label: "Single-Bid Tender",
    description: "Procurement executed with restricted single-bid participation bypassing competitive tender rules.",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotColor: "bg-amber-600",
  },
  vendor_concentration: {
    key: "vendor_concentration",
    label: "Vendor Concentration",
    description: "Disproportionate funding channeled repeatedly through a single agency or contractor syndicate.",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    dotColor: "bg-sky-600",
  },
  vendor_capture: {
    key: "vendor_capture",
    label: "Vendor Concentration",
    description: "Disproportionate funding channeled repeatedly through a single agency or contractor syndicate.",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    dotColor: "bg-sky-600",
  },
  payment_structuring: {
    key: "payment_structuring",
    label: "Payment Structuring",
    description: "Artificial project cost splitting just below statutory e-tendering limits (e.g. ₹5 Lakh ceiling).",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    dotColor: "bg-indigo-600",
  },
  payment_progress_mismatch: {
    key: "payment_progress_mismatch",
    label: "Payment-Progress Mismatch",
    description: "Disproportionate disbursement velocity relative to verified milestone physical progress.",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotColor: "bg-rose-600",
  },
  delayed_work: {
    key: "delayed_work",
    label: "Delayed Work",
    description: "Project execution stalled beyond planned statutory schedule without physical progress updates.",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotColor: "bg-amber-600",
  },
  abandoned_work: {
    key: "abandoned_work",
    label: "Abandoned Work",
    description: "Stagnated developmental work with contractor inactivity and frozen execution timeline.",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
    dotColor: "bg-orange-600",
  },
  collusion_ring: {
    key: "collusion_ring",
    label: "Collusion Ring",
    description: "Graph network anomaly exhibiting recurrent exclusive pairing across agencies and vendors.",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
    dotColor: "bg-red-600",
  },
  documentation_deficit: {
    key: "documentation_deficit",
    label: "Documentation Deficit",
    description: "Statutory GFR compliance gaps in technical estimates, sanctions, or contractor disclosures.",
    badgeClass: "bg-stone-100 text-stone-800 border-stone-300",
    dotColor: "bg-stone-600",
  },
  anomalous_profile: {
    key: "anomalous_profile",
    label: "Anomalous Profile",
    description: "Multi-signal anomaly profile exhibiting correlated elevated risk across several domains.",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotColor: "bg-rose-600",
  },
  normal: {
    key: "normal",
    label: "Normal / Compliant",
    description: "Standard project execution profile adhering to statutory MPLADS guidelines.",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotColor: "bg-emerald-600",
  },
  // Legacy aliases
  overpricing: {
    key: "overpricing",
    label: "Cost Overrun",
    description: "Cost escalation above state PWD average.",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotColor: "bg-rose-600",
  },
  duplicate: {
    key: "duplicate",
    label: "Duplicate Work",
    description: "Clustered identical recommendations across village sites.",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotColor: "bg-amber-600",
  },
  structuring: {
    key: "structuring",
    label: "Payment Structuring",
    description: "Artificially pegged contract values near statutory thresholds.",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    dotColor: "bg-indigo-600",
  },
  ghost_project: {
    key: "ghost_project",
    label: "Ghost Work",
    description: "Stalled project without physical milestone proof.",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    dotColor: "bg-purple-600",
  },
};

/**
 * Maps raw backend typology strings (uppercase, lowercase, legacy) into clean human-readable names.
 */
export function formatTypologyLabel(raw?: string | null): string {
  if (!raw) return "General Public Works";
  const clean = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (TYPOLOGY_REGISTRY[clean]) {
    return TYPOLOGY_REGISTRY[clean].label;
  }
  // Fallback: title-case the string
  return raw
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns complete styling metadata for a given typology.
 */
export function getTypologyMeta(raw?: string | null): TypologyMeta {
  if (!raw) return TYPOLOGY_REGISTRY.normal;
  const clean = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (
    TYPOLOGY_REGISTRY[clean] || {
      key: clean,
      label: formatTypologyLabel(raw),
      description: "Algorithmic anomaly signal flagged for administrative scrutiny.",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      dotColor: "bg-amber-600",
    }
  );
}

/**
 * Normalizes backend risk level strings to TitleCase ("Critical", "High", "Medium", "Low").
 */
export function normalizeRiskLevel(level?: string | null): "Critical" | "High" | "Medium" | "Low" {
  if (!level) return "Low";
  const upper = level.trim().toUpperCase();
  if (upper === "CRITICAL") return "Critical";
  if (upper === "HIGH") return "High";
  if (upper === "MEDIUM") return "Medium";
  return "Low";
}

/**
 * Normalizes investigation priority string.
 */
export function normalizePriority(priority?: string | null): "IMMEDIATE" | "PRIORITY" | "ROUTINE" {
  if (!priority) return "ROUTINE";
  const upper = priority.trim().toUpperCase();
  if (upper === "IMMEDIATE") return "IMMEDIATE";
  if (upper === "PRIORITY") return "PRIORITY";
  return "ROUTINE";
}
