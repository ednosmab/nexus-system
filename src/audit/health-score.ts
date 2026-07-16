/**
 * Audit module — Health score calculation
 */

import type { HealthIssue } from "./types.js";
import { dimensionOf, type AuditDimension } from "./dimensions.js";

/**
 * Calculate health score from issues and total files.
 * Score ranges from 0 (worst) to 100 (best).
 * Issues with lower confidence contribute less to the penalty.
 */
export function calculateHealthScore(issues: HealthIssue[], totalFiles: number): number {
  const weights: Record<number, number> = { 3: 5, 2: 2, 1: 0.5 };
  const bySeverity: Record<number, number> = { 3: 0, 2: 0, 1: 0 };
  const confidenceBySeverity: Record<number, number> = { 3: 0, 2: 0, 1: 0 };
  for (const issue of issues) {
    bySeverity[issue.severity] = (bySeverity[issue.severity] ?? 0) + 1;
    confidenceBySeverity[issue.severity] = (confidenceBySeverity[issue.severity] ?? 0) + (issue.confidence ?? 1.0);
  }
  const rawPenalty = Object.entries(bySeverity).reduce(
    (sum, [sev, count]) => {
      const conf = count > 0 ? (confidenceBySeverity[Number(sev)] ?? count) / count : 1.0;
      return sum + (weights[Number(sev)] ?? 0) * Math.sqrt(count) * conf;
    }, 0
  );
  const normalizer = Math.max(totalFiles, 10);
  const density = rawPenalty / normalizer;
  const score = 100 * Math.exp(-density * 2);
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate health score per dimension.
 * Returns a record mapping each dimension to its score (0-100).
 */
export function calculateDimensionScores(
  issues: HealthIssue[],
  totalFiles: number
): Record<AuditDimension, number> {
  const dimensions: AuditDimension[] = ["security", "reliability", "complexity", "hygiene", "coverage", "governance"];
  const result: Record<AuditDimension, number> = {
    security: 100,
    reliability: 100,
    complexity: 100,
    hygiene: 100,
    coverage: 100,
    governance: 100,
  };

  for (const dim of dimensions) {
    const dimIssues = issues.filter((i) => dimensionOf(i.type) === dim);
    if (dimIssues.length === 0) continue;
    result[dim] = calculateHealthScore(dimIssues, totalFiles);
  }

  return result;
}
