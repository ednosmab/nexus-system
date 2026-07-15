# Governance

Comandos para gerenciar metas, decisões e políticas.

---

## `shiten goal`

Gerencie metas de governança.

```bash
shiten goal <subcommand> [options]
```

### Subcomandos

| Comando | Descrição |
|---|---|
| `shiten goal create` | Criar nova meta |
| `shiten goal list` | Listar todas as metas |
| `shiten goal show <id>` | Mostrar detalhes da meta |

### Opções

| Opção | Descrição |
|---|---|
| `--title <title>` | Título da meta |
| `--priority <level>` | Prioridade (high, medium, low) |

### Exemplos

```bash
shiten goal create --title 'Improve tests' --priority high
shiten goal list            # Listar metas
shiten goal show goal-001   # Detalhes da meta
```

---

## `shiten decide`

Avalie ações propostas usando avaliadores especializados.

```bash
shiten decide <action> [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--category <cat>` | Categoria da decisão |

### Exemplos

```bash
shiten decide "upgrade auth to OAuth2"
shiten decide "add rate limiting" --category security
shiten decide list          # Listar todas as decisões
```

### Dicas

- Avalia risco, impacto, confiança e alinhamento com metas

---

## `shiten policy`

Gerencie e avalie políticas de governança declarativas.

```bash
shiten policy <subcommand> [options]
```

### Subcomandos

| Comando | Descrição |
|---|---|
| `shiten policy list` | Listar todas as políticas |
| `shiten policy evaluate` | Avaliar estado atual contra políticas |

### Exemplos

```bash
shiten policy list          # Listar políticas
shiten policy evaluate      # Avaliar políticas
```
