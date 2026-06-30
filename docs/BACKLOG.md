# BACKLOG — Nexus System

> **Priorizacao:** P0 (imediato, ≤ 7d), P1 (curto prazo, ≤ 30d), P2 (medio prazo, ≤ 90d), P3 (baixa prioridade, sem SLA).
>
> **Status:** `Backlog` | `In Progress` | `Paused [REVISIT: YYYY-MM-DD]` | `Done`
>
> **Severidade:** Critico | Alto | Medio | Baixo
>
> **Owner:** Agente que assume o item. Itens sem owner sao `unassigned`.
>
> **Ultima atualizacao:** 2026-06-30 — 532 testes, 0 erros TypeScript, Context Pipeline integrado, 119 itens no backlog (36 done, 5 P0 + 8 P1 integracao)

---

## Done

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

---

## P0 — Bugs e Integracao Imediata (≤ 7 dias)

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

---

## P1 — Integracao e Conexao (≤ 30 dias)

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
| **Resolucao** | Corrigido de .nexus para nexus-system/ (2026-06-30) |
| **Arquivo** | `src/commands/briefing.ts` |

### 1.7 Evitar race condition no cache

| Campo | Valor |
|---|---|
| **Status** | Done (limitacao documentada) |
| **Severidade** | Baixo |
| **Owner** | Edson |
| **Resolucao** | Aceito que ultimo writer vence — documentar limitacao (2026-06-30) |
| **Arquivo** | `src/briefing-cache.ts` |

### 1.8 Validar nexusDir antes de operacoes

| Campo | Valor |
|---|---|
| **Status** | Done |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Resolucao** | Adicionado existsSync(nexusDir) no guardNotInitialized() (2026-06-30) |
| **Arquivo** | `src/shared.ts` |

---

## P1 — Qualidade e Testes (≤ 30 dias)

### 1.9 Testes para comandos novos

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Modulos** | `src/commands/bench.ts` (0%), `src/commands/dashboard.ts` (0%), `src/commands/feedback.ts` (0% action) |
| **Descricao** | Os 3 comandos novos da Context Pipeline nao tem testes. |
| **Correcao** | Criar testes unitarios para: (a) `runBenchmark()` com mock de `collectContext`. (b) `displayDashboard()` com mock de `computeFeedbackSummary`. (c) Feedback command action com validacao de --outcome, summary mode, JSON output. |

### 1.10 Testes para enrichBriefingWithPatterns

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Arquivo** | `src/context-collector.ts` |
| **Descricao** | A funcao `enrichBriefingWithPatterns()` e a espinha dorsal da integracao feedback→briefing e pattern-detector→briefing, mas nao tem testes unitarios. |
| **Correcao** | Criar teste com DI mock: mockar `getFeedbackRecords()` e `detectPatterns()`. |

### 1.11 Testes para getFeedbackForSession e getLatestFeedback

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Arquivo** | `src/session-feedback.ts` |
| **Descricao** | Duas funcoes novas exportadas sem testes. |
| **Correcao** | Adicionar testes cobrindo: filtrar por sessionId, retorno de records vazios, retorno do ultimo record. |

### 1.12 Coverage gap: comandos CLI com 0%

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Modulos** | assess.ts, audit.ts, clean.ts, detect.ts, doctor.ts, evolve.ts, init.ts, report.ts, run.ts, status.ts, upgrade.ts, validate.ts |
| **Descricao** | 12 dos 13 comandos originais continuam com 0% de coverage. |
| **Correcao** | Exportar funcoes auxiliares e criar testes unitarios. Priorizar: assess, doctor, evolve, report, upgrade. |

### 1.13 Empty catch blocks (erros silenciados)

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Arquivos** | ~20 blocos catch {} vazios em: analyser.ts, auto-evolution.ts, cache.ts, capability-engine.ts, engineering-state.ts, event-bus.ts, feedback-loops.ts, context-collector.ts |
| **Descricao** | Blocos catch vazios escondem falhas silenciosamente. |
| **Correcao** | Adicionar `logger.debug()` ou `logger.warn()` em cada catch vazio. Priorizar cache.ts e engineering-state.ts. |

