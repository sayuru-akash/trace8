import { describe, it, expect } from "vitest";
import {
  slugify,
  formatDuration,
  formatBytes,
  generateStableKey,
} from "../utils";

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("replaces spaces and underscores with hyphens", () => {
    expect(slugify("hello_world foo bar")).toBe("hello-world-foo-bar");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles multiple spaces", () => {
    expect(slugify("a   b   c")).toBe("a-b-c");
  });
});

describe("formatDuration", () => {
  it("returns dash for null", () => {
    expect(formatDuration(null)).toBe("\u2014");
  });

  it("returns dash for undefined", () => {
    expect(formatDuration(undefined)).toBe("\u2014");
  });

  it("formats milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("formats seconds", () => {
    expect(formatDuration(5000)).toBe("5.0s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(125000)).toBe("2m 5s");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0ms");
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1536)).toBe("1.5KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.0MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1.00GB");
  });

  it("handles bigint", () => {
    expect(formatBytes(BigInt(1024))).toBe("1.0KB");
  });

  it("handles zero", () => {
    expect(formatBytes(0)).toBe("0B");
  });
});

describe("generateStableKey", () => {
  it("generates key without browser project", () => {
    const key = generateStableKey("proj1", "tests/login.spec.ts", [
      "Login",
      "should login",
    ]);
    expect(key).toBe("proj1|tests/login.spec.ts|Login::should login");
  });

  it("generates key with browser project", () => {
    const key = generateStableKey(
      "proj1",
      "tests/login.spec.ts",
      ["Login", "should login"],
      "chromium"
    );
    expect(key).toBe(
      "proj1|tests/login.spec.ts|Login::should login|chromium"
    );
  });

  it("generates unique keys for different test paths", () => {
    const key1 = generateStableKey("p1", "a.spec.ts", ["test1"]);
    const key2 = generateStableKey("p1", "b.spec.ts", ["test1"]);
    expect(key1).not.toBe(key2);
  });
});
