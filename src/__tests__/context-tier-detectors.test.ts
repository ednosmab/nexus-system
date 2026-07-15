/**
 * Tests for context-tier-detectors.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { EventEnvelope, ShitenEventType } from "../event-bus.js";

let tempDir: string;
let mockEventData: EventEnvelope[] = [];

const { readPersistedEventsMock } = vi.hoisted(() => {
  const readPersistedEventsMock = vi.fn((): EventEnvelope[] => []);
  return { readPersistedEventsMock };
});

vi.mock("../event-bus.js", () => ({
  readPersistedEvents: readPersistedEventsMock,
}));

vi.mock("../logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { detectMisclassifiedTier, detectTierMismatches } from "../audit/context-tier-detectors.js";

const makeEvent = (type: ShitenEventType, payload: Record<string, unknown>): EventEnvelope => ({
  type,
  payload,
  timestamp: new Date().toISOString(),
  traceId: "test-trace-id",
});

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "tier-detector-test-"));
  mockEventData = [];
  // getRecentEvents calls readPersistedEvents 7 times (once per day).
  // Use mockImplementation so each call returns the same events,
  // but we control the exact count via mockEventData length.
  readPersistedEventsMock.mockImplementation((): EventEnvelope[] => [...mockEventData]);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("detectMisclassifiedTier", () => {
  it("returns empty array when no events exist", () => {
    expect(detectMisclassifiedTier(tempDir)).toEqual([]);
  });

  it("returns empty array when no p4_loaded events exist", () => {
    mockEventData = [makeEvent("backlog.updated", { source: "sync" })];
    expect(detectMisclassifiedTier(tempDir)).toEqual([]);
  });

  it("flags document loaded >= threshold (3 times)", () => {
    // Provide exactly 3 p4_loaded events for the same doc
    mockEventData = [
      makeEvent("context.p4_loaded", { docPath: "ADR-001.md", tierDeclared: "P4" }),
      makeEvent("context.p4_loaded", { docPath: "ADR-001.md", tierDeclared: "P4" }),
      makeEvent("context.p4_loaded", { docPath: "ADR-001.md", tierDeclared: "P4" }),
    ];
    const issues = detectMisclassifiedTier(tempDir);
    expect(issues.length).toBe(1);
    expect(issues[0]!.type).toBe("tier_promotion_candidate");
    expect(issues[0]!.description).toContain("ADR-001.md");
  });

  it("does not flag when fewer than threshold", () => {
    mockEventData = [
      makeEvent("context.p4_loaded", { docPath: "ADR-002.md" }),
      makeEvent("context.p4_loaded", { docPath: "ADR-002.md" }),
    ];
    expect(detectMisclassifiedTier(tempDir)).toEqual([]);
  });

  it("handles events with missing docPath", () => {
    mockEventData = [
      makeEvent("context.p4_loaded", { taskType: "on-demand" }),
    ];
    expect(detectMisclassifiedTier(tempDir)).toEqual([]);
  });

  it("groups events by document path", () => {
    // Both docs exceed threshold after 7-day loop (2*7=14, 5*7=35, threshold=3)
    mockEventData = [
      makeEvent("context.p4_loaded", { docPath: "doc-a.md" }),
      makeEvent("context.p4_loaded", { docPath: "doc-a.md" }),
      makeEvent("context.p4_loaded", { docPath: "doc-b.md" }),
      makeEvent("context.p4_loaded", { docPath: "doc-b.md" }),
      makeEvent("context.p4_loaded", { docPath: "doc-b.md" }),
      makeEvent("context.p4_loaded", { docPath: "doc-b.md" }),
      makeEvent("context.p4_loaded", { docPath: "doc-b.md" }),
    ];
    const issues = detectMisclassifiedTier(tempDir);
    expect(issues.length).toBe(2);
    const docs = issues.map(i => i.description);
    expect(docs.some(d => d.includes("doc-a.md"))).toBe(true);
    expect(docs.some(d => d.includes("doc-b.md"))).toBe(true);
  });
});

describe("detectTierMismatches", () => {
  it("returns empty array when no events exist", () => {
    expect(detectTierMismatches(tempDir)).toEqual([]);
  });

  it("returns empty array when no tier_mismatch events exist", () => {
    mockEventData = [makeEvent("context.p4_loaded", { docPath: "test.md" })];
    expect(detectTierMismatches(tempDir)).toEqual([]);
  });

  it("flags documents with tier mismatches", () => {
    mockEventData = [
      makeEvent("context.tier_mismatch", { docPath: "WORKFLOW.md", declaredTier: "P4", actualTier: "P2" }),
    ];
    const issues = detectTierMismatches(tempDir);
    expect(issues.length).toBe(1);
    expect(issues[0]!.type).toBe("tier_promotion_candidate");
    expect(issues[0]!.description).toContain("WORKFLOW.md");
  });

  it("handles events with missing fields", () => {
    mockEventData = [
      makeEvent("context.tier_mismatch", { docPath: "test.md" }),
    ];
    expect(detectTierMismatches(tempDir)).toEqual([]);
  });

  it("detects multiple mismatches", () => {
    mockEventData = [
      makeEvent("context.tier_mismatch", { docPath: "doc-a.md", declaredTier: "P4", actualTier: "P2" }),
      makeEvent("context.tier_mismatch", { docPath: "doc-b.md", declaredTier: "P3", actualTier: "P1" }),
    ];
    const issues = detectTierMismatches(tempDir);
    expect(issues.length).toBe(2);
  });
});
