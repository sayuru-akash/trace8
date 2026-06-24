"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

interface DashboardShellProps {
  children: React.ReactNode;
  onMobileSidebarToggle?: () => void;
}

export function DashboardShell({ children, onMobileSidebarToggle }: DashboardShellProps) {
  const [cmdOpen, setCmdOpen] = React.useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center">
        {onMobileSidebarToggle && (
          <button
            onClick={onMobileSidebarToggle}
            className="lg:hidden p-2 ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <Topbar />
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