### 1.14 Remover displayBriefing dead code

| Campo | Valor |
|---|---|
| **Status** | Done (resolvido pelo 0.3) |
| **Severidade** | Medio |
| **Owner** | Edson |
| **Arquivo** | `src/commands/briefing.ts:160-230` |
| **Descricao** | `displayBriefing()` e uma funcao de ~70 linhas que nao e mais chamada — substituida por `displayBriefingByDepth()`. |
| **Correcao** | Removida junto com 0.3 (2026-06-30). |

---

## P2 — Funcionalidades e Otimizacao (≤ 90 dias)

### 2.1 Aprovacao de regras candidatas

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Arquivos** | `src/pattern-detector.ts` (CandidateRule), `src/commands/detect.ts` |
| **Descricao** | `detectPatterns()` gera `candidateRules` com status "proposed" mas nao existe mecanismo para aprovar/rejeitar. |
| **Correcao** | Criar `nexus detect --approve RULE-001` e `nexus detect --reject RULE-001`. Persistir decisoes em `nexus-system/governance/rules-decisions.json`. |

### 2.2 Feedback ↔ capability-engine

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivos** | `src/capability-engine.ts`, `src/session-feedback.ts` |
| **Descricao** | O capability-engine recomenda instalacoes mas nao aprende com falhas. |
| **Correcao** | No `evaluateCapabilities()`, consultar `failureHotspots` do feedback. Se uma area com capability instalada tem muitos failures, sugerir downgrade. |

### 2.3 nexus bench --compare historico

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivo** | `src/commands/bench.ts` |
| **Descricao** | Benchmark mostra resultados atuais mas nao compara com execucoes anteriores. |
| **Correcao** | Salvar resultado em `nexus-system/reports/bench-YYYY-MM-DD.json`. Adicionar `--compare` que mostra tendencia. |

### 2.4 nexus feedback --list

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivo** | `src/commands/feedback.ts` |
| **Descricao** | Nao existe forma de ver os registros de feedback sem usar `--summary`. |
| **Correcao** | Adicionar `--list` que mostra ultimos 10 registros formatados. |

### 2.5 Desacoplar context-collector de pattern-detector

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Arquivo** | `src/context-collector.ts` |
| **Descricao** | `context-collector.ts` agora importa `pattern-detector.ts` e `session-feedback.ts`, aumentando o acoplamento. O collector deveria ser uma camada de orquestracao, nao de integracao. |
| **Correcao** | Mover `enrichBriefingWithPatterns()` para um modulo separado (`src/briefing-enricher.ts`) ou injetar via `ContextDeps`. |

### 2.6 Type BriefingDepth como tipo proprio no briefing

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivo** | `src/briefing.ts`, `src/token-optimizer.ts` |
| **Descricao** | `BriefingDepth` e definido em `token-optimizer.ts` mas re-exportado. O briefing.ts nao tem referencia ao tipo — usa `string` no display. |
| **Correcao** | Usar `BriefingDepth` como tipo do parametro `depth` em `displayBriefingByDepth()` em vez de `string`. |

### 2.7 Usar differentialBriefing no --diff

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivos** | `src/commands/briefing.ts`, `src/token-optimizer.ts` |
| **Descricao** | `differentialBriefing()` do token-optimizer e mais compacto que `generateDiff()` do briefing.ts. O `--diff` usa `generateDiff()` que gera markdown verboso. |
| **Correcao** | Oferecer `--diff --compact` que usa `differentialBriefing()` (~50 tokens vs ~200). |

### 2.8 Validação de schema nos records lidos

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Arquivos** | `src/session-feedback.ts` (createFileStorage.read), `src/session-tracker.ts` (readAllSessions) |
| **Descricao** | Records lidos de JSONL nao tem validacao de schema. Se o arquivo estiver corrompido ou com formato antigo, `JSON.parse` retorna objetos incompletos. |
| **Correcao** | Adicionar validacao minima: verificar campos obrigatorios (id, timestamp, outcome) apos parse. Descartar records invalidos com logger.warn. |

