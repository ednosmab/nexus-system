# Nexus System Living — Plano de Implementação

> **Data:** 2026-07-10
> **Objectivo:** Tornar o Nexus num sistema reactivo e vivo — sempre a ouvir eventos, sem intervenção manual
> **Estado:** Plan Mode → Aguarda implementação

---

## 1. Contexto

O Nexus CLI tem toda a arquitectura reactiva construída mas desconectada:
- File watcher (chokidar) ✅
- Event bus (in-memory + JSONL persistence) ✅
- Rule engine (RULE-020 reage a status changes) ✅
- Proactive engine (gera challenges) ✅
- Doc sync hook (sincroniza documentação) ✅

**Problema:** Tudo morre depois de cada comando CLI. O processo inicia, executa, e faz `process.exit()`.

**Objectivo:** Criar um daemon que mantenha o sistema vivo permanentemente.

---

## 2. Decisões Técnicas

### Decisão 1: Daemon Separado (não MCP Server)

O daemon é um componente separado do MCP server. O daemon é agnóstico — não depende de uma conexão IA para funcionar.

**Gestão de Recursos:**

| Componente | Risco | Solução |
|------------|-------|---------|
| `EventSourcedState.events[]` | CRITICAL | Sliding window (últimos 10K eventos) + persistir antigos em disco |
| `DeadLetterQueue.queue[]` | HIGH | Cap em 500 entradas, drain para disco |
| `CapabilityLifecycleTracker.history` | MEDIUM | Últimas 50 transições por capability |
| `EventReplayer.processed` Set | MEDIUM | Cap em 10K + LRU eviction |
| `ChangeHistoryTracker.history` | LOW | TTL de 1 hora |
| Rule engine disk I/O | Performance | Cache em memória + invalidação via file watcher |

**Gestão de Recursos por Categoria:**

| Recurso | Abordagem |
|---------|-----------|
| **Memória** | Sliding windows, LRU caches, WeakRef para objetos grandes |
| **CPU** | Debounce no file watcher (500ms), batch de eventos, regras cacheadas |
| **File descriptors** | Chokidar com `depth: 4`, cleanup garantido em SIGTERM |
| **Disco** | JSONL append-only para telemetria, atomic writes (tmp+rename) |
| **Processo** | PID file, signal handlers, graceful shutdown |

### Decisão 2: Híbrido (Comandos Independentes + IPC Opcional)

Comandos continuam a funcionar independentemente (robustez), mas quando o daemon está activo, comunicam via IPC para respostas rápidas.

**Fluxo de cada comando:**

```
nexus <command>
  │
  ├─ PASSO 1: Verificar se daemon está activo (3 camadas)
  │   ├─ Camada 1: PID file existe?
  │   ├─ Camada 2: PID está vivo? (kill(pid, 0))
  │   └─ Camada 3: Socket responde? (ping com timeout 500ms)
  │
  ├─ SE daemon ACTIVO:
  │   ├─ Enviar pedido via Unix socket
  │   ├─ Receber resposta serializada (JSON)
  │   ├─ Output para terminal
  │   └─ EXIT (sem re-bootstrapping)
  │
  └─ SE daemon INACTIVO:
      ├─ Bootstrap completo (event bus, rule engine, etc.)
      ├─ Executar comando
      ├─ Cleanup (stopWatching, endSession)
      └─ EXIT
```

**Protocolo IPC (Unix socket):**

| Pedido | Resposta | Uso |
|--------|----------|-----|
| `{ type: "ping" }` | `{ ok: true, uptime, memory }` | Health check |
| `{ type: "status" }` | `{ plans, rules, events, ... }` | `nexus status` |
| `{ type: "briefing", depth }` | `{ markdown, hash }` | `nexus briefing` |
| `{ type: "health" }` | `{ score, issues }` | `nexus health` |
| `{ type: "rules" }` | `{ rules: [...] }` | `nexus rules list` |

**Comportamento:**

| Estado | Comportamento |
|--------|---------------|
| Daemon inactivo | Comandos funcionam 100% via disco (JSONL, YAML) |
| Daemon activo | Comandos são rápidos (respostas via socket), estado sempre fresco |

