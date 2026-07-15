# Primeiros Passos

> Guia rápido para começar a usar o Shiten em 5 minutos.

---

## Visão geral

O fluxo básico do Shiten é:

```
init → status → detect → briefing → daemon → watch → trabalhar → feedback
```

Vamos passar por cada etapa.

---

## Passo 1: Inicializar o projeto

```bash
shiten init
```

O que acontece:

1. **Análise do projeto** — Shiten detecta stack, packages, estrutura
2. **Questionário de maturidade** — Perguntas sobre práticas de engenharia
3. **Cálculo do perfil** — Score de 0-100 em 7 dimensões
4. **Instalação de capabilities** — Módulos recomendados para seu projeto
5. **Criação de estrutura** — Pasta `shitenno-go/` com arquivos de governança

Saída esperada:

```
🔍 Analisando projeto...
  Stack: typescript
  Packages: 3
  Source files: 47

📊 Perfil de Maturidade
  Arquitetura:  ████████░░ 80%
  Governança:   ██████░░░░ 60%
  Qualidade:    ███████░░░ 70%
  Automação:    ████░░░░░░ 40%
  AI:           ██░░░░░░░░ 20%
  Documentação: █████░░░░░ 50%
  Observabilidade: ███░░░░░░░ 30%

  Overall: 50/100

✅ Shiten inicializado com sucesso!
```

---

## Passo 2: Verificar saúde do projeto

```bash
shiten status
```

Mostra:

- **Governance Health** — Status dos arquivos de governança
- **Maturity Profile** — Score atual e dimensões
- **Complexity Analysis** — Métricas de complexidade do projeto
- **Capability Engine** — Capabilities instaladas e recomendadas

Saída esperada:

```
📋 Governance Health
  opencode.json        ✅
  AGENTS.md            ✅ (22 regras)
  skills/              ✅ (5 arquivos)
  governance/          ✅
  context_buffer.yaml  ⚠️  Seção current_task vazia
  scripts/             ✅ (3 scripts)
  agent contracts      ✅ (4 contratos)

📊 Maturity: 50/100
🔧 Capabilities: 5 instaladas, 3 recomendadas
```

---

## Passo 3: Detectar padrões

```bash
shiten detect
```

Analisa o histórico do projeto e encontra:

- **Padrões recorrentes** — Erros que se repetem
- **Decisões revertidas** — Mudanças que foram desfeitas
- **Áreas quentes** — Arquivos que mudam frequentemente

Saída esperada:

```
🔍 Análise de Padrões

  Histórico analisado: 156 entradas
  Relatórios analisados: 12

  Padrões Detectados:
    🔴 recurring_error — Erro de tipo em auth.ts (severidade: 4)
    🟡 hot_area — src/api/ muda 3x por semana (severidade: 2)

  Regras Candidatas:
    RC-001: Evitar tipagem implícita em módulos de autenticação
    RC-002: Criar testes automatizados para src/api/
```

---

## Passo 4: Gerar briefing (para AI)

```bash
shiten briefing
```

Gera um briefing pré-sessão para agentes AI:

```
📋 Briefing — 2026-07-11

Identidade do Projeto
  Domínio: monorepo
  Escala: medium
  Stack: react
  Maturidade: 73/100

Status de Risco
  Geral: critical
  Áreas críticas: src, apps

Cobertura de Testes
  Áreas sem testes: 5

Recomendações
  1. Endereçar áreas críticas: src, apps
  2. Melhorar cobertura de testes em 5 áreas
```

---

## Passo 5: Iniciar o daemon (automatização)

```bash
shiten daemon start
```

O daemon corre em background e:

- **Observa** arquivos de governança para mudanças
- **Auto-arquiva** planos concluídos
- **Expõe IPC** para consultas de estado
- **Circuit breaker** protege contra crashes (5 em 60s)

Verificar estado:

```bash
shiten daemon status
```

---

## Passo 6: Monitorizar eventos (watch)

```bash
shiten watch
```

Mostra eventos em tempo real — mudanças de plano, sessões, daemon, etc.

Filtrar por tipo:

```bash
shiten watch --events plan.*,daemon.*
```

Parar com `Ctrl+C`.

---

## Passo 7: Trabalhar no projeto

Agora trabalhe normalmente. O Shiten observa em segundo plano:

- **Daemon** — Automatiza tarefas de governança
- **File watcher** — Detecta mudanças em arquivos
- **Rule engine** — Reage a eventos (ex: novo arquivo de plano)
- **Session tracker** — Registra início e fim de sessões

---

## Passo 8: Fechar o feedback

Ao terminar uma sessão de trabalho:

```bash
# Se deu tudo certo
shiten feedback --outcome success

# Se teve problemas
shiten feedback --outcome failure --notes "erro de tipagem em auth.ts"

# Se ficou parcial
shiten feedback --outcome partial --areas "auth,dashboard"
```

Isso alimenta o **Context Pipeline** e melhora recomendações futuras.

---

## Fluxo diário recomendado

```bash
# Início do dia
shiten briefing          # Ver contexto do projeto
shiten status            # Ver saúde
shiten daemon start      # Iniciar automação

# Durante o trabalho
shiten detect            # Ver padrões (opcional)
shiten watch --events plan.*  # Monitorizar planos (opcional)

# Fim do dia
shiten feedback --outcome success  # Fechar sessão
```

---

## Comandos úteis para memorizar

| Comando | O que faz | Quando usar |
|---|---|---|
| `shiten init` | Inicializa governança | Primeira vez no projeto |
| `shiten status` | Mostra saúde do projeto | Diariamente |
| `shiten detect` | Detecta padrões | Semanalmente |
| `shiten briefing` | Gera briefing para AI | Início de sessão AI |
| `shiten daemon start` | Inicia automação | Início do dia |
| `shiten watch` | Monitoriza eventos | Quando precisar de visibilidade |
| `shiten feedback` | Fecha loop de feedback | Fim de sessão |
| `shiten audit` | Auditoria completa | Mensalmente |
| `shiten doctor` | Diagnóstico de riscos | Quando há dúvidas |

---

## Próximo passo

→ [Conceitos](concepts.md) — Entenda maturidade, capabilities e governance