### 2.9 Extrair modulo shared de display

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivos** | Todos os commands/ que tem `console.log` com chalk |
| **Descricao** | ~90 chamadas `console.log` com chalk repetidas em 18 arquivos de comando. Padrao de banner `╔══╗` duplicado em todos. |
| **Correcao** | Extrair funcoes `banner(title)`, `section(title)`, `kv(key, value)` para `src/formatting.ts`. |

---

## P2 — Documentacao (≤ 90 dias)

### 2.10 Atualizar AGENTS.md template

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Arquivo** | `src/templates/base/docs/AGENTS.md` |
| **Descricao** | O template menciona `nexus briefing` e `nexus feedback` mas nao menciona `nexus bench`, `nexus dashboard`, `nexus detect`, ou `nexus doctor`. |
| **Correcao** | Adicionar secoes para: bench, dashboard, detect, doctor, profile option. |

### 2.11 Linkar ROI.md no README

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivos** | `README.md`, `docs/ROI.md` |
| **Descricao** | `docs/ROI.md` foi criado mas nao e referenciado do README.md. |
| **Correcao** | Adicionar link na secao Token Economy do README. |

### 2.12 JSDoc nas funcoes novas

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivos** | `enrichBriefingWithPatterns`, `getFeedbackForSession`, `getLatestFeedback`, `compressedSummary`, `differentialBriefing`, `suggestDepth`, `generateOptimizationHints`, `displayBriefingByDepth` |
| **Descricao** | 8 funcoes exportadas/novas sem JSDoc. |
| **Correcao** | Adicionar JSDoc com `@param`, `@returns`, e `@example`. |

### 2.13 Consolidar planos de plans/

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Diretorio** | `plans/` (11 arquivos) |
| **Descricao** | 11 arquivos de plano com massiva sobreposicao. |
| **Correcao** | Consolidar em 3 documentos: (a) Plano atual, (b) Historico, (c) Roadmap futuro. |

### 2.14 Documentar limitacoes conhecidas

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivo** | `docs/` |
| **Descricao** | Nao existe documentacao de limitacoes conhecidas: race condition no cache, projetos sem git, monorepos parciais, etc. |
| **Correcao** | Criar `docs/KNOWN_LIMITATIONS.md` listando todas as limitacoes e workarounds. |

---

## P2 — Performance (≤ 90 dias)

### 2.15 Cache intermediario no collectContext

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Arquivo** | `src/context-collector.ts` |
| **Descricao** | `collectContext()` executa todas as etapas (fingerprint, risk-map, rules, briefing, enrichment) toda vez que e chamado. Em sequencias de comandos (`nexus status && nexus briefing`), o trabalho e duplicado. |
| **Correcao** | Adicionar cache em memoria (Map<hash, snapshot>) com TTL de 60s. Ou usar o briefing-cache como intermediario. |

### 2.16 Lazy loading de modulos pesados

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivo** | `src/context-collector.ts` |
| **Descricao** | Todas as importacoes sao estaticas no topo do arquivo. `pattern-detector.ts`, `session-feedback.ts`, `analyser.ts` sao carregados mesmo quando nao necessarios. |
| **Correcao** | Usar dynamic imports (`await import()`) para modulos que so sao necessarios em branches especificos. |

### 2.17 Benchmark suite automatizada CI

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Arquivos** | `.github/workflows/ci.yml`, `src/__tests__/benchmarks.bench.ts` |
| **Descricao** | O benchmark existe mas nao roda no CI. Regressoes de performance passam despercebidas. |
| **Correcao** | Adicionar step `pnpm bench` ao CI com threshold de regressao (ex: +20% tempo = fail). |

---

## P3 — Baixa Prioridade (sem SLA)

