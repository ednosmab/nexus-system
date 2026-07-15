/**
 * health-check Plugin — Demo Plugin for Shiten CLI
 *
 * Provides extra health checks during `shiten audit`.
 * Demonstrates the plugin system with custom-check and custom-recommendation hooks.
 *
 * PRINCIPLE: Plugins extend Shiten without modifying core.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface PluginContext {
  projectRoot: string;
  shitenDir: string;
  healthReport: unknown;
}

interface PluginRecommendation {
  type: string;
  title: string;
  description: string;
  command?: string;
}

const plugin = {
  name: "health-check",
  version: "1.0.0",
  description: "Extra health checks for Shiten projects",

  hooks: {
    "custom-check": async (context: PluginContext): Promise<string | null> => {
      const { projectRoot, shitenDir } = context;
      const issues: string[] = [];

      const adrDir = join(shitenDir, "docs", "adrs");
      if (existsSync(adrDir)) {
        const adrFiles = readdirSync(adrDir).filter(
          (f) => f.endsWith(".md") && !f.startsWith("ADR-TEMPLATE")
        );

        for (const file of adrFiles) {
          const filepath = join(adrDir, file);
          try {
            const stat = statSync(filepath);
            const ageDays = Math.floor(
              (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24)
            );
            if (ageDays > 90) {
              issues.push(`ADR "${file.replace(".md", "")}" is ${ageDays} days old — consider reviewing`);
            }
          } catch {
            // skip
          }
        }
      }

      const testsDir = join(projectRoot, "tests");
      const testFiles = existsSync(testsDir)
        ? readdirSync(testsDir).filter((f) => f.endsWith(".test.ts") || f.endsWith(".test.js"))
        : [];
      if (testFiles.length === 0) {
        issues.push("No test files found — consider adding tests");
      }

      const workflowPath = join(shitenDir, "governance", "WORKFLOW.md");
      if (!existsSync(workflowPath)) {
        issues.push("No WORKFLOW.md — governance workflow not documented");
      }

      const rulesDir = join(shitenDir, "governance", "rules");
      if (existsSync(rulesDir)) {
        const ruleFiles = readdirSync(rulesDir).filter((f) => f.endsWith(".json"));
        if (ruleFiles.length === 0) {
          issues.push("No rules defined in governance/rules/");
        }
      }

      if (issues.length > 0) {
        return `[health-check] ${issues.length} issue(s):\n${issues.map((i) => `  - ${i}`).join("\n")}`;
      }

      return null;
    },

    "custom-recommendation": async (shitenDir: string): Promise<PluginRecommendation | null> => {
      const adrDir = join(shitenDir, "docs", "adrs");
      const hasAdrs =
        existsSync(adrDir) &&
        readdirSync(adrDir).filter(
          (f) => f.endsWith(".md") && !f.startsWith("ADR-TEMPLATE")
        ).length > 0;

      if (!hasAdrs) {
        return {
          type: "knowledge_creation",
          title: "Create first ADR (from health-check plugin)",
          description:
            "No Architecture Decision Records found. ADRs document important decisions.",
          command: "shiten init",
        };
      }

      return null;
    },
  },
};

export default plugin;
