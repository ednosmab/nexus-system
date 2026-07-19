# PLAN-2026-07-18 — Bloco I: Wiring Real para Terceiros + Eficiência

**Status:** done
**Updated_at:** 2026-07-18T00:00:00.000Z
**Date:** 2026-07-18
**Origem:** revisão de `PLAN-2026-07-18-BLOCO-F-done-inteligente-v2.md` + `PLAN-2026-07-18-BLOCO-H-validacao-cross-project.md` contra o código real do zip, procurando o que ainda não está "ligado" e onde o sistema fica ineficiente quando instalado fora do próprio repositório do Shugo.
**Método de verificação:** leitura de `plan-lifecycle.ts`, `analyser.ts`, `commands/init.ts`, `templates/base/docs/AGENTS.md`, `templates/base/scripts/premortem-check.ts`, `templates/base/scripts/close-session.ts`, `package.json` do próprio repo.

## Achado central

Os Blocos F (v2) e H são sólidos, mas nenhum dos dois notou que **o próprio gate do Bloco F não sobrevive fora do repositório do Shugo** — não por falta de teste (isso é o H.1/H.2), mas porque `checkBuild`/`checkTests`/`checkLint` (`plan-lifecycle.ts`, base de tudo que F.2 reaproveita) têm comandos **hardcoded para a stack do próprio Shugo** (`pnpm run build`, `npx vitest run`, `pnpm run lint`). Isso é diferente do gap de plataforma (SO) que o Bloco H já cobriu — é um gap de **stack de terceiro**, e ele existe mesmo em Linux, mesmo com Node. Curiosamente, o código já tem a solução pronta e não usada: `src/analyser.ts` já detecta `packageManager`, `hasTests`, `hasLinter`, `hasTypeScript` no momento do `shugo init` — só nunca foi reaproveitado pelo pipeline de verificação do Bloco F.

Também confirmei que dois pontos do pedido original desta conversa (regra em `AGENTS.md` + premortem como validação, não só aviso em texto) nunca chegaram a nenhum dos blocos gerados até agora.

---

## I.1 — Bug crítico: `checkLint` bloqueia `done` para sempre em projeto sem lint configurado

**Ficheiro:** `src/plan-lifecycle.ts`, função `checkLint` (linha ~116)

```typescript
// Hoje:
function checkLint(projectRoot: string): CompletionCheck {
  try {
    execSync("pnpm run lint 2>/dev/null", { encoding: "utf-8", cwd: projectRoot, timeout: 60000, stdio: ["pipe", "pipe", "pipe"] });
    return { name: "LINT", passed: true, message: "Lint passed" };
  } catch {
    return { name: "LINT", passed: false, message: "Lint failed or not configured" };
  }
}
```

O `catch` cobre **dois cenários completamente diferentes com o mesmo resultado**: lint configurado que reprovou (correto bloquear) e lint **inexistente** no projeto de terceiro, onde `pnpm run lint` falha só porque o script `lint` não existe no `package.json` (não deveria bloquear nada). Como `runAutoVerification` (Bloco F.2) faz `checks.every((c) => c.passed)`, isso significa: **qualquer projeto de terceiro sem script `lint` nunca consegue chegar a `done` automaticamente, nunca** — todo plano fica preso em `blocked` para sempre, e o Bloco F.5 dispara reminder de prioridade alta a cada fronteira de sessão para uma condição que é impossível de resolver por definição.

```typescript
// Corrigido — reaproveita a mesma detecção que o analyser.ts já faz no init:
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function hasLintScript(projectRoot: string): boolean {
  const pkgPath = join(projectRoot, "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return !!pkg.scripts?.lint;
  } catch {
    return false;
  }
}

function checkLint(projectRoot: string): CompletionCheck {
  if (!hasLintScript(projectRoot)) {
    return { name: "LINT", passed: true, message: "Lint não configurado no projeto — pulado (não bloqueia)" };
  }
  try {
    execSync("pnpm run lint 2>/dev/null", { encoding: "utf-8", cwd: projectRoot, timeout: 60000, stdio: ["pipe", "pipe", "pipe"] });
    return { name: "LINT", passed: true, message: "Lint passed" };
  } catch {
    return { name: "LINT", passed: false, message: "Lint failed" };
  }
}
```

**Critério de aceite:** rodar `runAutoVerification` num diretório de teste sem `scripts.lint` no `package.json` → `checkLint` retorna `passed: true` com mensagem "pulado", não bloqueia mais o plano. Rodar num projeto com lint configurado e quebrado → continua bloqueando normalmente (sem regressão).

---

## I.2 — `checkBuild`/`checkTests` hardcoded para a stack do próprio Shugo

