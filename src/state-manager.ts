/**
 * state-manager.ts — Pilar 7: Separação dos Estados
 *
 * Distingue claramente diferentes naturezas de informação:
 * - Knowledge: Conhecimento permanente (ADRs, skills, docs)
 * - State: Estado actual do projecto (maturidade, capacidades)
 * - Memory: Estado temporário da sessão (context buffer)
 *
 * PRINCÍPIO: Separação reduce acoplamento e facilita integrações com IA.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { analyseProject } from "./analyser.js";

// ── Types ───────────────────────────────────────────────────────────────────

/** Knowledge — Conhecimento permanente. */
export interface KnowledgeState {
  /** ADRs criados. */
  adrs: Array<{ id: string; title: string; status: string; path: string }>;
  /** Skills disponíveis. */
  skills: Array<{ id: string; name: string; path: string }>;
  /** Contratos de agentes. */
  contracts: Array<{ id: string; name: string; role: string; path: string }>;
  /** Documentos de governança. */
  governanceDocs: Array<{ name: string; path: string; critical: boolean }>;
  /** Scripts de automação. */
  scripts: Array<{ id: string; name: string; path: string }>;
  /** Runbooks. */
  runbooks: Array<{ id: string; name: string; path: string }>;
}

/** State — Estado actual do projecto. */
export interface ProjectState {
  /** Maturidade actual. */
  maturity: {
    overallScore: number;
    dimensions: Record<string, number>;
    computedAt: string;
  } | null;
  /** Capacidades instaladas. */
  installedCapabilities: string[];
  /** Capacidades recomendadas. */
  recommendedCapabilities: string[];
  /** Dívida de conhecimento. */
  knowledgeDebt: {
    totalGaps: number;
    healthScore: number;
    detectedAt: string;
  } | null;
  /** Complexidade actual. */
  complexity: {
    score: number;
    level: string;
    computedAt: string;
  } | null;
  /** Estado do projecto. */
  projectInfo: {
    name: string;
    stack: string[];
    hasGit: boolean;
    hasCI: boolean;
    hasTests: boolean;
    hasTypeScript: boolean;
    packageCount: number;
    sourceFileCount: number;
  };
}

/** Memory — Estado temporário da sessão. */
export interface SessionMemory {
  /** ID da sessão. */
  sessionId: string | null;
  /** Branch actual. */
  branch: string | null;
  /** Tipo de operação. */
  operationType: string | null;
  /** Tarefa actual. */
  currentTask: {
    id: string | null;
    type: string | null;
    description: string | null;
    status: string | null;
  };
  /** Quick board. */
  quickBoard: {
    emCurso: string | null;
    parado: string[];
    proximo: string[];
  };
  /** Lembretes. */
  reminders: string[];
  /** Passos restantes. */
  nextSteps: string[];
  /** Blockers. */
  blockers: string[];
  /** Documentos carregados. */
  documentsLoaded: string[];
}

/** Estado consolidado. */
export interface NexusState {
  /** Conhecimento permanente. */
  knowledge: KnowledgeState;
  /** Estado do projecto. */
  project: ProjectState;
  /** Memória da sessão. */
  memory: SessionMemory;
  /** Timestamp da consolidação. */
  consolidatedAt: string;
}

// ── Knowledge Reader ────────────────────────────────────────────────────────

