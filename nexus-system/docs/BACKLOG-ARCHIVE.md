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
| **Descricao** | Dois problemas combinados: (A) A documentacao (AGENTS.md, SYSTEM_MAP.md) descreve a arquitetura completa como se tudo estivesse presente, mas o sistema ja suporta entrega incremental por capacidades. A documentacao nao indica claramente o que esta instalado vs disponivel vs futuro. (B) O AGENTS.md nao inclui regras que obriguem o agente a detectar gaps proativamente e informar ao usuario. A capacidade tecnica ja existe (auto-evolution.ts, doctor.ts, status.ts, knowledge-debt.ts) mas nao esta acionada pelas regras do time. |
| **Resolucao parcial** | (2026-07-01) `nexus init` agora re-analisa complexidade quando projeto ja inicializado. `nexus assess` mostra proximo passo claro com `nexus upgrade --accept-recommended`. |
| **Fase 1** | Done (2026-07-05) — SYSTEM_MAP.md com legenda + CAPABILITY_STATUS dinamico |
| **Fase 2** | Done (2026-07-05) — upgrade.ts agora actualiza SYSTEM_MAP.md status ao adicionar capacidades |
| **Commits** | `3070cc1` (P0.6 Phase 1), `56af5be` (P0.6 Phase 2 — upgrade.ts sync) |

### 0.7 Actualizar documentacao desactualizada (6 ficheiros)

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Critico |
| **Owner** | Agente IA |
| **Resolucao** | Todos os 6 ficheiros actualizados (2026-07-05) |
| **Plano** | `plans/2026-07-04-docs-sync-critical.md` |
| **Arquivos** | README.md, docs/AGENTS.md, Nexus-System_GUIDE.md, CONCEPTUAL_MODEL.md, SYSTEM_MAP.md, CHANGELOG.md |

---

## P1 — Done

### 1.1 Ligacao feedback ↔ session ativo

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Alto |
| **Owner** | Edson |
| **Resolucao** | Adicionado --session-id ao nexus feedback (2026-06-30) |
| **Arquivo** | `src/commands/feedback.ts` |

### 1.2 Logging de erros no enrichment

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Substituido try/catch vazios por logger.debug() (2026-06-30) |
| **Arquivo** | `src/context-collector.ts` |

### 1.3 Unificar computeInputHash

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Removido de context-collector.ts, importado de briefing-cache.ts (2026-06-30) |
| **Arquivo** | `src/context-collector.ts` |

### 1.4 Dashboard correlacionar session-tracker + feedback

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Importado getSessionMetrics() e exibido no dashboard (2026-06-30) |
| **Arquivo** | `src/commands/dashboard.ts` |

### 1.5 Dynamico: estimativas de tokens no bench

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Baixo |
| **Owner** | Edson |
| **Resolucao** | Calculado baseado em contagem de arquivos, regras e risk-map (2026-06-30) |
| **Arquivo** | `src/commands/bench.ts` |

### 1.6 Corrigir writeBriefingMarkdown path

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Corrigido path relativo para absoluto (2026-06-30) |
| **Arquivo** | `src/commands/briefing.ts` |

---

## P2 — Done

### 2.3 Nexus update — comando de actualizacao com change detection

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Criado `src/manifest.ts` e `src/commands/update.ts` (2026-07-05) |
| **Plano** | `plans/2026-07-04-feedback-and-update.md` (Parte 2) |

---

## P1 — AI Agent Integration — Done

### A8 Feedback personalizado agente + usuario com calibragem de perfil

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Alto |
| **Owner** | Edson |
| **Resolucao** | Implementado feedback-engine.ts com calibragem de tom por perfil (2026-07-01). 19 testes novos. |
| **Arquivo** | `src/feedback-engine.ts`, `src/commands/feedback.ts`, `src/commands/profile.ts`, `src/prompts.ts`, `src/commands/init.ts` |

---

## Metricas de Qualidade (snapshot 2026-06-30)

```
Projeto:       nexus-cli v0.1.0
TypeScript:    strict: true, 0 erros
Testes:        606/606 passando (43 arquivos)
Coverage:      ~51% (linhas) | ~82% (funcoes) | ~76% (branches)
ESLint:        0 erros, 0 warnings
Dependencias:  6 deps + 10 devDeps (lean)
CI/CD:         ci.yml (Node 18/20/22 + coverage gate)
Commands:      18 (init, status, audit, assess, detect, run, evolve,
               report, doctor, upgrade, validate, sync, clean, digest,
               briefing, feedback, bench, dashboard)
Context Pipeline: collectContext → cache → briefing → feedback → dashboard
Auto-backlog:  nexus audit --auto-backlog (detect gaps → BACKLOG.md)
Auto-analise:  17 gaps identificados (3 P0, 8 P1, 6 P2)
```

---
*Arquivo gerado em 2026-07-06 — backup de itens concluidos e historico*
