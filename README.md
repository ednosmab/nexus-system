# Nexus System

> Um sistema que pensa sobre como você trabalha.

Nexus detecta **Knowledge Debt** — o custo invisível do conhecimento de engenharia ausente, desconectado e desatualizado — e recomenda ações para fechar esse gap.

Não é um linter. Não é CI. Não é um framework.
É um sistema de governança de conhecimento que audita a si mesmo, aprende com seu feedback e recomenda a própria evolução.

---

## O que Nexus resolve

| Sem Nexus | Com Nexus |
|-----------|-----------|
| Conhecimento documentado mas desconectado | Conhecimento grafado com relações explícitas |
| Complexidade sentida mas não medida | Complexidade pontuada com métricas estáticas + comportamentais |
| Padrões notados mas não rastreados | Padrões detectados do histórico automaticamente |
| Governança manual e inconsistente | Governança automatizada via regras |
| Agentes IA operam sem contexto | Agentes IA recebem contexto governado e hierárquico |
| Evolução ad-hoc | Evolução recomendada com base no estado |

---

## Como operar

### Inicializar

```bash
nexus init
```

Cria a estrutura de governança: `opencode.json`, `nexus-system/`, `nexus-profile/`, skills, scripts, templates.

### Verificar estado

```bash
nexus status
```

Mostra score de complexidade, saúde da governança, e sugestões acionáveis.

### Detectar padrões

```bash
nexus detect
```

Lê histórico e relatórios para identificar erros recorrentes, decisões revertidas, e áreas quentes.

### Auditar governança (metacognição)

```bash
nexus audit
```

O sistema avaliando a própria eficácia: regras mortas, hotspots de violação, docs ausentes, diretórios órfãos.

### Evoluir

```bash
nexus evolve
```

Recomendações adaptativas baseadas no perfil de maturidade do time. Cada recomendação tem dois caminhos: conforto e desafio.

### Outros comandos

| Comando | Função |
|---------|--------|
| `nexus upgrade` | Instalar capacidades de governança (L1→L2→L3) |
| `nexus validate` | Validar integridade da sessão |
| `nexus sync` | Sincronizar governança de um nexus externo |
| `nexus clean` | Limpar cache e temporários |
| `nexus assess` | Reavaliar perfil de maturidade |
| `nexus doctor` | Diagnósticos de saúde do sistema |
| `nexus run` | Executar tarefa específica |

---

## Como funciona por dentro

```
Seu projeto
    │
    ▼
┌─────────────┐    ┌──────────────┐    ┌───────────────┐
│  Scoring    │───▶│   Padrões    │───▶│  Metacognição │
│  (complexi- │    │  (histórico) │    │  (auto-avalia-│
│   dade)     │    │              │    │    ção)       │
└─────────────┘    └──────────────┘    └───────────────┘
       │                  │                    │
       ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────┐
│              Knowledge Graph                         │
│  ADRs ↔ Skills ↔ Contratos ↔ Workflows ↔ Runbooks  │
└─────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐    ┌──────────────┐
│ Auto-Evolução│───▶│  Dual-Path   │
│ (recomenda   │    │ (conforto vs │
│  a própria   │    │  desafio)    │
│  evolução)   │    │              │
└──────────────┘    └──────────────┘
```

**Mecanismos:**
- **State Machine** — governa o próprio ciclo de vida (uninitialized → discovered → assessed → governed → evolved)
- **Event Bus** — módulos comunicam via eventos, não imports diretos
- **Feedback Loops** — aprende com aceitação/rejeição das recomendações
- **Rule Engine** — comportamentos declarativos: novas regras sem alterar código
- **Plugins** — extensível via `nexus-plugins/`

---

## Requisitos

- Node.js ≥ 18.0.0
- Git (recomendado, para métricas comportamentais)

## Instalação

```bash
npm install -g nexus-system
```

Ou diretamente:

```bash
npx nexus-system status
```

## Desenvolvimento

```bash
npm install
npm run dev status     # modo desenvolvimento
npm run build          # build
npm test               # testes
npm run typecheck      # verificação de tipos
npm run lint           # lint
npm run bench          # benchmarks
```

## Licença

MIT
