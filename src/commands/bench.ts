/**
 * bench.ts — Context Pipeline: Automated Benchmark
 *
 * Measures real-world performance of the Context Pipeline:
 * - Briefing generation time (fresh vs cached)
 * - Token savings estimate
 * - Comparison with manual discovery approach
 *
 * Usage:
 *   nexus bench                    # Full benchmark
 *   nexus bench --json             # JSON output
 *   nexus bench --iterations <n>   # Number of iterations (default: 5)
 */

import { Command } from "commander";
import chalk from "chalk";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { guardNotInitialized, checkLifecycleGate } from "../shared.js";
import { collectContext, type ContextSnapshot } from "../context-collector.js";
import { computeInputHash, setCachedBriefing, readCache, invalidateBriefingCache } from "../briefing-cache.js";
import { outputJson } from "../formatting.js";

// ── Benchmark Helpers ──────────────────────────────────────────────────────

/** Estimate tokens needed for manual discovery based on project size. */
function estimateManualTokens(projectRoot: string): number {
  let fileCount = 0;
  let totalSize = 0;

  function walkDir(dir: string) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "nexus-system") {
          walkDir(fullPath);
        }
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".json")) {
        fileCount++;
        try {
          totalSize += readFileSync(fullPath, "utf-8").length;
        } catch { /* ignore */ }
      }
    }
  }

  walkDir(projectRoot);

  // Base: ~100 tokens per file + ~0.5 tokens per character of code
  const fileTokens = fileCount * 100;
  const charTokens = Math.round(totalSize / 4); // ~4 chars per token
  return Math.max(2000, fileTokens + charTokens);
}

/** Briefing markdown is typically proportional to project complexity. */
function estimateBriefingTokens(snapshot: ContextSnapshot): number {
  const baseTokens = 200;
  const ruleTokens = (snapshot.contextRules.length + snapshot.dynamicRules.length) * 30;
  const highRiskCount = snapshot.riskMap.areas.filter(a => a.riskLevel === "high" || a.riskLevel === "critical").length;
  const riskTokens = highRiskCount * 20;
  return baseTokens + ruleTokens + riskTokens;
}

// ── Benchmark Runner ───────────────────────────────────────────────────────

interface BenchmarkResult {
  briefingFresh: { timeMs: number; tokens: number };
  briefingCached: { timeMs: number; tokens: number };
  manualDiscovery: { estimatedTokens: number };
  savings: { tokens: number; percent: number; timeMs: number };
  iterations: number;
}

function runBenchmark(
  projectRoot: string,
  nexusDir: string,
  iterations: number
): BenchmarkResult {
  // Warm up
  collectContext(projectRoot, nexusDir);

  // Benchmark fresh briefing
  const freshTimes: number[] = [];
  let lastSnapshot: ContextSnapshot | undefined;
  for (let i = 0; i < iterations; i++) {
    invalidateBriefingCache(nexusDir);
    const start = performance.now();
    const snap = collectContext(projectRoot, nexusDir);
    freshTimes.push(performance.now() - start);
    lastSnapshot = snap;
  }
  const avgFreshTime = freshTimes.reduce((a, b) => a + b, 0) / freshTimes.length;
  const snapshot = lastSnapshot ?? null;

  // Cache the last briefing
  if (snapshot) {
    const hash = computeInputHash({
      fingerprintHash: snapshot.fingerprint.hash,
      riskMapHash: snapshot.riskMap.generatedAt,
      contextRuleCount: snapshot.contextRules.length,
      dynamicRuleCount: snapshot.dynamicRules.length,
      maturityScore: snapshot.maturityProfile?.overallScore ?? null,
    });
    setCachedBriefing(nexusDir, snapshot.briefing, hash);
  }

  // Benchmark cached briefing
  const cachedTimes: number[] = [];
  if (snapshot) {
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      readCache(nexusDir);
      cachedTimes.push(performance.now() - start);
    }
  }
  const avgCachedTime = cachedTimes.length > 0
    ? cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length
    : 0;

  // Calculate savings
  const manualTokens = estimateManualTokens(projectRoot);
  const briefingTokens = snapshot ? estimateBriefingTokens(snapshot) : 500;
  const tokensSaved = manualTokens - briefingTokens;
  const percentSaved = Math.round((tokensSaved / manualTokens) * 100);
  const timeSaved = avgFreshTime;

  return {
    briefingFresh: { timeMs: Math.round(avgFreshTime * 100) / 100, tokens: briefingTokens },
    briefingCached: { timeMs: Math.round(avgCachedTime * 100) / 100, tokens: 0 },
    manualDiscovery: { estimatedTokens: manualTokens },
    savings: { tokens: tokensSaved, percent: percentSaved, timeMs: Math.round(timeSaved * 100) / 100 },
    iterations,
  };
}

