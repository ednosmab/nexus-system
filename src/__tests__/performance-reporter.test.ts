import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  generatePerformanceReport,
  writePerformanceReport,
} from "../performance-reporter.js";
import { recordDimensionFeedback } from "../feedback-loops.js";
import { startSession, trackCommand, trackFeedback, endSession } from "../session-tracker.js";

let tempDir: string;
let nexusDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "nexus-perf-"));
  nexusDir = join(tempDir, "nexus-system");
  mkdirSync(nexusDir, { recursive: true });
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("Performance Reporter", () => {
  const defaultContext = {
    maturityScore: 50,
    installedCapabilities: ["core"],
    knowledgeDebt: 5,
  };

  function seedDimensionData() {
    const dims = [
      "decision_making",
      "architectural_vision",
      "prompt_quality",
      "scope_management",
      "risk_management",
      "technical_communication",
      "sustainable_velocity",
    ] as const;

    for (const dim of dims) {
      for (let i = 0; i < 3; i++) {
        recordDimensionFeedback(nexusDir, {
          recommendationId: `EVO-${dim.toUpperCase()}-${i}`,
          action: i < 2 ? "accepted" : "rejected",
          context: defaultContext,
          dimension: dim,
          evidence: `Evidence for ${dim} #${i}`,
        });
      }
    }
  }

  function seedSessionData() {
    const s1 = startSession(nexusDir);
    trackCommand(nexusDir, s1.id, "report");
    trackCommand(nexusDir, s1.id, "doctor");
    trackFeedback(nexusDir, s1.id, "accepted", "challenging");
    trackFeedback(nexusDir, s1.id, "accepted", "challenging");
    endSession(nexusDir, s1.id);

    const s2 = startSession(nexusDir);
    trackCommand(nexusDir, s2.id, "detect");
    trackFeedback(nexusDir, s2.id, "rejected", "comfortable");
    endSession(nexusDir, s2.id);
  }

  function seedGrowthProfile() {
    const now = new Date().toISOString();
    const profilePath = join(nexusDir, "growth-profile.json");
    writeFileSync(profilePath, JSON.stringify({
      projectId: "test",
      createdAt: now,
      updatedAt: now,
      challengeLevel: 0.6,
      growthCapacity: 0.7,
      pathHistory: [],
      patterns: [{ type: "prefers_growth", confidence: 0.7, description: "Growth-oriented" }],
    }), "utf-8");
  }

  function seedTrends() {
    const telemetryDir = join(nexusDir, "telemetry");
    mkdirSync(telemetryDir, { recursive: true });
    writeFileSync(join(telemetryDir, "maturity-current.json"), JSON.stringify(65), "utf-8");
    writeFileSync(join(telemetryDir, "maturity-previous.json"), JSON.stringify(55), "utf-8");
    writeFileSync(join(telemetryDir, "debt-current.json"), JSON.stringify(30), "utf-8");
    writeFileSync(join(telemetryDir, "debt-previous.json"), JSON.stringify(45), "utf-8");
  }

  it("generatePerformanceReport returns correct shape", () => {
    seedDimensionData();
    seedSessionData();
    seedGrowthProfile();
    seedTrends();

    const report = generatePerformanceReport(tempDir, nexusDir, { days: 30 });

    expect(report.period).toBeDefined();
    expect(report.period.days).toBe(30);
    expect(report.period.from).toBeDefined();
    expect(report.period.to).toBeDefined();

    expect(report.profile).toBeDefined();
    expect(report.profile.dominantDimension).toBeDefined();
    expect(report.profile.weakestDimension).toBeDefined();
    expect(report.profile.growthPattern).toBeDefined();
    expect(typeof report.profile.growthCapacity).toBe("number");
    expect(typeof report.profile.challengeLevel).toBe("number");

    expect(report.dimensions).toBeDefined();
    expect(Object.keys(report.dimensions)).toHaveLength(7);

    expect(report.sessions).toBeDefined();
    expect(typeof report.sessions.total).toBe("number");
    expect(typeof report.sessions.avgDuration).toBe("number");

    expect(report.feedback).toBeDefined();
    expect(typeof report.feedback.totalInteractions).toBe("number");
    expect(typeof report.feedback.acceptanceRate).toBe("number");

    expect(report.debtTrend).toBeDefined();
    expect(typeof report.debtTrend.delta).toBe("number");
    expect(report.maturityTrend).toBeDefined();
    expect(typeof report.maturityTrend.delta).toBe("number");

    expect(Array.isArray(report.insights)).toBe(true);
    expect(Array.isArray(report.nextSteps)).toBe(true);
    expect(typeof report.summary).toBe("string");
  });

  it("generatePerformanceReport uses correct period days", () => {
    seedDimensionData();
    seedGrowthProfile();

    const report = generatePerformanceReport(tempDir, nexusDir, { days: 7 });
    expect(report.period.days).toBe(7);
  });

  it("generatePerformanceReport defaults to 30 days", () => {
    seedGrowthProfile();
    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.period.days).toBe(30);
  });

  it("generatePerformanceReport reflects session metrics", () => {
    seedDimensionData();
    seedSessionData();
    seedGrowthProfile();

    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.sessions.total).toBe(2);
    expect(report.sessions.commandFrequency.report).toBe(1);
    expect(report.sessions.commandFrequency.doctor).toBe(1);
    expect(report.sessions.commandFrequency.detect).toBe(1);
  });

  it("generatePerformanceReport reflects feedback metrics", () => {
    seedDimensionData();
    seedSessionData();
    seedGrowthProfile();

    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.feedback.totalInteractions).toBeGreaterThanOrEqual(7);
  });

  it("generatePerformanceReport reads debt trend from telemetry", () => {
    seedDimensionData();
    seedGrowthProfile();
    seedTrends();

    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.debtTrend.current).toBe(30);
    expect(report.debtTrend.previous).toBe(45);
    expect(report.debtTrend.delta).toBe(-15);
  });

  it("generatePerformanceReport reads maturity trend from telemetry", () => {
    seedDimensionData();
    seedGrowthProfile();
    seedTrends();

    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.maturityTrend.current).toBe(65);
    expect(report.maturityTrend.previous).toBe(55);
    expect(report.maturityTrend.delta).toBe(10);
  });

  it("generatePerformanceReport defaults when no telemetry files exist", () => {
    seedGrowthProfile();
    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.debtTrend.current).toBe(100);
    expect(report.debtTrend.previous).toBe(100);
    expect(report.maturityTrend.current).toBe(0);
    expect(report.maturityTrend.previous).toBe(0);
  });

  it("generatePerformanceReport generates insights for strength and weakness", () => {
    seedDimensionData();
    seedGrowthProfile();

    const report = generatePerformanceReport(tempDir, nexusDir);
    const strengths = report.insights.filter((i) => i.type === "strength");
    const improvements = report.insights.filter((i) => i.type === "improvement");
    expect(strengths.length).toBeGreaterThanOrEqual(1);
    expect(improvements.length).toBeGreaterThanOrEqual(1);
  });

  it("generatePerformanceReport generates debt insight when delta > 10", () => {
    seedDimensionData();
    seedGrowthProfile();
    const telemetryDir = join(nexusDir, "telemetry");
    mkdirSync(telemetryDir, { recursive: true });
    writeFileSync(join(telemetryDir, "debt-current.json"), JSON.stringify(80), "utf-8");
    writeFileSync(join(telemetryDir, "debt-previous.json"), JSON.stringify(50), "utf-8");

    const report = generatePerformanceReport(tempDir, nexusDir);
    const debtInsight = report.insights.find(
      (i) => i.dimension === "architectural_vision" && i.type === "improvement"
    );
    expect(debtInsight).toBeDefined();
  });

  it("generatePerformanceReport generates maturity insight when delta > 5", () => {
    seedDimensionData();
    seedGrowthProfile();
    const telemetryDir = join(nexusDir, "telemetry");
    mkdirSync(telemetryDir, { recursive: true });
    writeFileSync(join(telemetryDir, "maturity-current.json"), JSON.stringify(70), "utf-8");
    writeFileSync(join(telemetryDir, "maturity-previous.json"), JSON.stringify(55), "utf-8");

    const report = generatePerformanceReport(tempDir, nexusDir);
    const maturityInsight = report.insights.find(
      (i) => i.dimension === "scope_management" && i.type === "strength"
    );
    expect(maturityInsight).toBeDefined();
  });

  it("generatePerformanceReport includes at least one next step", () => {
    seedDimensionData();
    seedGrowthProfile();

    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.nextSteps.length).toBeGreaterThanOrEqual(1);
    expect(report.nextSteps.length).toBeLessThanOrEqual(5);
  });

  it("generatePerformanceReport generates summary string", () => {
    seedDimensionData();
    seedGrowthProfile();

    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.summary).toContain("Score médio");
    expect(report.summary).toContain("sessões");
    expect(report.summary).toContain("interações");
  });

  it("writePerformanceReport creates file", () => {
    seedDimensionData();
    seedGrowthProfile();
    const report = generatePerformanceReport(tempDir, nexusDir);
    const filename = writePerformanceReport(nexusDir, report);

    expect(filename).toBeDefined();
    expect(filename).toMatch(/performance-\d{4}-\d{2}-\d{2}\.json/);
  });

  it("writePerformanceReport returns null on error", () => {
    const report = generatePerformanceReport(tempDir, nexusDir);
    const result = writePerformanceReport("/dev/null", report);
    expect(result).toBeNull();
  });

  it("generatePerformanceReport handles empty data gracefully", () => {
    seedGrowthProfile();
    const report = generatePerformanceReport(tempDir, nexusDir);

    expect(report.period).toBeDefined();
    expect(report.dimensions).toBeDefined();
    expect(report.feedback.totalInteractions).toBe(0);
    expect(report.feedback.acceptanceRate).toBe(0);
    expect(report.sessions.total).toBe(0);
  });

  it("generatePerformanceReport respects growth profile pattern", () => {
    seedDimensionData();
    const now = new Date().toISOString();
    const profilePath = join(nexusDir, "growth-profile.json");
    writeFileSync(profilePath, JSON.stringify({
      projectId: "test",
      createdAt: now,
      updatedAt: now,
      challengeLevel: 0.3,
      growthCapacity: 0.5,
      pathHistory: [],
      patterns: [{ type: "prefers_comfort", confidence: 0.8, description: "Comfort-oriented" }],
    }), "utf-8");

    const report = generatePerformanceReport(tempDir, nexusDir);
    expect(report.profile.growthPattern).toBe("prefers_comfort");

    const patternInsight = report.insights.find((i) => i.type === "pattern");
    expect(patternInsight).toBeDefined();
  });

  it("dimensions all have valid score range", () => {
    seedDimensionData();
    seedGrowthProfile();

    const report = generatePerformanceReport(tempDir, nexusDir);
    for (const [dim, data] of Object.entries(report.dimensions)) {
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(100);
      expect(["improving", "stable", "declining"]).toContain(data.trend);
      expect(typeof data.acceptRate).toBe("number");
    }
  });
});
