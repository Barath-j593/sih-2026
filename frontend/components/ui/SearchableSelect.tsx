"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface SearchableOption {
  label: string;
  value: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SearchableOption)[];
  placeholder?: string;
  prefixLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  maxDisplay?: number;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Type to search...",
  prefixLabel,
  icon,
  className = "",
  maxDisplay = 100,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SearchableOption format
  const normalizedOptions: SearchableOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return opt;
  });

  // Find currently selected option
  const currentOption = normalizedOptions.find((opt) => opt.value === value) || {
    label: value,
    value: value,
  };

  // Filter options based on query
  const queryTrimmed = searchQuery.trim().toLowerCase();
  const filtered = queryTrimmed
    ? normalizedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(queryTrimmed) ||
          opt.value.toLowerCase().includes(queryTrimmed) ||
          (opt.subtitle && opt.subtitle.toLowerCase().includes(queryTrimmed))
      )
    : normalizedOptions;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 rounded-md border border-[#D9D2C5] bg-[#FFFDF9] py-1.5 pl-3 pr-2.5 text-xs font-bold text-[#1C1917] shadow-xs hover:border-[#8C5D3B] focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] transition-all cursor-pointer min-w-[200px] max-w-[320px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon && <span className="text-[#8C5D3B] shrink-0">{icon}</span>}
          {prefixLabel && (
            <span className="font-mono text-[11px] text-stone-500 shrink-0">
              {prefixLabel}
            </span>
          )}
          <span className="truncate text-[#1C1917]">
            {currentOption.label || value}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#8C5D3B] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#6E4529]" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-50 w-72 sm:w-84 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-2 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5">
          {/* Search Field */}
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] py-1.5 pl-8 pr-7 text-xs text-[#1C1917] placeholder-stone-400 focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] font-sans transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 p-0.5 text-stone-400 hover:text-stone-700"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Matches Header */}
          <div className="flex items-center justify-between px-2 pb-1.5 border-b border-[#E5DFD3] text-[10px] font-mono text-stone-500">
            <span>
              {filtered.length === normalizedOptions.length
                ? `All ${normalizedOptions.length} available`
                : `${filtered.length} of ${normalizedOptions.length} matched`}
            </span>
            {queryTrimmed && (
              <span className="font-bold text-[#6E4529]">
                Filtering by: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          {/* Options Scroll List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pt-1 pr-1 font-sans">
            {filtered.length > 0 ? (
              filtered.slice(0, maxDisplay).map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-[#F0ECE1] font-bold text-[#6E4529]"
                        : "hover:bg-[#FAF7F2] text-stone-800"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate font-medium">{opt.label}</div>
                      {opt.subtitle && (
                        <div className="text-[10px] text-stone-500 font-mono">
                          {opt.subtitle}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#6E4529] shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-stone-500">
                <p className="font-semibold text-stone-700">No matches found</p>
                <p className="text-[11px] mt-0.5">
                  No option matches &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
            {filtered.length > maxDisplay && (
              <div className="py-1 text-center text-[10px] font-mono text-stone-400">
                + {filtered.length - maxDisplay} more (type to refine query)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
