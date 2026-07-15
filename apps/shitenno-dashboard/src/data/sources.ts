const SHITEN_ROOT = '../../../../../shitenno-go'

export const SOURCES = {
  fingerprint: `${SHITEN_ROOT}/fingerprint.json`,
  maturityProfile: `${SHITEN_ROOT}/maturity-profile.json`,
  contextBuffer: `${SHITEN_ROOT}/governance/context/context_buffer.yaml`,
  backlog: `${SHITEN_ROOT}/docs/BACKLOG.md`,
  feedbackSummary: `${SHITEN_ROOT}/feedback/summary.json`,
  feedbackRecords: `${SHITEN_ROOT}/feedback/records`,
  operationalState: `${SHITEN_ROOT}/cognition/memory/MEM-operational-state-v1.json`,
  systemMap: `${SHITEN_ROOT}/governance/SYSTEM_MAP.md`,
  knowledgeArtifacts: `${SHITEN_ROOT}/governance/knowledge-graph/artifacts.json`,
  knowledgeRelations: `${SHITEN_ROOT}/governance/knowledge-graph/relations.json`,
  agentsDir: `${SHITEN_ROOT}/governance/agents`,
  telemetryDir: `${SHITEN_ROOT}/telemetry`,
  reportsDir: `${SHITEN_ROOT}/reports`,
} as const
