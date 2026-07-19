# PLAN-2026-07-18 — Roadmap Mestre: Eficiência Ponta a Ponta

**Status:** Done

**Consolida:** `PLAN-2026-07-18-correcoes-cirurgicas.md` (Blocos A-D) + `PLAN-2026-07-18-BLOCO-F-done-inteligente-v2.md` (Bloco F) + dois blocos novos abaixo (E, G) que fecham as duas lacunas que ficaram de fora até aqui: dívida estrutural e enforcement real (não-contornável).

**Por que "ponta a ponta" precisa dos dois blocos novos:** os planos anteriores resolvem *correção* (o que está errado hoje) e *prevenção por convenção* (o gate reativo, que um agente cooperativo respeita). Nenhum dos dois resolve *inchaço estrutural* (o sistema carrega peso morto que não devia existir) nem *prevenção por enforcement* (o que acontece se alguém, agente ou humano, decidir não cooperar com o gate). Sem esses dois, "ponta a ponta" fica incompleto — dá pra confiar no relatório de progresso, mas o sistema em si continua mais pesado do que precisa ser, e a garantia contra bypass depende de boa vontade.

---

## Camadas de eficiência — mapa geral

| Camada | O que resolve | Onde está |
|---|---|---|
| **1. Correção** | Bugs ativos hoje (testes quebrados, dado perdido, achados nunca implementados) | `correcoes-cirurgicas.md`, Blocos A-D |
| **2. Prevenção por convenção** | Gate reativo que impede `done` sem verificação, para quem usa o fluxo normal | `BLOCO-F-done-inteligente-v2.md` |
| **3. Estrutura** | Remove peso morto arquitetural — menos superfície, menos lugar pra quebrar | **Bloco E (novo, abaixo)** |
| **4. Enforcement real** | Fecha o buraco de bypass deliberado (bash livre, `--no-verify`) — a camada que nenhum agente consegue contornar sozinho | **Bloco G (novo, abaixo)** |

Sequência recomendada: **1 → 2 → 3 → 4**. Não faz sentido reforçar enforcement (4) sobre uma base ainda instável (1), nem vale a pena consolidar estrutura (3) antes de saber que o gate (2) já está protegendo contra regressão durante o refactor.

---

## BLOCO E — Consolidação estrutural real

### E.1 — Fundir `policy-engine.ts` em `rule-engine/`

**Correção de expectativa:** a v1 do plano original sugeria unificar os *tipos* de `Policy` e `Rule` num modelo único. Depois de ler `policy-engine.ts` linha a linha (430 linhas — `evaluateCondition`, `PolicyRepository`/`FilePolicyRepository`, classe `PolicyEngine`, tipos `PolicyCondition`/`PolicyAction`/`PolicyEvaluation`), isso é um redesenho de tipo, não um refactor cirúrgico — arriscado demais para fazer em um passo. A rota de menor risco replica um padrão que **já existe e já funciona** neste mesmo código: `rule-engine.ts` (topo, 54 linhas) é hoje só um shim fino que reexporta de `src/rule-engine/` (`actions.ts`, `conditions.ts`, `defaults.ts`, `engine.ts`, `security.ts`, `validation.ts`, `index.ts`). `policy-engine.ts` deve virar mais um módulo dentro dessa mesma pasta, não um sistema de tipos paralelo.

**Passo 1 — mover, sem reescrever lógica:**
```bash
git mv src/policy-engine.ts src/rule-engine/policy.ts
```
Ajustar os imports internos de `policy.ts` (paths relativos mudam um nível).

**Passo 2 — expor via barrel existente:**
```typescript
// src/rule-engine/index.ts — adicionar:
export {
  type PolicyMode, type PolicyEffect, type Policy, type PolicyEvaluation,
  type PolicyRepository, FilePolicyRepository, PolicyEngine,
  evaluateCondition,
} from "./policy.js";
```

**Passo 3 — atualizar os 6 call sites (troca de path, zero mudança de lógica):**
```bash
grep -rln 'from "\.\./policy-engine\.js"\|from "\./policy-engine\.js"' src --include="*.ts" | grep -v __tests__
# esperado: decision-core/policy-gate.ts, decision-core/invoke.ts, action-engine.ts,
#           commands/policy.ts, commands/audit.ts (mais o que o grep confirmar)
```
Trocar `from "./policy-engine.js"` → `from "./rule-engine/policy.js"` (ajustando profundidade relativa por arquivo) ou, preferencialmente, `from "./rule-engine/index.js"` para já usar o barrel.

**Passo 4 — deixar `src/policy-engine.ts` como shim de compatibilidade por um ciclo de release, depois remover:**
```typescript
// src/policy-engine.ts (versão final, antes de deletar de vez):
/** @deprecated Use `./rule-engine/policy.js` (ou `./rule-engine/index.js`). Removido na próxima major. */
export * from "./rule-engine/policy.js";
```

