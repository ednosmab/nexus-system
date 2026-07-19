# Plano — Bloco F: Mecanismo de `done` Inteligente (v2 — corrigido)

**Status:** Done
**Updated_at:** 2026-07-18T00:00:00.000Z
**Date:** 2026-07-18
**Origem:** v2 do `PLAN-2026-07-18-BLOCO-F-done-inteligente.md`, após auditoria de código linha a linha que encontrou 2 bugs na v1 antes de qualquer linha ser escrita. Complementa `PLAN-2026-07-18-correcoes-cirurgicas.md` (recomendado executar Bloco A e B daquele plano antes deste).
**Método de verificação usado:** leitura de código-fonte linha a linha (`markdown-plan-engine.ts`, `plan-lifecycle.ts`, `daemon/index.ts`, `templates/base/scripts/close-session.ts`, `briefing.ts`, `commands/reminders.ts`, `commands/shell-init.ts`) contra o zip `shitenno-feat-audit.zip`.

## Changelog v1 → v2

| # | Bug na v1 | Onde foi pego | Correção nesta versão |
|---|---|---|---|
| 1 | `runAutoVerification` chamava `engine.updateStatus(id, "done")` **antes** de escrever o `.verification.json`. `updateStatus` já move o `.md` para `done/` de forma síncrona (`markdown-plan-engine.ts:392-394`), então o sidecar nascia órfão em `governance/plans/` e nunca era arrastado. | Leitura de `updateStatus()` linha a linha — ela chama `this.moveToDone(id)` diretamente, sem passar por `archiveIfDone`. | F.2 reescrito: grava o `.verification.json` **antes** de `updateStatus`; a lógica de "arrastar o sidecar" migrou de `archiveIfDone` (F.2.1 antigo, removido) para dentro de `moveToDone()`, que é o único ponto físico de movimentação — cobre os dois caminhos de chamada (via `updateStatus` e via `archiveIfDone`). |
| 2 | F.4 mantinha `detectActivePlans(resolve(GOV, 'plans'))`, herdando um bug pré-existente: `detectActivePlans` espera `shitennoDir` e concatena `governance/plans` internamente — path duplicado (`.shitenno/governance/plans/governance/plans`), que nunca existe, então a checagem sempre retornava lista vazia. | Leitura de `detectActivePlans()` (`plan-lifecycle.ts:49-52`) + `GOV`/`ROOT` em `close-session.ts:8-9`. | F.4 corrigido para chamar `detectActivePlans(resolve(ROOT, '.shitenno'))`. |

---

## Vulnerabilidade real confirmada (por que este bloco existe)

Hoje o fluxo é:

1. `MarkdownPlanEngine.updateStatus(id, "done")` (`src/markdown-plan-engine.ts:326`) só escreve o status no frontmatter e **já move o arquivo para `done/` de forma síncrona, dentro da própria função** (linha 392-394) — não roda build, não roda teste, não roda lint.
2. O daemon já escuta `plan.file_changed` (`src/daemon/index.ts:~317`, publicado por `file-watcher.ts`) e, ao disparar, chama `checkAndArchiveDonePlans()` (`src/plan-lifecycle.ts:332`), que chama `engine.archiveIfDone(id)` (`src/markdown-plan-engine.ts:429`) para cada plano ativo.
3. `archiveIfDone` só verifica `plan.status === "done"` (linha 432) — nenhuma verificação técnica — e move o arquivo com `moveToDone(id)`.

Dois caminhos chegam em `done/` sem gate hoje: (A) qualquer código que chame `updateStatus(id, "done")` diretamente, e (B) um agente editando o `.md` à mão para `status: done` no frontmatter, que o file-watcher detecta e o daemon arquiva via `archiveIfDone`. **Ambos passam, no fim, por `moveToDone()`** — esse é o único choke-point físico real, e é onde a v2 deste plano ancora a garantia (não em `archiveIfDone`, como a v1 tentava).

---

## F.1 — Estender `MarkdownPlanStatus`

*(inalterado da v1 — sem bug encontrado aqui)*

**Ficheiro:** `src/markdown-plan-engine.ts`

```typescript
// Antes (linha 22):
export type MarkdownPlanStatus = "andamento" | "parado" | "done";

// Depois:
export type MarkdownPlanStatus = "andamento" | "parado" | "check" | "done" | "blocked";
```

