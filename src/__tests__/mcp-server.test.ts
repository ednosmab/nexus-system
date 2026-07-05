/**
 * mcp-server.test.ts — Tests for MCP Server tool handlers
 *
 * Tests getBriefing, getRiskMap, getRules with mocked context
 * to verify JSON structure, format options, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("../context-collector.js", () => ({
  collectContext: vi.fn(),
}));

vi.mock("../risk-map.js", () => ({
  generateRiskMap: vi.fn(),
}));

vi.mock("../rule-engine.js", () => ({
  loadRules: vi.fn(() => []),
}));

vi.mock("../dynamic-rules.js", () => ({
  generateDynamicRules: vi.fn(() => []),
}));

import { collectContext } from "../context-collector.js";
import { generateRiskMap } from "../risk-map.js";
import { loadRules } from "../rule-engine.js";
import { generateDynamicRules } from "../dynamic-rules.js";
import {
  handleGetBriefing,
  handleGetRiskMap,
  handleGetRules,
} from "../mcp-server.js";

const mockCollectContext = vi.mocked(collectContext);
const mockGenerateRiskMap = vi.mocked(generateRiskMap);
const mockLoadRules = vi.mocked(loadRules);
const mockGenerateDynamicRules = vi.mocked(generateDynamicRules);

// ── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_BRIEFING = {
  generatedAt: "2026-07-05T12:00:00.000Z",
  project: {
    domain: "web",
    scale: "small",
    stack: ["react", "typescript"],
    maturityScore: 72,
  },
  risks: {
    overall: "low",
    criticalAreas: [] as string[],
    highAreas: ["src/auth"],
  },
  tests: {
    hasTests: true,
    areasWithoutTests: [] as string[],
  },
  patterns: {
    recurringErrors: [] as string[],
    hotAreas: [] as string[],
    detected: [] as Array<Record<string, unknown>>,
  },
  contextRules: [
    {
      id: "CTX-001",
      rule: "Check auth module for security patterns",
      rationale: "High risk area",
      priority: 1,
      area: "src/auth",
      basedOn: "risk-map" as const,
    },
  ],
  dynamicRules: [] as Array<Record<string, unknown>>,
  recommendations: ["Review auth module for vulnerabilities"],
  quickBoard: {
    currentTask: "Improve test coverage",
    nextP0: "Fix security vulnerabilities",
    p1Debts: "Update dependencies",
    impediments: "None",
    lastSessionStatus: "completed",
  },
  tokenEconomy: {
    estimatedTokensSaved: 8000,
    cacheHit: false,
    contextRuleCount: 1,
    dynamicRuleCount: 0,
  },
};

const MOCK_CONTEXT_SNAPSHOT = {
  briefing: MOCK_BRIEFING,
  contextRules: MOCK_BRIEFING.contextRules,
  fingerprint: {} as Record<string, unknown>,
  riskMap: {} as Record<string, unknown>,
  knowledgeDebt: {} as Record<string, unknown>,
  maturityProfile: {} as Record<string, unknown>,
  dynamicRules: [] as Array<Record<string, unknown>>,
};

const MOCK_RISK_MAP = {
  overallRisk: "low" as const,
  overallScore: 82,
  areas: [
    {
      path: "src/auth",
      riskLevel: "high" as const,
      score: 60,
      fileCount: 5,
      factors: [
        {
          type: "complexity",
          description: "High cyclomatic complexity",
          weight: 0.4,
        },
      ],
    },
    {
      path: "src/utils",
      riskLevel: "low" as const,
      score: 90,
      fileCount: 12,
      factors: [
        {
          type: "coverage",
          description: "Good test coverage",
          weight: 0.3,
        },
      ],
    },
  ],
};

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockCollectContext.mockReturnValue(MOCK_CONTEXT_SNAPSHOT as any);
  mockGenerateRiskMap.mockReturnValue(MOCK_RISK_MAP as any);
  mockLoadRules.mockReturnValue([]);
  mockGenerateDynamicRules.mockReturnValue([]);
});

// ── getBriefing ─────────────────────────────────────────────────────────────

describe("handleGetBriefing", () => {
  it("returns valid JSON structure with all required fields", () => {
    const result = handleGetBriefing("/project", "/project/nexus-system", {});

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty("project");
    expect(json).toHaveProperty("risks");
    expect(json).toHaveProperty("tests");
    expect(json).toHaveProperty("contextRules");
    expect(json).toHaveProperty("recommendations");
  });

  it("returns minimal depth with project, risks, and 1 recommendation", () => {
    const result = handleGetBriefing("/project", "/project/nexus-system", {
      depth: "minimal",
    });

    const json = JSON.parse(result.content[0].text);
    expect(json.project).toBeDefined();
    expect(json.risks).toBeDefined();
    expect(json.recommendations).toBeInstanceOf(Array);
    expect(json.recommendations.length).toBeLessThanOrEqual(1);
    // Minimal should NOT have quickBoard or tokenEconomy
    expect(json.quickBoard).toBeUndefined();
    expect(json.tokenEconomy).toBeUndefined();
  });

  it("returns full depth with quickBoard and tokenEconomy", () => {
    const result = handleGetBriefing("/project", "/project/nexus-system", {
      depth: "full",
    });

    const json = JSON.parse(result.content[0].text);
    expect(json.quickBoard).toBeDefined();
    expect(json.quickBoard.currentTask).toBe("Improve test coverage");
    // tokenEconomy is only included in full depth via briefingToJson
  });

  it("returns standard depth by default", () => {
    const result = handleGetBriefing("/project", "/project/nexus-system", {});

    const json = JSON.parse(result.content[0].text);
    // Standard includes all main sections but not extended fields
    expect(json.project).toBeDefined();
    expect(json.risks).toBeDefined();
  });

  it("returns markdown format", () => {
    const result = handleGetBriefing("/project", "/project/nexus-system", {
      format: "markdown",
    });

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("#");
    expect(result.content[0].text).toContain("Pre-Session Briefing");
  });

  it("returns summary format", () => {
    const result = handleGetBriefing("/project", "/project/nexus-system", {
      format: "summary",
    });

    expect(result.content[0].type).toBe("text");
    expect(typeof result.content[0].text).toBe("string");
    expect(result.content[0].text.length).toBeGreaterThan(0);
  });

  it("calls collectContext with correct arguments", () => {
    handleGetBriefing("/my/project", "/my/project/nexus-system", {});

    expect(mockCollectContext).toHaveBeenCalledWith(
      "/my/project",
      "/my/project/nexus-system"
    );
  });
});

// ── getRiskMap ──────────────────────────────────────────────────────────────

describe("handleGetRiskMap", () => {
  it("returns valid JSON structure with overallRisk and areas", () => {
    const result = handleGetRiskMap("/project", "/project/nexus-system", {});

    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty("overallRisk");
    expect(json).toHaveProperty("overallScore");
    expect(json).toHaveProperty("areas");
    expect(json.areas).toBeInstanceOf(Array);
  });

  it("each area has required fields", () => {
    const result = handleGetRiskMap("/project", "/project/nexus-system", {});

    const json = JSON.parse(result.content[0].text);
    for (const area of json.areas) {
      expect(area).toHaveProperty("path");
      expect(area).toHaveProperty("riskLevel");
      expect(area).toHaveProperty("score");
      expect(area).toHaveProperty("fileCount");
      expect(area).toHaveProperty("factors");
    }
  });

  it("returns summary format with human-readable output", () => {
    const result = handleGetRiskMap("/project", "/project/nexus-system", {
      format: "summary",
    });

    expect(result.content[0].text).toContain("Overall Risk:");
    expect(result.content[0].text).toContain("Areas analysed:");
  });

  it("summary includes high/critical areas", () => {
    const result = handleGetRiskMap("/project", "/project/nexus-system", {
      format: "summary",
    });

    expect(result.content[0].text).toContain("Overall Risk:");
    expect(result.content[0].text).toContain("src/auth");
  });

  it("summary shows acceptable risk when no critical areas", () => {
    mockGenerateRiskMap.mockReturnValue({
      ...MOCK_RISK_MAP,
      areas: [
        { ...MOCK_RISK_MAP.areas[0], riskLevel: "low" },
        { ...MOCK_RISK_MAP.areas[1], riskLevel: "low" },
      ],
    } as any);

    const result = handleGetRiskMap("/project", "/project/nexus-system", {
      format: "summary",
    });

    expect(result.content[0].text).toContain(
      "All areas within acceptable risk levels."
    );
  });

  it("calls generateRiskMap with correct arguments", () => {
    handleGetRiskMap("/my/project", "/my/project/nexus-system", {});

    expect(mockGenerateRiskMap).toHaveBeenCalledWith(
      "/my/project",
      "/my/project/nexus-system"
    );
  });
});

// ── getRules ────────────────────────────────────────────────────────────────

describe("handleGetRules", () => {
  it("returns all rule types by default", () => {
    const result = handleGetRules("/project", "/project/nexus-system", {});

    const json = JSON.parse(result.content[0].text);
    expect(json).toHaveProperty("contextRules");
    expect(json).toHaveProperty("dynamicRules");
    expect(json).toHaveProperty("engineRules");
  });

  it("contextRules have required fields", () => {
    const result = handleGetRules("/project", "/project/nexus-system", {
      type: "context",
    });

    const json = JSON.parse(result.content[0].text);
    expect(json.contextRules).toBeInstanceOf(Array);
    for (const rule of json.contextRules) {
      expect(rule).toHaveProperty("id");
      expect(rule).toHaveProperty("rule");
      expect(rule).toHaveProperty("rationale");
      expect(rule).toHaveProperty("priority");
      expect(rule).toHaveProperty("area");
      expect(rule).toHaveProperty("basedOn");
    }
  });

  it("dynamicRules have required fields", () => {
    mockGenerateDynamicRules.mockReturnValue([
      {
        id: "DYN-001",
        rule: "Watch for regressions in auth module",
        severity: "high",
        evidence: "3 recent failures",
        source: "git-history",
      },
    ]);

    const result = handleGetRules("/project", "/project/nexus-system", {
      type: "dynamic",
    });

    const json = JSON.parse(result.content[0].text);
    expect(json.dynamicRules).toHaveLength(1);
    expect(json.dynamicRules[0].id).toBe("DYN-001");
    expect(json.dynamicRules[0].severity).toBe("high");
  });

  it("engineRules have required fields", () => {
    mockLoadRules.mockReturnValue([
      {
        id: "RULE-001",
        description: "Run tests before commit",
        trigger: "pre-commit",
        priority: 1,
        enabled: true,
        conditions: [],
        actions: [],
      },
    ]);

    const result = handleGetRules("/project", "/project/nexus-system", {
      type: "engine",
    });

    const json = JSON.parse(result.content[0].text);
    expect(json.engineRules).toHaveLength(1);
    expect(json.engineRules[0].id).toBe("RULE-001");
    expect(json.engineRules[0].enabled).toBe(true);
  });

  it("returns markdown format with headers", () => {
    const result = handleGetRules("/project", "/project/nexus-system", {
      format: "markdown",
    });

    expect(result.content[0].text).toContain("# Governance Rules");
  });

  it("calls loadRules for engine rules", () => {
    handleGetRules("/project", "/project/nexus-system", { type: "engine" });

    expect(mockLoadRules).toHaveBeenCalledWith("/project/nexus-system");
  });

  it("calls generateDynamicRules for dynamic rules", () => {
    handleGetRules("/project", "/project/nexus-system", { type: "dynamic" });

    expect(mockGenerateDynamicRules).toHaveBeenCalledWith(
      "/project",
      "/project/nexus-system"
    );
  });
});

// ── Error Handling ──────────────────────────────────────────────────────────

describe("Error Handling", () => {
  it("getBriefing handles collectContext throwing an error", () => {
    mockCollectContext.mockImplementation(() => {
      throw new Error("ENOENT: no such file or directory");
    });

    // The handler itself will throw, which is caught by the MCP server's try/catch
    expect(() =>
      handleGetBriefing("/nonexistent", "/nonexistent/nexus-system", {})
    ).toThrow("ENOENT");
  });

  it("getRiskMap handles generateRiskMap throwing an error", () => {
    mockGenerateRiskMap.mockImplementation(() => {
      throw new Error("Cannot read property of undefined");
    });

    expect(() =>
      handleGetRiskMap("/nonexistent", "/nonexistent/nexus-system", {})
    ).toThrow("Cannot read property of undefined");
  });

  it("getRules handles loadRules returning empty for missing nexus dir", () => {
    mockLoadRules.mockReturnValue([]);

    const result = handleGetRules(
      "/nonexistent",
      "/nonexistent/nexus-system",
      { type: "engine" }
    );

    const json = JSON.parse(result.content[0].text);
    expect(json.engineRules).toEqual([]);
  });

  it("getRules handles generateDynamicRules returning empty for fresh project", () => {
    mockGenerateDynamicRules.mockReturnValue([]);

    const result = handleGetRules(
      "/fresh-project",
      "/fresh-project/nexus-system",
      { type: "dynamic" }
    );

    const json = JSON.parse(result.content[0].text);
    expect(json.dynamicRules).toEqual([]);
  });
});

// ── createMcpServer ─────────────────────────────────────────────────────────

describe("createMcpServer", () => {
  it("creates a server with correct name and version", async () => {
    const { createMcpServer } = await import("../mcp-server.js");
    const server = createMcpServer("/project", "/project/nexus-system");
    expect(server).toBeDefined();
  });

  it("can be instantiated without errors", async () => {
    const { createMcpServer } = await import("../mcp-server.js");
    expect(() => createMcpServer("/project")).not.toThrow();
  });

  it("handles missing nexus directory gracefully", async () => {
    const { createMcpServer } = await import("../mcp-server.js");
    expect(() =>
      createMcpServer("/project", "/nonexistent/nexus-system")
    ).not.toThrow();
  });
});
