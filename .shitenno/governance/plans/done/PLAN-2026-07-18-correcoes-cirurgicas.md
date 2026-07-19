# PLAN-2026-07-18 — Correções Cirúrgicas (Auditoria dos 6 planos anteriores)

**Status:** Done

**Origem:** auditoria de `shitenno-feat-audit.zip` contra os 6 planos de 16-17/07 + suíte de testes real (`vitest run`).
**Método de verificação usado:** leitura de código-fonte linha a linha + `npm run build && npx vitest run`. Números abaixo são reais, não estimados.
**Estado real da suíte no momento da auditoria:** 13 testes falhando em 7 arquivos (de 2040 testes, 2017 passando). Cada item abaixo referencia o teste que ele deve fazer voltar a passar.

Ordem de execução sugerida: Bloco A primeiro (corrige testes quebrados, baixo risco, poucas linhas cada), depois Bloco B (achados nunca implementados do plano de closeout), depois Bloco C (estrutural, maior escopo).

---

## BLOCO A — Testes quebrados hoje (corrigir primeiro, é o que está sangrando agora)

### A.1 — Bug do rebrand: paths sem o ponto de `.shitenno`

**Testes afetados:** `src/__tests__/sync-docs.test.ts`, `src/__tests__/plugin-examples-syntax.test.ts`

**Causa raiz:** `apply_rebrand.py` só tratou o prefixo de ponto (`.shitenno`) para o padrão estreito `_DIR_NAME = "shitenno"`. Qualquer outro lugar do código com a pasta hardcoded como string literal ficou sem o ponto.

**Ficheiro:** `src/__tests__/plugin-examples-syntax.test.ts`
```typescript
// Antes:
const pluginsDir = join(process.cwd(), "shitenno", "plugins");

// Depois:
import { SHITENNO_DIR_NAME } from "../constants.js";
const pluginsDir = join(process.cwd(), SHITENNO_DIR_NAME, "plugins");
```

**Ficheiro:** `src/__tests__/sync-docs.test.ts`
```typescript
// Localizar a definição de SYSTEM_MAP (e README, se também hardcoded) e trocar
// o segmento literal "shitenno" pela constante:
import { SHITENNO_DIR_NAME } from "../constants.js";
const SYSTEM_MAP = join(process.cwd(), SHITENNO_DIR_NAME, "governance", "SYSTEM_MAP.md");
```

**Ação extra de prevenção:** rodar
```bash
grep -rn 'join([^)]*"shitenno"' src --include="*.ts" | grep -v '__tests__' | grep -v SHITENNO_DIR_NAME
```
para achar qualquer outro lugar em código de produção (não teste) com o mesmo padrão. Os `__tests__/*.ts` que usam `"shitenno"` como nome de pasta de **fixture temporária** (`tmpdir()/shitenno-test-xyz`) não precisam mudar — são pastas de teste isoladas, não o path real do projeto. Só mudar onde o path é resolvido a partir de `process.cwd()`/`projectRoot` real.

**Critério de aceite:** `npx vitest run src/__tests__/sync-docs.test.ts src/__tests__/plugin-examples-syntax.test.ts` — 0 falhas.

---

### A.2 — `mcp-server.test.ts`: contrato de `getRules` quebrado (5 testes)

**Causa raiz:** o Fase 2 do plano de governança reescreveu `handleGetRules` para retornar `{ mandatory_rules, contextual_rules, dynamic_rules, engine_rules }` (snake_case, chaves novas), mas os testes existentes (pré-existentes, não escritos para essa mudança) ainda esperam o contrato antigo: `{ contextRules, dynamicRules, engineRules }` (camelCase). Ninguém rodou a suíte depois de mudar o formato de saída — é uma breaking change de API não coordenada.

**Decisão necessária antes de codar:** escolher uma opção e ser consistente:

- **Opção 1 (recomendada — menor risco):** manter as chaves antigas (`contextRules`, `dynamicRules`, `engineRules`) e apenas *adicionar* `mandatoryRules` como campo novo, sem quebrar quem já consome a tool MCP.
- **Opção 2:** manter o contrato novo e atualizar os testes — só faz sentido se já se sabe que nenhum consumidor externo (agente de IA já em uso) depende do formato antigo.

