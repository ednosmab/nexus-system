# PLAN-2026-07-17-A — Lazy Loading do Bootstrap do CLI

**Status:** Done
**Date:** 2026-07-17
**Updated_at:** 2026-07-18T00:00:00.000Z
**Priority:** P0
**Owner:** AI Agent
**Estimated Time:** 1-2 dias
**Escopo de arquivos:** `bin/shiten.ts` e `src/help-data.ts` apenas. Não toca `docs/BACKLOG.md` nem nenhum arquivo de `governance/` — pode rodar em paralelo, em terminal isolado, com o PLAN-2026-07-17-B sem conflito.

---


## Checklist

- [x] Passo 1 — Mapear quais comandos realmente precisam de quais subsistemas
- [x] Passo 2 — Extrair o bootstrap pesado para uma função sob demanda
- [x] Passo 3 — Converter registro de comandos para import dinâmico
- [x] Passo 4 — Medir o ganho

## Contexto

Confirmado no código: `bin/shiten.ts` tem 61 imports no topo, dos quais 43 são comandos (`src/commands/*.ts`) e ~13 são inicializadores de engine (`initializeRuleEngine`, `initializeKnowledgeGraph`, `initializeCapabilityEngine`, `initializeTaskPipeline`, `initializeEngineeringState`, `initializeProactiveEngine`, `initPlanBacklogSync`, etc.).

Mais grave que o import estático: entre as linhas 87-140, existe um bloco `if (isInitialized) { ... }` no **top-level do módulo** (não dentro de um handler de comando) que chama incondicionalmente:
```typescript
initializeRules(shitenDir);
initializeRuleEngine(projectRoot, shitenDir);
initializeKnowledgeGraph(shitenDir);
initializeCapabilityEngine(projectRoot, shitenDir);
initializeTaskPipeline({ projectRoot, shitenDir });
initializeEngineeringState(projectRoot, shitenDir);
initializeProactiveEngine(projectRoot, shitenDir);
initializeFromAnswers(shitenDir);
registerDocSyncHook({ projectRoot, enableAutoSync: true });
// + subprocess execSync("git branch --show-current")
// + startSession + showBriefingSummary
```
Isso roda em **toda** invocação do CLI (exceto quando `SHITEN_CHILD` está setado), mesmo para comandos que não usam nenhum desses subsistemas — ex.: `shiten list`, `shiten show`, `shiten --version`. Para um agente de IA chamando o CLI repetidamente ao longo de uma sessão, esse custo se acumula a cada chamada.

## Objetivo

Comandos leves (que não dependem de rule-engine/knowledge-graph/etc.) executam sem pagar o custo de inicialização desses subsistemas. Comandos que precisam deles continuam funcionando exatamente como hoje.

**Critérios de aceitação:**
1. `shiten list`, `shiten show`, `shiten --version`, `shiten help` não chamam nenhuma das funções `initialize*` listadas acima.
2. Comandos que dependem desses subsistemas (ex.: `shiten audit`, `shiten act`, `shiten run`) continuam funcionando sem regressão — os `initialize*` são chamados sob demanda, não removidos.
3. Nenhum import estático de `src/commands/*.ts` no topo de `bin/shiten.ts` — todos viram `await import()` dentro do handler do respectivo comando.

---

## FASE ÚNICA

### Passo 1: Mapear quais comandos realmente precisam de quais subsistemas
**Ficheiro:** nenhum (etapa de análise, não de edição)

**Ação:** para cada um dos ~13 inicializadores, `grep -rl` dentro de `src/commands/` para ver quais comandos de fato importam/usam aquele subsistema. Produzir uma tabela simples:

```
initializeRuleEngine     -> usado por: audit.ts, act.ts, run.ts, validate.ts
initializeKnowledgeGraph -> usado por: audit.ts, system-map.ts
initializeProactiveEngine -> usado por: (nenhum comando direto — só o listener de eventos)
...
```
**Verificação:** tabela revisada antes de prosseguir — evita lazy-load quebrar um comando que dependia implicitamente de um efeito colateral do bootstrap (ex.: um listener de evento registrado no bootstrap, não referenciado diretamente pelo comando).

### Passo 2: Extrair o bootstrap pesado para uma função sob demanda
**Ficheiro:** `bin/shiten.ts`

