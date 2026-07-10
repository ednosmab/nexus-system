# BACKLOG-ARCHIVE — Nexus System

> **Arquivo de itens concluidos e historico de auditorias**
>
> **Data de criacao:** 2026-07-06
>
> **Fonte:** `BACKLOG.md` (itens com status Done e secções historicas)
>
> **Nota:** Este ficheiro e apenas para referencia. Itens activos estao em `BACKLOG.md`.

---

## Done — Tabela Resumo

| Item | Severidade | Resolucao |
|---|---|---|
| Renomear "nexus-governance" → "nexus-system" | Critico | package.json, init.ts, audit.ts |
| Executar Plano Estrategico (10 pilares) | Alto | conceptual model, knowledge lifecycle, capabilities, etc. |
| Comando `evolve` com dual-path | Alto | src/commands/evolve.ts (251 linhas) |
| Comando `run` (pipeline) | Alto | src/commands/run.ts (206 linhas) |
| Auto-evolution com feedback | Alto | src/auto-evolution.ts (399 linhas) |
| Dual-path presenter | Alto | src/dual-path-presenter.ts (231 linhas) |
| Challenge generator | Alto | src/challenge-generator.ts (276 linhas) |
| Growth profile | Alto | src/growth-profile.ts (256 linhas) |
| Event bus com 10 tipos novos | Alto | src/event-bus.ts |
| Seguranca no rule-engine | Critico | Allowlist em execSync, sanitizacao |
| Atomic writes no cache | Medio | writeCache() usa tmp + renameSync |
| Coverage configurado com thresholds | Alto | vitest.config.ts com @vitest/coverage-v8 |
| Context Pipeline completo | Alto | collectContext(), briefing-cache, session-feedback |
| Comando `feedback` | Alto | nexus feedback --outcome success/failure/partial |
| Comando `bench` | Medio | nexus bench — token benchmark automatizado |
| Comando `dashboard` | Medio | nexus dashboard — token economy metrics |
| Token optimizer | Medio | suggestDepth, compressedSummary, differentialBriefing |
| Gap 1: status.ts usa collectContext() | Alto | Substituido ad-hoc por pipeline unificado |
| Gap 2: feedback.ts briefingHash conectado | Alto | Le do briefing-cache em vez de hardcoded "" |
| Gap 3: session-tracker ↔ session-feedback | Alto | sessionId field, getFeedbackForSession() |
| Gap 4: recurringErrors populado | Alto | Via feedback failure hotspots em enrichBriefingWithPatterns |
| Gap 5: pattern-detector no briefing | Alto | Campo detected[] populado por detectPatterns() |
| Token-optimizer integrado no briefing | Alto | compressedSummary em --summary, suggestDepth adaptativo, --profile option |
| P0 0.1: Remover auto-feedback briefing | Alto | Removido recordOutcome() automatico do briefing command |
| P0 0.2: Padrao redundante eliminado | Alto | enrichBriefingWithPatterns() aceita patternReport opcional |
| P0 0.3: Dead code briefing.ts | Medio | Removido displayBriefing() e import getCachedBriefing |
| P0 0.4: Dead code dashboard.ts | Baixo | Removido trendArrow() |
| P0 0.5: Simplificar getLatestFeedback | Baixo | Refatorado para records.at(-1) ?? null |
| 1.12 Coverage gap: comandos CLI | Alto | 36 novos testes em digest.test.ts + commands-action.test.ts (580 total) |
| Auto-backlog feature | Alto | nexus audit --auto-backlog — detecta gaps e escreve no BACKLOG.md (606 testes) |
| AUDIT-EXPANSION | Alto | Expandir audit coverage 79% → ~93% (taint, rule-engine) — 2026-07-04 |
| QUICK-BOARD-FIX | Alto | Corrigir loadQuickBoard() — require() em contexto ESM — 2026-07-04 |
| SA1 | Critico | governance/WORKFLOW.md criado — 2026-07-01 |
| SA6 | Alto | Artefactos orfaos conectados via SYSTEM_MAP.md — 2026-07-01 |
| SA14 | Baixo | docs/session-template.md criado — 2026-07-01 |
| BACKLOG-0.7 | Critico | Actualizar documentacao desactualizada (6 ficheiros) — 2026-07-05 |
| SA2 | Critico | Resolvido import de node:fs em src/commands/digest.ts — 2026-07-05 |
| 2.3 | Medio | Criado src/commands/update.ts e src/manifest.ts — 2026-07-05 |
| AUDIT-CLEANUP-01 | Baixo | Testes knowledge-debt.test.ts e state-manager.test.ts criados — 2026-07-05 |
| AUDIT-CLEANUP-02 | Baixo | Health score deductions extraidos para formatting.ts (HEALTH_SCORE_DEDUCTIONS) — 2026-07-05 |
| AUDIT-CLEANUP-03 | Baixo | Removidos 4 casts as NexusEventType em pipeline.ts — 2026-07-05 |
| AUDIT-CLEANUP-04 | Baixo | run_script → run_local_script (deprecated fallback) — 2026-07-05 |
| AUDIT-CLEANUP-05 | Baixo | Planos de auditoria movidos para plans/done/ — 2026-07-05 |
| DESOPLAMENTO A.1-A.4 | Critico | Desacoplamento de opencode.json — shared.ts, nexus-state-machine.ts, analyser.ts, capability-engine.ts — 2026-07-07 |
| DESOPLAMENTO A.5 | Alto | MCP multi-formato (.mcp.json + .cursor/mcp.json) — init.ts — 2026-07-07 |
| DESOPLAMENTO B.1 | Alto | Path do BACKLOG.md corrigido no scaffolder — capability-mapping.ts — 2026-07-07 |
| DESOPLAMENTO B.2 | Medio | Falso positivo de XSS eliminado — engineering-detectors.ts — 2026-07-07 |
| DESOPLAMENTO B.3 | Medio | Sync restaurado em bin/nexus.ts, gate valido — 2026-07-07 |
| DESOPLAMENTO B.5 | Alto | OOM em vitest resolvido — programCache no TaintAnalyzer — 2026-07-07 |
| DESOPLAMENTO B.6 | Medio | healthScore recalibrado com sqrt e normalizacao — 2026-07-07 |
| DESOPLAMENTO B.7 | Alto | Rule engine auto-cria directories (history/, context/) — ensureContextBuffer() — 2026-07-07 |
| MCP-SERVER | Alto | Servidor MCP com 3 tools (getBriefing, getRiskMap, getRules) — mcp-server.ts — 2026-07-07 |
| SA3 | Critico | Governance 0% resolvido — maturity-profile.ts + policies + answers.json — 2026-07-06 |
| 2.5 | Medio | context-collector desacoplado de pattern-detector via ContextDeps — 2026-07-08 |
| 2.6 | Baixo | BriefingDepth tipo proprio em displayBriefingByDepth() — 2026-07-08 |
| 2.8 | Medio | Schema validation em JSONL readers (session-feedback, session-tracker) — 2026-07-08 |
| 2.9 | Baixo | banner()/section()/kv() extraidos para formatting.ts, 7 commands actualizados — 2026-07-08 |
| 2.10 | Medio | AGENTS.md template actualizado com lista completa de 20+ comandos — 2026-07-08 |
| 2.15b | Medio | Cache intermediario no collectContext via getCached/setCache injectaveis — 2026-07-08 |
| SA8 | Alto | context_buffer.yaml movido para core + ensureContextBuffer() — 2026-07-08 |
| SA5 | Alto | 4 ADRs criados (ADR-001 a ADR-005) — 2026-07-08 |
| SA9 | Alto | 4 agent contracts (planner, executor, reviewer, orchestrator) — 2026-07-08 |
| SA13 | Baixo | ADRs documentados (resolvido pelo SA5) — 2026-07-08 |
| 2.2a | Medio | Feedback CLI flags (--user-rating, --user-comment) + testes — 2026-07-08 |
| 2.18 | Medio | Dashboard cliques do mouse funcionais — 2026-07-08 |
| 3.5 | Baixo | Plugin system com registerPlugin(), hooks, validacao — 2026-07-08 |
| 3.29 | Medio | Session-tracker ja usa appendFileSync (append-only) — 2026-07-08 |
| 2.11 | Baixo | ROI.md linkado em README.md:133 — 2026-07-08 |
| 3.6 | Baixo | nexus dashboard --live (--live <seconds>) — 2026-07-08 |
| 3.21 | Baixo | Briefing --profile com minimal/standard/full — 2026-07-08 |
| 3.24 | Baixo | Event history query API (getHistory()) — 2026-07-08 |
| 2.14 | Baixo | KNOWN_LIMITATIONS.md ja existe com 12 limitacoes documentadas — 2026-07-09 |

