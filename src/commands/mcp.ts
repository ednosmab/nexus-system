/**
 * mcp.ts — MCP Server CLI Command
 *
 * The `nexus mcp` command. Starts an MCP server over stdio
 * for AI agents to consume project context.
 *
 * Usage:
 *   nexus mcp                    # Start MCP server
 *   nexus mcp --project-root .   # Specify project root
 */

import { Command } from "commander";
import chalk from "chalk";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { startMcpServer } from "../mcp-server.js";

export function mcpCommand(): Command {
  const cmd = new Command("mcp")
    .description(
      "Start MCP server for AI agents (Model Context Protocol)"
    )
    .option("-d, --dir <path>", "Project root directory")
    .action(async (options: Record<string, unknown>) => {
      const projectRoot = (options.dir as string) ?? process.cwd();
      const nexusDir = join(projectRoot, "nexus-system");

      if (!existsSync(nexusDir)) {
        console.error(
          chalk.red(
            `  Error: Nexus not initialized in ${projectRoot}. Run 'nexus init' first.`
          )
        );
        process.exitCode = 1;
        return;
      }

      console.error(
        chalk.gray("  nexus-mcp: Starting MCP server over stdio...")
      );
      console.error(
        chalk.gray(
          "  Tools: getBriefing, getRiskMap, getRules"
        )
      );
      console.error("");

      try {
        await startMcpServer(projectRoot, nexusDir);
      } catch (error) {
        console.error(
          chalk.red(
            `  MCP server error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exitCode = 1;
      }
    });

  return cmd;
}
