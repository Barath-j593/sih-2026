"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  // Only show the public landing navbar on the root "/" page
  if (pathname !== "/") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Emblem Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10">
            {/* Ashoka Wheel geometric symbol */}
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
              <circle cx="12" cy="12" r="3" className="fill-amber-500 stroke-none" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-slate-900">SANCHAY</span>
              <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-600">
                MPLADS INTELLIGENCE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              Government of India • Ministry of Statistics & Programme Implementation
            </p>
          </div>
        </Link>

        {/* Central Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link href="/#pipeline" className="hover:text-slate-900 transition-colors">
            Intelligence
          </Link>
          <Link href="/#public-query" className="hover:text-slate-900 transition-colors">
            Public Query
          </Link>
          <Link href="/#how-it-works" className="hover:text-slate-900 transition-colors">
            Pipeline
          </Link>
          <Link href="/works" className="hover:text-slate-900 transition-colors">
            Projects
          </Link>
          <Link href="/#capsules" className="hover:text-slate-900 transition-colors">
            Governance
          </Link>
          <Link href="/alerts" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <span>Early Warning</span>
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          </Link>
          <Link href="/maps" className="hover:text-slate-900 transition-colors">
            National View
          </Link>
        </nav>

        {/* Search & CTA Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 focus-within:border-slate-400 focus-within:bg-white transition-all">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-20 sm:w-28"
            />
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-mono text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow group"
          >
            <span>Open Sanchay Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
