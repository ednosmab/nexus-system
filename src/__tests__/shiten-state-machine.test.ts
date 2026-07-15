import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  isValidTransition,
  detectLifecycleState,
  createStateMachine,
  canRunCommand,
} from "../shiten-state-machine.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "shiten-state-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("ShitenStateMachine", () => {
  describe("isValidTransition", () => {
    it("allows uninitialized -> discovered", () => {
      expect(isValidTransition("uninitialized", "discovered")).toBe(true);
    });

    it("allows discovered -> assessed", () => {
      expect(isValidTransition("discovered", "assessed")).toBe(true);
    });

    it("allows assessed -> governed", () => {
      expect(isValidTransition("assessed", "governed")).toBe(true);
    });

    it("allows governed -> evolved", () => {
      expect(isValidTransition("governed", "evolved")).toBe(true);
    });

    it("allows evolved -> governed (regression)", () => {
      expect(isValidTransition("evolved", "governed")).toBe(true);
    });

    it("blocks uninitialized -> assessed", () => {
      expect(isValidTransition("uninitialized", "assessed")).toBe(false);
    });

    it("blocks uninitialized -> governed", () => {
      expect(isValidTransition("uninitialized", "governed")).toBe(false);
    });

    it("blocks discovered -> evolved", () => {
      expect(isValidTransition("discovered", "evolved")).toBe(false);
    });
  });

  describe("detectLifecycleState", () => {
    it("returns uninitialized for empty directory", () => {
      const state = detectLifecycleState(tempDir, join(tempDir, "shitenno-go"));
      expect(state).toBe("uninitialized");
    });

    it("returns discovered when shitenno-go/ exists", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });

      const state = detectLifecycleState(tempDir, shitenDir);
      expect(state).toBe("discovered");
    });

    it("returns assessed when maturity-profile.json exists", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });
      writeFileSync(join(shitenDir, "maturity-profile.json"), "{}");

      const state = detectLifecycleState(tempDir, shitenDir);
      expect(state).toBe("assessed");
    });

    it("returns governed when WORKFLOW.md exists", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });
      writeFileSync(join(shitenDir, "maturity-profile.json"), "{}");
      mkdirSync(join(shitenDir, "governance"), { recursive: true });
      writeFileSync(join(shitenDir, "governance", "WORKFLOW.md"), "# Workflow");

      const state = detectLifecycleState(tempDir, shitenDir);
      expect(state).toBe("governed");
    });

    it("returns evolved when evolution report exists", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });
      writeFileSync(join(shitenDir, "maturity-profile.json"), "{}");
      mkdirSync(join(shitenDir, "governance"), { recursive: true });
      writeFileSync(join(shitenDir, "governance", "WORKFLOW.md"), "# Workflow");
      mkdirSync(join(shitenDir, "reports"), { recursive: true });
      writeFileSync(
        join(shitenDir, "reports", "evolution-2026-06-27.json"),
        "{}"
      );

      const state = detectLifecycleState(tempDir, shitenDir);
      expect(state).toBe("evolved");
    });
  });

  describe("state machine operations", () => {
    it("transitions between states", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });

      const sm = createStateMachine(shitenDir);
      expect(sm.getState()).toBe("uninitialized");

      sm.transition("discovered", "shiten init");
      expect(sm.getState()).toBe("discovered");
    });

    it("rejects invalid transitions", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });

      const sm = createStateMachine(shitenDir);
      const result = sm.transition("assessed", "skip init");
      expect(result).toBe(false);
      expect(sm.getState()).toBe("uninitialized");
    });

    it("canTransition returns correct value", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });

      const sm = createStateMachine(shitenDir);
      expect(sm.canTransition("discovered")).toBe(true);
      expect(sm.canTransition("assessed")).toBe(false);
    });

    it("records transition history", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });

      const sm = createStateMachine(shitenDir);
      sm.transition("discovered", "shiten init");
      sm.transition("assessed", "shiten assess");

      const history = sm.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]!.from).toBe("uninitialized");
      expect(history[0]!.to).toBe("discovered");
      expect(history[1]!.from).toBe("discovered");
      expect(history[1]!.to).toBe("assessed");
    });

    it("persists state to disk", () => {
      const shitenDir = join(tempDir, "shitenno-go");
      mkdirSync(shitenDir, { recursive: true });

      const sm = createStateMachine(shitenDir);
      sm.transition("discovered", "shiten init");

      // Create new instance from same directory
      const sm2 = createStateMachine(shitenDir);
      expect(sm2.getState()).toBe("discovered");
    });
  });

  describe("canRunCommand", () => {
    it("allows init only when uninitialized", () => {
      expect(canRunCommand("init", "uninitialized")).toBe(true);
      expect(canRunCommand("init", "discovered")).toBe(false);
    });

    it("allows status when discovered or later", () => {
      expect(canRunCommand("status", "uninitialized")).toBe(false);
      expect(canRunCommand("status", "discovered")).toBe(true);
      expect(canRunCommand("status", "assessed")).toBe(true);
    });

    it("allows detect when discovered or later", () => {
      expect(canRunCommand("detect", "discovered")).toBe(true);
      expect(canRunCommand("detect", "assessed")).toBe(true);
    });

    it("allows unknown commands", () => {
      expect(canRunCommand("unknown", "uninitialized")).toBe(true);
    });
  });
});
