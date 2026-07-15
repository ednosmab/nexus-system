# Shitenno-go — Documentacao

> Este e o indice dos documentos do Shitenno-go. Organizados por nivel hierarquico.

## Estrutura

### Nivel 0: Regras Globais (P0 — sempre carregadas)

| Documento | Proposito |
|---|---|
| `AGENTS.md` | Regras do time de engenharia de IA |
| `FORBIDDEN_OPERATIONS.md` | Regras vinculantes e prohibicoes absolutas |
| `DESDO.md` | Diretrizes de engenharia (SOLID, TDD, seguranca) |
| `CONCEPTUAL_MODEL.md` | Modelo conceitual do sistema |
| `KNOWLEDGE_LIFECYCLE.md` | Ciclo de vida do conhecimento |

### Nivel 1: Contexto (P1 — carregadas por tarefa)

| Documento | Proposito |
|---|---|
| `opencode-context.md` | Contexto operacional do projecto |
| `BACKLOG.md` | Backlog activo com prioridades P0-P3 |
| `session-template.md` | Template de sessao |

### Nivel 2: Competencias (P2 — sob demanda)

| Documento | Proposito |
|---|---|
| `capabilities.md` | Lista de capabilities disponiveis |
| `Shitenno-go_GUIDE.md` | Guia completo do sistema |

### Nivel 3: Regras Modulares (carregadas por capability)

| Documento | Proposito |
|---|---|
| `rules/agent-modes.md` | Modos plan/build/review |
| `rules/branch-policy.md` | Politica de branches |
| `rules/context-algorithm.md` | Algoritmo de gestao de contexto |
| `rules/dependency-graph.md` | Grafo de dependencias |
| `rules/feedback-protocol.md` | Protocolo de feedback |
| `rules/lazy-loading.md` | Leitura preguiciosa |

### Nivel 4: Historia e Auditoria (sob demanda)

| Documento | Proposito |
|---|---|
| `adrs/` | Architecture Decision Records |
| `sdr/` | Solution Decision Records |
| `feedback/` | Feedback de sessoes |
| `reports/` | Relatorios de projecto |
| `runbooks/` | Runbooks operacionais |

### Nivel 5: Skills

| Documento | Proposito |
|---|---|
| `skills/*.md` | Skills especializadas para IA |

---

## Guia de Leitura

| Tarefa | Ler |
|---|---|
| Entender por que o Shiten existe | CONCEPTUAL_MODEL.md |
| Aprender o modelo de dominio | KNOWLEDGE_LIFECYCLE.md |
| Verificar regras | AGENTS.md + FORBIDDEN_OPERATIONS.md |
| Configurar projecto | opencode-context.md |
| Adicionar feature | rules/agent-modes.md |
| Corrigir bug | rules/context-algorithm.md |
| Refactorar | rules/dependency-graph.md |

---

*Indice gerado automaticamente pelo shitenno-cli.*
