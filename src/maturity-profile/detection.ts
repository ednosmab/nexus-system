import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Capability } from "../domain/entities/engineering-state.js";

export function detectCapabilitySignalsFromFilesystem(shitenDir: string): Capability[] {
  const installed: Capability[] = ["core"];
  if (!existsSync(shitenDir)) return installed;

  if (
    existsSync(join(shitenDir, "docs", "skills")) ||
    existsSync(join(shitenDir, "docs", "AGENTS.md"))
  ) {
    installed.push("knowledge");
  }

  if (
    existsSync(join(shitenDir, "docs", "adrs")) ||
    existsSync(join(shitenDir, "docs", "sdr")) ||
    existsSync(join(shitenDir, "docs", "plans"))
  ) {
    installed.push("architecture");
  }

  if (
    existsSync(join(shitenDir, "governance", "WORKFLOW.md")) ||
    existsSync(join(shitenDir, "governance", "context"))
  ) {
    installed.push("governance");
  }

  if (
    existsSync(join(shitenDir, "governance", "agents")) ||
    existsSync(join(shitenDir, "cognition"))
  ) {
    installed.push("ai");
  }

  if (existsSync(join(shitenDir, "scripts", "validate-session.ts"))) {
    installed.push("quality");
  }

  if (existsSync(join(shitenDir, "reports"))) {
    installed.push("metrics");
  }

  if (
    existsSync(join(shitenDir, "scripts", "close-session.ts")) ||
    existsSync(join(shitenDir, "docs", "runbooks"))
  ) {
    installed.push("operations");
  }

  if (
    existsSync(join(shitenDir, "docs", "FORBIDDEN_OPERATIONS.md")) ||
    existsSync(join(shitenDir, "docs", "DESDO.md")) ||
    existsSync(join(shitenDir, "governance", "premortem"))
  ) {
    installed.push("compliance");
  }

  return installed;
}