**O que isso NÃO faz (registrar como decisão consciente, não como pendência esquecida):** não unifica `Policy` e `Rule` num tipo só. Ganho real aqui é organizacional — `rule-engine/` vira o único lugar em `src/` que decide "isso pode rodar ou não", em vez de duas árvores de decisão separadas. Unificação de tipo fica como item de pesquisa futuro, só se motivada por um caso de uso concreto que exija policy e rule interagindo no mesmo objeto (hoje não há evidência disso no código).

**Critério de aceite:** `grep -rln "policy-engine.js" src --include="*.ts" | grep -v __tests__` retorna vazio (nada em produção importa o path antigo); `npx vitest run src/__tests__/policy-engine.test.ts` — 0 falhas, sem editar o teste (só o import path, se o teste importar direto).

---

### E.2 — Fechar o barrel de `engineering-state/` de verdade

**Correção de expectativa (importante):** na auditoria anterior eu classifiquei isso como "consolidação cosmética". Lendo `src/engineering-state/index.ts` de novo, na íntegra: ele **já é um barrel funcional de verdade** — reexporta de `../engineering-state.ts` (orquestrador core, intencional, não duplicata) e dos 4 submódulos (`access`, `evolved`, `history`, `subscription`). O problema real é mais estreito do que eu descrevi:

1. `mutations.ts` **não está reexportado pelo `index.ts`** — é o único submódulo esquecido.
2. **10 arquivos** (4 de produção, 6 de teste) importam os submódulos direto em vez de passar pelo barrel:
   - Produção: `mcp-server-handlers.ts`, `commands/context.ts`, `commands/history.ts`, `commands/status.ts`
   - Teste: `state-mutations.test.ts`, `engineering-state-mutations.test.ts`, `orphaned-modules.test.ts`, `engineering-state-subscription.test.ts`, `engineering-state-access.test.ts`, `engineering-state-evolved.test.ts`, `engineering-state-history.test.ts`, `single-source-of-truth.test.ts`, `context-command.test.ts`, `benchmarks.bench.ts`, `cross-process-bench.ts`

**Passo 1 — fechar o gap de `mutations.ts`:**
```typescript
// src/engineering-state/index.ts — adicionar ao final:
export {
  // conferir a lista exata de exports em mutations.ts antes de escrever isto —
  // os testes state-mutations.test.ts / engineering-state-mutations.test.ts
  // têm a lista completa dos nomes usados hoje.
} from "./mutations.js";
```

**Passo 2 — migrar os 4 consumidores de produção para o barrel:**
```typescript
// Antes (mcp-server-handlers.ts, commands/context.ts, commands/history.ts, commands/status.ts):
import { getEngineeringState } from "./engineering-state/access.js";
import { listSnapshots, getSnapshotAt, diffSnapshots } from "../engineering-state/history.js";
import { subscribeToEngineeringState } from "../engineering-state/subscription.js";

// Depois:
import { getEngineeringState, listSnapshots, getSnapshotAt, diffSnapshots, subscribeToEngineeringState } from "../engineering-state/index.js";
```

**Passo 3 — migrar os testes** para o mesmo barrel (mesmo padrão, arquivo por arquivo). Isso não é só estética: com todo consumidor passando pelo `index.ts`, uma mudança futura de implementação interna (ex.: trocar `evolved.ts` por outra estratégia) não exige tocar em 10 arquivos espalhados — só o barrel.

**Passo 4 — regra de import não pode regredir.** Adicionar um teste de arquitetura (na linha do que já existe em `orphaned-modules.test.ts`):
```typescript
// src/__tests__/engineering-state-barrel.test.ts (novo)
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

it("nenhum arquivo fora de src/engineering-state/ importa submódulo direto", () => {
  const offenders: string[] = [];
  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !full.includes("engineering-state") && !full.includes("node_modules")) {
        scan(full);
      } else if (entry.name.endsWith(".ts") && !full.includes("engineering-state/")) {
        const content = readFileSync(full, "utf-8");
        if (/engineering-state\/(access|discovery|evolved|history|io|mutations|subscription)\.js/.test(content)) {
          offenders.push(full);
        }
      }
    }
  }
  scan(join(process.cwd(), "src"));
  expect(offenders).toEqual([]);
});
```
Isso transforma "não regredir" de convenção pra checagem automática — mesmo espírito do Bloco F, aplicado a uma regra de arquitetura em vez de a um status de plano.

**O que isso NÃO faz:** não reduz de 8 arquivos para 3-4 fundindo conteúdo — os 8 submódulos continuam existindo como estão, porque já são coesos por responsabilidade (io, mutations, discovery, evolved, history, subscription, access são fronteiras razoáveis). O ganho real é "só um caminho de entrada", não "menos arquivos". Fundir de verdade só valeria a pena se algum desses arquivos fosse pequeno demais pra justificar existir sozinho — não é o caso aqui (98 a 388 linhas cada).

