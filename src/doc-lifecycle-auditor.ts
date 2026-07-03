/**
 * doc-lifecycle-auditor.ts — Documentation Lifecycle Auditor
 *
 * Analyses documentation in a project and classifies each document
 * by lifecycle status (planned, in_progress, completed, superseded, stale).
 * Proposes moves to directories that reflect that status.
 *
 * PRINCIPLE: This module SUGGESTS ONLY, never applies.
 * The decision to move documentation is always manual.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { join, relative, dirname, basename } from "node:path";
import { logger } from "./logger.js";

// ── Types ────────────────────────────────────────────────────────────────────

/** Lifecycle status of a document. */
export type DocLifecycleStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "superseded"
  | "stale";

/** Detection result from status markers in content. */
export interface StatusMarkerResult {
  status: DocLifecycleStatus | null;
  confidence: number;
  evidence: string[];
}

/** Cross-reference to another document. */
export interface CrossReference {
  target: string;
  exists: boolean;
}

/** Git correlation signals for a document. */
export interface GitCorrelation {
  lastModified: string;
  referencedFilesExist: boolean;
  recentCommits: boolean;
}

/** Staleness signals for a document. */
export interface StalenessSignals {
  ageInDays: number;
  referencedByOtherDocs: boolean;
  recentCommits: boolean;
}

/** Detection signals collected for a document. */
export interface DetectionSignals {
  statusMarkers: StatusMarkerResult;
  crossReferences: CrossReference[];
  gitCorrelation: GitCorrelation;
  staleness: StalenessSignals;
}

/** Information about a document to classify. */
export interface DocumentInfo {
  path: string;
  relativePath: string;
  title: string;
  content: string;
}

/** Classification result for a document. */
export interface DocumentClassification {
  path: string;
  relativePath: string;
  status: DocLifecycleStatus;
  confidence: number;
  evidence: string[];
  suggestedDestination: string;
  clusterId?: string;
}

/** Cluster of semantically similar documents. */
export interface DocumentCluster {
  id: string;
  description: string;
  documents: string[];
  recommendation: "consolidate" | "supersede" | "keep_separate";
}

/** Proposed move for a document. */
export interface ProposedMove {
  source: string;
  destination: string;
  status: DocLifecycleStatus;
  reason: string;
}

/** Complete lifecycle audit report. */
export interface DocLifecycleReport {
  auditedAt: string;
  totalDocuments: number;
  classifications: DocumentClassification[];
  clusters: DocumentCluster[];
  proposedMoves: ProposedMove[];
  summary: string;
}

/** Result of applying moves. */
export interface MoveResult {
  movesApplied: number;
  movesSkipped: number;
  errors: string[];
}

// ── Status Marker Detection ──────────────────────────────────────────────────

/** Patterns for detecting status markers in document content. */
const STATUS_PATTERNS: Array<{ regex: RegExp; status: DocLifecycleStatus; confidence: number }> = [
  // Completed patterns
  { regex: /\*\*Status:\*\*\s*(?:Concluído|Completed|Done|Finished)/gi, status: "completed", confidence: 0.9 },
  { regex: /Status:\s*(?:Concluído|Completed|Done|Finished)/gi, status: "completed", confidence: 0.85 },
  { regex: /(?:✓|✔|✅)\s*(?:Concluído|Completed|Done)/gi, status: "completed", confidence: 0.8 },

  // Planned patterns
  { regex: /\*\*Status:\*\*\s*(?:Pendente|Pending|Planned|Todo)/gi, status: "planned", confidence: 0.9 },
  { regex: /Status:\s*(?:Pendente|Pending|Planned|Todo)/gi, status: "planned", confidence: 0.85 },
  { regex: /TODO:\s/gi, status: "planned", confidence: 0.6 },
  { regex: /\*\*Objetivo:\*\*/gi, status: "planned", confidence: 0.5 },

  // In progress patterns
  { regex: /\*\*Status:\*\*\s*(?:Em andamento|In Progress|In Progress|Active)/gi, status: "in_progress", confidence: 0.9 },
  { regex: /Status:\s*(?:Em andamento|In Progress|In Progress|Active)/gi, status: "in_progress", confidence: 0.85 },
  { regex: /(?:🔄|⏳|🚧)\s*(?:Em andamento|In Progress)/gi, status: "in_progress", confidence: 0.8 },

  // Superseded patterns
  { regex: /(?:Substituído por|Superseded by|Replaced by|See instead)[:\s]+/gi, status: "superseded", confidence: 0.9 },
  { regex: /\*\*Status:\*\*\s*(?:Substituído|Superseded|Obsolete)/gi, status: "superseded", confidence: 0.85 },
];