---

## Plano de Correção Auditoria Completa — Done (2026-07-10)

### Fase 1 — Segurança (Crítico)

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Critico |
| **Owner** | Agente IA |
| **Resolucao** | 8 items implementados: allowlist de scripts, sanitizacao de rule IDs, protecao ReDoS, sanitizacao de section/event, validacao de schema, protecao contra prototype pollution, validacao de plugins |

### Fase 0 — Quick Wins

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Alto |
| **Owner** | Agente IA |
| **Resolucao** | Correccoes de referencias partidas, READMEs, extensoes, placeholders de data |

### Fase 1.1 — Empty Catches → logger.debug

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Medio |
| **Owner** | Agente IA |
| **Resolucao** | 52 catch blocks vazios substituidos em engineering-detectors.ts (13) e governance-detectors.ts (39) |

### Fase 1.3 — console.log → logger em biblioteca

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Medio |
| **Owner** | Agente IA |
| **Resolucao** | Analise revelou que todo o console.log restante e output CLI intencional. Modulos de biblioteca (scorer, session-tracker, cache) ja usam logger. |

### Fase 1.5 — Orphan Modules

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Medio |
| **Owner** | Agente IA |
| **Resolucao** | Detector reescrito para verificar exports reais (nao apenas imports directos). Eliminacao de falsos positivos como suggestion-engine.ts. |

