/**
 * verification-lock-concurrent.test.ts — Integration test for cross-process lock
 *
 * Uses real child_process.fork() to simulate two OS-level processes
 * competing for the same verification lock:
 * 1. Child acquires lock, parent detects conflict and skips
 * 2. Two concurrent children: exactly one wins
 * 3. Child crash (SIGKILL) → parent reclaims stale lock
 * 4. Failed acquire does not corrupt the lock file
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { fork, type ChildProcess } from "node:child_process";
import {
  acquireVerificationLock,
  releaseVerificationLock,
} from "../verification-lock.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function createTempDir(): string {
  const dir = join(
    tmpdir(),
    `shitenno-vlock-concurrent-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(join(dir, "governance", "plans"), { recursive: true });
  return dir;
}

function getLockPath(shitennoDir: string): string {
  return join(shitennoDir, "governance", "plans", ".verification.lock");
}

/**
 * Creates a temporary worker script that the child process will run.
 * Uses ESM import() since the project has "type": "module".
 */
function createWorkerScript(dir: string): string {
  const scriptPath = join(dir, "worker.mjs");
  const lockModulePath = join(process.cwd(), "dist", "verification-lock.js");
  const script = `
import { acquireVerificationLock, releaseVerificationLock } from ${JSON.stringify("file://" + lockModulePath)};

const shitennoDir = ${JSON.stringify(dir)};
const result = acquireVerificationLock(shitennoDir);
process.send({ type: "result", acquired: result, pid: process.pid });

process.on("message", (msg) => {
  if (msg.type === "release") {
    releaseVerificationLock(shitennoDir);
    process.send({ type: "released" });
  }
  if (msg.type === "exit") {
    process.exit(0);
  }
});
`;
  writeFileSync(scriptPath, script, "utf-8");
  return scriptPath;
}

/**
 * Fork a child process that tries to acquire the lock and sends back the result.
 * The child keeps the lock held (does NOT release) so we can test contention.
 */
function forkLockHolder(dir: string): ChildProcess {
  const scriptPath = createWorkerScript(dir);
  const child = fork(scriptPath, {
    stdio: ["pipe", "pipe", "pipe", "ipc"],
    detached: false,
  });
  return child;
}

function waitForMessage(child: ChildProcess, type: string, timeoutMs = 8000): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for message type="${type}" from child pid=${child.pid}`)),
      timeoutMs
    );
    child.on("message", (msg: Record<string, unknown>) => {
      if (msg.type === type) {
        clearTimeout(timer);
        resolve(msg);
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("exit", (code) => {
      // If child exits unexpectedly before sending the message
      if (code !== null && code !== 0) {
        clearTimeout(timer);
        reject(new Error(`Child exited with code ${code}`));
      }
    });
  });
}

function killChild(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (!child.pid || child.killed) {
      resolve();
      return;
    }
    child.on("exit", () => resolve());
    child.kill("SIGKILL");
    setTimeout(resolve, 1000);
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("verification-lock: concurrent cross-process", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("child acquires lock, parent detects conflict and skips", async () => {
    // Step 1: Fork child process that acquires the lock
    const child = forkLockHolder(dir);
    const childResult = await waitForMessage(child, "result") as { acquired: boolean; pid: number };

    // Child should have acquired the lock
    expect(childResult.acquired).toBe(true);
    expect(childResult.pid).toBeGreaterThan(0);

    // Verify lock file exists and belongs to the child
    expect(existsSync(getLockPath(dir))).toBe(true);
    const lockContent = JSON.parse(readFileSync(getLockPath(dir), "utf-8"));
    expect(lockContent.pid).toBe(child.pid);

    // Step 2: Parent (current process) tries to acquire — should fail
    const parentResult = acquireVerificationLock(dir);
    expect(parentResult).toBe(false);

    // Step 3: Child releases the lock
    child.send({ type: "release" });
    await waitForMessage(child, "released");

    // Step 4: Parent can now acquire
    const secondAttempt = acquireVerificationLock(dir);
    expect(secondAttempt).toBe(true);

    // Cleanup
    child.send({ type: "exit" });
    releaseVerificationLock(dir);
  });

  it("only one of two concurrent acquirers wins", async () => {
    // Fork two children simultaneously, both try to acquire
    const child1 = forkLockHolder(dir);
    const child2 = forkLockHolder(dir);

    const [result1, result2] = await Promise.all([
      waitForMessage(child1, "result") as Promise<{ acquired: boolean; pid: number }>,
      waitForMessage(child2, "result") as Promise<{ acquired: boolean; pid: number }>,
    ]);

    // Exactly one should have acquired the lock
    const winners = [result1, result2].filter((r) => r.acquired);
    expect(winners.length).toBe(1);

    // The winner's PID should match the lock file
    const winner = winners[0]!;
    const lockContent = JSON.parse(readFileSync(getLockPath(dir), "utf-8"));
    expect(lockContent.pid).toBe(winner.pid);

    // The loser should have received false
    const losers = [result1, result2].filter((r) => !r.acquired);
    expect(losers.length).toBe(1);

    // Cleanup both children
    child1.send({ type: "exit" });
    child2.send({ type: "exit" });
    releaseVerificationLock(dir);
  });

  it("after child crash (SIGKILL), parent reclaims the stale lock", async () => {
    // Step 1: Child acquires the lock
    const child = forkLockHolder(dir);
    const childResult = await waitForMessage(child, "result") as { acquired: boolean; pid: number };
    expect(childResult.acquired).toBe(true);

    // Verify lock file belongs to child
    const lockContent = JSON.parse(readFileSync(getLockPath(dir), "utf-8"));
    expect(lockContent.pid).toBe(child.pid);

    // Step 2: Kill the child with SIGKILL (simulates crash)
    await killChild(child);
    await new Promise((r) => setTimeout(r, 200));

    // Step 3: Parent tries to acquire — should reclaim the stale lock
    const parentResult = acquireVerificationLock(dir);
    expect(parentResult).toBe(true);

    // Lock should now belong to the parent
    const newLockContent = JSON.parse(readFileSync(getLockPath(dir), "utf-8"));
    expect(newLockContent.pid).toBe(process.pid);

    releaseVerificationLock(dir);
  });

  it("failed acquire does not corrupt the lock file", async () => {
    // Fork child that holds the lock
    const child = forkLockHolder(dir);
    await waitForMessage(child, "result");

    // Parent tries and fails to acquire — should not corrupt the lock file
    acquireVerificationLock(dir);

    // Lock file should still be valid JSON with the child's PID
    const lockContent = JSON.parse(readFileSync(getLockPath(dir), "utf-8"));
    expect(typeof lockContent.pid).toBe("number");
    expect(typeof lockContent.startedAt).toBe("string");
    expect(lockContent.pid).toBe(child.pid);

    // Cleanup
    child.send({ type: "exit" });
    releaseVerificationLock(dir);
  });
});
