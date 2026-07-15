/**
 * hooks-install.test.ts — Tests for the hooks installer command
 *
 * Validates that the hooks installer:
 * - Never overwrites existing hook content (Step 2.8)
 * - Creates .husky/post-merge if missing
 * - Is idempotent (running twice doesn't duplicate lines)
 * - Uninstall removes exactly the Shiten lines
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { appendToHook, removeFromHook, ensureHooksDir } from "../commands/hooks.js";

const SHITEN_HOOK_LINE = "shiten detect --auto 2>/dev/null &";

// ── Helpers ────────────────────────────────────────────────────────────────

function createTempProject(): string {
  const dir = join(tmpdir(), `shiten-hooks-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, ".git"), { recursive: true });
  mkdirSync(join(dir, ".husky"), { recursive: true });
  return dir;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("hooks installer", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempProject();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe("appendToHook", () => {
    it("creates new hook file with shebang when missing", () => {
      const hooksPath = join(dir, ".husky");
      appendToHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);

      const content = readFileSync(join(hooksPath, "post-commit"), "utf-8");
      expect(content).toContain("#!/bin/sh");
      expect(content).toContain(SHITEN_HOOK_LINE);
      expect(content).toContain("# Shitenno-go hook");
    });

    it("appends to existing hook without overwriting", () => {
      const hooksPath = join(dir, ".husky");
      const hookPath = join(hooksPath, "post-commit");
      writeFileSync(hookPath, "#!/bin/sh\necho 'existing hook'\n", { mode: 0o755 });

      appendToHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);

      const content = readFileSync(hookPath, "utf-8");
      expect(content).toContain("echo 'existing hook'");
      expect(content).toContain(SHITEN_HOOK_LINE);
    });

    it("is idempotent — running twice does not duplicate the line", () => {
      const hooksPath = join(dir, ".husky");
      appendToHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);
      appendToHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);

      const content = readFileSync(join(hooksPath, "post-commit"), "utf-8");
      const occurrences = content.split(SHITEN_HOOK_LINE).length - 1;
      expect(occurrences).toBe(1);
    });

    it("creates post-merge hook from scratch", () => {
      const hooksPath = join(dir, ".husky");
      appendToHook(hooksPath, "post-merge", SHITEN_HOOK_LINE);

      const content = readFileSync(join(hooksPath, "post-merge"), "utf-8");
      expect(content).toContain("#!/bin/sh");
      expect(content).toContain(SHITEN_HOOK_LINE);
    });
  });

  describe("removeFromHook", () => {
    it("removes Shiten hook line from existing hook", () => {
      const hooksPath = join(dir, ".husky");
      const hookPath = join(hooksPath, "post-commit");
      writeFileSync(hookPath, "#!/bin/sh\necho 'existing'\n\n# Shitenno-go hook\n" + SHITEN_HOOK_LINE + "\n", { mode: 0o755 });

      const { removed } = removeFromHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);
      expect(removed).toBe(true);

      const content = readFileSync(hookPath, "utf-8");
      expect(content).toContain("echo 'existing'");
      expect(content).not.toContain(SHITEN_HOOK_LINE);
      expect(content).not.toContain("# Shitenno-go hook");
    });

    it("returns false when hook file does not exist", () => {
      const hooksPath = join(dir, ".husky");
      const { removed } = removeFromHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);
      expect(removed).toBe(false);
    });

    it("returns false when hook file exists but line is not present", () => {
      const hooksPath = join(dir, ".husky");
      const hookPath = join(hooksPath, "post-commit");
      writeFileSync(hookPath, "#!/bin/sh\necho 'other hook'\n", { mode: 0o755 });

      const { removed } = removeFromHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);
      expect(removed).toBe(false);

      const content = readFileSync(hookPath, "utf-8");
      expect(content).toContain("echo 'other hook'");
    });

    it("preserves other hooks when uninstalling Shiten", () => {
      const hooksPath = join(dir, ".husky");
      const hookPath = join(hooksPath, "post-commit");
      writeFileSync(
        hookPath,
        "#!/bin/sh\necho 'other hook'\n\n# Shitenno-go hook\n" + SHITEN_HOOK_LINE + "\n",
        { mode: 0o755 }
      );

      removeFromHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);

      const content = readFileSync(hookPath, "utf-8");
      expect(content).toContain("echo 'other hook'");
      expect(content).not.toContain(SHITEN_HOOK_LINE);
    });
  });

  describe("ensureHooksDir", () => {
    it("creates .husky directory if it does not exist", () => {
      rmSync(join(dir, ".husky"), { recursive: true, force: true });
      const hooksPath = ensureHooksDir(dir);
      expect(existsSync(hooksPath)).toBe(true);
    });

    it("returns existing .husky path without error", () => {
      const hooksPath = ensureHooksDir(dir);
      expect(existsSync(hooksPath)).toBe(true);
    });
  });

  describe("Step 2.8: installer never overwrites existing hook", () => {
    it("preserves original hook content when installing", () => {
      const hooksPath = join(dir, ".husky");
      const hookPath = join(hooksPath, "post-commit");
      const originalContent = "#!/bin/sh\n# My custom hook\necho 'custom hook'\nnpx lint-staged\n";
      writeFileSync(hookPath, originalContent, { mode: 0o755 });

      appendToHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);

      const content = readFileSync(hookPath, "utf-8");
      expect(content).toContain("# My custom hook");
      expect(content).toContain("echo 'custom hook'");
      expect(content).toContain("npx lint-staged");
      expect(content).toContain(SHITEN_HOOK_LINE);
    });

    it("round-trip install/uninstall preserves original content", () => {
      const hooksPath = join(dir, ".husky");
      const hookPath = join(hooksPath, "post-commit");
      const originalContent = "#!/bin/sh\necho 'my hook'\n";
      writeFileSync(hookPath, originalContent, { mode: 0o755 });

      // Install
      appendToHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);
      const afterInstall = readFileSync(hookPath, "utf-8");
      expect(afterInstall).toContain(SHITEN_HOOK_LINE);

      // Uninstall
      removeFromHook(hooksPath, "post-commit", SHITEN_HOOK_LINE);
      const afterUninstall = readFileSync(hookPath, "utf-8");
      expect(afterUninstall).toContain("echo 'my hook'");
      expect(afterUninstall).not.toContain(SHITEN_HOOK_LINE);
    });
  });
});
