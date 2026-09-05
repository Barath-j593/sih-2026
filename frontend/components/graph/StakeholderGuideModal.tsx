"use client";

import React, { useState } from "react";
import { 
  X, BookOpen, HelpCircle, ShieldAlert, Target, Activity, 
  Users, Building, Milestone, Layers, ArrowRight, CheckCircle2, 
  AlertTriangle, Lightbulb, FileText, ChevronRight
} from "lucide-react";

interface StakeholderGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "overview" | "mospi" | "sna" | "da" | "mp" | "scripts";
}

export function StakeholderGuideModal({
  isOpen,
  onClose,
  defaultTab = "overview"
}: StakeholderGuideModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-800">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Stakeholder Interpretation & Forensic Field Manual
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  CAG & CVC Methodology
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                How to read, interpret, and present every metric, chart, and fraud radar on the Money Flow & Cartels portal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-slate-200 bg-slate-50/50 overflow-x-auto text-xs font-semibold">
          {[
            { id: "overview", label: "Executive Theory", icon: Lightbulb },
            { id: "mospi", label: "🏛️ MoSPI Ministry", icon: Activity },
            { id: "sna", label: "⚖️ State Nodal (SNA)", icon: Layers },
            { id: "da", label: "🛡️ District DM", icon: Target },
            { id: "mp", label: "🗳️ MP Delivery", icon: Milestone },
            { id: "scripts", label: "Pitch Scripts", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 leading-relaxed text-sm">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-4xl">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70">
                <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-700" />
                  Why Vendor Concentration Matters in Public Spending
                </h3>
                <p className="text-xs text-amber-900 mt-2 leading-relaxed">
                  In government infrastructure, direct bribery is difficult to detect, but <strong>vendor concentration is mathematical, undeniable, and permanent</strong>. 
                  When public funds systematically concentrate into a single executing agency or contractor network, it produces three systemic failures:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
                    <span className="font-bold text-rose-700 block">1. Procurement Lock-in</span>
                    Other capable agencies and contractors stop bidding because the incumbent always wins.
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
                    <span className="font-bold text-amber-800 block">2. Artificial Cost Inflation</span>
                    Lack of genuine competitive bidding inflates works costs by 15% to 30%.
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
                    <span className="font-bold text-blue-700 block">3. Delivery Paralysis</span>
                    Over-allocated agencies become operational bottlenecks, causing works to stall for months.
                  </div>
                </div>
              </div>

              {/* Mathematical Foundations */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Key Mathematical Indices & Statutory Thresholds</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* HHI */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Herfindahl-Hirschman Index (HHI)</span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Scale: 0 to 10,000</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-2">
                      <strong className="font-mono text-slate-900">HHI = &Sigma; (Market Share %)²</strong>. Squaring market shares gives disproportionate mathematical weight to dominant monopolistic players.
                    </p>
                    <ul className="text-xs space-y-1.5 mt-3 text-slate-600">
                      <li>• <span className="text-emerald-700 font-bold">&lt; 1,500</span>: Highly Competitive & Equitable</li>
                      <li>• <span className="text-amber-700 font-bold">1,500 – 2,500</span>: Moderately Concentrated (Watchlist)</li>
                      <li>• <span className="text-rose-600 font-bold">&gt; 2,500</span>: Highly Concentrated (Oligopoly)</li>
                      <li>• <span className="text-rose-700 font-bold">10,000</span>: Absolute Monopoly (100% Single-Agency Capture)</li>
                    </ul>
                  </div>

                  {/* CR Ratios */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">Concentration Ratios (CR3 / CR4 / CR5)</span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Scale: 0% to 100%</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-2">
                      The percentage of total public capital captured by the top 3, 4, or 5 executing agencies. If CR3 exceeds 35%, three agencies effectively control the state's entire infrastructure pipeline.
                    </p>
                    <ul className="text-xs space-y-1.5 mt-3 text-slate-600">
                      <li>• <span className="text-emerald-700 font-bold">CR5 &lt; 25%</span>: Well-dispersed procurement</li>
                      <li>• <span className="text-amber-700 font-bold">CR3 &gt; 35%</span>: High structural dependence on top agencies</li>
                      <li>• <span className="text-rose-600 font-bold">CR3 &gt; 50%</span>: State cartel vulnerability</li>
                    </ul>
                  </div>

                  {/* Structuring / Smurfing */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Tender Structuring / Smurfing</span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">GFR Rule 155 Statutory Limit</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-2">
                      Under General Financial Rules (GFR), any procurement above <strong>₹5,00,000</strong> mandates open public e-tendering. Corrupt syndicates artificially slice a ₹20 Lakh project into four ₹4.92 Lakh contracts to bypass open competition.
                    </p>
                    <p className="text-xs text-amber-900 font-mono mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      Delta (&Delta;) = Cost - ₹5,00,000 = -₹8,000
                    </p>
                  </div>

                  {/* Dwell Times */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Statutory Delay Dwell Sinks</span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">MPLADS Statutory Rule</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-2">
                      MPLADS guidelines prescribe that recommended works must be administratively sanctioned within <strong>45 days</strong>. Any project idling in <em>Action Pending</em> beyond 45 days is a statutory violation and delivery bottleneck.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MOSPI MINISTRY */}
          {activeTab === "mospi" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-[11px] font-bold uppercase text-cyan-700 tracking-wider">Center / Federal Oversight</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">MoSPI National Allocation Flow & Interstate Cartel Funnel</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Designed for the Ministry of Statistics and Programme Implementation (MoSPI) and Parliamentary Public Accounts Committee (PAC).
                </p>
              </div>

              {/* What to look for */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">How to Read This Screen</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <p>
                    <strong>1. Zonal Flow Conduit:</strong> Shows how capital flows across the 6 regional zones (Eastern, Northern, Southern, Western, Central, North East). If Eastern Zone takes 48.6% of capital, federal disbursements are heavily skewed geographically.
                  </p>
                  <p>
                    <strong>2. Federal HHI (622.5):</strong> Measures national dispersion. A score of 622 indicates healthy overall federal spread across India's 31 states, even if specific states exhibit localized capture.
                  </p>
                  <p>
                    <strong>3. Interstate Cartel Funnel:</strong> Surfaces executing agencies that operate across state borders. In MPLADS, district agencies are supposed to execute locally. When an agency appears across multiple states, it indicates a cross-border procurement syndicate.
                  </p>
                </div>
              </div>

              {/* Live Case Study */}
              <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-cyan-700" />
                    Empirical Case Study: Multi-State Agency Capture
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                    Database Verified
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-2">
                  <p>
                    <strong>Entity:</strong> <code className="text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">DISTRICT MAGISTRATE MIRZAPUR_IDA</code>
                  </p>
                  <p>
                    <strong>States Spanned:</strong> Bihar and Uttar Pradesh (Total Capital: <strong>₹9,30,99,000 / ₹9.31 Cr</strong> across 42 works).
                  </p>
                  <p>
                    <strong>PAC Audit Implication:</strong> Why is an executing agency headquartered in Mirzapur (UP) receiving multi-crore allocations from Bihar MPs? This pattern signals cross-border contract subletting or shell proxy bidding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SNA STATE NODAL */}
          {activeTab === "sna" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-[11px] font-bold uppercase text-amber-700 tracking-wider">State Planning & Vigilance</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">State Nodal Authority (SNA) Statewide Vendor Treemap & Cartel Matrix</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Designed for State Nodal Secretaries and State Vigilance Commissioners monitoring procurement equity across all 38 districts.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">How to Read This Screen</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <p>
                    <strong>1. Proportional Treemap:</strong> Every rectangle represents an executing agency sized by its share of total state public outlay. If 2-3 rectangles occupy half the screen, state spending is captured by an oligopoly.
                  </p>
                  <p>
                    <strong>2. CR3 Concentration Ratio:</strong> In Bihar, CR3 is <strong>39.1%</strong>. That means nearly ₹4 out of every ₹10 spent statewide goes to just 3 agencies out of 41 total executing bodies.
                  </p>
                  <p>
                    <strong>3. Inter-District Matrix:</strong> Compares capital allocation across districts (e.g., Saran with ₹19 Cr vs Darbhanga with ₹5.2 Cr). Surfaces whether politically favored districts drain the state pool.
                  </p>
                </div>
              </div>

              {/* Live Case Study */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-700" />
                    Empirical Case Study: State-Level Asymmetric Capture (Bihar)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Database Verified
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-2">
                  <p>
                    <strong>Statewide Metric:</strong> Overall State HHI is <strong className="text-slate-900">799.8</strong> (competitive on paper), but the top agency <code className="text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">SARAN CHAPRA IDA</code> captures <strong>20.8% of all funds (₹19.4 Cr)</strong>.
                  </p>
                  <p>
                    <strong>Vigilance Finding:</strong> While the state appears decentralized, capital is concentrated in Saran, while 18 other districts receive less than 1.5% each.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DA DISTRICT MAGISTRATE */}
          {activeTab === "da" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-[11px] font-bold uppercase text-rose-700 tracking-wider">District Collector / DM Triage</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">District Single-Vendor Capture Clustermap & ₹5L Structuring Radar</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Designed for District Magistrates and District Planning Officers acting as the statutory pre-sanction checkpoint.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">How to Read This Screen</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <p>
                    <strong>1. ₹5L Smurfing Radar:</strong> Flags contract proposals clustered immediately below ₹5,00,000 (e.g. ₹4,92,000). A negative delta tag (<code className="text-rose-700 font-mono font-bold">-₹8,000 below e-tender threshold</code>) is immediate statutory proof of artificial contract splitting under CVC guidelines.
                  </p>
                  <p>
                    <strong>2. 100% Monopoly Clustermap:</strong> When district HHI is <strong>10,000.0</strong>, a single entity executes every single project in the district, eliminating any internal agency checks and balances.
                  </p>
                  <p>
                    <strong>3. Block Allocation Spread:</strong> Highlights whether funds are concentrated in the district headquarters block while remote rural blocks receive zero development capital.
                  </p>
                </div>
              </div>

              {/* Live Case Study */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-rose-700" />
                    Empirical Case Study: Darbhanga ₹5L Structuring Smurfing
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                    Database Verified
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-2">
                  <p>
                    <strong>Flagged Contracts:</strong> Projects <code className="text-slate-900 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">W-23275</code>, <code className="text-slate-900 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">W-23276</code>, <code className="text-slate-900 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">W-23277</code>, <code className="text-slate-900 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">W-23278</code> are identically valued at <strong>₹4,92,000</strong> for solar streetlights and pavers.
                  </p>
                  <p>
                    <strong>Statutory Proof:</strong> Total sum is ₹19.68 Lakhs. Instead of issuing one unified ₹19.68L open e-tender, it was split into four ₹4.92L chunks to avoid technical scrutiny and award directly to favored local contractors.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MP DELIVERY VELOCITY */}
          {activeTab === "mp" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-[11px] font-bold uppercase text-blue-700 tracking-wider">Parliamentary Accountability</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">MP Constituency Fund Flow & Agency Delivery Velocity</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Designed for Members of Parliament to track the progress of their ₹5 Crore annual allocation and hold district executing agencies accountable.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">How to Read This Screen</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <p>
                    <strong>1. 4-Stage Delivery Stepper:</strong> Traces funds from <em>1. Recommended by MP</em> &rarr; <em>2. Administratively Sanctioned</em> &rarr; <em>3. Technical Work Order Issued</em> &rarr; <em>4. Physically Completed & Handed Over</em>.
                  </p>
                  <p>
                    <strong>2. Statutory Dwell Sinks (&gt;45 Days):</strong> Under MPLADS rules, sanctions must be issued within 45 days. If 107 works are idling at 75+ days in <em>Action Pending</em>, the executing agency is causing political delivery failure.
                  </p>
                  <p>
                    <strong>3. Assembly Block Equity:</strong> Shows village voters exactly how much money went to Bahadurpur, Benipur, or Alinagar blocks.
                  </p>
                </div>
              </div>

              {/* Live Case Study */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Milestone className="h-4 w-4 text-blue-700" />
                    Empirical Case Study: Delivery Stagnation in Darbhanga
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    Database Verified
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-2">
                  <p>
                    <strong>MP:</strong> <strong className="text-slate-900">Mr Gopal Jee Thakur (Darbhanga)</strong>. Total Recommended: <strong>128 works (₹5.21 Cr)</strong>.
                  </p>
                  <p>
                    <strong>Status:</strong> Only 21 works have achieved administrative sanction; <strong>107 works (83.6%)</strong> are stranded in "Action Pending" with average dwell time of <strong>74.6 days</strong> (exceeding the 45-day statutory limit by 65%).
                  </p>
                  <p>
                    <strong>MP Action:</strong> MP can issue a formal statutory notice to the District Magistrate citing the 45-day MPLADS rule.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PITCH SCRIPTS */}
          {activeTab === "scripts" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">Executive Presentation Playbook</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Word-for-Word Briefing Scripts for Stakeholders</h3>
                <p className="text-xs text-slate-500 mt-1">
                  How to present these findings in 2 minutes to Ministers, State Secretaries, DMs, and MPs.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs">
                  <span className="text-xs font-bold text-cyan-800 uppercase">Briefing MoSPI Secretary / PAC Chairman</span>
                  <p className="text-xs text-slate-700 mt-1.5 italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed shadow-xs">
                    "Hon'ble Secretary, our national HHI score is 622.5, indicating a healthy macro distribution across states. However, our federal radar has isolated cross-border syndicates. Specifically, Mirzapur DM IDA in Uttar Pradesh has absorbed ₹9.31 Crores spanning works across both Bihar and UP. We recommend a PAC intervention to audit cross-state agency subletting."
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs">
                  <span className="text-xs font-bold text-amber-800 uppercase">Briefing State Nodal Principal Secretary (Bihar)</span>
                  <p className="text-xs text-slate-700 mt-1.5 italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed shadow-xs">
                    "Sir, while our statewide HHI is 799.8, our CR3 concentration ratio shows an unhealthy dependency: 3 agencies capture 39.1% of all state works. Saran Chapra IDA alone controls 20.8% (₹19.4 Cr), while 18 districts are starved of execution capacity. We need an administrative reallocation to prevent single-agency monopoly."
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs">
                  <span className="text-xs font-bold text-rose-700 uppercase">Briefing District Magistrate (Darbhanga)</span>
                  <p className="text-xs text-slate-700 mt-1.5 italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed shadow-xs">
                    "Collector Sir, your pre-sanction radar has intercepted 8 proposals valued at exactly ₹4,92,000—which is exactly ₹8,000 below the statutory ₹5 Lakh e-tendering limit under GFR Rule 155. If you sanction these as individual works, audit will flag them as deliberate contract splitting. We recommend consolidating them into a single ₹19.68L open e-tender."
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs">
                  <span className="text-xs font-bold text-blue-700 uppercase">Briefing Member of Parliament (Mr Gopal Jee Thakur)</span>
                  <p className="text-xs text-slate-700 mt-1.5 italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed shadow-xs">
                    "Hon'ble MP Sir, you have recommended 128 works worth ₹5.21 Crores for your voters. However, 107 of these works are stuck at the District Authority in 'Action Pending' for over 74 days, well past the 45-day statutory limit. Here is the formal requisition citing MPLADS guidelines to hold the DM accountable and unlock your funds."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            SETU Forensic Intelligence System • Confidential Audit Aid
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
}
