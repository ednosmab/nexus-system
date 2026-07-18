# PLAN-2026-07-17-B — Modularização do BACKLOG.md por Status/Prioridade

**Status:** Done
**Date:** 2026-07-17
**Updated_at:** 2026-07-17T00:00:00.000Z
**Priority:** P1
**Owner:** AI Agent
**Estimated Time:** 1 dia
**Escopo de arquivos:** `shitenno-go/docs/BACKLOG.md`, `src/backlog-parser.ts`, `src/backlog-writer.ts`, comandos que leem backlog. Não toca `bin/shiten.ts` — pode rodar em paralelo, em terminal isolado, com o PLAN-2026-07-17-A sem conflito.

---


## Checklist

- [x] Passo 1 — Confirmar consumidores atuais do parser
- [x] Passo 2 — Estrutura de arquivo alvo
- [x] Passo 3 — Script de migração (roda uma vez)
- [x] Passo 4 — Atualizar `backlog-parser.ts`/`backlog-writer.ts` para o novo layout
- [x] Passo 5 — Atualizar comandos consumidores

## Contexto

`shitenno-go/docs/BACKLOG.md` tem 1.633 linhas, 98 itens estruturados em tabela (`Status`, `Severidade`, `Prioridade`, `Owner`, `Data`, `Fonte`, `Modulos`, `Descricao`, `Correcao`). Contagem confirmada:

- 20 itens `Status: Done`
- 53 itens `Status: Backlog` (pendentes)
- 2 `In Progress`
- 1 `Paused`

O projeto **já tem a solução para este exato problema em outro lugar do repositório**: `governance/plans/done/` separa planos concluídos de `governance/plans/pipeline/` (em andamento). O `BACKLOG.md` não segue essa convenção — mistura tudo, forçando qualquer leitura (humana ou de agente) a carregar o arquivo inteiro, incluindo os 20 itens já resolvidos, para encontrar os 53 pendentes que importam agora.

Já existem `src/backlog-parser.ts` e `src/backlog-writer.ts` no código — a migração reaproveita esse parser em vez de escrever um novo.

## Objetivo

Separar o backlog por status, aplicando o mesmo princípio de seleção por metadados discutido para o Rule Manifest — mas aqui a "seleção" é estrutural (arquivo certo) em vez de matching declarativo, já que o eixo de filtragem (status/prioridade) é mais simples que o de regras (task/language/framework).

**Critérios de aceitação:**
1. Itens `Done` saem do arquivo ativo, vão para um arquivo de arquivo histórico.
2. O arquivo ativo de backlog (`Backlog`/`In Progress`/`Paused`) fica com no máximo ~56 itens em vez de 98 — redução proporcional de tamanho.
3. `backlog-parser.ts`/`backlog-writer.ts` continuam funcionando sem quebrar consumidores existentes (checar `grep -rl "backlog-parser\|backlog-writer" src/`).
4. Itens `P0` ficam consultáveis separadamente de `P1`/`P2`/`P3`, para uso futuro por comandos que só precisam do que é urgente.

---

## FASE ÚNICA

### Passo 1: Confirmar consumidores atuais do parser
**Ficheiro:** nenhum (análise)

**Ação:** `grep -rl "backlog-parser\|backlog-writer\|BACKLOG.md" src/ --include="*.ts"` para listar todo comando/módulo que lê ou escreve o arquivo hoje. Checar especialmente `src/commands/list.ts`, `src/commands/status.ts` e qualquer coisa em `src/backlog-state-machine.ts`/`src/backlog-transitions.ts` (já existem no projeto — confirmar se dependem do arquivo único).
**Verificação:** lista de arquivos afetados documentada antes de mudar qualquer coisa.

### Passo 2: Estrutura de arquivo alvo
**Ficheiro:** `shitenno-go/docs/backlog/` (novo diretório, substitui o arquivo único)

**Ação:** layout proposto:
```
shitenno-go/docs/backlog/
  ACTIVE.md       # Status: Backlog | In Progress | Paused — o que importa agora
  DONE.md         # Status: Done — histórico, consultado raramente
  README.md       # explica a separação, aponta pra cá quem procurar BACKLOG.md antigo
```
Manter `shitenno-go/docs/BACKLOG.md` como um stub de redirecionamento (não quebrar links externos/scripts que apontam pro path antigo):
```markdown
# BACKLOG.md (movido)

Este arquivo foi dividido para reduzir o tamanho de contexto carregado por sessão:

- Itens ativos (Backlog / In Progress / Paused): `docs/backlog/ACTIVE.md`
- Itens concluídos (histórico): `docs/backlog/DONE.md`
```
**Verificação:** `ACTIVE.md` + `DONE.md` juntos têm os mesmos 98 itens do arquivo original — nenhum item perdido na migração (comparar contagem antes/depois).

