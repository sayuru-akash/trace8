"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RunTrendChartProps {
  runs: {
    status: string;
    createdAt: string;
    total: number;
    passed: number;
  }[];
}

export function RunTrendChart({ runs }: RunTrendChartProps) {
  if (runs.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Not enough runs for a trend yet.
      </div>
    );
  }

  // Reverse to chronological
  const data = [...runs].reverse().map((r) => {
    const rate = r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0;
    return {
      date: new Date(r.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      passRate: rate,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="passRateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.21 128)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="oklch(0.82 0.21 128)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={[0, 100]}
          tick={{ fill: "oklch(0.60 0.01 260)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.18 0.012 260)",
            border: "1px solid oklch(0.28 0.015 260)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "oklch(0.96 0.005 260)" }}
          formatter={(value: number) => [`${value}%`, "Pass Rate"]}
        />
        <Area
          type="monotone"
          dataKey="passRate"
          stroke="oklch(0.82 0.21 128)"
          strokeWidth={2}
          fill="url(#passRateGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
