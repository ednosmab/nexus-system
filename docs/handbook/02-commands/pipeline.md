# Pipeline & Execution

Comandos para executar pipelines de análise e ações de governança.

---

## `shiten run`

Execute o pipeline de análise completo (analisar → pontuar → detectar → auditar → evoluir).

```bash
shiten run [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten run                 # Pipeline completo
shiten run --json          # Saída JSON
```

### Dicas

- Combina todos os estágios de análise em um único comando
- Útil para CI/CD ou verificações de saúde periódicas

---

## `shiten evolve`

Mostre recomendações de evolução e gerencie feedback.

```bash
shiten evolve [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten evolve              # Mostrar recomendações
shiten evolve --json       # Saída JSON
```

---

## `shiten act`

Execute ações com garantias de idempotência.

```bash
shiten act [options]
```

### Subcomandos

| Comando | Descrição |
|---|---|
| `shiten act create` | Criar nova ação |
| `shiten act list` | Listar todas as ações |

### Opções

| Opção | Descrição |
|---|---|
| `--title <title>` | Título da ação |
| `--action-type <type>` | Tipo da ação (bugfix, feature, etc.) |

### Exemplos

```bash
shiten act create --title 'Fix auth' --action-type bugfix
shiten act list            # Listar todas as ações
```

---

## `shiten plan`

Gerencie sequências de ações coordenadas (planos).

```bash
shiten plan <subcommand> [options]
```

### Subcomandos

| Comando | Descrição |
|---|---|
| `shiten plan create <name>` | Criar um plano |
| `shiten plan execute <plan-id>` | Executar um plano |
| `shiten plan list` | Listar todos os planos |
| `shiten plan show <plan-id>` | Mostrar detalhes do plano |
| `shiten plan md prepare <id>` | Preparar pipeline de validação |

### Exemplos

```bash
shiten plan create my-plan           # Criar plano
shiten plan execute plan-001         # Executar plano
shiten plan list                     # Listar planos
shiten plan show plan-001            # Detalhes do plano
shiten plan md prepare plan-001      # Preparar pipeline
```
