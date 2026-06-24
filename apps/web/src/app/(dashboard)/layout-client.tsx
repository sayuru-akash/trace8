"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  org: {
    name: string;
    slug: string;
  } | null;
}

export function DashboardLayoutClient({
  children,
  user,
  org,
}: DashboardLayoutClientProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={user}
        org={org}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <DashboardShell
        onMobileSidebarToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
