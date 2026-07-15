/**
 * daemon.ts — Shiten Background Daemon (Event Hub)
 *
 * Runs as a long-lived process to:
 * 1. Watch governance files in real-time (chokidar)
 * 2. Archive plans that reach Status: Done (checkAndArchiveDonePlans)
 * 3. Serve status/ping/queries via a Unix socket (IPC)
 * 4. Consume events from the event bus and maintain shared state
 *
 * Security:
 * - Socket is chmod 0600 (owner only)
 * - First client message must include version handshake
 * - SHITEN_NO_DAEMON=1 / CI=true: daemon is never started
 *
 * Invocation: node daemon-process.js <shitenDir>
 * (Spawned by daemon-client.ts#startDaemon)
 *
 * PRINCIPLE: A process that can't be stopped safely should never be started.
 */

import { createServer, type Server, type Socket } from "node:net";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  unlinkSync,
  appendFileSync,
  chmodSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { getEventBus } from "./event-bus.js";
import { startWatching } from "./infrastructure/persistence/file-watcher.js";
import { checkAndArchiveDonePlans } from "./plan-lifecycle.js";
import { DaemonCircuitBreaker } from "./daemon-circuit-breaker.js";
import { outputError } from "./output.js";

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const __dirname_file = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkgPath = join(__dirname_file, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

const DAEMON_VERSION = getVersion();

// ── Paths ─────────────────────────────────────────────────────────────────────

function getPaths(shitenDir: string) {
  const daemonDir = join(shitenDir, "daemon");
  return {
    daemonDir,
    pidPath: join(daemonDir, "daemon.pid"),
    sockPath: join(daemonDir, "daemon.sock"),
    logPath: process.env["SHITEN_DAEMON_LOG"] ?? join(daemonDir, "daemon.log"),
    approvedPath: join(daemonDir, "daemon.approved"),
    statePath: join(daemonDir, "daemon-state.json"),
  };
}

// ── Logger ────────────────────────────────────────────────────────────────────

function daemonLog(logPath: string, level: string, msg: string): void {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}\n`;
  try {
    appendFileSync(logPath, line, "utf-8");
  } catch {
    // If we can't log, we can't log — don't crash
  }
}

// ── Daemon State ──────────────────────────────────────────────────────────────

interface DriftInfo {
  filesChanged: number;
  minutesSinceLastCommit: number;
  detectedAt: string;
}

interface SessionInfo {
  id: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
}

interface HealthInfo {
  score: number;
  checkedAt: string;
}

interface ChallengeInfo {
  type: string;
  severity: string;
  message: string;
  generatedAt: string;
}

interface DebtInfo {
  gapCount: number;
  healthScore: number;
  detectedAt: string;
}

interface EventEntry {
  type: string;
  timestamp: string;
}

interface DaemonState {
  drift: DriftInfo | null;
  sessions: SessionInfo[];
  health: HealthInfo | null;
  challenges: ChallengeInfo[];
  debt: DebtInfo | null;
  events: EventEntry[];
  startedAt: string;
}

const MAX_EVENTS = 100;
const MAX_SESSIONS = 50;
const MAX_CHALLENGES = 20;

function createDaemonState(): DaemonState {
  return {
    drift: null,
    sessions: [],
    health: null,
    challenges: [],
    debt: null,
    events: [],
    startedAt: new Date().toISOString(),
  };
}

function recordEvent(state: DaemonState, eventType: string): void {
  state.events.push({ type: eventType, timestamp: new Date().toISOString() });
  if (state.events.length > MAX_EVENTS) {
    state.events.shift();
  }
}

function persistState(state: DaemonState, statePath: string): void {
  try {
    writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // State persistence is best-effort
  }
}

function loadState(statePath: string): DaemonState | null {
  try {
    if (!existsSync(statePath)) return null;
    const raw = readFileSync(statePath, "utf-8");
    return JSON.parse(raw) as DaemonState;
  } catch {
    return null;
  }
}

// ── IPC Protocol ──────────────────────────────────────────────────────────────

interface IpcMessage {
  type: string;
  version?: string;
  [key: string]: unknown;
}

function sendJson(socket: Socket, obj: object): void {
  try {
    socket.write(JSON.stringify(obj) + "\n");
  } catch {
    // Socket might have closed
  }
}

// ── Daemon ────────────────────────────────────────────────────────────────────

export async function runDaemon(shitenDir: string): Promise<void> {
  const paths = getPaths(shitenDir);
  const { daemonDir, pidPath, sockPath, logPath, approvedPath, statePath } = paths;

  if (!existsSync(daemonDir)) {
    mkdirSync(daemonDir, { recursive: true });
  }

  daemonLog(logPath, "INFO", `Shiten Daemon v${DAEMON_VERSION} starting — shitenDir: ${shitenDir}`);

  // ── Write PID ──────────────────────────────────────────────────────────────

  writeFileSync(pidPath, String(process.pid), "utf-8");
  daemonLog(logPath, "INFO", `PID ${process.pid} written to ${pidPath}`);

  // ── Mark as approved (first successful start) ──────────────────────────────

  if (!existsSync(approvedPath)) {
    writeFileSync(approvedPath, new Date().toISOString(), "utf-8");
    daemonLog(logPath, "INFO", "Daemon marked as approved for auto-start");
  }

  // ── Cleanup stale socket ───────────────────────────────────────────────────

  if (existsSync(sockPath)) {
    try { unlinkSync(sockPath); } catch { /* ignore */ }
  }

  // ── Daemon State ──────────────────────────────────────────────────────────

  const state = loadState(statePath) ?? createDaemonState();
  state.startedAt = new Date().toISOString();
  daemonLog(logPath, "INFO", `State loaded — ${state.events.length} historical events`);

  // ── IPC Socket Server ──────────────────────────────────────────────────────

  const startedAt = Date.now();

  const server: Server = createServer((socket: Socket) => {
    let buffer = "";

    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as IpcMessage;
          handleMessage(msg, socket, shitenDir, sockPath, startedAt, logPath, state);
        } catch {
          sendJson(socket, { type: "error", message: "Invalid JSON" });
        }
      }
    });

    socket.on("error", () => socket.destroy());
  });

  server.listen(sockPath, () => {
    // chmod 0600 — owner-only access
    try {
      chmodSync(sockPath, 0o600);
    } catch (err) {
      daemonLog(logPath, "WARN", `chmod 0600 failed on socket: ${err}`);
    }
    daemonLog(logPath, "INFO", `IPC socket listening at ${sockPath}`);
  });

  // ── File Watcher & Reactive Logic ──────────────────────────────────────────

  const bus = getEventBus();
  const stopWatcher = startWatching(shitenDir);

  // ── Event Subscriptions ─────────────────────────────────────────────────────

  // TIER 1: plan.file_changed — archive done plans (existing, enhanced)
  bus.subscribe("plan.file_changed", () => {
    recordEvent(state, "plan.file_changed");
    try {
      const result = checkAndArchiveDonePlans(shitenDir);
      if (result.archived > 0) {
        daemonLog(logPath, "INFO", `Auto-archived ${result.archived} plan(s): ${result.archivedIds.join(", ")}`);
      }
    } catch (err) {
      daemonLog(logPath, "ERROR", `checkAndArchiveDonePlans failed: ${err}`);
    }
  });

  // TIER 1: workdir.large_uncommitted_drift — log drift (passive)
  bus.subscribe("workdir.large_uncommitted_drift", (payload) => {
    recordEvent(state, "workdir.large_uncommitted_drift");
    const p = payload as { filesChanged?: number; minutesSinceLastCommit?: number } | undefined;
    state.drift = {
      filesChanged: p?.filesChanged ?? 0,
      minutesSinceLastCommit: p?.minutesSinceLastCommit ?? 0,
      detectedAt: new Date().toISOString(),
    };
    daemonLog(logPath, "WARN", `Drift detected: ${state.drift.filesChanged} files, ${state.drift.minutesSinceLastCommit} min`);
  });

  // TIER 1: task.completed — archive + buffer update (proactive)
  bus.subscribe("task.completed", () => {
    recordEvent(state, "task.completed");
    try {
      const result = checkAndArchiveDonePlans(shitenDir);
      if (result.archived > 0) {
        daemonLog(logPath, "INFO", `Task completed — auto-archived ${result.archived} plan(s)`);
      }
    } catch (err) {
      daemonLog(logPath, "ERROR", `task.completed handler failed: ${err}`);
    }
  });

  // TIER 1: session.start — track session (passive)
  bus.subscribe("session.start", (payload) => {
    recordEvent(state, "session.start");
    const p = payload as { sessionId?: string } | undefined;
    state.sessions.push({
      id: p?.sessionId ?? `session-${Date.now()}`,
      startedAt: new Date().toISOString(),
    });
    if (state.sessions.length > MAX_SESSIONS) {
      state.sessions.shift();
    }
  });

  // TIER 1: session.end — close session (passive)
  bus.subscribe("session.end", (payload) => {
    recordEvent(state, "session.end");
    const p = payload as { sessionId?: string; duration?: number } | undefined;
    const session = state.sessions.find((s) => !s.endedAt);
    if (session) {
      session.endedAt = new Date().toISOString();
      session.duration = p?.duration ?? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000);
    }
  });

  // TIER 1: health.checked — track health (passive)
  bus.subscribe("health.checked", (payload) => {
    recordEvent(state, "health.checked");
    const p = payload as { score?: number } | undefined;
    if (p?.score !== undefined) {
      state.health = { score: p.score, checkedAt: new Date().toISOString() };
    }
  });

  // TIER 2: challenge.generated — queue challenges (passive)
  bus.subscribe("challenge.generated", (payload) => {
    recordEvent(state, "challenge.generated");
    const p = payload as { type?: string; severity?: string; message?: string } | undefined;
    state.challenges.push({
      type: p?.type ?? "unknown",
      severity: p?.severity ?? "medium",
      message: p?.message ?? "",
      generatedAt: new Date().toISOString(),
    });
    if (state.challenges.length > MAX_CHALLENGES) {
      state.challenges.shift();
    }
  });

  // TIER 2: knowledge_debt.detected — track debt (passive)
  bus.subscribe("knowledge_debt.detected", (payload) => {
    recordEvent(state, "knowledge_debt.detected");
    const p = payload as { gapCount?: number; healthScore?: number } | undefined;
    state.debt = {
      gapCount: p?.gapCount ?? 0,
      healthScore: p?.healthScore ?? 100,
      detectedAt: new Date().toISOString(),
    };
  });

  // ── Generic event logger — record all event types passing through ─────────

  const logEvents = [
    "adr.created", "skill.created", "plan.created", "asset.created",
    "asset.updated", "engineering_state.updated", "docs.sync.triggered",
    "backlog.updated", "validation.completed", "pipeline.complete",
    "capability.installed", "maturity.changed", "rule.triggered",
  ] as const;

  for (const evt of logEvents) {
    bus.subscribe(evt, () => {
      recordEvent(state, evt);
    });
  }

  // ── State persistence timer ────────────────────────────────────────────────

  const persistTimer = setInterval(() => {
    persistState(state, statePath);
  }, 30_000);

  // ── Circuit Breaker: Reset after stable uptime ─────────────────────────────

  const breaker = new DaemonCircuitBreaker(shitenDir);
  const stableTimer = setTimeout(() => {
    breaker.reset();
    daemonLog(logPath, "INFO", "Stable uptime reached — circuit breaker reset");
  }, DaemonCircuitBreaker.stableUptimeMs);

  // ── Graceful Shutdown ──────────────────────────────────────────────────────

  const shutdown = (signal: string) => {
    daemonLog(logPath, "INFO", `Received ${signal} — shutting down`);
    clearTimeout(stableTimer);
    clearInterval(persistTimer);
    persistState(state, statePath);
    stopWatcher();
    server.close(() => {
      cleanup(pidPath, sockPath);
      daemonLog(logPath, "INFO", "Daemon stopped cleanly");
      process.exit(0);
    });
    // Force exit after 5s if cleanup hangs
    setTimeout(() => {
      cleanup(pidPath, sockPath);
      process.exit(1);
    }, 5_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ── Keep alive ─────────────────────────────────────────────────────────────

  daemonLog(logPath, "INFO", `Daemon ready — consuming ${logEvents.length + 8} event types`);
}

// ── Message Handler ───────────────────────────────────────────────────────────

function handleMessage(
  msg: IpcMessage,
  socket: Socket,
  shitenDir: string,
  sockPath: string,
  startedAt: number,
  logPath: string,
  state: DaemonState,
): void {
  switch (msg.type) {
    case "ping":
      sendJson(socket, { type: "pong", version: DAEMON_VERSION });
      break;

    case "handshake":
      if (msg.version !== DAEMON_VERSION) {
        sendJson(socket, {
          type: "error",
          code: "VERSION_MISMATCH",
          daemonVersion: DAEMON_VERSION,
          clientVersion: msg.version,
        });
      } else {
        sendJson(socket, { type: "handshake_ok", version: DAEMON_VERSION });
      }
      break;

    case "status": {
      const uptimeSec = Math.round((Date.now() - startedAt) / 1000);
      const activeSessions = state.sessions.filter((s) => !s.endedAt).length;
      const lastSession = state.sessions.length > 0
        ? state.sessions[state.sessions.length - 1]
        : null;

      sendJson(socket, {
        type: "status",
        pid: process.pid,
        version: DAEMON_VERSION,
        shitenDir,
        socketPath: sockPath,
        uptimeSeconds: uptimeSec,
        eventsRecorded: state.events.length,
        activeSessions,
        lastSession: lastSession
          ? { id: lastSession.id, startedAt: lastSession.startedAt, duration: lastSession.duration }
          : null,
        drift: state.drift,
        health: state.health,
        challengesQueued: state.challenges.length,
        debt: state.debt,
      });
      break;
    }

    case "stop":
      sendJson(socket, { type: "stopping" });
      daemonLog(logPath, "INFO", "Stop requested via IPC");
      process.kill(process.pid, "SIGTERM");
      break;

    // ── Query Handlers (Tier 2) ───────────────────────────────────────────────

    case "query_events": {
      const limit = Math.min(Number(msg.limit) || 20, MAX_EVENTS);
      const events = state.events.slice(-limit);
      sendJson(socket, { type: "events", events, count: events.length });
      break;
    }

    case "query_health": {
      const prev = state.health;
      let trend: "stable" | "improving" | "degrading" | "unknown" = "unknown";
      if (prev) {
        trend = prev.score >= 70 ? "stable" : prev.score >= 40 ? "degrading" : "unknown";
      }
      sendJson(socket, {
        type: "health",
        score: state.health?.score ?? null,
        checkedAt: state.health?.checkedAt ?? null,
        trend,
      });
      break;
    }

    case "query_drift": {
      sendJson(socket, {
        type: "drift",
        drift: state.drift,
      });
      break;
    }

    case "query_sessions": {
      const limit = Math.min(Number(msg.limit) || 10, MAX_SESSIONS);
      const sessions = state.sessions.slice(-limit);
      sendJson(socket, {
        type: "sessions",
        sessions,
        total: state.sessions.length,
        active: state.sessions.filter((s) => !s.endedAt).length,
      });
      break;
    }

    case "query_challenges": {
      sendJson(socket, {
        type: "challenges",
        challenges: state.challenges,
        count: state.challenges.length,
      });
      break;
    }

    case "query_debt": {
      sendJson(socket, {
        type: "debt",
        debt: state.debt,
      });
      break;
    }

    default:
      sendJson(socket, { type: "error", message: `Unknown message type: ${msg.type}` });
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

function cleanup(pidPath: string, sockPath: string): void {
  for (const p of [pidPath, sockPath]) {
    try { if (existsSync(p)) unlinkSync(p); } catch { /* ignore */ }
  }
}

// ── Entry Point ───────────────────────────────────────────────────────────────

// When run directly as a script (shiten.ts spawns this via startDaemon)
const shitenDirArg = process.argv[2];
if (shitenDirArg) {
  runDaemon(shitenDirArg).catch((err) => {
    outputError(`[daemon] Fatal error: ${err}`);
    process.exit(1);
  });
}
