# Plan — Reorganizar Suite de Testes

**Status:** Pending
**Updated_at:** 2026-07-24T13:40:59.167Z
**Date:** 2026-07-22
**Priority:** P1
**Owner:** AI Agent
**Estimated Time:** 4h

## Contexto

O detector de padrões (`pattern-detector.ts`) identificou `src/__tests__` como a área de maior complexidade do projeto (score 8.8/10, severidade 4/5) nos últimos 10 relatórios consecutivos. A investigação revelou que o score é causado por problemas de **organização**, não de qualidade:

- **6 arquivos monolíticos** com mais de 500 linhas (o maior tem 1.409 linhas)
- **42.7% dos arquivos** passam de 200 linhas
- **Testes de integração/e2e misturados** com unitários no mesmo diretório plano
- **341 operações de filesystem** em um único arquivo de teste
- **64 arquivos órfãos** sem arquivo fonte correspondente em `src/`
- **147 arquivos** em um único diretório sem subdiretórios

O score alto infla métricas de churn, contagem de arquivos e violações no `area-scorer.ts`, fazendo o detector de padrões propor regras de processo (RULE-001) que não resolvem a causa raiz.

## Objetivo

Reorganizar `src/__tests__/` em uma estrutura hierárquica por tipo de teste, dividir arquivos monolíticos, e reduzir o score de complexidade para ≤ 6.0 em 30 dias.

### Critérios de aceitação

1. Nenhum arquivo de teste exceda 300 linhas
2. Diretório `src/__tests__/` tenha subdiretórios `unit/`, `integration/`, `e2e/`
3. Score de `src/__tests__` no pattern detector caia para ≤ 6.0 após 3 relatórios consecutivos
4. Todos os testes continuem passando (`pnpm run test`)

## Passos de Implementação

### Fase 1: Criar estrutura de diretórios

**Ficheiro:** `src/__tests__/`
**Ação:** Criar subdiretórios
```
src/__tests__/
├── unit/          # Testes unitários puros (< 200 linhas, sem fs/exec)
├── integration/   # Testes com fs, process, ou multi-módulo
├── e2e/           # CLI spawning, workflows completos
├── benchmarks/    # Arquivos .bench.ts
├── fixtures/      # Dados compartilhados de teste
└── __mocks__/     # Mock factories reutilizáveis
```
**Verificação:** `ls -la src/__tests__/` mostra os novos subdiretórios

### Fase 2: Mover benchmarks

**Ficheiro:** `src/__tests__/benchmarks.bench.ts`, `cross-process-bench.ts`, `bench.test.ts`
**Ação:** Mover para `src/__tests__/benchmarks/`
**Verificação:** `pnpm run test` passa

### Fase 3: Mover testes e2e

**Ficheiros:**
- `cli-integration.test.ts` (886 linhas) → `integration/cli-integration.test.ts`
- `plan-lifecycle-gate-e2e.test.ts` → `e2e/plan-lifecycle-gate.test.ts`
- `verification-lock-concurrent.test.ts` → `integration/verification-lock-concurrent.test.ts`
- `heavy-bootstrap-scoping.test.ts` → `integration/heavy-bootstrap-scoping.test.ts`
- `maturity-profile.test.ts` (504 linhas) → `integration/maturity-profile.test.ts`
- `model-config.test.ts` → `integration/model-config.test.ts`
- `reactive-pipeline.test.ts` (565 linhas) → `integration/reactive-pipeline.test.ts`

**Ação:** Mover arquivos, ajustar imports se necessário
**Verificação:** `pnpm run test` passa

### Fase 4: Dividir health-auditor.test.ts (1.409 linhas)

**Ficheiro:** `src/__tests__/health-auditor.test.ts`
**Ação:** Dividir em ~12 arquivos em `unit/audit/`:

| Arquivo original | Novo arquivo | Linhas approx |
|-----------------|--------------|---------------|
| health-auditor.test.ts | `unit/audit/health-auditor.test.ts` | ~100 |
| | `unit/audit/detect-date-placeholders.test.ts` | ~80 |
| | `unit/audit/detect-empty-dirs.test.ts` | ~80 |
| | `unit/audit/detect-missing-gitignore.test.ts` | ~80 |
| | `unit/audit/detect-maturity-inconsistency.test.ts` | ~100 |
| | `unit/audit/detect-adr-coverage.test.ts` | ~100 |
| | `unit/audit/detect-broken-refs.test.ts` | ~120 |
| | `unit/audit/detect-broken-dir-refs.test.ts` | ~100 |
| | `unit/audit/detect-missing-package-json.test.ts` | ~80 |
| | `unit/audit/audit-level-filtering.test.ts` | ~120 |
| | `unit/audit/security-pattern-detectors.test.ts` | ~120 |
| | `unit/audit/write-health-report.test.ts` | ~100 |

**Verificação:** `pnpm run test -- --grep "health-auditor\|audit"` passa

### Fase 5: Dividir engineering-detectors.test.ts (983 linhas)

**Ficheiro:** `src/__tests__/engineering-detectors.test.ts`
**Ação:** Dividir em ~10 arquivos em `unit/detectors/`:

