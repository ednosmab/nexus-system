/**
 * sinks.ts — Taint Sink Definitions
 *
 * Sinks are dangerous execution points where tainted data can cause
 * security vulnerabilities (code injection, command injection, etc.).
 */

import type { TaintSinkDef, TaintIssueType } from "./types.js";

/** Code execution sinks */
export const CODE_EXECUTION_SINKS: TaintSinkDef[] = [
  { name: "eval", kind: "call", severity: 3, issueType: "code_injection", description: "eval() — Code execution" },
  { name: "Function", kind: "call", severity: 3, issueType: "code_injection", description: "Function() — Dynamic function creation" },
  { name: "new Function", kind: "call", severity: 3, issueType: "code_injection", description: "new Function() — Dynamic function creation" },
  { name: "setTimeout", kind: "call", severity: 2, issueType: "code_injection", description: "setTimeout(string) — Delayed code execution" },
  { name: "setInterval", kind: "call", severity: 2, issueType: "code_injection", description: "setInterval(string) — Repeated code execution" },
];

/** Command execution sinks */
export const COMMAND_EXECUTION_SINKS: TaintSinkDef[] = [
  { name: "exec", kind: "call", severity: 3, issueType: "command_injection", description: "exec() — Shell command execution" },
  { name: "execSync", kind: "call", severity: 3, issueType: "command_injection", description: "execSync() — Synchronous shell execution" },
  { name: "spawn", kind: "call", severity: 2, issueType: "command_injection", description: "spawn() — Process spawning" },
  { name: "spawnSync", kind: "call", severity: 2, issueType: "command_injection", description: "spawnSync() — Synchronous process spawning" },
  { name: "execFile", kind: "call", severity: 2, issueType: "command_injection", description: "execFile() — File execution" },
  { name: "child_process.exec", kind: "call", severity: 3, issueType: "command_injection", description: "child_process.exec() — Shell execution" },
];

/** Path traversal sinks */
export const PATH_SINKS: TaintSinkDef[] = [
  { name: "readFile", kind: "call", severity: 2, issueType: "path_traversal", description: "fs.readFile() — File read with dynamic path" },
  { name: "readFileSync", kind: "call", severity: 2, issueType: "path_traversal", description: "fs.readFileSync() — File read with dynamic path" },
  { name: "writeFile", kind: "call", severity: 2, issueType: "path_traversal", description: "fs.writeFile() — File write with dynamic path" },
  { name: "writeFileSync", kind: "call", severity: 2, issueType: "path_traversal", description: "fs.writeFileSync() — File write with dynamic path" },
  { name: "unlink", kind: "call", severity: 2, issueType: "path_traversal", description: "fs.unlink() — File deletion with dynamic path" },
  { name: "createReadStream", kind: "call", severity: 2, issueType: "path_traversal", description: "fs.createReadStream() — Stream with dynamic path" },
];

/** SQL injection sinks */
export const SQL_SINKS: TaintSinkDef[] = [
  { name: "query", kind: "call", severity: 3, issueType: "sql_injection", description: "db.query() — SQL query with dynamic input" },
  { name: "execute", kind: "call", severity: 3, issueType: "sql_injection", description: "db.execute() — SQL execution with dynamic input" },
  { name: "raw", kind: "call", severity: 3, issueType: "sql_injection", description: "knex.raw() — Raw SQL query" },
];

/** XSS sinks */
export const XSS_SINKS: TaintSinkDef[] = [
  { name: "innerHTML", kind: "property", severity: 3, issueType: "xss_risk", description: "innerHTML — Direct HTML insertion" },
  { name: "dangerouslySetInnerHTML", kind: "property", severity: 3, issueType: "xss_risk", description: "dangerouslySetInnerHTML — React HTML insertion" },
  { name: "document.write", kind: "call", severity: 3, issueType: "xss_risk", description: "document.write() — Direct document write" },
  { name: "outerHTML", kind: "property", severity: 3, issueType: "xss_risk", description: "outerHTML — Direct HTML replacement" },
];

