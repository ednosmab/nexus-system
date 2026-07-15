# System

Comandos de sistema e utilitários.

---

## `shiten validate`

Valide a configuração e integridade do projeto.

```bash
shiten validate [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten validate             # Validação completa
shiten validate --json      # Saída JSON
```

---

## `shiten shell-init`

Inicialize o shell para integração com o Shiten.

```bash
shiten shell-init [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--shell <type>` | Tipo do shell (bash, zsh, fish) |

### Exemplos

```bash
shiten shell-init           # Detectar shell automaticamente
shiten shell-init --shell zsh
```

---

## `shiten handbook`

Acesse o handbook do projeto no terminal.

```bash
shiten handbook [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--level <n>` | Filtrar por nível (1, 2, 3) |
| `--topic <name>` | Abrir tópico específico |
| `--list` | Listar todos os tópicos |
| `--print` | Imprimir conteúdo no terminal |
| `--fill` | Preencher dados semânticos do template |

### Exemplos

```bash
shiten handbook              # TUI interativo
shiten handbook --level 1    # Apenas fundamentos
shiten handbook --level 2    # Apenas comandos
shiten handbook --level 3    # Apenas arquitetura
shiten handbook --list       # Listar tópicos
shiten handbook --print      # Imprimir no terminal
shiten handbook --fill       # Preencher dados semânticos
```

---

## `shiten hooks`

Instalar ou remover git hooks do Shiten.

```bash
shiten hooks [--uninstall] [--dir <path>]
```

### Opções

| Opção | Descrição |
|---|---|
| `--uninstall` | Remover hooks do git |

### Exemplos

```bash
shiten hooks              # Instalar hooks
shiten hooks --uninstall  # Remover hooks
```

---

## `shiten daemon`

Gerir o daemon de automação em background.

```bash
shiten daemon <start|stop|status|restart>
```

### Subcomandos

| Subcomando | Descrição |
|---|---|
| `start` | Iniciar o daemon em background |
| `stop` | Parar o daemon graciosamente |
| `status` | Mostrar PID, uptime, circuit breaker |
| `restart` | Parar e reiniciar |

### O que faz

- Observa arquivos de governança para mudanças
- Auto-arquiva planos concluídos
- Expõe socket IPC para consultas de estado
- Circuit breaker: 5 crashes em 60s activa o breaker

### Exemplos

```bash
shiten daemon start       # Iniciar daemon
shiten daemon stop        # Parar daemon
shiten daemon status      # Ver estado
shiten daemon restart     # Reiniciar
```

---

## `shiten watch`

Log de eventos em tempo real para monitorização de governança.

```bash
shiten watch [--events <types>] [--dir <path>]
```

### Opções

| Opção | Descrição |
|---|---|
| `--events <types>` | Filtrar por tipo de evento (ex: `plan.*,session.*`) |

### Exemplos

```bash
shiten watch                              # Todos os eventos
shiten watch --events plan.*,daemon.*     # Filtrar eventos
```

---

## `shiten events`

Mostrar trace de execução do motor de regras.

```bash
shiten events [--last <n>] [--trigger <type>] [--json]
```

### Opções

| Opção | Descrição |
|---|---|
| `--last <n>` | Últimos N eventos (padrão: 20) |
| `--trigger <type>` | Filtrar por tipo de trigger |
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten events                    # Últimos 20 eventos
shiten events --last 50          # Últimos 50
shiten events --trigger session  # Filtrar por session
```

---

## `shiten context`

Contexto completo do projecto para agentes AI.

```bash
shiten context [--json] [--for-agent <name>]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |
| `--for-agent <name>` | Filtrar contexto para um agente |

### Exemplos

```bash
shiten context                    # Contexto completo
shiten context --for-agent plan   # Contexto para agente plan
```

---

## `shiten history`

Ver histórico de estado de engenharia com diffs opcionais.

```bash
shiten history [--from <date>] [--to <date>] [--diff] [--json]
```

### Opções

| Opção | Descrição |
|---|---|
| `--from <date>` | Data inicial (formato ISO) |
| `--to <date>` | Data final (formato ISO) |
| `--diff` | Mostrar diff entre snapshots |
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten history                    # Listar snapshots
shiten history --diff             # Com diffs
shiten history --from 2026-07-01  # A partir de data
```

---

## `shiten reminders`

Gerir lembretes de sessão com prioridade e categoria.

```bash
shiten reminders [add|rm|clear] [options]
```

### Subcomandos

| Subcomando | Descrição |
|---|---|
| (nenhum) | Listar todos os lembretes activos |
| `add <msg>` | Adicionar lembrete |
| `rm <index>` | Remover por índice |
| `rm --message <text>` | Remover por mensagem parcial |
| `clear` | Remover todos |

### Opções (add)

| Opção | Descrição |
|---|---|
| `--priority <level>` | Prioridade: high, medium, low (padrão: medium) |
| `--category <cat>` | Categoria: bug, feature, debt, security, docs, infra |
| `--notify` | Enviar notificação desktop |

### Exemplos

```bash
shiten reminders add "Rodar audit" --priority high
shiten reminders add "Fix auth bug" --category bug
shiten reminders rm 1
shiten reminders clear
```

---

## `shiten update`

Detectar mudanças em templates e aplicar actualizações.

```bash
shiten update [--apply] [--dir <path>] [--json]
```

### Opções

| Opção | Descrição |
|---|---|
| `--apply` | Aplicar actualizações detectadas |
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten update            # Ver mudanças pendentes
shiten update --apply    # Aplicar actualizações
```

---

## `shiten docs-audit`

Auditar ciclo de vida da documentação e propor organização.

```bash
shiten docs-audit [--apply] [--dir <path>] [--json]
```

### Opções

| Opção | Descrição |
|---|---|
| `--apply` | Aplicar movimentações propostas |
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten docs-audit            # Dry-run: ver movimentações
shiten docs-audit --apply    # Aplicar movimentações
```
