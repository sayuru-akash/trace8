"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Wordmark } from "@/components/brand/wordmark";
import {
  Activity,
  Eye,
  Zap,
  Shield,
} from "lucide-react";

const features = [
  { icon: Activity, text: "Real-time test observability" },
  { icon: Eye, text: "Visual traces, screenshots & video" },
  { icon: Zap, text: "Flaky test detection & alerts" },
  { icon: Shield, text: "CI/CD integration in minutes" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Brand */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-between overflow-hidden bg-background p-10">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 bg-radial-fade" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="lg" animate />
            <Wordmark size="lg" />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground">
            Run tests.{" "}
            <span className="text-gradient-primary">See everything.</span>
            <br />
            Fix faster.
          </h1>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Trace8. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full items-center justify-center bg-surface p-6 lg:w-1/2 lg:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
