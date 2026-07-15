# 18 — STATE MACHINE

> Shiten lifecycle gates.

## The States

Shiten itself has a lifecycle. It progresses through states:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  uninitialized → discovered → assessed → governed → evolved     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| State | Description | Entry Criteria |
|-------|-------------|---------------|
| `uninitialized` | No Shiten configuration exists | Default state |
| `discovered` | `shiten init` has been run | opencode.json + shitenno-go/ exist |
| `assessed` | Maturity has been evaluated | maturity-profile.json exists |
| `governed` | Governance rules are in place | WORKFLOW.md + contracts exist |
| `evolved` | System has recommended and implemented improvements | evolution report exists |

## State Definitions

```typescript
type ShitenLifecycleState = 
  | "uninitialized"
  | "discovered" 
  | "assessed"
  | "governed"
  | "evolved";
```

## State Transitions

```typescript
interface StateTransition {
  from: ShitenLifecycleState;
  to: ShitenLifecycleState;
  trigger: string;
  guards: Array<(context: PipelineContext) => boolean>;
}
```

### Valid Transitions

| From | To | Trigger | Guard |
|------|----|---------|-------|
| `uninitialized` | `discovered` | `shiten init` | opencode.json created |
| `discovered` | `assessed` | `shiten assess` or `shiten status` | maturity-profile.json exists |
| `assessed` | `governed` | `shiten upgrade --capability governance` | WORKFLOW.md exists |
| `governed` | `evolved` | `shiten run` pipeline completes | evolution report exists |
| `evolved` | `governed` | `shiten assess` (regression) | maturity decreased |
| `governed` | `assessed` | `shiten assess` (regression) | governance removed |

## Invalid Transitions

These transitions are blocked:

| From | To | Why Blocked |
|------|----|-------------|
| `uninitialized` | `assessed` | Must discover first |
| `uninitialized` | `governed` | Must discover first |
| `uninitialized` | `evolved` | Must discover first |
| `discovered` | `evolved` | Must assess first |
| `discovered` | `governed` | Must assess first |

## The State Machine Interface

```typescript
interface ShitenStateMachine {
  getState(): ShitenLifecycleState;
  canTransition(to: ShitenLifecycleState): boolean;
  transition(to: ShitenLifecycleState, context: PipelineContext): boolean;
  getHistory(): Array<{ from: ShitenLifecycleState; to: ShitenLifecycleState; timestamp: string }>;
}
```

## Implementation

```typescript
class DefaultShitenStateMachine implements ShitenStateMachine {
  private current: ShitenLifecycleState;
  private history: Array<{ from: ShitenLifecycleState; to: ShitenLifecycleState; timestamp: string }> = [];

  constructor(initialState: ShitenLifecycleState = "uninitialized") {
    this.current = initialState;
  }

  getState(): ShitenLifecycleState {
    return this.current;
  }

  canTransition(to: ShitenLifecycleState): boolean {
    return isValidTransition(this.current, to);
  }

  transition(to: ShitenLifecycleState, context: PipelineContext): boolean {
    if (!this.canTransition(to)) return false;

    const from = this.current;
    this.current = to;
    this.history.push({ from, to, timestamp: new Date().toISOString() });

    // Publish event
    getEventBus().publish("lifecycle.state_changed", { from, to });

    return true;
  }

  getHistory() {
    return [...this.history];
  }
}
```

## Detection

The current state is detected from filesystem:

```typescript
function detectLifecycleState(projectRoot: string, shitenDir: string): ShitenLifecycleState {
  if (!existsSync(join(projectRoot, "opencode.json"))) return "uninitialized";
  if (!existsSync(join(shitenDir, "maturity-profile.json"))) return "discovered";
  if (!existsSync(join(shitenDir, "governance", "WORKFLOW.md"))) return "assessed";
  
  const reportsDir = join(shitenDir, "reports");
  if (existsSync(reportsDir)) {
    const evolutionReports = readdirSync(reportsDir)
      .filter(f => f.startsWith("evolution-") && f.endsWith(".json"));
    if (evolutionReports.length > 0) return "evolved";
  }
  
  return "governed";
}
```

## Gate Enforcement

Some commands are gated by state:

| Command | Required State |
|---------|---------------|
| `shiten init` | `uninitialized` |
| `shiten status` | `discovered`+ |
| `shiten detect` | `assessed`+ |
| `shiten audit` | `assessed`+ |
| `shiten upgrade` | `assessed`+ |
| `shiten validate` | `discovered`+ |
| `shiten assess` | `discovered`+ |
| `shiten doctor` | `assessed`+ |
| `shiten run` | `assessed`+ |

## Event Integration

State transitions publish events:

```typescript
bus.subscribe("lifecycle.state_changed", ({ from, to }) => {
  console.log(`Shiten lifecycle: ${from} → ${to}`);
});
```

## Implementation

- **File:** `src/shiten-state-machine.ts` (~220 lines)
- **Detection:** `detectLifecycleState()`
- **State machine:** `DefaultShitenStateMachine`
- **Integration:** Commands check state before executing
