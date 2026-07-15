/**
 * errors.ts — Typed Errors for Shiten
 *
 * Replaces process.exit(1) with errors that Commander catches.
 */

export class ShitenError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly exitCode: number = 1
  ) {
    super(message);
    this.name = "ShitenError";
  }
}

export class NotInitializedError extends ShitenError {
  constructor() {
    super("Project not initialized. Run `shiten init` first.", "NOT_INITIALIZED");
  }
}

export class InvalidRuleError extends ShitenError {
  constructor(detail: string) {
    super(`Invalid rule ID: ${detail}`, "INVALID_RULE");
  }
}

export class ScriptNotAllowedError extends ShitenError {
  constructor(script: string) {
    super(`Script not allowed: ${script}`, "SCRIPT_NOT_ALLOWED");
  }
}