Ajustar `normalizeStatusValue` (linha ~149) para reconhecer `"check"` e `"blocked"` nas variações de texto que o agente possa escrever (`"Check"`, `"Verificando"`, `"Blocked"`, `"Bloqueado"`), usando o mesmo `looseMatch` já existente na linha 179.

**Regra de negócio nova, no comentário do topo do arquivo (linha 7):**
```typescript
// Antes:
// Status flow: andamento → parado → done

// Depois:
// Status flow: andamento → parado → check → done
//                                      ↳ blocked (retry → check)
// "done" e "blocked" só devem ser escritos pelo pipeline de verificação
// (ver plan-lifecycle.ts:runAutoVerification), nunca diretamente pelo agente.
```

**Critério de aceite:** `npx vitest run src/__tests__/markdown-plan-engine.test.ts` — 0 falhas; type-check aceita os dois novos valores em todo call site.

---

## F.2 — Pipeline de verificação automatizada (CORRIGIDO na v2)

**Ficheiro:** `src/plan-lifecycle.ts`

`checkBuild`, `checkTests`, `checkLint` (linhas 88, 102, 116) já existem e já fazem o necessário — só não são exportadas. Reaproveitar, não duplicar:

```typescript
export function checkBuild(projectRoot: string): CompletionCheck { /* já existe, só adicionar export */ }
export function checkTests(projectRoot: string): CompletionCheck { /* idem */ }
export function checkLint(projectRoot: string): CompletionCheck { /* idem */ }

export interface VerificationRecord {
  planId: string;
  commitHash: string;
  checks: CompletionCheck[];
  passed: boolean;
  timestamp: string;
}

export function runAutoVerification(
  shitennoDir: string,
  projectRoot: string,
  planId: string
): VerificationRecord {
  const checks = [checkBuild(projectRoot), checkTests(projectRoot), checkLint(projectRoot)];
  const passed = checks.every((c) => c.passed);
  const commitHash = execSync("git rev-parse HEAD", { cwd: projectRoot, encoding: "utf-8" }).trim();

  const record: VerificationRecord = {
    planId,
    commitHash,
    checks,
    passed,
    timestamp: new Date().toISOString(),
  };

  const engine = new MarkdownPlanEngine(shitennoDir);
  const plansDir = join(shitennoDir, "governance", "plans");

  if (passed) {
    // CORREÇÃO v2: grava o sidecar ANTES de mudar o status.
    // updateStatus(id, "done") move o .md sincronamente dentro dela mesma
    // (markdown-plan-engine.ts:392-394) — se o .verification.json for escrito
    // depois dessa chamada, o .md já não está mais em plansDir, e o sidecar
    // fica órfão, nunca migra para done/.
    writeFileSync(
      join(plansDir, `${planId}.verification.json`),
      JSON.stringify(record, null, 2),
      "utf-8"
    );
    engine.updateStatus(planId, "done"); // moveToDone() (ver F.2.1) arrasta o sidecar junto
  } else {
    engine.updateStatus(planId, "blocked");
    const failedNames = checks.filter((c) => !c.passed).map((c) => c.name).join(", ");
    logger.warn("plan-lifecycle", `Plan ${planId} blocked — failed: ${failedNames}`);
  }

  return record;
}
```

### F.2.1 — `moveToDone()` arrasta o `.verification.json` (CORRIGIDO na v2 — mudou de arquivo/função em relação à v1)

Na v1 este passo mexia em `archiveIfDone`. Está errado: quando `updateStatus` chama `moveToDone` diretamente (o caminho mais comum, usado pelo próprio F.2), `archiveIfDone` **nunca é executado** para aquele plano — o arquivo já foi movido antes de o daemon sequer rodar sua varredura. A correção certa fica no único ponto físico compartilhado pelos dois caminhos:

**Ficheiro:** `src/markdown-plan-engine.ts`, dentro de `moveToDone` (linha 413):