**Ficheiro:** `src/mcp-server-handlers.ts`, dentro de `handleGetRules` — aplicando a Opção 1:
```typescript
const result: {
  mandatoryRules: Array<{ id: string; path: string; priority: number }>;
  contextRules: Array<{ id: string; rule: string; rationale: string; priority: number; area: string; basedOn: string }>;
  dynamicRules: Array<{ id: string; rule: string; severity: string; evidence: string; source: string }>;
  engineRules: Array<{ id: string; description: string; trigger: string; priority: number; enabled: boolean; conditions: unknown[]; actions: unknown[] }>;
} = { mandatoryRules: [], contextRules: [], dynamicRules: [], engineRules: [] };

// ... e trocar toda ocorrência de result.mandatory_rules -> result.mandatoryRules,
// result.contextual_rules -> result.contextRules, result.dynamic_rules -> result.dynamicRules,
// result.engine_rules -> result.engineRules (5 ocorrências no total, incluindo o bloco de renderização markdown).
```

**Critério de aceite:** `npx vitest run src/__tests__/mcp-server.test.ts` — 0 falhas, sem editar o arquivo de teste.

---

### A.3 — `rule-engine.test.ts` + `reactive-pipeline.test.ts`: fixture desatualizada de `update_backlog` (2 testes)

**Causa raiz:** o código da ação `update_backlog` (`src/rule-engine/actions.ts`) já foi corretamente atualizado para escrever em `docs/backlog/ACTIVE.md` (novo layout). Os testes, porém, criam o fixture em `docs/BACKLOG.md` (path antigo, agora só stub) — puramente teste não atualizado, não é bug de produção.

**Ficheiro:** `src/__tests__/rule-engine.test.ts` (linha ~272-289)
```typescript
// Antes:
const backlogPath = join(shitennoDir, "docs", "BACKLOG.md");
mkdirSync(dirname(backlogPath), { recursive: true });
writeFileSync(backlogPath, "# BACKLOG\n\nExisting items\n", "utf-8");

// Depois:
const backlogPath = join(shitennoDir, "docs", "backlog", "ACTIVE.md");
mkdirSync(dirname(backlogPath), { recursive: true });
writeFileSync(backlogPath, "# BACKLOG\n\nExisting items\n", "utf-8");
```
Repetir o mesmo ajuste em `src/__tests__/reactive-pipeline.test.ts` (buscar `"docs", "BACKLOG.md"` nesse arquivo).

**Critério de aceite:** `npx vitest run src/__tests__/rule-engine.test.ts src/__tests__/reactive-pipeline.test.ts` — 0 falhas.

---

### A.4 — `knowledge-graph.test.ts`: fixture em `.json`, código já usa `.jsonl` (4 testes)

**Causa raiz:** o plano de higiene git migrou `src/knowledge-graph/storage.ts` para `.jsonl` corretamente (é a implementação real, usada em produção). Os testes ainda escrevem/esperam `artifacts.json`/`relations.json` (array JSON single-blob) — fixture não migrada junto.

**Ficheiro:** `src/__tests__/knowledge-graph.test.ts`
```typescript
// Antes (loadArtifacts):
const artifactsPath = join(shitennoDir, "governance", "knowledge-graph", "artifacts.json");
writeFileSync(artifactsPath, JSON.stringify(artifacts), "utf-8");

// Depois — formato JSON Lines, uma entrada por linha:
const artifactsPath = join(shitennoDir, "governance", "knowledge-graph", "artifacts.jsonl");
writeFileSync(artifactsPath, artifacts.map((a) => JSON.stringify(a)).join("\n") + "\n", "utf-8");
```
Aplicar o mesmo padrão para `loadRelations`/`saveArtifacts`/`saveRelations` no mesmo arquivo (trocar `.json` → `.jsonl` e o formato de escrita para uma linha por entrada).

**Critério de aceite:** `npx vitest run src/__tests__/knowledge-graph.test.ts` — 0 falhas.

---

### A.5 — `capability-mapping.test.ts`: entrada de `BACKLOG.md` sumiu do mapeamento (1 teste)

**Causa raiz:** `src/capability-mapping.ts` não tem mais nenhuma referência a `BACKLOG.md` — a entrada foi removida (provavelmente durante o split do backlog) sem um substituto. O teste espera que o capability `"core"` inclua um arquivo destinado a `BACKLOG.md`.

