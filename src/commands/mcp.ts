/**
 * mcp.ts — MCP Server CLI Command
 *
 * The `shugo mcp` command. Starts an MCP server over stdio
 * for AI agents to consume project context.
 *
 * Usage:
 *   shugo mcp                    # Start MCP server
 *   shugo mcp install            # Install MCP Filesystem server globally
 *   shugo mcp install --check    # Check installation status
 */

import { Command } from "commander";
import chalk from "chalk";
import { join } from "node:path";
import { startMcpServer } from "../mcp-server.js";
import { installMcpServer, updateOpenCodeJsonTimeout } from "../mcp-install.js";
import { guardNotInitialized } from "../shared.js";
import { outputJson } from "../formatting.js";
import { consolidateEngineeringState } from "../engineering-state.js";
import { SHITENNO_DIR_NAME } from "../constants.js";
import { output, outputBlank, outputError } from "../output.js";

export function mcpCommand(): Command {
  const cmd = new Command("mcp")
    .description(
      "MCP server for AI agents (Model Context Protocol)"
    )
    .option("-d, --dir <path>", "Project root directory")
    .action(async (options: Record<string, unknown>) => {
      const projectRoot = (options.dir as string) ?? process.cwd();
      const shitennoDir = join(projectRoot, SHITENNO_DIR_NAME);

      try {
        consolidateEngineeringState(projectRoot, shitennoDir);
      } catch {
        outputError(
          chalk.red(
            `  Error: Shugo not initialized in ${projectRoot}. Run 'shugo init' first.`
          )
        );
        process.exitCode = 1;
        return;
      }

      outputError(
        chalk.gray("  shitenno-mcp: Starting MCP server over stdio...")
      );
      outputError(
        chalk.gray(
          "  Tools: getBriefing, getRiskMap, getRules, getEngineeringState, getBacklog, getPlans, submitFeedback"
        )
      );
      outputBlank();

      try {
        await startMcpServer(projectRoot, shitennoDir);
      } catch (error) {
        outputError(
          chalk.red(
            `  MCP server error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exitCode = 1;
      }
    });

  const installCmd = new Command("install")
    .description(
      "Install MCP Filesystem server globally and configure opencode.json timeout"
    )
    .option("-d, --dir <path>", "Project root directory")
    .option("--check", "Check installation status without installing")
    .option("--upgrade", "Upgrade to latest version if already installed")
    .option("--json", "Output results as JSON")
    .action(async (subOptions: Record<string, unknown>) => {
      const isJson = subOptions.json === true;

      if (!isJson) {
        outputBlank();
        output(
          chalk.bold.cyan("  ╔════════════════════════════════════════════╗")
        );
        output(
          chalk.bold.cyan("  ║  shugo mcp install — MCP Filesystem Server ║")
        );
        output(
          chalk.bold.cyan("  ╚════════════════════════════════════════════╝")
        );
        outputBlank();
      }

      const ctx = guardNotInitialized({ dir: subOptions.dir as string | undefined }, isJson);
      if (!ctx) return;

      // Check-only mode
      if (subOptions.check) {
        const result = installMcpServer({ check: true });

        if (isJson) {
          outputJson({
            installed: result.installed,
            version: result.version,
            upgrade: result.upgrade || false,
            error: result.error,
            latestVersionCheckFailed: result.latestVersionCheckFailed || false,
          });
          return;
        }

        if (result.installed) {
          output(
            chalk.green(`  ✔ MCP Filesystem Server is installed`)
          );
          if (result.version) {
            output(chalk.gray(`    Version: ${result.version}`));
          }
          if (result.upgrade) {
            output(
              chalk.yellow("    ⚠ New version available. Run 'shugo mcp install --upgrade'")
            );
          }
          if (result.latestVersionCheckFailed) {
            output(
              chalk.yellow("    ⚠ Could not check latest version (offline or registry unavailable)")
            );
          }
        } else {
          output(
            chalk.yellow("  ⚠ MCP Filesystem Server is NOT installed")
          );
          if (result.error) {
            output(chalk.gray(`    ${result.error}`));
          }
          output(
            chalk.gray("    Run 'shugo mcp install' to install it.")
          );
        }
        outputBlank();
        return;
      }

      // Install
      if (!isJson) {
        output(chalk.gray("  Installing @modelcontextprotocol/server-filesystem globally..."));
        outputBlank();
      }

      const result = installMcpServer({
        upgrade: !!subOptions.upgrade,
      });

      if (!result.installed) {
        if (isJson) {
          outputJson({
            installed: false,
            error: result.error,
            errorCode: result.errorCode,
          });
          return;
        }

        output(chalk.red("  ✘ Installation failed"));
        if (result.error) {
          outputBlank();
          output(chalk.red(`    ${result.error}`));
          outputBlank();
        }
        return;
      }

      // Configure opencode.json timeout
      const timeoutUpdate = updateOpenCodeJsonTimeout(ctx.projectRoot, 15000);

      if (isJson) {
        outputJson({
          installed: true,
          version: result.version,
          previousVersion: result.previousVersion,
          opencodeJsonUpdated: timeoutUpdate.changed,
          timeoutMs: timeoutUpdate.changed ? 15000 : undefined,
          latestVersionCheckFailed: result.latestVersionCheckFailed || false,
        });
        return;
      }

      const action = result.upgrade ? "upgraded" : "installed";
      output(
        chalk.green(
          `  ✔ MCP Filesystem Server ${action} successfully`
        )
      );
      output(
        chalk.gray(`    Version: ${result.version}`)
      );
      if (result.previousVersion) {
        output(
          chalk.gray(`    Previous: ${result.previousVersion}`)
        );
      }
      if (result.latestVersionCheckFailed) {
        output(
          chalk.yellow("    ⚠ Could not check latest version (offline or registry unavailable)")
        );
      }
      outputBlank();

      if (timeoutUpdate.changed) {
        output(
          chalk.green("  ✔ opencode.json updated with MCP timeout (15000ms)")
        );
      } else if (timeoutUpdate.error) {
        output(
          chalk.yellow(`  ⚠ ${timeoutUpdate.error}`)
        );
      } else {
        output(
          chalk.gray("  MCP timeout already configured in opencode.json")
        );
      }
      outputBlank();
      output(
        chalk.gray("  The opencode session may need to be restarted for changes to take effect.")
      );
      outputBlank();
    });

  cmd.addCommand(installCmd);

  return cmd;
}
