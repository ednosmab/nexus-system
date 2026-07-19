import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type { HealthIssue } from "./types.js";

export function detectStaleVerification(projectRoot: string, shitennoDir: string): HealthIssue[] {
  const statusPath = join(shitennoDir, "governance", "last-verify.json");

  if (!existsSync(statusPath)) {
    return [{
      type: "governance_integrity",
      severity: 2,
      description: "Nenhum verify:all registrado ainda — rode 'shugo audit --level code-review --full-sweep' antes do próximo plan close.",
      location: "governance/last-verify.json",
      recommendation: "Execute 'shugo audit --level code-review --full-sweep' para registrar uma verificação completa.",
    }];
  }

  const status = JSON.parse(readFileSync(statusPath, "utf-8"));
  let currentHead: string;
  try {
    currentHead = execSync("git rev-parse HEAD", { cwd: projectRoot, encoding: "utf-8" }).trim();
  } catch {
    return []; // não é repo git (ex.: ambiente de teste) — não é achado de saúde, é ambiente.
  }

  const issues: HealthIssue[] = [];

  if (status.commitHash !== currentHead) {
    issues.push({
      type: "governance_integrity",
      severity: 1,
      description: `Última verificação foi no commit ${String(status.commitHash).slice(0, 7)}, HEAD atual é ${currentHead.slice(0, 7)} — pode estar desatualizada.`,
      location: "governance/last-verify.json",
      recommendation: "Execute 'shugo audit --level code-review --full-sweep' para verificar com o commit atual.",
    });
  }

  if (status.passed === false) {
    issues.push({
      type: "governance_integrity",
      severity: 3,
      description: `verify:all falhou na última execução (${status.timestamp}) e ainda não foi corrigido.`,
      location: "governance/last-verify.json",
      recommendation: "Corrija os problemas de build/test/lint e execute 'shugo audit --level code-review --full-sweep' novamente.",
    });
  }

  return issues;
}
