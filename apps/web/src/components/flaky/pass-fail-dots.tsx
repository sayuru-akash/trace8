"use client";

interface PassFailDotsProps {
  results: { status: string }[];
}

export function PassFailDots({ results }: PassFailDotsProps) {
  const dotColor = (status: string) => {
    switch (status) {
      case "passed":
      case "flaky":
        return "var(--color-success)";
      case "failed":
      case "timed_out":
        return "var(--color-danger)";
      case "skipped":
      case "interrupted":
        return "var(--color-muted-foreground)";
      default:
        return "var(--color-border)";
    }
  };

  return (
    <div className="flex items-center gap-1">
      {results.map((r, i) => (
        <div
          key={i}
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: dotColor(r.status) }}
          title={r.status}
        />
      ))}
    </div>
  );
}
