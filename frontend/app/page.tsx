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
import dynamic from "next/dynamic";
import { TextPressure } from "../components/ui/TextPressure";

const CircularText = dynamic(() => import("../components/ui/CircularText"), {
  ssr: false,
  loading: () => (
    <div className="w-[200px] h-[200px] rounded-full border border-dashed border-[#1C1917]/20 flex items-center justify-center font-mono text-xs text-[#1C1917]/40">
      SETU
    </div>
  ),
});

const WarpText = dynamic(() => import("../components/ui/WarpText"), {
  ssr: false,
});

const ShinyText = dynamic(() => import("../components/ui/ShinyText"), {
  ssr: false,
});

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
          TOP IDENTITY & EMBLEM (BRAND HEADER IN #6E4529)
          Unique signature brand color #6E4529, top editorial links,
          SETU brand lockup, outlined action button, and rotating
          CircularText surrounding the National Emblem medallion on
          the ivory background.
      ──────────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#6E4529] border-b border-[#4E2F1A] text-[#F5EBE1] shadow-[0_4px_24px_rgba(40,20,10,0.18)]">
        
        {/* Top Editorial Navigation Strip (Matching header.png in new-design-refernce) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 border-b border-white/15 flex items-center justify-between gap-4 text-xs">
          {/* Left: Editorial Navigation Links */}
          <nav className="flex items-center gap-5 font-serif text-[#F5EBE1]/85">
            <a href="#vitrine" className="hover:text-white border-b border-[#F5EBE1] pb-0.5 transition-colors font-medium">
              Home
            </a>
            <a href="#automated-audits" className="hover:text-white pb-0.5 hover:border-b hover:border-white/40 transition-all font-medium">
              Work
            </a>
            <a href="#custodians" className="hover:text-white pb-0.5 hover:border-b hover:border-white/40 transition-all font-medium">
              About
            </a>
            <a href="#directory" className="hidden sm:inline hover:text-white pb-0.5 hover:border-b hover:border-white/40 transition-all font-medium">
              Registry
            </a>
          </nav>

          {/* Center: Iconic Typographic Lockup (Matching DSGN DEPT• in header.png) */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="bg-[#3D2312] text-[#F7F5EE] px-2.5 py-0.5 font-mono font-black text-xs tracking-widest uppercase rounded-[2px] shadow-sm border border-white/10">
              <ShinyText text="SETU" speed={2.2} color="#F7F5EE" shineColor="#FDE68A" spread={90} />
            </span>
            <span className="font-editorial font-bold text-xs tracking-wider text-[#F5EBE1]">
              DEPT •
            </span>
          </div>

          {/* Right: Outlined Rectangular Button (Matching [ Contact ] in header.png) */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="border border-[#F5EBE1]/70 hover:bg-[#F5EBE1] hover:text-[#6E4529] text-[#F5EBE1] px-4 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] group"
            >
              <span>Command Center ↗</span>
            </Link>
          </div>
        </div>

        {/* Main Identity & Circular Text Banner */}
        <div className="pt-6 pb-6 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Cluster: CircularText with National Emblem Medallion & Description Phrase */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Circular Rotating Text Badge with National Emblem in Center */}
            <div className="relative flex items-center justify-center shrink-0 p-1.5 rounded-full bg-[#5A361F] border border-[#8C5D3B]/40 shadow-md">
              <CircularText
                text="* SETU * MPLADS PUBLIC AUDIT * GOVT OF INDIA "
                spinDuration={22}
                onHover="speedUp"
                className="text-[#F5EBE1]"
              >
                {/* National Emblem medallion placed inside circular text with user-provided ivory background (#F6F4EF) */}
                <div 
                  className="relative w-24 h-24 rounded-full overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.35)] border-2 border-[#E5A93C]/80 bg-[#F6F4EF] flex items-center justify-center pointer-events-auto transition-transform duration-300 hover:scale-105"
                  title="State Emblem of India • SETU Public Audit"
                >
                  <img
                    src="/national-emblem-ivory.png"
                    alt="State Emblem of India"
                    className="w-full h-full object-contain p-0.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] select-none"
                  />
                </div>
              </CircularText>
            </div>

            {/* Description Phrase & Statutory Badges */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#52301A] border border-[#8C5D3B]/50 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5EBE1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                <ShinyText 
                  text="STATUTORY ENFORCEMENT & TRANSPARENCY UNIT" 
                  speed={2.6} 
                  color="#E8D5C8" 
                  shineColor="#FDE68A" 
                  spread={110} 
                />
              </div>
              
              <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                <ShinyText 
                  text="Smart Expenditure Tracking & Utility" 
                  speed={3.2} 
                  color="#FFFFFF" 
                  shineColor="#FDE68A" 
                  spread={120} 
                />
              </h1>
              
              <p className="font-serif-body text-xs sm:text-sm text-[#E8D5C8]/90 leading-relaxed">
                Government of India • Ministry of Statistics &amp; Programme Implementation • Automated constitutional oversight for MPLADS public works.
              </p>
            </div>
          </div>

          {/* Right Status Card (Inspired by hero-window.png / header.png) */}
          <div className="hidden lg:flex flex-col items-end text-right space-y-1.5 font-mono text-[11px] text-[#E8D5C8]/80 border-l border-white/20 pl-6 shrink-0">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <ShinyText text="CAG AUDIT VIGILANCE" speed={2.4} color="#FFFFFF" shineColor="#34D399" spread={90} />
            </div>
            <span>28 States • 8 Union Territories</span>
            <span>Real-Time Anomaly Scoring</span>
            <Link 
              href="/dashboard" 
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#FDE68A] hover:text-white underline transition-colors"
            >
              <span>Explore Operational Cockpit →</span>
            </Link>
          </div>

        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────
          ACT I: THE FORENSIC VITRINE (SALON HERO)
          Warm vellum canvas, centered manifesto, floating physical exhibits
      ──────────────────────────────────────────────────────────── */}
      <section id="vitrine" className="relative pt-16 pb-28 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
        
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
            SMART AUDIT PLATFORM • GOVERNMENT OF INDIA MPLADS SCHEME
          </div>

          <WarpText
            text={"Where Public Funds\nMeet Real-Time Accountability"}
            color="#1C1917"
            fontSize="clamp(2.2rem, 5.2vw, 4.2rem)"
            fontWeight={700}
            fontFamily="Fraunces, Georgia, serif"
            warpStrength={0.06}
            speed={0.4}
            style={{ height: "190px", maxWidth: "900px", margin: "0 auto" }}
          />

          <WarpText
            text="Auditing ₹9,062 Crore across India's parliamentary public works"
            color="#B45309"
            fontSize="clamp(1.05rem, 2.2vw, 1.45rem)"
            fontWeight={600}
            fontFamily="Newsreader, Georgia, serif"
            warpStrength={0.035}
            speed={0.3}
            style={{ height: "55px", maxWidth: "800px", margin: "8px auto 0 auto" }}
          />

          <p className="font-serif-body text-base sm:text-xl text-[#57534E] max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
            SETU automatically tracks <span className="font-semibold text-[#1C1917]">₹9,062 Crore</span> in parliamentary community projects—using financial rules (GFR 2017) and satellite verification to catch delayed approvals, split tenders, and contractor monopolies.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold tracking-wider uppercase">
            <a
              href="#ledger"
              className="px-6 py-3 bg-[#1C1917] text-[#F7F5EE] hover:bg-[#B45309] transition-all inline-flex items-center gap-2 shadow-paper"
            >
              <span>Explore Audit Checks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <Link
              href="/graph"
              className="px-6 py-3 border border-[#1C1917]/30 text-[#1C1917] hover:border-[#1C1917] hover:bg-[#EFECE4] transition-all inline-flex items-center gap-2"
            >
              <span>Inspect Contractor Networks</span>
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
              <span>CASE 01 / WORK ORDER</span>
              <span className="text-[#B45309] font-bold">W-23167</span>
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-bold text-[#1C1917] block line-clamp-2">
                Construction of PCC Road from Main Road to Harijan Tola
              </span>
              <span className="text-[11px] text-[#78716C] mt-1 block">
                Darbhanga, Bihar • Recommended by MP Gopal Jee Thakur
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-[#1C1917]/15 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-[#A8A29E] block uppercase font-mono">Approved Budget</span>
                <span className="text-base font-black text-[#1C1917] font-mono">₹43.90 L</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                100d Past Limit
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
              <span>CASE 02 / SATELLITE CHECK</span>
              <span className="text-cyan-800 font-bold">GIS MAP</span>
            </div>
            <div className="mt-3">
              <div className="h-16 w-full bg-[#1C251C] rounded border border-[#1C1917]/20 relative overflow-hidden flex items-center justify-center text-[10px] font-mono text-emerald-400">
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px] opacity-20" />
                <div className="relative z-10 text-center">
                  <span>[ 26.1542° N, 85.8918° E ]</span>
                  <span className="block text-[9px] text-amber-400 mt-0.5">SATELLITE: NO ROAD DETECTED</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 flex items-center justify-between text-[11px]">
              <span className="text-[#78716C]">Paid Out: <strong className="text-[#1C1917]">₹21.5 L</strong></span>
              <span className="text-rose-700 font-bold font-mono">Ghost Project</span>
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
              <span>CASE 03 / SPLIT CONTRACTS</span>
              <span className="text-rose-700 font-bold font-mono">RULE 155</span>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#78716C]">Part 1:</span>
                <span className="font-bold text-[#1C1917]">₹4,95,000</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#78716C]">Part 2:</span>
                <span className="font-bold text-[#1C1917]">₹4,92,000</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#78716C]">Part 3:</span>
                <span className="font-bold text-[#1C1917]">₹4,98,000</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1C1917]/10 text-[10px] text-rose-800 font-bold uppercase font-mono">
              ⚠ Split to bypass open public tenders
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
              <span>CASE 04 / CONTRACTOR MONOPOLY</span>
              <span className="text-amber-800 font-bold font-mono">HHI SCORE</span>
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-bold text-[#1C1917] block">
                Single Agency Monopoly
              </span>
              <span className="text-[11px] text-[#78716C] mt-1 block">
                1 agency won 100% of contracts in this block
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1C1917]/10 flex items-center justify-between">
              <span className="text-xs font-mono font-black text-rose-700">Zero Competition</span>
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
              ACT II • AUTOMATED AUDIT CHECKS
            </span>
            <WarpText
              text={"Catching Procurement Violations\nBefore Public Funds Are Lost"}
              color="#F7F5EE"
              fontSize="clamp(1.8rem, 3.8vw, 3.2rem)"
              fontWeight={700}
              fontFamily="Fraunces, Georgia, serif"
              warpStrength={0.07}
              speed={0.45}
              style={{ height: "150px", maxWidth: "800px" }}
            />
            <WarpText
              text="Real-time compliance checks across General Financial Rules and contractor cartels"
              color="#94A3B8"
              fontSize="clamp(0.95rem, 1.8vw, 1.3rem)"
              fontWeight={400}
              fontFamily="Newsreader, serif"
              warpStrength={0.035}
              speed={0.3}
              style={{ height: "50px", maxWidth: "750px", marginTop: "8px" }}
            />
            <p className="font-serif-body text-base sm:text-lg text-slate-400 mt-4 leading-relaxed">
              Whenever a Member of Parliament (MP) recommends a project, SETU automatically cross-references it against India&apos;s General Financial Rules (GFR), official construction rate manuals, and contractor bidding patterns.
            </p>
          </div>

          {/* 2-Column Ledger Directory with Hairline Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-0 border-t border-white/15">
            
            {/* Capability 01 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  01 / Split-Contract Radar (GFR Rule 155)
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">RULE §155</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Government rules require an open, competitive online tender for any public work exceeding ₹5.00 Lakh. When officials split a large project into smaller contracts (such as three projects of ₹4.95 Lakh each) to bypass open competition and handpick contractors, SETU flags it immediately.
              </p>
              <Link href="/alerts" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>View Flagged Split Contracts</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Capability 02 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  02 / Single-Contractor Monopolies (Cartel Radar)
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">HHI SCORE</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                When one favored contractor wins almost all public works in a district, competition disappears and project quality drops. SETU uses economic concentration formulas (the Herfindahl-Hirschman Index) to highlight districts where public works are monopolized by a single favored agency.
              </p>
              <Link href="/graph" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>Inspect Contractor Network</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Capability 03 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  03 / Approval Delay Tracker (45-Day Legal Window)
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">45-DAY LIMIT</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Under Section 4.2 of official MPLADS guidelines, the District Authority (headed by the District Magistrate) must formally approve or reject an MP&apos;s project recommendation within 45 days. SETU flags every day of delay so vital community roads and drinking water works aren&apos;t stuck in bureaucratic paperwork.
              </p>
              <Link href="/dashboard" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>Check Approval Delays</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Capability 04 */}
            <div className="py-8 border-b border-white/15 group">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F5EE] group-hover:text-[#F59E0B] transition-colors">
                  04 / Satellite Ground Verification (ISRO / GIS)
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">ISRO / GIS</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Sometimes contractors submit completion certificates and collect payment for roads, water tanks, or community halls that were never actually built (&quot;ghost assets&quot;). SETU compares satellite images taken before and after the project date to verify that physical construction actually exists on the ground.
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
                  05 / Portals for Every Level of Government
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">4 GOVERNANCE TIERS</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Public accountability requires clear responsibility. SETU provides dedicated views tailored to each role: central ministry officials monitor nationwide trends, state secretariats ensure regional fairness, district magistrates manage local execution, and MPs track their community recommendations.
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
                  06 / Audit-Ready Case Files
                </h3>
                <span className="text-xs font-mono font-bold text-[#F59E0B]">AUDIT-READY</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                When a project shows serious red flags, SETU generates a structured investigation brief. It bundles financial rule violations, contractor bidding history, and satellite coordinates so that official audit bodies (like the Comptroller and Auditor General, CAG) and anti-corruption authorities can take immediate action.
              </p>
              <Link href="/cases" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-white transition-colors">
                <span>Review Active Case Files</span>
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
              ACT III • 4 TIERS OF GOVERNMENT
            </span>

            <WarpText
              text={"Built for Every Level of\nPublic Administration"}
              color="#1C1917"
              fontSize="clamp(1.8rem, 3.8vw, 3.2rem)"
              fontWeight={700}
              fontFamily="Fraunces, Georgia, serif"
              warpStrength={0.07}
              speed={0.45}
              style={{ height: "150px" }}
            />

            <WarpText
              text="Four constitutional tiers of authority, from national ministry to district magistrate"
              color="#57534E"
              fontSize="clamp(0.95rem, 1.8vw, 1.25rem)"
              fontWeight={500}
              fontFamily="Newsreader, serif"
              warpStrength={0.035}
              speed={0.3}
              style={{ height: "50px", marginTop: "4px" }}
            />

            <p className="font-serif-body text-base sm:text-lg text-[#57534E] leading-relaxed">
              Public spending cannot be audited with a one-size-fits-all dashboard. In the Indian administrative system, different officials hold different legal responsibilities. SETU tailors its data and alerts to each specific role—from national central planners down to local village roads.
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
                🏛️ Central Ministry (MoSPI)
              </button>
              <button
                onClick={() => setActiveTier("sna")}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTier === "sna"
                    ? "bg-[#1C1917] text-[#F7F5EE] shadow-paper"
                    : "bg-[#FAF9F5] text-[#57534E] border border-[#1C1917]/15 hover:border-[#1C1917]"
                }`}
              >
                ⚖️ State Government (SNA)
              </button>
              <button
                onClick={() => setActiveTier("da")}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTier === "da"
                    ? "bg-[#1C1917] text-[#F7F5EE] shadow-paper"
                    : "bg-[#FAF9F5] text-[#57534E] border border-[#1C1917]/15 hover:border-[#1C1917]"
                }`}
              >
                🛡️ District Magistrate (DM)
              </button>
              <button
                onClick={() => setActiveTier("mp")}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTier === "mp"
                    ? "bg-[#1C1917] text-[#F7F5EE] shadow-paper"
                    : "bg-[#FAF9F5] text-[#57534E] border border-[#1C1917]/15 hover:border-[#1C1917]"
                }`}
              >
                🗳️ Member of Parliament (MP)
              </button>
            </div>

            {/* Dynamic Active Tier Dossier */}
            <div className="border border-[#1C1917]/15 bg-[#FAF9F5] p-6 shadow-paper mt-4 space-y-3">
              {activeTier === "mospi" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#B45309] uppercase">Jurisdiction: All India • Central Government</span>
                    <span className="text-xs font-mono font-bold text-[#1C1917]">₹9,062 Cr Monitored</span>
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917]">
                    Ministry of Statistics &amp; Programme Implementation (MoSPI)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    The central government ministry responsible for the nationwide MPLADS scheme. MoSPI monitors how ₹9,062 Crore is distributed across all 28 states and 8 union territories. It ensures funds are released on schedule, spots cross-state contractor syndicates, and enforces national financial guidelines.
                  </p>
                </>
              )}

              {activeTier === "sna" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#B45309] uppercase">Jurisdiction: State Planning Department • 38 Districts in Bihar</span>
                    <span className="text-xs font-mono font-bold text-[#1C1917]">State-Level Coordination</span>
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917]">
                    State Nodal Authority (SNA)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    The state-level department that monitors whether development funds are divided fairly across all districts. It oversees major state-run engineering agencies (such as state bridge and road corporations) to make sure public works contracts are not monopolized by one favorite agency.
                  </p>
                </>
              )}

              {activeTier === "da" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#B45309] uppercase">Jurisdiction: District Magistrate / Collector • Darbhanga District</span>
                    <span className="text-xs font-mono font-bold text-[#1C1917]">Local Execution Authority</span>
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917]">
                    District Authority (District Magistrate / Collector)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    The District Magistrate (DM or Collector) is the key administrative officer responsible for approving project estimates, hiring contractors, and inspecting works on the ground. SETU helps the DM immediately spot unapproved delays, tenders split to bypass bidding rules, and contractor monopolies in their district.
                  </p>
                </>
              )}

              {activeTier === "mp" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#B45309] uppercase">Jurisdiction: Lok Sabha / Rajya Sabha MP • Gopal Jee Thakur (128 Works)</span>
                    <span className="text-xs font-mono font-bold text-[#1C1917]">Elected Representative</span>
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917]">
                    Member of Parliament (MP Constituency Portal)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    Members of Parliament recommend development projects based on the urgent needs of their local constituents (such as village roads, community halls, and drinking water). This portal tracks their recommendations across all four legal stages—from the initial proposal to administrative approval, contractor bidding, and final construction on the ground.
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
                  LEGAL STANDARDS WE ENFORCE
                </span>
                <h3 className="font-editorial text-2xl text-[#1C1917] mt-1 font-light">
                  Official Rules &amp; Guidelines
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#B45309] mt-1 shrink-0" />
                  <div>
                    <strong className="text-[#1C1917] block font-mono">GFR 2017 • Rule 155</strong>
                    <span className="text-[#78716C]">Requires open, competitive online tenders for any public work over ₹5,00,000 to prevent officials from privately handpicking favored contractors.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#B45309] mt-1 shrink-0" />
                  <div>
                    <strong className="text-[#1C1917] block font-mono">MPLADS Guidelines 2023 • §4.2</strong>
                    <span className="text-[#78716C]">District Magistrates must evaluate and decide on an MP&apos;s project recommendation within 45 days so urgent community works are not delayed.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#B45309] mt-1 shrink-0" />
                  <div>
                    <strong className="text-[#1C1917] block font-mono">CAG Performance Audit Standards</strong>
                    <span className="text-[#78716C]">Requires physical verification of assets via satellite so contractors cannot collect public money for non-existent or incomplete projects.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1C1917]/10 flex items-center justify-between text-[11px] font-mono text-[#78716C]">
                <span>Status: <strong className="text-emerald-700">Enforced by Code</strong></span>
                <span>Audit Trail: <strong className="text-[#1C1917]">Tamper-Proof &amp; Verifiable</strong></span>
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
              ACT IV • LIVE PROJECT REGISTRY
            </span>
            <WarpText
              text="Real-Time National Project Registry"
              color="#1C1917"
              fontSize="clamp(1.8rem, 3.5vw, 3rem)"
              fontWeight={700}
              fontFamily="Fraunces, Georgia, serif"
              warpStrength={0.06}
              speed={0.4}
              style={{ height: "85px" }}
            />
            <WarpText
              text="Live parliamentary public works evaluated by financial rules, satellites, and timelines"
              color="#57534E"
              fontSize="clamp(0.95rem, 1.8vw, 1.2rem)"
              fontWeight={500}
              fontFamily="Newsreader, serif"
              warpStrength={0.035}
              speed={0.3}
              style={{ height: "45px", marginTop: "4px" }}
            />
            <p className="font-serif-body text-base text-[#57534E] mt-3">
              Browse live parliamentary works from across India. Every project is checked against financial rules, satellite progress, and approval deadlines. Filter by risk severity or search for a specific project.
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
            placeholder="Search by Project ID (e.g. W-23167), project name, constituency, or contractor..."
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
                <th className="p-4 font-bold text-right">Approved Budget</th>
                <th className="p-4 font-bold">Contractor / Agency</th>
                <th className="p-4 font-bold text-center">Risk Score</th>
                <th className="p-4 font-bold text-right">Audit File</th>
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
                        <span>Inspect</span>
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
          <span>Displaying 6 live parliamentary works from the central monitoring registry.</span>
          <Link href="/works" className="font-bold text-[#1C1917] hover:underline flex items-center gap-1">
            <span>Explore All 60,356 Monitored Projects</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* ────────────────────────────────────────────────────────────
            MONUMENTAL VARIABLE FONT PRESSURE EXHIBIT (REACT BITS)
            Dynamic variable font responds to cursor proximity
        ──────────────────────────────────────────────────────────── */}
        <div className="mt-28 pt-16 pb-12 border-t border-[#1C1917]/15 text-center overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 border border-[#1C1917]/15 bg-[#EFECE4] text-[10px] font-mono font-bold uppercase tracking-widest text-[#57534E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
            <span>SETU • STATUTORY ENFORCEMENT &amp; TRANSPARENCY UNIT</span>
          </div>

          <div className="max-w-xl mx-auto mb-6 px-4">
            <h4 className="font-editorial text-base sm:text-lg font-bold text-[#1C1917] tracking-tight mb-1">
              National Platform for Public Fund Integrity &amp; Transparency
            </h4>
            <p className="font-serif-body text-xs sm:text-sm text-[#78716C] leading-relaxed">
              Making parliamentary development funds open, fair, and accountable • Hover your cursor to interact with the responsive typography
            </p>
          </div>

          {/* Centered, gracefully proportioned interactive stage */}
          <div className="mx-auto max-w-xl h-28 sm:h-36 md:h-40 w-full overflow-hidden flex items-center justify-center px-4">
            <TextPressure
              text="SETU"
              flex={true}
              center={true}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="#1C1917"
              strokeColor="#B45309"
              minFontSize={36}
              maxFontSize={84}
              className="select-none tracking-normal"
            />
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────
            ARCHITECTURAL FOOTER
            3-Column Site Index and Official Mandate Note
        ──────────────────────────────────────────────────────────── */}
        <footer className="pt-16 border-t border-[#1C1917]/15 relative">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-16 text-xs">
            <div>
              <span className="font-editorial text-base font-bold text-[#1C1917] block mb-4">
                Platform Portals
              </span>
              <ul className="space-y-2.5 text-[#57534E]">
                <li><Link href="/dashboard" className="hover:text-[#1C1917] hover:underline">Operational Command Center</Link></li>
                <li><Link href="/works" className="hover:text-[#1C1917] hover:underline">MPLADS Works Explorer</Link></li>
                <li><Link href="/maps" className="hover:text-[#1C1917] hover:underline">Geospatial Risk Visualizer</Link></li>
                <li><Link href="/graph" className="hover:text-[#1C1917] hover:underline">Money Flow &amp; Contractor Network</Link></li>
              </ul>
            </div>

            <div>
              <span className="font-editorial text-base font-bold text-[#1C1917] block mb-4">
                Audit &amp; Risk Detectors
              </span>
              <ul className="space-y-2.5 text-[#57534E]">
                <li><Link href="/alerts" className="hover:text-[#1C1917] hover:underline">GFR Rule 155 Split-Contract Radar</Link></li>
                <li><Link href="/graph" className="hover:text-[#1C1917] hover:underline">Contractor Monopoly Index (HHI)</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#1C1917] hover:underline">45-Day Approval Delay Matrix</Link></li>
                <li><Link href="/cases" className="hover:text-[#1C1917] hover:underline">Audit-Ready Case Files</Link></li>
              </ul>
            </div>

            <div>
              <span className="font-editorial text-base font-bold text-[#1C1917] block mb-4">
                Official Guidelines Enforced
              </span>
              <ul className="space-y-2.5 text-[#57534E]">
                <li className="text-[#78716C]">Comptroller &amp; Auditor General (CAG) Standards</li>
                <li className="text-[#78716C]">General Financial Rules (GFR 2017)</li>
                <li className="text-[#78716C]">MPLADS Revised Guidelines 2023 §4.2</li>
                <li className="text-[#78716C]">Ministry of Statistics &amp; Programme Implementation</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[11px] text-[#78716C] border-t border-[#1C1917]/10 font-mono">
            <span>© 2026 SETU — Smart Expenditure Tracking &amp; Utility • Statutory Enforcement &amp; Transparency Unit</span>
            <span className="mt-2 sm:mt-0">Government of India • Ministry of Statistics &amp; Programme Implementation</span>
          </div>
        </footer>

      </section>
    </div>
  );
}
