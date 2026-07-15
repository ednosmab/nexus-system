# Plano: Melhorar o Mecanismo de Medição de Contexto (P0-P4)

**Status:** In Progress
**Updated_at:** 2026-07-15T06:27:34.340Z
**Date:** 2026-07-15

## Contexto

Retomando a análise anterior: o `context_buffer.yaml` funciona como cache
quente com higiene garantida por linting (`governance-enforcement-detectors.ts`),
mas não existe hoje nenhum sinal de **recall perdido** — quando um agente
precisa de algo em P4 e o sistema não percebe.

Boa notícia encontrada ao olhar o código: o projeto já tem a infraestrutura
certa pra isso, só não está sendo usada com essa finalidade. Existe um
**event bus com persistência em disco** (`src/event-bus.ts`,
`readPersistedEvents`/`EventEnvelope`) e um **padrão de detector já
estabelecido** (`HealthIssue { type, severity, description, location,
recommendation }` em `src/audit/*.ts`). Os 5 pontos abaixo reaproveitam essas
duas peças em vez de propor infraestrutura nova.

> Nota de nomenclatura: o código atual usa o prefixo `Nexus` (`NexusEventType`,
> `nexusDir`). Os exemplos abaixo usam esse prefixo porque é o que existe hoje
> no zip que analisei — depois do rebranding (`rename-shitenno-go.py`), viram
> `ShitenEventType`/`shitenDir` automaticamente, sem mudança de lógica.

---

## 1. Log de "context miss" — reaproveitando o event bus existente

Em vez de criar um sistema de log novo, adicionar um tipo de evento ao union
já existente em `event-bus.ts`:

```ts
// src/event-bus.ts — adicionar ao union NexusEventType
export type NexusEventType =
  | "session.start"
  | "session.end"
  // ...existentes...
  | "context.p4_loaded"       // novo: um doc de P4 foi puxado sob demanda
  | "context.tier_mismatch";  // novo: doc carregado não bate com o tier declarado
```

```ts
// src/context-collector.ts — no ponto onde um doc de history/feedback (P4)
// é lido fora do loading_profile inicial
import { publish } from "./event-bus.js"; // usar a API real de publish do módulo

function loadOnDemandDoc(nexusDir: string, docPath: string, taskType: string) {
  const content = readFileSync(docPath, "utf-8");

  publish({
    type: "context.p4_loaded",
    payload: {
      docPath,          // relativo a nexusDir
      taskType,          // tipo de tarefa que disparou o carregamento
      tierDeclared: "P4",
    },
  });

  return content;
}
```

Isso não muda comportamento nenhum hoje — só passa a registrar, usando
infraestrutura já testada (`readPersistedEvents`), toda vez que o "caso raro"
(precisar de P4) acontece de verdade.

---

## 2. Índice comprimido de P4 sempre em P1

Um script que gera, a partir de `history/*.md` e `feedback/records/*.md`, um
arquivo leve de 1 linha por documento — carregado sempre, mesmo em
`loading_profile: minimal`.

```ts
// src/context-index-builder.ts (novo arquivo)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface IndexEntry {
  file: string;
  date: string;
  summary: string; // primeira linha não-vazia após o título, truncada
}

export function buildP4Index(nexusDir: string): IndexEntry[] {
  const historyDir = join(nexusDir, "docs", "history");
  const entries: IndexEntry[] = [];

  for (const file of readdirSync(historyDir).filter((f) => f.endsWith(".md"))) {
    const content = readFileSync(join(historyDir, file), "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    const summary = (lines[1] ?? "").slice(0, 120);

    entries.push({ file, date: file.slice(0, 10), summary });
  }

  const indexPath = join(nexusDir, "governance", "context", "p4_index.yaml");
  writeFileSync(indexPath, entries.map((e) => `- file: ${e.file}\n  date: ${e.date}\n  summary: "${e.summary}"`).join("\n"));

  return entries;
}
```

Chamar `buildP4Index` no mesmo hook que já poda o `context_buffer.yaml` no
fim de sessão (`governance-enforcement-detectors.ts` já sabe onde isso
acontece — é o ritual de fechamento). O índice fica pequeno por natureza
(uma linha por doc, não o doc inteiro) e sempre carregado em P1.

---

## 3. Detector de promoção automática — segue o padrão exato de `HealthIssue`

