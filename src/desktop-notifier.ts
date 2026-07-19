/**
 * desktop-notifier.ts — Smart Desktop Notifications for Shugo
 *
 * Subscribes to lifecycle events and sends desktop notifications
 * with intelligent rate limiting:
 *
 * 1. PROGRESSIVE COOLDOWN: Starts at 30s, increases when burst detected
 * 2. BATCHING: Groups multiple events within a 5s window into one notification
 * 3. DEDUPLICATION: Same event key within cooldown → skip
 *
 * PRINCIPLE: Notifications inform, never interrupt.
 */

import { getEventBus } from "./event-bus.js";
import { sendDesktopNotification } from "./notify.js";
import { logger } from "./logger.js";

// ── Configuration ────────────────────────────────────────────────────────

const BASE_COOLDOWN_MS = 30_000;
const BATCH_WINDOW_MS = 5_000;
const BURST_THRESHOLD = 3;
const BURST_WINDOW_MS = 60_000;
const MAX_COOLDOWN_MS = 5 * 60_000;

// ── State ────────────────────────────────────────────────────────────────

interface NotificationEvent {
  title: string;
  message: string;
  timestamp: number;
}

const lastNotified = new Map<string, number>();
const recentTimestamps: number[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
const batchQueue: NotificationEvent[] = [];
let initialized = false;

// ── Helpers ──────────────────────────────────────────────────────────────

function computeCooldown(): number {
  const now = Date.now();
  // Count events in burst window
  while (recentTimestamps.length > 0 && recentTimestamps[0]! < now - BURST_WINDOW_MS) {
    recentTimestamps.shift();
  }
  const recentCount = recentTimestamps.length;
  if (recentCount >= BURST_THRESHOLD) {
    // Exponential backoff: 30s → 60s → 120s → 300s (max)
    const exponent = Math.min(recentCount - BURST_THRESHOLD + 1, 4);
    return Math.min(BASE_COOLDOWN_MS * Math.pow(2, exponent), MAX_COOLDOWN_MS);
  }
  return BASE_COOLDOWN_MS;
}

function throttledNotify(key: string, title: string, message: string): void {
  const now = Date.now();
  const last = lastNotified.get(key) ?? 0;
  const cooldown = computeCooldown();

  if (now - last < cooldown) {
    logger.debug("desktop-notifier", `Throttled: ${key} (${Math.round((cooldown - (now - last)) / 1000)}s remaining)`);
    return;
  }

  lastNotified.set(key, now);
  recentTimestamps.push(now);
  sendDesktopNotification(title, message);
}

function flushBatch(): void {
  if (batchQueue.length === 0) return;
  batchTimeout = null;

  if (batchQueue.length === 1) {
    const evt = batchQueue[0]!;
    throttledNotify(evt.title + ":" + evt.message, evt.title, evt.message);
  } else {
    // Group multiple events into one notification
    const titles = [...new Set(batchQueue.map((e) => e.title))];
    const count = batchQueue.length;
    const summary = batchQueue
      .slice(0, 3)
      .map((e) => e.message)
      .join("; ");
    const extra = count > 3 ? ` (+${count - 3} mais)` : "";
    throttledNotify(
      `batch:${titles.join(",")}:${Date.now()}`,
      titles[0] ?? "Shugo",
      `${count} eventos: ${summary}${extra}`
    );
  }
  batchQueue.length = 0;
}

function queueNotification(title: string, message: string): void {
  batchQueue.push({ title, message, timestamp: Date.now() });

  if (batchTimeout === null) {
    batchTimeout = setTimeout(() => {
      flushBatch();
    }, BATCH_WINDOW_MS);
  }
}

// ── Event Handlers ───────────────────────────────────────────────────────

function handlePlanStatusChanged(payload: Record<string, unknown>): void {
  const planId = String(payload.planId ?? "unknown");
  const newStatus = String(payload.newStatus ?? "");
  const oldStatus = String(payload.oldStatus ?? "");

  if (newStatus === "check") {
    queueNotification(
      "Shugo Plan",
      `Plano ${planId} mudou para CHECK (era ${oldStatus}) — aguardando verificacao`
    );
  } else if (newStatus === "done") {
    queueNotification(
      "Shugo Plan",
      `Plano ${planId} CONCLUIDO — movendo para done/`
    );
  } else if (newStatus === "blocked") {
    queueNotification(
      "Shugo Plan",
      `Plano ${planId} BLOQUEADO — verificacao falhou, retry necessario`
    );
  }
}

function handlePlanArchived(payload: Record<string, unknown>): void {
  const title = String(payload.title ?? payload.planId ?? "unknown");
  const planId = String(payload.planId ?? "");
  queueNotification(
    "Shugo Plan",
    `Plano '${title}' (${planId}) arquivado em done/`
  );
}

function handleTaskCompleted(payload: Record<string, unknown>): void {
  const taskId = String(payload.taskId ?? "unknown");
  const gatesPassed = payload.gatesPassed ?? payload.gates ?? "?";
  const count = typeof gatesPassed === "number" ? gatesPassed : Array.isArray(gatesPassed) ? gatesPassed.length : "?";
  queueNotification(
    "Shugo Task",
    `Tarefa ${taskId} concluida (${count} gates OK)`
  );
}

function handleSessionEnd(payload: Record<string, unknown>): void {
  const outcome = String(payload.outcome ?? "unknown");
  const duration = Number(payload.duration ?? 0);
  const mins = Math.floor(duration / 60);
  const secs = Math.round(duration % 60);
  const time = mins > 0 ? `${mins}m${secs}s` : `${secs}s`;
  const icon = outcome === "success" ? "OK" : outcome === "failed" ? "FALHOU" : "PARCIAL";
  queueNotification(
    "Shugo Session",
    `Sessao encerrada: ${icon} (${time})`
  );
}

function handleValidationCompleted(payload: Record<string, unknown>): void {
  const passed = Boolean(payload.passed);
  const issues = Array.isArray(payload.issues) ? payload.issues.length : 0;
  if (!passed) {
    queueNotification(
      "Shugo Validation",
      `Verificacao falhou — ${issues} issue(s) encontrada(s)`
    );
  }
}

// ── Initialization ───────────────────────────────────────────────────────

export function initDesktopNotifier(): void {
  if (initialized) return;
  initialized = true;

  const bus = getEventBus();

  bus.subscribe("plan.status_changed", handlePlanStatusChanged);
  bus.subscribe("plan.archived", handlePlanArchived);
  bus.subscribe("task.completed", handleTaskCompleted);
  bus.subscribe("session.end", handleSessionEnd);
  bus.subscribe("validation.completed", handleValidationCompleted);

  logger.debug("desktop-notifier", "Initialized — subscribed to plan.status_changed, plan.archived, task.completed, session.end, validation.completed");
}

/**
 * Direct notification for code that changes plan status outside the event bus
 * (e.g., agent editing files directly). Bypasses event subscription.
 */
export function notifyPlanStatusChange(
  planId: string,
  newStatus: string,
  oldStatus: string
): void {
  queueNotification(
    "Shugo Plan",
    `Plano ${planId} mudou para ${newStatus.toUpperCase()} (era ${oldStatus})`
  );
}

/**
 * Direct notification for task completion outside the event bus.
 */
export function notifyTaskCompleted(taskId: string, detail?: string): void {
  queueNotification(
    "Shugo Task",
    `Tarefa ${taskId} concluida${detail ? ` — ${detail}` : ""}`
  );
}