**Ação:** decidir e implementar uma das duas:
1. Se o scaffold de projeto novo deve continuar entregando um `BACKLOG.md` (mesmo que hoje seja o stub de redirecionamento) → readicionar a entrada em `src/capability-mapping.ts`, agora apontando `src` para o template de stub e/ou para `docs/backlog/ACTIVE.md` + `DONE.md` como dois arquivos.
2. Se a decisão de produto é que novos projetos scaffolded já nascem com backlog modular (sem `BACKLOG.md` nunca) → atualizar o teste para não esperar mais essa entrada, documentando a mudança de comportamento no `CHANGELOG.md`.

**Critério de aceite:** `npx vitest run src/__tests__/capability-mapping.test.ts` — 0 falhas, e a decisão tomada está registrada (comentário no código + changelog), não silenciosa.

---

## BLOCO B — Achados do plano de closeout (16/07) nunca implementados

Nenhum destes quatro itens foi feito, apesar de o plano existir há dois dias. São mudanças pequenas e isoladas — bom primeiro lote para o agente de IA executar em sequência.

### B.1 — Bug de linha `:1` no detector de complexidade

**Ficheiro:** `src/audit/complexity/analyzer.ts`
```typescript
// Linha ~42, dentro de getFunctionName():
// Antes:
return `<anonymous@${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}>`;
// Depois:
return `<anonymous@${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}>`;

// Linha ~68, dentro de analyzeComplexity():
// Antes:
line = sourceFile.getLineAndCharacterOfPosition(fnNode.getStart()).line;
// Depois:
line = sourceFile.getLineAndCharacterOfPosition(fnNode.getStart(sourceFile)).line;
```
**Critério de aceite:** `shugo audit --level enterprise --no-cache` — nenhum achado `high_complexity` cai em linha `:1` a menos que a função realmente comece ali.

### B.2 — `ActionEngine.execute` duplica lógica de política em vez de delegar a `invokeAction`

**Ficheiro:** `src/action-engine.ts`
```typescript
import { invokeAction } from "./decision-core/invoke.js";

async execute(request: ActionRequest): Promise<ExecutionRecord> {
  const executionHash = computeExecutionHash(request.type, request.params);

  const existing = this.repo.findByActionId(request.id);
  if (existing && existing.status === "completed") return existing;
  const hashMatch = this.repo.findByHash(executionHash);
  if (hashMatch && hashMatch.status === "completed") return hashMatch;

  const result = await invokeAction({
    action: { type: request.type as RuleAction["type"], params: request.params as RuleAction["params"] },
    context: {
      trigger: "manual",
      eventData: {},
      projectRoot: "",
      shitennoDir: this.shitennoDir,
      timestamp: new Date().toISOString(),
    },
    mode: "deliberate",
  });

  const record: ExecutionRecord = {
    executionId: `EXE-${randomUUID().slice(0, 8).toUpperCase()}`,
    request,
    executionHash,
    status: result.success ? "completed" : "failed",
    result: result.success ? "success" : "failure",
    error: result.success ? undefined : result.message,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    duration: 0,
  };
  this.repo.save(record);
  return record;
}
```
Remover o import direto de `PolicyEngine`/`FilePolicyRepository`/`checkPolicyGate` desse arquivo (ficam redundantes). **Não remover** `registerExecutor`/`this.executors` sem antes rodar `grep -rn "registerExecutor" src` para confirmar que nada externo depende de registrar executor customizado direto no `ActionEngine`.

**Critério de aceite:** `npx vitest run src/__tests__/action-engine.test.ts` continua passando; adicionar um teste novo que confirma que uma ação bloqueada por política via `ActionEngine.execute` produz `status: "failed"` com a mesma mensagem que `invokeAction` produziria direto.

### B.3 — Falso positivo de dependência circular (`import type` contando como aresta)

**Ficheiro:** `src/audit/engineering-detectors-quality.ts`, dentro de `detectCircularDeps`
```typescript
// Antes:
const importRegex = /(?:from|import)\s+["']([^"']+)["']/g;

// Depois — filtrar linhas de import type antes de rodar a regex:
const contentWithoutTypeImports = file.content
  .split("\n")
  .filter((line) => !/^\s*import\s+type\s+/.test(line))
  .join("\n");
// usar contentWithoutTypeImports (não file.content) na chamada de importRegex.exec()
```
**Critério de aceite:** `shugo audit --no-cache` — ciclo `auto-evolution ↔ challenge-generator` não aparece mais nos achados.