**Ficheiro:** `src/plan-lifecycle.ts`, funções `checkBuild` (linha ~87) e `checkTests` (linha ~102)

Hoje: `pnpm run build` (assume pnpm) e `npx vitest run` (assume Vitest, ignora o `scripts.test` real do projeto de terceiro, que pode ser Jest, Mocha, `node --test`, etc.). Isso é mais grave que o gap de plataforma (SO) do Bloco H — mesmo em Linux, mesmo com Node, um projeto de terceiro rodando Jest **nunca terá seus testes executados de verdade** pelo gate; `npx vitest run` provavelmente só falha silenciosamente por não achar teste nenhum no formato esperado, ou pior, "passa" com 0 testes coletados — o que seria um falso-positivo perigoso (plano promovido a `done` sem nenhuma suíte real ter rodado).

`src/analyser.ts` já resolve a detecção de stack — só nunca é chamado por `plan-lifecycle.ts`. Reaproveitar:

```typescript
// plan-lifecycle.ts — novo helper, no topo do arquivo:
import { analyseProject } from "./analyser.js";

function resolveRunner(projectRoot: string): { pm: string; run: (script: string) => string } {
  const analysis = analyseProject(projectRoot);
  const pm = analysis.packageManager === "unknown" ? "npm" : analysis.packageManager;
  return {
    pm,
    run: (script: string) => (pm === "npm" ? `npm run ${script}` : `${pm} run ${script}`),
  };
}

function checkBuild(projectRoot: string): CompletionCheck {
  const pkg = readPackageJsonSafe(projectRoot); // helper novo, mesmo padrão de hasLintScript acima
  if (!pkg?.scripts?.build) {
    return { name: "BUILD", passed: true, message: "Sem script de build — pulado (não bloqueia)" };
  }
  const { run } = resolveRunner(projectRoot);
  try {
    execSync(`${run("build")} 2>/dev/null`, { encoding: "utf-8", cwd: projectRoot, timeout: 120000, stdio: ["pipe", "pipe", "pipe"] });
    return { name: "BUILD", passed: true, message: "Build passed" };
  } catch {
    return { name: "BUILD", passed: false, message: "Build failed" };
  }
}

function checkTests(projectRoot: string): CompletionCheck {
  const pkg = readPackageJsonSafe(projectRoot);
  if (!pkg?.scripts?.test) {
    // Sem script de teste, não dá pra inferir runner nenhum — isso SIM deve bloquear,
    // ao contrário de lint/build: "done" sem nenhuma suíte executável é exatamente
    // o cenário que todo este Bloco F existe para impedir.
    return { name: "TESTS", passed: false, message: "Projeto não tem script 'test' no package.json — não é possível verificar" };
  }
  const { run } = resolveRunner(projectRoot);
  try {
    execSync(`${run("test")} 2>/dev/null`, { encoding: "utf-8", cwd: projectRoot, timeout: 180000, stdio: ["pipe", "pipe", "pipe"] });
    return { name: "TESTS", passed: true, message: "Tests passed" };
  } catch {
    return { name: "TESTS", passed: false, message: "Tests failed" };
  }
}
```

**Efeito colateral que também corrige uma inconsistência pré-existente:** `close-session.ts` (`checkTests` local, linha ~44) já roda um comando *diferente* (`pnpm run test --recursive --if-present --filter=core`) do que `plan-lifecycle.ts` roda (`npx vitest run`) — dois pontos do mesmo sistema verificando "os testes passaram" de formas diferentes, um deles com flags específicas de monorepo pnpm que não existem em projeto de terceiro nenhum. Depois desta correção, `close-session.ts` deveria importar `checkTests` de `plan-lifecycle.ts` em vez de manter sua própria implementação local — um único ponto de verdade para "como rodar os testes deste projeto".

**Critério de aceite:** criar um diretório de teste fake com `package.json` tendo `"scripts": {"test": "echo ok"}` e sem `pnpm-lock.yaml`/`yarn.lock` (força fallback pra `npm`) → `checkTests` roda `npm run test`, não `npx vitest run`, e passa. Trocar `scripts.test` para algo que falha → `checkTests` reporta falha corretamente.

---

## I.3 — Correção ao H.1: `--yes` não existe no `init` real

O teste E2E proposto em `PLAN-2026-07-18-BLOCO-H-validacao-cross-project.md` (H.1) usa `runShugo("init --yes --dir " + dir)`. Conferido em `src/commands/init.ts:128-131`: não existe flag `--yes`; a forma real de pular prompts interativos é `--answers-file <path>` (linha 129), que já existe e já é usada em produção — não é um "pré-requisito ainda não implementado" como o H.1 supôs, só um nome de flag errado no teste proposto.