```typescript
// Antes:
moveToDone(id: string): void {
  const sourcePath = join(this.plansDir, `${id}.md`);
  const destPath = join(this.doneDir, `${id}.md`);

  if (!existsSync(sourcePath)) {
    throw new Error(`Plan file not found: ${sourcePath}`);
  }

  renameSync(sourcePath, destPath);
}

// Depois:
moveToDone(id: string): void {
  const sourcePath = join(this.plansDir, `${id}.md`);
  const destPath = join(this.doneDir, `${id}.md`);

  if (!existsSync(sourcePath)) {
    throw new Error(`Plan file not found: ${sourcePath}`);
  }

  renameSync(sourcePath, destPath);

  // NOVO: arrasta o .verification.json junto, se existir. Cobre os dois
  // caminhos de chamada — via updateStatus() direto e via archiveIfDone()
  // (chamado pelo daemon quando o agente edita o .md manualmente).
  const verificationSrc = join(this.plansDir, `${id}.verification.json`);
  const verificationDest = join(this.doneDir, `${id}.verification.json`);
  if (existsSync(verificationSrc)) {
    renameSync(verificationSrc, verificationDest);
  }
}
```

`archiveIfDone` **não precisa de nenhuma mudança** — ela já chama `this.moveToDone(id)` (linha 438), então herda o comportamento novo automaticamente.

**Caso a cobrir explicitamente:** um agente edita o `.md` na mão para `status: done` (sem passar por `runAutoVerification`) — não existe `.verification.json` nesse caso, `moveToDone` simplesmente não encontra o sidecar (`existsSync` falso) e move só o `.md`, exatamente como hoje. Isso é esperado e correto: é o cenário que o **F.6** (hook de pre-commit) precisa capturar, não o F.2/F.2.1 — arquivo em `done/` sem `.verification.json` ao lado é o sinal de bypass que o F.6 já checa.

**Critério de aceite:** rodar `runAutoVerification` num plano com testes quebrados propositalmente → status vira `blocked`, nenhum arquivo é movido. Corrigir o teste, rodar de novo → status vira `done`, `.md` **e** `.verification.json` aparecem juntos em `done/` na mesma operação. Adicionar teste unitário para `moveToDone()` cobrindo os dois casos (com e sem sidecar presente).

---

## F.3 — Gate primário: reaproveitar o subscriber `plan.file_changed` já existente

*(inalterado da v1 — sem bug encontrado aqui; a correção de F.2/F.2.1 não afeta este bloco)*

**Ficheiro:** `src/daemon/index.ts` (~linha 317-330)

```typescript
// Antes:
bus.subscribe("plan.file_changed", () => {
  recordEvent(state, "plan.file_changed");
  try {
    const result = checkAndArchiveDonePlans(shitennoDir);
    if (result.archived > 0) {
      daemonLog(logPath, "INFO", `Auto-archived ${result.archived} plan(s): ${result.archivedIds.join(", ")}`);
    }
  } catch (err) {
    daemonLog(logPath, "ERROR", `checkAndArchiveDonePlans failed: ${err}`);
  }
  runPeriodicAudit();
});

// Depois — roda verificação para qualquer plano em "check" ANTES de tentar arquivar:
bus.subscribe("plan.file_changed", () => {
  recordEvent(state, "plan.file_changed");
  try {
    const engine = new MarkdownPlanEngine(shitennoDir);
    const pendingCheck = engine.listAll().filter((p) => p.isActive && p.status === "check");
    for (const plan of pendingCheck) {
      const record = runAutoVerification(shitennoDir, projectRoot, plan.id);
      daemonLog(
        logPath,
        record.passed ? "INFO" : "WARN",
        `Auto-verification for ${plan.id}: ${record.passed ? "PASSED → done" : "FAILED → blocked"}`
      );
    }

    const result = checkAndArchiveDonePlans(shitennoDir);
    if (result.archived > 0) {
      daemonLog(logPath, "INFO", `Auto-archived ${result.archived} plan(s): ${result.archivedIds.join(", ")}`);
    }
  } catch (err) {
    daemonLog(logPath, "ERROR", `checkAndArchiveDonePlans failed: ${err}`);
  }
  runPeriodicAudit();
});
```

Import necessário no topo de `daemon/index.ts`: adicionar `runAutoVerification` ao import já existente de `../plan-lifecycle.js` (linha 19).

**Nota de risco (já era válida na v1, mantida):** `runAutoVerification` roda `npx vitest run` de forma síncrona (`execSync`) dentro do handler do event bus — se a suíte demorar minutos, bloqueia o loop de eventos do daemon nesse intervalo. Já é uma limitação pré-existente em `checkTests` (timeout de 180s); registrar como item de acompanhamento, fora do escopo deste bloco.

