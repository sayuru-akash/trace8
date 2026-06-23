"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SummaryBarProps {
  passed: number;
  failed: number;
  skipped: number;
  timedOut: number;
  total: number;
  className?: string;
}

export function SummaryBar({
  passed,
  failed,
  skipped,
  timedOut,
  total,
  className,
}: SummaryBarProps) {
  if (total === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2" />
        <p className="text-xs text-muted-foreground">No test results</p>
      </div>
    );
  }

  const segments = [
    { count: passed, color: "bg-success", label: "Passed" },
    { count: failed, color: "bg-danger", label: "Failed" },
    { count: timedOut, color: "bg-warning", label: "Timed Out" },
    { count: skipped, color: "bg-muted-foreground/30", label: "Skipped" },
  ].filter((s) => s.count > 0);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
        {segments.map((segment) => {
          const pct = (segment.count / total) * 100;
          return (
            <motion.div
              key={segment.label}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", segment.color)}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" />
          <span className="text-muted-foreground">Passed</span>
          <span className="font-medium text-foreground">
            {passed}{" "}
            <span className="text-muted-foreground">
              ({Math.round((passed / total) * 100)}%)
            </span>
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-danger" />
          <span className="text-muted-foreground">Failed</span>
          <span className="font-medium text-foreground">
            {failed}{" "}
            <span className="text-muted-foreground">
              ({Math.round((failed / total) * 100)}%)
            </span>
          </span>
        </span>
        {timedOut > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="text-muted-foreground">Timed Out</span>
            <span className="font-medium text-foreground">
              {timedOut}{" "}
              <span className="text-muted-foreground">
                ({Math.round((timedOut / total) * 100)}%)
              </span>
            </span>
          </span>
        )}
        {skipped > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="text-muted-foreground">Skipped</span>
            <span className="font-medium text-foreground">
              {skipped}{" "}
              <span className="text-muted-foreground">
                ({Math.round((skipped / total) * 100)}%)
              </span>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
