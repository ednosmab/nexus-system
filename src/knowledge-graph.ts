/**
 * knowledge-graph.ts — Pilar 6: Knowledge Graph
 *
 * Thin facade — all logic split into knowledge-graph/ modules.
 */

export type {
  ArtifactType,
  RelationType,
  Artifact,
  Relation,
  GraphAnalysis,
} from "./knowledge-graph/types.js";

export {
  loadArtifacts,
  loadRelations,
  saveArtifacts,
  saveRelations,
} from "./knowledge-graph/storage.js";

export { discoverArtifacts, discoverRelations } from "./knowledge-graph/discovery.js";
export { analyzeGraph } from "./knowledge-graph/analysis.js";
export { graphToText } from "./knowledge-graph/visualization.js";

import { discoverArtifacts, discoverRelations } from "./knowledge-graph/discovery.js";
import { saveArtifacts, saveRelations } from "./knowledge-graph/storage.js";
import { getEventBus, type ShitenEventType } from "./event-bus.js";

function rebuildGraph(shitenDir: string): void {
  const artifacts = discoverArtifacts(shitenDir);
  const relations = discoverRelations(artifacts);
  saveArtifacts(shitenDir, artifacts);
  saveRelations(shitenDir, relations);
}

export function initializeKnowledgeGraph(shitenDir: string): void {
  const bus = getEventBus();

  const eventTypes: ShitenEventType[] = [
    "adr.created",
    "skill.created",
    "capability.installed",
  ];

  for (const eventType of eventTypes) {
    bus.subscribe(eventType, () => {
      rebuildGraph(shitenDir);
    });
  }
}
