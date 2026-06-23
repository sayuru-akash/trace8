"use client";

import { motion } from "motion/react";

interface FlakeScoreBarProps {
  score: number; // 0-1
  classification: string;
}

export function FlakeScoreBar({ score, classification }: FlakeScoreBarProps) {
  const percentage = Math.round(score * 100);

  const color =
    classification === "regression"
      ? "var(--color-danger)"
      : classification === "flaky"
        ? "var(--color-danger)"
        : classification === "watch"
          ? "var(--color-warning)"
          : "var(--color-success)";

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-24 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {percentage}%
      </span>
    </div>
  );
}
