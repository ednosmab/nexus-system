import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { generateDigest, type DigestData } from "../commands/digest.js";

let tempDir: string;
let nexusDir: string;
let projectRoot: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "nexus-digest-"));
  nexusDir = join(tempDir, "nexus-system");
  projectRoot = join(tempDir, "project");
  mkdirSync(nexusDir, { recursive: true });
  mkdirSync(projectRoot, { recursive: true });
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function initGit(dir: string) {
  execSync("git init && git config user.email 'test@test.com' && git config user.name 'Test'", {
    cwd: dir,
    stdio: "ignore",
  });
}

function commitFile(dir: string, filename: string, content: string) {
  writeFileSync(join(dir, filename), content);
  execSync(`git add ${filename} && git commit -m "add ${filename}"`, {
    cwd: dir,
    stdio: "ignore",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// generateDigest — structure and logic
// ═══════════════════════════════════════════════════════════════════════════════

describe("generateDigest", () => {
  it("returns valid DigestData structure", () => {
    const digest = generateDigest(projectRoot, nexusDir);

    expect(digest).toHaveProperty("generatedAt");
    expect(digest).toHaveProperty("project");
    expect(digest).toHaveProperty("health");
    expect(digest).toHaveProperty("recentChanges");
    expect(digest).toHaveProperty("knowledgeDebt");
    expect(digest).toHaveProperty("recommendations");

    expect(digest.project).toHaveProperty("name");
    expect(digest.project).toHaveProperty("maturityScore");
    expect(digest.project).toHaveProperty("maturityLevel");

    expect(digest.health).toHaveProperty("overall");
    expect(digest.health).toHaveProperty("issues");

    expect(digest.recentChanges).toHaveProperty("filesModified");
    expect(digest.recentChanges).toHaveProperty("linesAdded");
    expect(digest.recentChanges).toHaveProperty("linesRemoved");
    expect(digest.recentChanges).toHaveProperty("topFiles");
  });

  it("extracts project name from projectRoot path", () => {
    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.project.name).toBe("project");
  });

  it("returns null maturityScore when no profile exists", () => {
    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.project.maturityScore).toBeNull();
    expect(digest.project.maturityLevel).toBe("Unknown");
  });

  it("reads maturityScore from maturity-profile.json", () => {
    writeFileSync(
      join(nexusDir, "maturity-profile.json"),
      JSON.stringify({ overallScore: 62 })
    );

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.project.maturityScore).toBe(62);
    expect(digest.project.maturityLevel).toBe("Mature");
  });

  it("reads knowledge debt from knowledge-debt.json", () => {
    writeFileSync(
      join(nexusDir, "knowledge-debt.json"),
      JSON.stringify({ total: 42 })
    );

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.knowledgeDebt.current).toBe(42);
  });

  it("defaults knowledge debt to 0 when file missing", () => {
    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.knowledgeDebt.current).toBe(0);
  });

  // ── Health determination ─────────────────────────────────────────────────

  it("health is 'good' when no issues", () => {
    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.health.overall).toBe("good");
    expect(digest.health.issues).toEqual([]);
  });

  it("health is 'fair' when one issue (high debt)", () => {
    writeFileSync(
      join(nexusDir, "knowledge-debt.json"),
      JSON.stringify({ total: 60 })
    );

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.health.overall).toBe("fair");
    expect(digest.health.issues).toContain("High knowledge debt");
  });

  it("health is 'needs attention' when multiple issues", () => {
    writeFileSync(
      join(nexusDir, "knowledge-debt.json"),
      JSON.stringify({ total: 60 })
    );

    // Create a git repo with many files changed to trigger "Many files changed today"
    initGit(projectRoot);
    for (let i = 0; i < 25; i++) {
      commitFile(projectRoot, `file-${i}.ts`, `export const x${i} = ${i};`);
    }

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.health.overall).toBe("needs attention");
    expect(digest.health.issues.length).toBeGreaterThanOrEqual(2);
  });

  // ── Knowledge debt trend ────────────────────────────────────────────────

  it("trend is 'stable' when debt <= 30", () => {
    writeFileSync(
      join(nexusDir, "knowledge-debt.json"),
      JSON.stringify({ total: 20 })
    );

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.knowledgeDebt.trend).toBe("stable");
  });

  it("trend is 'increasing' when debt > 30", () => {
    writeFileSync(
      join(nexusDir, "knowledge-debt.json"),
      JSON.stringify({ total: 35 })
    );

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.knowledgeDebt.trend).toBe("increasing");
  });

  // ── Recommendations ─────────────────────────────────────────────────────

  it("recommends audit when debt > 30", () => {
    writeFileSync(
      join(nexusDir, "knowledge-debt.json"),
      JSON.stringify({ total: 40 })
    );

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.recommendations).toContain("Run `nexus audit` to reduce knowledge debt");
  });

  it("recommends assess when no changes detected", () => {
    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.recommendations).toContain(
      "No changes detected today — consider running `nexus assess`"
    );
  });

  it("recommends foundation practices when maturity < 50", () => {
    writeFileSync(
      join(nexusDir, "maturity-profile.json"),
      JSON.stringify({ overallScore: 30 })
    );

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.recommendations).toContain(
      "Project is in early maturity — focus on foundation practices"
    );
  });

  it("recommends 'healthy' when no issues and changes exist", () => {
    initGit(projectRoot);
    commitFile(projectRoot, "index.ts", "export const x = 1;");

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.recommendations).toContain("Project is healthy — continue current practices");
  });

  // ── Recent changes (with git) ───────────────────────────────────────────

  it("detects recent git changes", () => {
    initGit(projectRoot);
    commitFile(projectRoot, "index.ts", "export const x = 1;");

    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.recentChanges.filesModified).toBeGreaterThanOrEqual(1);
    expect(digest.recentChanges.linesAdded).toBeGreaterThanOrEqual(1);
  });

  it("returns zero changes when no git repo", () => {
    const digest = generateDigest(projectRoot, nexusDir);
    expect(digest.recentChanges.filesModified).toBe(0);
    expect(digest.recentChanges.linesAdded).toBe(0);
    expect(digest.recentChanges.linesRemoved).toBe(0);
    expect(digest.recentChanges.topFiles).toEqual([]);
  });
});
