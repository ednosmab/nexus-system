# Reports & Dashboards

Comandos para visualizar relatórios, dashboards e resumos.

---

## `shiten console`

Console de economia de tokens com métricas de sessão.

```bash
shiten console [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--days <n>` | Últimos N dias |

### Exemplos

```bash
shiten console              # Console completo
shiten console --days 30    # Últimos 30 dias
```

---

## `shiten report`

Gere um relatório de desempenho para o usuário.

```bash
shiten report [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten report               # Relatório completo
shiten report --json        # Saída JSON
```

---

## `shiten digest`

Resumo diário da saúde do projeto e mudanças recentes.

```bash
shiten digest [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten digest               # Digest de hoje
shiten digest --json        # Saída JSON
```

---

## `shiten bench`

Execute benchmarks de performance do sistema.

```bash
shiten bench [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--json` | Saída em formato JSON |

### Exemplos

```bash
shiten bench                # Benchmark completo
shiten bench --json         # Saída JSON
```
