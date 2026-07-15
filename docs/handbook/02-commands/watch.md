# Watch

Real-time event log for governance monitoring.

---

## `shiten watch`

Starts a foreground process that displays governance events as they happen. Monitors file changes in `shitenno-go/governance/` and `shitenno-go/docs/`, and subscribes to the event bus for real-time updates.

```bash
shiten watch [--events <types>] [--dir <path>]
```

### Options

| Option | Description |
|--------|-------------|
| `-d, --dir <path>` | Project root directory (default: current) |
| `--events <types>` | Comma-separated event types to watch (default: all) |

### What It Does

- Watches `shitenno-go/governance/` and `shitenno-go/docs/` for file changes
- Subscribes to 44+ event types on the event bus
- Displays each event with timestamp, color-coded category, and label
- Shows heartbeat every 30 seconds with total event count
- Initializes plan-backlog sync subscribers before starting

### Event Categories

| Category | Color | Events |
|----------|-------|--------|
| Plan | Cyan | `plan.created`, `plan.file_changed`, `plan.status_changed`, `plan.archived` |
| Pipeline | Magenta | `pipeline.started`, `pipeline.stage_completed` |
| Session | Yellow | `session.started`, `session.ended` |
| Asset | Green | `asset.created`, `asset.updated`, `asset.archived` |
| Docs | Blue | `docs.sync.triggered`, `doc.lifecycle.audited` |
| Backlog | White | `backlog.updated` |
| Knowledge | Cyan | `knowledge.graph.updated` |
| Capability | Green | `capability.installed`, `capability.upgraded` |

### Filtering

Filter events by type using the `--events` flag with glob patterns:

```bash
shiten watch                              # Watch all events
shiten watch --events "plan.*"            # Only plan events
shiten watch --events "plan.*,backlog.*"  # Plan and backlog events
shiten watch --events "session.*"         # Only session events
```

### Differences from Daemon

| Aspect | `shiten watch` | `shiten daemon` |
|--------|---------------|----------------|
| Process | Foreground (occupies terminal) | Background (detached) |
| IPC | None (stdout only) | Unix socket server |
| Auto-archive | No | Yes |
| Lifecycle | Manual (Ctrl+C) | start/stop/status/restart |
| Use case | Debugging, monitoring | Automation |

### Shutdown

Press `Ctrl+C` or send `SIGINT`/`SIGTERM` to stop cleanly.