/** Lê estado de conhecimento do projecto. */
export function readKnowledgeState(nexusDir: string): KnowledgeState {
  const state: KnowledgeState = {
    adrs: [],
    skills: [],
    contracts: [],
    governanceDocs: [],
    scripts: [],
    runbooks: [],
  };

  // ADRs
  const adrDir = join(nexusDir, "docs", "adrs");
  if (existsSync(adrDir)) {
    const files = readdirSync(adrDir).filter(
      (f) => f.endsWith(".md") && !f.startsWith("ADR-TEMPLATE")
    );
    for (const file of files) {
      const content = readFileSync(join(adrDir, file), "utf-8");
      const titleMatch = content.match(/^#\s+(.+)/m);
      const statusMatch = content.match(/Estado:\s*(\w+)/i) || content.match(/Status:\s*(\w+)/i);
      state.adrs.push({
        id: file.replace(".md", ""),
        title: titleMatch ? titleMatch[1] : file.replace(".md", ""),
        status: statusMatch ? statusMatch[1] : "unknown",
        path: `docs/adrs/${file}`,
      });
    }
  }

  // Skills
  const skillsDir = join(nexusDir, "docs", "skills");
  if (existsSync(skillsDir)) {
    const files = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      state.skills.push({
        id: file.replace(".md", ""),
        name: file.replace(".md", "").replace(/_/g, " "),
        path: `docs/skills/${file}`,
      });
    }
  }

  // Contracts
  const contractsDir = join(nexusDir, "governance", "agents");
  if (existsSync(contractsDir)) {
    const files = readdirSync(contractsDir).filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml")
    );
    for (const file of files) {
      const content = readFileSync(join(contractsDir, file), "utf-8");
      const nameMatch = content.match(/name:\s*(.+)/);
      const roleMatch = content.match(/agent:\s*(.+)/);
      state.contracts.push({
        id: file.replace(/\.(yaml|yml)$/, ""),
        name: nameMatch ? nameMatch[1].trim() : file,
        role: roleMatch ? roleMatch[1].trim() : "unknown",
        path: `governance/agents/${file}`,
      });
    }
  }

  // Governance docs
  const expectedDocs = [
    { name: "AGENTS.md", path: "docs/AGENTS.md", critical: true },
    { name: "FORBIDDEN_OPERATIONS.md", path: "docs/FORBIDDEN_OPERATIONS.md", critical: true },
    { name: "DESDO.md", path: "docs/DESDO.md", critical: true },
    { name: "CONCEPTUAL_MODEL.md", path: "docs/CONCEPTUAL_MODEL.md", critical: false },
    { name: "KNOWLEDGE_LIFECYCLE.md", path: "docs/KNOWLEDGE_LIFECYCLE.md", critical: false },
    { name: "WORKFLOW.md", path: "governance/WORKFLOW.md", critical: true },
    { name: "SYSTEM_MAP.md", path: "governance/SYSTEM_MAP.md", critical: false },
  ];
  for (const doc of expectedDocs) {
    if (existsSync(join(nexusDir, doc.path))) {
      state.governanceDocs.push(doc);
    }
  }

  // Scripts
  const scriptsDir = join(nexusDir, "scripts");
  if (existsSync(scriptsDir)) {
    const files = readdirSync(scriptsDir).filter(
      (f) => f.endsWith(".ts") || f.endsWith(".js")
    );
    for (const file of files) {
      state.scripts.push({
        id: file.replace(/\.(ts|js)$/, ""),
        name: file.replace(/\.(ts|js)$/, "").replace(/-/g, " "),
        path: `scripts/${file}`,
      });
    }
  }

  // Runbooks
  const runbooksDir = join(nexusDir, "docs", "runbooks");
  if (existsSync(runbooksDir)) {
    const files = readdirSync(runbooksDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      state.runbooks.push({
        id: file.replace(".md", ""),
        name: file.replace(".md", "").replace(/-/g, " "),
        path: `docs/runbooks/${file}`,
      });
    }
  }

  return state;
}

// ── Project State Reader ────────────────────────────────────────────────────

