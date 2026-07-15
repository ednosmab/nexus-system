import { Command } from "commander";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import chalk from "chalk";
import ora from "ora";
import fse from "fs-extra";
import { invalidateCache } from "../cache.js";
import { outputJson } from "../formatting.js";
import { checkLifecycleGate } from "../shared.js";
import { SHITEN_DIR_NAME } from "../constants.js";
import { output, outputBlank, outputError } from "../output.js";

const { copySync, ensureDirSync, writeFileSync } = fse;

interface FileChange {
  path: string;
  action: "create" | "update" | "skip";
  reason?: string;
}

export const syncCommand = new Command("sync")
  .description("Sync project governance files from shitenno-go")
  .option("-d, --dir <path>", "Target project directory (default: current)", ".")
  .option("-n, --shiten-path <path>", "Path to shitenno-go directory")
  .option("--dry-run", "Show what would be changed without making changes")
  .option("--force", "Overwrite all files without asking")
  .option("--json", "Output results as JSON")
  .action(async (options) => {
    const targetDir = resolve(options.dir);
    const shitenPath = options.shitenPath || process.env.SHITENNO_GO_PATH;
    const isJson = options.json === true;

    // Lifecycle gate check
    if (existsSync(resolve(targetDir, SHITEN_DIR_NAME))) {
      const gateShitenDir = resolve(targetDir, SHITEN_DIR_NAME);
      if (!checkLifecycleGate("sync", targetDir, gateShitenDir, isJson)) return;
    }

    if (!isJson) {
      outputBlank();
      output(chalk.bold.cyan("  ╔══════════════════════════════════════╗"));
      output(chalk.bold.cyan("  ║      shiten sync — Update Project     ║"));
      output(chalk.bold.cyan("  ╚══════════════════════════════════════╝"));
      outputBlank();
    }

    // Validate shitenno-go path
    if (!shitenPath) {
      if (isJson) {
        outputJson({ error: "missing_path", message: "shitenno-go path not specified. Use --shiten-path or SHITENNO_GO_PATH env var." });
      } else {
        output(chalk.red("  ✘ shitenno-go path not specified."));
        output(chalk.gray("  Use --shiten-path <path> or set SHITENNO_GO_PATH environment variable."));
        output(chalk.gray("  Example: shiten sync --shiten-path /path/to/shitenno-go"));
        output(chalk.gray("  Or: SHITENNO_GO_PATH=/path/to/shitenno-go shiten sync"));
      }
      return;
    }

    const shitenDir = resolve(shitenPath);
    if (!existsSync(shitenDir)) {
      if (isJson) {
        outputJson({ error: "missing_shiten_dir", message: `shitenno-go directory not found: ${shitenDir}` });
      } else {
        output(chalk.red(`  ✘ shitenno-go directory not found: ${shitenDir}`));
      }
      return;
    }

    // Check if target project has shitenno-go/ (initialized)
    if (!existsSync(resolve(targetDir, SHITEN_DIR_NAME))) {
      if (isJson) {
        outputJson({ error: "not_initialized", message: "Run 'shiten init' first, then 'shiten sync' to update." });
      } else {
        output(chalk.yellow("  ⚠ This project doesn't seem to be initialized with shiten."));
        output(chalk.gray("  Run 'shiten init' first, then 'shiten sync' to update."));
      }
      return;
    }

    const spinner = ora("Analysing changes...").start();

    try {
      // Get list of files to sync
      const filesToSync = getFilesToSync(shitenDir, targetDir);
      const changes: FileChange[] = [];

      // Analyse each file
      for (const file of filesToSync) {
        const shitenFile = join(shitenDir, file);
        const targetFile = join(targetDir, file);

        if (!existsSync(targetFile)) {
          changes.push({ path: file, action: "create" });
        } else {
          const shitenContent = readFileSync(shitenFile, "utf-8");
          const targetContent = readFileSync(targetFile, "utf-8");

          if (shitenContent !== targetContent) {
            changes.push({ path: file, action: "update" });
          } else {
            changes.push({ path: file, action: "skip", reason: "identical" });
          }
        }
      }

      spinner.stop();

      // Display changes
      output(chalk.bold("  Changes to apply:"));
      outputBlank();

      const createCount = changes.filter((c) => c.action === "create").length;
      const updateCount = changes.filter((c) => c.action === "update").length;
      const skipCount = changes.filter((c) => c.action === "skip").length;

      if (createCount > 0) {
        output(chalk.green(`    + ${createCount} files to create`));
      }
      if (updateCount > 0) {
        output(chalk.yellow(`    ~ ${updateCount} files to update`));
      }
      if (skipCount > 0) {
        output(chalk.gray(`    - ${skipCount} files unchanged`));
      }
      outputBlank();

      // Show detailed changes
      for (const change of changes) {
        if (change.action === "create") {
          output(chalk.green(`    + ${change.path}`));
        } else if (change.action === "update") {
          output(chalk.yellow(`    ~ ${change.path}`));
        }
      }

      if (options.dryRun) {
        if (isJson) {
          outputJson({ dryRun: true, createCount, updateCount, skipCount, changes: changes.map((c) => ({ path: c.path, action: c.action })) });
        } else {
          outputBlank();
          output(chalk.gray("  Dry run complete. No files were modified."));
        }
        return;
      }

      // Ask for confirmation if not forced
      if (!options.force && (createCount > 0 || updateCount > 0)) {
        outputBlank();
        const { confirm } = await import("inquirer").then((mod) =>
          mod.default.prompt([
            {
              type: "confirm",
              name: "confirm",
              message: "Apply these changes?",
              default: true,
            },
          ])
        );

        if (!confirm) {
          output(chalk.gray("  Sync cancelled."));
          return;
        }
      }

      // Apply changes
      const applySpinner = ora("Applying changes...").start();

      for (const change of changes) {
        if (change.action === "skip") continue;

        const shitenFile = join(shitenDir, change.path);
        const targetFile = join(targetDir, change.path);

        if (change.action === "create") {
          ensureDirSync(resolve(targetFile, ".."));
          copySync(shitenFile, targetFile);
        } else if (change.action === "update") {
          // Preserve project-specific customizations for certain files
          if (shouldPreserveCustomizations(change.path)) {
            const merged = mergeWithCustomizations(
              shitenFile,
              targetFile
            );
            writeFileSync(targetFile, merged, "utf-8");
          } else {
            copySync(shitenFile, targetFile);
          }
        }
      }

      applySpinner.stop();

      // Invalidate cache since shitenno-go/ may have changed
      invalidateCache(targetDir);

      if (isJson) {
        outputJson({
          dryRun: false,
          createCount,
          updateCount,
          skipCount,
          updated: changes.filter((c) => c.action !== "skip").map((c) => c.path),
        });
      } else {
        outputBlank();
        output(chalk.green("  ✔ Sync complete!"));
        outputBlank();
        output(chalk.gray("  Updated files:"));
        for (const change of changes) {
          if (change.action !== "skip") {
            output(chalk.gray(`    - ${change.path}`));
          }
        }
        outputBlank();
      }
    } catch (error) {
      spinner.stop();
      outputError(chalk.red(`  ✘ Sync failed: ${error}`));
      return;
    }
  });

