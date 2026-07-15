**Status:** Pending
**Updated_at:** 2026-07-15T06:27:34.339Z
**Date:** 2026-07-15

# Plano: Monolith Refactor + Architectural Prevention

**Branch:** `feat/monolith-refactor`
**Data:** 2026-07-15
**Prioridade:** P1 (SA11 — SOLID violado, 10 ficheiros >500 linhas)

---

## Contexto

O projecto tem um sistema de audit pós-hoc excelente (90+ detectores via `shiten audit`) mas **zero enforcement preventivo** no commit para tamanho de ficheiros/funções. Resultado: monólitos entram no `main` e só são detectados depois.

Ficheiros violadores detectados:
- `src/commands/plan.ts` — 945 linhas (15 sub-comandos)
- `shitenno-go/scripts/sync-docs.ts` — 655 linhas (10 checks)
- `src/audit/optimization-proposer.ts` — 630 linhas (1 função)
- `src/commands/upgrade.ts` — 501 linhas (3 responsabilidades)

Skills existentes que deveriam impedir isto:
- `clean_code_standards.md` (DRY, KISS)
- `senior-engineer.md` (pegada mínima)
- `system-first.md` (usar comandos `shiten`)
- `AGENTS.md` regra #4 (refactor imediato)

---

## Thresholds

| Limite | Valor | Regra ESLint | Excepções |
|--------|-------|--------------|-----------|
| Ficheiro | 300 linhas | max-lines-per-file | __tests__/, src/templates/ |
| Função | 50 linhas | max-lines-per-function | — |
| Profundidade | 4 níveis | max-depth | — |
| Parâmetros | 4 por função | max-params | — |
| Complexidade | 15 | complexity | — |

---

## Ficheiros afectados

| # | Ficheiro | Tipo |
|---|---|---|
| 1 | `shitenno-go/docs/adrs/ADR-007-file-size-limits.md` | NOVO |
| 2 | `eslint.config.js` | EDITAR |
| 3 | `.husky/pre-commit` | EDITAR |
| 4 | `scripts/validate-architecture.ts` | NOVO |
| 5 | `package.json` | EDITAR |
| 6 | `shitenno-go/docs/FORBIDDEN_OPERATIONS.md` | EDITAR |
| 7 | `shitenno-go/docs/DESDO.md` | EDITAR |
| 8 | `shitenno-go/docs/skills/clean_code_standards.md` | EDITAR |
| 9 | `shitenno-go/scripts/sync-docs.ts` | REFACTOR |
| 10 | `shitenno-go/scripts/validators/*.ts` | NOVOS (10 ficheiros) |
| 11 | `src/commands/plan.ts` | REFACTOR |
| 12 | `src/commands/plan/*.ts` | NOVOS (15 ficheiros) |
| 13 | `src/audit/optimization-proposer.ts` | REFACTOR |
| 14 | `src/commands/upgrade.ts` | REFACTOR |
| 15 | `src/commands/upgrade/*.ts` | NOVOS (3 ficheiros) |
| 16 | `.github/workflows/ci.yml` | EDITAR |

---

## Steps

### Step 1: Criar ADR-007

- **Ficheiro:** `shitenno-go/docs/adrs/ADR-007-file-size-limits.md`
- **Acção:** Criar ADR com decisão de limites de tamanho
- **Verificação:** `cat shitenno-go/docs/adrs/ADR-007-file-size-limits.md`

### Step 2: Actualizar ESLint config

- **Ficheiro:** `eslint.config.js`
- **Acção:** Adicionar 5 regras novas (max-lines-per-file: 300, max-lines-per-function: 50, max-depth: 4, max-params: 4, complexity: 15)
- **Acção:** Adicionar `shitenno-go/` ao ignores
- **Verificação:** `pnpm run lint` — espera-se erros nos ficheiros existentes >300

### Step 3: Actualizar pre-commit hook

- **Ficheiro:** `.husky/pre-commit`
- **Acção:** Adicionar gate de tamanho de ficheiro (bash check com wc -l)
- **Verificação:** Criar ficheiro dummy >300 linhas, tentar commit, esperar bloqueio

### Step 4: Criar validate:architecture

- **Ficheiro:** `scripts/validate-architecture.ts` (~120 linhas)
- **Acção:** Script que verifica ficheiros >300, funções >50, circular imports
- **Acção:** Adicionar `"validate:architecture": "tsx scripts/validate-architecture.ts"` ao package.json
- **Verificação:** `pnpm run validate:architecture` — lista violações

### Step 5: Actualizar FORBIDDEN_OPERATIONS.md

- **Ficheiro:** `shitenno-go/docs/FORBIDDEN_OPERATIONS.md`
- **Acção:** Adicionar regra F-06 (nenhum ficheiro >300 linhas em src/)
- **Verificação:** `grep "F-06" shitenno-go/docs/FORBIDDEN_OPERATIONS.md`

### Step 6: Actualizar DESDO.md

- **Ficheiro:** `shitenno-go/docs/DESDO.md`
- **Acção:** Adicionar secção "1.1 Limites de Tamanho" com tabela de thresholds
- **Verificação:** `grep "300 linhas" shitenno-go/docs/DESDO.md`

### Step 7: Actualizar clean_code_standards.md