### B.4 — Ciclo real `event-bus.ts ↔ advanced-infrastructure.ts`

**Ficheiro:** `src/advanced-infrastructure.ts`
```typescript
// Antes:
import { getEventBus, type ShitennoEventType, type EventBus } from "./event-bus.js";
// ...
const eventBus = bus ?? getEventBus();

// Depois:
import type { ShitennoEventType, EventBus } from "./event-bus.js";
// bus deixa de ser opcional — quem chama a função (dentro de event-bus.ts,
// que já tem a instância local) passa o bus explicitamente.
```
Rodar `grep -rn "from \"\./advanced-infrastructure" src --include="*.ts" | grep -v test` e ajustar cada call site que hoje não passa `bus`.

**Critério de aceite:** nenhuma importação de valor (só `type`) de `advanced-infrastructure.ts` para `event-bus.ts`; testes de ambos os arquivos continuam passando.

### B.5 — Remover `node-pty`

```bash
npm uninstall node-pty
# ou, no monorepo pnpm:
pnpm remove node-pty
```
Confirmar antes que segue não usado:
```bash
grep -rln "node-pty" src bin --include="*.ts" | grep -v test
# esperado: vazio
```
**Critério de aceite:** `pnpm install` limpo, sem a tentativa de build nativo via `node-gyp` (isso já foi reproduzido nesta auditoria — o install falha hoje com `403` baixando headers do Node). `phantom_dep`/`unused_dependencies` do próximo `shugo audit` não aponta mais `node-pty`.

---

## BLOCO C — Backlog modular: recuperar a migração (dado real perdido/mal classificado)

**Situação atual:** `docs/backlog/ACTIVE.md` está **vazio (0 itens)**; `docs/backlog/DONE.md` tem 83 itens misturados, incluindo itens que claramente não estão concluídos. O código consumidor (`backlog-parser.ts`/`backlog-writer.ts`) está correto — o problema é só o dado gerado pela migração one-shot.

**Causa raiz dupla, confirmada lendo `.shitenno/docs/BACKLOG.md` (a fonte real, ainda intacta):**
1. `scripts/migrate-backlog.ts` usa `SOURCE = "docs/BACKLOG.md"` (arquivo errado — esse já era o arquivo de nível raiz do próprio repo). O plano original mirava `shitenno-go/docs/BACKLOG.md`, que hoje é `.shitenno/docs/BACKLOG.md`.
2. O parser customizado do script (`parseBacklogManually`) não reconhece o cabeçalho real `## Completed Items` (só reconhece `## Done`), nem a tabela sem negrito (`| Item | Severidade | Resolucao |`) que existe dentro dessa seção sob o sub-título `### Done — Tabela Resumo`. Resultado: os itens genuinamente concluídos (~53, na tabela-resumo) não são capturados linha a linha — só o próprio cabeçalho vira um "item" fantasma — enquanto os itens com `### ID Title` + `**Status**` nas seções `## P0`/`## P1`/etc. (esses sim são capturados corretamente) ficam todos classificados errado porque não há garantia de que `state.includes("Done")` cobre todos os formatos de status ("Done — 2026-07-06" funciona; conferir se existem outras variações).

**Ficheiro:** `scripts/migrate-backlog.ts`
```typescript
// 1. Corrigir a fonte:
const SOURCE = ".shitenno/docs/BACKLOG.md";
const ACTIVE_DEST = ".shitenno/docs/backlog/ACTIVE.md"; // ou manter em docs/backlog/ — decidir e ser consistente com o que backlog-parser.ts já lê
const DONE_DEST = ".shitenno/docs/backlog/DONE.md";

// 2. Corrigir o reconhecimento de seção (aceitar "## Completed Items" como equivalente a "## Done"):
const sectionMatch = line.match(/^## (P[0-9]+|Done|Completed Items)\s?/);
if (sectionMatch) {
  currentSection = sectionMatch[1] === "Completed Items" ? "Done" : sectionMatch[1]!;
  inDoneTable = currentSection === "Done";
  ...
}

// 3. Reconhecer a tabela sem negrito dentro da seção Done
//    (hoje só "| **Status** |" é reconhecido; a tabela resumo usa "| Item | Severidade | Resolucao |"
//    sem markers em negrito — o branch "inDoneTable" já faz esse parsing, conferir que
//    currentSection vira "Done" ANTES de a tabela resumo começar a ser lida, o que só
//    funciona depois do fix do item 2 acima).
```

