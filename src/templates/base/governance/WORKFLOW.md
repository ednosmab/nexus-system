# WORKFLOW — Fluxo de Sessao

> **Versao:** 1.0
> **Aplicavel a:** Todos os agentes IA

---

## Principio Fundamental

> **Toda sessao comeca com leitura e termina com validacao. Nenhuma escrita sem contexto.**

---

## 1. Entrada Obrigatoria

Ao receber qualquer tarefa, o agente DEVE executar os 4 passos na ordem exacta:

```
PASSO 1: DIAGNOSTICO E LEITURA PREGUIÇOSA
  |  -> Ler este ficheiro (WORKFLOW.md) — SEMPRE PRIMEIRO
  |  -> Ler governance/context/context_buffer.yaml
  |  -> Ler docs/AGENTS.md (P0)
  |  -> Ler docs/FORBIDDEN_OPERATIONS.md (P0)
  |  -> Ler docs/DESDO.md (P0)
  |  -> Identificar tipo: FEATURE | BUG | REFACTOR | DOCUMENTATION | PLANNING
  v
PASSO 2: ACTUALIZACAO DA MEMORIA RAM
  |  -> Actualizar context_buffer.yaml
  |  -> Registar tarefa em execucao
  |  -> Registar documentos carregados
  v
PASSO 3: EXECUCAO CIRURGICA
  |  -> Escrever codigo apenas na pasta permitida
  |  -> Se erro -> parar, documentar no buffer, corrigir
  v
PASSO 4: CONSOLIDACAO E PURGA
     -> Marcar [x] no plano
     -> Limpar impedimentos do buffer
     -> Executar validate-session
     -> Executar close-session (quando autorizado)
```

---

## 2. Tipos de Operacao

### 2.1 FEATURE (Nova Funcionalidade)

1. Determinar tipo via WORKFLOW.md
2. Ler context_buffer.yaml -> estado actual
3. Executar premortem-check -> o que pode quebrar?
4. Criar plano em `governance/plans/`
5. Actualizar buffer com tarefa em execucao
6. Implementar codigo cirurgicamente
7. Executar testes e lint
8. Executar `pnpm run validate:session`
9. Aguardar autorizacao para commit
10. Executar `pnpm run close:session`

### 2.2 BUG (Correccao)

1. Identificar como BUG via WORKFLOW.md
2. Ler context_buffer.yaml -> estado actual
3. Reproduzir erro / identificar causa raiz
4. Documentar erro no buffer (seccao `Impedimentos`)
5. Corrigir codigo cirurgicamente
6. Executar testes
7. Actualizar buffer e encerrar

### 2.3 REFACTOR (Reestruturacao)

1. Identificar como REFACTOR via WORKFLOW.md
2. Ler ADRs relacionadas
3. Executar premortem-check -> verificar impacto
4. Executar refactoracao conforme plano
5. Executar testes e lint
6. Validar e encerrar

### 2.4 DOCUMENTATION (Documentacao)

1. Identificar como DOCUMENTATION via WORKFLOW.md
2. Ler documentos affectados
3. Escrever/actualizar documentacao
4. Verificar referencias cruzadas
5. Validar e encerrar

### 2.5 PLANNING (Planeamento)

1. Identificar como PLANNING via WORKFLOW.md
2. Ler contexto completo (P0 + P1)
3. Gerar plano atomico em `governance/plans/`
4. Apresentar ao utilizador para aprovacao
5. Aguardar autorizacao antes de executar

<!-- CAPABILITY: governance -->

### 2.6 Formato de Planos Markdown

**Regra:** Planos activos NAO devem conter checkboxes (`- [ ]` ou `- [x]`). O rastreamento de progresso e feito exclusivamente pelo campo `**Status:**` no frontmatter.

**Status validos:** `andamento`, `parado`, `done`

**Fluxo:**
1. Criar plano com `**Status:** andamento`
2. Atualizar `**Status:**` conforme progresso
3. Ao concluir: `**Status:** done` + mover para `done/`

**Exemplo:**
```markdown
**Status:** andamento
...
### Step 1: Nome
- **Ficheiro:** path
- **Accao:** descricao
- **Verificacao:** comando
```

### 2.7 Lifecycle de Planos — Auto-Archival

**Trigger:** Apos execucao completa do plano + validacao (build/test/lint OK) + confirmacao do utilizador.

**Comando:** `nexus plan md lifecycle`

**Opcoes:**
- `--auto` — Auto-archiva sem prompts (CI/CD)
- `--dry` — Dry run, mostra o que faria sem alterar

**Fluxo:**
1. Sistema detecta planos activos em `governance/plans/`
2. Para cada plano: valida build, testes e lint
3. Pergunta ao utilizador: "Review pelo agente [A] ou pelo utilizador [U]?"
4. Se [A]: reporta resultado da validacao automatica
5. Se [U]: pede confirmacao manual
6. Apos confirmacao: `engine.updateStatus(id, "done")` automatico
7. Plano movido para `governance/plans/done/`

