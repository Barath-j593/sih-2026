import "./globals.css";
import React from "react";
import { RoleProvider } from "../context/RoleContext";
import { RoleSwitcher } from "../components/RoleSwitcher";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";

export const metadata = {
  title: "SETU — AI-Powered MPLADS Anomaly & Fraud Detection (SIH 2026)",
  description: "Explainable multi-signal AI platform for detecting cost escalation, duplicate allocations, vendor capture, and ghost projects across Indian parliamentary constituencies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070c18] text-slate-100 min-h-screen flex flex-col antialiased">
        <RoleProvider>
          {/* Sticky Demo Role Switcher at the very top */}
          <RoleSwitcher />
          {/* Government Portal Header */}
          <Navbar />
          {/* Main Body with Sidebar + Content */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#070c18]">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
