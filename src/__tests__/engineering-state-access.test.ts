/**
 * engineering-state-access.test.ts — Tests for engineering state access
 *
 * Validates caching and single-point-of-access guarantee.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getEngineeringState, clearEngineeringStateCache } from "../engineering-state-access.js";

describe("engineering-state-access", () => {
  let tmpDir: string;

  beforeEach(() => {
    clearEngineeringStateCache();
    tmpDir = join(tmpdir(), `nexus-access-${Date.now()}`);
    mkdirSync(join(tmpDir, "nexus-system"), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("clearEngineeringStateCache resets cache", () => {
    clearEngineeringStateCache();
    expect(() => clearEngineeringStateCache()).not.toThrow();
  });

  it("getEngineeringState returns an object with expected properties", () => {
    const state = getEngineeringState(tmpDir, join(tmpDir, "nexus-system"), true);
    expect(state).toBeDefined();
    expect(state).toHaveProperty("consolidatedAt");
    expect(state).toHaveProperty("healthScores");
    expect(state).toHaveProperty("entropy");
  });

  it("returns same reference when called twice without forceRefresh", () => {
    const state1 = getEngineeringState(tmpDir, join(tmpDir, "nexus-system"), false);
    const state2 = getEngineeringState(tmpDir, join(tmpDir, "nexus-system"), false);
    expect(state1).toBe(state2);
  });

  it("returns fresh state when forceRefresh=true", () => {
    const state1 = getEngineeringState(tmpDir, join(tmpDir, "nexus-system"), false);
    clearEngineeringStateCache();
    const state2 = getEngineeringState(tmpDir, join(tmpDir, "nexus-system"), true);
    expect(state1).not.toBe(state2);
  });
});