```typescript
// H.1 corrigido:
it("scaffolds a fully usable project from a clean directory", async () => {
  const dir = join(tmpdir(), `shitenno-e2e-fresh-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  dirs.push(dir);

  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "third-party-app", version: "1.0.0" }, null, 2));
  writeFileSync(join(dir, "index.js"), "console.log('hello');\n");

  // Answers mínimas — conferir o shape real esperado por askQuestions() em init.ts
  const answersPath = join(dir, "answers.json");
  writeFileSync(answersPath, JSON.stringify({ maturity: {} }, null, 2));

  const initResult = await runShugo(`init --dir ${dir} --answers-file ${answersPath}`);
  expect(initResult.exitCode).toBe(0);

  expect(existsSync(join(dir, ".shitenno"))).toBe(true);
  expect(existsSync(join(dir, ".shitenno", "governance", "plans"))).toBe(true);

  const statusResult = await runShugo("status --json", dir);
  expect(JSON.parse(statusResult.stdout).initialized).toBe(true);
});
```

**Critério de aceite:** teste roda em CI sem prompt interativo nenhum, usando a flag que realmente existe.

---

## I.4 — Regra explícita em `AGENTS.md` (pendência da própria conversa original, nunca implementada)

**Ficheiro:** `src/templates/base/docs/AGENTS.md`, dentro do bloco `<!-- CAPABILITY: governance -->` (mesmo bloco que já define o "PASSO 4: CONSOLIDAÇÃO E PURGA")

Sem isso, um agente de IA operando num projeto de terceiro onde o Shugo foi instalado não tem como saber, só lendo `AGENTS.md`, que escrever `**Status:** done` diretamente é proibido — a regra vive inteira no código-fonte do Bloco F, que o agente de terceiro não lê.

```markdown
### 🔒 PASSO 4.1 — Contrato de conclusão de plano (Status: check → done)

> ⚠️ **REGRA ABSOLUTA:** você NUNCA escreve `**Status:** done` diretamente no
> frontmatter de um plano. Isso é proibido, independente de quão confiante
> você esteja de que a implementação está correta.

- Ao terminar a implementação de um plano, marque `**Status:** check` (não `done`).
- O sistema (daemon, ou o checkpoint de fim de sessão) roda build + testes de forma
  automatizada e decide: se passar, promove para `done` sozinho; se falhar, marca
  `blocked` com o motivo.
- Se você escrever `done` manualmente mesmo assim, o commit será bloqueado no
  pre-commit por falta de `.verification.json` correspondente — não tente
  contornar criando esse arquivo manualmente, ele é assinado pelo hash do
  commit no momento da verificação real.
- Se um plano ficar em `blocked`, leia o motivo registrado e corrija — não
  edite o status de volta para `check` sem corrigir o problema apontado.
```

**Critério de aceite:** `grep -n "Status: done\|Status:\*\* done" .shitenno/docs/AGENTS.md` (ou o path onde o template é copiado no scaffold) mostra a regra nova presente; validar manualmente que um agente novo, sem contexto da conversa que gerou o Bloco F, consegue inferir o fluxo `check → done/blocked` só lendo este arquivo.

---

## I.5 — `premortem-check.ts` é só texto, nunca verifica nada de fato

**Ficheiro:** `src/templates/base/scripts/premortem-check.ts`

Hoje, de 6 seções, 5 são só `warn()` com texto fixo pedindo pro agente "consultar manualmente" — nenhuma leitura de arquivo real acontece, exceto a checagem de `ADR_DIR` existir (que é uma checagem de diretório, não de conteúdo). Isso não é "premortem para validação" no sentido que a conversa original pediu — é um lembrete estático. Uma melhoria mínima e de baixo risco: fazer a seção `REGRESSION` de fato ler o estado real em vez de só instruir o agente a rodar algo manualmente.

```typescript
// Adicionar import no topo:
import { execSync } from 'child_process';