| # | Item | Severidade | Descricao |
|---|---|---|---|
| 3.1 | Migrar console.log para logger centralizado | Baixo | 90+ chamadas console.log diretas nos commands em vez de logger |
| 3.2 | Dashboard web para scores historicos | Baixo | Visualizacao web dos dados de benchmark/feedback |
| 3.3 | Suportar monorepos com workspaces | Medio | pnpm/yarn workspaces, deteccao automatica |
| 3.4 | Integrar com GitHub API | Baixo | Churn real baseado em PR reviews, issues abertas |
| 3.5 | Plugin system para skills customizadas | Baixo | Allow third-party plugins via hook system |
| 3.6 | nexus dashboard --live | Baixo | Watch mode com atualizacao periodica |
| 3.7 | Publicar npm package | Alto | Definir scope, registry, permissoes |
| 3.8 | Suportar projectos sem Git | Medio | Fallback para metricas estaticas apenas |
| 3.9 | Shell completion (bash/zsh/fish) | Baixo | Auto-complete para comandos e opcoes |
| 3.10 | nexus --quiet / --no-color | Baixo | Modo scriptavel para CI/CD |
| 3.11 | nexus init --dry-run | Baixo | Preview do que seria criado sem criar |
| 3.12 | nexus upgrade --dry-run | Baixo | Preview do que seria instalado sem instalar |
| 3.13 | nexus audit --fix | Medio | Auto-fix para problemas de governance detectados |
| 3.14 | Changelog automatico | Baixo | Gerar CHANGELOG.md a partir de commit messages |
| 3.15 | Version bumping automatizado | Baixo | Semver automatico baseado em conventional commits |
| 3.16 | Metrics export (Prometheus/OpenTelemetry) | Baixo | Exportar metricas de uso para observabilidade |
| 3.17 | Structured logging | Baixo | JSON logs em vez de console.log para parsing |
| 3.18 | Plugin versioning e dependency resolution | Baixo | Versao minima de plugins, dependencias entre plugins |
| 3.19 | nexus detect --approve/--reject | Medio | Aprovar ou rejeitar regras candidatas do pattern-detector |
| 3.20 | nexus feedback --outcome failure auto-link | Baixo | Ao reportar falha, sugerir areas baseado no pattern-detector |
| 3.21 | Briefing --profile no briefingToMarkdown | Baixo | Gerar markdown com profundidade adaptativa |
| 3.22 | HealthBar compartilhado | Baixo | dashboard.ts duplica healthBar de formatting.ts — importar |
| 3.23 | Colorblind-friendly mode | Baixo | Usar icons/texto em vez de apenas cores |
| 3.24 | Event history query API | Baixo | Consultar historico de eventos do event-bus |
| 3.25 | nexus bench --save / --load | Baixo | Salvar/carregar benchmarks para comparacao offline |
| 3.26 | nexus status --fix | Baixo | Auto-fix para problemas de governance (como doctor) |
| 3.27 | Briefing cache com TTL configuravel | Baixo | Permitir configurar tempo de vida do cache |
| 3.28 | Briefing --watch | Baixo | Regenerar briefing automaticamente a cada N segundos |
| 3.29 | Session-tracker com append-only (remover overwrite) | Medio | session-tracker usa read-all-write-all — migrar para append-only como session-feedback |
| 3.30 | Validacao de schema com zod/io-ts | Baixo | Validar todos os tipos de record lidos de disco |
| 3.31 | nexus detect --format markdown | Baixo | Saida markdown para detect (atualmente so text/json) |
| 3.32 | Briefing cache com compressao | Baixo | Comprimir cache JSON para reduzir tamanho em disco |
| 3.33 | Feedback com campo `briefingProfile` | Baixo | Registrar qual profile (minimal/standard/full) foi usado |
| 3.34 | nexus dashboard --export csv | Baixo | Exportar dados do dashboard em CSV |
| 3.35 | Plugin sandboxing | Baixo | Isolar plugins em workers para seguranca |
| 3.36 | Decidir nome do produto | Baixo | Nexus Gaude, Prism, Codex, ou outro — decisao estrategica pendente |
| 3.37 | Refinamento do logo | Baixo | Vetorizacao, variações, assets finais — logo atual e AI-generated com watermark |

---