/** Lê estado do projecto. */
export function readProjectState(
  projectRoot: string,
  nexusDir: string
): ProjectState {
  const state: ProjectState = {
    maturity: null,
    installedCapabilities: [],
    recommendedCapabilities: [],
    knowledgeDebt: null,
    complexity: null,
    projectInfo: {
      name: "",
      stack: [],
      hasGit: false,
      hasCI: false,
      hasTests: false,
      hasTypeScript: false,
      packageCount: 0,
      sourceFileCount: 0,
    },
  };

  // Maturity profile
  const maturityPath = join(nexusDir, "maturity-profile.json");
  if (existsSync(maturityPath)) {
    try {
      const content = JSON.parse(readFileSync(maturityPath, "utf-8"));
      state.maturity = {
        overallScore: content.overallScore,
        dimensions: content.dimensions,
        computedAt: content.computedAt,
      };
      state.installedCapabilities = content.installedCapabilities || [];
      state.recommendedCapabilities = content.recommendedCapabilities || [];
    } catch {
      // skip
    }
  }

  // Knowledge debt
  const reportsDir = join(nexusDir, "reports");
  if (existsSync(reportsDir)) {
    const debtFiles = readdirSync(reportsDir)
      .filter((f) => f.startsWith("knowledge-debt-") && f.endsWith(".json"))
      .sort()
      .slice(-1);
    if (debtFiles.length > 0) {
      try {
        const content = JSON.parse(readFileSync(join(reportsDir, debtFiles[0]), "utf-8"));
        state.knowledgeDebt = {
          totalGaps: content.totalGaps,
          healthScore: content.healthScore,
          detectedAt: content.generatedAt,
        };
      } catch {
        // skip
      }
    }
  }

  // Project info from analyser
  try {
    const analysis = analyseProject(projectRoot);
    state.projectInfo = {
      name: projectRoot.split("/").pop() || "",
      stack: analysis.stack,
      hasGit: analysis.hasGit,
      hasCI: analysis.hasCI,
      hasTests: analysis.hasTests,
      hasTypeScript: analysis.hasTypeScript,
      packageCount: analysis.packageCount,
      sourceFileCount: analysis.sourceFileCount,
    };
  } catch {
    // skip
  }

  return state;
}

// ── Session Memory Reader ───────────────────────────────────────────────────

/** Lê memória da sessão do context buffer. */
export function readSessionMemory(nexusDir: string): SessionMemory {
  const memory: SessionMemory = {
    sessionId: null,
    branch: null,
    operationType: null,
    currentTask: { id: null, type: null, description: null, status: null },
    quickBoard: { emCurso: null, parado: [], proximo: [] },
    reminders: [],
    nextSteps: [],
    blockers: [],
    documentsLoaded: [],
  };

  const bufferPath = join(nexusDir, "governance", "context", "context_buffer.yaml");
  if (!existsSync(bufferPath)) return memory;

  try {
    const content = readFileSync(bufferPath, "utf-8");

    // Parse simple YAML fields
    const sessionMatch = content.match(/session:\s*\n([\s\S]*?)(?=\n\w|\n$)/);
    if (sessionMatch) {
      const sessionBlock = sessionMatch[1];
      const idMatch = sessionBlock.match(/id:\s*"?([^"\n]+)"?/);
      const branchMatch = sessionBlock.match(/branch:\s*"?([^"\n]+)"?/);
      const typeMatch = sessionBlock.match(/operation_type:\s*"?([^"\n]+)"?/);
      memory.sessionId = idMatch ? idMatch[1].trim() : null;
      memory.branch = branchMatch ? branchMatch[1].trim() : null;
      memory.operationType = typeMatch ? typeMatch[1].trim() : null;
    }

    // Current task
    const taskMatch = content.match(/current_task:\s*\n([\s\S]*?)(?=\n\w|\n$)/);
    if (taskMatch) {
      const taskBlock = taskMatch[1];
      const idMatch = taskBlock.match(/id:\s*"?([^"\n]+)"?/);
      const typeMatch = taskBlock.match(/type:\s*"?([^"\n]+)"?/);
      const descMatch = taskBlock.match(/description:\s*"?([^"\n]+)"?/);
      const statusMatch = taskBlock.match(/status:\s*"?([^"\n]+)"?/);
      memory.currentTask = {
        id: idMatch ? idMatch[1].trim() : null,
        type: typeMatch ? typeMatch[1].trim() : null,
        description: descMatch ? descMatch[1].trim() : null,
        status: statusMatch ? statusMatch[1].trim() : null,
      };
    }

    // Reminders
    const remindersMatch = content.match(/reminders:\s*\n([\s\S]*?)(?=\n\w|\n$)/);
    if (remindersMatch) {
      memory.reminders = remindersMatch[1]
        .split("\n")
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*"?/, "").replace(/"?$/, "").trim());
    }

    // Next steps
    const nextMatch = content.match(/next_steps:\s*\n([\s\S]*?)(?=\n\w|\n$)/);
    if (nextMatch) {
      memory.nextSteps = nextMatch[1]
        .split("\n")
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*"?/, "").replace(/"?$/, "").trim());
    }

    // Blockers
    const blockersMatch = content.match(/blockers:\s*\n([\s\S]*?)(?=\n\w|\n$)/);
    if (blockersMatch) {
      memory.blockers = blockersMatch[1]
        .split("\n")
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*"?/, "").replace(/"?$/, "").trim());
    }

    // Documents loaded
    const docsMatch = content.match(/documents_loaded:\s*\n([\s\S]*?)(?=\n\w|\n$)/);
    if (docsMatch) {
      memory.documentsLoaded = docsMatch[1]
        .split("\n")
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*"?/, "").replace(/"?$/, "").trim());
    }
  } catch {
    // skip
  }

  return memory;
}