**Critério de aceite:** editar manualmente um plano em `governance/plans/` para `**Status:** check`, salvar com o daemon rodando → em segundos, `daemon.log` mostra `Auto-verification for <id>: PASSED → done` (ou `FAILED → blocked`), e o `.md` **e** `.verification.json` somem juntos de `plans/` para `plans/done/` só no caso de sucesso.

---

## F.4 — Checkpoint de fronteira de sessão (CORRIGIDO na v2)

**Ficheiro:** `src/templates/base/scripts/close-session.ts`

Além da mudança funcional da v1 (rodar o pipeline em vez de só avisar), esta versão corrige um bug pré-existente que a v1 teria herdado silenciosamente: `detectActivePlans(shitennoDir)` (`plan-lifecycle.ts:49`) espera o diretório `.shitenno`, não o diretório de planos — ela mesma concatena `governance/plans` internamente via `new MarkdownPlanEngine(shitennoDir)`. O código original de `close-session.ts` chama `detectActivePlans(resolve(GOV, 'plans'))`, onde `GOV = resolve(ROOT, '.shitenno', 'governance')` — path duplicado (`.shitenno/governance/plans/governance/plans`), que nunca existe, então o check sempre relatou "nenhum plano ativo", mesmo quando havia.

```typescript
// Antes (linha ~104-118, já era assim mesmo antes do Bloco F):
async function checkPlanLifecycle() {
  try {
    const { detectActivePlans } = await import(resolve(ROOT, 'dist', 'plan-lifecycle.js'));
    const plans = detectActivePlans(resolve(GOV, 'plans'));   // <- bug: path duplicado
    if (plans.length > 0) {
      warn('PLAN_LIFECYCLE', `${plans.length} active plan(s) — run "shugo plan md lifecycle" to review and archive`);
      for (const p of plans) {
        console.log(`         → ${p.id}: ${p.title} [${p.status}]`);
      }
    } else {
      pass('PLAN_LIFECYCLE', 'No active plans — all archived');
    }
  } catch {
    warn('PLAN_LIFECYCLE', 'Plan lifecycle module not available — run pnpm build first');
  }
}

// Depois:
async function checkPlanLifecycle() {
  try {
    const { detectActivePlans, runAutoVerification } = await import(resolve(ROOT, 'dist', 'plan-lifecycle.js'));
    const shitennoDir = resolve(ROOT, '.shitenno');
    // CORREÇÃO v2: detectActivePlans espera shitennoDir, não o dir de planos.
    const plans = detectActivePlans(shitennoDir);
    const pendingCheck = plans.filter((p: { status: string }) => p.status === 'check');

    if (pendingCheck.length > 0) {
      warn('PLAN_LIFECYCLE', `${pendingCheck.length} plan(s) em "check" ao fechar sessão — rodando verificação agora`);
      for (const p of pendingCheck) {
        const record = runAutoVerification(shitennoDir, ROOT, p.id);
        if (record.passed) {
          pass('PLAN_LIFECYCLE', `${p.id} → verificado e movido para done/`);
        } else {
          fail('PLAN_LIFECYCLE', `${p.id} → bloqueado (${record.checks.filter((c: { passed: boolean }) => !c.passed).map((c: { name: string }) => c.name).join(', ')})`);
        }
      }
    }

    const stillActive = plans.filter((p: { status: string }) => p.status !== 'done' && !pendingCheck.some((pc: { id: string }) => pc.id === p.id));
    if (stillActive.length > 0) {
      warn('PLAN_LIFECYCLE', `${stillActive.length} plan(s) ainda em andamento/parado — normal, não é bloqueante`);
    }
    if (plans.length === 0) {
      pass('PLAN_LIFECYCLE', 'No active plans — all archived');
    }
  } catch {
    warn('PLAN_LIFECYCLE', 'Plan lifecycle module not available — run pnpm build first');
  }
}
```

**Nota:** manter como `warn`/`fail` de log (não `process.exit(1)` direto aqui) — `fail()` já marca `exitCode = 1` (linha 14 de `close-session.ts`), que é o comportamento correto: sessão não fecha "limpa" com plano recém-bloqueado sem o humano/agente saber.