## P1 — Produto & Go-to-Market (≤ 30 dias)

### G1 Landing page

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Site one-page com proposta de valor, demonstracao visual, CTA para waitlist. Deve comunicar: (1) O problema (context loss entre sessoes), (2) A solucao (briefing dinamico), (3) O resultado (60-80% menos tokens). |
| **Correcao** | Criar `docs/landing/` com copy, wireframe e assets. Ferramenta: Astro, Next.js, ou HTML statico. |

### G2 Waitlist / early access

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Formulario de captura de emails para early access. Validar demanda antes de investir em monetizacao. |
| **Correcao** | Integrar com Resend, Loops, ou Buttondown. Meta: 100 emails antes de lancar. |

### G3 Definicao de personas

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Quem e o usuario? (1) Tech Lead que quer governance, (2) Dev Solo que quer produtividade, (3) AI Engineer que quer context para agentes. Cada persona tem dor diferente. |
| **Correcao** | Criar `docs/personas.md` com 3 personas detalhadas: nome, dor, fluxo, tom de voz, objecoes. |

### G4 Analise competitiva

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Mapear Credo AI, Modulos, Govern365, Packmind. Como nos diferenciar? Resposta: context engineering para AI coding — ninguem faz isso. |
| **Correcao** | Criar `docs/competitive-analysis.md` com matriz de features, precos, posicionamento. |

### G5 Pricing model concreto

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Definir tiers: Free (CLI basico), Starter ($29/mo), Team ($99/mo), Enterprise (custom). Cada tier com features claras. |
| **Correcao** | Criar `docs/pricing.md` com tabela de features por tier, justificativa de precos, comparacao com concorrentes. |

### G6 Case studies

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | 3 casos de uso reais com metricas antes/depois. Ex: "Reduzi 70% do tempo de onboarding de um dev junior com Nexus." |
| **Correcao** | Criar `docs/case-studies/` com 3 estudos: web-app, API, monorepo. |

### G7 Product Hunt launch

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Preparar materiais para Product Hunt: tagline, screenshots, maker comment, first comment. |
| **Correcao** | Criar `docs/launch/product-hunt.md` com copy e assets. |

---

## P1 — Monetizacao & Licenciamento (≤ 30 dias)

### M1 Sistema de license key

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Chave de ativação por projeto. Formato: `NXS-XXXX-XXXX-XXXX`. Validacao offline com grace period. |
| **Correcao** | Criar `src/license.ts` com: generate(), validate(), deactivate(). Usar SHA-256 para assinatura. |

### M2 Tier enforcement

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Limitar features por tier. Free: init, status, detect. Starter: todos. Team: + dashboard, bench. Enterprise: + SSO, compliance. |
| **Correcao** | Criar `src/tier-gate.ts`. Modificar `bin/nexus.ts` para verificar tier antes de executar comandos restritos. |

### M3 Usage tracking

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Rastrear comandos executos para billing. Metricas: comandos/mes, briefings gerados, feedback records. |
| **Correcao** | Extender `session-tracker.ts` para gravar `usage.jsonl` com timestamps e tipo de comando. |

### M4 Trial mechanism

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | 14 dias de tier superior automaticamente apos `nexus init`. Depois, downgrade para free. |
| **Correcao** | Adicionar campo `trialEndsAt` no `nexus-system/config.json`. Verificar antes de comandos restritos. |

### M5 Payment integration

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Stripe ou Paddle para cobranca recorrente. Webhook para atualizar license. |
| **Correcao** | Criar `src/commands/subscribe.ts` que abre checkout URL. Webhook em `src/webhooks/` para confirmar pagamento. |

### M6 License server

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | API central para validar licenses, verificar tier, registrar uso. |
| **Correcao** | Criar `server/` com Express/Fastify. Endpoints: POST /validate, POST /usage, GET /status. |

### M7 Offline license

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Modo offline com grace period de 30 dias. After that, features bloqueadas. |
| **Correcao** | Cache de license local com TTL. Verificacao periodica quando online. |

---

## P2 — Enterprise (≤ 90 dias)

