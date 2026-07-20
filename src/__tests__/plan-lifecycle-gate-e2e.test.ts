import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

vi.mock("../plan-lifecycle.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../plan-lifecycle.js")>();
  return { ...actual, checkBuild: vi.fn(), checkTests: vi.fn(), checkLint: vi.fn(), checkGateIntegrity: vi.fn() };
});

import { MarkdownPlanEngine } from "../markdown-plan-engine.js";
import { runAutoVerification, checkBuild, checkTests, checkLint, checkGateIntegrity } from "../plan-lifecycle.js";

describe("Bloco F — gate de done, caso positivo, negativo e invalidação por diffHash", () => {
  let dir: string;
  let shitennoDir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `shugo-gate-e2e-${Date.now()}`);
    shitennoDir = join(dir, ".shitenno");
    mkdirSync(shitennoDir, { recursive: true });
    execSync("git init -q", { cwd: dir });
    execSync("git config user.email 'test@test.com'", { cwd: dir });
    execSync("git config user.name 'Test'", { cwd: dir });
    writeFileSync(join(dir, "app.ts"), "export const version = 1;\n");
    execSync("git add -A && git commit -q -m init", { cwd: dir });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("caso positivo: build+test+lint passam → done/ com sidecar co-localizado e diffHash consistente", () => {
    (checkBuild as any).mockReturnValue({ name: "BUILD", passed: true, message: "ok" });
    (checkTests as any).mockReturnValue({ name: "TESTS", passed: true, message: "ok" });
    (checkLint as any).mockReturnValue({ name: "LINT", passed: true, message: "ok" });
    (checkGateIntegrity as any).mockReturnValue({ name: "GATE_SELF_TEST", passed: true, message: "ok" });
    writeFileSync(join(dir, "app.ts"), "export const version = 2;\n");

    const engine = new MarkdownPlanEngine(shitennoDir);
    const plan = engine.create({ title: "Plano de teste — caso positivo" });
    engine.updateStatus(plan.id, "check");

    const record = runAutoVerification(shitennoDir, dir, plan.id);
    const expectedDiff = execSync(`git diff HEAD -- . ':!.shitenno/governance/plans'`, { cwd: dir, encoding: "utf-8" });
    const expectedHash = createHash("sha256").update(expectedDiff).digest("hex");

    const doneMd = join(shitennoDir, "governance", "plans", "done", `${plan.id}.md`);
    const doneJson = join(shitennoDir, "governance", "plans", "done", `${plan.id}.verification.json`);
    expect(existsSync(doneMd)).toBe(true);
    expect(existsSync(doneJson)).toBe(true);
    expect(record.checks.map((c) => c.name)).toEqual(expect.arrayContaining(["BUILD", "TESTS", "LINT", "GATE_SELF_TEST"]));
    expect(record.passed).toBe(true);
    expect(record.diffHash).toBe(expectedHash);
  });

  it("caso negativo: um check falha → blocked, NÃO vai para done/, sidecar não existe", () => {
    (checkBuild as any).mockReturnValue({ name: "BUILD", passed: true, message: "ok" });
    (checkTests as any).mockReturnValue({ name: "TESTS", passed: false, message: "1 teste falhou" });
    (checkLint as any).mockReturnValue({ name: "LINT", passed: true, message: "ok" });
    (checkGateIntegrity as any).mockReturnValue({ name: "GATE_SELF_TEST", passed: true, message: "ok" });

    const engine = new MarkdownPlanEngine(shitennoDir);
    const plan = engine.create({ title: "Plano de teste — caso negativo" });
    engine.updateStatus(plan.id, "check");

    const record = runAutoVerification(shitennoDir, dir, plan.id);

    expect(record.passed).toBe(false);
    expect(engine.getById(plan.id)!.status).toBe("blocked");
    expect(existsSync(join(shitennoDir, "governance", "plans", "done", `${plan.id}.md`))).toBe(false);
    expect(existsSync(join(shitennoDir, "governance", "plans", "done", `${plan.id}.verification.json`))).toBe(false);
  });

  it("caso de invalidação: código muda depois da verificação → diffHash staged não bate mais", () => {
    (checkBuild as any).mockReturnValue({ name: "BUILD", passed: true, message: "ok" });
    (checkTests as any).mockReturnValue({ name: "TESTS", passed: true, message: "ok" });
    (checkLint as any).mockReturnValue({ name: "LINT", passed: true, message: "ok" });
    (checkGateIntegrity as any).mockReturnValue({ name: "GATE_SELF_TEST", passed: true, message: "ok" });

    const engine = new MarkdownPlanEngine(shitennoDir);
    const plan = engine.create({ title: "Plano de teste — invalidação por diffHash" });
    engine.updateStatus(plan.id, "check");
    writeFileSync(join(dir, "app.ts"), "export const version = 2;\n");

    const record = runAutoVerification(shitennoDir, dir, plan.id);

    writeFileSync(join(dir, "app.ts"), "export const version = 3;\n");
    execSync("git add -A", { cwd: dir });
    const stagedDiff = execSync(`git diff --cached HEAD -- . ':!.shitenno/governance/plans'`, { cwd: dir, encoding: "utf-8" });
    const stagedHash = createHash("sha256").update(stagedDiff).digest("hex");

    expect(stagedHash).not.toBe(record.diffHash);
  });
});
