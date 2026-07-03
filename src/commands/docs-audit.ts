import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { join } from "node:path";
import {
  auditDocLifecycle,
  applyMoves,
  writeDocLifecycleReport,
  type DocLifecycleReport,
  type DocLifecycleStatus,
} from "../doc-lifecycle-auditor.js";
import { outputJson, healthBar } from "../formatting.js";
import { guardNotInitialized, checkLifecycleGate } from "../shared.js";
import { getEventBus } from "../event-bus.js";

export const docsAuditCommand = new Command("docs-audit")
  .description("Audit documentation lifecycle status and propose organization")
  .option("-d, --dir <path>", "Project root directory (default: auto-detect)")
  .option("--apply", "Apply proposed moves (requires confirmation)")
  .option("--json", "Output results as JSON")
  .action(async (options) => {
    const isJson = options.json === true;

    if (!isJson) {
      console.log("");
      console.log(chalk.bold.cyan("  ╔══════════════════════════════════════╗"));
      console.log(chalk.bold.cyan("  ║    nexus docs-audit — Doc Lifecycle  ║"));
      console.log(chalk.bold.cyan("  ╚══════════════════════════════════════╝"));
      console.log("");
    }

    const ctx = guardNotInitialized(options, isJson);
    if (!ctx) return;

    if (!checkLifecycleGate("docs-audit", ctx.projectRoot, ctx.nexusDir, isJson)) return;

    const spinner = isJson ? null : ora("Auditing documentation lifecycle...").start();

    try {
      // Run audit
      const report = auditDocLifecycle(ctx.projectRoot, ctx.nexusDir);

      // Write report
      const reportFile = writeDocLifecycleReport(ctx.nexusDir, report);

      if (spinner) {
        spinner.succeed(`Audit complete — ${report.totalDocuments} documents analysed`);
      }

      // JSON output
      if (isJson) {
        outputJson({
          projectRoot: ctx.projectRoot,
          totalDocuments: report.totalDocuments,
          statusCounts: getStatusCounts(report),
          clusters: report.clusters,
          proposedMoves: report.proposedMoves,
          summary: report.summary,
          reportFile,
          auditedAt: report.auditedAt,
        });
        return;
      }

      // Human-readable output
      console.log(chalk.bold("  📊 Documentation Lifecycle Report:"));
      console.log("");

      const statusCounts = getStatusCounts(report);
      console.log(chalk.gray(`    Total documents: ${report.totalDocuments}`));
      console.log(chalk.gray(`    Active:         ${statusCounts.planned + statusCounts.in_progress}`));
      console.log(chalk.gray(`    Completed:      ${statusCounts.completed}`));
      console.log(chalk.gray(`    Superseded:     ${statusCounts.superseded}`));
      console.log(chalk.gray(`    Stale:          ${statusCounts.stale}`));
      console.log(chalk.gray(`    Clusters:       ${report.clusters.length}`));
      console.log("");

      // Proposed moves
      if (report.proposedMoves.length > 0) {
        const mode = options.apply ? "Apply" : "Proposed Moves (dry-run)";
        console.log(chalk.bold(`  🔍 ${mode}:`));
        console.log("");

        for (const move of report.proposedMoves) {
          const statusColor = getStatusColor(move.status);
          console.log(chalk.cyan(`    ${move.source}`));
          console.log(chalk.gray(`      → ${move.destination}`));
          console.log(chalk.gray(`      Status: ${statusColor(move.status)} (confidence: ${getConfidenceForMove(report, move)})`));
          console.log(chalk.gray(`      Reason: ${move.reason}`));
          console.log("");
        }
      } else {
        console.log(chalk.green("  ✔ No moves proposed. Documentation is well organized."));
        console.log("");
      }

      // Clusters
      if (report.clusters.length > 0) {
        console.log(chalk.bold("  💡 Clusters detected:"));
        console.log("");

        for (const cluster of report.clusters) {
          console.log(chalk.yellow(`    ${cluster.id}: ${cluster.description}`));
          for (const doc of cluster.documents) {
            console.log(chalk.gray(`      - ${doc}`));
          }
          console.log(chalk.gray(`      Recommendation: ${cluster.recommendation}`));
          console.log("");
        }
      }

      // Apply moves if requested
      if (options.apply && report.proposedMoves.length > 0) {
        console.log(chalk.bold("  📁 Applying moves..."));
        console.log("");

        const result = applyMoves(report, ctx.nexusDir, false);

        if (result.movesApplied > 0) {
          console.log(chalk.green(`    ✔ ${result.movesApplied} move(s) applied successfully`));
        }
        if (result.movesSkipped > 0) {
          console.log(chalk.yellow(`    ⊘ ${result.movesSkipped} move(s) skipped`));
        }
        if (result.errors.length > 0) {
          console.log(chalk.red("    Errors:"));
          for (const error of result.errors) {
            console.log(chalk.red(`      - ${error}`));
          }
        }
        console.log("");
      }

      // Summary
      console.log(chalk.bold("  📝 Summary:"));
      console.log(chalk.gray(`    ${report.summary}`));
      console.log("");

      if (reportFile) {
        console.log(chalk.gray(`  📄 Report saved: nexus-system/reports/${reportFile}`));
        console.log("");
      }

      // Publish event
      getEventBus().publish("doc.lifecycle.audited", {
        totalDocuments: report.totalDocuments,
        classified: getStatusCounts(report),
        clustersDetected: report.clusters.length,
        movesProposed: report.proposedMoves.length,
      });

    } catch (error) {
      if (isJson) {
        outputJson({ error: "docs_audit_failed", message: String(error) });
      } else {
        if (spinner) spinner.fail("Documentation lifecycle audit failed");
        console.log(chalk.red(`  Error: ${error}`));
        console.log("");
      }
    }
  });

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusCounts(report: DocLifecycleReport): Record<DocLifecycleStatus, number> {
  const counts: Record<DocLifecycleStatus, number> = {
    planned: 0,
    in_progress: 0,
    completed: 0,
    superseded: 0,
    stale: 0,
  };

  for (const classification of report.classifications) {
    counts[classification.status]++;
  }

  return counts;
}

function getStatusColor(status: DocLifecycleStatus) {
  switch (status) {
    case "completed":
      return chalk.green;
    case "in_progress":
      return chalk.blue;
    case "planned":
      return chalk.yellow;
    case "superseded":
      return chalk.gray;
    case "stale":
      return chalk.red;
    default:
      return chalk.white;
  }
}

function getConfidenceForMove(report: DocLifecycleReport, move: { source: string }): string {
  const classification = report.classifications.find((c) => c.path.endsWith(move.source));
  if (classification) {
    return `${Math.round(classification.confidence * 100)}%`;
  }
  return "unknown";
}
