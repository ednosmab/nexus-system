# Status & Analysis

Comandos para verificar saúde do projeto, maturidade e padrões.

---

## `shiten status`

Verifica o status de saúde da governança com pontuação de maturidade.

```bash
shiten status [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |
| `--no-cache` | Ignorar cache, recalcular |

### Exemplos

```bash
shiten status              # Relatório completo
shiten status --json       # Saída JSON
shiten status --no-cache   # Recalcular tudo
```

### Dicas

- Mostra pontuação de saúde (0-100), problemas e status do knowledge graph
- Execute periodicamente para acompanhar a saúde da governança ao longo do tempo

---

## `shiten audit`

Audite a saúde da governança, knowledge graph e problemas.

```bash
shiten audit [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON para CI/CD |

### Exemplos

```bash
shiten audit               # Auditoria completa com pontuação
shiten audit --json        # Saída JSON
```

---

## `shiten doctor`

Mentor de engenharia — identifique riscos e sugira melhorias.

```bash
shiten doctor [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten doctor              # Relatório diagnóstico completo
shiten doctor --json       # Saída JSON
```

---

## `shiten assess`

Reavalie a maturidade do projeto e recomende novas capacidades.

```bash
shiten assess [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten assess              # Reavaliação interativa
shiten assess --json       # Saída JSON
```

### Dicas

- Execute quando o projeto cresceu para descobrir novas capacidades

---

## `shiten detect`

Detecte padrões no histórico e proponha regras candidatas.

```bash
shiten detect [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten detect              # Analisar histórico
shiten detect --json       # Saída JSON
```