/**
 * Detect status markers in document content.
 *
 * @param content - The document content to analyse
 * @returns Status marker detection result with status, confidence, and evidence
 */
export function detectStatusMarkers(content: string): StatusMarkerResult {
  const evidence: string[] = [];
  const statusCounts: Record<DocLifecycleStatus, number> = {
    planned: 0,
    in_progress: 0,
    completed: 0,
    superseded: 0,
    stale: 0,
  };

  // Check each pattern
  for (const pattern of STATUS_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches) {
      for (const match of matches) {
        statusCounts[pattern.status]++;
        evidence.push(match.trim());
      }
    }
  }

  // Find the status with the most evidence
  let maxCount = 0;
  let detectedStatus: DocLifecycleStatus | null = null;

  for (const [status, count] of Object.entries(statusCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedStatus = status as DocLifecycleStatus;
    }
  }

  if (detectedStatus === null || maxCount === 0) {
    return { status: null, confidence: 0, evidence: [] };
  }

  // Calculate confidence based on consistency
  const totalMarkers = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const consistency = maxCount / totalMarkers;
  const confidence = Math.min(0.95, consistency * 0.9);

  return { status: detectedStatus, confidence, evidence };
}

// ── Cross-Reference Detection ────────────────────────────────────────────────

/** Patterns for detecting cross-references in document content. */
const CROSS_REF_PATTERNS: RegExp[] = [
  /(?:ver|see|ref:|refira|consulte|consultar)[:\s]+[`"]?([a-zA-Z0-9_\-/.]+\.md)[`"]?/gi,
  /\[([^\]]+)\]\(([^)]+\.md)\)/g,
  /(?:substituído por|superseded by|replaced by|see instead)[:\s]+[`"]?([a-zA-Z0-9_\-/.]+\.md)[`"]?/gi,
];

/**
 * Detect cross-references to other documents.
 *
 * @param content - The document content to analyse
 * @param allDocs - List of all document paths in the project
 * @returns Array of cross-references found
 */
export function detectCrossReferences(content: string, allDocs: string[]): CrossReference[] {
  const refs: CrossReference[] = [];
  const seen = new Set<string>();

  for (const pattern of CROSS_REF_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const target = match[1] || match[2];
      if (target && !seen.has(target)) {
        seen.add(target);
        const exists = allDocs.some((doc) => doc.endsWith(target) || doc.includes(target));
        refs.push({ target, exists });
      }
    }
  }

  return refs;
}

// ── Semantic Duplication Detection ───────────────────────────────────────────

/**
 * Calculate similarity between two titles using simple word overlap.
 *
 * @param title1 - First title
 * @param title2 - Second title
 * @returns Similarity score between 0 and 1
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const words2 = title2.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = [...set1].filter((w) => set2.has(w));

  return intersection.length / Math.max(set1.size, set2.size);
}

/**
 * Detect clusters of semantically similar documents.
 *
 * @param docs - Array of document information
 * @returns Array of document clusters
 */
export function detectSemanticDuplication(docs: DocumentInfo[]): DocumentCluster[] {
  const clusters: DocumentCluster[] = [];
  const used = new Set<number>();

  for (let i = 0; i < docs.length; i++) {
    if (used.has(i)) continue;

    const docI = docs[i];
    if (!docI) continue;

    const cluster: string[] = [docI.relativePath];
    used.add(i);

    for (let j = i + 1; j < docs.length; j++) {
      if (used.has(j)) continue;

      const docJ = docs[j];
      if (!docJ) continue;

      const similarity = calculateTitleSimilarity(docI.title, docJ.title);
      if (similarity >= 0.5) {
        cluster.push(docJ.relativePath);
        used.add(j);
      }
    }

    if (cluster.length >= 2) {
      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        description: `Documents with similar scope: ${docI.title}`,
        documents: cluster,
        recommendation: "consolidate",
      });
    }
  }

  return clusters;
}

// ── Document Classification ──────────────────────────────────────────────────

/**
 * Determine the suggested destination directory for a document based on status.
 *
 * @param status - The lifecycle status of the document
 * @returns The suggested destination path relative to docs/
 */
function getSuggestedDestination(status: DocLifecycleStatus): string {
  switch (status) {
    case "planned":
    case "in_progress":
      return "_active";
    case "completed":
      return "_archive/completed";
    case "superseded":
      return "_archive/superseded";
    case "stale":
      return "_review";
  }
}

/**
 * Classify a document based on detection signals.
 *
 * @param doc - Document information
 * @param signals - Detection signals collected for the document
 * @returns Classification result with status, confidence, and suggested destination
 */
