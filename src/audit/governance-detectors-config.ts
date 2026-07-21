/**
 * Audit module — Governance config detectors
 *
 * Configuration and structure-related health issue detectors.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { logger } from "../logger.js";
import type { HealthIssue } from "./types.js";
import { listSkills } from "../knowledge-loader.js";
import { ISSUE_TYPE_TO_SKILL } from "./skill-refs.js";

export function detectAdrCoverage(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const adrDir = join(shitennoDir, "docs", "adrs");

  if (!existsSync(adrDir)) {
    issues.push({
      type: "adr_coverage_gap",
      severity: 1,
      description: "Directório docs/adrs/ não existe — decisões arquiteturais não rastreadas",
      location: "shitenno/docs/adrs/",
      recommendation: "Criar directório docs/adrs/ e adicionar ADRs para decisões existentes",
      confidence: 0.95,
    });
    return issues;
  }

  try {
    const adrFiles = readdirSync(adrDir).filter(
      (f) => f.endsWith(".md") && !f.startsWith("ADR-TEMPLATE")
    );
    if (adrFiles.length === 0) {
      issues.push({
        type: "adr_coverage_gap",
        severity: 1,
        description: "Nenhum ADR encontrado em docs/adrs/ — decisões não documentadas",
        location: "shitenno/docs/adrs/",
        recommendation: "Criar ADRs para decisões arquiteturais significativas",
        confidence: 0.95,
      });
    }
  } catch (err) {
    logger.debug("governance-detectors", "Error in detectAdrCoverage:", err);
  }

  return issues;
}

export function detectUnreferencedDirs(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const docsDir = join(shitennoDir, "docs");
  if (!existsSync(docsDir)) return issues;

  const governanceFiles = [
    "governance/WORKFLOW.md",
    "governance/SYSTEM_MAP.md",
    "docs/AGENTS.md",
    "docs/DESDO.md",
    "docs/capabilities.md",
  ];

  let governanceContent = "";
  for (const doc of governanceFiles) {
    const path = join(shitennoDir, doc);
    if (existsSync(path)) {
      try { governanceContent += readFileSync(path, "utf-8") + "\n"; } catch (readErr) { logger.debug("governance-detectors", "Error reading governance file:", readErr); }
    }
  }

  try {
    const entries = readdirSync(docsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (["skills", "adrs", "history", "runbooks", "plans"].includes(entry.name)) continue;
      const dirPattern = new RegExp(`docs/${entry.name}/|docs/${entry.name}\\b`);
      if (!dirPattern.test(governanceContent)) {
        issues.push({
          type: "orphan_dir",
          severity: 1,
          description: `Directório "docs/${entry.name}" existe mas não é referenciado em nenhum documento governance`,
          location: `shitenno/docs/${entry.name}/`,
          recommendation: `Adicionar referência a "docs/${entry.name}" em SYSTEM_MAP.md ou remover o directório`,
          confidence: 0.75,
        });
      }
    }
  } catch (scanErr) { logger.debug("governance-detectors", "Error in detectUnreferencedDirs:", scanErr); }

  return issues;
}

export function detectReportNaming(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const reportsDir = join(shitennoDir, "reports");
  if (!existsSync(reportsDir)) return issues;

  const validPattern = /^(health|complexity|doc-lifecycle|pattern)(-[a-z0-9]+(-[a-z0-9]+)*)?-\d{4}-\d{2}-\d{2}.*\.json$/;

  try {
    const files = readdirSync(reportsDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      if (file === "README.md") continue;
      if (!validPattern.test(file)) {
        issues.push({
          type: "broken_ref",
          severity: 1,
          description: `Report "${file}" não segue a convenção de nomenclatura (<tipo>-YYYY-MM-DD.json)`,
          location: `shitenno/reports/${file}`,
          recommendation: `Renomear "${file}" para seguir o padrão <tipo>-YYYY-MM-DD.json`,
          confidence: 0.75,
        });
      }
    }
  } catch (err) { logger.debug("governance-detectors", "Error in detectReportNaming:", err); }

  return issues;
}

function checkP0FileExists(file: string, shitennoDir: string, locations: string[]): boolean {
  return locations.some((loc) => existsSync(join(shitennoDir, loc, file)));
}

function detectBareWordRefsInFile(content: string, shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const p0Files = ["AGENTS.md", "FORBIDDEN_OPERATIONS.md", "DESDO.md", "Requisitos_plataforma.md", "CONTEXT_HIERARCHY.md"];
  const p0Line = content.split("\n").find((l) => l.includes("Requisitos_plataforma"));
  if (!p0Line) return issues;
  const locations = ["docs/", "cognition/context/", "governance/", ""];
  for (const file of p0Files) {
    if (p0Line.includes(file) && !checkP0FileExists(file, shitennoDir, locations)) {
      issues.push({ type: "bare_word_ref", severity: 3,
        description: `Referência P0 obrigatória "${file}" não existe em nenhuma localização`,
        location: "shitenno/docs/AGENTS.md", recommendation: `Criar "${file}" ou remover da lista P0 em AGENTS.md`, confidence: 0.7 });
    }
  }
  return issues;
}

export function detectBareWordRefs(shitennoDir: string): HealthIssue[] {
  const docPath = join(shitennoDir, "docs/AGENTS.md");
  if (!existsSync(docPath)) return [];
  try { return detectBareWordRefsInFile(readFileSync(docPath, "utf-8"), shitennoDir); }
  catch (err) { logger.debug("governance-detectors", "Error in detectBareWordRefs:", err); return []; }
}

function isBranchConvention(dirPart: string): boolean {
  return ["feat/", "fix/", "hotfix/", "chore/", "docs/", "refactor/"].includes(dirPart) || dirPart.includes("git ") || dirPart.includes("&&");
}

function scanDocForTemplateDirRefs(content: string, doc: string, shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const templateRefRegex = /`([^`\n]*<[^`\n>]+>[^`\n]*)`/g;
  let match;
  while ((match = templateRefRegex.exec(content)) !== null) {
    const ref = match[1];
    if (!ref) continue;
    const dirPart = ref.split(/[<]/)[0];
    if (!dirPart || !dirPart.includes("/") || dirPart.startsWith("shitenno/") || isBranchConvention(dirPart)) continue;
    if (!existsSync(join(shitennoDir, dirPart))) {
      issues.push({ type: "template_dir_ref", severity: 2,
        description: `Directório "${dirPart}" referenciado por template "${ref}" não existe`,
        location: `shitenno/${doc}`, recommendation: `Criar directório "${dirPart}" ou corrigir referência em "${doc}"`, confidence: 0.75 });
    }
  }
  return issues;
}

export function detectTemplateDirRefs(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const docsToScan = ["docs/AGENTS.md", "docs/capabilities.md", "cognition/context/CONTEXT_HIERARCHY.md"];
  for (const doc of docsToScan) {
    const path = join(shitennoDir, doc);
    if (!existsSync(path)) continue;
    try { issues.push(...scanDocForTemplateDirRefs(readFileSync(path, "utf-8"), doc, shitennoDir)); }
    catch (err) { logger.debug("governance-detectors", "Error scanning template dir refs:", err); }
  }
  return issues;
}

const KNOWN_CORRECTIONS: Record<string, string> = {
  "context_buffer.md": "context_buffer.yaml",
  "context_buffer.json": "context_buffer.yaml",
};

const EXTENSION_SWAP: Record<string, string> = {
  ".ts": ".json",
  ".json": ".ts",
  ".md": ".yaml",
  ".yaml": ".md",
  ".js": ".ts",
  ".txt": ".md",
};

const DOCS_TO_SCAN = [
  "docs/AGENTS.md",
  "governance/WORKFLOW.md",
  "docs/CONCEPTUAL_MODEL.md",
  "docs/capabilities.md",
  "cognition/context/CONTEXT_HIERARCHY.md",
  "governance/agents/AI-CONTRACT-reviewer-v1.yaml",
  "governance/agents/AI-CONTRACT-planner-v1.yaml",
  "governance/agents/AI-CONTRACT-orchestrator-v1.yaml",
  "governance/agents/AI-CONTRACT-executor-v1.yaml",
];

function findFileInDirs(baseName: string, shitennoDir: string, projectRoot: string, docDir: string): boolean {
  return existsSync(join(docDir, baseName)) ||
    existsSync(join(shitennoDir, "governance/context", baseName)) ||
    existsSync(join(shitennoDir, baseName)) ||
    existsSync(join(projectRoot, baseName));
}

interface FileCheckContext {
  content: string;
  doc: string;
  shitennoDir: string;
  projectRoot: string;
  docDir: string;
}

function checkKnownCorrections(ctx: FileCheckContext): HealthIssue[] {
  const issues: HealthIssue[] = [];
  for (const [wrongName, correctName] of Object.entries(KNOWN_CORRECTIONS)) {
    if (ctx.content.includes(wrongName) && findFileInDirs(correctName, ctx.shitennoDir, ctx.projectRoot, ctx.docDir)) {
      issues.push({
        type: "extension_mismatch",
        severity: 2,
        description: `Referência "${wrongName}" usa extensão errada — ficheiro real é "${correctName}"`,
        location: `shitenno/${ctx.doc}`,
        recommendation: `Corrigir "${wrongName}" para "${correctName}" em "${ctx.doc}"`,
        confidence: 0.7,
      });
    }
  }
  return issues;
}

function checkSwappedExtensions(ctx: FileCheckContext): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const refRegex = /`([a-zA-Z0-9_/.-]+)(\.(?:md|ts|js|yaml|json|txt))`/g;
  let match;
  while ((match = refRegex.exec(ctx.content)) !== null) {
    const baseName = match[1] as string;
    const ext = match[2] as string;
    if (!baseName || baseName.includes("*") || baseName.includes("[") || baseName.includes("<") || baseName.includes("YYYY") || baseName.includes("MM-DD")) continue;

    const fullName = `${baseName}${ext}`;
    if (KNOWN_CORRECTIONS[fullName]) continue;
    if (findFileInDirs(fullName, ctx.shitennoDir, ctx.projectRoot, ctx.docDir)) continue;

    const swappedExt = EXTENSION_SWAP[ext];
    if (!swappedExt) continue;

    const swappedName = `${baseName}${swappedExt}`;
    if (findFileInDirs(swappedName, ctx.shitennoDir, ctx.projectRoot, ctx.docDir)) {
      issues.push({
        type: "extension_mismatch",
        severity: 2,
        description: `Referência "${fullName}" usa extensão errada — ficheiro real é "${swappedName}"`,
        location: `shitenno/${ctx.doc}`,
        recommendation: `Corrigir "${fullName}" para "${swappedName}" em "${ctx.doc}"`,
        confidence: 0.75,
      });
    }
  }
  return issues;
}

export function detectExtensionMismatch(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const projectRoot = join(shitennoDir, "..");

  for (const doc of DOCS_TO_SCAN) {
    const path = join(shitennoDir, doc);
    if (!existsSync(path)) continue;
    try {
      const content = readFileSync(path, "utf-8");
      const docDir = dirname(path);
      const ctx: FileCheckContext = { content, doc, shitennoDir, projectRoot, docDir };
      issues.push(...checkKnownCorrections(ctx));
      issues.push(...checkSwappedExtensions(ctx));
    } catch (err) { logger.debug("governance-detectors", "Error scanning extension mismatch:", err); }
  }
  return issues;
}

export function detectSystemMapMismatch(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const systemMapPath = join(shitennoDir, "governance/SYSTEM_MAP.md");
  if (!existsSync(systemMapPath)) return issues;

  try {
    const content = readFileSync(systemMapPath, "utf-8");
    const treeEntryRegex = /[├└]──\s+`?([^\s`]+)`?/g;
    const mapEntries = new Set<string>();
    let match;
    while ((match = treeEntryRegex.exec(content)) !== null) {
      if (match[1]) mapEntries.add(match[1].replace(/\/$/, ""));
    }

    const docsDir = join(shitennoDir, "docs");
    if (existsSync(docsDir)) {
      const entries = readdirSync(docsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !mapEntries.has(entry.name)) {
          issues.push({
            type: "system_map_mismatch",
            severity: 1,
            description: `Directório "docs/${entry.name}" existe mas não está listado no SYSTEM_MAP.md`,
            location: "shitenno/governance/SYSTEM_MAP.md",
            recommendation: `Adicionar "docs/${entry.name}" à árvore em SYSTEM_MAP.md`,
            confidence: 0.75,
          });
        }
      }
    }
  } catch (err) { logger.debug("governance-detectors", "Error in detectSystemMapMismatch:", err); }
  return issues;
}

export function detectBrokenCommands(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const pkgPath = join(shitennoDir, "package.json");
  if (existsSync(pkgPath)) return issues;

  const docsToScan = ["governance/WORKFLOW.md", "docs/AGENTS.md"];
  const commandRegex = /pnpm run ([a-zA-Z0-9:-]+)/g;
  const brokenCommands = new Set<string>();

  for (const doc of docsToScan) {
    const path = join(shitennoDir, doc);
    if (!existsSync(path)) continue;
    try {
      const content = readFileSync(path, "utf-8");
      let match;
      while ((match = commandRegex.exec(content)) !== null) {
        if (match[1]) brokenCommands.add(match[1]);
      }
    } catch (err) { logger.debug("governance-detectors", "Error scanning broken commands:", err); }
  }

  if (brokenCommands.size > 0) {
    issues.push({
      type: "broken_command",
      severity: 2,
      description: `${brokenCommands.size} comando(s) pnpm run não executável(s) sem package.json: ${Array.from(brokenCommands).join(", ")}`,
      location: "shitenno/",
      recommendation: "Criar shitenno/package.json com os scripts definidos",
      confidence: 0.95,
    });
  }
  return issues;
}

export function detectP0Inconsistency(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const agentsPath = join(shitennoDir, "docs/AGENTS.md");
  const contextPath = join(shitennoDir, "cognition/context/CONTEXT_HIERARCHY.md");
  if (!existsSync(agentsPath) || !existsSync(contextPath)) return issues;

  try {
    const agentsContent = readFileSync(agentsPath, "utf-8");
    const contextContent = readFileSync(contextPath, "utf-8");
    const p0Files = [
      "AGENTS.md",
      "FORBIDDEN_OPERATIONS.md",
      "DESDO.md",
      "Requisitos_plataforma.md",
      "CONTEXT_HIERARCHY.md",
    ];

    const agentsP0 = new Set<string>();
    const contextP0 = new Set<string>();

    for (const file of p0Files) {
      if (agentsContent.includes(file)) agentsP0.add(file);
      if (contextContent.includes(file)) contextP0.add(file);
    }

    for (const file of agentsP0) {
      if (!contextP0.has(file)) {
        issues.push({
          type: "p0_inconsistency",
          severity: 1,
          description: `"${file}" está na lista P0 de AGENTS.md mas não na de CONTEXT_HIERARCHY.md`,
          location: "shitenno/docs/AGENTS.md",
          recommendation: `Verificar se "${file}" deve ser P0 em ambos os documentos`,
          confidence: 0.7,
        });
      }
    }
    for (const file of contextP0) {
      if (!agentsP0.has(file)) {
        issues.push({
          type: "p0_inconsistency",
          severity: 1,
          description: `"${file}" está na lista P0 de CONTEXT_HIERARCHY.md mas não na de AGENTS.md`,
          location: "shitenno/cognition/context/CONTEXT_HIERARCHY.md",
          recommendation: `Verificar se "${file}" deve ser P0 em ambos os documentos`,
          confidence: 0.7,
        });
      }
    }
  } catch (err) { logger.debug("governance-detectors", "Error in detectP0Inconsistency:", err); }
  return issues;
}

export function detectTripleMaturityScore(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const fpPath = join(shitennoDir, "fingerprint.json");
  const mpPath = join(shitennoDir, "maturity-profile.json");
  const briefingPath = join(shitennoDir, "BRIEFING.md");

  const scores: { source: string; value: number | null }[] = [];

  if (existsSync(fpPath)) {
    try {
      const data = JSON.parse(readFileSync(fpPath, "utf-8"));
      scores.push({ source: "fingerprint.json", value: data.maturityScore ?? null });
    } catch (fpErr) { logger.debug("governance-detectors", "Error reading fingerprint.json:", fpErr); }
  }
  if (existsSync(mpPath)) {
    try {
      const data = JSON.parse(readFileSync(mpPath, "utf-8"));
      scores.push({ source: "maturity-profile.json", value: data.overallScore ?? null });
    } catch (mpErr) { logger.debug("governance-detectors", "Error reading maturity-profile.json:", mpErr); }
  }
  if (existsSync(briefingPath)) {
    try {
      const content = readFileSync(briefingPath, "utf-8");
      const match = content.match(/Maturity:\s*(\d+)/);
      scores.push({ source: "BRIEFING.md", value: match ? Number(match[1]) : null });
    } catch (bErr) { logger.debug("governance-detectors", "Error reading BRIEFING.md:", bErr); }
  }

  const valid = scores.filter((s) => s.value !== null);
  if (valid.length >= 2) {
    const values = valid.map((s) => s.value!);
    const unique = new Set(values);
    if (unique.size > 1) {
      const details = valid.map((s) => `${s.source}: ${s.value}`).join(", ");
      issues.push({
        type: "triple_maturity_score",
        severity: 3,
        description: `Scores de maturidade inconsistentes: ${details}`,
        location: "shitenno/",
        recommendation: "Reconciliar — todos os ficheiros devem reflectir o mesmo valor",
        confidence: 0.9,
      });
    }
  }
  return issues;
}

export function detectEmptyStack(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const fpPath = join(shitennoDir, "fingerprint.json");
  if (!existsSync(fpPath)) return issues;

  try {
    const data = JSON.parse(readFileSync(fpPath, "utf-8"));
    if (Array.isArray(data.stack) && data.stack.length === 0) {
      issues.push({
        type: "empty_stack",
        severity: 3,
        description: "fingerprint.json tem stack: [] vazio — projecto TypeScript não detectado",
        location: "shitenno/fingerprint.json",
        recommendation: 'Actualizar stack para ["typescript"] ou re-executar fingerprint',
        confidence: 0.9,
      });
    }
  } catch (err) { logger.debug("governance-detectors", "Error in detectEmptyStack:", err); }
  return issues;
}



// ── Orphan Skills Detector ────────────────────────────────────────────────

/**
 * Detect skills that have no associated detector — they exist only as prose,
 * with no automated checking. This gives visibility into how much of the
 * skill documentation still lacks corresponding code checks.
 */
export function detectOrphanSkills(shitennoDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  try {
    const skills = listSkills(shitennoDir);
    const referencedSkills = new Set(Object.values(ISSUE_TYPE_TO_SKILL));

    for (const skill of skills) {
      if (!referencedSkills.has(skill.name)) {
        issues.push({
          type: "orphan_skill",
          severity: 1,
          description: `Skill "${skill.name}" não tem nenhum detector associado — só existe como prosa, sem checagem automática`,
          location: `docs/skills/${skill.filename}`,
          recommendation: `Se a skill documenta uma prática checável por código, considerar criar um detector e registrar em ISSUE_TYPE_TO_SKILL`,
          confidence: 0.7, // heuristic — not every skill needs a detector (e.g. tdd_workflow.md is process, not code pattern)
        });
      }
    }
  } catch (err) { logger.debug("governance-detectors", "Error in detectOrphanSkills:", err); }
  return issues;
}

