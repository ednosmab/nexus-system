/**
 * mcp-server.ts — MCP Server for Nexus Context Pipeline
 *
 * Exposes project context to AI agents via the Model Context Protocol (MCP).
 * Tools: getBriefing, getRiskMap, getRules
 *
 * Usage:
 *   nexus mcp              # Start MCP server over stdio
 *   nexus mcp --project-root /path/to/project
 *
 * PRINCIPLE: AI agents should be able to consume Nexus context
 * without leaving their workflow.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { collectContext } from "./context-collector.js";
import {
  generateRiskMap,
  type RiskMap,
} from "./risk-map.js";
import {
  briefingToJson,
  briefingToSummary,
  briefingToMarkdown,
  type Briefing,
} from "./briefing.js";
import { loadRules } from "./rule-engine.js";
import { generateDynamicRules } from "./dynamic-rules.js";

// ── Tool Definitions

const TOOLS = [
  {
    name: "getBriefing",
    description:
      "Generate a pre-session briefing for the project. Includes project identity, " +
      "risk status, test coverage, context rules, dynamic rules, and recommendations. " +
      "This is the primary tool for AI agents to understand a project before modifying code.",
    inputSchema: {
      type: "object" as const,
      properties: {
        format: {
          type: "string" as const,
          enum: ["json", "markdown", "summary"],
          description:
            "Output format. 'json' (default) returns structured data. " +
            "'markdown' returns human-readable markdown. " +
            "'summary' returns a one-line summary.",
        },
        depth: {
          type: "string" as const,
          enum: ["minimal", "standard", "full"],
          description:
            "Briefing depth. 'minimal' (~200 tokens), " +
            "'standard' (~500 tokens), 'full' (~1000 tokens). Default: 'standard'.",
        },
      },
    },
  },
  {
    name: "getRiskMap",
    description:
      "Generate a risk map of the project. Analyses test coverage, code churn, " +
      "file sizes, import complexity, and sensitive keywords to identify " +
      "high-risk areas that need extra caution.",
    inputSchema: {
      type: "object" as const,
      properties: {
        format: {
          type: "string" as const,
          enum: ["json", "summary"],
          description:
            "Output format. 'json' (default) returns full risk map. " +
            "'summary' returns human-readable summary.",
        },
      },
    },
  },
  {
    name: "getRules",
    description:
      "Get governance rules for the project. Returns context-aware rules " +
      "(generated from risk map and fingerprint), dynamic rules " +
      "(generated from git history and session history), and " +
      "engine rules (loaded from governance/rules/ directory).",
    inputSchema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string" as const,
          enum: ["all", "context", "dynamic", "engine"],
          description:
            "Which rules to return. 'all' (default) returns all types. " +
            "'context' returns risk/fingerprint-based rules. " +
            "'dynamic' returns history-based rules. " +
            "'engine' returns declarative governance rules.",
        },
        format: {
          type: "string" as const,
          enum: ["json", "markdown"],
          description:
            "Output format. 'json' (default) returns structured data. " +
            "'markdown' returns human-readable markdown.",
        },
      },
    },
  },
];

// ── Tool Handlers ──────────────────────────────────────────────────────────

function handleGetBriefing(
  projectRoot: string,
  nexusDir: string,
  args: Record<string, unknown>
): { content: Array<{ type: string; text: string }> } {
  const format = (args.format as string) ?? "json";
  const depth = (args.depth as string) ?? "standard";

  const snapshot = collectContext(projectRoot, nexusDir);
  const briefing: Briefing = snapshot.briefing;

  if (format === "markdown") {
    return {
      content: [{ type: "text", text: briefingToMarkdown(briefing) }],
    };
  }

  if (format === "summary") {
    return {
      content: [{ type: "text", text: briefingToSummary(briefing) }],
    };
  }

  // JSON format — depth-aware filtering
  const json = briefingToJson(briefing);

  if (depth === "minimal") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              project: briefing.project,
              risks: briefing.risks,
              recommendations: briefing.recommendations.slice(0, 1),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (depth === "full") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...json,
              quickBoard: briefing.quickBoard,
              tokenEconomy: briefing.tokenEconomy,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // standard
  return {
    content: [{ type: "text", text: JSON.stringify(json, null, 2) }],
  };
}

function handleGetRiskMap(
  projectRoot: string,
  nexusDir: string,
  args: Record<string, unknown>
): { content: Array<{ type: string; text: string }> } {
  const format = (args.format as string) ?? "json";

  const riskMap: RiskMap = generateRiskMap(projectRoot, nexusDir);

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
        lines.push(
          `  - ${area.path}: ${area.riskLevel} (${area.score}/100, ${area.fileCount} files)`
        );
        for (const factor of area.factors.slice(0, 3)) {
          lines.push(`    • ${factor.description}`);
        }
      }
    } else {
      lines.push("All areas within acceptable risk levels.");
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }

  // JSON format
  return {
    content: [{ type: "text", text: JSON.stringify(riskMap, null, 2) }],
  };
}

function handleGetRules(
  projectRoot: string,
  nexusDir: string,
  args: Record<string, unknown>
): { content: Array<{ type: string; text: string }> } {
  const type = (args.type as string) ?? "all";
  const format = (args.format as string) ?? "json";

  const result: {
    contextRules: Array<{
      id: string;
      rule: string;
      rationale: string;
      priority: number;
      area: string;
      basedOn: string;
    }>;
    dynamicRules: Array<{
      id: string;
      rule: string;
      severity: string;
      evidence: string;
      source: string;
    }>;
    engineRules: Array<{
      id: string;
      description: string;
      trigger: string;
      priority: number;
      enabled: boolean;
      conditions: unknown[];
      actions: unknown[];
    }>;
  } = {
    contextRules: [],
    dynamicRules: [],
    engineRules: [],
  };

  if (type === "all" || type === "context") {
    const snapshot = collectContext(projectRoot, nexusDir);
    result.contextRules = snapshot.contextRules.map((r) => ({
      id: r.id,
      rule: r.rule,
      rationale: r.rationale,
      priority: r.priority,
      area: r.area,
      basedOn: r.basedOn,
    }));
  }

  if (type === "all" || type === "dynamic") {
    const dynamicRules = generateDynamicRules(projectRoot, nexusDir);
    result.dynamicRules = dynamicRules.map((r) => ({
      id: r.id,
      rule: r.rule,
      severity: r.severity,
      evidence: r.evidence,
      source: r.source,
    }));
  }

  if (type === "all" || type === "engine") {
    const engineRules = loadRules(nexusDir);
    result.engineRules = engineRules.map((r) => ({
      id: r.id,
      description: r.description,
      trigger: r.trigger,
      priority: r.priority,
      enabled: r.enabled,
      conditions: r.conditions,
      actions: r.actions,
    }));
  }

  if (format === "markdown") {
    const lines: string[] = ["# Governance Rules", ""];

    if (result.contextRules.length > 0) {
      lines.push("## Context-Aware Rules");
      lines.push("");
      for (const r of result.contextRules) {
        lines.push(`### ${r.id}`);
        lines.push(`**Rule:** ${r.rule}`);
        lines.push(`**Rationale:** ${r.rationale}`);
        lines.push(`**Area:** \`${r.area}\` | **Priority:** ${r.priority}`);
        lines.push("");
      }
    }

    if (result.dynamicRules.length > 0) {
      lines.push("## Dynamic Rules (from History)");
      lines.push("");
      for (const r of result.dynamicRules) {
        const icon =
          r.severity === "critical" ? "🚨" : r.severity === "high" ? "⚠️" : "ℹ️";
        lines.push(`### ${icon} ${r.id}`);
        lines.push(`**Rule:** ${r.rule}`);
        lines.push(`**Evidence:** ${r.evidence}`);
        lines.push(`**Source:** ${r.source} | **Severity:** ${r.severity}`);
        lines.push("");
      }
    }

    if (result.engineRules.length > 0) {
      lines.push("## Engine Rules (Declarative)");
      lines.push("");
      for (const r of result.engineRules) {
        const status = r.enabled ? "✅" : "❌";
        lines.push(`### ${status} ${r.id}`);
        lines.push(`**Description:** ${r.description}`);
        lines.push(`**Trigger:** ${r.trigger} | **Priority:** ${r.priority}`);
        lines.push("");
      }
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }

  // JSON format
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

// ── Server Creation ────────────────────────────────────────────────────────

/**
 * Create and configure the MCP server with all Nexus tools.
 */
export function createMcpServer(
  projectRoot: string,
  nexusDir?: string
): Server {
  const resolvedNexusDir = nexusDir ?? `${projectRoot}/nexus-system`;

  const server = new Server(
    {
      name: "nexus-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ── List Tools ──────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // ── Call Tool ───────────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolArgs = (args ?? {}) as Record<string, unknown>;

    try {
      switch (name) {
        case "getBriefing":
          return handleGetBriefing(projectRoot, resolvedNexusDir, toolArgs);

        case "getRiskMap":
          return handleGetRiskMap(projectRoot, resolvedNexusDir, toolArgs);

        case "getRules":
          return handleGetRules(projectRoot, resolvedNexusDir, toolArgs);

        default:
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool: ${name}. Available tools: ${TOOLS.map((t) => t.name).join(", ")}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start the MCP server over stdio transport.
 * This is the main entry point when running `nexus mcp`.
 */
export async function startMcpServer(
  projectRoot: string,
  nexusDir?: string
): Promise<void> {
  const server = createMcpServer(projectRoot, nexusDir);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