**Critério de aceite:** com um plano genuinamente ativo em `governance/plans/`, rodar `close-session.ts` → agora reporta corretamente `N plan(s) ativo(s)` em vez de sempre `No active plans` (validação de regressão do bug pré-existente). Deixar um plano em `check` propositalmente → script roda a suíte, promove ou bloqueia, exit code reflete o resultado.

---

## F.5 — Reminder de prioridade para `check` que sobrevive a uma fronteira de sessão

*(inalterado da v1 — sem bug encontrado aqui)*

Reaproveitar a infra de reminders já existente (`src/decision-core/executors/create-reminder.ts` + `context_buffer.yaml` + `briefing.ts`), que já ordena por prioridade (`briefing.ts:479-482`, `high → medium → low`). Tipo real é `ReminderPriority = "high" | "medium" | "low"` — mapear P0→`"high"`, P1→`"medium"` na mensagem, não no campo de prioridade.

```typescript
import { CreateReminderExecutor } from '../decision-core/executors/create-reminder.js'; // ajustar path relativo real

async function nagStalePlan(shitennoDir: string, projectRoot: string, planId: string, sessionsSincePending: number) {
  const priority = sessionsSincePending > 1 ? 'high' : 'medium';
  const executor = new CreateReminderExecutor();
  await executor.execute(
    {
      message: `Plano ${planId} segue em 'check' há ${sessionsSincePending} fronteira(s) de sessão — verificação não conseguiu resolver`,
      priority,
      category: 'infra',
    },
    { projectRoot, shitennoDir }
  );
}
```

`sessionsSincePending` precisa de um contador persistido — o frontmatter YAML do plano é o lugar mais simples (`updateStatus` já escreve `updated_at`; adicionar `check_since_sessions`, incrementado por `close-session.ts` toda vez que encontrar o mesmo plano ainda em `check` após tentar verificar).

**Efeito colateral gratuito:** `commands/shell-init.ts` (linha 28-31) já dispara `notify-send` para reminders de prioridade `"high"` no início de cada sessão de shell — assim que esse reminder for criado com prioridade `high`, a notificação de início de sessão já cobre o caso, sem código de notificação novo.

**Critério de aceite:** simular 2 fronteiras de sessão consecutivas com o mesmo plano preso em `check` → reminder de prioridade `high` aparece em `context_buffer.yaml` e no topo do próximo `shugo briefing`.

---

## F.6 — Hook de pre-commit + CI (rede de segurança, não gate primário)

*(inalterado da v1 — sem bug encontrado aqui; agora é a rede de segurança que cobre exatamente o caso "sem sidecar" descrito no fim de F.2.1)*

**Novo ficheiro:** `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"
node scripts/verify-done-plans.js || exit 1
```

**Novo ficheiro:** `scripts/verify-done-plans.ts`
```typescript
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

const doneDir = join(process.cwd(), ".shitenno", "governance", "plans", "done");
let failed = false;

for (const file of readdirSync(doneDir)) {
  if (!file.endsWith(".md")) continue;
  const planId = basename(file, ".md");
  const verificationPath = join(doneDir, `${planId}.verification.json`);

  if (!existsSync(verificationPath)) {
    console.error(`❌ ${planId}: done sem .verification.json — possível bypass do pipeline`);
    failed = true;
    continue;
  }

  const record = JSON.parse(readFileSync(verificationPath, "utf-8"));
  if (!record.passed) {
    console.error(`❌ ${planId}: .verification.json existe mas passed=false`);
    failed = true;
  }
}

if (failed) {
  console.error("\nCommit bloqueado: plano(s) marcados 'done' sem prova de verificação válida.");
  process.exit(1);
}
console.log("✅ Todos os planos em done/ têm verification.json válido");
```

**CI (`.github/workflows/ci.yml`)**:
```yaml
- name: Verify done plans have valid verification records
  run: npx tsx scripts/verify-done-plans.ts
```

**Critério de aceite:** commitar manualmente um `.md` em `done/` sem `.verification.json` correspondente → pre-commit bloqueia; se passar por algum motivo, o job de CI falha o PR.

---

## F.7 — Desktop notify

*(inalterado da v1 — sem bug encontrado aqui)*

### F.7.1 — Extrair `sendDesktopNotification` para módulo compartilhado