export function getFilesToSync(shitenDir: string, _targetDir: string): string[] {
  const files: string[] = [];

  // Core files
  const coreFiles = [
    "docs/AGENTS.md",
    "docs/opencode-context.md",
    "docs/Shitenno-go_GUIDE.md",
    "opencode.json",
    "scripts/validate-session.ts",
    "scripts/close-session.ts",
  ];

  for (const file of coreFiles) {
    if (existsSync(join(shitenDir, file))) {
      files.push(file);
    }
  }

  // Skills
  const skillsDir = join(shitenDir, "docs/skills");
  if (existsSync(skillsDir)) {
    const skillFiles = fse.readdirSync(skillsDir).filter((f: string) =>
      f.endsWith(".md")
    );
    for (const skill of skillFiles) {
      files.push(`docs/skills/${skill}`);
    }
  }

  return files;
}

export function shouldPreserveCustomizations(filePath: string): boolean {
  // Files that should preserve project-specific customizations
  const preserveList = [
    "docs/AGENTS.md",
    "docs/opencode-context.md",
    "docs/Shitenno-go_GUIDE.md",
    "opencode.json",
  ];
  return preserveList.includes(filePath);
}

export function mergeWithCustomizations(
  shitenFile: string,
  targetFile: string
): string {
  const shitenContent = readFileSync(shitenFile, "utf-8");
  const targetContent = readFileSync(targetFile, "utf-8");

  // JSON files: merge preserving project-specific values
  if (shitenFile.endsWith(".json")) {
    return mergeJsonFiles(shitenContent, targetContent);
  }

  // Markdown files: preserve custom sections, update/add shiten sections
  if (shitenFile.endsWith(".md")) {
    return mergeMarkdownFiles(shitenContent, targetContent);
  }

  // For other files, use shiten content
  return shitenContent;
}

