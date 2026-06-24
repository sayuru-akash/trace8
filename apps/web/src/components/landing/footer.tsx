import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const links = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "GitHub", href: "https://github.com/trace8" },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-display text-sm font-semibold tracking-tight">
            Trace8
          </span>
        </div>

        <p className="text-sm text-muted-foreground text-center sm:text-left">
          Run tests. See everything. Fix faster.
        </p>

        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              {...(link.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; 2026 Trace8 by Codezela Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