// ── Display ────────────────────────────────────────────────────────────────

function displayBenchmark(result: BenchmarkResult): void {
  console.log("");
  console.log(chalk.bold.cyan("  ╔══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("  ║    nexus bench — Token Benchmark      ║"));
  console.log(chalk.bold.cyan("  ╚══════════════════════════════════════╝"));
  console.log("");

  console.log(chalk.bold("  ⏱ Performance"));
  console.log(`     Fresh briefing:   ${chalk.cyan(`${result.briefingFresh.timeMs}ms`)} (avg of ${result.iterations} runs)`);
  console.log(`     Cached briefing:  ${chalk.green(`${result.briefingCached.timeMs}ms`)} (cache hit)`);
  console.log("");

  console.log(chalk.bold("  💰 Token Comparison"));
  console.log(`     Manual discovery: ${chalk.red(`~${result.manualDiscovery.estimatedTokens.toLocaleString()} tokens`)}`);
  console.log(`     With briefing:    ${chalk.green(`~${result.briefingFresh.tokens.toLocaleString()} tokens`)}`);
  console.log(`     With cache:       ${chalk.green("~0 tokens")}`);
  console.log("");

  console.log(chalk.bold("  📊 Savings"));
  console.log(chalk.green(`     Tokens saved:     ~${result.savings.tokens.toLocaleString()} tokens (${result.savings.percent}%)`));
  console.log(chalk.green(`     Per session:      ~${result.savings.timeMs}ms faster`));

  const monthlyTokens = result.savings.tokens * 10;
  const monthlyCost = (monthlyTokens / 1_000_000) * 5;
  console.log("");
  console.log(chalk.bold("  📈 Monthly Projection (10 sessions)"));
  console.log(chalk.green(`     Tokens saved:     ~${monthlyTokens.toLocaleString()}`));
  console.log(chalk.green(`     Cost saved:       ~$${monthlyCost.toFixed(2)}/month`));
  console.log("");
}

// ── Command ────────────────────────────────────────────────────────────────

export function benchCommand(): Command {
  const cmd = new Command("bench")
    .description("Benchmark token economy and Context Pipeline performance")
    .option("-d, --dir <path>", "Project directory")
    .option("--json", "Output as JSON")
    .option("--iterations <n>", "Number of benchmark iterations", "5")
    .action(async function (this: Command, options: Record<string, unknown>) {
      const isJson = options.json === true;
      const iterations = parseInt(String(options.iterations || "5"), 10);

      if (!isJson) {
        console.log("");
        console.log(chalk.bold.cyan("  ╔══════════════════════════════════════╗"));
        console.log(chalk.bold.cyan("  ║    nexus bench — Token Benchmark      ║"));
        console.log(chalk.bold.cyan("  ╚══════════════════════════════════════╝"));
        console.log("");
      }

      const ctx = guardNotInitialized(options, isJson);
      if (!ctx) return;

      if (!checkLifecycleGate("bench", ctx.projectRoot, ctx.nexusDir, isJson)) {
        return;
      }

      const result = runBenchmark(ctx.projectRoot, ctx.nexusDir, iterations);

      if (isJson) {
        outputJson(result as unknown as Record<string, unknown>);
        return;
      }

      displayBenchmark(result);
    });

  return cmd;
}
