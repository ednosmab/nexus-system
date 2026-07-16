/**
 * collect-source-files.test.ts — Regression tests for collectSourceFiles
 *
 * Bug #1: index.ts files must NOT be excluded from security scanning
 * Bug #2: .tsx, .js, .jsx, .vue, .svelte files must be scanned (was .ts only)
 * Bug #3: Monorepo paths (packages/&#42;/src, apps/&#42;/src) must be scanned (was src/ only)
 * Bug #4: __tests__/ directories must be excluded from scanning
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectSourceFiles } from "../audit/shared.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "collect-src-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ── Bug #1: index.ts files must be scanned ───────────────────────────────

describe("collectSourceFiles — Bug #1: index.ts scanning", () => {
  it("includes index.ts files in scan results", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "index.ts"),
      'export const SECRET = "hardcoded-key-123";'
    );

    const files = collectSourceFiles(tempDir);
    const indexFile = files.find((f) => f.basename === "index");
    expect(indexFile).toBeDefined();
    expect(indexFile!.content).toContain("SECRET");
  });

  it("does not exclude index.ts from security scanning", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "index.ts"),
      'const API_KEY = "sk-test-1234567890abcdef";'
    );

    const files = collectSourceFiles(tempDir);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files.some((f) => f.basename === "index")).toBe(true);
  });
});

// ── Bug #2: .tsx and other extensions must be scanned ─────────────────────

describe("collectSourceFiles — Bug #2: extension support", () => {
  it("includes .tsx files in scan results", () => {
    mkdirSync(join(tempDir, "src", "components"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "components", "Button.tsx"),
      'export const DB_PASSWORD = "supersecret";'
    );

    const files = collectSourceFiles(tempDir);
    const tsxFile = files.find((f) => f.relPath.includes("Button.tsx"));
    expect(tsxFile).toBeDefined();
    expect(tsxFile!.content).toContain("DB_PASSWORD");
  });

  it("includes .js files in scan results", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "legacy.js"),
      'var password = "plaintext123";'
    );

    const files = collectSourceFiles(tempDir);
    const jsFile = files.find((f) => f.relPath.includes("legacy.js"));
    expect(jsFile).toBeDefined();
  });

  it("includes .jsx files in scan results", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "App.jsx"),
      'const token = "ghp_test123456789012345678901234567890";'
    );

    const files = collectSourceFiles(tempDir);
    const jsxFile = files.find((f) => f.relPath.includes("App.jsx"));
    expect(jsxFile).toBeDefined();
  });

  it("includes .vue files in scan results", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "Widget.vue"),
      "<template><div>test</div></template>"
    );

    const files = collectSourceFiles(tempDir);
    const vueFile = files.find((f) => f.relPath.includes("Widget.vue"));
    expect(vueFile).toBeDefined();
  });

  it("includes .svelte files in scan results", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "Counter.svelte"),
      "<script>let count = 0;</script>"
    );

    const files = collectSourceFiles(tempDir);
    const svelteFile = files.find((f) => f.relPath.includes("Counter.svelte"));
    expect(svelteFile).toBeDefined();
  });

  it("still excludes .test.ts files", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(join(tempDir, "src", "utils.test.ts"), 'test("dummy", () => {})');
    writeFileSync(join(tempDir, "src", "utils.ts"), 'export const x = 1;');

    const files = collectSourceFiles(tempDir);
    expect(files.some((f) => f.relPath.includes("utils.test.ts"))).toBe(false);
    expect(files.some((f) => f.relPath === "src/utils.ts")).toBe(true);
  });

  it("still excludes .bench.ts files", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(join(tempDir, "src", "perf.bench.ts"), 'bench("dummy", () => {})');
    writeFileSync(join(tempDir, "src", "real.ts"), 'export const x = 1;');

    const files = collectSourceFiles(tempDir);
    expect(files.some((f) => f.relPath.includes("perf.bench.ts"))).toBe(false);
    expect(files.some((f) => f.relPath === "src/real.ts")).toBe(true);
  });
});

// ── Bug #3: monorepo paths must be scanned ────────────────────────────────

describe("collectSourceFiles — Bug #3: monorepo support", () => {
  it("scans files in packages/*/src", () => {
    mkdirSync(join(tempDir, "packages", "foo", "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "packages", "foo", "src", "lib.ts"),
      'const SECRET_KEY = "hardcoded-in-monorepo";'
    );

    const files = collectSourceFiles(tempDir);
    const libFile = files.find((f) => f.relPath.includes("packages/foo/src/lib.ts"));
    expect(libFile).toBeDefined();
    expect(libFile!.content).toContain("SECRET_KEY");
  });

  it("scans files in apps/*/src", () => {
    mkdirSync(join(tempDir, "apps", "web", "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "apps", "web", "src", "App.tsx"),
      'const API_KEY = "sk-live-12345";'
    );

    const files = collectSourceFiles(tempDir);
    const appFile = files.find((f) => f.relPath.includes("apps/web/src/App.tsx"));
    expect(appFile).toBeDefined();
  });

  it("does not scan node_modules", () => {
    mkdirSync(join(tempDir, "node_modules", "pkg"), { recursive: true });
    writeFileSync(join(tempDir, "node_modules", "pkg", "index.ts"), 'export const x = 1;');
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(join(tempDir, "src", "main.ts"), 'export const y = 2;');

    const files = collectSourceFiles(tempDir);
    expect(files.some((f) => f.relPath.includes("node_modules"))).toBe(false);
    expect(files.some((f) => f.relPath === "src/main.ts")).toBe(true);
  });
});

// ── Bug #4: __tests__ exclusion ───────────────────────────────────────────

describe("collectSourceFiles — Bug #4: __tests__ exclusion", () => {
  it("excludes files inside __tests__ directories", () => {
    mkdirSync(join(tempDir, "src", "__tests__"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "__tests__", "helper.ts"),
      'export const mockSecret = "test-only";'
    );
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(join(tempDir, "src", "real.ts"), 'export const x = 1;');

    const files = collectSourceFiles(tempDir);
    expect(files.some((f) => f.relPath.includes("__tests__"))).toBe(false);
    expect(files.some((f) => f.relPath === "src/real.ts")).toBe(true);
  });

  it("excludes test infrastructure fixtures without .test. in name", () => {
    mkdirSync(join(tempDir, "src", "__tests__", "fixtures"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "__tests__", "fixtures", "mock-data.ts"),
      'export const fixture = "data";'
    );

    const files = collectSourceFiles(tempDir);
    expect(files.some((f) => f.relPath.includes("__tests__"))).toBe(false);
  });
});

// ── SourceFileInfo shape ──────────────────────────────────────────────────

describe("collectSourceFiles — SourceFileInfo shape", () => {
  it("populates relPath, basename, content, and lineCount correctly", () => {
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(
      join(tempDir, "src", "component.tsx"),
      "line1\nline2\nline3\n"
    );

    const files = collectSourceFiles(tempDir);
    const file = files.find((f) => f.relPath.includes("component.tsx"));
    expect(file).toBeDefined();
    expect(file!.relPath).toBe("src/component.tsx");
    expect(file!.basename).toBe("component");
    expect(file!.lineCount).toBe(4); // 3 content lines + 1 trailing newline
  });
});
