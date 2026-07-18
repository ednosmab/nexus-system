/**
 * health-check Plugin — Demo Plugin for Shugo CLI
 *
 * Provides extra health checks during `shugo audit`.
 * Demonstrates the plugin system with custom-check and custom-recommendation hooks.
 *
 * WARNING: This file is auto-generated from plugin.ts. Do not edit directly.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const plugin = {
  name: "health-check",
  version: "1.0.0",
  description: "Extra health checks for Shugo projects",

  hooks: {
    "custom-check": async (context) => {
      const { projectRoot, shitennoDir } = context;
      const issues = [];

      const adrDir = join(shitennoDir, "docs", "adrs");
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

      const workflowPath = join(shitennoDir, "governance", "WORKFLOW.md");
      if (!existsSync(workflowPath)) {
        issues.push("No WORKFLOW.md — governance workflow not documented");
      }

      const rulesDir = join(shitennoDir, "governance", "rules");
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

    "custom-recommendation": async (shitennoDir) => {
      const adrDir = join(shitennoDir, "docs", "adrs");
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
          command: "shugo init",
        };
      }

      return null;
    },
  },
};

export default plugin;
