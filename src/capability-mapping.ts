/**
 * capability-mapping.ts — Shared Capability → File Mapping
 *
 * Fonte única de verdade para o mapeamento capacidade→ficheiros.
 * Usado tanto pelo scaffolder (init) como pelo upgrade (add capability).
 *
 * PRINCÍPIO: Um único sítio de definição — zero divergência.
 */

import type { Capability } from "./maturity-profile.js";

export interface CapabilityFile {
  src: string;
  dest: string;
  customize?: boolean;
}

export interface CapabilityMapping {
  directories: string[];
  files: CapabilityFile[];
}

/**
 * Mapeamento completo de capacidades para diretórios e arquivos.
 * Cada capacidade define exactamente o que instala.
 */
const CAPABILITY_MAPPINGS: Record<Capability, CapabilityMapping> = {
  core: {
    directories: [
      "nexus-system",
      "nexus-system/docs",
      "nexus-system/scripts",
      "nexus-system/core",
      "nexus-system/core/complexity",
      "nexus-system/governance",
      "nexus-system/governance/agents",
      "nexus-system/governance/context",
      "nexus-system/profile",
      "nexus-system/docs/feedback",
    ],
    files: [
      { src: "docs/AGENTS.md", dest: "nexus-system/docs/AGENTS.md", customize: true },
      { src: "docs/opencode-context.md", dest: "nexus-system/docs/opencode-context.md", customize: true },
      { src: "docs/Nexus-System_GUIDE.md", dest: "nexus-system/docs/Nexus-System_GUIDE.md", customize: true },
      { src: "docs/CONCEPTUAL_MODEL.md", dest: "nexus-system/docs/CONCEPTUAL_MODEL.md" },
      { src: "docs/KNOWLEDGE_LIFECYCLE.md", dest: "nexus-system/docs/KNOWLEDGE_LIFECYCLE.md" },
      { src: "docs/FORBIDDEN_OPERATIONS.md", dest: "nexus-system/docs/FORBIDDEN_OPERATIONS.md" },
      { src: "docs/DESDO.md", dest: "nexus-system/docs/DESDO.md" },
      { src: "docs/BACKLOG.md", dest: "nexus-system/docs/BACKLOG.md" },
      { src: "docs/capabilities.md", dest: "nexus-system/docs/capabilities.md", customize: true },
      { src: "core/complexity/types.ts", dest: "nexus-system/core/complexity/types.ts" },
      { src: "docs/feedback/README.md", dest: "nexus-system/docs/feedback/README.md" },
      { src: "governance/SYSTEM_MAP.md", dest: "nexus-system/governance/SYSTEM_MAP.md", customize: true },
      { src: "governance/context/context_buffer.yaml", dest: "nexus-system/governance/context/context_buffer.yaml" },
    ],
  },
  knowledge: {
    directories: [
      "nexus-system/docs/skills",
    ],
    files: [], // Skills are copied separately via selectSkills
  },
  architecture: {
    directories: [
      "nexus-system/docs/adrs",
      "nexus-system/docs/sdr",
      "nexus-system/governance/plans",
      "nexus-system/docs/session-template",
      "nexus-system/docs/layers",
    ],
    files: [
      { src: "docs/adrs/ADR-TEMPLATE.md", dest: "nexus-system/docs/adrs/ADR-TEMPLATE.md" },
      { src: "docs/adrs/ADR-000-exemplo.md", dest: "nexus-system/docs/adrs/ADR-000-exemplo.md" },
      { src: "docs/sdr/SDR-TEMPLATE.md", dest: "nexus-system/docs/sdr/SDR-TEMPLATE.md" },
      { src: "governance/plans/TEMPLATE.md", dest: "nexus-system/governance/plans/TEMPLATE.md" },
      { src: "docs/session-template.md", dest: "nexus-system/docs/session-template.md" },
    ],
  },
  governance: {
    directories: [
      "nexus-system/governance/context",
      "nexus-system/docs/rules",
    ],
    files: [
      { src: "governance/WORKFLOW.md", dest: "nexus-system/governance/WORKFLOW.md", customize: true },
      { src: "governance/context/context_buffer.yaml", dest: "nexus-system/governance/context/context_buffer.yaml" },
      { src: "docs/rules/agent-modes.md", dest: "nexus-system/docs/rules/agent-modes.md" },
      { src: "docs/rules/branch-policy.md", dest: "nexus-system/docs/rules/branch-policy.md" },
      { src: "docs/rules/context-algorithm.md", dest: "nexus-system/docs/rules/context-algorithm.md" },
      { src: "docs/rules/dependency-graph.md", dest: "nexus-system/docs/rules/dependency-graph.md" },
      { src: "docs/rules/feedback-protocol.md", dest: "nexus-system/docs/rules/feedback-protocol.md" },
      { src: "docs/rules/lazy-loading.md", dest: "nexus-system/docs/rules/lazy-loading.md" },
    ],
  },
  ai: {
    directories: [
      "nexus-system/governance/contracts",
      "nexus-system/governance/handoffs",
      "nexus-system/governance/policies",
      "nexus-system/governance/rules",
      "nexus-system/cognition",
      "nexus-system/cognition/context",
      "nexus-system/cognition/memory",
      "nexus-system/cognition/prompts",
      "nexus-system/cognition/prompts/executor",
      "nexus-system/cognition/prompts/planner",
      "nexus-system/cognition/prompts/reviewer",
      "nexus-system/plugins",
      "nexus-system/plugins/event-logger",
      "nexus-system/plugins/health-monitor",
      "nexus-system/plugins/health-check",
      "nexus-system/governance/knowledge-graph",
    ],
    files: [
      { src: "governance/agents/AI-CONTRACT-planner-v1.yaml", dest: "nexus-system/governance/agents/AI-CONTRACT-planner-v1.yaml" },
      { src: "governance/agents/AI-CONTRACT-executor-v1.yaml", dest: "nexus-system/governance/agents/AI-CONTRACT-executor-v1.yaml" },
      { src: "governance/agents/AI-CONTRACT-reviewer-v1.yaml", dest: "nexus-system/governance/agents/AI-CONTRACT-reviewer-v1.yaml" },
      { src: "governance/agents/AI-CONTRACT-orchestrator-v1.yaml", dest: "nexus-system/governance/agents/AI-CONTRACT-orchestrator-v1.yaml" },
      { src: "governance/contracts/CONTRACTS_INDEX.md", dest: "nexus-system/governance/contracts/CONTRACTS_INDEX.md" },
      { src: "governance/handoffs/TEMPLATE.md", dest: "nexus-system/governance/handoffs/TEMPLATE.md" },
      { src: "governance/rules/RULE-TEMPLATE.json", dest: "nexus-system/governance/rules/RULE-TEMPLATE.json" },
      { src: "governance/rules/RULE-011.json", dest: "nexus-system/governance/rules/RULE-011.json" },
      { src: "governance/rules/RULE-012.json", dest: "nexus-system/governance/rules/RULE-012.json" },
      { src: "governance/rules/RULE-013.json", dest: "nexus-system/governance/rules/RULE-013.json" },
      { src: "governance/rules/RULE-014.json", dest: "nexus-system/governance/rules/RULE-014.json" },
      { src: "governance/rules/RULE-015.json", dest: "nexus-system/governance/rules/RULE-015.json" },
      { src: "governance/rules/RULE-016.json", dest: "nexus-system/governance/rules/RULE-016.json" },
      { src: "governance/rules/RULE-017.json", dest: "nexus-system/governance/rules/RULE-017.json" },
      { src: "governance/rules/RULE-018.json", dest: "nexus-system/governance/rules/RULE-018.json" },
      { src: "governance/rules/RULE-019.json", dest: "nexus-system/governance/rules/RULE-019.json" },
      { src: "governance/policies/POLICY-TEMPLATE.md", dest: "nexus-system/governance/policies/POLICY-TEMPLATE.md" },
      { src: "governance/policies/BRANCH-POLICY.md", dest: "nexus-system/governance/policies/BRANCH-POLICY.md" },
      { src: "governance/policies/COMMIT-POLICY.md", dest: "nexus-system/governance/policies/COMMIT-POLICY.md" },
      { src: "governance/policies/REVIEW-POLICY.md", dest: "nexus-system/governance/policies/REVIEW-POLICY.md" },
      { src: "cognition/context/CONTEXT_HIERARCHY.md", dest: "nexus-system/cognition/context/CONTEXT_HIERARCHY.md" },
      { src: "cognition/memory/MEM-operational-state-v1.json", dest: "nexus-system/cognition/memory/MEM-operational-state-v1.json" },
      { src: "cognition/prompts/executor/README.md", dest: "nexus-system/cognition/prompts/executor/README.md" },
      { src: "cognition/prompts/planner/README.md", dest: "nexus-system/cognition/prompts/planner/README.md" },
      { src: "cognition/prompts/reviewer/README.md", dest: "nexus-system/cognition/prompts/reviewer/README.md" },
      { src: "plugins/README.md", dest: "nexus-system/plugins/README.md" },
      { src: "plugins/event-logger/plugin.js", dest: "nexus-system/plugins/event-logger/plugin.js" },
      { src: "plugins/health-monitor/plugin.js", dest: "nexus-system/plugins/health-monitor/plugin.js" },
      { src: "plugins/health-check/plugin.js", dest: "nexus-system/plugins/health-check/plugin.js" },
      { src: "plugins/health-check/plugin.ts", dest: "nexus-system/plugins/health-check/plugin.ts" },
      { src: "governance/knowledge-graph/artifacts.json", dest: "nexus-system/governance/knowledge-graph/artifacts.json" },
      { src: "governance/knowledge-graph/relations.json", dest: "nexus-system/governance/knowledge-graph/relations.json" },
    ],
  },
  quality: {
    directories: [],
    files: [
      { src: "scripts/validate-session.ts", dest: "nexus-system/scripts/validate-session.ts" },
      { src: "scripts/sync-docs.ts", dest: "nexus-system/scripts/sync-docs.ts" },
      { src: "scripts/backlog.ts", dest: "nexus-system/scripts/backlog.ts" },
      { src: "scripts/generate-changelog.ts", dest: "nexus-system/scripts/generate-changelog.ts" },
    ],
  },
  metrics: {
    directories: [
      "nexus-system/reports",
      "nexus-system/docs/history",
    ],
    files: [
      { src: "docs/reports/README.md", dest: "nexus-system/reports/README.md" },
    ],
  },
  operations: {
    directories: [
      "nexus-system/docs/runbooks",
    ],
    files: [
      { src: "scripts/close-session.ts", dest: "nexus-system/scripts/close-session.ts" },
      { src: "scripts/premortem-check.ts", dest: "nexus-system/scripts/premortem-check.ts" },
      { src: "docs/runbooks/merge.md", dest: "nexus-system/docs/runbooks/merge.md" },
    ],
  },
  compliance: {
    directories: [
      "nexus-system/governance/premortem",
      "nexus-system/governance/reviews",
    ],
    files: [
      { src: "governance/premortem/PREMORTEM.md", dest: "nexus-system/governance/premortem/PREMORTEM.md" },
      { src: "governance/reviews/SESSION_REVIEW.md", dest: "nexus-system/governance/reviews/SESSION_REVIEW.md" },
    ],
  },
};

/** Obtém o mapeamento de uma capacidade. */
export function getCapabilityMapping(capability: Capability): CapabilityMapping {
  return CAPABILITY_MAPPINGS[capability];
}

/** Obtém os ficheiros de uma capacidade (sem directórios). */
export function getCapabilityFiles(capability: Capability): CapabilityFile[] {
  return CAPABILITY_MAPPINGS[capability].files;
}

/** Obtém os directórios de uma capacidade. */
export function getCapabilityDirectories(capability: Capability): string[] {
  return CAPABILITY_MAPPINGS[capability].directories;
}
