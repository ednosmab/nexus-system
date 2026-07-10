/**
 * capability-mapping.ts — Shared Capability → File Mapping
 *
 * Fonte única de verdade para o mapeamento capacidade→ficheiros.
 * Usado tanto pelo scaffolder (init) como pelo upgrade (add capability).
 *
 * PRINCÍPIO: Um único sítio de definição — zero divergência.
 */

import { NEXUS_DIR_NAME } from "./constants.js";
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
      NEXUS_DIR_NAME,
      `${NEXUS_DIR_NAME}/docs`,
      `${NEXUS_DIR_NAME}/scripts`,
      `${NEXUS_DIR_NAME}/core`,
      `${NEXUS_DIR_NAME}/core/complexity`,
      `${NEXUS_DIR_NAME}/governance`,
      `${NEXUS_DIR_NAME}/governance/agents`,
      `${NEXUS_DIR_NAME}/governance/context`,
      `${NEXUS_DIR_NAME}/profile`,
      `${NEXUS_DIR_NAME}/docs/feedback`,
    ],
    files: [
      { src: "docs/AGENTS.md", dest: `${NEXUS_DIR_NAME}/docs/AGENTS.md`, customize: true },
      { src: "docs/opencode-context.md", dest: `${NEXUS_DIR_NAME}/docs/opencode-context.md`, customize: true },
      { src: "docs/Nexus-System_GUIDE.md", dest: `${NEXUS_DIR_NAME}/docs/Nexus-System_GUIDE.md`, customize: true },
      { src: "docs/CONCEPTUAL_MODEL.md", dest: `${NEXUS_DIR_NAME}/docs/CONCEPTUAL_MODEL.md` },
      { src: "docs/KNOWLEDGE_LIFECYCLE.md", dest: `${NEXUS_DIR_NAME}/docs/KNOWLEDGE_LIFECYCLE.md` },
      { src: "docs/FORBIDDEN_OPERATIONS.md", dest: `${NEXUS_DIR_NAME}/docs/FORBIDDEN_OPERATIONS.md` },
      { src: "docs/DESDO.md", dest: `${NEXUS_DIR_NAME}/docs/DESDO.md` },
      { src: "docs/BACKLOG.md", dest: `${NEXUS_DIR_NAME}/docs/BACKLOG.md` },
      { src: "docs/capabilities.md", dest: `${NEXUS_DIR_NAME}/docs/capabilities.md`, customize: true },
      { src: "core/complexity/types.ts", dest: `${NEXUS_DIR_NAME}/core/complexity/types.ts` },
      { src: "docs/feedback/README.md", dest: `${NEXUS_DIR_NAME}/docs/feedback/README.md` },
      { src: "governance/SYSTEM_MAP.md", dest: `${NEXUS_DIR_NAME}/governance/SYSTEM_MAP.md`, customize: true },
      { src: "governance/context/context_buffer.yaml", dest: `${NEXUS_DIR_NAME}/governance/context/context_buffer.yaml` },
    ],
  },
  knowledge: {
    directories: [
      `${NEXUS_DIR_NAME}/docs/skills`,
    ],
    files: [], // Skills are copied separately via selectSkills
  },
  architecture: {
    directories: [
      `${NEXUS_DIR_NAME}/docs/adrs`,
      `${NEXUS_DIR_NAME}/docs/sdr`,
      `${NEXUS_DIR_NAME}/governance/plans`,
      `${NEXUS_DIR_NAME}/docs/session-template`,
      `${NEXUS_DIR_NAME}/docs/layers`,
    ],
    files: [
      { src: "docs/adrs/ADR-TEMPLATE.md", dest: `${NEXUS_DIR_NAME}/docs/adrs/ADR-TEMPLATE.md` },
      { src: "docs/adrs/ADR-000-exemplo.md", dest: `${NEXUS_DIR_NAME}/docs/adrs/ADR-000-exemplo.md` },
      { src: "docs/sdr/SDR-TEMPLATE.md", dest: `${NEXUS_DIR_NAME}/docs/sdr/SDR-TEMPLATE.md` },
      { src: "governance/plans/TEMPLATE.md", dest: `${NEXUS_DIR_NAME}/governance/plans/TEMPLATE.md` },
      { src: "docs/session-template.md", dest: `${NEXUS_DIR_NAME}/docs/session-template.md` },
    ],
  },
  governance: {
    directories: [
      `${NEXUS_DIR_NAME}/governance/context`,
      `${NEXUS_DIR_NAME}/docs/rules`,
    ],
    files: [
      { src: "governance/WORKFLOW.md", dest: `${NEXUS_DIR_NAME}/governance/WORKFLOW.md`, customize: true },
      { src: "governance/context/context_buffer.yaml", dest: `${NEXUS_DIR_NAME}/governance/context/context_buffer.yaml` },
      { src: "docs/rules/agent-modes.md", dest: `${NEXUS_DIR_NAME}/docs/rules/agent-modes.md` },
      { src: "docs/rules/branch-policy.md", dest: `${NEXUS_DIR_NAME}/docs/rules/branch-policy.md` },
      { src: "docs/rules/context-algorithm.md", dest: `${NEXUS_DIR_NAME}/docs/rules/context-algorithm.md` },
      { src: "docs/rules/dependency-graph.md", dest: `${NEXUS_DIR_NAME}/docs/rules/dependency-graph.md` },
      { src: "docs/rules/feedback-protocol.md", dest: `${NEXUS_DIR_NAME}/docs/rules/feedback-protocol.md` },
      { src: "docs/rules/lazy-loading.md", dest: `${NEXUS_DIR_NAME}/docs/rules/lazy-loading.md` },
    ],
  },
  ai: {
    directories: [
      `${NEXUS_DIR_NAME}/governance/contracts`,
      `${NEXUS_DIR_NAME}/governance/handoffs`,
      `${NEXUS_DIR_NAME}/governance/policies`,
      `${NEXUS_DIR_NAME}/governance/rules`,
      `${NEXUS_DIR_NAME}/cognition`,
      `${NEXUS_DIR_NAME}/cognition/context`,
      `${NEXUS_DIR_NAME}/cognition/memory`,
      `${NEXUS_DIR_NAME}/cognition/prompts`,
      `${NEXUS_DIR_NAME}/cognition/prompts/executor`,
      `${NEXUS_DIR_NAME}/cognition/prompts/planner`,
      `${NEXUS_DIR_NAME}/cognition/prompts/reviewer`,
      `${NEXUS_DIR_NAME}/plugins`,
      `${NEXUS_DIR_NAME}/plugins/event-logger`,
      `${NEXUS_DIR_NAME}/plugins/health-monitor`,
      `${NEXUS_DIR_NAME}/plugins/health-check`,
      `${NEXUS_DIR_NAME}/governance/knowledge-graph`,
    ],
    files: [
      { src: "governance/agents/AI-CONTRACT-planner-v1.yaml", dest: `${NEXUS_DIR_NAME}/governance/agents/AI-CONTRACT-planner-v1.yaml` },
      { src: "governance/agents/AI-CONTRACT-executor-v1.yaml", dest: `${NEXUS_DIR_NAME}/governance/agents/AI-CONTRACT-executor-v1.yaml` },
      { src: "governance/agents/AI-CONTRACT-reviewer-v1.yaml", dest: `${NEXUS_DIR_NAME}/governance/agents/AI-CONTRACT-reviewer-v1.yaml` },
      { src: "governance/agents/AI-CONTRACT-orchestrator-v1.yaml", dest: `${NEXUS_DIR_NAME}/governance/agents/AI-CONTRACT-orchestrator-v1.yaml` },
      { src: "governance/contracts/CONTRACTS_INDEX.md", dest: `${NEXUS_DIR_NAME}/governance/contracts/CONTRACTS_INDEX.md` },
      { src: "governance/handoffs/TEMPLATE.md", dest: `${NEXUS_DIR_NAME}/governance/handoffs/TEMPLATE.md` },
      { src: "governance/rules/RULE-TEMPLATE.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-TEMPLATE.json` },
      { src: "governance/rules/RULE-011.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-011.json` },
      { src: "governance/rules/RULE-012.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-012.json` },
      { src: "governance/rules/RULE-013.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-013.json` },
      { src: "governance/rules/RULE-014.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-014.json` },
      { src: "governance/rules/RULE-015.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-015.json` },
      { src: "governance/rules/RULE-016.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-016.json` },
      { src: "governance/rules/RULE-017.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-017.json` },
      { src: "governance/rules/RULE-018.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-018.json` },
      { src: "governance/rules/RULE-019.json", dest: `${NEXUS_DIR_NAME}/governance/rules/RULE-019.json` },
      { src: "governance/policies/POLICY-TEMPLATE.md", dest: `${NEXUS_DIR_NAME}/governance/policies/POLICY-TEMPLATE.md` },
      { src: "governance/policies/BRANCH-POLICY.md", dest: `${NEXUS_DIR_NAME}/governance/policies/BRANCH-POLICY.md` },
      { src: "governance/policies/COMMIT-POLICY.md", dest: `${NEXUS_DIR_NAME}/governance/policies/COMMIT-POLICY.md` },
      { src: "governance/policies/REVIEW-POLICY.md", dest: `${NEXUS_DIR_NAME}/governance/policies/REVIEW-POLICY.md` },
      { src: "cognition/context/CONTEXT_HIERARCHY.md", dest: `${NEXUS_DIR_NAME}/cognition/context/CONTEXT_HIERARCHY.md` },
      { src: "cognition/memory/MEM-operational-state-v1.json", dest: `${NEXUS_DIR_NAME}/cognition/memory/MEM-operational-state-v1.json` },
      { src: "cognition/prompts/executor/README.md", dest: `${NEXUS_DIR_NAME}/cognition/prompts/executor/README.md` },
      { src: "cognition/prompts/planner/README.md", dest: `${NEXUS_DIR_NAME}/cognition/prompts/planner/README.md` },
      { src: "cognition/prompts/reviewer/README.md", dest: `${NEXUS_DIR_NAME}/cognition/prompts/reviewer/README.md` },
      { src: "plugins/README.md", dest: `${NEXUS_DIR_NAME}/plugins/README.md` },
      { src: "plugins/event-logger/plugin.js", dest: `${NEXUS_DIR_NAME}/plugins/event-logger/plugin.js` },
      { src: "plugins/health-monitor/plugin.js", dest: `${NEXUS_DIR_NAME}/plugins/health-monitor/plugin.js` },
      { src: "plugins/health-check/plugin.js", dest: `${NEXUS_DIR_NAME}/plugins/health-check/plugin.js` },
      { src: "plugins/health-check/plugin.ts", dest: `${NEXUS_DIR_NAME}/plugins/health-check/plugin.ts` },
      { src: "governance/knowledge-graph/artifacts.json", dest: `${NEXUS_DIR_NAME}/governance/knowledge-graph/artifacts.json` },
      { src: "governance/knowledge-graph/relations.json", dest: `${NEXUS_DIR_NAME}/governance/knowledge-graph/relations.json` },
    ],
  },
  quality: {
    directories: [],
    files: [
      { src: "scripts/validate-session.ts", dest: `${NEXUS_DIR_NAME}/scripts/validate-session.ts` },
      { src: "scripts/sync-docs.ts", dest: `${NEXUS_DIR_NAME}/scripts/sync-docs.ts` },
      { src: "scripts/backlog.ts", dest: `${NEXUS_DIR_NAME}/scripts/backlog.ts` },
      { src: "scripts/generate-changelog.ts", dest: `${NEXUS_DIR_NAME}/scripts/generate-changelog.ts` },
    ],
  },
  metrics: {
    directories: [
      `${NEXUS_DIR_NAME}/reports`,
      `${NEXUS_DIR_NAME}/docs/history`,
    ],
    files: [
      { src: "docs/reports/README.md", dest: `${NEXUS_DIR_NAME}/reports/README.md` },
    ],
  },
  operations: {
    directories: [
      `${NEXUS_DIR_NAME}/docs/runbooks`,
    ],
    files: [
      { src: "scripts/close-session.ts", dest: `${NEXUS_DIR_NAME}/scripts/close-session.ts` },
      { src: "scripts/premortem-check.ts", dest: `${NEXUS_DIR_NAME}/scripts/premortem-check.ts` },
      { src: "docs/runbooks/merge.md", dest: `${NEXUS_DIR_NAME}/docs/runbooks/merge.md` },
    ],
  },
  compliance: {
    directories: [
      `${NEXUS_DIR_NAME}/governance/premortem`,
      `${NEXUS_DIR_NAME}/governance/reviews`,
    ],
    files: [
      { src: "governance/premortem/PREMORTEM.md", dest: `${NEXUS_DIR_NAME}/governance/premortem/PREMORTEM.md` },
      { src: "governance/reviews/SESSION_REVIEW.md", dest: `${NEXUS_DIR_NAME}/governance/reviews/SESSION_REVIEW.md` },
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
