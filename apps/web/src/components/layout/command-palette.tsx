"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  FolderKanban,
  PlayCircle,
  FlaskConical,
  AlertTriangle,
  Bell,
  Settings,
  Sun,
  Moon,
  LogOut,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/runs", icon: PlayCircle, label: "Runs" },
  { href: "/tests", icon: FlaskConical, label: "Tests" },
  { href: "/flaky-tests", icon: AlertTriangle, label: "Flaky Tests" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  function handleSelect(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <Command
              className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Escape") onOpenChange(false);
              }}
            >
              <div className="flex items-center gap-2 border-b border-border px-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Command.Input
                  placeholder="Search..."
                  className="h-11 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Group heading="Navigation" className="px-2">
                  {navItems.map(({ href, icon: Icon, label }) => (
                    <Command.Item
                      key={href}
                      value={label}
                      onSelect={() => handleSelect(href)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-2 aria-selected:bg-surface-2"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-border" />

                <Command.Group heading="Actions" className="px-2">
                  <Command.Item
                    value="Toggle theme"
                    onSelect={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                      onOpenChange(false);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-2 aria-selected:bg-surface-2"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    )}
                    Toggle theme
                  </Command.Item>
                  <Command.Item
                    value="Sign out"
                    onSelect={async () => {
                      onOpenChange(false);
                      await signOutAction();
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-2 aria-selected:bg-surface-2"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    Sign out
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
