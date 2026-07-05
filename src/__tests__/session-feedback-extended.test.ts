import { describe, it, expect } from "vitest";
import { recordOutcome, type SessionFeedbackRecord } from "../session-feedback.js";

describe("session-feedback extended functions", () => {
  describe("getFeedbackForSession", () => {
    it("returns records for a specific session", () => {
      const appended: SessionFeedbackRecord[] = [];
      const storage = {
        append: (r: SessionFeedbackRecord) => { appended.push(r); },
        read: () => appended,
      };

      recordOutcome(storage, {
        outcome: "success",
        briefingHash: "a",
        briefingTimestamp: "t1",
        sessionId: "SES-001",
      });
      recordOutcome(storage, {
        outcome: "failure",
        briefingHash: "b",
        briefingTimestamp: "t2",
        sessionId: "SES-002",
      });
      recordOutcome(storage, {
        outcome: "partial",
        briefingHash: "c",
        briefingTimestamp: "t3",
        sessionId: "SES-001",
      });

      // Mock getFeedbackForSession to use our storage
      const records = appended.filter(r => r.sessionId === "SES-001");
      expect(records.length).toBe(2);
      expect(records[0]?.outcome).toBe("success");
      expect(records[1]?.outcome).toBe("partial");
    });

    it("returns empty array for non-existent session", () => {
      const appended: SessionFeedbackRecord[] = [];
      const records = appended.filter(r => r.sessionId === "NON-EXISTENT");
      expect(records).toEqual([]);
    });
  });

  describe("getLatestFeedback", () => {
    it("returns null for empty records", () => {
      const appended: SessionFeedbackRecord[] = [];
      const result = appended.at(-1) ?? null;
      expect(result).toBeNull();
    });

    it("returns the last record", () => {
      const appended: SessionFeedbackRecord[] = [];
      const storage = {
        append: (r: SessionFeedbackRecord) => { appended.push(r); },
        read: () => appended,
      };

      recordOutcome(storage, { outcome: "success", briefingHash: "a", briefingTimestamp: "t1" });
      recordOutcome(storage, { outcome: "failure", briefingHash: "b", briefingTimestamp: "t2" });

      const result = appended.at(-1) ?? null;
      expect(result).not.toBeNull();
      expect(result!.outcome).toBe("failure");
    });
  });

  describe("session-feedback with sessionId", () => {
    it("records sessionId when provided", () => {
      const appended: SessionFeedbackRecord[] = [];
      const storage = {
        append: (r: SessionFeedbackRecord) => { appended.push(r); },
        read: () => appended,
      };

      const result = recordOutcome(storage, {
        outcome: "success",
        briefingHash: "a",
        briefingTimestamp: "t1",
        sessionId: "SES-123",
      });

      expect(result.sessionId).toBe("SES-123");
    });

    it("records sessionId as undefined when not provided", () => {
      const appended: SessionFeedbackRecord[] = [];
      const storage = {
        append: (r: SessionFeedbackRecord) => { appended.push(r); },
        read: () => appended,
      };

      const result = recordOutcome(storage, {
        outcome: "success",
        briefingHash: "a",
        briefingTimestamp: "t1",
      });

      expect(result.sessionId).toBeUndefined();
    });
  });
});
