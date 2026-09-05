import "./globals.css";
import React from "react";
import { RoleProvider } from "../context/RoleContext";
import { RoleSwitcher } from "../components/RoleSwitcher";
import { Navbar } from "../components/Navbar";
import { AppShell } from "../components/AppShell";

export const metadata = {
  title: "SETU — AI-Powered MPLADS Intelligence & Risk Monitoring (Government of India)",
  description: "SETU (Smart Expenditure Tracking & Utility) — Official intelligence layer for MPLADS works, fund utilization, and project execution, helping authorities identify anomalies before they become audit findings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <RoleProvider>
          {/* Top Sticky Tier Switcher for Operational Governance */}
          <RoleSwitcher />
          {/* Official Government Navbar */}
          <Navbar />
          {/* Main Body Shell (Dynamically handles landing vs dashboard layouts) */}
          <AppShell>{children}</AppShell>
        </RoleProvider>
      </body>
    </html>
  );
}
