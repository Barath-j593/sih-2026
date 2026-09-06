import "./globals.css";
import React from "react";
import { RoleProvider } from "../context/RoleContext";
import { RoleSwitcher } from "../components/RoleSwitcher";
import { AppShell } from "../components/AppShell";

export const metadata = {
  title: "SETU — AI-Powered MPLADS Intelligence & Risk Monitoring (Government of India)",
  description: "SETU (Smart Expenditure Tracking & Utility) — Official intelligence layer for MPLADS works, fund utilization, and project execution, helping authorities identify anomalies before they become audit findings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="bg-[#F7F5EE] text-[#111827] min-h-screen flex flex-col antialiased selection:bg-[#D97706]/20 selection:text-[#B45309]">
        <RoleProvider>
          {/* Top Sticky Tier Switcher for Operational Governance */}
          <RoleSwitcher />
          {/* Main Body Shell (Dynamically handles landing vs dashboard layouts) */}
          <AppShell>{children}</AppShell>
        </RoleProvider>
      </body>
    </html>
  );
}