export function classifyDocument(doc: DocumentInfo, signals: DetectionSignals): DocumentClassification {
  // Priority: status markers > cross-refs > staleness
  let status: DocLifecycleStatus;
  let confidence: number;
  const evidence: string[] = [];

  // 1. Status markers (highest priority)
  if (signals.statusMarkers.status) {
    status = signals.statusMarkers.status;
    confidence = signals.statusMarkers.confidence;
    evidence.push(...signals.statusMarkers.evidence);
  }
  // 2. Cross-references (check for superseded)
  else if (signals.crossReferences.some((r) => !r.exists)) {
    status = "superseded";
    confidence = 0.7;
    evidence.push("References non-existent documents");
  }
  // 3. Staleness (fallback)
  else if (signals.staleness.ageInDays > 30 && !signals.staleness.referencedByOtherDocs && !signals.staleness.recentCommits) {
    status = "stale";
    confidence = 0.6;
    evidence.push(`No references in ${signals.staleness.ageInDays} days`);
  }
  // 4. Default to stale (requires human decision)
  else {
    status = "stale";
    confidence = 0.4;
    evidence.push("No clear status indicators found");
  }

  // Boost confidence when multiple signals agree
  if (signals.statusMarkers.status && signals.gitCorrelation.referencedFilesExist) {
    confidence = Math.min(0.95, confidence + 0.1);
    evidence.push("Git correlation confirms status");
  }

  if (signals.staleness.referencedByOtherDocs && status !== "stale") {
    confidence = Math.min(0.95, confidence + 0.05);
    evidence.push("Referenced by other documents");
  }

  return {
    path: doc.path,
    relativePath: doc.relativePath,
    status,
    confidence,
    evidence,
    suggestedDestination: getSuggestedDestination(status),
  };
}

// ── Data Readers ─────────────────────────────────────────────────────────────

/**
 * Discover all markdown documents in the project that should be audited.
 *
 * @param projectRoot - The project root directory
 * @param nexusDir - The nexus-system directory
 * @returns Array of document information
 */
function discoverDocuments(projectRoot: string, nexusDir: string): DocumentInfo[] {
  const docs: DocumentInfo[] = [];
  const dirsToScan = [
    join(nexusDir, "docs"),
    join(nexusDir, "plans"),
    join(projectRoot, "plans"),
  ];

  for (const dir of dirsToScan) {
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir, { recursive: true })
      .filter((f): f is string => typeof f === "string" && f.endsWith(".md") && !basename(f as string).startsWith("README"));

    for (const file of files) {
      const fullPath = join(dir, file as string);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf-8");
      const relPath = relative(projectRoot, fullPath);

      // Extract title from first heading or filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch?.[1] ?? basename(file as string, ".md");

      docs.push({
        path: fullPath,
        relativePath: relPath,
        title,
        content,
      });
    }
  }

  return docs;
}

/**
 * Get recent git commits for a specific file.
 *
 * @param filePath - The file path to check
 * @param days - Number of days to look back
 * @returns Whether there are recent commits
 */