**Exceccao:** Planos com `**Status:** parado` sao ignorados (nao concluidos).

**Integracao com close:session:** O passo 8 do `close-session.ts` detecta planos activos e emite aviso. Nao arquiva automaticamente — apenas informa.

---

<!-- /CAPABILITY -->

## 3. Hierarquia de Leitura

```
[Nivel 0: P0] governance/WORKFLOW.md           <- SEMPRE PRIMEIRO
       |
       v
[Nivel 1: P0] docs/AGENTS.md                  <- Regras Globais
[Nivel 1: P0] docs/FORBIDDEN_OPERATIONS.md    <- Regras Vinculantes
[Nivel 1: P0] docs/DESDO.md                   <- Diretrizes
       |
       v
[Nivel 2: P1] governance/context/
             context_buffer.yaml               <- Estado Actual
       |
       v
[Nivel 3: P2] Codigo e configuracao           <- Escrita Cirurgica
       |
       v
[Nivel 4: P3] docs/skills/                    <- Competencias operacionais
       |
       v
[Nivel 5: P4] docs/history/                   <- Auditoria (Sob Demanda)
```

**Regra:** O agente nunca decide o que ler. A hierarquia P0->P4 determina a ordem.

---

## 4. Scripts de Validacao

| Script | Comando | Quando Usar |
|---|---|---|
| **validate-session** | `pnpm run validate:session` | Antes de encerrar sessao |
| **close-session** | `pnpm run close:session` | No encerramento (apos autorizacao) |
| **premortem-check** | `pnpm run premortem:check` | Antes de features complexas |

### 4.1 validate-session

Verifica integridade da sessao:
- Tarefa activa no buffer
- ADRs criados quando necessario
- Config opencode.json consistente
- Contratos de agentes presentes
- Buffer com seccoes obrigatorias

### 4.2 close-session

Checklist de encerramento:
- Working tree limpo (sem alteracoes por commitar)
- Testes executados
- Buffer actualizado
- Backlog actualizado
- Ultimo commit registado
- Build verificado

### 4.3 premortem-check

Analise de riscos previa:
- Identificar areas sensiveis affectadas
- Verificar dependencias circulares
- Validar conformidade com FORBIDDEN_OPERATIONS

---

<!-- CAPABILITY: governance -->

## 5. Regras de Transicao

### 5.1 Feature -> Develop

1. Working tree limpo
2. Testes verdes
3. `pnpm run validate:session` passa
4. Autorizacao explicita do utilizador
5. `git commit` com mensagem Conventional Commits
6. `pnpm run close:session`

### 5.2 Bug -> Hotfix

1. Causa raiz identificada
2. Correccao implementada
3. Testes verdes
4. Autorizacao explicita do utilizador
5. `git commit` com mensagem Conventional Commits

### 5.3 Refactor -> Branch dedicada

1. ADR criada (se decisao arquitectural)
2. Plano aprovado
3. Testes verdes apos refactor
4. Autorizacao explicita do utilizador
5. `git commit` com mensagem Conventional Commits

---

## 6. Pontos de Pausa (Gates)

### G-01: Commit Authorization

**Antes de QUALQUER `git commit`:**
- Parar execucao
- Solicitar autorizacao explicita do utilizador
- Aguardar confirmacao
- So entao executar commit

**Exceccao:** Nenhuma. Esta regra e absoluta.

### G-02: Scope Creep

**Se o agente detectar necessidade de alteracao fora do escopo:**
- Parar execucao
- Documentar no buffer (seccao `technical_debt`)
- Solicitar autorizacao para expandir escopo
- Aguardar aprovacao antes de avancar

---

## 7. Formato do Context Buffer

O `governance/context/context_buffer.yaml` DEVE conter:

```yaml
session:
  id: "<session-id>"
  started_at: "<ISO-date>"
  status: "in_progress" | "completed"

current_task:
  id: "<task-id>"
  description: "<brief-description>"
  status: "in_progress"
  started_at: "<ISO-date>"

documents_loaded:
  - path: "<document-path>"
    loaded_at: "<ISO-date>"

impediments: []
  # - description: "<impediment>"
  #   detected_at: "<ISO-date>"
  #   status: "open" | "resolved"

technical_debt: []
  # - description: "<debt>"
  #   file: "<path>"
  #   priority: "P1" | "P2"

model_assignments: {}
  # planner: "<model-name>"
  # executor: "<model-name>"
  # reviewer: "<model-name>"
```

---

<!-- /CAPABILITY -->

## 8. Referencias

- `docs/AGENTS.md` — Regras do time (P0)
- `docs/FORBIDDEN_OPERATIONS.md` — Regras vinculantes (P0)
- `docs/DESDO.md` — Diretrizes de engenharia (P0)
- `governance/SYSTEM_MAP.md` — Mapa centralizado
- `governance/context/context_buffer.yaml` — Estado activo (RAM)
- `docs/Nexus-System_GUIDE.md` — Guia completo do sistema