Reaproveita o evento `context.p4_loaded` do item 1: se o mesmo doc for
puxado repetidamente, vira uma finding no mesmo formato que os outros
detectors já usam.

```ts
// src/audit/context-tier-detectors.ts (novo arquivo, mesmo padrão dos existentes)
import type { HealthIssue } from "./types.js";
import { readPersistedEvents } from "../event-bus.js";

const PROMOTION_THRESHOLD = 3; // nº de misses no mesmo doc para sugerir promoção

export function detectMisclassifiedTier(nexusDir: string): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const events = readPersistedEvents(nexusDir, "context.p4_loaded");

  const countsByDoc = new Map<string, number>();
  for (const e of events) {
    const doc = (e.payload as { docPath: string }).docPath;
    countsByDoc.set(doc, (countsByDoc.get(doc) ?? 0) + 1);
  }

  for (const [doc, count] of countsByDoc) {
    if (count >= PROMOTION_THRESHOLD) {
      issues.push({
        type: "buffer_schema_mismatch", // ou novo HealthIssueType: "tier_promotion_candidate"
        severity: 2,
        description: `"${doc}" foi carregado sob demanda ${count}x — candidato a promoção de P4 para P2.`,
        location: `governance/context/${doc}`,
        recommendation: `Revisar classificação em CONTEXT_HIERARCHY.md e mover "${doc}" para o tier P2.`,
      });
    }
  }

  return issues;
}
```

Precisa adicionar `"tier_promotion_candidate"` ao union `HealthIssueType` em
`src/audit/types.ts` (mesmo lugar onde já estão `stale_buffer`,
`buffer_schema_mismatch` etc.) e registrar o detector no `index.ts` do
diretório `audit/`, igual aos outros.

---

## 4. Campo de auditoria no `SESSION_REVIEW.md`

Adição direta ao template existente:

```diff
  ## 5. Próximos Passos
  - [Next step 1]
  - [Next step 2]

+ ## 5.1 Cobertura de Contexto
+ - [ ] Alguma tarefa desta sessão foi bloqueada ou refeita por falta de
+       contexto que não estava carregado (P4 não requisitado a tempo)?
+       Se sim, qual documento e por quê: [descrição]
+
  ## 6. Dívida Técnica Identificada
  | Item | Severidade | Due | Acção |
```

Combinado com o item 3, isso dá dois sinais independentes do mesmo problema:
um automático (contagem de eventos) e um auto-relatado (o agente admite que
travou). Divergência entre os dois (agente trava mas evento não foi
registrado) é, em si, um sinal de que o hook do item 1 não está cobrindo
todos os pontos de carregamento sob demanda.

---

## 5. Checkpoints encadeados em vez de sobrescrita

Hoje o `context_buffer.yaml` é podado e sobrescrito no fechamento de sessão
(regra de 50 linhas). Trocar sobrescrita por append com timestamp:

```ts
// src/governance/buffer-checkpoint.ts (novo arquivo)
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export function checkpointBuffer(nexusDir: string): void {
  const bufferPath = join(nexusDir, "governance", "context", "context_buffer.yaml");
  const checkpointDir = join(nexusDir, "governance", "context", "checkpoints");

  if (!existsSync(checkpointDir)) mkdirSync(checkpointDir, { recursive: true });
  if (!existsSync(bufferPath)) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  copyFileSync(bufferPath, join(checkpointDir, `${timestamp}.yaml`));
}
```

Chamar isso **antes** da poda existente (`buffer não foi podado` em
`governance-enforcement-detectors.ts`), não em vez dela — o buffer ativo
continua enxuto (cap de 50 linhas, já garantido pelo linting atual), mas
nada é perdido de fato, só sai do "quente" pro P4 (que agora tem índice, item 2).

---

## Dependência entre os itens

```
1 (log de miss) ──┬──► 3 (detector de promoção)
                   └──► 4 (campo de auditoria, cruza com 1 pra achar gaps no hook)

2 (índice P4) ─────────► reduz a necessidade do item 3 a médio prazo
                          (se o índice for bom, menos miss acontece)

5 (checkpoints) ───────► independente, pode entrar em paralelo com qualquer um
```

Ordem sugerida de implementação: **1 → 4 → 5 → 2 → 3**. Os dois primeiros
são baratos e já geram dado real; 5 é isolado; 2 e 3 só valem a pena depois
de ter dado do item 1 pra saber se o problema é grande o suficiente pra
justificar o esforço.
