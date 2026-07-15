import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../logger.js";
import type { Artifact, Relation } from "./types.js";

const GRAPH_DIR = "governance/knowledge-graph";
const ARTIFACTS_FILE = "artifacts.json";
const RELATIONS_FILE = "relations.json";

export function loadArtifacts(shitenDir: string): Artifact[] {
  const filepath = join(shitenDir, GRAPH_DIR, ARTIFACTS_FILE);
  if (!existsSync(filepath)) return [];

  try {
    return JSON.parse(readFileSync(filepath, "utf-8")) as Artifact[];
  } catch (err) {
    logger.debug("knowledge-graph", `Cannot load artifacts: ${err}`);
    return [];
  }
}

export function loadRelations(shitenDir: string): Relation[] {
  const filepath = join(shitenDir, GRAPH_DIR, RELATIONS_FILE);
  if (!existsSync(filepath)) return [];

  try {
    return JSON.parse(readFileSync(filepath, "utf-8")) as Relation[];
  } catch (err) {
    logger.debug("knowledge-graph", `Cannot load relations: ${err}`);
    return [];
  }
}

export function saveArtifacts(shitenDir: string, artifacts: Artifact[]): void {
  const dir = join(shitenDir, GRAPH_DIR);
  if (!existsSync(dir)) return;

  const filepath = join(dir, ARTIFACTS_FILE);
  writeFileSync(filepath, JSON.stringify(artifacts, null, 2), "utf-8");
}

export function saveRelations(shitenDir: string, relations: Relation[]): void {
  const dir = join(shitenDir, GRAPH_DIR);
  if (!existsSync(dir)) return;

  const filepath = join(dir, RELATIONS_FILE);
  writeFileSync(filepath, JSON.stringify(relations, null, 2), "utf-8");
}