function hasRecentCommits(filePath: string, days: number): boolean {
  try {
    const { execSync } = require("node:child_process");
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const result = execSync(
      `git log --since="${cutoff}" --oneline -- "${filePath}" 2>/dev/null`,
      { encoding: "utf-8", timeout: 5000 }
    ).trim();
    return result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get the last modification date of a file from git.
 *
 * @param filePath - The file path to check
 * @returns ISO date string of last modification, or current date if git unavailable
 */
function getLastModified(filePath: string): string {
  try {
    const { execSync } = require("node:child_process");
    const result = execSync(
      `git log -1 --format="%aI" -- "${filePath}" 2>/dev/null`,
      { encoding: "utf-8", timeout: 5000 }
    ).trim();
    return result || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// ── Main Auditor ─────────────────────────────────────────────────────────────

/**
 * Audit documentation lifecycle status in a project.
 *
 * @param projectRoot - The project root directory
 * @param nexusDir - The nexus-system directory
 * @returns Complete lifecycle audit report
 */
export function auditDocLifecycle(projectRoot: string, nexusDir: string): DocLifecycleReport {
  const docs = discoverDocuments(projectRoot, nexusDir);
  const allDocPaths = docs.map((d) => d.path);

  const classifications: DocumentClassification[] = [];
  const clusters = detectSemanticDuplication(docs);

  for (const doc of docs) {
    // Collect detection signals
    const statusMarkers = detectStatusMarkers(doc.content);
    const crossReferences = detectCrossReferences(doc.content, allDocPaths);

    const lastModified = getLastModified(doc.path);
    const ageInDays = Math.floor(
      (Date.now() - new Date(lastModified).getTime()) / (24 * 60 * 60 * 1000)
    );

    const gitCorrelation: GitCorrelation = {
      lastModified,
      referencedFilesExist: crossReferences.some((r) => r.exists),
      recentCommits: hasRecentCommits(doc.path, 30),
    };

    const staleness: StalenessSignals = {
      ageInDays,
      referencedByOtherDocs: docs.some(
        (d) => d.path !== doc.path && d.content.includes(basename(doc.path))
      ),
      recentCommits: gitCorrelation.recentCommits,
    };

    const signals: DetectionSignals = {
      statusMarkers,
      crossReferences,
      gitCorrelation,
      staleness,
    };

    const classification = classifyDocument(doc, signals);

    // Assign cluster ID if document belongs to a cluster
    const cluster = clusters.find((c) => c.documents.includes(doc.relativePath));
    if (cluster) {
      classification.clusterId = cluster.id;
    }

    classifications.push(classification);
  }

  // Generate proposed moves
  const proposedMoves: ProposedMove[] = classifications
    .filter((c) => c.confidence >= 0.5)
    .map((c) => ({
      source: c.relativePath,
      destination: join("nexus-system", "docs", c.suggestedDestination, basename(c.path)),
      status: c.status,
      reason: c.evidence.join("; "),
    }));

  // Generate summary
  const statusCounts: Record<DocLifecycleStatus, number> = {
    planned: 0,
    in_progress: 0,
    completed: 0,
    superseded: 0,
    stale: 0,
  };
  for (const c of classifications) {
    statusCounts[c.status]++;
  }

  const summary = [
    `Analysed ${docs.length} documents.`,
    `Found: ${statusCounts.planned} planned, ${statusCounts.in_progress} in progress,`,
    `${statusCounts.completed} completed, ${statusCounts.superseded} superseded,`,
    `${statusCounts.stale} stale.`,
    `${clusters.length} cluster(s) detected.`,
    `${proposedMoves.length} move(s) proposed.`,
  ].join(" ");

  return {
    auditedAt: new Date().toISOString(),
    totalDocuments: docs.length,
    classifications,
    clusters,
    proposedMoves,
    summary,
  };
}

// ── Apply Moves ──────────────────────────────────────────────────────────────

/**
 * Apply proposed moves to organize documentation.
 *
 * @param report - The lifecycle audit report with proposed moves
 * @param nexusDir - The nexus-system directory
 * @param dryRun - If true, only simulate moves without applying
 * @returns Result of the move operation
 */
export function applyMoves(report: DocLifecycleReport, nexusDir: string, dryRun: boolean): MoveResult {
  const result: MoveResult = { movesApplied: 0, movesSkipped: 0, errors: [] };

  for (const move of report.proposedMoves) {
    const sourcePath = join(nexusDir, "..", move.source);
    const destDir = join(nexusDir, "docs", move.destination.replace("nexus-system/docs/", ""));
    const destPath = join(destDir, basename(move.source));

    if (!existsSync(sourcePath)) {
      result.errors.push(`Source not found: ${move.source}`);
      result.movesSkipped++;
      continue;
    }

    if (dryRun) {
      result.movesSkipped++;
      continue;
    }

    try {
      // Create destination directory
      mkdirSync(destDir, { recursive: true });

      // Move file
      renameSync(sourcePath, destPath);
      result.movesApplied++;

      // Write CHANGELOG entry
      const changelogPath = join(nexusDir, "docs", "_archive", "CHANGELOG.md");
      const entry = [
        `## ${new Date().toISOString().split("T")[0]}`,
        "",
        `- **Moved:** \`${move.source}\` → \`${move.destination}\``,
        `- **Status:** ${move.status}`,
        `- **Reason:** ${move.reason}`,
        "",
      ].join("\n");

      if (existsSync(changelogPath)) {
        const existing = readFileSync(changelogPath, "utf-8");
        writeFileSync(changelogPath, existing + "\n" + entry);
      } else {
        mkdirSync(dirname(changelogPath), { recursive: true });
        writeFileSync(changelogPath, "# Documentation Lifecycle Changelog\n\n" + entry);
      }
    } catch (error) {
      result.errors.push(`Failed to move ${move.source}: ${error}`);
      result.movesSkipped++;
    }
  }

  return result;
}

// ── Report Writer ────────────────────────────────────────────────────────────

/**
 * Write the lifecycle audit report to a JSON file.
 *
 * @param nexusDir - The nexus-system directory
 * @param report - The lifecycle audit report
 * @returns The filename of the written report
 */
export function writeDocLifecycleReport(nexusDir: string, report: DocLifecycleReport): string {
  const reportsDir = join(nexusDir, "reports");
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `doc-lifecycle-${report.auditedAt.split("T")[0]}.json`;
  const filepath = join(reportsDir, filename);

  writeFileSync(filepath, JSON.stringify(report, null, 2));
  logger.info("DocLifecycleAuditor", `Report written to ${filepath}`);

  return filename;
}
