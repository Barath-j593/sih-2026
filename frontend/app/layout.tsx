import "./globals.css";
import React from "react";
import { RoleProvider } from "../context/RoleContext";
import { RoleSwitcher } from "../components/RoleSwitcher";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";

export const metadata = {
  title: "SANCHAY — AI-Powered MPLADS Intelligence & Risk Monitoring (Government of India)",
  description: "Official intelligence layer for MPLADS works, fund utilization, and project execution, helping authorities identify anomalies before they become audit findings.",
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
          {/* Main Body Shell */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/60">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
