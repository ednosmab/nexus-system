import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Capability } from "../domain/entities/engineering-state.js";

export function detectCapabilitySignalsFromFilesystem(shitennoDir: string): Capability[] {
  const installed: Capability[] = ["core"];
  if (!existsSync(shitennoDir)) return installed;

  if (
    existsSync(join(shitennoDir, "docs", "skills")) ||
    existsSync(join(shitennoDir, "docs", "AGENTS.md"))
  ) {
    installed.push("knowledge");
  }

  if (
    existsSync(join(shitennoDir, "docs", "adrs")) ||
    existsSync(join(shitennoDir, "docs", "sdr")) ||
    existsSync(join(shitennoDir, "docs", "plans"))
  ) {
    installed.push("architecture");
  }

  if (
    existsSync(join(shitennoDir, "governance", "WORKFLOW.md")) ||
    existsSync(join(shitennoDir, "governance", "context"))
  ) {
    installed.push("governance");
  }

  if (
    existsSync(join(shitennoDir, "governance", "agents")) ||
    existsSync(join(shitennoDir, "cognition"))
  ) {
    installed.push("ai");
  }

  if (existsSync(join(shitennoDir, "scripts", "validate-session.ts"))) {
    installed.push("quality");
  }

  if (existsSync(join(shitennoDir, "reports"))) {
    installed.push("metrics");
  }

  if (
    existsSync(join(shitennoDir, "scripts", "close-session.ts")) ||
    existsSync(join(shitennoDir, "docs", "runbooks"))
  ) {
    installed.push("operations");
  }

  if (
    existsSync(join(shitennoDir, "docs", "FORBIDDEN_OPERATIONS.md")) ||
    existsSync(join(shitennoDir, "docs", "DESDO.md")) ||
    existsSync(join(shitennoDir, "governance", "premortem"))
  ) {
    installed.push("compliance");
  }

  return installed;
}
