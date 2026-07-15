/**
 * Tests for context-tier-detectors.ts
 *
 * Note: getRecentEvents calls readPersistedEvents 7 times (once per day).
 * The mock returns the same events for all 7 calls, so each event appears 7 times.
 * Threshold is 3 loads, so even 1 event * 7 days = 7 > 3.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let tempDir: string;

type MockEvent = { type: string; payload: Record<string, unknown>; timestamp: string };
const mockEvents: MockEvent[] = [];

const { readPersistedEventsMock } = vi.hoisted(() => ({
  readPersistedEventsMock: vi.fn((): MockEvent[] => []),
}));

vi.mock("../event-bus.js", () => ({
  readPersistedEvents: readPersistedEventsMock,
}));

vi.mock("../logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { detectMisclassifiedTier, detectTierMismatches } from "../audit/context-tier-detectors.js";

const makeEvent = (type: string, payload: Record<string, unknown>): MockEvent => ({
  type,
  payload,
  timestamp: new Date().toISOString(),
});

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "tier-detector-test-"));
  mockEvents.length = 0;
  readPersistedEventsMock.mockImplementation((): MockEvent[] => [...mockEvents]);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("detectMisclassifiedTier", () => {
  it("returns empty array when no events exist", () => {
    expect(detectMisclassifiedTier(tempDir)).toEqual([]);
  });

  it("returns empty array when no p4_loaded events exist", () => {
    mockEvents.push(makeEvent("backlog.updated", { source: "sync" }));
    expect(detectMisclassifiedTier(tempDir)).toEqual([]);
  });

  it("flags document loaded >= threshold", () => {
    // 1 event * 7 days = 7 loads > threshold of 3
    mockEvents.push(makeEvent("context.p4_loaded", { docPath: "ADR-001.md", tierDeclared: "P4" }));
    const issues = detectMisclassifiedTier(tempDir);
    expect(issues.length).toBe(1);
    expect(issues[0]!.type).toBe("tier_promotion_candidate");
    expect(issues[0]!.description).toContain("ADR-001.md");
  });

  it("flags multiple documents above threshold", () => {
    // Both docs appear 7 times (1 event * 7 days), both > threshold of 3
    mockEvents.push(makeEvent("context.p4_loaded", { docPath: "doc-a.md" }));
    mockEvents.push(makeEvent("context.p4_loaded", { docPath: "doc-b.md" }));
    const issues = detectMisclassifiedTier(tempDir);
    expect(issues.length).toBe(2);
  });

  it("handles events with missing docPath", () => {
    mockEvents.push(makeEvent("context.p4_loaded", { taskType: "on-demand" }));
    expect(detectMisclassifiedTier(tempDir)).toEqual([]);
  });
});

describe("detectTierMismatches", () => {
  it("returns empty array when no events exist", () => {
    expect(detectTierMismatches(tempDir)).toEqual([]);
  });

  it("returns empty array when no tier_mismatch events exist", () => {
    mockEvents.push(makeEvent("context.p4_loaded", { docPath: "test.md" }));
    expect(detectTierMismatches(tempDir)).toEqual([]);
  });

  it("flags documents with tier mismatches", () => {
    // 1 event * 7 days = 7 mismatches
    mockEvents.push(makeEvent("context.tier_mismatch", {
      docPath: "WORKFLOW.md",
      declaredTier: "P4",
      actualTier: "P2",
    }));
    const issues = detectTierMismatches(tempDir);
    expect(issues.length).toBe(1);
    expect(issues[0]!.type).toBe("tier_promotion_candidate");
    expect(issues[0]!.description).toContain("WORKFLOW.md");
  });

  it("handles events with missing fields", () => {
    mockEvents.push(makeEvent("context.tier_mismatch", { docPath: "test.md" }));
    expect(detectTierMismatches(tempDir)).toEqual([]);
  });

  it("detects multiple mismatches", () => {
    // 2 different docs, each appears 7 times
    mockEvents.push(makeEvent("context.tier_mismatch", { docPath: "doc-a.md", declaredTier: "P4", actualTier: "P2" }));
    mockEvents.push(makeEvent("context.tier_mismatch", { docPath: "doc-b.md", declaredTier: "P3", actualTier: "P1" }));
    const issues = detectTierMismatches(tempDir);
    expect(issues.length).toBe(2);
  });
});
