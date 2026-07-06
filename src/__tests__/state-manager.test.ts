/**
 * state-manager.test.ts — Tests for State Manager
 *
 * Validates knowledge state reading, project state reading,
 * session memory reading, and state consolidation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import {
  readKnowledgeState,
  readProjectState,
  readSessionMemory,
  consolidateState,
  stateToText,
} from "../state-manager.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function createTmpDir(): string {
  const dir = join(tmpdir(), `nexus-state-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function createNexusDir(tmpDir: string): string {
  const nexusDir = join(tmpDir, "nexus-system");
  mkdirSync(join(nexusDir, "docs", "adrs"), { recursive: true });
  mkdirSync(join(nexusDir, "docs", "skills"), { recursive: true });
  mkdirSync(join(nexusDir, "governance", "agents"), { recursive: true });
  mkdirSync(join(nexusDir, "governance", "context"), { recursive: true });
  mkdirSync(join(nexusDir, "scripts"), { recursive: true });
  mkdirSync(join(nexusDir, "docs", "runbooks"), { recursive: true });
  mkdirSync(join(nexusDir, "reports"), { recursive: true });
  return nexusDir;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("state-manager", () => {
  let tmpDir: string;
  let nexusDir: string;

  beforeEach(() => {
    tmpDir = createTmpDir();
    nexusDir = createNexusDir(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("readKnowledgeState", () => {
    it("returns empty state when nexus dir is empty", () => {
      const state = readKnowledgeState(nexusDir);
      expect(state.adrs).toEqual([]);
      expect(state.skills).toEqual([]);
      expect(state.contracts).toEqual([]);
      expect(state.governanceDocs).toEqual([]);
      expect(state.scripts).toEqual([]);
      expect(state.runbooks).toEqual([]);
    });

    it("reads ADRs from docs/adrs", () => {
      writeFileSync(join(nexusDir, "docs", "adrs", "ADR-001.md"), "# ADR 001\n\nEstado: accepted");
      writeFileSync(join(nexusDir, "docs", "adrs", "ADR-002.md"), "# ADR 002\n\nStatus: draft");
      const state = readKnowledgeState(nexusDir);
      expect(state.adrs).toHaveLength(2);
      if (state.adrs[0]) {
        expect(state.adrs[0].status).toBe("accepted");
      }
      if (state.adrs[1]) {
        expect(state.adrs[1].status).toBe("draft");
      }
    });

    it("reads skills from docs/skills", () => {
      writeFileSync(join(nexusDir, "docs", "skills", "my-skill.md"), "# My Skill");
      const state = readKnowledgeState(nexusDir);
      expect(state.skills).toHaveLength(1);
      if (state.skills[0]) {
        expect(state.skills[0].id).toBe("my-skill");
      }
    });

    it("reads contracts from governance/agents", () => {
      writeFileSync(join(nexusDir, "governance", "agents", "planner.yaml"), "name: AI-Planner\nagent: planner");
      const state = readKnowledgeState(nexusDir);
      expect(state.contracts).toHaveLength(1);
      if (state.contracts[0]) {
        expect(state.contracts[0].name).toBe("AI-Planner");
      }
    });

    it("reads governance docs", () => {
      writeFileSync(join(nexusDir, "docs", "AGENTS.md"), "# Agents");
      writeFileSync(join(nexusDir, "governance", "WORKFLOW.md"), "# Workflow");
      const state = readKnowledgeState(nexusDir);
      expect(state.governanceDocs.length).toBeGreaterThanOrEqual(2);
    });

    it("reads scripts", () => {
      writeFileSync(join(nexusDir, "scripts", "deploy.ts"), "export {}");
      const state = readKnowledgeState(nexusDir);
      expect(state.scripts).toHaveLength(1);
    });

    it("reads runbooks", () => {
      writeFileSync(join(nexusDir, "docs", "runbooks", "incident-001.md"), "# Incident 001");
      const state = readKnowledgeState(nexusDir);
      expect(state.runbooks).toHaveLength(1);
    });

    it("skips ADR template files", () => {
      writeFileSync(join(nexusDir, "docs", "adrs", "ADR-TEMPLATE.md"), "# Template");
      writeFileSync(join(nexusDir, "docs", "adrs", "ADR-001.md"), "# ADR 001");
      const state = readKnowledgeState(nexusDir);
      expect(state.adrs).toHaveLength(1);
    });
  });

  describe("readProjectState", () => {
    it("returns default state when no files exist", () => {
      const state = readProjectState(tmpDir, nexusDir);
      expect(state.maturity).toBeNull();
      expect(state.knowledgeDebt).toBeNull();
      expect(state.projectInfo.hasGit).toBe(false);
    });

    it("reads maturity profile when it exists", () => {
      writeFileSync(join(nexusDir, "maturity-profile.json"), JSON.stringify({
        overallScore: 65,
        dimensions: { architecture: 70, governance: 60 },
        computedAt: new Date().toISOString(),
        installedCapabilities: ["init"],
        recommendedCapabilities: ["upgrade"],
      }));
      const state = readProjectState(tmpDir, nexusDir);
      expect(state.maturity).not.toBeNull();
      expect(state.maturity!.overallScore).toBe(65);
      expect(state.installedCapabilities).toContain("init");
    });

    it("reads knowledge debt report when it exists", () => {
      writeFileSync(join(nexusDir, "reports", "knowledge-debt-2026-01-01.json"), JSON.stringify({
        totalGaps: 5,
        healthScore: 75,
        generatedAt: "2026-01-01T00:00:00Z",
      }));
      const state = readProjectState(tmpDir, nexusDir);
      expect(state.knowledgeDebt).not.toBeNull();
      expect(state.knowledgeDebt!.totalGaps).toBe(5);
    });
  });

  describe("readSessionMemory", () => {
    it("returns default memory when no buffer exists", () => {
      const memory = readSessionMemory(nexusDir);
      expect(memory.sessionId).toBeNull();
      expect(memory.branch).toBeNull();
      expect(memory.reminders).toEqual([]);
    });

    it("reads context buffer YAML", () => {
      const yaml = `
session:
  id: "session-001"
  branch: "main"
current_task:
  id: "task-1"
  description: "Test task"
  status: "in_progress"
reminders:
  - "Remember to commit"
next_steps:
  - "Run tests"
blockers:
  - "Blocked by issue #1"
`;
      writeFileSync(join(nexusDir, "governance", "context", "context_buffer.yaml"), yaml);
      const memory = readSessionMemory(nexusDir);
      expect(memory.sessionId).toBe("session-001");
      expect(memory.branch).toBe("main");
      expect(memory.currentTask.description).toBe("Test task");
      expect(memory.reminders).toContain("Remember to commit");
      expect(memory.nextSteps).toContain("Run tests");
      expect(memory.blockers).toContain("Blocked by issue #1");
    });
  });

  describe("consolidateState", () => {
    it("returns a complete NexusState", () => {
      const state = consolidateState(tmpDir, nexusDir);
      expect(state).toBeDefined();
      expect(state.knowledge).toBeDefined();
      expect(state.project).toBeDefined();
      expect(state.memory).toBeDefined();
      expect(state.consolidatedAt).toBeTruthy();
    });

    it("all sections have correct types", () => {
      const state = consolidateState(tmpDir, nexusDir);
      expect(Array.isArray(state.knowledge.adrs)).toBe(true);
      expect(typeof state.project.projectInfo).toBe("object");
      expect(state.memory.sessionId === null || typeof state.memory.sessionId === "string").toBe(true);
    });
  });

  describe("stateToText", () => {
    it("produces readable text output", () => {
      const state = consolidateState(tmpDir, nexusDir);
      const text = stateToText(state);
      expect(text).toContain("Nexus State Report");
      expect(text).toContain("Knowledge (Permanent)");
      expect(text).toContain("Project State (Current)");
      expect(text).toContain("Session Memory (Temporary)");
    });

    it("includes ADR count", () => {
      writeFileSync(join(nexusDir, "docs", "adrs", "ADR-001.md"), "# ADR 001");
      const state = consolidateState(tmpDir, nexusDir);
      const text = stateToText(state);
      expect(text).toContain("ADRs: 1");
    });
  });
});
