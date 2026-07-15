# AI Integration

Comandos para integração com agentes AI e workflows.

---

## `shiten briefing`

Gere um briefing pré-sessão para agentes AI.

```bash
shiten briefing [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten briefing             # Briefing completo
shiten briefing --json      # Saída JSON
```

### Dicas

- Execute no início de cada sessão de chat com agentes AI
- Fornece contexto do projeto, riscos e regras ativas

---

## `shiten feedback`

Registre feedback de sessão para melhoria contínua.

```bash
shiten feedback [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--outcome <type>` | Resultado da sessão (success, failure, partial) |
| `--notes <text>` | Notas adicionais |
| `--areas <list>` | Áreas afetadas |

### Exemplos

```bash
shiten feedback --outcome success
shiten feedback --outcome failure --notes "Build failed"
shiten feedback --outcome partial --areas "auth,dashboard"
```

---

## `shiten profile`

Gerencie o perfil do usuário para calibrar respostas.

```bash
shiten profile [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten profile              # Ver perfil atual
shiten profile --json       # Saída JSON
```

---

## `shiten dashboard`

Dashboard interativo com visão geral do projeto.

```bash
shiten dashboard [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten dashboard            # Dashboard completo
shiten dashboard --json     # Saída JSON
```

---

## `shiten reminders`

Gerencie lembretes para o usuário.

```bash
shiten reminders [options]
```

### Subcomandos

| Comando | Descrição |
|---|---|
| `shiten reminders list` | Listar lembretes |
| `shiten reminders add` | Adicionar lembrete |
| `shiten reminders remove <id>` | Remover lembrete |

### Exemplos

```bash
shiten reminders list       # Listar lembretes
shiten reminders add "Revisar handbook" --priority medium
shiten reminders remove reminder-001
```
