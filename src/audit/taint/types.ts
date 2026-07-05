/**
 * types.ts — Type definitions for Taint Analysis
 *
 * Taint analysis tracks untrusted data from sources to sinks,
 * detecting security vulnerabilities in the data flow.
 */

/** A node in the data flow graph */
export interface TaintNode {
  id: string;
  kind: "source" | "sink" | "sanitizer" | "assignment" | "parameter" | "return" | "property";
  variableName?: string;
  sourceFile: string;
  line: number;
  column: number;
  text: string;
}

/** An edge in the data flow graph */
export interface TaintEdge {
  from: string;
  to: string;
  kind: "assignment" | "parameter" | "return" | "property" | "spread";
}

/** A path from source to sink through the data flow graph */
export interface TaintPath {
  source: TaintNode;
  sink: TaintNode;
  sanitizers: TaintNode[];
  path: TaintNode[];
  isSanitized: boolean;
}

/** A detected taint issue */
export interface TaintIssue {
  type: TaintIssueType;
  severity: 1 | 2 | 3;
  description: string;
  location: string;
  sourceType: string;
  sinkType: string;
  isSanitized: boolean;
  recommendation: string;
}

/** Types of taint issues */
export type TaintIssueType =
  | "tainted_input"
  | "open_redirect"
  | "ssrf"
  | "log_injection"
  | "code_injection"
  | "command_injection"
  | "path_traversal"
  | "sql_injection"
  | "xss_risk";

/** Source definition */
export interface TaintSourceDef {
  pattern: string | RegExp;
  kind: "property" | "global" | "call" | "parameter";
  description: string;
}

/** Sink definition */
export interface TaintSinkDef {
  name: string;
  kind: "call" | "property" | "tag";
  severity: 1 | 2 | 3;
  issueType: TaintIssueType;
  description: string;
}

/** Sanitizer definition */
export interface TaintSanitizerDef {
  name: string;
  kind: "call" | "type";
  description: string;
}