### Passo 3: Script de migração (roda uma vez)
**Ficheiro:** `scripts/migrate-backlog.ts` (novo, temporário — pode ser removido após a migração)

**Ação:**
```typescript
/**
 * migrate-backlog.ts — Migração one-shot do BACKLOG.md monolítico
 * para docs/backlog/{ACTIVE,DONE}.md. Reaproveita o parser existente.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseBacklog } from "../src/backlog-parser.js"; // confirmar nome exato do export após ler o arquivo

const SOURCE = "shitenno-go/docs/BACKLOG.md";
const items = parseBacklog(readFileSync(SOURCE, "utf-8"));

const done = items.filter((i) => i.status === "Done");
const active = items.filter((i) => i.status !== "Done");

writeFileSync("shitenno-go/docs/backlog/DONE.md", renderBacklogSection(done, "Concluído"));
writeFileSync("shitenno-go/docs/backlog/ACTIVE.md", renderBacklogSection(active, "Ativo"));

console.log(`Migrados: ${done.length} done, ${active.length} ativos. Total: ${items.length}.`);
```
`renderBacklogSection` deve reusar exatamente o mesmo formato de tabela que `backlog-writer.ts` já produz — não inventar formato novo, para não quebrar o parser na próxima leitura.

**Verificação:** rodar o script, comparar contagem total (98) com a soma dos dois arquivos gerados. Rodar `git diff --stat` para confirmar que nenhum conteúdo de item foi alterado, só reorganizado.

### Passo 4: Atualizar `backlog-parser.ts`/`backlog-writer.ts` para o novo layout
**Ficheiro:** `src/backlog-parser.ts`, `src/backlog-writer.ts`

**Ação:** trocar o path hardcoded (se houver) de `docs/BACKLOG.md` para os dois novos paths, com uma função `getBacklogPath(status)` que decide qual arquivo ler/escrever baseado no status do item sendo processado. Itens que mudam de status (`Backlog` → `Done`) precisam ser removidos de `ACTIVE.md` e adicionados a `DONE.md` na mesma operação — não é só trocar path de leitura, é mover o item entre arquivos no momento da transição de status.
**Verificação:** teste automatizado: criar item novo (`Backlog`), mudar status para `Done`, confirmar que ele sai de `ACTIVE.md` e aparece em `DONE.md`.

### Passo 5: Atualizar comandos consumidores
**Ficheiro:** os arquivos listados no Passo 1

**Ação:** ajustar qualquer referência direta a `docs/BACKLOG.md` para usar a função do parser (não o path hardcoded), e comandos que hoje leem "tudo" para filtrar por status já leem só `ACTIVE.md` diretamente quando só precisam de itens ativos (ex.: `shiten list` provavelmente só quer `ACTIVE.md`, não `DONE.md`).
**Verificação:** `shiten list` (ou equivalente) mostra os mesmos itens ativos de antes da migração, sem os itens `Done` que antes apareciam misturados.

---

## Decisões de Design

| # | Decisão | Alternativa rejeitada | Racional |
|---|---------|----------------------|----------|
| 1 | Separar por Status (Active/Done), não por Prioridade (P0/P1/P2/P3) como eixo primário | Um arquivo por prioridade | Status é o eixo que mais reduz tamanho útil (20/98 itens já resolvidos não precisam ser lidos no dia a dia); prioridade pode ser um filtro secundário dentro de `ACTIVE.md` depois, se necessário |
| 2 | Manter `BACKLOG.md` como stub de redirecionamento, não deletar | Apagar o arquivo antigo direto | Evita quebrar scripts/links externos (incluindo o `.husky/post-commit` mencionado no próprio backlog, item BUG-001) sem aviso |
| 3 | Reaproveitar `backlog-parser.ts`/`backlog-writer.ts` existentes | Escrever parser novo para o novo formato | O formato de tabela não muda, só o arquivo em que cada item vive — não há motivo para reescrever a lógica de parsing |

## Riscos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| 1 | Algum script externo (hook do git, CI) lê `docs/BACKLOG.md` diretamente por path fixo, não pelo parser | Médio | Passo 1 já busca por `"BACKLOG.md"` em todo o repo, não só em `src/` — incluir busca em `.husky/`, `.github/`, `scripts/` |
| 2 | Migração perde item por erro de parsing de algum caso de borda na tabela (ex.: item sem todos os campos preenchidos) | Médio | Verificação do Passo 3 compara contagem total antes/depois — se não bater, revisar item por item antes de prosseguir para o Passo 4 |
