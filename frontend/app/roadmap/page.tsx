"use client";

import React, { useState } from "react";
import { ComingSoonModal } from "../../components/ui/ComingSoonModal";
import {
  Sparkles,
  Calendar,
  Layers,
  ShieldCheck,
  Building,
  Users,
  Eye,
  Activity,
  Globe2,
  FileSpreadsheet,
  Clock,
  BellRing
} from "lucide-react";

export default function RoadmapPage() {
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  const roadmapItems = [
    {
      title: "State PWD Schedule of Rates (SoR) Integration",
      phase: "Phase 2 (Q4 2026)",
      category: "Cost Governance",
      icon: Building,
      badgeColor: "bg-amber-950 text-amber-400 border-amber-500/30",
      description: "Automated cross-referencing of civil work line-items against real-time State Public Works Department (PWD) official rate schedules to compute exact unit cost variance down to cement and asphalt rates.",
      architecture: [
        "Automated daily ingestion of State PWD rate gazettes via OCR & PDF extractors.",
        "Itemized cost matching engine linking work titles to CPWD / State SoR standard line items.",
        "Statutory price ceiling alarms triggered during pre-sanction verification."
      ],
      governanceImpact: "Eliminates reliance on statistical peer estimates by establishing binding statutory price ceilings."
    },
    {
      title: "GeM & Cross-Scheme Debarred Contractor Registry",
      phase: "Phase 2 (Q4 2026)",
      category: "Vendor Oversight",
      icon: ShieldCheck,
      badgeColor: "bg-blue-950 text-blue-400 border-blue-500/30",
      description: "Direct integration with Government e-Marketplace (GeM), PMGSY, and state debarment registries using fuzzy PAN/GSTIN resolution to flag blacklisted contractors attempting to bid under altered entity names.",
      architecture: [
        "API webhook to GeM Central Debarment Database.",
        "Fuzzy entity resolution for contractor director PANs and GST numbers.",
        "Automated instant blacklist warnings on high-value tender awards."
      ],
      governanceImpact: "Closes the loophole where blacklisted contractors bid under altered entity names across schemes."
    },
    {
      title: "Citizen Geotagged Field Verification Portal",
      phase: "Phase 3 (Q1 2027)",
      category: "Crowdsourcing & Public Audit",
      icon: Users,
      badgeColor: "bg-emerald-950 text-emerald-400 border-emerald-500/30",
      description: "Mobile PWA portal enabling local residents to snap GPS-stamped, timestamped photos of ongoing or completed works to automatically verify physical asset existence against reported expenditure.",
      architecture: [
        "PWA with strict GPS hardware verification and EXIF tamper validation.",
        "Computer vision asset presence classifier verifying school walls, solar lights, and borewells.",
        "Civic reward token system for verified ground truth feedback."
      ],
      governanceImpact: "Crowdsources ground-truth ghost project detection with zero district overhead."
    },
    {
      title: "Pre-Sanction AI Viability & Stall Predictor",
      phase: "Phase 3 (Q1 2027)",
      category: "Predictive Analytics",
      icon: Activity,
      badgeColor: "bg-purple-950 text-purple-400 border-purple-500/30",
      description: "Predictive model evaluating proposal description, requested allocation, and implementing agency historical clearance latency at the moment of recommendation before official sanction.",
      architecture: [
        "LightGBM latency prediction model trained on historical sanction duration.",
        "Work description clarity scorer checking for underspecified project scopes.",
        "Pre-approval district clearance simulation widget."
      ],
      governanceImpact: "Proactively prevents project abandonment before government capital is committed."
    },
    {
      title: "Historical Multi-Year Sanction Trend Engine",
      phase: "Phase 3 (Q1 2027)",
      category: "Macro Analytics",
      icon: FileSpreadsheet,
      badgeColor: "bg-cyan-950 text-cyan-400 border-cyan-500/30",
      description: "Cross-lok sabha tenure multi-year comparative analysis tracking repeat allocations for identical physical sites across election cycles.",
      architecture: [
        "Multi-term geospatial asset coordinate deduping engine.",
        "Expenditure velocity and pre-election sanction surge detection.",
        "Longitudinal fund utilization heatmaps per constituency."
      ],
      governanceImpact: "Detects cyclical fund diversion patterns across parliamentary terms."
    },
    {
      title: "Multilingual Hindi & Regional Portal Support",
      phase: "Phase 2 (Q4 2026)",
      category: "Accessibility",
      icon: Globe2,
      badgeColor: "bg-rose-950 text-rose-400 border-rose-500/30",
      description: "Complete multilingual localization in Hindi and major regional state languages with native NLP translation of work descriptions.",
      architecture: [
        "Bhashini API integration for Indian language translation.",
        "Devanagari UI font rendering and locale context switching.",
        "Regional gazette parsing in Marathi, Tamil, Bengali, and Telugu."
      ],
      governanceImpact: "Empowers grassroot PRIs, Gram Panchayats, and non-English speaking officers to audit fund flows."
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-saffron-950 px-2 py-0.5 text-xs font-bold text-saffron-400 border border-saffron-500/30">
              EXPANSION ARCHITECTURE
            </span>
            <span className="text-xs text-slate-400">MoSPI Digital Infrastructure Roadmap</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Future Implementation Architecture</h1>
          <p className="mt-1 text-xs text-slate-400">
            Transparent breakdown of upcoming integrations, civic crowdsourcing, and statutory price-ceiling modules.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roadmapItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              onClick={() => setSelectedFeature(item)}
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md cursor-pointer hover:border-saffron-500/60 hover:bg-slate-900/90 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="rounded-xl bg-slate-800 p-2 text-saffron-400 group-hover:bg-saffron-600 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                    {item.phase}
                  </span>
                </div>

                <span className="mt-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  {item.category}
                </span>
                <h3 className="mt-1 text-sm font-bold text-white group-hover:text-saffron-400 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-saffron-400 font-semibold">
                <span>View Architecture Spec</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedFeature && (
        <ComingSoonModal
          isOpen={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          feature={selectedFeature}
        />
      )}
    </div>
  );
}