### Fase 2 — Qualidade do Código

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Medio |
| **Owner** | Agente IA |
| **Resolucao** | Logger centralizado ja existia. Constantes duplicadas consolidadas (VIOLATION_KEYWORDS e COMMAND_GATES em src/constants.ts). Detector de orphan modules melhorado. |

### Fase 3 — Infraestrutura e Configuração

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Medio |
| **Owner** | Agente IA |
| **Resolucao** | ESLint flat config, tsconfig.json melhorado, .gitignore actualizado, cache com writes atomicos, event history com MAX_HISTORY=1000, FileContentCache com MAX_ENTRIES=500 |

### Fase 4 — CI/CD e Publicação

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Alto |
| **Owner** | Agente IA |
| **Resolucao** | ci.yml: lint/test/coverage jobs separados, npm audit, pinned SHAs. release.yml: lint+typecheck, version verification, pinned SHAs |

### Fase 5 — README e Documentação

| Campo | Valor |
|---|---|
| **Status** | Done — 2026-07-10 |
| **Severidade** | Alto |
| **Owner** | Agente IA |
| **Resolucao** | README actualizado com 32 comandos, arquitectura completa, medidas de segurança |

---

## Commits desta sessão (2026-07-10)

| Commit | Descrição |
|--------|-----------|
| `1d1ab00` | fix(audit): rewrite detectOrphanModules to check real exports |
| `822b53a` | refactor: Fase 1 — logger in action-engine + governance-detectors |
| `7d57a4c` | refactor: consolidate VIOLATION_KEYWORDS and COMMAND_GATES |
| `8ddf1ae` | chore: fix .npmignore reference |
| `2612ded` | ci: harden CI/CD — pinned SHAs, permissions, npm audit |
| `9e423ef` | ci: move npm audit to lint job |
| `ccbb1aa` | docs: update README with all 32 commands |

---

## P0 — Done

### 0.1 Remover auto-feedback "success" no briefing command

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Alto |
| **Owner** | Edson |
| **Resolucao** | Removido recordOutcome() automatico do briefing command (2026-06-30) |
| **Arquivo** | `src/commands/briefing.ts` |