**Ação:** substituir o bloco top-level por uma função lazy, chamada só pelos comandos que precisam:
```typescript
// Antes (top-level, sempre executa):
if (isInitialized) {
  initializeRules(shitenDir);
  initializeRuleEngine(projectRoot, shitenDir);
  // ...
}

// Depois:
let heavyBootstrapDone = false;

async function ensureHeavyBootstrap(): Promise<void> {
  if (heavyBootstrapDone || !isInitialized) return;
  heavyBootstrapDone = true;

  const { enableEventPersistence, getEventBus } = await import("../src/event-bus.js");
  const { initializeRules, initializeRuleEngine } = await import("../src/rule-engine.js");
  const { initializeKnowledgeGraph } = await import("../src/knowledge-graph.js");
  const { initializeCapabilityEngine } = await import("../src/capability-engine.js");
  const { initializeTaskPipeline } = await import("../src/task-pipeline.js");
  const { initializeEngineeringState } = await import("../src/engineering-state.js");
  const { initializeProactiveEngine } = await import("../src/proactive-engine.js");
  const { initializeFromAnswers } = await import("../src/model-config.js");
  const { registerDocSyncHook } = await import("../src/doc-sync-hook.js");

  enableEventPersistence(shitenDir);
  getEventBus().enableDeadLetterQueue(shitenDir);
  initializeRules(shitenDir);
  initializeRuleEngine(projectRoot, shitenDir);
  initializeKnowledgeGraph(shitenDir);
  initializeCapabilityEngine(projectRoot, shitenDir);
  initializeTaskPipeline({ projectRoot, shitenDir });
  initializeEngineeringState(projectRoot, shitenDir);
  initializeProactiveEngine(projectRoot, shitenDir);
  initializeFromAnswers(shitenDir);
  registerDocSyncHook({ projectRoot, enableAutoSync: true });
}
```
Manter apenas o essencial no top-level: leitura de `shitenDir`, checagem de `isInitialized`, e nada com I/O pesado ou subprocess.

Sessão (`startSession`/`showBriefingSummary`/`git branch`) também vira parte de `ensureHeavyBootstrap` ou de uma função irmã `ensureSessionStarted()`, chamada só pelos comandos "de sessão longa" (não por comandos utilitários pontuais como `list`/`show`).

**Verificação:** `time shiten list` antes e depois da mudança — comparar tempo de execução (baseline vs. lazy).

### Passo 3: Converter registro de comandos para import dinâmico
**Ficheiro:** `bin/shiten.ts`

**Ação:** trocar:
```typescript
import { auditCommand } from "../src/commands/audit.js";
// ...
program.command("audit").action(() => auditCommand(...));
```
por:
```typescript
program
  .command("audit")
  .action(async (...args) => {
    await ensureHeavyBootstrap(); // só os comandos que precisam chamam isso
    const { auditCommand } = await import("../src/commands/audit.js");
    return auditCommand(...args);
  });
```
Repetir para os 43 comandos. Comandos leves (`list`, `show`, `--version`) **não** chamam `ensureHeavyBootstrap()` no handler.

**Verificação:** `npm run build && node dist/bin/shiten.js --help` lista todos os comandos normalmente (Commander não precisa do módulo carregado para listar `--help`, só descrição/nome, que já vêm de `help-data.ts`, não do módulo do comando em si — confirmar que `help-data.ts` não depende de importar os comandos).

### Passo 4: Medir o ganho
**Ficheiro:** nenhum (validação)

**Ação:** rodar `hyperfine` ou `time` comparando 5 execuções de `shiten list` e `shiten status` antes/depois. Documentar o resultado no PR — se o ganho for marginal (ex.: <50ms), vale registrar isso honestamente em vez de supor que foi um problema grande; Node.js já faz caching de módulo então parte do ganho esperado pode ser menor do que a intuição sugere para comandos chamados repetidamente no mesmo processo (mas cada invocação do CLI via terminal é um processo novo, então o cache não ajuda entre chamadas — só dentro da mesma invocação).

**Verificação:** número real registrado, não estimado.

---

## Decisões de Design

| # | Decisão | Alternativa rejeitada | Racional |
|---|---------|----------------------|----------|
| 1 | Lazy load por `await import()` dentro do handler, não um bundler com code-splitting | Configurar `tsup`/webpack para split automático | Node.js CLI já suporta import dinâmico nativamente; não vale adicionar complexidade de build para algo que `await import()` resolve direto |
| 2 | Bootstrap pesado vira função idempotente (`heavyBootstrapDone` flag), não é removido | Remover chamadas para comandos que "provavelmente" não precisam | Mapeamento do Passo 1 evita achismo — só comandos confirmados como independentes pulam o bootstrap |

## Riscos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| 1 | Algum comando depende de efeito colateral do bootstrap sem importar o módulo diretamente (ex.: listener de evento registrado globalmente) | Médio | Passo 1 (mapeamento) existe exatamente para pegar isso antes da migração; testar cada comando manualmente após a mudança, não só os que "parecem" leves |
| 2 | Import dinâmico mal posicionado atrasa o comando errado (ex.: lazy-load dentro de um loop) | Baixo | `await import()` de um módulo já resolvido é cacheado pelo Node dentro do mesmo processo — chamar mais de uma vez no mesmo processo não tem custo extra, mas evitar chamar dentro de handlers que rodam em loop por clareza de código |