**Passo de validação obrigatório antes de rodar de novo:**
```bash
# contar itens na fonte real antes de migrar
grep -c "^### " .shitenno/docs/BACKLOG.md   # itens detalhados (P0-P3)
grep -c "^| .* | .* | .* |$" .shitenno/docs/BACKLOG.md  # linhas de tabela (inclui a tabela resumo de Done)
```
Rodar o script, depois comparar: `wc -l` de `ACTIVE.md` + `DONE.md` bate com o total esperado, **e** nenhum item do `ACTIVE.md` tem a palavra "Concluído"/"Done" na descrição (sinal de que a classificação está invertida de novo).

**Critério de aceite:** `ACTIVE.md` não está vazio; `DONE.md` só contém itens cuja descrição de fato indica conclusão (não frases como "Não existe X ainda"); soma total bate com a contagem da fonte.

---

## BLOCO D — Wiring de CI pendente (baixo esforço, alto valor)

**Ficheiro:** `.github/workflows/ci.yml`

`scripts/check-file-size.sh` já existe e já roda (`--report-only` hoje mostra 68 violações reais). Falta o step no CI:
```yaml
- name: Check file size (F-06, report-only until backlog de refactor é resolvido)
  run: bash scripts/check-file-size.sh --report-only
```
Trocar para bloqueante (`bash scripts/check-file-size.sh`, sem a flag) só depois que os 68 arquivos violadores forem reduzidos — não antes, ou vai travar todo PR imediatamente.

**Critério de aceite:** o job aparece no CI e roda em todo PR, em modo não bloqueante por enquanto.

---

## BLOCO E — Itens estruturais maiores (escopo de dias, não de uma sessão — sequenciar por último)

Estes dois não quebram teste hoje, mas foram marcados como "consolidado" sem estarem de fato consolidados. Cuidado para não tratar isso como urgente igual ao Bloco A — é dívida arquitetural real, mas não está causando falha ativa.

### E.1 — `policy-engine.ts` nunca foi fundido em `rule-engine`
Ainda é um arquivo de 430 linhas, usado em 6 lugares (`decision-core/policy-gate.ts`, `decision-core/invoke.ts`, `action-engine.ts`, `commands/policy.ts`, `commands/audit.ts`). Antes de fundir: `grep -rn "PolicyEngine\|FilePolicyRepository" src --include="*.ts"` para mapear todo call site, e só então seguir o plano original (campo `mode: "enforce" | "advisory"` dentro do `Rule` do rule-engine).

### E.2 — `engineering-state/` foi reorganizado, não consolidado
Continua com 8 arquivos dentro da pasta (`access.ts`, `discovery.ts`, `evolved.ts`, `history.ts`, `io.ts`, `mutations.ts`, `subscription.ts`, mais `index.ts`) **e** o `src/engineering-state.ts` original de 320 linhas ainda existe fora da pasta. Vários consumidores (`mcp-server-handlers.ts`, `commands/context.ts`, `commands/history.ts`, `commands/status.ts`) importam sub-arquivos direto, não via `index.ts` — quebra o critério de "só index.ts é público". Antes de mexer: `grep -rln "engineering-state/access\.js\|engineering-state/discovery\.js\|engineering-state/evolved\.js" src --include="*.ts" | grep -v __tests__` para ter a lista completa de quem precisa migrar para importar de `engineering-state/index.js`.

---

## Ordem de execução recomendada para o agente

1. Bloco A (A.1 → A.5) — cada item é isolado, testável individualmente, baixo risco.
2. Bloco B (B.1 → B.5) — idem, plano já detalhado desde 16/07, só nunca foi codado.
3. Bloco D — 5 minutos, alto valor de prevenção.
4. Bloco C — exige mais cuidado (dado real, não só código); rodar em branch separada e revisar a saída manualmente antes de commitar.
5. Bloco E — só depois de tudo acima estar verde e estável; é refactor estrutural, não bugfix.

Depois de cada bloco: `npm run build && npx vitest run` — **sempre rodar os dois**, build sozinho esconde regressões de teste de integração (isso me confundiu na auditoria anterior), e teste sozinho sem build não pega o que só quebra no artefato final.
