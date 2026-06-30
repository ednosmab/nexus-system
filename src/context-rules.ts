/**
 * context-rules.ts — Context-Aware Rules Generation
 *
 * Generates project-specific rules based on:
 * - Risk map (areas without tests, high churn)
 * - Project fingerprint (domain, scale, stack)
 * - Knowledge debt (missing artifacts)
 *
 * PRINCIPLE: Generic rules are necessary but not sufficient.
 * Context-aware rules help AI work better in THIS project.
 */

import type { ProjectFingerprint } from "./project-fingerprint.js";
import type { RiskMap } from "./risk-map.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ContextRule {
  /** Unique rule identifier */
  id: string;
  /** The rule text */
  rule: string;
  /** Why this rule exists */
  rationale: string;
  /** Priority (1 = highest) */
  priority: number;
  /** Area this rule applies to */
  area: string;
  /** What this rule is based on */
  basedOn: "risk-map" | "fingerprint" | "knowledge-debt";
}

// ── Rule Generation ────────────────────────────────────────────────────────

function generateRiskBasedRules(riskMap: RiskMap): ContextRule[] {
  const rules: ContextRule[] = [];

  for (const area of riskMap.areas) {
    if (area.riskLevel === "critical" || area.riskLevel === "high") {
      // Areas without tests
      const noTestFactors = area.factors.filter((f) => f.type === "no-tests");
      if (noTestFactors.length > 0) {
        rules.push({
          id: `risk-notest-${area.path.replace(/[^a-z0-9]/gi, "-")}`,
          rule: `Area "${area.path}" has ${noTestFactors.length} file(s) without tests. Prioritize test coverage here.`,
          rationale: `${noTestFactors.length} files lack test coverage. This increases regression risk.`,
          priority: 1,
          area: area.path,
          basedOn: "risk-map",
        });
      }

      // High churn areas
      const churnFactors = area.factors.filter((f) => f.type === "high-churn");
      if (churnFactors.length > 0) {
        rules.push({
          id: `risk-churn-${area.path.replace(/[^a-z0-9]/gi, "-")}`,
          rule: `Area "${area.path}" has high churn (${churnFactors.length} frequently changed file(s)). Change with extra care.`,
          rationale: `Frequent changes indicate active development or instability.`,
          priority: 2,
          area: area.path,
          basedOn: "risk-map",
        });
      }

      // Large files
      const largeFileFactors = area.factors.filter((f) => f.type === "large-file");
      if (largeFileFactors.length > 0) {
        rules.push({
          id: `risk-large-${area.path.replace(/[^a-z0-9]/gi, "-")}`,
          rule: `Area "${area.path}" contains ${largeFileFactors.length} large file(s) (>300 lines). Consider refactoring.`,
          rationale: `Large files are harder to understand, test, and maintain.`,
          priority: 3,
          area: area.path,
          basedOn: "risk-map",
        });
      }

      // Sensitive keywords
      const sensitiveFactors = area.factors.filter((f) => f.type === "sensitive-keyword");
      if (sensitiveFactors.length > 0) {
        rules.push({
          id: `risk-sensitive-${area.path.replace(/[^a-z0-9]/gi, "-")}`,
          rule: `Area "${area.path}" contains sensitive keywords (auth, payment, security). Apply extra security review.`,
          rationale: `Sensitive areas require stricter review and testing.`,
          priority: 1,
          area: area.path,
          basedOn: "risk-map",
        });
      }
    }
  }

  return rules;
}

function generateFingerprintBasedRules(fingerprint: ProjectFingerprint): ContextRule[] {
  const rules: ContextRule[] = [];

  // Domain-specific rules
  if (fingerprint.domain === "monorepo") {
    rules.push({
      id: "fp-monorepo-packages",
      rule: "This is a monorepo. When modifying shared packages, ensure backward compatibility.",
      rationale: "Monorepo changes can affect multiple downstream packages.",
      priority: 2,
      area: "packages/",
      basedOn: "fingerprint",
    });
  }

  if (fingerprint.domain === "api") {
    rules.push({
      id: "fp-api-contracts",
      rule: "This is an API project. Maintain backward compatibility for all public endpoints.",
      rationale: "API breaking changes can affect all consumers.",
      priority: 1,
      area: "src/",
      basedOn: "fingerprint",
    });
  }

  if (fingerprint.domain === "web-app") {
    rules.push({
      id: "fp-web-perf",
      rule: "This is a web app. Be mindful of bundle size and rendering performance.",
      rationale: "Web app performance directly affects user experience.",
      priority: 2,
      area: "src/",
      basedOn: "fingerprint",
    });
  }

  // Scale-based rules
  if (fingerprint.scale === "large" || fingerprint.scale === "enterprise") {
    rules.push({
      id: "fp-scale-review",
      rule: "Large codebase: Always run tests before committing. Consider impact on other modules.",
      rationale: "Large projects have higher risk of unintended side effects.",
      priority: 2,
      area: "project-wide",
      basedOn: "fingerprint",
    });
  }

  // Tooling-based rules
  if (fingerprint.tooling.typescript && fingerprint.tooling.tests) {
    rules.push({
      id: "fp-ts-tests",
      rule: "TypeScript and tests are configured. Ensure all changes have type-safe implementations and test coverage.",
      rationale: "Existing tooling should be leveraged for quality.",
      priority: 3,
      area: "project-wide",
      basedOn: "fingerprint",
    });
  }

  return rules;
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateContextRules(
  fingerprint: ProjectFingerprint,
  riskMap: RiskMap
): ContextRule[] {
  const rules: ContextRule[] = [];

  // Generate rules from risk map
  rules.push(...generateRiskBasedRules(riskMap));

  // Generate rules from fingerprint
  rules.push(...generateFingerprintBasedRules(fingerprint));

  // Sort by priority
  rules.sort((a, b) => a.priority - b.priority);

  // Deduplicate by id
  const seen = new Set<string>();
  return rules.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export function contextRulesToMarkdown(rules: ContextRule[]): string {
  if (rules.length === 0) return "";

  const lines = ["## Context-Aware Rules (Auto-Generated)", ""];
  lines.push("*These rules are generated based on your project's specific characteristics.*");
  lines.push("");

  for (const rule of rules) {
    lines.push(`### ${rule.id}`);
    lines.push(`**Rule:** ${rule.rule}`);
    lines.push(`**Rationale:** ${rule.rationale}`);
    lines.push(`**Area:** \`${rule.area}\` | **Priority:** ${rule.priority} | **Based on:** ${rule.basedOn}`);
    lines.push("");
  }

  return lines.join("\n");
}
