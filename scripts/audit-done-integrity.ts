/**
 * audit-done-integrity.ts — Retroactive audit for done/ plan integrity
 *
 * Checks:
 *   1. Plans in done/ without .verification.json (missing verification sidecar)
 *   2. Plans with .verification.json where passed=false (failed verification)
 *   3. Plans with .verification.json where commitHash doesn't exist in git history
 *
 * Usage:
 *   npx tsx scripts/audit-done-integrity.ts [--json]
 *
 * Exit code: 0 if all OK, 1 if any issue found.
 */

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import { execSync } from "node:child_process";

const projectRoot = process.cwd();
const doneDir = join(projectRoot, ".shitenno", "governance", "plans", "done");
const jsonMode = process.argv.includes("--json");

interface AuditResult {
  planId: string;
  issue: "missing_verification" | "failed_verification" | "invalid_json" | "orphaned_sidecar" | "stale_commit_hash";
  detail: string;
}

const issues: AuditResult[] = [];

function commitExistsInGit(hash: string): boolean {
  try {
    execSync(`git cat-file -e ${hash}`, { cwd: projectRoot, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

if (!existsSync(doneDir)) {
  if (jsonMode) {
    console.log(JSON.stringify({ ok: true, issues: [] }));
  } else {
    console.log("✅ No done/ directory found — nothing to audit");
  }
  process.exit(0);
}

const mdFiles = readdirSync(doneDir).filter((f) => f.endsWith(".md"));
const sidecarFiles = readdirSync(doneDir).filter((f) => f.endsWith(".verification.json"));

// Check 1: .md files without .verification.json
for (const file of mdFiles) {
  const planId = basename(file, ".md");
  const verificationPath = join(doneDir, `${planId}.verification.json`);

  if (!existsSync(verificationPath)) {
    issues.push({
      planId,
      issue: "missing_verification",
      detail: `${planId} está em done/ sem .verification.json — possivel bypass do pipeline`,
    });
    continue;
  }

  try {
    const record = JSON.parse(readFileSync(verificationPath, "utf-8"));

    if (!record.passed) {
      issues.push({
        planId,
        issue: "failed_verification",
        detail: `${planId} tem .verification.json com passed=false`,
      });
    }

    if (record.commitHash && record.commitHash !== "unknown") {
      if (!commitExistsInGit(record.commitHash)) {
        issues.push({
          planId,
          issue: "stale_commit_hash",
          detail: `${planId} referencia commit ${record.commitHash} que não existe no histórico git (rebase/squash?)`,
        });
      }
    }
  } catch {
    issues.push({
      planId,
      issue: "invalid_json",
      detail: `${planId} tem .verification.json mas o JSON é inválido`,
    });
  }
}

// Check 2: orphaned .verification.json without matching .md
for (const sidecar of sidecarFiles) {
  const planId = basename(sidecar, ".verification.json");
  const mdPath = join(doneDir, `${planId}.md`);
  if (!existsSync(mdPath)) {
    issues.push({
      planId,
      issue: "orphaned_sidecar",
      detail: `.verification.json órfão para ${planId} — .md não existe em done/`,
    });
  }
}

// Output
if (jsonMode) {
  console.log(JSON.stringify({ ok: issues.length === 0, issues }, null, 2));
} else {
  if (issues.length === 0) {
    console.log("✅ Todos os planos em done/ têm verificação válida");
  } else {
    console.error(`❌ ${issues.length} problema(s) de integridade encontrado(s):\n`);
    for (const issue of issues) {
      console.error(`  [${issue.issue}] ${issue.detail}`);
    }
    console.error("\nAção recomendada: mover planos problemáticos de volta para plans/ e re-executar o fluxo check → done.");
  }
}

process.exit(issues.length > 0 ? 1 : 0);
