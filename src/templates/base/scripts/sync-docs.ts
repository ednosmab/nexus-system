#!/usr/bin/env npx tsx
/**
 * sync-docs.ts — Documentation Sync Script (Template)
 *
 * Regenerates SYSTEM_MAP.md from the current directory structure
 * under shitenno/. Called automatically by doc-sync-hook or
 * manually via `shugo sync-docs`.
 *
 * PRINCIPLE: Documentation stays in sync with actual structure.
 *
 * This is the template version installed via `shugo init`.
 * The full-featured version lives in the shitenno-cli repo.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────

const ROOT = join(__dirname, "..", "..");
const SHITENNO_DIR = join(ROOT, "shitenno");
const SYSTEM_MAP_PATH = join(SHITENNO_DIR, "governance", "SYSTEM_MAP.md");

// ── Helpers ─────────────────────────────────────────────────────────────

function walkDir(dir: string, prefix = ""): string[] {
  const entries: string[] = [];

  if (!existsSync(dir)) return entries;

  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.name.startsWith(".") || item.name === "node_modules") continue;

    const relPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.isDirectory()) {
      entries.push(`${relPath}/`);
      entries.push(...walkDir(join(dir, item.name), relPath));
    } else {
      entries.push(relPath);
    }
  }

  return entries;
}

// ── SYSTEM_MAP Regeneration ─────────────────────────────────────────────

function regenerateSystemMap(): boolean {
  if (!existsSync(SHITENNO_DIR)) {
    console.log("  ⚠ shitenno/ not found, skipping");
    return false;
  }

  if (!existsSync(SYSTEM_MAP_PATH)) {
    console.log("  ⚠ SYSTEM_MAP.md not found, skipping");
    return false;
  }

  const files = walkDir(SHITENNO_DIR);
  const tree = files
    .map((f) => `│   ${f}`)
    .join("\n");

  let content = readFileSync(SYSTEM_MAP_PATH, "utf-8");

  const startMarker = "<!-- SYNC:START -->";
  const endMarker = "<!-- SYNC:END -->";

  if (content.includes(startMarker) && content.includes(endMarker)) {
    const regex = new RegExp(
      `${startMarker}[\\s\\S]*?${endMarker}`,
      "g"
    );
    content = content.replace(
      regex,
      `${startMarker}\n\`\`\`\n${tree}\n\`\`\`\n${endMarker}`
    );
  }

  writeFileSync(SYSTEM_MAP_PATH, content, "utf-8");
  return true;
}

// ── Main ────────────────────────────────────────────────────────────────

function main(): void {
  const quiet = process.argv.includes("--quiet");

  if (!quiet) {
    console.log("\n📄 sync-docs — Regenerating documentation...\n");
  }

  const updated = regenerateSystemMap();

  if (updated && !quiet) {
    console.log("  ✔ SYSTEM_MAP.md updated");
  }

  if (!quiet) {
    console.log("\n✅ Documentation sync complete\n");
  }
}

main();
