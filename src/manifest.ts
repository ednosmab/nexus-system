/**
 * manifest.ts — Installation Manifest for Change Detection
 *
 * Tracks what was installed, when, and with what hashes.
 * Used by `nexus update` to detect changes in templates.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Manifest {
  /** CLI version at install/upgrade time */
  cliVersion: string;
  /** ISO timestamp of last install/upgrade */
  installedAt: string;
  /** SHA-256 hashes of each template file relative to nexus-system/ */
  templateHashes: Record<string, string>;
  /** Capabilities installed */
  capabilities: string[];
  /** Maturity profile score at install time */
  maturityScore: number;
}

export interface ManifestDiff {
  /** Files added in new version */
  added: string[];
  /** Files removed in new version */
  removed: string[];
  /** Files changed (hash mismatch) */
  changed: string[];
  /** Files unchanged */
  unchanged: string[];
}

// ── Core Functions ───────────────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a file's content.
 */
export function computeFileHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Read manifest from nexus-system/manifest.json.
 * Returns null if not found or invalid.
 */
export function readManifest(nexusDir: string): Manifest | null {
  const manifestPath = join(nexusDir, "manifest.json");

  if (!existsSync(manifestPath)) return null;

  try {
    const raw = readFileSync(manifestPath, "utf-8");
    const data = JSON.parse(raw);

    // Basic validation
    if (
      typeof data.cliVersion !== "string" ||
      typeof data.installedAt !== "string" ||
      typeof data.templateHashes !== "object" ||
      !Array.isArray(data.capabilities)
    ) {
      return null;
    }

    return data as Manifest;
  } catch {
    return null;
  }
}

/**
 * Write manifest to nexus-system/manifest.json.
 */
export function writeManifest(nexusDir: string, manifest: Manifest): void {
  const manifestPath = join(nexusDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
}

/**
 * Scan nexus-system/ directory and compute hashes for all files.
 * Returns record of relative paths → SHA-256 hashes.
 */
export function scanTemplateHashes(nexusDir: string): Record<string, string> {
  const hashes: Record<string, string> = {};

  function walkDir(dir: string, prefix: string): void {
    const { readdirSync, statSync } = require("node:fs") as typeof import("node:fs");
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        walkDir(fullPath, relativePath);
      } else if (entry.isFile()) {
        try {
          const content = readFileSync(fullPath, "utf-8");
          hashes[relativePath] = computeFileHash(content);
        } catch {
          // Skip binary files or unreadable files
        }
      }
    }
  }

  walkDir(nexusDir, "");
  return hashes;
}

/**
 * Create a new manifest for a fresh installation.
 */
export function createManifest(
  cliVersion: string,
  nexusDir: string,
  capabilities: string[],
  maturityScore: number
): Manifest {
  return {
    cliVersion,
    installedAt: new Date().toISOString(),
    templateHashes: scanTemplateHashes(nexusDir),
    capabilities,
    maturityScore,
  };
}

/**
 * Compare two manifests and return the diff.
 */
export function diffManifests(
  oldManifest: Manifest,
  newManifest: Manifest
): ManifestDiff {
  const oldFiles = new Set(Object.keys(oldManifest.templateHashes));
  const newFiles = new Set(Object.keys(newManifest.templateHashes));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const file of newFiles) {
    if (!oldFiles.has(file)) {
      added.push(file);
    } else if (
      oldManifest.templateHashes[file] !== newManifest.templateHashes[file]
    ) {
      changed.push(file);
    } else {
      unchanged.push(file);
    }
  }

  for (const file of oldFiles) {
    if (!newFiles.has(file)) {
      removed.push(file);
    }
  }

  return { added, removed, changed, unchanged };
}

/**
 * Update manifest after an upgrade.
 * Preserves existing hashes for unchanged files, updates changed/new ones.
 */
export function updateManifest(
  currentManifest: Manifest | null,
  cliVersion: string,
  nexusDir: string,
  capabilities: string[],
  maturityScore: number
): Manifest {
  const newHashes = scanTemplateHashes(nexusDir);

  if (currentManifest) {
    // Merge: keep old hashes, update with new ones
    return {
      cliVersion,
      installedAt: new Date().toISOString(),
      templateHashes: { ...currentManifest.templateHashes, ...newHashes },
      capabilities,
      maturityScore,
    };
  }

  return createManifest(cliVersion, nexusDir, capabilities, maturityScore);
}