**Novo ficheiro:** `src/notify.ts`
```typescript
import { execFileSync } from "node:child_process";
import type { ReminderPriority } from "./briefing.js";

export function sendDesktopNotification(title: string, message: string, priority: ReminderPriority = "medium"): void {
  try {
    const urgency = priority === "high" ? "critical" : priority === "low" ? "low" : "normal";
    execFileSync("notify-send", [title, message, `--urgency=${urgency}`], { stdio: "pipe", timeout: 2000 });
  } catch {
    // notify-send indisponível — falha silenciosa, igual ao comportamento já existente hoje.
  }
}
```
Atualizar `src/commands/reminders.ts` (linha 125) para importar de `./notify.js` em vez de manter a definição local.

### F.7.2 — Notificação de início de sessão: já existe

`shell-init.ts` já dispara `notify-send` no início de sessão para reminders `priority: "high"`. F.5 já cobre gerar o reminder com a prioridade certa — nenhuma ação de código adicional aqui.

### F.7.3 — Nag periódico de plano pendente (sem `setInterval`)

**Ficheiro:** `src/daemon/index.ts`, próximo aos outros timers (~linha 473-490), usando `setTimeout` auto-reagendado (evita empilhamento se a verificação demorar mais que o intervalo):

```typescript
import { sendDesktopNotification } from "../notify.js";

const CHECK_NAG_INTERVAL_MS = 30 * 60 * 1000; // confirmar com o time: 30min assumido
let checkNagTimer: NodeJS.Timeout;

function scheduleCheckNag() {
  checkNagTimer = setTimeout(async () => {
    try {
      const engine = new MarkdownPlanEngine(shitennoDir);
      const pending = engine.listAll().filter((p) => p.isActive && p.status === "check");
      if (pending.length > 0) {
        sendDesktopNotification(
          "Shugo — plano pendente",
          `${pending.length} plano(s) em 'check' aguardando verificação: ${pending.map((p) => p.id).join(", ")}`,
          "medium"
        );
      }
    } catch (err) {
      daemonLog(logPath, "ERROR", `Check-nag failed: ${err}`);
    } finally {
      scheduleCheckNag();
    }
  }, CHECK_NAG_INTERVAL_MS);
}
scheduleCheckNag();
```

No `shutdown()` existente (~linha 549): `clearTimeout(checkNagTimer);`

**Pendência a confirmar:** o intervalo "30" — assumido 30 minutos; ajustar o literal se a intenção era outra unidade.

**Critério de aceite:** daemon rodando com plano preso em `check` → notificação desktop aparece via `notify-send` na cadência configurada, sem spam, sem travar o daemon entre ticks.

---

## Ordem de execução recomendada

1. **F.1** — tipo novo, base para tudo o resto.
2. **F.2 + F.2.1** — pipeline de verificação **na ordem corrigida** (sidecar antes do `updateStatus`, arrasto dentro de `moveToDone`). Testar isoladamente com um plano fake antes de plugar em qualquer gatilho.
3. **F.3** — gate primário (reaproveita subscriber existente).
4. **F.4** — checkpoint de fronteira de sessão, com o path corrigido de `detectActivePlans`.
5. **F.5** — reminders de prioridade.
6. **F.7.1 → F.7.3** — desktop notify.
7. **F.6** — hook + CI por último, como rede de segurança final.

Depois de cada item: `npm run build && npx vitest run`.

## Critério de aceite geral do Bloco F (v2)

- Editar um plano para `Status: check` com testes quebrados de propósito → nunca vira `done`; vira `blocked` com motivo registrado.
- Corrigir os testes, plano volta a `check` → vira `done` automaticamente, com `.md` **e** `.verification.json` chegando juntos em `done/` na mesma operação (não em passos separados que podem falhar entre si).
- Tentar mover manualmente um `.md` para `done/` via `mv` bruto, sem passar pelo pipeline → pre-commit bloqueia por falta de `.verification.json`.
- Encerrar sessão com plano em `check` → `close-session.ts` roda a verificação ali mesmo, e agora **detecta corretamente** que há planos ativos (regressão do bug de path duplicado corrigida).
- Plano preso em `check` por mais de uma fronteira de sessão → reminder de prioridade alta aparece no briefing e dispara notificação desktop na próxima sessão de shell.
