"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <main className="flex-1 overflow-y-auto bg-transparent">
        {children}
      </main>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-[#F7F5EE]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F7F5EE]">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
