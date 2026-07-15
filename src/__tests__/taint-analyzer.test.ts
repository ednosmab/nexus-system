import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaintAnalyzer } from "../audit/taint/index.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "shiten-taint-"));
});

afterEach(() => {
  TaintAnalyzer.clearCache();
  rmSync(tempDir, { recursive: true, force: true });
});

/**
 * Set up a taint test fixture: creates directories, tsconfig.json, and writes
 * the given code to a file in src/. Returns the analyzer ready to run.
 */
function setupTaintFixture(fileName: string, code: string): TaintAnalyzer {
  mkdirSync(join(tempDir, "src", "commands"), { recursive: true });
  writeFileSync(join(tempDir, "src", "commands", "dummy.ts"), "# dummy");
  mkdirSync(join(tempDir, "src", "__tests__"), { recursive: true });
  writeFileSync(join(tempDir, "src", "__tests__", "dummy.test.ts"), "# dummy test");

  writeFileSync(
    join(tempDir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["src/**/*.ts"],
      exclude: ["node_modules", "__tests__", "dist"],
    })
  );

  writeFileSync(join(tempDir, "src", fileName), code);
  return new TaintAnalyzer({ projectRoot: tempDir });
}

describe("TaintAnalyzer", () => {
  it("detects path_traversal and code_injection from process.argv", () => {
    const analyzer = setupTaintFixture("taint-fixture.ts", [
      "const userInput = process.argv[2];",
      "const path = userInput;",
      'import { readFileSync } from "node:fs";',
      "readFileSync(path);",
      "eval(userInput);",
    ].join("\n"));
    const issues = analyzer.analyze();

    expect(issues.filter((i) => i.type === "path_traversal").length).toBeGreaterThanOrEqual(1);
    expect(issues.filter((i) => i.type === "code_injection").length).toBeGreaterThanOrEqual(1);
  });

  it("detects tainted input from process.env", () => {
    const analyzer = setupTaintFixture("env-fixture.ts", [
      "const secret = process.env.API_KEY;",
      "eval(secret);",
    ].join("\n"));
    const issues = analyzer.analyze();

    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues.filter((i) => i.type === "code_injection").length).toBeGreaterThanOrEqual(1);
  });

  it("detects taint flow through string concatenation (+ operator)", () => {
    const analyzer = setupTaintFixture("concat-fixture.ts", [
      'const url = "https://" + req.query.domain;',
      "fetch(url);",
    ].join("\n"));
    const issues = analyzer.analyze();

    expect(issues.filter((i) => i.type === "ssrf").length).toBeGreaterThanOrEqual(1);
  });

  it("detects taint flow through template literal", () => {
    const analyzer = setupTaintFixture("template-fixture.ts", [
      "const url = `https://${req.query.domain}/api`;",
      "fetch(url);",
    ].join("\n"));
    const issues = analyzer.analyze();

    expect(issues.filter((i) => i.type === "ssrf").length).toBeGreaterThanOrEqual(1);
  });

  it("detects taint flow through subproperty access (req.query.cmd)", () => {
    const analyzer = setupTaintFixture("subprop-fixture.ts", [
      "const cmd = req.query.cmd;",
      "exec(cmd);",
    ].join("\n"));
    const issues = analyzer.analyze();

    expect(issues.filter((i) => i.type === "command_injection").length).toBeGreaterThanOrEqual(1);
  });

  it("detects SSRF via fetch with tainted URL", () => {
    const analyzer = setupTaintFixture("ssrf-fixture.ts", [
      "const url = req.body.url;",
      "fetch(url);",
    ].join("\n"));
    const issues = analyzer.analyze();

    const ssrfIssues = issues.filter((i) => i.type === "ssrf");
    expect(ssrfIssues.length).toBeGreaterThanOrEqual(1);
    expect(ssrfIssues[0]!.sinkType).toBe("fetch");
  });

  it("detects SSRF via http.get with tainted URL", () => {
    const analyzer = setupTaintFixture("ssrf-http-fixture.ts", [
      "const target = req.body.target;",
      "http.get(target);",
    ].join("\n"));
    const issues = analyzer.analyze();

    expect(issues.filter((i) => i.type === "ssrf").length).toBeGreaterThanOrEqual(1);
  });

  it("detects SSRF via undici with tainted URL", () => {
    const analyzer = setupTaintFixture("ssrf-undici-fixture.ts", [
      "const target = req.body.url;",
      "undici.fetch(target);",
    ].join("\n"));
    const issues = analyzer.analyze();

    expect(issues.filter((i) => i.type === "ssrf").length).toBeGreaterThanOrEqual(1);
  });

  it("reports zero issues for clean code", () => {
    const analyzer = setupTaintFixture("clean.ts", [
      "const x = 42;",
      "const y = x + 1;",
      "console.log(y);",
    ].join("\n"));
    const issues = analyzer.analyze();

    expect(issues.length).toBe(0);
  });
});