- **Ficheiro:** `shitenno-go/docs/skills/clean_code_standards.md`
- **Acção:** Adicionar secção "5. Limites de Tamanho" com tabela de thresholds
- **Verificação:** `grep "300 linhas" shitenno-go/docs/skills/clean_code_standards.md`

### Step 8: Refactor sync-docs.ts

- **Ficheiro:** `shitenno-go/scripts/sync-docs.ts`
- **Acção:** Extrair 10 validators para `shitenno-go/scripts/validators/`
- **Estrutura nova:** sync-docs.ts (~50 linhas) + validators/*.ts (10 módulos)
- **Verificação:**
  - `pnpm run sync:docs` — output idêntico
  - `pnpm run lint` — 0 erros
  - `wc -l shitenno-go/scripts/sync-docs.ts` — ≤50

### Step 9: Refactor plan.ts

- **Ficheiro:** `src/commands/plan.ts`
- **Acção:** Extrair 15 sub-comandos para `src/commands/plan/`
- **Estrutura nova:** plan.ts (~80 linhas router) + plan/*.ts (15 módulos)
- **Verificação:**
  - `shiten plan md list` — funciona
  - `shiten plan create "test"` — funciona
  - `pnpm run lint` — 0 erros
  - `wc -l src/commands/plan.ts` — ≤80

### Step 10: Refactor optimization-proposer.ts

- **Ficheiro:** `src/audit/optimization-proposer.ts`
- **Acção:** Decompor função monolítica em 5-6 funções menores
- **Verificação:**
  - `shiten audit --json` — output não muda
  - `pnpm run lint` — 0 erros
  - `grep -c "function" src/audit/optimization-proposer.ts` — ≥5

### Step 11: Refactor upgrade.ts

- **Ficheiro:** `src/commands/upgrade.ts`
- **Acção:** Separar em 3 responsabilidades (template + capability + system map)
- **Estrutura nova:** upgrade.ts (~80 linhas router) + upgrade/*.ts (3 módulos)
- **Verificação:**
  - `shiten upgrade --list` — funciona
  - `pnpm run lint` — 0 erros
  - `wc -l src/commands/upgrade.ts` — ≤80

### Step 12: Adicionar step ao CI

- **Ficheiro:** `.github/workflows/ci.yml`
- **Acção:** Adicionar step `Architecture validation` antes de test
- **Verificação:** Push para branch, CI passa

### Step 13: Validação final

- **Comandos:**
  - `pnpm run lint` — 0 erros
  - `pnpm run typecheck` — 0 erros
  - `pnpm run test` — todos passam
  - `pnpm run validate:architecture` — 0 violações
  - `pnpm run sync:docs` — warnings apenas
  - `pnpm run validate:session` — passa

### Step 14: Commit e push

- **Mensagem:** `refactor: enforce file size limits + split monolithic scripts`
- **Branch:** `feat/monolith-refactor`

---

## Dependências

```
1  (ADR-007)              ← sem dependências
2  (ESLint config)        ← depende de 1
3  (pre-commit hook)      ← depende de 2
4  (validate:arch)        ← depende de 2
5  (FORBIDDEN_OP F-06)    ← depende de 1
6  (DESDO.md)             ← depende de 1
7  (clean_code skill)     ← depende de 1
8  (sync-docs refactor)   ← depende de 2,3
9  (plan.ts refactor)     ← depende de 2,3
10 (optimization refactor)← depende de 2,3
11 (upgrade refactor)     ← depende de 2,3
12 (CI step)              ← depende de 4
13 (validação final)      ← depende de 8-12
14 (commit)               ← depende de 13
```

**Execução paralela:** 5, 6, 7 após 1. 8, 9, 10, 11 após 2-3.

---

## Riscos

| Risco | Mitigação |
|---|---|
| ESLint max-lines-per-file: 300 quebra ficheiros existentes | Refactoring primeiro (steps 8-11) |
| plan.ts refactor quebra sub-comandos | Testar cada sub-comando individualmente |
| Pre-commit hook muito lento | Bash check é <1s (wc -l é rápido) |

---

## Checklist de Conclusão

- [ ] ADR-007 criado e aceite
- [ ] ESLint config actualizado (5 regras novas)
- [ ] pre-commit hook actualizado (file size gate)
- [ ] validate:architecture criado e registado em package.json
- [ ] FORBIDDEN_OPERATIONS.md actualizado (F-06)
- [ ] DESDO.md actualizado (limites de tamanho)
- [ ] clean_code_standards.md actualizado (limites de tamanho)
- [ ] sync-docs.ts refactored (655 → ~50 linhas)
- [ ] 10 validators criados em validators/
- [ ] plan.ts refactored (945 → ~80 linhas)
- [ ] 15 sub-comandos criados em plan/
- [ ] optimization-proposer.ts refactored (630 → decomposta)
- [ ] upgrade.ts refactored (501 → ~80 linhas)
- [ ] 3 módulos criados em upgrade/
- [ ] CI workflow actualizado (architecture validation step)
- [ ] pnpm run lint — 0 erros
- [ ] pnpm run typecheck — 0 erros
- [ ] pnpm run test — todos passam
- [ ] pnpm run validate:architecture — 0 violações
- [ ] pnpm run sync:docs — warnings apenas
- [ ] pnpm run validate:session — passa
- [ ] Nenhum ficheiro em src/ >300 linhas (excluindo __tests__, templates)
- [ ] Commit feito com mensagem correcta
- [ ] Push para feat/monolith-refactor
