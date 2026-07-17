/**
 * skill-refs.ts — Central map of issue types to related skills
 *
 * Used for traceability: every detector that duplicates a pattern
 * documented in a skill should reference that skill here.
 * This enables the orphan-skill detector to find skills without
 * any associated detector.
 */

import type { HealthIssueType } from "./types.js";

/**
 * Map of issue types to the skill that documents the related practice.
 *
 * Only populated for confirmed overlaps where the detector reimplements
 * heuristics that already exist in prose in a skill document.
 * Do not speculate — add entries only after manual verification.
 */
export const ISSUE_TYPE_TO_SKILL: Partial<Record<HealthIssueType, string>> = {
  xss_risk: "security_xss_prevention",
  srp_violation: "solid-principles",
};
