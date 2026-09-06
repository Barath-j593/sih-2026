"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDashboard, fetchStateChoropleth, fetchWorks } from "../lib/api";
import { DashboardData, WorkItem } from "../lib/types";
import { 
  ArrowRight, Shield, AlertTriangle, Building2, Users, Layers, 
  Search, ExternalLink, Activity, ArrowUpRight, Scale, Clock, 
  MapPin, CheckCircle2, ChevronRight, FileText, Satellite, Database, Filter
} from "lucide-react";

export default function SetuLandingPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [worksData, setWorksData] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState<"ALL" | "Critical" | "High" | "Medium" | "Low">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTier, setActiveTier] = useState<"mospi" | "sna" | "da" | "mp">("da");
  const [activeExhibit, setActiveExhibit] = useState<number>(1);

  // Load live telemetry from real backend API
  useEffect(() => {
    async function loadData() {
      try {
        const [dash, works] = await Promise.all([
          fetchDashboard("ministry"),
          fetchWorks({ limit: 6, risk_level: tableFilter === "ALL" ? undefined : tableFilter, search: searchQuery || undefined })
        ]);
        setDashboardData(dash);
        setWorksData(works.items || []);
      } catch (err) {
        console.error("Error loading live landing page telemetry:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tableFilter, searchQuery]);

  const summary = dashboardData?.summary || {
    total_works: 60356,
    total_allocation: 9062100000,
    flagged_works_count: 6395,
    amount_at_risk: 381200000,
    avg_risk_score: 59.3,
  };

  const topWorks = dashboardData?.top_flagged_works || [];
  const topFlaggedWork = topWorks.length > 0 ? topWorks[0] : null;

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#111827] selection:bg-[#D97706]/20 selection:text-[#B45309] font-sans">
      
      {/* ────────────────────────────────────────────────────────────
          BESPOKE EDITORIAL HEADER
          Minimalist, architectural navigation inspired by print vitrines
      ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#1C1917]/10 bg-[#F7F5EE]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Left Nav Cluster */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-[#44403C]">
            <a href="#vitrine" className="text-[#1C1917] border-b border-[#1C1917] pb-0.5 transition-colors">
              The Vitrine
            </a>
            <a href="#ledger" className="hover:text-[#1C1917] transition-colors">
              Statutory Ledger
            </a>
            <a href="#custodians" className="hover:text-[#1C1917] transition-colors">
              Governance Tiers
            </a>
            <a href="#directory" className="hover:text-[#1C1917] transition-colors">
              Audit Registry
            </a>
          </nav>

          {/* Center Monumental Wordmark */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="px-2 py-1 bg-[#1C1917] text-[#F7F5EE] text-xs font-display font-black tracking-widest uppercase">
              SETU
            </div>
            <span className="text-xs font-display font-black tracking-widest text-[#1C1917] uppercase">
              MPLADS FORENSICS •
            </span>
          </Link>

          {/* Right Ghost Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#1C1917] text-xs font-bold text-[#1C1917] hover:bg-[#1C1917] hover:text-[#F7F5EE] transition-all duration-200 tracking-wider uppercase"
            >
              <span>Command Center</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────
          ACT I: THE FORENSIC VITRINE (SALON HERO)
          Warm vellum canvas, centered manifesto, floating physical exhibits
      ──────────────────────────────────────────────────────────── */}
      <section id="vitrine" className="relative pt-20 pb-28 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
        
        {/* Subtle Archival Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.025]">
          <span className="font-editorial text-[25vw] font-black text-[#1C1917] select-none">
            § 155
          </span>
        </div>

        {/* Central Manifesto */}
        <div className="text-center max-w-4xl mx-auto relative z-10 pt-4 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-[#1C1917]/15 bg-[#EFECE4] text-[11px] font-mono font-bold uppercase tracking-widest text-[#57534E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
            CAG FISCAL SURVEILLANCE &amp; GFR 155 COMPLIANCE
          </div>

          <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-light text-[#1C1917] tracking-tight leading-[1.08]">
            Where Public Capital <br />
            Meets <span className="italic font-normal text-[#B45309]">Statutory</span> Accountability.
          </h1>

          <p className="font-serif-body text-lg sm:text-2xl text-[#57534E] max-w-2xl mx-auto mt-6 leading-relaxed font-normal">
            Real-time machine intelligence codifying General Financial Rules (GFR 2017) across <span className="font-semibold text-[#1C1917]">₹9,062 Crore</span> of parliamentary public works.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold tracking-wider uppercase">
            <a
              href="#ledger"
              className="px-6 py-3 bg-[#1C1917] text-[#F7F5EE] hover:bg-[#B45309] transition-all inline-flex items-center gap-2 shadow-paper"
            >
              <span>Examine Statutory Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <Link
              href="/graph"
              className="px-6 py-3 border border-[#1C1917]/30 text-[#1C1917] hover:border-[#1C1917] hover:bg-[#EFECE4] transition-all inline-flex items-center gap-2"
            >
              <span>Money Flow &amp; Cartels Radar</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#B45309]" />
            </Link>
          </div>
        </div>

        {/* The 4 Floating Salon Forensic Exhibits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 relative z-10">
          
          {/* EXHIBIT 01: Parliamentary Sanction Order */}
          <div 
            onClick={() => setActiveExhibit(1)}
            className={`cursor-pointer border border-[#1C1917]/15 bg-[#FAF9F5] p-5 shadow-paper-lift transition-all ${
              activeExhibit === 1 ? "ring-2 ring-[#B45309] border-transparent" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-2.5 text-[10px] font-mono uppercase tracking-wider text-[#78716C]">
              <span>EXHIBIT 01 / DOCKET</span>
              <span className="text-[#B45309] font-bold">W-23167</span>
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-bold text-[#1C1917] block line-clamp-2">
                Construction of PCC Road from Main Road to Harijan Tola
              </span>
              <span className="text-[11px] text-[#78716C] mt-1 block">
                Darbhanga, Bihar • Mr Gopal Jee Thakur
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-[#1C1917]/15 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-[#A8A29E] block uppercase font-mono">Sanction</span>
                <span className="text-base font-black text-[#1C1917] font-mono">₹43.90 L</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                100d Delay
              </span>
            </div>
          </div>

          {/* EXHIBIT 02: Satellite Ground-Truth Orthophoto */}
          <div 
            onClick={() => setActiveExhibit(2)}
            className={`cursor-pointer border border-[#1C1917]/15 bg-[#FAF9F5] p-5 shadow-paper-lift transition-all ${
              activeExhibit === 2 ? "ring-2 ring-[#B45309] border-transparent" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-2.5 text-[10px] font-mono uppercase tracking-wider text-[#78716C]">
              <span>EXHIBIT 02 / SATELLITE</span>
              <span className="text-cyan-800 font-bold">ORTHO-GIS</span>
            </div>
            <div className="mt-3">
              <div className="h-16 w-full bg-[#1C251C] rounded border border-[#1C1917]/20 relative overflow-hidden flex items-center justify-center text-[10px] font-mono text-emerald-400">
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px] opacity-20" />
                <div className="relative z-10 text-center">
                  <span>[ 26.1542° N, 85.8918° E ]</span>
                  <span className="block text-[9px] text-amber-400 mt-0.5">GROUND TRUTH: 0% PHYSICAL</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 flex items-center justify-between text-[11px]">
              <span className="text-[#78716C]">Disbursed: <strong className="text-[#1C1917]">₹21.5 L</strong></span>
              <span className="text-rose-700 font-bold font-mono">Ghost Asset</span>
            </div>
          </div>

          {/* EXHIBIT 03: GFR Rule 155 Smurfing Radar */}
          <div 
            onClick={() => setActiveExhibit(3)}
            className={`cursor-pointer border border-[#1C1917]/15 bg-[#FAF9F5] p-5 shadow-paper-lift transition-all ${
              activeExhibit === 3 ? "ring-2 ring-[#B45309] border-transparent" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-2.5 text-[10px] font-mono uppercase tracking-wider text-[#78716C]">
              <span>EXHIBIT 03 / SMURFING</span>
              <span className="text-rose-700 font-bold font-mono">GFR §155</span>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#78716C]">Sub-Project A:</span>
                <span className="font-bold text-[#1C1917]">₹4,95,000</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#78716C]">Sub-Project B:</span>
                <span className="font-bold text-[#1C1917]">₹4,92,000</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#78716C]">Sub-Project C:</span>
                <span className="font-bold text-[#1C1917]">₹4,98,000</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1C1917]/10 text-[10px] text-rose-800 font-bold uppercase font-mono">
              ⚠ Split Under ₹5.00 Lakh Tender Cap
            </div>
          </div>

          {/* EXHIBIT 04: Federal HHI Cartel Barometer */}
          <div 
            onClick={() => setActiveExhibit(4)}
            className={`cursor-pointer border border-[#1C1917]/15 bg-[#FAF9F5] p-5 shadow-paper-lift transition-all ${
              activeExhibit === 4 ? "ring-2 ring-[#B45309] border-transparent" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-2.5 text-[10px] font-mono uppercase tracking-wider text-[#78716C]">
              <span>EXHIBIT 04 / CONCENTRATION</span>
              <span className="text-amber-800 font-bold font-mono">HHI 10,000</span>
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-bold text-[#1C1917] block">
                District Implementing Monopoly
              </span>
              <span className="text-[11px] text-[#78716C] mt-1 block">
                Single agency captured 100% of works in block
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1C1917]/10 flex items-center justify-between">
              <span className="text-xs font-mono font-black text-rose-700">100% Monopolized</span>
              <Link href="/graph" className="text-[11px] font-bold text-[#B45309] hover:underline flex items-center gap-0.5">
                Inspect ➔
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          ACT II: THE STATUTORY LEDGER
          Constitutional Midnight Navy Canvas with delicate hairline rules
      ──────────────────────────────────────────────────────────── */}
      <section id="ledger" className="bg-[#0A1128] text-[#F7F5EE] py-28 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mb-16">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#F59E0B] block mb-3">
              ACT II • THE STATUTORY LEDGER
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-light text-[#F7F5EE] leading-tight">
              We detect public procurement capture before recommendations harden into audit reprimands.
            </h2>
            <p className="font-serif-body text-base sm:text-lg text-slate-400 mt-4 leading-relaxed">
              Every parliamentary sanction is cross-referenced in real-time against General Financial Rules, public works rate manuals, and bipartite vendor concentration indices.
            </p>
          </div>

          {/* 2-Column Ledger Directory with Hairline Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-0 border-t border-white/15">
            
            {/* Capability 01 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  01 / GFR 155 Structuring Radar
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">RULE §155</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Detects artificial contract smurfing designed to keep project values just below the ₹5.00 Lakh threshold, evading open competitive e-tendering.
              </p>
              <Link href="/alerts" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>View Flagged Structuring Cases</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Capability 02 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  02 / Bipartite Monopoly Cartels
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">HHI METRIC</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Computes the Herfindahl-Hirschman Index across executing agencies to uncover single-contractor capture and uncompetitive public works distribution.
              </p>
              <Link href="/graph" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>Inspect Bipartite Graph</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Capability 03 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  03 / Statutory Dwell Sinks
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">45-DAY LIMIT</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Enforces Section 4.2 of revised MPLADS guidelines, tracking administrative approval delays where District Magistrates exceed the mandatory 45-day sanction window.
              </p>
              <Link href="/dashboard" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>Check Administrative Dwell Times</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Capability 04 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  04 / Multi-Spectral Ground Truth
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">ISRO / GIS</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Cross-validates claimed completion certificates against multi-temporal satellite imagery to ensure funds are not disbursed for non-existent civil structures.
              </p>
              <Link href="/maps" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>Open Geospatial Map</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Capability 05 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  05 / 4-Tier Governance Scoping
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">CONSTITUTIONAL</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Strict data scoping engineered for each constitutional tier: MoSPI Ministry, State Nodal Authority, District Magistrate, and Member of Parliament.
              </p>
              <Link href="/dashboard" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>Switch Authority View</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Capability 06 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  06 / Forensic Case Dossiers
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">AUDIT-READY</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Generates court-admissible audit briefs combining GFR violations, contractor capture scores, and satellite coordinates for immediate CAG and Lokpal action.
              </p>
              <Link href="/cases" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>Review Active Case Dossiers</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          ACT III: THE GOVERNANCE CUSTODIANS
          Warm Ochre Canvas, Asymmetrical 2-Column Split
      ──────────────────────────────────────────────────────────── */}
      <section id="custodians" className="bg-[#ECE7DD] text-[#1C1917] py-28 px-4 sm:px-8 border-y border-[#1C1917]/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Narrative & Interactive Tiers */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#B45309] font-bold">
              ACT III • CONSTITUTIONAL CUSTODIANS
            </span>

            <h2 className="font-editorial text-3xl sm:text-5xl font-light text-[#1C1917] leading-tight">
              Architected for Every Tier of Sovereign Governance.
            </h2>

            <p className="font-serif-body text-base sm:text-lg text-[#57534E] leading-relaxed">
              Public spending transparency is not a one-size-fits-all dashboard. SETU tailors its forensic surveillance to the exact constitutional jurisdiction of each authority.
            </p>

            {/* Interactive Tier Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setActiveTier("mospi")}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTier === "mospi"
                    ? "bg-[#1C1917] text-[#F7F5EE] shadow-paper"
                    : "bg-[#FAF9F5] text-[#57534E] border border-[#1C1917]/15 hover:border-[#1C1917]"
                }`}
              >
                🏛️ MoSPI (National)
              </button>
              <button
                onClick={() => setActiveTier("sna")}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTier === "sna"
                    ? "bg-[#1C1917] text-[#F7F5EE] shadow-paper"
                    : "bg-[#FAF9F5] text-[#57534E] border border-[#1C1917]/15 hover:border-[#1C1917]"
                }`}
              >
                ⚖️ State Nodal (SNA)
              </button>
              <button
                onClick={() => setActiveTier("da")}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTier === "da"
                    ? "bg-[#1C1917] text-[#F7F5EE] shadow-paper"
                    : "bg-[#FAF9F5] text-[#57534E] border border-[#1C1917]/15 hover:border-[#1C1917]"
                }`}
              >
                🛡️ District DM
              </button>
              <button
                onClick={() => setActiveTier("mp")}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTier === "mp"
                    ? "bg-[#1C1917] text-[#F7F5EE] shadow-paper"
                    : "bg-[#FAF9F5] text-[#57534E] border border-[#1C1917]/15 hover:border-[#1C1917]"
                }`}
              >
                🗳️ Member of Parliament
              </button>
            </div>

            {/* Dynamic Active Tier Dossier */}
            <div className="border border-[#1C1917]/15 bg-[#FAF9F5] p-6 shadow-paper mt-4 space-y-3">
              {activeTier === "mospi" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#B45309] uppercase">Jurisdiction: All India</span>
                    <span className="text-xs font-mono font-bold text-[#1C1917]">₹9,062 Cr Monitored</span>
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917]">
                    Ministry of Statistics &amp; Programme Implementation
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    Monitors macro federal fund distribution across all 28 states and 8 union territories. Detects cross-state cartel syndicates and enforces national parity guidelines.
                  </p>
                </>
              )}

              {activeTier === "sna" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#B45309] uppercase">Jurisdiction: State Secretariats</span>
                    <span className="text-xs font-mono font-bold text-[#1C1917]">38 Districts in Bihar</span>
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917]">
                    State Nodal Authority (SNA)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    Tracks inter-district allocation equity and evaluates dominant state implementing agencies (e.g., Bihar Rajya Pul Nirman Nigam) through live vendor treemaps.
                  </p>
                </>
              )}

              {activeTier === "da" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#B45309] uppercase">Jurisdiction: District Magistrate</span>
                    <span className="text-xs font-mono font-bold text-[#1C1917]">DARBHANGA Implementation Pool</span>
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917]">
                    District Authority &amp; Triage Command
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    Direct operational triage over single-agency monopoly lock-in, tender smurfing under GFR Rule 155, and administrative dwell times before work orders are sanctioned.
                  </p>
                </>
              )}

              {activeTier === "mp" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#B45309] uppercase">Jurisdiction: Parliamentary Recommender</span>
                    <span className="text-xs font-mono font-bold text-[#1C1917]">Gopal Jee Thakur • 128 Works</span>
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917]">
                    Member of Parliament (Constituency Flow)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    Tracks the 4-stage statutory lifecycle from parliamentary recommendation to ground asset delivery, highlighting block distribution equity and administrative delay accountability.
                  </p>
                </>
              )}

              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B45309] hover:underline uppercase tracking-wider"
                >
                  <span>Enter {activeTier.toUpperCase()} Operational View</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Heritage & Provenance Frame */}
          <div className="lg:col-span-5">
            <div className="border border-[#1C1917]/20 bg-[#FAF9F5] p-8 shadow-paper space-y-6 relative overflow-hidden">
              <div className="border-b border-[#1C1917]/10 pb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#78716C] block">
                  STATUTORY CODIFICATION
                </span>
                <h3 className="font-editorial text-2xl text-[#1C1917] mt-1 font-light">
                  Constitutional Foundations
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#B45309] mt-1 shrink-0" />
                  <div>
                    <strong className="text-[#1C1917] block font-mono">GFR 2017 • Rule 155</strong>
                    <span className="text-[#78716C]">Mandatory e-tendering for works exceeding ₹5,00,000.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#B45309] mt-1 shrink-0" />
                  <div>
                    <strong className="text-[#1C1917] block font-mono">MPLADS Guidelines 2023 • §4.2</strong>
                    <span className="text-[#78716C]">45-day statutory window for District Authority sanction.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#B45309] mt-1 shrink-0" />
                  <div>
                    <strong className="text-[#1C1917] block font-mono">CAG Performance Audit Standards</strong>
                    <span className="text-[#78716C]">Automated verification of physical asset formation via GIS.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1C1917]/10 flex items-center justify-between text-[11px] font-mono text-[#78716C]">
                <span>Status: <strong className="text-emerald-700">Enforced</strong></span>
                <span>Audit Trail: <strong className="text-[#1C1917]">Immutable</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          ACT IV: THE CONSTITUTIONAL AUDIT DIRECTORY & FOOTER
          Archival Parchment, Live Registry Table, Monumental Watermark
      ──────────────────────────────────────────────────────────── */}
      <section id="directory" className="py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#B45309] font-bold block mb-2">
              ACT IV • LIVE STATUTORY DIRECTORY
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-light text-[#1C1917] leading-tight">
              Real-Time National Project Registry.
            </h2>
            <p className="font-serif-body text-base text-[#57534E] mt-2">
              Directly queries monitored public works from the central database. Filter by statutory risk severity or search by project ID.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 border border-[#1C1917]/15 p-1 bg-[#FAF9F5] shadow-xs">
            {(["ALL", "Critical", "High", "Medium", "Low"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setTableFilter(level)}
                className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  tableFilter === level
                    ? "bg-[#1C1917] text-[#F7F5EE]"
                    : "text-[#57534E] hover:text-[#1C1917]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search by Work ID (e.g. W-23167), title, constituency, or executing agency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF9F5] border border-[#1C1917]/20 pl-11 pr-4 py-3 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#B45309] shadow-xs font-medium"
          />
        </div>

        {/* The Gazette Ledger Table */}
        <div className="border border-[#1C1917]/15 bg-[#FAF9F5] shadow-paper overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#1C1917]/15 bg-[#EFECE4] text-[11px] font-mono text-[#78716C] uppercase">
                <th className="p-4 font-bold">Project ID &amp; Work Description</th>
                <th className="p-4 font-bold">Constituency &amp; State</th>
                <th className="p-4 font-bold text-right">Sanction Outlay</th>
                <th className="p-4 font-bold">Executing Agency</th>
                <th className="p-4 font-bold text-center">Risk Index</th>
                <th className="p-4 font-bold text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1917]/10">
              {worksData.map((item) => {
                const isCritical = item.risk_level === "Critical";
                const isHigh = item.risk_level === "High";

                return (
                  <tr key={item.id} className="hover:bg-[#EFECE4]/60 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-[#B45309] block text-[11px]">
                        {item.id}
                      </span>
                      <span className="font-bold text-[#1C1917] line-clamp-1 mt-0.5" title={item.work}>
                        {item.work}
                      </span>
                    </td>
                    <td className="p-4 text-[#57534E]">
                      <span className="font-semibold text-[#1C1917] block">{item.constituency}</span>
                      <span className="text-[11px] text-[#78716C]">{item.state}</span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-[#1C1917]">
                      ₹{((item.allocation_amount || 0) / 100000).toFixed(2)} L
                    </td>
                    <td className="p-4 text-[#57534E] truncate max-w-[180px]" title={item.ida}>
                      {item.ida || "District Authority"}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isCritical
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : isHigh
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {item.risk_score?.toFixed(1) || "50.0"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/works/${item.id}`}
                        className="inline-flex items-center gap-1 font-bold text-xs text-[#B45309] hover:underline"
                      >
                        <span>Audit</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* View All Works Footer Callout */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#78716C]">
          <span>Displaying 6 live parliamentary works from active monitoring registry.</span>
          <Link href="/works" className="font-bold text-[#1C1917] hover:underline flex items-center gap-1">
            <span>Explore All 60,356 Monitored Projects</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* ────────────────────────────────────────────────────────────
            ARCHITECTURAL FOOTER
            3-Column Site Index and Monumental Screen-Spanning Watermark
        ──────────────────────────────────────────────────────────── */}
        <footer className="mt-32 pt-16 border-t border-[#1C1917]/15 relative">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-16 text-xs">
            <div>
              <span className="font-editorial text-base font-bold text-[#1C1917] block mb-4">
                Sovereign Portals
              </span>
              <ul className="space-y-2.5 text-[#57534E]">
                <li><Link href="/dashboard" className="hover:text-[#1C1917] hover:underline">Operational Command Center</Link></li>
                <li><Link href="/works" className="hover:text-[#1C1917] hover:underline">MPLADS Works Explorer</Link></li>
                <li><Link href="/maps" className="hover:text-[#1C1917] hover:underline">Geospatial Risk Visualizer</Link></li>
                <li><Link href="/graph" className="hover:text-[#1C1917] hover:underline">Money Flow &amp; Cartels Radar</Link></li>
              </ul>
            </div>

            <div>
              <span className="font-editorial text-base font-bold text-[#1C1917] block mb-4">
                Forensic Intelligence Models
              </span>
              <ul className="space-y-2.5 text-[#57534E]">
                <li><Link href="/alerts" className="hover:text-[#1C1917] hover:underline">GFR Rule 155 Smurfing Radar</Link></li>
                <li><Link href="/graph" className="hover:text-[#1C1917] hover:underline">Herfindahl Agency Monopoly (HHI)</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#1C1917] hover:underline">45-Day Statutory Dwell Matrix</Link></li>
                <li><Link href="/cases" className="hover:text-[#1C1917] hover:underline">FIR-Ready Forensic Dossiers</Link></li>
              </ul>
            </div>

            <div>
              <span className="font-editorial text-base font-bold text-[#1C1917] block mb-4">
                Statutory Standards
              </span>
              <ul className="space-y-2.5 text-[#57534E]">
                <li className="text-[#78716C]">Comptroller &amp; Auditor General (CAG) 2023</li>
                <li className="text-[#78716C]">General Financial Rules (GFR 2017)</li>
                <li className="text-[#78716C]">MPLADS Revised Guidelines 2023 §4.2</li>
                <li className="text-[#78716C]">Ministry of Statistics &amp; Programme Implementation</li>
              </ul>
            </div>
          </div>

          {/* Monumental Architectural Watermark (Inspired by DSGN DEPT footer) */}
          <div className="pt-8 pb-4 border-t border-[#1C1917]/10 text-center overflow-hidden">
            <span className="font-display text-[10vw] sm:text-[12vw] font-black tracking-tighter text-[#1C1917]/[0.05] pointer-events-none select-none uppercase block leading-none w-full">
              SETU • MPLADS FORENSICS
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 text-[11px] text-[#78716C] border-t border-[#1C1917]/5 font-mono">
            <span>© 2026 SETU — Statutory Enforcement &amp; Transparency Unit</span>
            <span className="mt-2 sm:mt-0">Government of India • Ministry of Statistics &amp; Programme Implementation</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
