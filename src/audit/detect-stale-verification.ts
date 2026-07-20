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
    return [];
  }

  const issues: HealthIssue[] = [];

  // CORREÇÃO: ancestralidade, não igualdade. baseCommit nunca pode ser igual
  // ao HEAD do commit que contém o arquivo que o registra — é auto-referência
  // impossível (hash de commit é endereçado por conteúdo, só existe depois
  // que a árvore, incluindo este arquivo, já fechou). "Desatualizado" precisa
  // significar "o histórico foi reescrito desde então" (rebase/reset), não
  // "é diferente do HEAD atual" — isso é sempre verdadeiro por construção e
  // gera ruído em 100% dos planos, o que estava acontecendo até agora.
  let isAncestor = true;
  try {
    execSync(`git merge-base --is-ancestor ${status.commitHash} HEAD`, { cwd: projectRoot, stdio: "pipe" });
  } catch {
    isAncestor = false;
  }

  if (!isAncestor) {
    issues.push({
      type: "governance_integrity",
      severity: 1,
      description: `Última varredura completa (commit ${String(status.commitHash).slice(0, 7)}) não é mais ancestral do HEAD atual (${currentHead.slice(0, 7)}) — provável rebase/reset que invalida o registro.`,
      location: "governance/last-verify.json",
      recommendation: "Execute 'shugo audit --level code-review --full-sweep' novamente.",
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