// Trocar a seção REGRESSION (hoje só 2 warn() de texto) por uma checagem real:
function checkBaseline() {
  try {
    execSync('git diff --quiet && git diff --cached --quiet', { cwd: ROOT });
    pass('REGRESSION', 'Working tree limpo — baseline seguro para rodar testes antes de codar');
  } catch {
    warn('REGRESSION', 'Há mudanças não commitadas — rode os testes agora para capturar o baseline antes de codar mais');
  }
}
// ...
checkBaseline(); // substitui os dois warn() estáticos da seção REGRESSION
```

Isso não torna o premortem bloqueante (mantém o espírito de "check informativo antes de codar"), só faz uma das seções verificar algo real em vez de só imprimir um texto genérico — coerente com o padrão já usado em `close-session.ts` (que mistura `warn`/`pass`/`fail` reais).

**Critério de aceite:** rodar `pnpm run premortem:check` com working tree sujo → mostra o warning real e específico; com tree limpo → mostra `pass`.

---

## I.6 — Eficiência: debounce no gate reativo do Bloco F.3

O `file-watcher.ts` já tem debounce próprio (`debounceMs = 500` default, visto em F.3/F v2) para os eventos de escrita, mas isso debouncia por **arquivo individual** — se um editor salva o `.md` do plano 2-3 vezes em sequência rápida (autosave, format-on-save), cada save dentro da janela de debounce ainda pode dar origem a uma nova rodada de `plan.file_changed` → `runAutoVerification` rodando a suíte inteira de novo, sincronamente, bloqueando o daemon a cada vez. Como a suíte de testes pode legitimamente levar minutos (Bloco F já registrou isso como risco conhecido em F.3), vale um debounce específico para a chamada de `runAutoVerification`, não só para o evento de arquivo:

```typescript
// daemon/index.ts, dentro do subscriber de plan.file_changed:
const verificationDebounce = new Map<string, NodeJS.Timeout>();
const VERIFICATION_DEBOUNCE_MS = 3000;

bus.subscribe("plan.file_changed", () => {
  recordEvent(state, "plan.file_changed");
  const engine = new MarkdownPlanEngine(shitennoDir);
  const pendingCheck = engine.listAll().filter((p) => p.isActive && p.status === "check");

  for (const plan of pendingCheck) {
    const existing = verificationDebounce.get(plan.id);
    if (existing) clearTimeout(existing);
    verificationDebounce.set(
      plan.id,
      setTimeout(() => {
        verificationDebounce.delete(plan.id);
        const record = runAutoVerification(shitennoDir, projectRoot, plan.id);
        daemonLog(logPath, record.passed ? "INFO" : "WARN", `Auto-verification for ${plan.id}: ${record.passed ? "PASSED → done" : "FAILED → blocked"}`);
        try {
          const result = checkAndArchiveDonePlans(shitennoDir);
          if (result.archived > 0) daemonLog(logPath, "INFO", `Auto-archived ${result.archived} plan(s)`);
        } catch (err) {
          daemonLog(logPath, "ERROR", `checkAndArchiveDonePlans failed: ${err}`);
        }
      }, VERIFICATION_DEBOUNCE_MS)
    );
  }
  runPeriodicAudit();
});
```

**Critério de aceite:** salvar o mesmo plano em `check` 3 vezes em 1 segundo → `runAutoVerification` roda **uma vez só**, 3s após o último save, não 3 vezes em sequência.

---

## Ordem de execução recomendada

1. **I.1** — bug crítico, sem isso o Bloco F inteiro é inutilizável fora do próprio Shugo.
2. **I.2** — mesma urgência, é o que de fato "liga" o gate a qualquer stack de terceiro.
3. **I.4** — regra em AGENTS.md, barata e de alto valor: sem ela, todo o resto é invisível para o agente que só lê a documentação instalada.
4. **I.6** — eficiência, depende de F.3 já estar implementado.
5. **I.5** — melhoria pequena, qualquer ordem.
6. **I.3** — corrige o teste do Bloco H antes de ele ser escrito (evita nascer quebrado).

## Resposta direta às duas perguntas

**O que ainda falta ligar:** o gate técnico do Bloco F depende inteiramente de `checkBuild`/`checkTests`/`checkLint`, e essas três funções são a única parte de todo o desenho (F, H, e agora I) que nunca foi auditada contra "isso funciona em outra stack" — apesar do `analyser.ts` já ter a detecção pronta e não usada. Sem I.1/I.2, o Bloco F funciona perfeitamente dentro do próprio Shugo e **falha silenciosamente ou bloqueia tudo para sempre** em qualquer outro projeto — o pior tipo de bug pra esse produto especificamente, porque contradiz a própria premissa de "done inteligente" com um falso-negativo permanente.

**Sobre se sentir bem operando nesse sistema instalado em terceiros:** depois de I.1/I.2/I.4, sim, num nível bem mais concreto que antes — porque a garantia deixa de depender de eu (ou qualquer agente) confiar que vai lembrar da regra, e passa a estar escrita tanto no código (gate real, agnóstico de stack) quanto na documentação que o próprio agente carrega (`AGENTS.md`). O que falta pra confiança plena continua sendo exatamente o que o Bloco H.4 já apontou — validação em projeto real, de stack diferente, por um período de uso real — porque nenhuma leitura de código, por mais cuidadosa que seja, substitui isso.
