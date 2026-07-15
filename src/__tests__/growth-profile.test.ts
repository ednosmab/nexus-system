import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadGrowthProfile,
  saveGrowthProfile,
  recordPathChoice,
  calculateGrowthCapacity,
  calculateChallengeLevel,
  detectGrowthPatterns,
} from "../growth-profile.js";

let tempDir: string;
let shitenDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "shiten-growth-"));
  shitenDir = join(tempDir, "shitenno-go");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("Growth Profile", () => {
  const defaultContext = {
    command: "evolve",
    recommendationType: "capability_install",
    maturityScore: 50,
  };

  describe("loadGrowthProfile", () => {
    it("returns default profile when no file exists", () => {
      const profile = loadGrowthProfile(shitenDir);
      expect(profile).toBeDefined();
      expect(profile.growthCapacity).toBe(0.3);
      expect(profile.challengeLevel).toBe(0.36);
      expect(profile.pathHistory).toHaveLength(0);
      expect(profile.patterns).toHaveLength(1);
      expect(profile.patterns[0]!.type).toBe("balanced");
    });

    it("loads existing profile from disk", () => {
      const profile = loadGrowthProfile(shitenDir);
      profile.growthCapacity = 0.7;
      saveGrowthProfile(shitenDir, profile);

      const loaded = loadGrowthProfile(shitenDir);
      expect(loaded.growthCapacity).toBe(0.7);
    });

    it("returns default profile for corrupted file", () => {
      mkdirSync(shitenDir, { recursive: true });
      writeFileSync(join(shitenDir, "growth-profile.json"), "{ invalid json");

      const profile = loadGrowthProfile(shitenDir);
      expect(profile.growthCapacity).toBe(0.3);
    });
  });

  describe("saveGrowthProfile", () => {
    it("creates file on disk", () => {
      const profile = loadGrowthProfile(shitenDir);
      saveGrowthProfile(shitenDir, profile);

      expect(existsSync(join(shitenDir, "growth-profile.json"))).toBe(true);
    });

    it("preserves all fields", () => {
      const profile = loadGrowthProfile(shitenDir);
      profile.growthCapacity = 0.8;
      profile.challengeLevel = 0.65;
      profile.projectId = "test-project";
      saveGrowthProfile(shitenDir, profile);

      const content = JSON.parse(readFileSync(join(shitenDir, "growth-profile.json"), "utf-8"));
      expect(content.growthCapacity).toBe(0.8);
      expect(content.challengeLevel).toBe(0.65);
      expect(content.projectId).toBe("test-project");
    });

    it("creates directory if it does not exist", () => {
      const newShitenDir = join(tempDir, "new-shiten");
      const profile = loadGrowthProfile(newShitenDir, "test");
      saveGrowthProfile(newShitenDir, profile);

      expect(existsSync(join(newShitenDir, "growth-profile.json"))).toBe(true);
    });
  });

  describe("recordPathChoice", () => {
    it("records a comfortable choice", () => {
      const profile = recordPathChoice(shitenDir, {
        pathChosen: "comfortable",
        context: defaultContext,
      });

      expect(profile.pathHistory).toHaveLength(1);
      expect(profile.pathHistory[0]!.pathChosen).toBe("comfortable");
      expect(profile.pathHistory[0]!.id).toBeDefined();
      expect(profile.pathHistory[0]!.timestamp).toBeDefined();
    });

    it("records a challenging choice", () => {
      const profile = recordPathChoice(shitenDir, {
        pathChosen: "challenging",
        context: defaultContext,
      });

      expect(profile.pathHistory).toHaveLength(1);
      expect(profile.pathHistory[0]!.pathChosen).toBe("challenging");
    });

    it("accumulates choices over time", () => {
      recordPathChoice(shitenDir, { pathChosen: "comfortable", context: defaultContext });
      recordPathChoice(shitenDir, { pathChosen: "challenging", context: defaultContext });
      const profile = recordPathChoice(shitenDir, { pathChosen: "comfortable", context: defaultContext });

      expect(profile.pathHistory).toHaveLength(3);
    });

    it("updates growth capacity after each choice", () => {
      // Start with some comfortable choices to lower capacity
      recordPathChoice(shitenDir, { pathChosen: "comfortable", context: defaultContext });
      recordPathChoice(shitenDir, { pathChosen: "comfortable", context: defaultContext });
      let profile = recordPathChoice(shitenDir, { pathChosen: "comfortable", context: defaultContext });
      const afterComfort = profile.growthCapacity;

      // Now add challenging choices to increase capacity
      profile = recordPathChoice(shitenDir, { pathChosen: "challenging", context: defaultContext });
      const afterChallenging = profile.growthCapacity;

      expect(afterChallenging).toBeGreaterThan(afterComfort);
    });

    it("persists to disk", () => {
      recordPathChoice(shitenDir, { pathChosen: "comfortable", context: defaultContext });
      const loaded = loadGrowthProfile(shitenDir);

      expect(loaded.pathHistory).toHaveLength(1);
    });
  });

  describe("calculateGrowthCapacity", () => {
    it("returns default for empty history", () => {
      const profile = loadGrowthProfile(shitenDir);
      expect(calculateGrowthCapacity(profile)).toBe(0.3);
    });

    it("increases with challenging choices", () => {
      const profile = loadGrowthProfile(shitenDir);
      for (let i = 0; i < 5; i++) {
        profile.pathHistory.push({
          id: `test-${i}`,
          timestamp: new Date().toISOString(),
          pathChosen: "challenging",
          context: defaultContext,
        });
      }

      const capacity = calculateGrowthCapacity(profile);
      expect(capacity).toBeGreaterThan(0.3);
    });

    it("decreases with comfortable choices", () => {
      const profile = loadGrowthProfile(shitenDir);
      for (let i = 0; i < 5; i++) {
        profile.pathHistory.push({
          id: `test-${i}`,
          timestamp: new Date().toISOString(),
          pathChosen: "comfortable",
          context: defaultContext,
        });
      }

      const capacity = calculateGrowthCapacity(profile);
      expect(capacity).toBeLessThan(0.3);
    });

    it("clamps to 0-1 range", () => {
      const profile = loadGrowthProfile(shitenDir);
      for (let i = 0; i < 50; i++) {
        profile.pathHistory.push({
          id: `test-${i}`,
          timestamp: new Date().toISOString(),
          pathChosen: "challenging",
          context: defaultContext,
        });
      }

      const capacity = calculateGrowthCapacity(profile);
      expect(capacity).toBeGreaterThanOrEqual(0);
      expect(capacity).toBeLessThanOrEqual(1);
    });
  });

  describe("calculateChallengeLevel", () => {
    it("returns value above 0 for default profile", () => {
      const profile = loadGrowthProfile(shitenDir);
      const level = calculateChallengeLevel(profile);
      expect(level).toBeGreaterThan(0);
      expect(level).toBeLessThanOrEqual(1);
    });

    it("increases with growth capacity", () => {
      const profile = loadGrowthProfile(shitenDir);
      profile.growthCapacity = 0.8;
      const level = calculateChallengeLevel(profile);

      expect(level).toBeGreaterThan(0.5);
    });

    it("clamps to 0-1 range", () => {
      const profile = loadGrowthProfile(shitenDir);
      profile.growthCapacity = 1.0;
      const level = calculateChallengeLevel(profile);
      expect(level).toBeLessThanOrEqual(1);
    });
  });

  describe("detectGrowthPatterns", () => {
    it("returns balanced pattern for empty history", () => {
      const profile = loadGrowthProfile(shitenDir);
      const patterns = detectGrowthPatterns(profile);

      expect(patterns).toHaveLength(1);
      expect(patterns[0]!.type).toBe("balanced");
    });

    it("detects prefers_growth pattern", () => {
      const profile = loadGrowthProfile(shitenDir);
      for (let i = 0; i < 8; i++) {
        profile.pathHistory.push({
          id: `test-${i}`,
          timestamp: new Date().toISOString(),
          pathChosen: "challenging",
          context: defaultContext,
        });
      }

      const patterns = detectGrowthPatterns(profile);
      const growthPattern = patterns.find((p) => p.type === "prefers_growth");
      expect(growthPattern).toBeDefined();
    });

    it("detects prefers_comfort pattern", () => {
      const profile = loadGrowthProfile(shitenDir);
      for (let i = 0; i < 8; i++) {
        profile.pathHistory.push({
          id: `test-${i}`,
          timestamp: new Date().toISOString(),
          pathChosen: "comfortable",
          context: defaultContext,
        });
      }

      const patterns = detectGrowthPatterns(profile);
      const comfortPattern = patterns.find((p) => p.type === "prefers_comfort");
      expect(comfortPattern).toBeDefined();
    });

    it("detects balanced pattern", () => {
      const profile = loadGrowthProfile(shitenDir);
      for (let i = 0; i < 10; i++) {
        profile.pathHistory.push({
          id: `test-${i}`,
          timestamp: new Date().toISOString(),
          pathChosen: i % 2 === 0 ? "challenging" : "comfortable",
          context: defaultContext,
        });
      }

      const patterns = detectGrowthPatterns(profile);
      const balanced = patterns.find((p) => p.type === "balanced");
      expect(balanced).toBeDefined();
    });
  });
});
