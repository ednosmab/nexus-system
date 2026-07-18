/**
 * Audit module — Autofix Engine
 *
 * Applies fix suggestions with verification and automatic rollback.
 * NEVER auto-applies without confidence threshold (default 0.85).
 * Always creates backup before writing — reverts on verification failure.
 */

import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import type { Suggestion } from "./suggestion-engine.js";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ApplyResult {
  suggestion: Suggestion;
  status: "applied" | "reverted" | "skipped";
  reason?: string;
}

export interface AutofixReport {
  total: number;
  applied: number;
  reverted: number;
  skipped: number;
  results: ApplyResult[];
}

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_MIN_CONFIDENCE = 0.85;
const DEFAULT_VERIFY_COMMAND = "npx tsc --noEmit";
const BACKUP_SUFFIX = ".shitenno-backup";
const VERIFY_TIMEOUT_MS = 60_000;

// ── Core Function ───────────────────────────────────────────────────────────

/**
 * Applies a suggestion, verifies with typecheck, reverts if broken.
 * NUNCA aplica se confidence < threshold — autofix só em fixes de alta certeza.
 */
export function applyAndVerify(
  suggestion: Suggestion,
  projectRoot: string,
  opts: { minConfidence?: number; verifyCommand?: string; dryRun?: boolean } = {}
): ApplyResult {
  const minConfidence = opts.minConfidence ?? DEFAULT_MIN_CONFIDENCE;

  if (suggestion.confidence < minConfidence) {
    return {
      suggestion,
      status: "skipped",
      reason: `confidence ${suggestion.confidence} < ${minConfidence}`,
    };
  }

  const filePath = `${projectRoot}/${suggestion.file}`;

  if (!existsSync(filePath)) {
    return {
      suggestion,
      status: "skipped",
      reason: `file not found: ${suggestion.file}`,
    };
  }

  const backupPath = `${filePath}${BACKUP_SUFFIX}`;
  copyFileSync(filePath, backupPath);

  try {
    const content = readFileSync(filePath, "utf-8");

    if (!content.includes(suggestion.currentCode)) {
      unlinkSync(backupPath);
      return {
        suggestion,
        status: "skipped",
        reason: "currentCode not found — file changed since audit",
      };
    }

    const patched = content.replace(suggestion.currentCode, suggestion.suggestedCode);

    if (opts.dryRun) {
      unlinkSync(backupPath);
      return {
        suggestion,
        status: "applied",
        reason: "dry-run — no changes written",
      };
    }

    writeFileSync(filePath, patched, "utf-8");

    const verifyCmd = opts.verifyCommand ?? DEFAULT_VERIFY_COMMAND;
    execSync(verifyCmd, {
      cwd: projectRoot,
      stdio: "pipe",
      timeout: VERIFY_TIMEOUT_MS,
    });

    unlinkSync(backupPath);
    return { suggestion, status: "applied" };
  } catch (error) {
    copyFileSync(backupPath, filePath);
    unlinkSync(backupPath);
    return {
      suggestion,
      status: "reverted",
      reason: String(error).slice(0, 200),
    };
  }
}

// ── Batch Processing ────────────────────────────────────────────────────────

/**
 * Applies multiple suggestions with verification.
 * Returns a report with counts and individual results.
 */
export function applyAllFixes(
  suggestions: Suggestion[],
  projectRoot: string,
  opts: { minConfidence?: number; verifyCommand?: string; dryRun?: boolean } = {}
): AutofixReport {
  const results: ApplyResult[] = [];

  for (const suggestion of suggestions) {
    const result = applyAndVerify(suggestion, projectRoot, opts);
    results.push(result);
  }

  return {
    total: results.length,
    applied: results.filter((r) => r.status === "applied").length,
    reverted: results.filter((r) => r.status === "reverted").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    results,
  };
}
