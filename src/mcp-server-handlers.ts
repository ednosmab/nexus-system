import { collectContext } from "./context-collector.js";
import { generateRiskMap, type RiskMap } from "./risk-map.js";
import {
  briefingToJson,
  briefingToSummary,
  briefingToMarkdown,
  type Briefing,
} from "./briefing.js";
import { loadRules } from "./rule-engine.js";
import { generateDynamicRules } from "./dynamic-rules.js";
import { getEngineeringState } from "./engineering-state-access.js";
import { parseBacklog } from "./backlog-parser.js";
import { readCache } from "./briefing-cache.js";
import { recordOutcome, createFileStorage } from "./session-feedback.js";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { queryDaemon, isDaemonRunning } from "./daemon-client.js";
import { sanitizePlanName } from "./path-safety.js";
import { listAdrs, getAdr, listSkills, getSkill } from "./knowledge-loader.js";

type ToolResponse = { content: Array<{ type: string; text: string }> };

export async function handleGetBriefing(
  projectRoot: string,
  shitenDir: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const format = (args.format as string) ?? "json";
  const depth = (args.depth as string) ?? "standard";

  let briefing: Briefing;

  if (isDaemonRunning(shitenDir)) {
    const result = await queryDaemon<{ type: string; data: Briefing }>(shitenDir, {
      type: "query_briefing",
    });
    briefing = result?.data ?? collectContext(projectRoot, shitenDir).briefing;
  } else {
    briefing = collectContext(projectRoot, shitenDir).briefing;
  }

  if (format === "markdown") {
    return { content: [{ type: "text", text: briefingToMarkdown(briefing) }] };
  }

  if (format === "summary") {
    return { content: [{ type: "text", text: briefingToSummary(briefing) }] };
  }

  const json = briefingToJson(briefing);

  if (depth === "minimal") {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          project: briefing.project,
          risks: briefing.risks,
          recommendations: briefing.recommendations.slice(0, 1),
        }, null, 2),
      }],
    };
  }

  if (depth === "full") {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          ...json,
          quickBoard: briefing.quickBoard,
          tokenEconomy: briefing.tokenEconomy,
        }, null, 2),
      }],
    };
  }

  return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
}

