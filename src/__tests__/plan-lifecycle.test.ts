import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectActivePlans,
  archivePlan,
  removePlan,
  type CompletionCheck,
  type ValidationResult,
  type LifecycleResult,
} from "../plan-lifecycle.js";

vi.mock("../markdown-plan-engine.js", () => {
  const mockList = vi.fn().mockReturnValue([
    { id: "plan-1", status: "active", title: "Test Plan 1" },
    { id: "plan-2", status: "done", title: "Test Plan 2" },
    { id: "plan-3", status: "in-progress", title: "Test Plan 3" },
  ]);
  const mockUpdate = vi.fn();
  return {
    MarkdownPlanEngine: vi.fn(function () {
      return { list: mockList, updateStatus: mockUpdate };
    }),
    __mockList: mockList,
    __mockUpdate: mockUpdate,
  };
});

vi.mock("ora", () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: "",
  }),
}));

vi.mock("chalk", () => ({
  default: {
    bold: Object.assign((s: string) => s, { cyan: (s: string) => s, green: (s: string) => s, red: (s: string) => s, yellow: (s: string) => s }),
    cyan: (s: string) => s,
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    dim: (s: string) => s,
  },
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn().mockReturnValue(""),
}));

vi.mock("node:readline", () => ({
  createInterface: vi.fn().mockReturnValue({
    question: vi.fn((_q: string, cb: Function) => cb("a")),
    close: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── detectActivePlans ──────────────────────────────────────────────────────

describe("detectActivePlans", () => {
  it("returns plans that are not done", () => {
    const plans = detectActivePlans("/nexus");
    expect(plans).toHaveLength(2);
    expect(plans.map((p) => p.id)).toContain("plan-1");
    expect(plans.map((p) => p.id)).toContain("plan-3");
    expect(plans.map((p) => p.id)).not.toContain("plan-2");
  });
});

// ── archivePlan ────────────────────────────────────────────────────────────

describe("archivePlan", () => {
  it("calls updateStatus with done", async () => {
    const mod = await import("../markdown-plan-engine.js") as any;
    archivePlan("/nexus", "plan-1");
    expect(mod.__mockUpdate).toHaveBeenCalledWith("plan-1", "done");
  });
});

// ── removePlan ─────────────────────────────────────────────────────────────

describe("removePlan", () => {
  it("calls updateStatus with done", async () => {
    const mod = await import("../markdown-plan-engine.js") as any;
    removePlan("/nexus", "plan-1");
    expect(mod.__mockUpdate).toHaveBeenCalledWith("plan-1", "done");
  });
});

// ── Type exports ───────────────────────────────────────────────────────────

describe("type exports", () => {
  it("CompletionCheck type is usable", () => {
    const check: CompletionCheck = { name: "BUILD", passed: true, message: "ok" };
    expect(check.name).toBe("BUILD");
  });

  it("ValidationResult type is usable", () => {
    const result: ValidationResult = { valid: true, checks: [] };
    expect(result.valid).toBe(true);
  });

  it("LifecycleResult type is usable", () => {
    const result: LifecycleResult = { active: 1, archived: 0, removed: 0, skipped: 0 };
    expect(result.active).toBe(1);
  });
});