### Decisão 3: Auto-start + Auto-restart

O daemon inicia automaticamente e reinicia se crashar, sem intervenção manual.

**Mecanismo: Interceptação no Middleware**

```
nexus init
  └─ PASSO FINAL: spawn daemon detached
      ├─ spawn("node", ["daemon-entry.js"], {
      │     detached: true,
      │     stdio: ["ignore", logFd, logFd],
      │     env: { NEXUS_DAEMON: "1", NEXUS_PROJECT_ROOT: projectRoot }
      │   })
      ├─ child.unref()  # Parent pode sair
      └─ writeFileSync("daemon.pid", child.pid)

nexus <qualquer comando>
  └─ preAction middleware:
      ├─ isDaemonRunning()?
      │   ├─ Sim: usar daemon via IPC
      │   └─ Não: spawn daemon + executar comando
      └─ Executar comando
```

**Lifecycle do Daemon:**

| Evento | Acção do Daemon | Acção do CLI |
|--------|-----------------|--------------|
| **Primeira execução** | Não existe | Middleware detecta → spawna daemon |
| **Comando normal** | Mantém vivo | Comunica via IPC ou executa directamente |
| **Daemon crash** | Processo morre | Próximo comando detecta PID morto → re-spawna |
| **User logout** | Socket fecha, PID stale | Próximo comando re-spawna |
| **System shutdown** | SIGTERM recebido | Graceful cleanup (remove PID, fecha socket) |
| **`nexus daemon stop`** | Recebe SIGTERM | Cleanup manual |
| **`nexus daemon status`** | — | Verifica PID + socket → output |

**Detecção de daemon morto (3 camadas):**

```
1. PID file existe?
   ├─ Não → daemon não existe → spawn
   └─ Sim ↓

2. Process.kill(pid, 0) retorna true?
   ├─ Não → daemon morreu → remove PID → spawn
   └─ Sim ↓

3. Socket ping responde em 500ms?
   ├─ Não → daemon hung → kill(pid) → remove PID → spawn
   └─ Sim → daemon activo → usar IPC
```

**Anti-corrupção (múltiplas instâncias):**

| Cenário | Prevenção |
|---------|-----------|
| Dois terminais abrem `nexus` ao mesmo tempo | PID file com `O_EXCL` flag (atomic create) |
| Daemon start manual + auto-start | `nexus daemon start` verifica se já existe |
| Daemon crash durante health check | Timeout de 500ms + kill stale process |

---

## 3. Arquitectura do Daemon

### Estrutura de Directorias

```
nexus-system/daemon/
├── daemon.pid          # PID do processo
├── daemon.sock         # Unix socket (IPC)
├── daemon.log          # stdout/stderr do daemon
└── daemon.rules.json   # Cache de regras em memória
```

### Componentes

| Componente | Função |
|------------|--------|
| `src/daemon.ts` | Lifecycle do daemon (start/stop/status, PID file, health check, signal handlers) |
| `src/daemon-client.ts` | Client utilities (isDaemonRunning, startDaemon, stopDaemon, pingDaemon) |
| `src/commands/daemon.ts` | Comando `nexus daemon start/stop/status/restart` |
| `src/daemon-resources.ts` | Bounded collections, memory management, sliding windows |
| `src/cli-middleware.ts` | Modificar — adicionar daemon auto-start check no preAction |
| `src/commands/init.ts` | Modificar — spawn daemon no final do init |
| `bin/nexus.ts` | Modificar — registar daemon command, SIGTERM handler |

---

## 4. Fluxo Completo (Objectivo Final)

