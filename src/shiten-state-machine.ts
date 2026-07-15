/**
 * shiten-state-machine.ts — Lifecycle State Machine
 *
 * Governs the lifecycle of the Shitenno-go itself.
 * Tracks states and validates transitions.
 *
 * PRINCIPLE: The system that governs should govern itself.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getEventBus } from "./event-bus.js";

// ── Types (re-exported from domain entities) ────────────────────────────────

import type { ShitenLifecycleState, StateTransition } from "./domain/entities/engineering-state.js";

export type { ShitenLifecycleState, StateTransition } from "./domain/entities/engineering-state.js";

interface StateMachineFile {
  currentState: ShitenLifecycleState;
  history: StateTransition[];
  lastUpdated: string;
}

// ── Valid Transitions ────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<ShitenLifecycleState, ShitenLifecycleState[]> = {
  uninitialized: ["discovered"],
  discovered: ["assessed"],
  assessed: ["governed"],
  governed: ["evolved", "assessed"],
  evolved: ["governed", "assessed"],
};

/** Check if a transition is valid. */
export function isValidTransition(
  from: ShitenLifecycleState,
  to: ShitenLifecycleState
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── State Detection ──────────────────────────────────────────────────────────

/** Detect the current lifecycle state from filesystem. */
export function detectLifecycleState(
  _projectRoot: string,
  shitenDir: string
): ShitenLifecycleState {
  // Check: uninitialized
  if (!existsSync(shitenDir)) {
    return "uninitialized";
  }

  // Check: discovered (has maturity profile)
  if (!existsSync(join(shitenDir, "maturity-profile.json"))) {
    return "discovered";
  }

  // Check: assessed (has governance workflow)
  if (!existsSync(join(shitenDir, "governance", "WORKFLOW.md"))) {
    return "assessed";
  }

  // Check: evolved (has evolution report)
  const reportsDir = join(shitenDir, "reports");
  if (existsSync(reportsDir)) {
    const evolutionReports = readdirSync(reportsDir).filter(
      (f) => f.startsWith("evolution-") && f.endsWith(".json")
    );
    if (evolutionReports.length > 0) {
      return "evolved";
    }
  }

  return "governed";
}

// ── State Machine ────────────────────────────────────────────────────────────

export interface ShitenStateMachine {
  getState(): ShitenLifecycleState;
  canTransition(to: ShitenLifecycleState): boolean;
  transition(
    to: ShitenLifecycleState,
    trigger: string
  ): boolean;
  getHistory(): StateTransition[];
  save(): void;
}

function getStateFilePath(shitenDir: string): string {
  return join(shitenDir, "lifecycle-state.json");
}

/** Create a state machine instance. */
export function createStateMachine(shitenDir: string): ShitenStateMachine {
  const stateFilePath = getStateFilePath(shitenDir);

  // Load or detect initial state
  let currentState: ShitenLifecycleState = "uninitialized";
  let history: StateTransition[] = [];

  if (existsSync(stateFilePath)) {
    try {
      const file: StateMachineFile = JSON.parse(readFileSync(stateFilePath, "utf-8"));
      currentState = file.currentState;
      history = file.history || [];
    } catch {
      // use defaults
    }
  }

  return {
    getState(): ShitenLifecycleState {
      return currentState;
    },

    canTransition(to: ShitenLifecycleState): boolean {
      return isValidTransition(currentState, to);
    },

    transition(to: ShitenLifecycleState, trigger: string): boolean {
      if (!isValidTransition(currentState, to)) {
        return false;
      }

      const from = currentState;
      currentState = to;

      history.push({
        from,
        to,
        trigger,
        timestamp: new Date().toISOString(),
      });

      // Persist
      this.save();

      // Publish lifecycle event to the event bus
      getEventBus().publish("lifecycle.state_changed", {
        capabilityId: "lifecycle",
        previousState: from,
        newState: to,
        reason: trigger,
      });

      return true;
    },

    getHistory(): StateTransition[] {
      return [...history];
    },

    save(): void {
      const dir = join(shitenDir);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const file: StateMachineFile = {
        currentState,
        history,
        lastUpdated: new Date().toISOString(),
      };

      writeFileSync(stateFilePath, JSON.stringify(file, null, 2));
    },
  };
}

// ── Gate Enforcement ─────────────────────────────────────────────────────────

import { COMMAND_GATES } from "./constants.js";

/** Check if a command is allowed in the current state. */
export function canRunCommand(
  command: string,
  currentState: ShitenLifecycleState
): boolean {
  const requiredState = COMMAND_GATES[command] as ShitenLifecycleState | undefined;
  if (!requiredState) return true; // Unknown commands are allowed

  const stateOrder: ShitenLifecycleState[] = [
    "uninitialized",
    "discovered",
    "assessed",
    "governed",
    "evolved",
  ];

  const currentIdx = stateOrder.indexOf(currentState);
  const requiredIdx = stateOrder.indexOf(requiredState);

  // init can only run from uninitialized (exact match)
  if (command === "init") {
    return currentIdx === requiredIdx;
  }

  // Other commands can run from required state or later
  return currentIdx >= requiredIdx;
}
