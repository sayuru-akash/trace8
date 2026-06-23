"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HistoryChartProps {
  results: {
    durationMs: number;
    status: string;
    createdAt: string;
  }[];
}

const statusColor = (status: string) => {
  switch (status) {
    case "passed":
    case "flaky":
      return "oklch(0.70 0.19 155)";
    case "failed":
    case "timed_out":
      return "oklch(0.63 0.24 18)";
    default:
      return "oklch(0.60 0.01 260)";
  }
};

export function HistoryChart({ results }: HistoryChartProps) {
  if (results.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Not enough data for a chart yet.
      </div>
    );
  }

  // Reverse to chronological order
  const data = [...results].reverse().map((r) => ({
    date: new Date(r.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    duration: r.durationMs,
    status: r.status,
    color: statusColor(r.status),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(0.28 0.015 260 / 0.3)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "oklch(0.60 0.01 260)", fontSize: 11 }}
          axisLine={{ stroke: "oklch(0.28 0.015 260)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "oklch(0.60 0.01 260)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}s`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.18 0.012 260)",
            border: "1px solid oklch(0.28 0.015 260)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "oklch(0.96 0.005 260)" }}
          formatter={(value: number) => [`${(value / 1000).toFixed(2)}s`, "Duration"]}
        />
        <Line
          type="monotone"
          dataKey="duration"
          stroke="oklch(0.82 0.21 128)"
          strokeWidth={2}
          dot={{ fill: "oklch(0.82 0.21 128)", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
