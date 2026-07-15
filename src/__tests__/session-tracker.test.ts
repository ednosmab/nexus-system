import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  startSession,
  trackCommand,
  trackFeedback,
  endSession,
  getSessions,
  getSessionMetrics,
} from "../session-tracker.js";

let tempDir: string;
let shitenDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "shiten-session-"));
  shitenDir = join(tempDir, "shitenno-go");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("Session Tracker", () => {
  it("startSession creates a session with correct shape", () => {
    const session = startSession(shitenDir);

    expect(session.id).toMatch(/^SES-\d{17}-\d{4}$/);
    expect(session.startedAt).toBeDefined();
    expect(session.commands).toEqual([]);
    expect(session.feedbackGiven).toBe(0);
    expect(session.recommendationsAccepted).toBe(0);
    expect(session.recommendationsRejected).toBe(0);
    expect(session.pathChoices).toEqual({ comfortable: 0, challenging: 0 });
    expect(session.endedAt).toBeUndefined();
    expect(session.duration).toBeUndefined();
  });

  it("startSession persists to sessions.jsonl", () => {
    const session = startSession(shitenDir);
    const content = readFileSync(join(shitenDir, "telemetry", "sessions.jsonl"), "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!).id).toBe(session.id);
  });

  it("startSession creates telemetry directory", () => {
    startSession(shitenDir);
    expect(existsSync(join(shitenDir, "telemetry"))).toBe(true);
  });

  it("trackCommand adds command to session", () => {
    const session = startSession(shitenDir);
    trackCommand(shitenDir, session.id, "report");
    trackCommand(shitenDir, session.id, "doctor");

    const sessions = getSessions(shitenDir);
    expect(sessions[0]!.commands).toEqual(["report", "doctor"]);
  });

  it("trackCommand ignores unknown session", () => {
    trackCommand(shitenDir, "SES-FAKE", "report");
    const sessions = getSessions(shitenDir);
    expect(sessions).toHaveLength(0);
  });

  it("trackFeedback increments feedback counters", () => {
    const session = startSession(shitenDir);
    trackFeedback(shitenDir, session.id, "accepted", "challenging");
    trackFeedback(shitenDir, session.id, "rejected", "comfortable");
    trackFeedback(shitenDir, session.id, "accepted", "challenging");

    const sessions = getSessions(shitenDir);
    expect(sessions[0]!.feedbackGiven).toBe(3);
    expect(sessions[0]!.recommendationsAccepted).toBe(2);
    expect(sessions[0]!.recommendationsRejected).toBe(1);
    expect(sessions[0]!.pathChoices.challenging).toBe(2);
    expect(sessions[0]!.pathChoices.comfortable).toBe(1);
  });

  it("trackFeedback ignores unknown session", () => {
    trackFeedback(shitenDir, "SES-FAKE", "accepted");
    const sessions = getSessions(shitenDir);
    expect(sessions).toHaveLength(0);
  });

  it("endSession sets endedAt and calculates duration", () => {
    const session = startSession(shitenDir);
    const ended = endSession(shitenDir, session.id);

    expect(ended).not.toBeNull();
    expect(ended!.endedAt).toBeDefined();
    expect(ended!.duration).toBeGreaterThanOrEqual(0);
  });

  it("endSession returns null for unknown session", () => {
    const result = endSession(shitenDir, "SES-FAKE");
    expect(result).toBeNull();
  });

  it("getSessions returns all sessions", () => {
    startSession(shitenDir);
    startSession(shitenDir);
    startSession(shitenDir);

    const sessions = getSessions(shitenDir);
    expect(sessions).toHaveLength(3);
  });

  it("getSessions filters by since", () => {
    startSession(shitenDir);
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const sessions = getSessions(shitenDir, { since: oldDate });
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });

  it("getSessions filters by limit", () => {
    startSession(shitenDir);
    startSession(shitenDir);
    startSession(shitenDir);

    const sessions = getSessions(shitenDir, { limit: 2 });
    expect(sessions).toHaveLength(2);
  });

  it("getSessionMetrics returns correct metrics", () => {
    const s1 = startSession(shitenDir);
    trackCommand(shitenDir, s1.id, "report");
    trackCommand(shitenDir, s1.id, "report");
    trackFeedback(shitenDir, s1.id, "accepted", "challenging");
    endSession(shitenDir, s1.id);

    const s2 = startSession(shitenDir);
    trackCommand(shitenDir, s2.id, "doctor");
    trackFeedback(shitenDir, s2.id, "rejected", "comfortable");
    endSession(shitenDir, s2.id);

    const metrics = getSessionMetrics(shitenDir);
    expect(metrics.totalSessions).toBe(2);
    expect(metrics.totalCommands).toBe(3);
    expect(metrics.commandFrequency).toEqual({ report: 2, doctor: 1 });
    expect(metrics.totalAccepts).toBe(1);
    expect(metrics.totalRejects).toBe(1);
    expect(metrics.challengingRatio).toBeCloseTo(0.5);
  });

  it("getSessionMetrics returns empty metrics for no sessions", () => {
    const metrics = getSessionMetrics(shitenDir);
    expect(metrics.totalSessions).toBe(0);
    expect(metrics.avgDuration).toBe(0);
    expect(metrics.totalCommands).toBe(0);
    expect(metrics.challengingRatio).toBe(0.5);
  });

  it("getSessionMetrics filters by days", () => {
    startSession(shitenDir);
    const metrics = getSessionMetrics(shitenDir, 1);
    expect(metrics.totalSessions).toBe(1);
  });

  it("getSessions returns empty for non-existent shiten dir", () => {
    const sessions = getSessions("/tmp/nonexistent-shiten-dir-test");
    expect(sessions).toEqual([]);
  });

  it("handles multiple sessions with interleaved commands", () => {
    const s1 = startSession(shitenDir);
    const s2 = startSession(shitenDir);
    trackCommand(shitenDir, s1.id, "report");
    trackCommand(shitenDir, s2.id, "doctor");
    trackCommand(shitenDir, s1.id, "validate");
    trackCommand(shitenDir, s2.id, "detect");

    const sessions = getSessions(shitenDir);
    expect(sessions).toHaveLength(2);
    const s1Sessions = sessions.find((s) => s.id === s1.id);
    const s2Sessions = sessions.find((s) => s.id === s2.id);
    expect(s1Sessions!.commands).toEqual(["report", "validate"]);
    expect(s2Sessions!.commands).toEqual(["doctor", "detect"]);
  });
});
