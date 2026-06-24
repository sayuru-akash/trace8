"use client";

import { motion } from "motion/react";
import { Terminal, Play, LayoutDashboard } from "lucide-react";

const steps = [
  {
    icon: Terminal,
    command: "bunx playwright-studio init",
    label: "Connect your project in seconds",
  },
  {
    icon: Play,
    command: "bunx playwright-studio test",
    label: "Run tests as usual",
  },
  {
    icon: LayoutDashboard,
    command: "View results",
    label: "Everything syncs to your dashboard",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Three commands. That&apos;s it.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.command}
              className="relative flex flex-col items-center text-center"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 24,
                delay: i * 0.15,
              }}
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="size-6" />
              </div>
              <div className="mb-3 rounded-lg border border-border bg-surface-2 px-4 py-2">
                <code className="font-mono text-sm text-primary">
                  {step.command}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">{step.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
