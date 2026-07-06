# Configuration Reference

> How Nexus CLI reads and writes configuration.

## opencode.json

The AI agent configuration file, created by `nexus init` at the project root.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/[modelo-principal]",
  "default_agent": "plan",
  "agent": {
    "plan": { ... },
    "build": { ... },
    "orchestrator": { ... },
    "review": { ... }
  },
  "instructions": [ ... ],
  "skills": { ... },
  "mcp": { ... }
}
```

### Top-level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | No | JSON schema URL for validation |
| `model` | string | Yes | Default model for all agents |
| `default_agent` | string | Yes | Agent invoked on startup (`plan`) |
| `agent` | object | Yes | Agent definitions (plan, build, review, orchestrator) |
| `instructions` | string[] | Yes | File paths loaded as system context |
| `skills` | object | No | Skills directory configuration |
| `mcp` | object | No | MCP server configurations |

### Agent Definitions

Each agent under `agent` supports:

| Field | Type | Description |
|-------|------|-------------|
| `role` | string | Agent role (`planner`, `executor`, `auditor`, `orchestrator`) |
| `model` | string | Model override for this agent |
| `description` | string | System prompt / behavior description |
| `permission` | object | Tool permission rules (review agent only) |

#### Permission Rules (review agent)

```json
{
  "permission": {
    "edit": "deny",
    "bash": {
      "pnpm run test": "allow",
      "pnpm run lint": "allow",
      "git status": "allow",
      "*": "ask"
    }
  }
}
```

### Skills Configuration

```json
{
  "skills": {
    "paths": ["nexus-system/docs/skills"]
  }
}
```

### MCP Server Configuration

```json
{
  "mcp": {
    "local-filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "."],
      "enabled": true
    }
  }
}
```

---

## nexus-system/ Directory

Created by `nexus init`. Structure:

```
nexus-system/
├── docs/              # Documentation, skills, ADRs, plans
│   ├── skills/        # Engineering skills (21+)
│   ├── plans/         # Execution plans (archived)
│   ├── feedback/      # Session feedback (private)
│   └── history/       # Migrated legacy docs
├── governance/        # Governance structure
│   ├── contracts/     # AI role contracts
│   ├── context/       # context_buffer.yaml
│   ├── knowledge/     # ADRs, workflows
│   ├── quality/       # Quality rules
│   └── metrics/       # Metrics definitions
├── scripts/           # Session scripts (validate, close)
├── cognition/         # AI context memory
├── reports/           # Generated reports
├── maturity-profile.json
└── complexity-report.json
```

---

## nexus-system/profile/ ProjectProfile

Defines how Nexus adapts to your project type.

```json
{
  "projectType": "fullstack",
  "complexity": "medium",
  "teamSize": "small",
  "lifecycle": "active",
  "governanceLevel": "standard"
}
```

### Fields

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `projectType` | string | `frontend`, `backend`, `fullstack`, `library`, `mobile` | Project category |
| `complexity` | string | `simple`, `medium`, `complex` | Structural complexity |
| `teamSize` | string | `solo`, `small`, `medium`, `large` | Team size |
| `lifecycle` | string | `new`, `active`, `mature`, `legacy` | Project lifecycle phase |
| `governanceLevel` | string | `minimal`, `standard`, `strict` | Governance strictness |

---

## Loading Profiles

Control how much context AI agents load per session.

| Profile | Rules | Use Case | Tokens |
|---------|-------|----------|--------|
| **minimal** | #1-11, FORBIDDEN_OPERATIONS, DESDO | Quick tasks, typo fixes | ~3-4K |
| **lite** (default) | minimal + #12-16 | Feature implementation, bug fixes | ~5-6K |
| **full** | lite + #17-22 | Architecture decisions, complex debugging | ~8-10K |

Override with `loading_profile` field in `opencode.json`.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXUS_HOME` | Nexus home directory | `~/.nexus` |
| `NEXUS_PLUGINS` | Plugin directory | `nexus-system/plugins/` |
| `NEXUS_LOG_LEVEL` | Log level (`debug`, `info`, `warn`, `error`) | `info` |

---

## Configuration Precedence

1. CLI flags (`--dir`, `--json`, `--force`)
2. Environment variables
3. `opencode.json`
4. `nexus-system/profile/<project>.config.ts`
5. Defaults

---

*Last updated: 2026-06-29*
