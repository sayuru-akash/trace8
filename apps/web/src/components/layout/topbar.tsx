"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "));

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Trace8</span>
        {segments.map((segment, i) => (
          <React.Fragment key={i}>
            <span className="text-muted-foreground">/</span>
            <span
              className={
                i === segments.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {segment}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Command palette trigger */}
        <Button variant="outline" size="sm" className="h-8 gap-2 text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-surface-2 px-1.5 font-mono text-[10px] font-medium sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        <ThemeToggle />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="flex-col items-start">
              <span className="font-medium">{session?.user?.name}</span>
              <span className="text-xs text-muted-foreground">
                {session?.user?.email}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings">Settings</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-danger focus:text-danger"
              onSelect={(e) => {
                e.preventDefault();
                void signOut({ callbackUrl: "/signin" });
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