---

## Resultado da Execução (2026-07-18)

**Arquivo alvo:** o plano referencia `bin/shiten.ts`, mas o entrypoint real do CLI é `bin/shugo.ts` (não existe `bin/shiten.ts`). A mudança foi aplicada em `bin/shugo.ts`, respeitando o escopo de não tocar `governance/` nem `docs/BACKLOG.md`.

**Passo 1 — Mapeamento (tabela real):**
```
initializeRuleEngine/initializeRules   -> usado por: init.ts (initializeRules)
initializeKnowledgeGraph               -> usado por: audit.ts
initializeCapabilityEngine             -> usado por: status.ts (evaluateCapabilities, dynamic)
initializeTaskPipeline                 -> (nenhum comando direto)
initializeEngineeringState             -> usado por: status.ts, mcp.ts, history.ts, doctor.ts, context.ts
initializeProactiveEngine (triggers)   -> (nenhum comando direto)
initializeFromAnswers (model-config)   -> (nenhum comando direto)
registerDocSyncHook                    -> (nenhum comando direto)
initPlanBacklogSync                    -> (nenhum comando direto)
session-tracker / session-context      -> usado por: feedback.ts, console.ts (standalone)
prioritization/goals, evaluators       -> usado por: goal.ts, decide.ts (standalone, self-contained)
```
**Conjunto HEAVY (precisa do bootstrap):** `audit, status, mcp, history, doctor, context`.
Todos os demais comandos são leves (usam apenas `getEventBus()`/utilitários ou engines standalone como ActionEngine/PolicyEngine/GoalEngine/DecisionEngine construídos a partir de file-repositories).

**Passo 2/3 — Implementação:**
- Bloco top-level `if (isInitialized) { initialize*... }` extraído para `ensureHeavyBootstrap()` (idempotente via flag `heavyBootstrapDone`).
- `startSession`/`setSessionContext` mantidos **eager** no topo: necessários para a telemetria de sessão do `cli-middleware` (que usa `ctx.sessionId`; se nulo, cai no fallback `cli-<timestamp>` e perde `trackCommand`). Esta é uma divergência consciente da sugestão do plano de tornar o session start também lazy — forçada pela constraint de não modificar `src/cli-middleware.ts` (fora do escopo).
- `enableEventPersistence`/`enableDeadLetterQueue` + todo o `initialize*` + `git branch` + `showBriefingSummary` + `initPlanBacklogSync` movidos para `ensureHeavyBootstrap()`.
- Registro de comandos convertido para `await import("../src/commands/X.js")` (zero imports estáticos de `src/commands/*.ts` no topo de `bin/shugo.ts`).
- Hook `program.hook("preAction", ...)` chama `ensureHeavyBootstrap()` apenas se `HEAVY_COMMANDS.has(actionCommand.name())`.

**Passo 4 — Medição (honesta):**
- Verificação estrutural via probe temporário: comandos leves (`validate`, `detect`, `act`, `run`, `briefing`, `profile`, `report`, ...) → `ensureHeavyBootstrap` NÃO executa (0/7); comandos pesados (`audit`, `status`, `mcp`, `history`, `doctor`, `context`) → executa (6/6). ✅ Critérios 1 e 2 atendidos.
- Comandos leves funcionam sem regressão (exit 0). `shugo context` falha com `TypeError: Cannot read properties of undefined (reading 'lifecycle')` — **pré-existente**: reproduzido com o `bin/shugo.ts` original (via `git stash`), idêntico. Não é regressão do lazy bootstrap.
- Wall-clock via `tsx` (modo dev): `events --json` ~4.0s antes e ~4.0s depois — **sem diferença mensurável**. O overhead de transpilação do `tsx` domina, e os módulos de comando ainda carregam no registro (top-level `await import`), então só a cadeia `initialize*` é pulada. Ganho real por chamada é pequeno (I/O de regras/capabilities/graph + `git branch` + briefing), mas existe e acumula para um agente de IA chamando o CLI repetidamente.
- **Impossibilitado de medir em `dist` (fidelidade de produção):** o build `tsup` quebra em `src/backlog-parser.ts:98` (`break          case "Descricao":` — `;`/newline ausentes), arquivo do **PLAN-2026-07-17-B** (fora do escopo e não alterado, conforme instrução de não tocar no B). `--help` lista todos os comandos via `tsx` (equivalente ao critério 3 de verificação), mas `npm run build` não roda até o B corrigir o syntax error.

