---
name: system-first
description: >
  Ativar esta skill em TODA sessao que envolva operacoes de governanca
  (planos, buffer, feedback, sessao). Implementa GOV-01 e GOV-02 do
  FORBIDDEN_OPERATIONS.md. O agente DEVE usar comandos shiten em vez
  de edicao manual de governance files.
---

# SYSTEM FIRST — Protocolo de Operacoes via Shiten CLI

## Objetivo
Garantir que o agente IA usa sempre comandos `shiten` para operacoes de
governanca, em vez de edicao manual de ficheiros. Isto economiza tokens,
garante consistencia e mantem o sistema como fonte de verdade.

## Regra Absoluta (GOV-01)

**E PROIBIDO** editar manualmente:
- `context_buffer.yaml`
- `BACKLOG.md`
- Status de planos em `governance/plans/`

**Quando existir comando `shiten` equivalente, SEMPRE usar o comando.**

## Mapeamento de Comandos

### Planos

| Operacao | Comando Shiten | O que faz |
|---|---|---|
| Listar planos activos | `shiten plan md list` | Mostra planos em andamento |
| Ver detalhes de um plano | `shiten plan md show <id>` | Mostra conteudo e estado |
| Actualizar status | `shiten plan md status <id> <status>` | Atualiza frontmatter + move se done |
| Marcar como concluido | `shiten plan md done <id>` | Move para done/ + publica evento |
| Detectar e arquivar | `shiten plan md lifecycle --auto` | Infere estado + valida + arquiva |
| Criar novo plano | `shiten plan md create <titulo>` | Cria com template padrao |

### Sessao e Feedback

| Operacao | Comando Shiten | O que faz |
|---|---|---|
| Ver status do projecto | `shiten status` | Mostra saude, maturidade, capabilities |
| Fechar sessao | `shiten feedback --outcome success` | Regista resultado da sessao |
| Feedback com notas | `shiten feedback --outcome success --notes "<notas>"` | Feedback detalhado |
| Briefing pre-sessao | `shiten briefing` | Gera contexto para proxima sessao |

### Validacao e Governanca

| Operacao | Comando Shiten | O que faz |
|---|---|---|
| Validar projecto | `shiten validate` | Verifica regras, tipos, estrutura |
| Corrigir automaticamente | `shiten validate --fix` | Corrige problemas detectaveis |
| Auditar saude | `shiten audit` | Analise completa de governanca |
| Doctor (mentor) | `shiten doctor` | Sugere melhorias e riscos |

### Pipeline

| Operacao | Comando Shiten | O que faz |
|---|---|---|
| Executar pipeline completo | `shiten run` | analyse -> score -> detect -> audit -> evolve |
| Fechar sessao (script) | `pnpm run close:session` | 8 verificacoes + pipeline de conclusao |

## Fluxo Correcto de uma Tarefa

```
1. shiten briefing                    <- contexto
2. [executar trabalho]
3. shiten validate                    <- verificar
4. shiten plan md done <id>           <- arquivar plano
5. shiten feedback --outcome success  <- fechar sessao
```

## Excepcos (quando edicao manual e aceitavel)

Edicao manual SO e permitida quando:
1. Nenhum comando `shiten` existe para a operacao
2. E uma correccao trivial (typo, formatacao)
3. E uma alteracao a propria skill/docs (nao governance files)

Nestes casos, documentar no context_buffer a alteracao manual.

## Referencias

- `docs/FORBIDDEN_OPERATIONS.md` — GOV-01, GOV-02
- `docs/AGENTS.md` — Regra #1 (commits), #12 (fim de sessao)
- `governance/WORKFLOW.md` — Fluxos de sessao