export function mergeJsonFiles(shitenContent: string, targetContent: string): string {
  try {
    const shiten = JSON.parse(shitenContent);
    const target = JSON.parse(targetContent);

    // Preserve project-specific models and permissions
    const preserved: Record<string, unknown> = {};

    // Preserve agent models and permissions from target
    if (target.agent && shiten.agent) {
      preserved.agent = { ...shiten.agent };
      for (const [agentName, agentConfig] of Object.entries(target.agent)) {
        if (preserved.agent && typeof preserved.agent === "object" && preserved.agent[agentName as keyof typeof preserved.agent]) {
          const preservedAgent = preserved.agent[agentName as keyof typeof preserved.agent] as Record<string, unknown>;
          const targetAgent = agentConfig as Record<string, unknown>;
          // Preserve user's model choices
          if (targetAgent.model) {
            preservedAgent.model = targetAgent.model;
          }
          // Preserve user's permission overrides
          if (targetAgent.permission) {
            preservedAgent.permission = targetAgent.permission;
          }
        }
      }
    }

    // Preserve MCP server configurations from target
    if (target.mcp) {
      preserved.mcp = target.mcp;
    }

    return JSON.stringify({ ...shiten, ...preserved }, null, 2);
  } catch {
    // If parsing fails, use shiten content
    return shitenContent;
  }
}

export function mergeMarkdownFiles(shitenContent: string, targetContent: string): string {
  // Extract sections from both files
  const shitenSections = extractSections(shitenContent);
  const targetSections = extractSections(targetContent);

  // Start with shiten content as base
  let result = shitenContent;

  // For each section in target, check if it's a custom section
  for (const [sectionTitle, sectionContent] of Object.entries(targetSections)) {
    // If section doesn't exist in shiten, it's custom - preserve it
    if (!shitenSections[sectionTitle]) {
      // Add custom section at the end
      result += `\n\n${sectionContent}`;
    }
    // If section exists but content differs, check if it's personalized
    else if (shitenSections[sectionTitle] !== sectionContent) {
      // Check if target section contains personalized content (not placeholders)
      if (!sectionContent.includes("[PERSONALIZAR:") && !sectionContent.includes("[Adicionar")) {
        // Preserve user's personalized content
        result = result.replace(shitenSections[sectionTitle], sectionContent);
      }
    }
  }

  return result;
}

export function extractSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split("\n");
  let currentSection = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check if line is a heading (## or ###)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      // Save previous section if exists
      if (currentSection) {
        sections[currentSection] = currentContent.join("\n");
      }
      // Start new section
      currentSection = headingMatch[2]?.trim() ?? "";
      currentContent = [line];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection] = currentContent.join("\n");
  }

  return sections;
}