### 0.2 Evitar deteccao de padroes redundante

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Alto |
| **Owner** | Edson |
| **Resolucao** | enrichBriefingWithPatterns() aceita patternReport opcional (2026-06-30) |
| **Arquivo** | `src/context-collector.ts` |

### 0.3 Remover dead code em briefing.ts

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Removido displayBriefing() e import getCachedBriefing (2026-06-30) |
| **Arquivo** | `src/commands/briefing.ts` |

### 0.4 Remover dead code em dashboard.ts

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Baixo |
| **Owner** | Edson |
| **Resolucao** | Removido trendArrow() (2026-06-30) |
| **Arquivo** | `src/commands/dashboard.ts` |

### 0.5 Simplificar getLatestFeedback

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Baixo |
| **Owner** | Edson |
| **Resolucao** | Refatorado para records.at(-1) ?? null (2026-06-30) |
| **Arquivo** | `src/session-feedback.ts:161` |

### 0.6 Documentacao dinamica + deteccao proativa de gaps

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Critico |
| **Owner** | Edson |
| **Resolucao parcial** | (2026-07-01) `nexus init` agora re-analisa complexidade |
| **Fase 1** | Done (2026-07-05) — SYSTEM_MAP.md com legenda + CAPABILITY_STATUS dinamico |
| **Fase 2** | Done (2026-07-05) — upgrade.ts agora actualiza SYSTEM_MAP.md status |

### 0.7 Actualizar documentacao desactualizada (6 ficheiros)

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Critico |
| **Owner** | Agente IA |
| **Resolucao** | Todos os 6 ficheiros actualizados (2026-07-05) |

---

## P1 — Done

### 1.1 Ligacao feedback ↔ session ativo

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Alto |
| **Owner** | Edson |
| **Resolucao** | Adicionado --session-id ao nexus feedback (2026-06-30) |

### 1.2 Logging de erros no enrichment

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Substituido try/catch vazios por logger.debug() (2026-06-30) |

### 1.3 Unificar computeInputHash

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Removido de context-collector.ts, importado de briefing-cache.ts (2026-06-30) |

### 1.4 Dashboard correlacionar session-tracker + feedback

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Importado getSessionMetrics() e exibido no dashboard (2026-06-30) |

### 1.5 Dynamico: estimativas de tokens no bench

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Baixo |
| **Owner** | Edson |
| **Resolucao** | Calculado baseado em contagem de arquivos, regras e risk-map (2026-06-30) |

### 1.6 Corrigir writeBriefingMarkdown path

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Corrigido path relativo para absoluto (2026-06-30) |

---

## P2 — Done

### 2.3 Nexus update — comando de actualizacao com change detection

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Criado `src/manifest.ts` e `src/commands/update.ts` (2026-07-05) |

---

## P1 — AI Agent Integration — Done

### A8 Feedback personalizado agente + usuario com calibragem de perfil

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Alto |
| **Owner** | Edson |
| **Resolucao** | Implementado feedback-engine.ts com calibragem de tom por perfil (2026-07-01). 19 testes novos. |

---

## Metricas de Qualidade (snapshot 2026-07-10)

```
Projeto:       nexus-cli v0.1.0
TypeScript:    strict: true, 0 erros (pre-existentes apenas)
Testes:        1791/1791 passando (111 arquivos)
Coverage:      ~51% (linhas) | ~82% (funcoes) | ~76% (branches)
ESLint:        0 erros, 0 warnings
Dependencias:  11 deps + 12 devDeps
CI/CD:         ci.yml (lint/test/coverage jobs, Node 18/20/22, npm audit, pinned SHAs)
Commands:      32 (init, status, audit, assess, detect, run, evolve, report, doctor, 
               upgrade, validate, sync, clean, digest, briefing, feedback, bench, 
               dashboard, plan, goal, decide, policy, act, console, profile, 
               context, history, reminders, mcp, update, shell-init, docs-audit)
Architecture:  148 source files, 12 engines, 100+ audit detectors
Security:      Script allowlist, rule ID validation, regex protection, 
               prototype pollution guard, plugin validation, atomic cache writes,
               cache permissions, CI/CD supply chain security
```

---
*Ultima actualizacao: 2026-07-10 — Plano de correcção auditoria completa (Fase 0-5) concluido*
