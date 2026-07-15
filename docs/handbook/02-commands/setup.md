# Setup & Configuration

Comandos para inicializar e configurar o projeto Shiten.

---

## `shiten init`

Inicializa o ecossistema Shiten com descoberta baseada em maturidade.

```bash
shiten init [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--dir <path>` | Diretório específico para inicializar |
| `--answers-file <file>` | Modo não-interativo com respostas pré-definidas |

### Exemplos

```bash
shiten init                          # Setup interativo
shiten init --dir ./my-project       # Diretório específico
shiten init --answers-file config.json  # Modo não-interativo
```

### Dicas

- Execute este comando primeiro para configurar governança no projeto
- Se já inicializado, re-executa o questionário de maturidade

---

## `shiten mcp`

Servidor MCP para agentes AI — inicie o servidor ou instale globalmente.

```bash
shiten mcp [options] [command]
```

### Subcomandos

| Comando | Descrição |
|---|---|
| `shiten mcp` | Inicia o servidor MCP |
| `shiten mcp install` | Instala o servidor MCP Filesystem |
| `shiten mcp install --check` | Verifica status da instalação |
| `shiten mcp install --upgrade` | Atualiza para a versão mais recente |

### Opções

| Opção | Descrição |
|---|---|
| `--project-root <path>` | Raiz do projeto (padrão: diretório atual) |

### Exemplos

```bash
shiten mcp                    # Iniciar servidor
shiten mcp --project-root .   # Raiz específica
shiten mcp install            # Instalar servidor
shiten mcp install --check    # Verificar instalação
shiten mcp install --upgrade  # Atualizar
```

### Dicas

- Conecte seu agente AI a este servidor para contexto ao vivo do projeto
- Execute `shiten mcp install` uma vez para corrigir timeouts do MCP

---

## `shiten upgrade`

Adicione capacidades ao ecossistema de governança.

```bash
shiten upgrade [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--capability <name>` | Instalar capacidade específica |
| `--accept-recommended` | Instalar todas as recomendadas |

### Exemplos

```bash
shiten upgrade                          # Mostrar capacidades disponíveis
shiten upgrade --capability architecture # Instalar capacidade específica
shiten upgrade --accept-recommended     # Instalar todas recomendadas
```

---

## `shiten clean`

Limpe o cache e arquivos temporários do Shiten.

```bash
shiten clean [options]
```

### Opções

| Opção | Descrição |
|---|---|
| `--dry-run` | Pré-visualização do que seria deletado |

### Exemplos

```bash
shiten clean              # Limpar todo cache
shiten clean --dry-run    # Pré-visualizar limpeza
```