| Novo arquivo | Detector testado |
|-------------|-----------------|
| `unit/detectors/hardcoded-secrets.test.ts` | detectHardcodedSecrets |
| `unit/detectors/sql-injection.test.ts` | detectSqlInjection |
| `unit/detectors/xss-vulnerabilities.test.ts` | detectXss |
| `unit/detectors/unsafe-eval.test.ts` | detectUnsafeEval |
| `unit/detectors/weak-crypto.test.ts` | detectWeakCrypto |
| `unit/detectors/orphan-modules.test.ts` | detectOrphanModules |
| `unit/detectors/complexity-hotspots.test.ts` | detectComplexityHotspots |
| `unit/detectors/supply-chain.test.ts` | detectSupplyChain |
| `unit/detectors/governance-violations.test.ts` | detectGovernanceViolations |
| `unit/detectors/engineering-state-detectors.test.ts` | remaining detectors |

**Verificação:** `pnpm run test -- --grep "engineering-detectors\|detectors"` passa

### Fase 6: Dividir commands.test.ts (584 linhas)

**Ficheiro:** `src/__tests__/commands.test.ts`
**Ação:** Dividir por comando/feature em `unit/commands/`:

| Novo arquivo | Comando testado |
|-------------|----------------|
| `unit/commands/init.test.ts` | init |
| `unit/commands/status.test.ts` | status |
| `unit/commands/detect.test.ts` | detect |
| `unit/commands/audit.test.ts` | audit |
| `unit/commands/briefing.test.ts` | briefing |
| `unit/commands/sync.test.ts` | sync |
| `unit/commands/validate.test.ts` | validate |
| `unit/commands/feedback.test.ts` | feedback |
| `unit/commands/remaining.test.ts` | outros comandos |

**Verificação:** `pnpm run test -- --grep "commands"` passa

### Fase 7: Mover testes unitários restantes

**Ação:** Mover todos os arquivos `.test.ts` restantes de `src/__tests__/` para `src/__tests__/unit/`, mantendo a estrutura de subdiretórios por módulo quando aplicável:
- Arquivos que testam `src/commands/` → `unit/commands/`
- Arquivos que testam `src/audit/` → `unit/audit/`
- Arquivos que testam `src/domain/` → `unit/domain/`
- Arquivos que testam `src/engine/` → `unit/engine/`
- Outros → `unit/`

**Verificação:** `pnpm run test` passa, `src/__tests__/` vazio de arquivos soltos

### Fase 8: Criar fixtures e mock factories

**Ação:**
- Criar `src/__tests__/fixtures/` com dados de teste compartilhados
- Criar `src/__tests__/__mocks__/` com factory functions para mocks comuns (filesystem, event bus, daemon)
- Atualizar os 15 arquivos com mais de 10 operações de fs para usar mocks

**Verificação:** `pnpm run test` passa, redução no número de `vi.mock`/`vi.fn` repetidos

### Fase 9: Atualizar configuração de testes

**Ficheiro:** `vitest.config.ts` (se existir) ou `package.json`
**Ação:** Atualizar padrões de glob para incluir subdiretórios:
```ts
include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.bench.ts']
```
**Verificação:** `pnpm run test` descobre todos os testes nos novos subdiretórios

### Fase 10: Verificação final

**Ação:** Rodar todas as verificações
**Verificação:**
```bash
pnpm run test          # Todos passam
pnpm run lint          # 0 erros
pnpm run typecheck     # Passa
pnpm run sync:docs     # 0 erros
```

## Decisões de Design

| # | Decisão | Alternativa rejeitada | Racional |
|---|---------|----------------------|----------|
| 1 | Subdiretórios `unit/`, `integration/`, `e2e/` | Manter diretório plano | Separa por tipo de teste, reduz count por diretório |
| 2 | Dividir por módulo/função, não por fixture | Manter arquivos grandes | Cada arquivo testa uma coisa, facilita localização |
| 3 | Usar `vitest` globals (se disponível) | Criar setup customizado | Já é o padrão do projeto |
| 4 | Mover arquivos, não reescrever testes | Reescrever do zero | Menor risco, mesmo comportamento |
| 5 | Criar mock factories | Continuar com mocks inline | Reduz repetição nos 15 arquivos com >10 fs ops |

## Riscos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| 1 | Imports quebrados após mover arquivos | Alto | Rodar `pnpm run test` após cada fase |
| 2 | Testes param a passar após reorganização | Alto | Fases incrementais, commit após cada fase |
| 3 | Timeout em CI por path changes | Médio | Verificar configuração de testes |
| 4 | Merge conflicts com branches abertas | Médio | Comunicar antes de executar |
| 5 | Vitest não encontra testes em subdiretórios | Baixo | Verificar `include` no config |

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Arquivos no diretório raiz de testes | 147 | ~0 (todos em subdiretórios) |
| Maior arquivo de teste | 1.409 linhas | < 300 linhas |
| Score `src/__tests__` | 8.8/10 | ≤ 6.0/10 |
| Subdiretórios | 0 | 6 (unit, integration, e2e, benchmarks, fixtures, __mocks__) |
| Arquivos > 300 linhas | 26 | 0 |
