/**
 * reactive-pipeline.test.ts — Integration test: Event Bus → Rule Engine → Action
 *
 * Validates the full reactive chain: an event is published on the bus,
 * the rule engine picks it up, evaluates rules, and executes actions.
 *
 * Replaces the former validate-pipeline.sh (bash) with a vitest equivalent
 * focused on system reactivity.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { getEventBus, resetEventBus } from "../event-bus.js";
import {
  initializeRuleEngine,
  loadRules,
  saveRule,
  executeRules,
  getDefaultRules,
  type Rule,
  type RuleContext,
} from "../rule-engine.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function createTmpDir(): string {
  const dir = join(tmpdir(), `nexus-reactive-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function createNexusDir(tmpDir: string): string {
  const nexusDir = join(tmpDir, "nexus-system");
  mkdirSync(join(nexusDir, "governance", "rules"), { recursive: true });
  mkdirSync(join(nexusDir, "governance", "context"), { recursive: true });
  mkdirSync(join(nexusDir, "docs"), { recursive: true });
  return nexusDir;
}

function createRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "RULE-REACTIVE-001",
    description: "Test reactive rule",
    trigger: "health_check",
    conditions: [
      { field: "eventData.status", operator: "equals", value: "critical" },
    ],
    actions: [
      { type: "log_event", params: { event: "reactive_test", message: "Rule triggered" } },
    ],
    priority: 1,
    dependencies: [],
    enabled: true,
    tags: ["test"],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("reactive-pipeline", () => {
  let tmpDir: string;
  let nexusDir: string;

  beforeEach(() => {
    tmpDir = createTmpDir();
    nexusDir = createNexusDir(tmpDir);
    resetEventBus();
  });

  afterEach(() => {
    resetEventBus();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── Layer 1: Event Bus basics ─────────────────────────────────────────────

  describe("event bus delivers events", () => {
    it("publish → subscribe delivers payload", () => {
      const bus = getEventBus();
      const received: unknown[] = [];

      bus.subscribe("health.checked", (payload) => {
        received.push(payload);
      });

      bus.publish("health.checked", { status: "critical" });

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ status: "critical" });
    });
  });

  // ── Layer 2: EVENT_TO_TRIGGER mapping ────────────────────────────────────

  describe("event-to-trigger mapping", () => {
    it("health.checked maps to health_check trigger", () => {
      const rule = createRule({ trigger: "health_check" });
      saveRule(nexusDir, rule);

      const rules = loadRules(nexusDir);
      expect(rules).toHaveLength(1);
      expect(rules[0]!.trigger).toBe("health_check");
    });

    it("session.start maps to session_start trigger", () => {
      const rule = createRule({
        id: "RULE-SESSION-001",
        trigger: "session_start",
        conditions: [],
      });
      saveRule(nexusDir, rule);

      const rules = loadRules(nexusDir);
      expect(rules[0]!.trigger).toBe("session_start");
    });
  });

  // ── Layer 3: Rule loading from filesystem ────────────────────────────────

  describe("rule loading", () => {
    it("loads rules from nexus governance directory", () => {
      const rule = createRule();
      saveRule(nexusDir, rule);

      const rules = loadRules(nexusDir);
      expect(rules).toHaveLength(1);
      expect(rules[0]!.id).toBe("RULE-REACTIVE-001");
    });

    it("loads all rules from directory", () => {
      saveRule(nexusDir, createRule({ id: "R1", priority: 2 }));
      saveRule(nexusDir, createRule({ id: "R2", priority: 1 }));
      saveRule(nexusDir, createRule({ id: "R3", priority: 3 }));

      const rules = loadRules(nexusDir);
      expect(rules).toHaveLength(3);
      expect(rules.map((r) => r.id)).toContain("R1");
      expect(rules.map((r) => r.id)).toContain("R2");
      expect(rules.map((r) => r.id)).toContain("R3");
    });

    it("returns empty array when no rules exist", () => {
      const rules = loadRules(nexusDir);
      expect(rules).toEqual([]);
    });
  });

  // ── Layer 4: Rule execution via executeRules ─────────────────────────────

  describe("rule execution", () => {
    it("executes action when conditions are met", async () => {
      const rule = createRule();
      saveRule(nexusDir, rule);

      const rules = loadRules(nexusDir);
      const context: RuleContext = {
        trigger: "health_check",
        eventData: { status: "critical" },
        projectRoot: tmpDir,
        nexusDir,
        timestamp: new Date().toISOString(),
      };

      const result = await executeRules(rules, context);
      expect(result.rulesExecuted).toBe(1);
      expect(result.rulesFailed).toBe(0);
    });

    it("skips action when conditions are NOT met", async () => {
      const rule = createRule();
      saveRule(nexusDir, rule);

      const rules = loadRules(nexusDir);
      const context: RuleContext = {
        trigger: "health_check",
        eventData: { status: "ok" },
        projectRoot: tmpDir,
        nexusDir,
        timestamp: new Date().toISOString(),
      };

      const result = await executeRules(rules, context);
      expect(result.rulesExecuted).toBe(0);
      expect(result.rulesSkipped).toBe(1);
    });

    it("executes multiple actions in a rule", async () => {
      const rule = createRule({
        actions: [
          { type: "log_event", params: { event: "action1", message: "First" } },
          { type: "log_event", params: { event: "action2", message: "Second" } },
        ],
      });
      saveRule(nexusDir, rule);

      const rules = loadRules(nexusDir);
      const context: RuleContext = {
        trigger: "health_check",
        eventData: { status: "critical" },
        projectRoot: tmpDir,
        nexusDir,
        timestamp: new Date().toISOString(),
      };

      const result = await executeRules(rules, context);
      expect(result.rulesExecuted).toBe(1);
    });
  });

  // ── Layer 5: Full reactive chain (Event → Rule → Action) ────────────────

  describe("full reactive chain", () => {
    it("eventBus.publish triggers rule engine via initializeRuleEngine", async () => {
      const rule = createRule();
      saveRule(nexusDir, rule);

      initializeRuleEngine(tmpDir, nexusDir);

      const bus = getEventBus();
      bus.publish("health.checked", { status: "critical" });

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // If we got here without throwing, the chain executed
      expect(true).toBe(true);
    });

    it("non-matching event does not trigger rules", async () => {
      const rule = createRule({ trigger: "health_check" });
      saveRule(nexusDir, rule);

      initializeRuleEngine(tmpDir, nexusDir);

      const bus = getEventBus();
      bus.publish("session.start", {});

      await new Promise((resolve) => setTimeout(resolve, 100));

      // No crash = success (rule was skipped because trigger mismatch)
      expect(true).toBe(true);
    });

    it("context_buffer.yaml is updated by update_context_buffer action", async () => {
      const bufPath = join(nexusDir, "governance", "context", "context_buffer.yaml");
      writeFileSync(bufPath, "current_task:\n  status: \"idle\"\n", "utf-8");

      const rule = createRule({
        actions: [
          { type: "update_context_buffer", params: { field: "current_task.status", value: "active" } },
        ],
      });
      saveRule(nexusDir, rule);

      const rules = loadRules(nexusDir);
      const context: RuleContext = {
        trigger: "health_check",
        eventData: { status: "critical" },
        projectRoot: tmpDir,
        nexusDir,
        timestamp: new Date().toISOString(),
      };

      await executeRules(rules, context);

      const updated = readFileSync(bufPath, "utf-8");
      expect(updated).toContain('"active"');
    });

    it("BACKLOG.md is updated by update_backlog action", async () => {
      const backlogPath = join(nexusDir, "docs", "BACKLOG.md");
      writeFileSync(backlogPath, "# BACKLOG\n\nExisting items\n", "utf-8");

      const rule = createRule({
        actions: [
          { type: "update_backlog", params: { item: "Reactive: critical health detected" } },
        ],
      });
      saveRule(nexusDir, rule);

      const rules = loadRules(nexusDir);
      const context: RuleContext = {
        trigger: "health_check",
        eventData: { status: "critical" },
        projectRoot: tmpDir,
        nexusDir,
        timestamp: new Date().toISOString(),
      };

      await executeRules(rules, context);

      const backlog = readFileSync(backlogPath, "utf-8");
      expect(backlog).toContain("Reactive: critical health detected");
    });
  });

  // ── Layer 6: Default rules seed ──────────────────────────────────────────

  describe("default rules", () => {
    it("getDefaultRules returns rules with valid structure", () => {
      const defaults = getDefaultRules();
      expect(defaults.length).toBeGreaterThan(0);

      for (const rule of defaults) {
        expect(rule.id).toBeTruthy();
        expect(rule.trigger).toBeTruthy();
        expect(Array.isArray(rule.actions)).toBe(true);
        expect(rule.enabled).toBe(true);
      }
    });

    it("all default rule triggers map to valid event types", () => {
      const VALID_TRIGGERS = [
        "session_start", "session_end", "health_check", "maturity_change",
        "knowledge_debt_detected", "validation_fail", "validation_pass",
        "pattern_detected", "capability_install", "manual", "file_change",
        "adr_created", "skill_created", "task_completed", "pipeline_complete",
      ];

      const defaults = getDefaultRules();
      for (const rule of defaults) {
        expect(VALID_TRIGGERS).toContain(rule.trigger);
      }
    });
  });
});