/** Redirect sinks */
export const REDIRECT_SINKS: TaintSinkDef[] = [
  { name: "redirect", kind: "call", severity: 2, issueType: "open_redirect", description: "res.redirect() — HTTP redirect with dynamic URL" },
  { name: "location.href", kind: "property", severity: 2, issueType: "open_redirect", description: "location.href — Browser redirect" },
  { name: "window.open", kind: "call", severity: 2, issueType: "open_redirect", description: "window.open() — Window open with dynamic URL" },
];

/** Log injection sinks */
export const LOG_SINKS: TaintSinkDef[] = [
  { name: "logger.info", kind: "call", severity: 1, issueType: "log_injection", description: "logger.info() — Log with dynamic input" },
  { name: "logger.warn", kind: "call", severity: 1, issueType: "log_injection", description: "logger.warn() — Log with dynamic input" },
  { name: "logger.error", kind: "call", severity: 1, issueType: "log_injection", description: "logger.error() — Log with dynamic input" },
  { name: "console.log", kind: "call", severity: 1, issueType: "log_injection", description: "console.log() — Log with dynamic input" },
];

/** SSRF sinks (OWASP A01 — Server-Side Request Forgery) */
export const SSRF_SINKS: TaintSinkDef[] = [
  { name: "fetch", kind: "call", severity: 3, issueType: "ssrf", description: "fetch() — HTTP request with dynamic URL" },
  { name: "axios", kind: "call", severity: 3, issueType: "ssrf", description: "axios() — HTTP request with dynamic URL" },
  { name: "axios.get", kind: "call", severity: 3, issueType: "ssrf", description: "axios.get() — HTTP request with dynamic URL" },
  { name: "axios.post", kind: "call", severity: 3, issueType: "ssrf", description: "axios.post() — HTTP request with dynamic URL" },
  { name: "request", kind: "call", severity: 2, issueType: "ssrf", description: "request() — HTTP request with dynamic URL" },
  { name: "http.get", kind: "call", severity: 2, issueType: "ssrf", description: "http.get() — HTTP request with dynamic URL" },
  { name: "https.get", kind: "call", severity: 2, issueType: "ssrf", description: "https.get() — HTTP request with dynamic URL" },
  { name: "http.request", kind: "call", severity: 2, issueType: "ssrf", description: "http.request() — HTTP request with dynamic URL" },
  { name: "https.request", kind: "call", severity: 2, issueType: "ssrf", description: "https.request() — HTTP request with dynamic URL" },
  { name: "got", kind: "call", severity: 2, issueType: "ssrf", description: "got() — HTTP request with dynamic URL" },
  { name: "node-fetch", kind: "call", severity: 2, issueType: "ssrf", description: "node-fetch() — HTTP request with dynamic URL" },
  { name: "undici", kind: "call", severity: 3, issueType: "ssrf", description: "undici.fetch() — HTTP request with dynamic URL (Node 18+)" },
  { name: "undici.fetch", kind: "call", severity: 3, issueType: "ssrf", description: "undici.fetch() — HTTP request with dynamic URL" },
  { name: "undici.request", kind: "call", severity: 2, issueType: "ssrf", description: "undici.request() — HTTP request with dynamic URL" },
  { name: "undici.get", kind: "call", severity: 2, issueType: "ssrf", description: "undici.get() — HTTP request with dynamic URL" },
  { name: "undici.post", kind: "call", severity: 2, issueType: "ssrf", description: "undici.post() — HTTP request with dynamic URL" },
];

/** All sinks combined */
export const ALL_SINKS: TaintSinkDef[] = [
  ...CODE_EXECUTION_SINKS,
  ...COMMAND_EXECUTION_SINKS,
  ...PATH_SINKS,
  ...SQL_SINKS,
  ...XSS_SINKS,
  ...REDIRECT_SINKS,
  ...LOG_SINKS,
  ...SSRF_SINKS,
];

/** Check if a function/property name matches any taint sink */
export function findTaintSink(name: string): TaintSinkDef | undefined {
  return ALL_SINKS.find((s) => s.name === name);
}

/** Get all sink names for quick lookup */
export function getSinkNames(): Set<string> {
  return new Set(ALL_SINKS.map((s) => s.name));
}

/** Get sinks by issue type */
export function getSinksByType(issueType: TaintIssueType): TaintSinkDef[] {
  return ALL_SINKS.filter((s) => s.issueType === issueType);
}