export async function handleGetRiskMap(
  projectRoot: string,
  shitenDir: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const format = (args.format as string) ?? "json";

  let riskMap: RiskMap;
  if (isDaemonRunning(shitenDir)) {
    const result = await queryDaemon<{ type: string; data: RiskMap }>(shitenDir, {
      type: "query_riskmap",
    });
    riskMap = result?.data ?? generateRiskMap(projectRoot, shitenDir);
  } else {
    riskMap = generateRiskMap(projectRoot, shitenDir);
  }

  if (format === "summary") {
    const lines: string[] = [
      `Overall Risk: ${riskMap.overallRisk} (${riskMap.overallScore}/100)`,
      `Areas analysed: ${riskMap.areas.length}`,
      "",
    ];

    const critical = riskMap.areas.filter(
      (a) => a.riskLevel === "critical" || a.riskLevel === "high"
    );
    if (critical.length > 0) {
      lines.push("High/Critical areas:");
      for (const area of critical) {
        lines.push(`  - ${area.path}: ${area.riskLevel} (${area.score}/100, ${area.fileCount} files)`);
        for (const factor of area.factors.slice(0, 3)) {
          lines.push(`    • ${factor.description}`);
        }
      }
    } else {
      lines.push("All areas within acceptable risk levels.");
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  return { content: [{ type: "text", text: JSON.stringify(riskMap, null, 2) }] };
}

export async function handleGetRules(
  projectRoot: string,
  shitenDir: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const type = (args.type as string) ?? "all";
  const format = (args.format as string) ?? "json";

  const result: {
    contextRules: Array<{ id: string; rule: string; rationale: string; priority: number; area: string; basedOn: string }>;
    dynamicRules: Array<{ id: string; rule: string; severity: string; evidence: string; source: string }>;
    engineRules: Array<{ id: string; description: string; trigger: string; priority: number; enabled: boolean; conditions: unknown[]; actions: unknown[] }>;
  } = { contextRules: [], dynamicRules: [], engineRules: [] };

  if (type === "all" || type === "context") {
    let snapshot;
    if (isDaemonRunning(shitenDir)) {
      const briefingResult = await queryDaemon<{ type: string; data: Briefing }>(shitenDir, {
        type: "query_briefing",
      });
      if (briefingResult?.data) {
        snapshot = { contextRules: collectContext(projectRoot, shitenDir).contextRules };
      } else {
        snapshot = collectContext(projectRoot, shitenDir);
      }
    } else {
      snapshot = collectContext(projectRoot, shitenDir);
    }
    result.contextRules = snapshot.contextRules.map((r) => ({
      id: r.id, rule: r.rule, rationale: r.rationale, priority: r.priority, area: r.area, basedOn: r.basedOn,
    }));
  }

  if (type === "all" || type === "dynamic") {
    const dynamicRules = generateDynamicRules(projectRoot, shitenDir);
    result.dynamicRules = dynamicRules.map((r) => ({
      id: r.id, rule: r.rule, severity: r.severity, evidence: r.evidence, source: r.source,
    }));
  }

  if (type === "all" || type === "engine") {
    const engineRules = loadRules(shitenDir);
    result.engineRules = engineRules.map((r) => ({
      id: r.id, description: r.description, trigger: r.trigger, priority: r.priority, enabled: r.enabled, conditions: r.conditions, actions: r.actions,
    }));
  }

  if (format === "markdown") {
    const lines: string[] = ["# Governance Rules", ""];

    if (result.contextRules.length > 0) {
      lines.push("## Context-Aware Rules", "");
      for (const r of result.contextRules) {
        lines.push(`### ${r.id}`, `**Rule:** ${r.rule}`, `**Rationale:** ${r.rationale}`, `**Area:** \`${r.area}\` | **Priority:** ${r.priority}`, "");
      }
    }

    if (result.dynamicRules.length > 0) {
      lines.push("## Dynamic Rules (from History)", "");
      for (const r of result.dynamicRules) {
        const icon = r.severity === "critical" ? "🚨" : r.severity === "high" ? "⚠️" : "ℹ️";
        lines.push(`### ${icon} ${r.id}`, `**Rule:** ${r.rule}`, `**Evidence:** ${r.evidence}`, `**Source:** ${r.source} | **Severity:** ${r.severity}`, "");
      }
    }

    if (result.engineRules.length > 0) {
      lines.push("## Engine Rules (Declarative)", "");
      for (const r of result.engineRules) {
        const status = r.enabled ? "✅" : "❌";
        lines.push(`### ${status} ${r.id}`, `**Description:** ${r.description}`, `**Trigger:** ${r.trigger} | **Priority:** ${r.priority}`, "");
      }
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
}

export async function handleGetEngineeringState(
  projectRoot: string,
  shitenDir: string,
  _args: Record<string, unknown>
): Promise<ToolResponse> {
  try {
    const state = getEngineeringState(projectRoot, shitenDir);
    return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] };
  } catch (error) {
    throw new Error(`Failed to get engineering state: ${error}`);
  }
}

export function handleGetBacklog(
  _projectRoot: string,
  shitenDir: string,
  args: Record<string, unknown>
): ToolResponse {
  const backlogPath = join(shitenDir, "docs", "BACKLOG.md");
  let items = parseBacklog(backlogPath);

  if (args.state && typeof args.state === "string") {
    const stateFilter = args.state.toLowerCase();
    items = items.filter(item => item.state.toLowerCase() === stateFilter);
  }

  return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
}

export function handleGetPlans(
  _projectRoot: string,
  shitenDir: string,
  args: Record<string, unknown>
): ToolResponse {
  const plansDir = join(shitenDir, "governance", "plans");
  if (!existsSync(plansDir)) {
    return { content: [{ type: "text", text: "[]" }] };
  }

  if (args.planName && typeof args.planName === "string") {
    const safeName = sanitizePlanName(args.planName);
    const planPath = join(plansDir, safeName);
    if (!existsSync(planPath)) {
      throw new Error(`Plan not found: ${safeName}`);
    }
    const content = readFileSync(planPath, "utf-8");
    return { content: [{ type: "text", text: content }] };
  }

  const files = readdirSync(plansDir).filter(f => f.endsWith(".md"));
  return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
}

export function handleSubmitFeedback(
  _projectRoot: string,
  shitenDir: string,
  args: Record<string, unknown>
): ToolResponse {
  const outcome = args.outcome as "success" | "failure" | "partial";
  const notes = args.notes as string;

  if (!outcome || !notes) {
    throw new Error("Missing required arguments: outcome, notes");
  }

  const cache = readCache(shitenDir);
  if (!cache || !cache.entry) {
    throw new Error("No briefing cache found. A briefing must be generated first.");
  }

  const storage = createFileStorage(shitenDir);
  recordOutcome(storage, {
    briefingHash: cache.entry.inputHash,
    briefingTimestamp: cache.entry.computedAt,
    outcome,
    notes,
  });

  return { content: [{ type: "text", text: "Feedback submitted successfully." }] };
}

// ── Knowledge Bridge: ADRs & Skills ───────────────────────────────────────

export async function handleGetADRs(
  _projectRoot: string,
  shitenDir: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const id = args.id as string | undefined;

  if (id) {
    const adr = getAdr(shitenDir, id);
    if (!adr) {
      return { content: [{ type: "text", text: `ADR "${id}" not found` }] };
    }
    return { content: [{ type: "text", text: adr.content }] };
  }

  const summaries = listAdrs(shitenDir);
  const text = summaries
    .map((a) => `${a.id} [${a.status}]: ${a.title}`)
    .join("\n");
  return { content: [{ type: "text", text: text || "No ADRs found." }] };
}

export async function handleGetSkills(
  _projectRoot: string,
  shitenDir: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const name = args.name as string | undefined;

  if (name) {
    const skill = getSkill(shitenDir, name);
    if (!skill) {
      return { content: [{ type: "text", text: `Skill "${name}" not found` }] };
    }
    return { content: [{ type: "text", text: skill.content }] };
  }

  const summaries = listSkills(shitenDir);
  const text = summaries
    .map((s) => `${s.name}: ${s.description}`)
    .join("\n");
  return { content: [{ type: "text", text: text || "No skills found." }] };
}
