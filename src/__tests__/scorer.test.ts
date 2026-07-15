import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { calculateComplexityScore, writeComplexityReport } from "../scorer.js";
import type { ProjectAnalysis } from "../analyser.js";

let tempDir: string;
let shitenDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "shiten-scorer-"));
  shitenDir = join(tempDir, "shitenno-go");
  mkdirSync(shitenDir, { recursive: true });
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function makeAnalysis(overrides: Partial<ProjectAnalysis> = {}): ProjectAnalysis {
  return {
    rootDir: tempDir,
    hasGit: false,
    hasPackageJson: false,
    hasShiten: false,
    stack: [],
    packageManager: "unknown",
    monorepo: false,
    packageCount: 0,
    appCount: 0,
    dependencyCount: 0,
    sourceFileCount: 0,
    hasTests: false,
    hasLinter: false,
    hasCI: false,
    hasTypeScript: false,
    totalCommits: 0,
    ...overrides,
  };
}

// ── calculateComplexityScore ─────────────────────────────────────────────────

describe("calculateComplexityScore", () => {
  it("returns junior level for empty project", async () => {
    const report = await calculateComplexityScore(tempDir, shitenDir, makeAnalysis());
    expect(report.level).toBe("junior");
    expect(report.score).toBe(0);
    expect(report.staticMetrics.length).toBeGreaterThan(0);
    expect(report.behavioralMetrics).toHaveLength(0);
    expect(report.areaScores).toHaveLength(0);
  });

  it("returns pleno level for medium complexity", async () => {
    const analysis = makeAnalysis({
      packageCount: 4,
      appCount: 2,
      sourceFileCount: 200,
      dependencyCount: 80,
    });
    const report = await calculateComplexityScore(tempDir, shitenDir, analysis);
    expect(report.score).toBeGreaterThanOrEqual(5);
    expect(report.level).toBe("pleno");
  });

  it("returns senior level for high complexity", async () => {
    mkdirSync(join(shitenDir, "docs", "adrs"), { recursive: true });
    mkdirSync(join(shitenDir, "docs", "history"), { recursive: true });
    writeFileSync(join(shitenDir, "docs", "adrs", "ADR-001.md"), "# ADR-001");
    writeFileSync(join(shitenDir, "docs", "adrs", "ADR-002.md"), "# ADR-002");
    writeFileSync(join(shitenDir, "docs", "adrs", "ADR-003.md"), "# ADR-003");

    const analysis = makeAnalysis({
      packageCount: 6,
      appCount: 3,
      sourceFileCount: 400,
      dependencyCount: 120,
      monorepo: true,
    });
    const report = await calculateComplexityScore(tempDir, shitenDir, analysis);
    expect(report.score).toBeGreaterThanOrEqual(10);
    expect(report.level).toBe("senior");
  });

  it("includes computedAt timestamp", async () => {
    const report = await calculateComplexityScore(tempDir, shitenDir, makeAnalysis());
    expect(report.computedAt).toBeTruthy();
    expect(new Date(report.computedAt).getTime()).toBeGreaterThan(0);
  });

  it("populates staticMetrics with evidence", async () => {
    const report = await calculateComplexityScore(
      tempDir,
      shitenDir,
      makeAnalysis({ packageCount: 1 })
    );
    expect(report.staticMetrics.length).toBeGreaterThan(0);
    for (const m of report.staticMetrics) {
      expect(m.evidence).toBeTruthy();
    }
  });
});

// ── writeComplexityReport ────────────────────────────────────────────────────

describe("writeComplexityReport", () => {
  it("returns null when reports/ doesn't exist", async () => {
    const report = await calculateComplexityScore(tempDir, shitenDir, makeAnalysis());
    const result = writeComplexityReport(tempDir, shitenDir, report);
    expect(result).toBeNull();
  });

  it("writes JSON report when reports/ exists", async () => {
    mkdirSync(join(shitenDir, "reports"), { recursive: true });
    const report = await calculateComplexityScore(tempDir, shitenDir, makeAnalysis());
    const filename = writeComplexityReport(tempDir, shitenDir, report);

    expect(filename).toBeTruthy();
    expect(filename).toMatch(/^complexity-.*\.json$/);

    // Verify the file was written
    const reports = readdirSync(join(shitenDir, "reports")).filter((f: string) =>
      f.startsWith("complexity-")
    );
    expect(reports.length).toBe(1);
  });

  it("increments session number on multiple writes", async () => {
    mkdirSync(join(shitenDir, "reports"), { recursive: true });
    const report = await calculateComplexityScore(tempDir, shitenDir, makeAnalysis());

    const f1 = writeComplexityReport(tempDir, shitenDir, report);
    const f2 = writeComplexityReport(tempDir, shitenDir, report);

    expect(f1).toContain("session1");
    expect(f2).toContain("session2");
  });
});
