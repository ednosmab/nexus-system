/**
 * backlog-parser.ts — Parser for BACKLOG.md
 *
 * Reads BACKLOG.md and extracts backlog items defined with the format:
 * ### ID Title
 * | **Campo** | Valor |
 * ...
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface BacklogItem {
  id: string;
  title: string;
  state: string; // The raw status field, corresponding to BacklogState
  severity: string;
  priority: string;
  owner: string;
  description: string;
}

const BACKLOG_DIR = "docs/backlog";
const ACTIVE_PATH = join(BACKLOG_DIR, "ACTIVE.md");
const DONE_PATH = join(BACKLOG_DIR, "DONE.md");

/**
 * Get the appropriate backlog file path based on status.
 * Items with "Done" status go to DONE.md, others to ACTIVE.md.
 */
export function getBacklogPath(status: string): string {
  const normalized = status.toLowerCase().trim();
  if (normalized === "done" || normalized.includes("done")) {
    return DONE_PATH;
  }
  return ACTIVE_PATH;
}

function parseTableField(line: string): { key: string; value: string } | null {
  const match = line.match(/\*\*(\w+)\*\*\s*\|\s*(.+?)\s*\|?\s*$/);
  if (!match || !match[1] || !match[2]) return null;
  return { key: match[1], value: match[2].trim().replace(/\|$/, "").trim() };
}

function applyFieldToItem(item: Partial<BacklogItem>, key: string, value: string): void {
  switch (key) {
    case "Status": item.state = value; break;
    case "Severidade": item.severity = value; break;
    case "Prioridade": item.priority = value; break;
    case "Owner": item.owner = value; break;
    case "Descricao": item.description = value; break;
  }
}

/**
 * Parse a backlog file and extract items with their states and properties.
 */
export function parseBacklog(backlogPath: string): BacklogItem[] {
  if (!existsSync(backlogPath)) return [];

  const items: BacklogItem[] = [];
  const lines = readFileSync(backlogPath, "utf-8").split("\n");
  let currentSection = "";
  let currentItem: Partial<BacklogItem> | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^## (P[0-9]+)\s/);
    if (sectionMatch) { currentSection = sectionMatch[1]!; continue; }

    const itemMatch = line.match(/^### (.+)/);
    if (itemMatch) {
      if (currentItem?.id) items.push(currentItem as BacklogItem);
      const titleRaw = itemMatch[1]!;
      currentItem = { id: titleRaw.split(" ")[0]!, title: titleRaw, state: "", severity: "", priority: currentSection, owner: "", description: "" };
      continue;
    }

    if (currentItem && line.startsWith("| **")) {
      const field = parseTableField(line);
      if (field) applyFieldToItem(currentItem, field.key, field.value);
    }
  }

  if (currentItem?.id) items.push(currentItem as BacklogItem);
  return items;
}

/**
 * Parse all backlog items from both ACTIVE.md and DONE.md.
 */
export function parseAllBacklog(): BacklogItem[] {
  const activeItems = parseBacklog(ACTIVE_PATH);
  const doneItems = parseBacklog(DONE_PATH);
  return [...activeItems, ...doneItems];
}

/**
 * Parse only active backlog items (non-Done).
 */
export function parseActiveBacklog(): BacklogItem[] {
  return parseBacklog(ACTIVE_PATH);
}

/**
 * Parse only done backlog items.
 */
export function parseDoneBacklog(): BacklogItem[] {
  return parseBacklog(DONE_PATH);
}
