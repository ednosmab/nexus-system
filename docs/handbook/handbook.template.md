# 📚 Nexus Handbook

> Manual de referência do Nexus System — do básico à arquitetura interna.

<!-- PHILOSOPHY -->
<!-- Redefina o tom e ângulo deste handbook. Pergunte-se: quem é o leitor ideal? O que ele precisa saber para começar a usar Nexus hoje? -->
<!-- /PHILOSOPHY -->

---

## Como usar este handbook

O handbook é organizado em **3 níveis de abstração**, do mais simples ao mais técnico:

| Nível | Para quem | Conteúdo |
|---|---|---|
| **[1. Fundamentos](01-fundamentals/)** | Developers iniciantes, PMs, qualquer pessoa | O que é Nexus, instalação, primeiros passos, conceitos |
| **[2. Comandos](02-commands/)** | Developers, tech leads | Referência completa dos comandos CLI |
| **[3. Arquitetura](03-architecture/)** | Tech leads, architects, contribuidores | Event system, rule engine, MCP, custom rules |

---

## Nível 1 — Fundamentos

<!-- PHILOSOPHY -->
<!-- Por que alguém deveria usar Nexus? Qual é a dor que ele resolve? Escreva como se estivesse explicando para um colega que nunca ouviu falar. -->
<!-- /PHILOSOPHY -->

Comece aqui se você é novo no Nexus.

| Arquivo | Conteúdo |
|---|---|
| [O que é Nexus](01-fundamentals/what-is-nexus.md) | Definição, problema que resolve, para quem serve |
| [Instalação](01-fundamentals/installation.md) | Pré-requisitos, métodos de instalação, verificação |
| [Primeiros Passos](01-fundamentals/quick-start.md) | Init, status, detect, briefing, feedback |
| [Conceitos](01-fundamentals/concepts.md) | Maturity, capabilities, governance, knowledge debt |

---

## Nível 2 — Comandos

Referência completa de todos os comandos, organizados por categoria.

<!-- SEMANTIC:help-data -->
| Arquivo | Categoria |
|---|---|
| [Setup & Config](02-commands/setup.md) | init, mcp, upgrade, clean |
| [Status & Análise](02-commands/analysis.md) | status, audit, doctor, assess, detect |
| [Pipeline & Execução](02-commands/pipeline.md) | run, evolve, act, plan |
| [Governança](02-commands/governance.md) | goal, decide, policy |
| [Relatórios](02-commands/reports.md) | console, report, digest, bench |
| [Integração AI](02-commands/ai-integration.md) | briefing, feedback, profile, dashboard, reminders |
| [Sistema](02-commands/system.md) | validate, shell-init, handbook |
| [Documentação](02-commands/documentation.md) | docs-audit |
<!-- /SEMANTIC -->

---

## Nível 3 — Arquitetura

<!-- PHILOSOPHY -->
<!-- Qual é a visão arquitetural? Por que estas decisões foram tomadas? O que torna Nexus diferente de outras ferramentas de governança? -->
<!-- /PHILOSOPHY -->

Para quem quer entender como Nexus funciona por dentro ou contribuir.

| Arquivo | Conteúdo |
|---|---|
| [Sistema de Eventos](03-architecture/event-system.md) | Event bus, tipos de eventos, subscribe/publish |
| [Rule Engine](03-architecture/rule-engine.md) | Regras reativas, triggers, como criar regras |
| [MCP Server](03-architecture/mcp-server.md) | Protocolo MCP, configuração, uso com AI agents |
| [Regras Customizadas](03-architecture/custom-rules.md) | Como criar regras próprias |
| [Contribuindo](03-architecture/contributing.md) | Guia para contribuidores |

---

## Acesso rápido via CLI

```bash
nexus handbook              # Abre este handbook no terminal
nexus handbook --level 1    # Apenas fundamentos
nexus handbook --level 2    # Apenas comandos
nexus handbook --level 3    # Apenas arquitetura
nexus handbook --list       # Lista todos os tópicos disponíveis
```

---

## Estatísticas

<!-- SEMANTIC:count src/commands/*.ts -->
- **34 comandos** documentados
<!-- /SEMANTIC -->

<!-- SEMANTIC:validate src/help-data.ts:8 categories -->
- **8 categorias** de comandos
<!-- /SEMANTIC -->

<!-- SEMANTIC:validate src/capability-mapping.ts:9 capabilities -->
- **9 capabilities** modulares
<!-- /SEMANTIC -->

<!-- SEMANTIC:validate src/maturity-profile.ts:7 dimensions -->
- **7 dimensões** de maturidade
<!-- /SEMANTIC -->

- **6 princípios** imutáveis

---

*Última atualização: Julho 2026*
