"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  FolderKanban,
  PlayCircle,
  FlaskConical,
  AlertTriangle,
  Bell,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Building2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Wordmark } from "@/components/brand/wordmark";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { signOutAction } from "@/server/actions/auth";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  org: {
    name: string;
    slug: string;
  } | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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

const adminNavItem = { href: "/admin", icon: Shield, label: "Admin" };

export function Sidebar({ user, org, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <Logo size="sm" animate />
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <Wordmark size="sm" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const item = (
            <Link
              key={href}
              href={href}
              onClick={isMobile ? onMobileClose : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );

          if (collapsed && !isMobile) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }

          return item;
        })}

        {user.role === "ADMIN" && (
          <>
            <Separator className="my-2" />
            {(() => {
              const { href, icon: Icon, label } = adminNavItem;
              const isActive = pathname === href || pathname.startsWith(href + "/");
              const item = (
                <Link
                  key={href}
                  href={href}
                  onClick={isMobile ? onMobileClose : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    />
                  )}
                  <Icon className="h-5 w-5 shrink-0" />
                  <AnimatePresence>
                    {(!collapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="truncate"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );

              if (collapsed && !isMobile) {
                return (
                  <Tooltip key={href}>
                    <TooltipTrigger asChild>{item}</TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                );
              }

              return item;
            })()}
          </>
        )}
      </nav>

      <Separator />

      {/* Org Switcher */}
      {org && (
        <div className="px-2 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-2 transition-colors",
                  collapsed && !isMobile && "justify-center"
                )}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{org.name}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Building2 className="h-4 w-4" />
                {org.name}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <Separator />

      {/* User section */}
      <div className="flex items-center gap-2 px-3 py-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        {(!collapsed || isMobile) && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}
        {(!collapsed || isMobile) && (
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative hidden lg:flex h-screen flex-col border-r border-border bg-surface"
      >
        {sidebarContent(false)}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronsRight className="h-3 w-3" />
          ) : (
            <ChevronsLeft className="h-3 w-3" />
          )}
        </button>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-border bg-surface lg:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
