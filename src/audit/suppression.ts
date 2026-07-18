/**
 * Audit module — Suppression management
 *
 * Allows users to suppress specific audit issues with a recorded reason.
 * Suppressions are stored in a versionable JSON file and are always auditable
 * (visible via --show-suppressed).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { HealthIssue } from "./types.js";
import { issueFingerprint } from "./shared.js";

export interface Suppression {
  fingerprint: string;
  type: string;
  location: string;
  reason: string;
  suppressedBy: string;
  suppressedAt: string;
}

function getSuppressionsPath(shitennoDir: string): string {
  return join(shitennoDir, "audit-suppressions.json");
}

export function loadSuppressions(shitennoDir: string): Suppression[] {
  const filePath = getSuppressionsPath(shitennoDir);
  if (!existsSync(filePath)) return [];
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSuppressions(shitennoDir: string, suppressions: Suppression[]): void {
  const filePath = getSuppressionsPath(shitennoDir);
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(suppressions, null, 2), "utf-8");
}

export function addSuppression(
  shitennoDir: string,
  issue: HealthIssue,
  reason: string,
  suppressedBy: string
): Suppression {
  const suppressions = loadSuppressions(shitennoDir);
  const suppression: Suppression = {
    fingerprint: issueFingerprint(issue),
    type: issue.type,
    location: issue.location,
    reason,
    suppressedBy,
    suppressedAt: new Date().toISOString(),
  };
  suppressions.push(suppression);
  saveSuppressions(shitennoDir, suppressions);
  return suppression;
}

export function applySuppressions(
  issues: HealthIssue[],
  suppressions: Suppression[]
): {
  visible: HealthIssue[];
  suppressed: Array<HealthIssue & { suppressionReason: string }>;
} {
  const byFingerprint = new Map(suppressions.map((s) => [s.fingerprint, s]));
  const visible: HealthIssue[] = [];
  const suppressed: Array<HealthIssue & { suppressionReason: string }> = [];

  for (const issue of issues) {
    const fp = issueFingerprint(issue);
    const match = byFingerprint.get(fp);
    if (match) {
      suppressed.push({ ...issue, suppressionReason: match.reason });
    } else {
      visible.push(issue);
    }
  }

  return { visible, suppressed };
}
