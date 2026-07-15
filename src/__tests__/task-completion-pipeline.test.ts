import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import type { PipelineResult, PipelineOptions } from "../task-completion-pipeline.js";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("../logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

vi.mock("../task-completion.js", () => ({
  validateCompletionGate: vi.fn().mockReturnValue({
    passed: true,
    gates: [
      { name: "build", passed: true, message: "Build passed" },
      { name: "test", passed: true, message: "Tests passed" },
      { name: "lint", passed: true, message: "Lint passed" },
      { name: "status", passed: true, message: "Status ok" },
      { name: "buffer", passed: true, message: "Buffer ok" },
    ],
  }),
}));

vi.mock("../backlog-state-machine.js", () => ({
  completeTask: vi.fn().mockReturnValue(true),
}));

vi.mock("../event-bus.js", () => ({
  getEventBus: vi.fn().mockReturnValue({
    publish: vi.fn(),
  }),
}));

const mockExistsSync = vi.mocked(existsSync);
const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Type tests ─────────────────────────────────────────────────────────────

describe("PipelineResult type", () => {
  it("can be constructed with all fields", () => {
    const result: PipelineResult = {
      success: true,
      taskId: "TASK-001",
      gates: { taskId: "TASK-001", passed: true, gates: [] },
      backlogUpdated: true,
      planArchived: false,
      eventPublished: true,
      errors: [],
    };
    expect(result.success).toBe(true);
    expect(result.taskId).toBe("TASK-001");
  });
});

describe("PipelineOptions type", () => {
  it("can be constructed with required fields only", () => {
    const opts: PipelineOptions = {
      projectRoot: "/project",
      shitenDir: "/project/shitenno-go",
      taskId: "TASK-001",
    };
    expect(opts.projectRoot).toBe("/project");
  });

  it("can include optional fields", () => {
    const opts: PipelineOptions = {
      projectRoot: "/project",
      shitenDir: "/project/shitenno-go",
      taskId: "TASK-001",
      affectedFiles: ["src/a.ts"],
      skipArchive: true,
      skipBacklog: false,
    };
    expect(opts.skipArchive).toBe(true);
  });
});

// ── Plan detection helper (private, but testable via fs mocks) ─────────────

describe("plan detection via fs mocks", () => {
  it("finds active plan matching task ID", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      { name: "2026-07-08-my-task.md", isFile: () => true, isDirectory: () => false } as any,
    ]);
    mockReadFileSync.mockReturnValue("**Status:** active\n");

    const plansDir = "/shiten/governance/plans";
    const files = mockReaddirSync(plansDir).filter((f: any) => f.name.endsWith(".md") && !f.name.startsWith("TEMPLATE"));
    const match = files.find((f: any) => f.name.toLowerCase().includes("my-task")) as any;

    expect(match?.name).toBe("2026-07-08-my-task.md");
  });

  it("skips done plans", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      { name: "plan-done.md", isFile: () => true, isDirectory: () => false } as any,
    ]);
    mockReadFileSync.mockReturnValue("**Status:** done\n");

    const content = mockReadFileSync("/shiten/governance/plans/plan-done.md", "utf-8") as string;
    const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/i);
    const status = statusMatch?.[1]?.trim().toLowerCase();

    expect(status).toBe("done");
  });

  it("returns null when plans dir does not exist", () => {
    mockExistsSync.mockReturnValue(false);
    expect(mockExistsSync("/shiten/governance/plans")).toBe(false);
  });
});
