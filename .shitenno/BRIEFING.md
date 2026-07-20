# Pre-Session Briefing
*Generated: 2026-07-20T03:00:36.251Z*

---

## QUICK BOARD — Estado do Projecto

> **Apresentar este quadro ao utilizador antes da primeira resposta operacional.**
> Veja regra #13 em `docs/AGENTS.md` (QUICK BOARD DE AVISO).

| Campo | Estado |
|---|---|
| **Tarefa em curso** | Nenhuma |
| **Próximo P0** | Definir novo P0 no BACKLOG.md |
| **Dívidas P1** | Nenhuma |
| **Impedimentos** | Nenhum |
| **Estado última sessão** | Desconhecido |

---

## Actividade Recente (24h)

| Evento | Detalhe | Hora |
|--------|---------|------|
| backlog.updated | retroactive_scan: 1 passos | 02:37 |
| plan.format_warning | Formato inválido: PLAN-2026-07-19-BLOCO-L-reforco-gate | 02:37 |
| backlog.updated | retroactive_scan: 2 passos | 02:07 |
| plan.format_warning | Formato inválido: PLAN-2026-07-19-BLOCO-L-reforco-gate | 02:07 |

**Resumo:** 2 sincronizações, 2 erros

## Project Identity
- **Domain:** monorepo
- **Scale:** medium
- **Stack:** typescript, node, react
- **Maturity:** 73/100

## Risk Status
- **Overall:** critical
- **Critical:** src, apps

## Test Coverage
- **Has Tests:** Yes
- **Areas Without Tests:** 5

## Context Rules (Top)
- Area "src" has 6 file(s) without tests. Prioritize test coverage here.
- Area "src" contains sensitive keywords (auth, payment, security). Apply extra security review.
- Area "apps" has 8 file(s) without tests. Prioritize test coverage here.
- Area "apps" contains sensitive keywords (auth, payment, security). Apply extra security review.
- This is a monorepo. When modifying shared packages, ensure backward compatibility.

## Dynamic Rules (From History)
- [high] This project has 128 force push(es) in the last 180 days. Avoid "git push --force" — use --force-with-lease instead.
- [medium] This project has 6 hotfix(es) in the last 180 days. Consider adding more pre-merge validation.

## Recommended Next Steps
1. Address critical risk areas: src, apps
1. Improve test coverage in 5 area(s)

## Token Economy
- **Estimated tokens saved:** ~11.600
- **Context rules:** 7
- **Dynamic rules:** 2
- **Cache hit:** No