**Critério de aceite:** `npx vitest run src/__tests__/engineering-state-barrel.test.ts` passa; os 4 arquivos de produção e os 10 de teste listados acima não têm mais nenhum import de submódulo direto.

---

## BLOCO G — Enforcement real (fecha o buraco de bypass deliberado)

O F.6 (hook de pre-commit) já foi identificado como "rede de segurança, não gate primário" — e é contornável com `git commit --no-verify`, sem deixar rastro nenhum localmente. Isso é aceitável como primeira camada, mas não fecha "ponta a ponta" sozinho.

### G.1 — Branch protection como o gate que não depende de cooperação

**Fora do código-fonte, é configuração do GitHub (ou equivalente):**
1. No repositório, marcar como **required status check** no branch padrão:
   - o job de CI que roda `npx tsx scripts/verify-done-plans.ts` (F.6)
   - o job que roda `npm run build && npx vitest run`
   - (opcional, se o Bloco D já estiver estável e o backlog de refactor do F-06 diminuir) `scripts/check-file-size.sh` sem `--report-only`
2. Ativar "Require branches to be up to date before merging" — evita que um PR aprovado há dias faça merge sobre uma `main` que já mudou.
3. Restringir quem pode fazer push direto na branch padrão (sem PR) — isso é o que fecha de fato o `--no-verify` local: mesmo que o hook seja pulado no commit, o merge pra `main` não acontece sem o CI passar, porque o CI roda em servidor, fora do alcance do agente.

**Limite honesto a registrar:** branch protection fecha "bypass sem privilégio administrativo". Não fecha "bypass por quem tem admin no repositório" — em uma instância solo (o modelo de uso já documentado em `WORKFLOW.md`), o desenvolvedor único normalmente **é** o admin. Nesse caso, o valor de G.1 não é "impedir você", é **impedir o agente de IA de contornar sozinho** — que é exatamente o cenário que motivou o Bloco F inteiro. Contra um humano decidido a ignorar o próprio processo, nenhuma camada de código resolve; isso é fora do escopo de qualquer plano técnico.

### G.2 — Auditoria retroativa periódica (detecção, não só prevenção)

Complementa G.1 para o caso em que uma janela de tempo sem branch protection (ex.: setup inicial, ou repo clonado sem a config) permitiu um `done` sem prova:

```typescript
// scripts/audit-done-integrity.ts — roda sob demanda ou agendado, não bloqueia nada
// Reaproveita a mesma lógica de scripts/verify-done-plans.ts, mas em vez de
// falhar o processo, gera um relatório:
// - planos em done/ sem .verification.json
// - .verification.json com commitHash que não existe mais no histórico do git
//   (git cat-file -e <hash> — sinal de rebase/squash que pode ter mascarado algo)
// - planos com passed:false que ainda assim estão em done/ (nunca deveria acontecer
//   dado o Bloco F, mas é o tipo de invariante que vale checar, não assumir)
```
Rodar como parte do próprio `shugo audit` (mais um `HealthIssue` de categoria nova, ex. `governance_integrity`), reaproveitando o motor de auditoria que já é a parte mais sólida do projeto — em vez de criar infraestrutura de relatório nova, este é o lugar natural pra esse tipo de achado morar.

**Critério de aceite:** rodar `shugo audit` num repo com um `done/` adulterado manualmente (arquivo sem `.verification.json`, ou `.verification.json` com `passed: false`) → aparece como achado de auditoria, com o mesmo nível de severidade que os achados de dependência circular/complexidade já usam hoje.

---

## Ordem de execução consolidada (visão única de tudo)

1. `correcoes-cirurgicas.md` Bloco A (testes quebrados hoje) — sangramento ativo, primeiro.
2. `correcoes-cirurgicas.md` Bloco B (achados do closeout nunca implementados).
3. `correcoes-cirurgicas.md` Bloco D (CI report-only pro F-06 — 5 minutos, alto valor).
4. `correcoes-cirurgicas.md` Bloco C (recuperar a migração de backlog — mais delicado, dado real).
5. `BLOCO-F-done-inteligente-v2.md` completo (F.1 → F.7) — o gate reativo.
6. **Bloco E** (E.1, E.2) — só depois do gate existir, porque a partir daqui qualquer refactor estrutural já fica protegido contra "consolidação que quebra e ninguém percebe", o problema raiz que motivou toda essa auditoria.
7. **Bloco G** (G.1 config de branch protection, G.2 auditoria retroativa) — fecha o ciclo.

Depois de cada bloco, sem exceção: `npm run build && npx vitest run`. E, a partir do momento em que o Bloco F estiver ativo, o próprio sistema começa a impor isso sozinho para qualquer plano novo — inclusive os blocos E e G, que devem ser executados como planos formais dentro do próprio sistema, não como trabalho avulso. É o primeiro teste real de o gate funcionar em cima de si mesmo.
