"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "timed_out", label: "Timed Out" },
  { value: "cancelled", label: "Cancelled" },
];

const ENV_OPTIONS = [
  { value: "", label: "All Environments" },
  { value: "local", label: "Local" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

export function RunsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const env = searchParams.get("env") ?? "";
  const branch = searchParams.get("branch") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters = status || env || branch || from || to;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Environment
        </label>
        <select
          value={env}
          onChange={(e) => setParam("env", e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ENV_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Branch
        </label>
        <Input
          placeholder="e.g. main"
          value={branch}
          onChange={(e) => setParam("branch", e.target.value)}
          className="w-40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          From
        </label>
        <Input
          type="date"
          value={from}
          onChange={(e) => setParam("from", e.target.value)}
          className="w-40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">To</label>
        <Input
          type="date"
          value={to}
          onChange={(e) => setParam("to", e.target.value)}
          className="w-40"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
