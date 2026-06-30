/**
 * briefing.ts — Pre-Session Briefing Generator
 *
 * Generates a concise briefing for AI agents before starting work:
 * - Project identity (fingerprint)
 * - Risk areas (risk map)
 * - Test coverage status
 * - Recent patterns
 * - Context rules
 *
 * PRINCIPLE: AI should understand the project before modifying it.
 */

import type { ProjectFingerprint } from "./project-fingerprint.js";
import type { RiskMap } from "./risk-map.js";
import type { ContextRule } from "./context-rules.js";
import type { DynamicRule } from "./dynamic-rules.js";
import type { MaturityProfile } from "./maturity-profile.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Briefing {
  /** When the briefing was generated */
  generatedAt: string;
  /** Project identity */
  project: {
    domain: string;
    scale: string;
    stack: string[];
    maturityScore: number;
  };
  /** Risk summary */
  risks: {
    overall: string;
    criticalAreas: string[];
    highAreas: string[];
  };
  /** Test coverage status */
  tests: {
    hasTests: boolean;
    areasWithoutTests: string[];
  };
  /** Recent patterns */
  patterns: {
    recurringErrors: string[];
    hotAreas: string[];
  };
  /** Context rules (top 5) */
  contextRules: ContextRule[];
  /** Dynamic rules (top 3) */
  dynamicRules: DynamicRule[];
  /** Recommended next steps */
  recommendations: string[];
}

// ── Briefing Generation ────────────────────────────────────────────────────

export function generateBriefing(
  fingerprint: ProjectFingerprint,
  riskMap: RiskMap,
  contextRules: ContextRule[],
  dynamicRules: DynamicRule[],
  maturityProfile?: MaturityProfile
): Briefing {
  // Extract risk information
  const criticalAreas = riskMap.areas
    .filter((a) => a.riskLevel === "critical")
    .map((a) => a.path);
  const highAreas = riskMap.areas
    .filter((a) => a.riskLevel === "high")
    .map((a) => a.path);

  // Extract test coverage information
  const areasWithoutTests = riskMap.areas
    .flatMap((a) => a.factors)
    .filter((f) => f.type === "no-tests")
    .map((f) => f.description)
    .slice(0, 5);

  // Generate recommendations
  const recommendations: string[] = [];
  if (criticalAreas.length > 0) {
    recommendations.push(`Address critical risk areas: ${criticalAreas.join(", ")}`);
  }
  if (areasWithoutTests.length > 0) {
    recommendations.push(`Improve test coverage in ${areasWithoutTests.length} area(s)`);
  }
  if (maturityProfile?.recommendedCapabilities?.length) {
    recommendations.push(`Consider installing: ${maturityProfile.recommendedCapabilities.slice(0, 3).join(", ")}`);
  }
  if (recommendations.length === 0) {
    recommendations.push("Project looks healthy. Continue current practices.");
  }

  return {
    generatedAt: new Date().toISOString(),
    project: {
      domain: fingerprint.domain,
      scale: fingerprint.scale,
      stack: fingerprint.stack.slice(0, 5),
      maturityScore: maturityProfile?.overallScore ?? 0,
    },
    risks: {
      overall: riskMap.overallRisk,
      criticalAreas,
      highAreas,
    },
    tests: {
      hasTests: fingerprint.tooling.tests,
      areasWithoutTests,
    },
    patterns: {
      recurringErrors: [],
      hotAreas: riskMap.areas
        .filter((a) => a.factors.some((f) => f.type === "high-churn"))
        .map((a) => a.path),
    },
    contextRules: contextRules.slice(0, 5),
    dynamicRules: dynamicRules.slice(0, 3),
    recommendations,
  };
}

export function briefingToMarkdown(briefing: Briefing): string {
  const lines: string[] = [];

  lines.push("# Pre-Session Briefing");
  lines.push(`*Generated: ${briefing.generatedAt}*`);
  lines.push("");

  // Project identity
  lines.push("## Project Identity");
  lines.push(`- **Domain:** ${briefing.project.domain}`);
  lines.push(`- **Scale:** ${briefing.project.scale}`);
  lines.push(`- **Stack:** ${briefing.project.stack.join(", ")}`);
  lines.push(`- **Maturity:** ${briefing.project.maturityScore}/100`);
  lines.push("");

  // Risks
  lines.push("## Risk Status");
  lines.push(`- **Overall:** ${briefing.risks.overall}`);
  if (briefing.risks.criticalAreas.length > 0) {
    lines.push(`- **Critical:** ${briefing.risks.criticalAreas.join(", ")}`);
  }
  if (briefing.risks.highAreas.length > 0) {
    lines.push(`- **High:** ${briefing.risks.highAreas.join(", ")}`);
  }
  lines.push("");

  // Tests
  lines.push("## Test Coverage");
  lines.push(`- **Has Tests:** ${briefing.tests.hasTests ? "Yes" : "No"}`);
  if (briefing.tests.areasWithoutTests.length > 0) {
    lines.push(`- **Areas Without Tests:** ${briefing.tests.areasWithoutTests.length}`);
  }
  lines.push("");

  // Context rules
  if (briefing.contextRules.length > 0) {
    lines.push("## Context Rules (Top)");
    for (const rule of briefing.contextRules) {
      lines.push(`- ${rule.rule}`);
    }
    lines.push("");
  }

  // Dynamic rules
  if (briefing.dynamicRules.length > 0) {
    lines.push("## Dynamic Rules (From History)");
    for (const rule of briefing.dynamicRules) {
      lines.push(`- [${rule.severity}] ${rule.rule}`);
    }
    lines.push("");
  }

  // Recommendations
  lines.push("## Recommended Next Steps");
  for (const rec of briefing.recommendations) {
    lines.push(`1. ${rec}`);
  }

  return lines.join("\n");
}