```
UTILIZADOR: nexus init
  → Projecto scaffolded
  → Daemon spawned em background
  → "Nexus is alive! Daemon PID: 12345"

UTILIZADOR: (edita nexus-system/governance/plans/2026-07-10-plano.md)
  → Chokidar detecta mudança (daemon)
  → Event bus publica plan.file_changed
  → RULE-020 avalia: "**Status:** Done"?
  → Sim: moveToDone() executa
  → plan.archived publicado
  → RULE-018 actualiza context_buffer
  → RULE-019 popula próximo P0

UTILIZADOR: nexus status
  → Middleware: daemon activo? → Sim
  → Envia { type: "status" } via socket
  → Daemon responde com dados frescos
  → Output instantâneo (sem re-bootstrapping)

UTILIZADOR: nexus daemon stop
  → Daemon recebe SIGTERM
  → Cleanup: remove PID, fecha socket, fecha chokidar
  → "Daemon stopped."

UTILIZADOR: nexus briefing
  → Middleware: daemon activo? → Não (parado)
  → Bootstrap completo
  → Executa briefing
  → Spawn daemon novamente (auto-restart)
```

---

## 5. Problemas de Memória Identificados

### Críticos (devem ser resolvidos antes do daemon)

| Componente | Problema | Solução |
|------------|----------|---------|
| `EventSourcedState.events[]` | Carrega TODOS os JSONL em memória, sem limite | Sliding window (últimos 10K eventos) + persistir antigos |
| `DeadLetterQueue.queue[]` | Carrega todos os dead-letter JSONL, sem limite | Cap em 500 entradas, drain para disco |

### Médios (resolução recomendada)

| Componente | Problema | Solução |
|------------|----------|---------|
| `CapabilityLifecycleTracker.history` | Arrays por capability crescem indefinidamente | Últimas 50 transições por capability |
| `EventReplayer.processed` Set | UUIDs acumulam sem limite | Cap em 10K + LRU eviction |
| `IncrementalConsolidator.pendingDeltas[]` | Cresce até ser explicitamente limpo | Auto-drain periódico |

### Baixos (optimização futura)

| Componente | Problema | Solução |
|------------|----------|---------|
| `ChangeHistoryTracker.history` | Entradas para ficheiros inactivos permanecem | TTL de 1 hora |
| `console/data-collector` cache | Map sem limite de tamanho | LRU cache com TTL |
| Rule engine disk I/O | Lê disco em cada evento | Cache em memória + invalidação via file watcher |

---

## 6. Ficheiros a Criar/Modificar

| Ficheiro | Tipo | Descrição |
|----------|------|-----------|
| `src/daemon.ts` | **NOVO** | Daemon core: socket server, signal handlers, PID management |
| `src/daemon-client.ts` | **NOVO** | Client utilities: isDaemonRunning, startDaemon, stopDaemon, pingDaemon |
| `src/commands/daemon.ts` | **NOVO** | Comando `nexus daemon start/stop/status/restart` |
| `src/daemon-resources.ts` | **NOVO** | Bounded collections, memory management, sliding windows |
| `src/cli-middleware.ts` | MODIFICAR | Adicionar daemon auto-start check no preAction |
| `src/commands/init.ts` | MODIFICAR | Spawn daemon no final do init |
| `bin/nexus.ts` | MODIFICAR | Registar daemon command, SIGTERM handler |
| `src/__tests__/daemon.test.ts` | **NOVO** | Testes do daemon lifecycle |
| `src/__tests__/daemon-client.test.ts` | **NOVO** | Testes do client IPC |

---

## 7. Próximos Passos

| Passo | Prioridade | Descrição |
|-------|------------|-----------|
| 1 | ALTA | Criar `src/daemon.ts` — PID file, socket server, signal handlers |
| 2 | ALTA | Criar `src/daemon-client.ts` — detecção de daemon, spawn, IPC |
| 3 | ALTA | Criar `src/commands/daemon.ts` — comando start/stop/status |
| 4 | ALTA | Modificar `src/cli-middleware.ts` — auto-start check |
| 5 | ALTA | Modificar `src/commands/init.ts` — spawn daemon |
| 6 | MÉDIA | Criar `src/daemon-resources.ts` — bounded collections |
| 7 | MÉDIA | Corrigir problemas de memória (EventSourcedState, DeadLetterQueue) |
| 8 | MÉDIA | Criar testes de integração |
| 9 | BAIXA | Optimizar cache de regras (invalidação via file watcher) |
| 10 | BAIXA | Adicionar telemetria de memória (process.memoryUsage) |

---

*Documento gerado: 2026-07-10*
*Estado: Plan Mode → Aguarda implementação*