// ── Consolidation ───────────────────────────────────────────────────────────

/** Consolida todos os estados num único objecto. */
export function consolidateState(
  projectRoot: string,
  nexusDir: string
): NexusState {
  return {
    knowledge: readKnowledgeState(nexusDir),
    project: readProjectState(projectRoot, nexusDir),
    memory: readSessionMemory(nexusDir),
    consolidatedAt: new Date().toISOString(),
  };
}

// ── Report ──────────────────────────────────────────────────────────────────

/** Gera relatório textual do estado consolidado. */
export function stateToText(state: NexusState): string {
  const lines: string[] = [];
  lines.push("# Nexus State Report");
  lines.push(`Consolidated at: ${state.consolidatedAt}`);
  lines.push("");

  // Knowledge
  lines.push("## Knowledge (Permanent)");
  lines.push(`  ADRs: ${state.knowledge.adrs.length}`);
  lines.push(`  Skills: ${state.knowledge.skills.length}`);
  lines.push(`  Contracts: ${state.knowledge.contracts.length}`);
  lines.push(`  Governance docs: ${state.knowledge.governanceDocs.length}`);
  lines.push(`  Scripts: ${state.knowledge.scripts.length}`);
  lines.push(`  Runbooks: ${state.knowledge.runbooks.length}`);
  lines.push("");

  // Project
  lines.push("## Project State (Current)");
  if (state.project.maturity) {
    lines.push(`  Maturity: ${state.project.maturity.overallScore}/100`);
    lines.push(`  Capabilities: ${state.project.installedCapabilities.join(", ")}`);
  }
  if (state.project.knowledgeDebt) {
    lines.push(`  Knowledge debt: ${state.project.knowledgeDebt.totalGaps} gap(s), score ${state.project.knowledgeDebt.healthScore}/100`);
  }
  lines.push(`  Stack: ${state.project.projectInfo.stack.join(", ") || "none detected"}`);
  lines.push("");

  // Memory
  lines.push("## Session Memory (Temporary)");
  lines.push(`  Session: ${state.memory.sessionId || "none"}`);
  lines.push(`  Branch: ${state.memory.branch || "none"}`);
  lines.push(`  Current task: ${state.memory.currentTask.description || "none"}`);
  lines.push(`  Reminders: ${state.memory.reminders.length}`);
  lines.push(`  Next steps: ${state.memory.nextSteps.length}`);
  lines.push(`  Blockers: ${state.memory.blockers.length}`);
  lines.push("");

  return lines.join("\n");
}
