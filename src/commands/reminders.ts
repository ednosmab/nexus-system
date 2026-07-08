/**
 * reminders.ts — Reminders Management Command
 *
 * The `nexus reminders` command. List, add, remove, and manage reminders.
 *
 * Usage:
 *   nexus reminders              # List all active reminders
 *   nexus reminders add "msg"    # Add a new reminder
 *   nexus reminders rm <index>   # Remove reminder by index
 *   nexus reminders rm --message "partial match"  # Remove by message
 *   nexus reminders clear        # Remove all reminders
 *   nexus reminders --json       # Output as JSON
 */

import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { guardNotInitialized } from "../shared.js";
import { outputJson } from "../formatting.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function getBufferPath(projectRoot: string): string {
  return join(projectRoot, "nexus-system", "governance", "context", "context_buffer.yaml");
}

function ensureBuffer(projectRoot: string): string {
  const bufferPath = getBufferPath(projectRoot);
  const dir = join(projectRoot, "nexus-system", "governance", "context");

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (!existsSync(bufferPath)) {
    writeFileSync(bufferPath, "reminders: []\n", "utf-8");
  }

  return bufferPath;
}

function loadReminders(projectRoot: string): string[] {
  const bufferPath = getBufferPath(projectRoot);

  if (!existsSync(bufferPath)) {
    return [];
  }

  try {
    const content = readFileSync(bufferPath, "utf-8");
    const data = parseYaml(content);

    if (Array.isArray(data?.reminders)) {
      return data.reminders.map(String);
    }
    return [];
  } catch {
    return [];
  }
}

function saveReminders(projectRoot: string, reminders: string[]): void {
  const bufferPath = ensureBuffer(projectRoot);
  let content = readFileSync(bufferPath, "utf-8");

  // Remove existing reminders section
  content = content.replace(/^reminders:\s*\n(?:\s+-\s+.*\n?)*/m, "");

  // Add new reminders
  if (reminders.length > 0) {
    const remindersBlock = `reminders:\n${reminders.map(r => `  - "${r}"`).join("\n")}\n`;
    content = remindersBlock + content;
  } else {
    content = "reminders: []\n" + content;
  }

  writeFileSync(bufferPath, content, "utf-8");
}

// ── Command ────────────────────────────────────────────────────────────────

export function remindersCommand(): Command {
  const cmd = new Command("reminders")
    .description("List, add, remove, and manage reminders")
    .option("-d, --dir <path>", "Project directory")
    .option("--json", "Output as JSON");

  // ── Default action: list reminders ──────────────────────────────────────
  cmd.action((opts: Record<string, unknown>) => {
    const isJson = opts.json === true;
    const ctx = guardNotInitialized(opts, isJson);
    if (!ctx) return;

    const reminders = loadReminders(ctx.projectRoot);

    if (isJson) {
      outputJson({ reminders, count: reminders.length });
      return;
    }

    console.log("");
    if (reminders.length === 0) {
      console.log(chalk.dim("  No active reminders."));
      console.log(chalk.dim("  Use 'nexus reminders add \"message\"' to create one."));
    } else {
      console.log(chalk.bold(`  Active Reminders (${reminders.length})`));
      console.log(chalk.dim("  " + "─".repeat(50)));
      for (let i = 0; i < reminders.length; i++) {
        console.log(`  ${chalk.cyan(`${i + 1}.`)} ${reminders[i]}`);
      }
    }
    console.log("");
  });

  // ── add ─────────────────────────────────────────────────────────────────
  cmd
    .command("add")
    .description("Add a new reminder")
    .argument("<message>", "Reminder message")
    .option("--json", "Output as JSON")
    .action((message: string, opts: Record<string, unknown>) => {
      const isJson = opts.json === true;
      const ctx = guardNotInitialized(opts, isJson);
      if (!ctx) return;

      const reminders = loadReminders(ctx.projectRoot);
      reminders.push(message);
      saveReminders(ctx.projectRoot, reminders);

      if (isJson) {
        outputJson({ added: message, count: reminders.length });
      } else {
        console.log(chalk.green(`  ✓ Reminder added: ${message}`));
        console.log(chalk.dim(`  Total reminders: ${reminders.length}`));
      }
    });

  // ── rm ──────────────────────────────────────────────────────────────────
  cmd
    .command("rm")
    .description("Remove a reminder by index or message")
    .argument("[index]", "Reminder index (1-based)")
    .option("--message <text>", "Remove by partial message match")
    .option("--json", "Output as JSON")
    .action((index: string | undefined, opts: Record<string, unknown>) => {
      const isJson = opts.json === true;
      const ctx = guardNotInitialized(opts, isJson);
      if (!ctx) return;

      const reminders = loadReminders(ctx.projectRoot);

      if (reminders.length === 0) {
        if (isJson) {
          outputJson({ error: "No reminders to remove" });
        } else {
          console.log(chalk.red("  No reminders to remove."));
        }
        return;
      }

      let removedIndex = -1;
      let removedMessage = "";

      if (opts.message) {
        // Remove by message match
        const message = String(opts.message);
        removedIndex = reminders.findIndex(r => r.includes(message));
        if (removedIndex === -1) {
          if (isJson) {
            outputJson({ error: `Reminder not found: ${message}` });
          } else {
            console.log(chalk.red(`  Reminder not found: ${message}`));
          }
          return;
        }
      } else if (index) {
        // Remove by index
        removedIndex = parseInt(index, 10) - 1;
        if (removedIndex < 0 || removedIndex >= reminders.length) {
          if (isJson) {
            outputJson({ error: `Invalid index: ${index}` });
          } else {
            console.log(chalk.red(`  Invalid index: ${index}. Must be 1-${reminders.length}`));
          }
          return;
        }
      } else {
        if (isJson) {
          outputJson({ error: "Specify index or --message" });
        } else {
          console.log(chalk.red("  Specify index or --message to remove a reminder."));
        }
        return;
      }

      removedMessage = reminders[removedIndex]!;
      reminders.splice(removedIndex, 1);
      saveReminders(ctx.projectRoot, reminders);

      if (isJson) {
        outputJson({ removed: removedMessage, index: removedIndex + 1, count: reminders.length });
      } else {
        console.log(chalk.green(`  ✓ Reminder removed: ${removedMessage}`));
        console.log(chalk.dim(`  Remaining reminders: ${reminders.length}`));
      }
    });

  // ── clear ───────────────────────────────────────────────────────────────
  cmd
    .command("clear")
    .description("Remove all reminders")
    .option("--json", "Output as JSON")
    .action((opts: Record<string, unknown>) => {
      const isJson = opts.json === true;
      const ctx = guardNotInitialized(opts, isJson);
      if (!ctx) return;

      const reminders = loadReminders(ctx.projectRoot);
      const count = reminders.length;

      saveReminders(ctx.projectRoot, []);

      if (isJson) {
        outputJson({ cleared: count });
      } else {
        if (count === 0) {
          console.log(chalk.dim("  No reminders to clear."));
        } else {
          console.log(chalk.green(`  ✓ Cleared ${count} reminder(s).`));
        }
      }
    });

  return cmd;
}