### E1 SSO/SAML

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Autenticacao empresarial via SAML 2.0 ou OIDC. Integrar com Okta, Azure AD, Google Workspace. |
| **Correcao** | Adicionar `nexus auth --sso` que redireciona para IdP. Callback salva token localmente. |

### E2 Compliance exports

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Relatorios para SOC 2, ISO 42001, EU AI Act. Exportar historico de decisoes, feedback, mudancas. |
| **Correcao** | Criar `nexus compliance --framework soc2` que gera relatorio PDF/JSON com evidencias. |

### E3 Audit trail

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Log imutavel de todas as operacoes: quem fez, quando, o que mudou. |
| **Correcao** | Extender event-bus para gravar `audit.jsonl` com hash encadeado (cada entry referencia a anterior). |

### E4 Role-based access

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Admin (tudo), Operator (executa), Viewer (leitura). Por projeto. |
| **Correcao** | Criar `nexus acl --add user@company.com operator`. Verificar permissao antes de cada operacao. |

### E5 Private deployment

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Self-hosted sem dependencia de npm registry. Bundle unico com binaries. |
| **Correcao** | Usar `pkg` ou `sea` (Node.js single executable) para gerar binarios. Distribuir via GitHub Releases privado. |

---

## P1 — AI Agent Integration (≤ 30 dias)

### A1 MCP server

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Servidor MCP (Model Context Protocol) para agentes IA consumirem contexto do Nexus. Ferramentas: getBriefing, getRiskMap, getRules. |
| **Correcao** | Criar `src/mcp-server.ts` com ferramentas MCP. Publicar como `@nexus/mcp`. |

### A2 OpenCode plugin

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | Hook automatico antes de cada tarefa no OpenCode. Injeta briefing no contexto do agente. |
| **Correcao** | Criar plugin OpenCode que chama `nexus briefing --summary` antes de cada tarefa e injeta no system prompt. |

### A3 Cursor integration

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Extensao para Cursor IDE que mostra briefing no sidebar. |
| **Correcao** | Criar extensao VS Code (Cursor e compativel) que le `.nexus/BRIEFING.md` e exibe em panel. |

### A4 Git hooks

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Pre-commit: auto-briefing. Pre-push: validation. Post-commit: feedback automatico. |
| **Correcao** | Criar `nexus hooks --install` que configura git hooks via `core.hooksPath`. |

### A5 Webhook de sessao

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | POST briefing result para API externa (Slack, Discord, webhook custom). |
| **Correcao** | Adicionar `--webhook <url>` ao `nexus briefing`. Enviar JSON via POST apos gerar. |

### A6 Context injection API

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Endpoint REST para briefing sob demanda. Agentes podem chamar HTTP em vez de CLI. |
| **Correcao** | Adicionar `nexus serve` que inicia servidor HTTP com endpoints: GET /briefing, GET /risk-map, GET /rules. |

---

## P2 — Developer Experience (≤ 90 dias)

### D1 Interactive tutorial

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | `nexus tutorial` — guided tour interativo que mostra cada comando com exemplos reais. |
| **Correcao** | Criar `src/commands/tutorial.ts` com 7 passos: init, status, detect, briefing, feedback, run, evolve. |

### D2 Example projects

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | 3 templates: web-app (Next.js), API (Express), library (TypeScript). Cada um com governance pre-configurada. |
| **Correcao** | Criar `examples/` com 3 diretorios. `nexus init --template web-app` para usar. |

### D3 Migration guide

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Como migrar de outros tools (ESLint, Prettier, SonarQube) para Nexus. |
| **Correcao** | Criar `docs/migration.md` com tabelas de equivalencia. |

### D4 API documentation

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Referencia completa das funcoes internas para quem quer usar como biblioteca. |
| **Correcao** | Gerar docs via TypeDoc. Publicar em `docs/api/`. |

### D5 SDK/library mode

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Uso como biblioteca Node.js, nao CLI. `import { generateBriefing } from 'nexus-system'`. |
| **Correcao** | Separar core de CLI. Criar `nexus-system/core` export. |

