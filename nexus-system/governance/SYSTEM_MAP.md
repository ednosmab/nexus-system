# SYSTEM_MAP — Mapa Centralizado

> **Versão:** 2.1
> **Data:** 2026-07-02
> **Propósito:** Mapa de todos os directórios e arquivos do sistema

---

## Legenda de Capacidades

| Símbolo | Significado |
|---|---|
| ✅ | Capacidade instalada e activa |
| 📋 | Capacidade disponível (pode ser instalada via `nexus upgrade`) |
| 🔮 | Capacidade futura (não disponível ainda) |
| ➖ | Não aplicável |

**Verificar capacidades instaladas:** `nexus status` ou `nexus doctor`
**Instalar capacidade:** `nexus upgrade --capability <name>`

---

## Estrutura Geral

```
nexus-system/
├── BRIEFING.md                        ← Briefing pré-sessão
├── fingerprint.json                   ← Impressão digital do projecto
├── maturity-profile.json              ← Perfil de maturidade
├── cognition/                         ← Arquitectura mental
│   ├── context/                       ← Hierarquia de contexto
│   ├── memory/                        ← Estado operacional
│   └── prompts/                       ← Prompts por agente
├── core/                              ← Contratos tipados
│   └── complexity/                    ← Scoring de complexidade
├── docs/                              ← Documentação
│   ├── AGENTS.md                      ← Regras do time (P0)
│   ├── BACKLOG.md                     ← Fila de tarefas
│   ├── CONCEPTUAL_MODEL.md            ← Modelo conceitual
│   ├── DESDO.md                       ← Diretrizes de engenharia
│   ├── FORBIDDEN_OPERATIONS.md        ← Regras vinculantes
│   ├── KNOWLEDGE_LIFECYCLE.md         ← Ciclo de vida do conhecimento
│   ├── Nexus-System_GUIDE.md          ← Guia completo
│   ├── opencode-context.md            ← Contexto operacional
│   ├── session-template.md            ← Template de encerramento
│   ├── adrs/                          ← Architecture Decision Records
│   ├── feedback/                      ← Feedback de sessões
│   ├── history/                       ← Memória ROM (imutável)
│   ├── runbooks/                      ← Runbooks operacionais
│   ├── skills/                        ← 22 skills de engenharia
│   ├── audits/                        ← Audit logs
│   └── capabilities.md                ← Capacidades do sistema
├── feedback/                          ← Feedback do Nexus CLI
│   └── records/                       ← Registos de feedback
├── governance/                        ← Governança
│   ├── SYSTEM_MAP.md                  ← Este ficheiro
│   ├── WORKFLOW.md                    ← Fluxos de sessão
│   ├── agents/                        ← Contratos de agentes
│   ├── context/                       ← Memória RAM
│   ├── contracts/                     ← Índice de contratos
│   ├── handoffs/                      ← Protocolos de transição
│   ├── knowledge-graph/               ← Grafo de conhecimento
│   ├── policies/                      ← Políticas operacionais
│   ├── premortem/                     ← Análise de riscos
│   ├── reviews/                       ← Reviews de sessão
│   └── rules/                         ← Regras templates
├── reports/                           ← Relatórios de scoring
├── scripts/                           ← Scripts de validação
├── session-feedback/                  ← Feedback de sessões (runtime)
└── telemetry/                         ← Dados de telemetria
```

---

## Regras de Leitura

### Ordem Obrigatória

```
1. governance/WORKFLOW.md                    ← SEMPRE PRIMEIRO
2. governance/context/context_buffer.yaml   ← SEMPRE
3. docs/AGENTS.md                           ← SEMPRE (P0)
4. docs/FORBIDDEN_OPERATIONS.md             ← SEMPRE (P0)
5. docs/DESDO.md                            ← SEMPRE (P0)
6. Skill específica da camada               ← POR TAREFA
7. Plano da camada                          ← POR TAREFA
```

### Hierarquia P0-P4

| Nível | Conteúdo | Quando |
|---|---|---|
| **P0** | AGENTS.md, FORBIDDEN_OPERATIONS, DESDO | Sempre |
| **P1** | context_buffer.yaml | Sempre |
| **P2** | Planos da camada | Por tarefa |
| **P3** | Código e arquivos | Na execução |
| **P4** | docs/history/ | Sob demanda |

---

## Mapa de Scripts

| Script | Caminho | Função |
|---|---|---|
| validate-session | `scripts/validate-session.ts` | Validar integridade da sessão |
| close-session | `scripts/close-session.ts` | Encerrar sessão |
| premortem-check | `scripts/premortem-check.ts` | Análise de riscos |
| sync-docs | `scripts/sync-docs.ts` | Sincronizar documentação com estado real |

---

## Mapa de Contratos

| Contrato | Caminho | Função |
|---|---|---|
| planner | `governance/agents/AI-CONTRACT-planner-v1.yaml` | Planejamento |
| executor | `governance/agents/AI-CONTRACT-executor-v1.yaml` | Execução |
| reviewer | `governance/agents/AI-CONTRACT-reviewer-v1.yaml` | Review/auditoria |
| orchestrator | `governance/agents/AI-CONTRACT-orchestrator-v1.yaml` | Orquestração |
| CONTRACTS_INDEX | `governance/contracts/CONTRACTS_INDEX.md` | Índice |

---

## Ficheiros Raiz

| Ficheiro | Propósito |
|---|---|
| `fingerprint.json` | Impressão digital do projecto (hash, stack, maturidade) |
| `maturity-profile.json` | Perfil de maturidade por dimensão |

---

## Referências por Categoria

### Documentação Conceptual

| Ficheiro | Descrição |
|---|---|
| `docs/CONCEPTUAL_MODEL.md` | Modelo conceitual canónico do Nexus |
| `docs/KNOWLEDGE_LIFECYCLE.md` | Ciclo de vida do conhecimento (9 estágios) |
| `docs/opencode-context.md` | Contexto operacional para o agente |

### Telemetria e Feedback

| Ficheiro | Descrição |
|---|---|
| `feedback/summary.json` | Resumo de interações de recomendações |
| `feedback/records/*.json` | Registos individuais de feedback |
| `telemetry/maturity-2026-06-30.json` | Snapshot de maturidade |

### Relatórios

| Ficheiro | Descrição |
|---|---|
| `reports/complexity-*.json` | Relatórios de scoring de complexidade |
| `reports/health-*.json` | Relatórios de saúde do projecto |

---

## Referências Principais

- `governance/WORKFLOW.md` — Fluxos de sessão
- `docs/AGENTS.md` — Regras do time
- `docs/Nexus-System_GUIDE.md` — Guia completo do sistema
- `docs/CONCEPTUAL_MODEL.md` — Modelo conceitual
- `docs/KNOWLEDGE_LIFECYCLE.md` — Ciclo de vida do conhecimento
