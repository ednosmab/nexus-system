import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { computeKeyChecksums, getCached, setCache, invalidateCache, ShitenCache } from "../cache.js";

let tempDir: string;
let shitenDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "shiten-cache-test-"));
  shitenDir = join(tempDir, "shitenno-go");
  mkdirSync(shitenDir, { recursive: true });
  // Create a minimal package.json so computeKeyChecksums can hash it
  writeFileSync(join(tempDir, "package.json"), JSON.stringify({ name: "test" }));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ── computeKeyChecksums ─────────────────────────────────────────────────────

describe("computeKeyChecksums", () => {
  it("returns a checksums object with expected keys", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    expect(checksums).toHaveProperty("shitenno-go/");
    expect(checksums).toHaveProperty("package.json");
  });

  it("returns 'missing' for non-existent shitenno-go/", () => {
    const missingDir = join(tempDir, "nonexistent");
    const checksums = computeKeyChecksums(tempDir, missingDir);
    expect(checksums["shitenno-go/"]).toBe("missing");
  });

  it("returns consistent checksums for same content", () => {
    const c1 = computeKeyChecksums(tempDir, shitenDir);
    const c2 = computeKeyChecksums(tempDir, shitenDir);
    expect(c1).toEqual(c2);
  });

  it("changes checksum when shitenno-go/ content changes", () => {
    const c1 = computeKeyChecksums(tempDir, shitenDir);
    writeFileSync(join(shitenDir, "new-file.md"), "# New file");
    const c2 = computeKeyChecksums(tempDir, shitenDir);
    expect(c1["shitenno-go/"]).not.toBe(c2["shitenno-go/"]);
  });
});

// ── setCache / getCached ────────────────────────────────────────────────────

describe("setCache and getCached", () => {
  it("stores and retrieves a cache entry", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    const data = { score: 85, level: "pleno" };

    setCache(tempDir, shitenDir, "complexity", data, checksums);
    const result = getCached<typeof data>(tempDir, shitenDir, "complexity", () =>
      computeKeyChecksums(tempDir, shitenDir)
    );

    expect(result).toEqual(data);
  });

  it("returns null on cache miss (no cache file)", () => {
    const result = getCached(tempDir, shitenDir, "complexity", () =>
      computeKeyChecksums(tempDir, shitenDir)
    );
    expect(result).toBeNull();
  });

  it("returns null when checksums changed", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    setCache(tempDir, shitenDir, "complexity", { score: 85 }, checksums);

    // Change the shitenno-go/ content
    writeFileSync(join(shitenDir, "changed.md"), "changed");

    const result = getCached(tempDir, shitenDir, "complexity", () =>
      computeKeyChecksums(tempDir, shitenDir)
    );
    expect(result).toBeNull();
  });

  it("returns null for different cache key", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    setCache(tempDir, shitenDir, "complexity", { score: 85 }, checksums);

    const result = getCached(tempDir, shitenDir, "health", () =>
      computeKeyChecksums(tempDir, shitenDir)
    );
    expect(result).toBeNull();
  });

  it("overwrites existing entry for same key", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    setCache(tempDir, shitenDir, "complexity", { score: 50 }, checksums);
    setCache(tempDir, shitenDir, "complexity", { score: 90 }, checksums);

    const result = getCached(tempDir, shitenDir, "complexity", () =>
      computeKeyChecksums(tempDir, shitenDir)
    );
    expect(result).toEqual({ score: 90 });
  });

  it("stores multiple keys independently", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    setCache(tempDir, shitenDir, "complexity", { score: 85 }, checksums);
    setCache(tempDir, shitenDir, "patterns", { patterns: [] }, checksums);
    setCache(tempDir, shitenDir, "health", { healthScore: 90 }, checksums);

    expect(getCached(tempDir, shitenDir, "complexity", () => computeKeyChecksums(tempDir, shitenDir))).toEqual({ score: 85 });
    expect(getCached(tempDir, shitenDir, "patterns", () => computeKeyChecksums(tempDir, shitenDir))).toEqual({ patterns: [] });
    expect(getCached(tempDir, shitenDir, "health", () => computeKeyChecksums(tempDir, shitenDir))).toEqual({ healthScore: 90 });
  });

  it("writes a valid cache file to disk", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    setCache(tempDir, shitenDir, "complexity", { score: 85 }, checksums);

    const cachePath = join(tempDir, ".shiten-cache.json");
    expect(existsSync(cachePath)).toBe(true);

    const raw = JSON.parse(readFileSync(cachePath, "utf-8")) as ShitenCache;
    expect(raw.version).toBe(1);
    expect(raw.complexity).toBeDefined();
  });
});

// ── invalidateCache ─────────────────────────────────────────────────────────

describe("invalidateCache", () => {
  it("removes entire cache file when no key specified", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    setCache(tempDir, shitenDir, "complexity", { score: 85 }, checksums);
    expect(existsSync(join(tempDir, ".shiten-cache.json"))).toBe(true);

    invalidateCache(tempDir);
    expect(existsSync(join(tempDir, ".shiten-cache.json"))).toBe(false);
  });

  it("removes only the specified key", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    setCache(tempDir, shitenDir, "complexity", { score: 85 }, checksums);
    setCache(tempDir, shitenDir, "health", { score: 90 }, checksums);

    invalidateCache(tempDir, "complexity");

    expect(getCached(tempDir, shitenDir, "complexity", () => computeKeyChecksums(tempDir, shitenDir))).toBeNull();
    expect(getCached(tempDir, shitenDir, "health", () => computeKeyChecksums(tempDir, shitenDir))).toEqual({ score: 90 });
  });

  it("does nothing when no cache exists", () => {
    // Should not throw
    invalidateCache(tempDir);
    expect(existsSync(join(tempDir, ".shiten-cache.json"))).toBe(false);
  });

  it("does nothing when key does not exist in cache", () => {
    const checksums = computeKeyChecksums(tempDir, shitenDir);
    setCache(tempDir, shitenDir, "complexity", { score: 85 }, checksums);

    // Invalidate a key that was never set
    invalidateCache(tempDir, "health");

    // Complexity should still be there
    expect(getCached(tempDir, shitenDir, "complexity", () => computeKeyChecksums(tempDir, shitenDir))).toEqual({ score: 85 });
  });
});

// ── Corrupted cache ─────────────────────────────────────────────────────────

describe("corrupted cache handling", () => {
  it("returns null for corrupted JSON", () => {
    writeFileSync(join(tempDir, ".shiten-cache.json"), "not valid json {{{");
    const result = getCached(tempDir, shitenDir, "complexity", () =>
      computeKeyChecksums(tempDir, shitenDir)
    );
    expect(result).toBeNull();
  });

  it("returns null for wrong version", () => {
    writeFileSync(
      join(tempDir, ".shiten-cache.json"),
      JSON.stringify({ version: 99, projectRoot: tempDir })
    );
    const result = getCached(tempDir, shitenDir, "complexity", () =>
      computeKeyChecksums(tempDir, shitenDir)
    );
    expect(result).toBeNull();
  });
});