### D6 Video walkthrough

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | 5min demo no YouTube mostrando o fluxo completo: init → briefing → feedback. |
| **Correcao** | Gravar screencast. Ferramenta: OBS + terminal grande. |

---

## P2 — Data & Analytics (≤ 90 dias)

### DA1 Usage analytics

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Quais comandos sao mais usados, horarios de pico, taxa de sucesso por comando. |
| **Correcao** | Dashboard `nexus analytics` que le `usage.jsonl` e gera graficos. |

### DA2 Error tracking

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Relatorio automatico de erros: tipo, frequencia, contexto. |
| **Correcao** | Criar `src/error-tracker.ts` que captura erros nao tratados e grava em `errors.jsonl`. |

### DA3 User behavior analysis

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Fluxo tipico de uso: quais comandos sao executados em sequencia. |
| **Correcao** | Analisar `session-tracker` para detectar padroes de uso. |

### DA4 A/B testing framework

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | Testar variacoes de briefing: formato, profundidade, ordem de secoes. |
| **Correcao** | Criar `src/experiments.ts` com variante A/B e metricas de aceitacao. |

---

## P2 — Security Hardening (≤ 90 dias)

### S1 Penetration testing

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Teste de seguranca no CLI: injection via inputs, path traversal, command injection. |
| **Correcao** | Contratar pentest ou usar ferramentas (Snyk, npm audit). |

### S2 Dependency auditing

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Alto |
| **Owner** | unassigned |
| **Descricao** | `npm audit` automatico no CI. Bloquear builds com vulnerabilidades criticas. |
| **Correcao** | Adicionar step `pnpm audit --audit-level=high` ao CI. |

### S3 Secret scanning

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Medio |
| **Owner** | unassigned |
| **Descricao** | Detectar keys/tokens no output do CLI. Evitar vazar informacoes sensiveis. |
| **Correcao** | Usar `gitleaks` ou `trufflehog` no CI. Adicionar regex para detectar API keys no output. |

### S4 Supply chain security

| Campo | Valor |
|---|---|
| **Status** | Backlog |
| **Severidade** | Baixo |
| **Owner** | unassigned |
| **Descricao** | SLSA compliance, provenance, SBOM. |
| **Correcao** | Gerar SBOM via `syft`. Assinar commits com Sigstore. |

---

## P3 — Internationalization (sem SLA)

| # | Item | Severidade | Descricao |
|---|---|---|---|
| I1 | Multi-language support | Baixo | pt-BR, en, es — mensagens de erro e output |
| I2 | Locale detection | Baixo | Detectar idioma do sistema automaticamente |
| I3 | Translation management | Baixo | i18n framework (i18next ou similar) |

---

## Metricas de Qualidade (snapshot 2026-06-30)

```
Projeto:       nexus-cli v0.1.0
TypeScript:    strict: true, 0 erros
Testes:        532/532 passando (36 arquivos)
Coverage:      ~51% (linhas) | ~82% (funcoes) | ~76% (branches)
ESLint:        0 erros, 0 warnings
Dependencias:  6 deps + 10 devDeps (lean)
CI/CD:         ci.yml (Node 18/20/22 + coverage gate)
Commands:      18 (init, status, audit, assess, detect, run, evolve,
               report, doctor, upgrade, validate, sync, clean, digest,
               briefing, feedback, bench, dashboard)
Context Pipeline: collectContext → cache → briefing → feedback → dashboard
```

---

## Resumo por Prioridade

| Prioridade | Itens | Tema Principal |
|---|---|---|
| **Done** | 36 | Bugs, integracao, qualidade, pipeline |
| **P0** (≤ 7d) | 0 | Todos concluidos |
| **P1** (≤ 30d) | 14 | Testes, produto, monetizacao, AI agents |
| **P2** (≤ 90d) | 32 | Features, enterprise, docs, performance, security |
| **P3** (sem SLA) | 37 | Nice-to-have, ecosystem, observability, i18n, nome/logo |
| **Total** | **119** | |
