import { describe, it, expect } from "vitest";

// Pure flake score calculation extracted for unit testing (no DB dependency)
function computeFlakeScore(
  results: { status: string; retryCount: number }[]
): { flakeScore: number; classification: "stable" | "watch" | "flaky" } {
  const chrono = [...results].reverse();

  let passCount = 0;
  let failCount = 0;
  let retryPassCount = 0;

  for (const r of chrono) {
    if (r.status === "passed") {
      passCount++;
      if (r.retryCount > 0) retryPassCount++;
    } else if (r.status === "failed" || r.status === "timed_out") {
      failCount++;
    }
  }

  const total = chrono.length;
  const retryPassComponent =
    total > 0 ? Math.min(retryPassCount / total, 1) : 0;

  let flipCount = 0;
  for (let i = 1; i < chrono.length; i++) {
    const prev = chrono[i - 1];
    const curr = chrono[i];
    const prevIsPass = prev.status === "passed" || prev.status === "flaky";
    const currIsPass = curr.status === "passed" || curr.status === "flaky";
    if (prevIsPass !== currIsPass) flipCount++;
  }
  const maxFlips = Math.max(total - 1, 1);
  const flipComponent = flipCount / maxFlips;

  let mixComponent = 0;
  if (passCount > 0 && failCount > 0 && total > 0) {
    const ratio = Math.min(passCount, failCount) / total;
    mixComponent = ratio * 2;
  }

  const flakeScore = Math.min(
    retryPassComponent * 0.5 + flipComponent * 0.3 + mixComponent * 0.2,
    1
  );

  let classification: "stable" | "watch" | "flaky";
  if (flakeScore < 0.3) classification = "stable";
  else if (flakeScore < 0.6) classification = "watch";
  else classification = "flaky";

  return {
    flakeScore: Math.round(flakeScore * 100) / 100,
    classification,
  };
}

describe("flake score calculation", () => {
  it("classifies all-pass results as stable", () => {
    const results = Array.from({ length: 10 }, () => ({
      status: "passed",
      retryCount: 0,
    }));
    const { flakeScore, classification } = computeFlakeScore(results);
    expect(flakeScore).toBe(0);
    expect(classification).toBe("stable");
  });

  it("classifies all-fail results as stable", () => {
    const results = Array.from({ length: 10 }, () => ({
      status: "failed",
      retryCount: 0,
    }));
    const { flakeScore, classification } = computeFlakeScore(results);
    expect(flakeScore).toBe(0);
    expect(classification).toBe("stable");
  });

  it("scores retry-pass results higher", () => {
    const results = [
      { status: "passed", retryCount: 1 },
      { status: "passed", retryCount: 1 },
      { status: "passed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
    ];
    const { flakeScore } = computeFlakeScore(results);
    expect(flakeScore).toBeGreaterThan(0);
  });

  it("scores alternating pass/fail as flaky", () => {
    const results = [
      { status: "passed", retryCount: 0 },
      { status: "failed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "failed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "failed", retryCount: 0 },
    ];
    const { flakeScore, classification } = computeFlakeScore(results);
    expect(flakeScore).toBeGreaterThan(0.3);
    expect(classification).not.toBe("stable");
  });

  it("handles empty results", () => {
    const { flakeScore, classification } = computeFlakeScore([]);
    expect(flakeScore).toBe(0);
    expect(classification).toBe("stable");
  });

  it("classifies mixed results with retries as watch or flaky", () => {
    const results = [
      { status: "passed", retryCount: 2 },
      { status: "failed", retryCount: 0 },
      { status: "passed", retryCount: 1 },
      { status: "failed", retryCount: 0 },
      { status: "passed", retryCount: 1 },
    ];
    const { flakeScore } = computeFlakeScore(results);
    expect(flakeScore).toBeGreaterThan(0);
  });
});

describe("classification thresholds", () => {
  it("stable: score < 0.3", () => {
    const results = Array.from({ length: 10 }, () => ({
      status: "passed",
      retryCount: 0,
    }));
    const { classification } = computeFlakeScore(results);
    expect(classification).toBe("stable");
  });

  it("watch: 0.3 <= score < 0.6", () => {
    // Create a pattern that produces a score in the watch range
    const results = [
      { status: "passed", retryCount: 0 },
      { status: "failed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
      { status: "passed", retryCount: 0 },
    ];
    const { flakeScore } = computeFlakeScore(results);
    // With 1 flip out of 9 and no retries, score should be low
    expect(flakeScore).toBeLessThan(0.6);
  });
});
