---
name: system-first
description: >
  Ativar esta skill em TODA sessão que envolva operações de governança
  (planos, buffer, feedback, sessão). Implementa GOV-01 e GOV-02 do
  FORBIDDEN_OPERATIONS.md. O agente DEVE usar comandos nexus em vez
  de edição manual de governance files.
---

# 🖥️ SYSTEM FIRST — Protocolo de Operações via Nexus CLI

## 🎯 Objetivo
Garantir que o agente IA usa sempre comandos `nexus` para operações de
governança, em vez de edição manual de ficheiros. Isto economiza tokens,
garante consistência e mantém o sistema como fonte de verdade.

## 🚫 REgra Absoluta (GOV-01)

**É PROIBIDO** editar manualmente:
- `context_buffer.yaml`
- `BACKLOG.md`
- Status de planos em `governance/plans/`

**Quando existir comando `nexus` equivalente, SEMPRE usar o comando.**

## 📋 Mapeamento de Comandos

### Planos

| Operação | Comando Nexus | O que faz |
|---|---|---|
| Listar planos activos | `nexus plan md list` | Mostra planos em andamento |
| Ver detalhes de um plano | `nexus plan md show <id>` | Mostra conteúdo e estado |
| Actualizar status | `nexus plan md status <id> <status>` | Atualiza frontmatter + move se done |
| Marcar como concluído | `nexus plan md done <id>` | Move para done/ + publica evento |
| Detectar e arquivar | `nexus plan md lifecycle --auto` | Infere estado + valida + arquiva |
| Criar novo plano | `nexus plan md create <título>` | Cria com template padrão |

### Sessão e Feedback

| Operação | Comando Nexus | O que faz |
|---|---|---|
| Ver status do projecto | `nexus status` | Mostra saúde, maturidade, capabilities |
| Fechar sessão | `nexus feedback --outcome success` | Regista resultado da sessão |
| Feedback com notas | `nexus feedback --outcome success --notes "<notas>"` | Feedback detalhado |
| Briefing pré-sessão | `nexus briefing` | Gera contexto para próxima sessão |

### Validação e Governança

| Operação | Comando Nexus | O que faz |
|---|---|---|
| Validar projecto | `nexus validate` | Verifica regras, tipos, estrutura |
| Corrigir automaticamente | `nexus validate --fix` | Corrige problemas detectáveis |
| Auditar saúde | `nexus audit` | Análise completa de governança |
| Doctor (mentor) | `nexus doctor` | Sugere melhorias e riscos |

### Pipeline

| Operação | Comando Nexus | O que faz |
|---|---|---|
| Executar pipeline completo | `nexus run` | analyse → score → detect → audit → evolve |
| Fechar sessão (script) | `pnpm run close:session` | 8 verificações + pipeline de conclusão |

## 🔄 Fluxo Correcto de uma Tarefa

```
1. nexus briefing                    ← contexto
2. [executar trabalho]
3. nexus validate                    ← verificar
4. nexus plan md done <id>           ← arquivar plano
5. nexus feedback --outcome success  ← fechar sessão
```

## ⚠️ Excepções (quando edição manual é aceitável)

Edição manual SÓ é permitida quando:
1. Nenhum comando `nexus` existe para a operação
2. É uma correcção trivial (typo, formatação)
3. É uma alteração à própria skill/docs (não governance files)

Nestes casos, documentar no context_buffer a alteração manual.

## 🔗 Referências

- `docs/FORBIDDEN_OPERATIONS.md` — GOV-01, GOV-02
- `docs/AGENTS.md` — Regra #1 (commits), #12 (fim de sessão)
- `governance/WORKFLOW.md` — Fluxos de sessão
