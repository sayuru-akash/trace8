"use client";

import { motion } from "motion/react";
import {
  Target,
  Search,
  Zap,
  Camera,
  Bell,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Target,
    title: "Visual Dashboard",
    description:
      "Every run synced. Failures, traces, screenshots in one place.",
  },
  {
    icon: Search,
    title: "Flaky Test Intelligence",
    description:
      "Automatic flake detection with retry analysis and history patterns.",
  },
  {
    icon: Zap,
    title: "Two-Click Debugging",
    description:
      "Go from dashboard to failing trace in two clicks.",
  },
  {
    icon: Camera,
    title: "Screenshots & Traces",
    description:
      "Failure screenshots and Playwright traces, automatically captured.",
  },
  {
    icon: Bell,
    title: "Slack Alerts",
    description:
      "Get notified on failed production runs, new failures, and flake spikes.",
  },
  {
    icon: BarChart3,
    title: "Trends & Analytics",
    description:
      "Run trends, failure rates, slowest tests, and pass rate over time.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to understand your tests
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            From flaky detection to trend analytics — all in one dashboard.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group relative rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary/40 hover:bg-surface-2"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 24,
                delay: i * 0.06,
              }}
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 bg-primary/[0.03]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
