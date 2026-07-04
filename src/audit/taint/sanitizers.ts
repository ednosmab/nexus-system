/**
 * sanitizers.ts — Taint Sanitizer Definitions
 *
 * Sanitizers are functions that clean or validate tainted data,
 * making it safe to use in sinks.
 */

import type { TaintSanitizerDef } from "./types.js";

/** Type conversion sanitizers */
export const TYPE_SANITIZERS: TaintSanitizerDef[] = [
  { name: "parseInt", kind: "call", description: "parseInt() — Converts to integer" },
  { name: "parseFloat", kind: "call", description: "parseFloat() — Converts to float" },
  { name: "Number", kind: "call", description: "Number() — Converts to number" },
  { name: "String", kind: "call", description: "String() — Converts to string" },
  { name: "Boolean", kind: "call", description: "Boolean() — Converts to boolean" },
  { name: "Array.isArray", kind: "call", description: "Array.isArray() — Type check" },
  { name: "typeof", kind: "type", description: "typeof — Type check" },
];

/** Validation sanitizers (schema validation) */
export const VALIDATION_SANITIZERS: TaintSanitizerDef[] = [
  { name: "zod.parse", kind: "call", description: "zod.parse() — Schema validation" },
  { name: "zod.safeParse", kind: "call", description: "zod.safeParse() — Safe schema validation" },
  { name: "joi.validate", kind: "call", description: "joi.validate() — Schema validation" },
  { name: "ajv.validate", kind: "call", description: "ajv.validate() — JSON Schema validation" },
  { name: "yup.validate", kind: "call", description: "yup.validate() — Schema validation" },
  { name: "superstruct.is", kind: "call", description: "superstruct.is() — Type validation" },
];

/** Encoding sanitizers */
export const ENCODING_SANITIZERS: TaintSanitizerDef[] = [
  { name: "encodeURIComponent", kind: "call", description: "encodeURIComponent() — URL encoding" },
  { name: "encodeURI", kind: "call", description: "encodeURI() — URI encoding" },
  { name: "escape", kind: "call", description: "escape() — String escaping" },
  { name: "he.escape", kind: "call", description: "he.escape() — HTML entity escaping" },
  { name: "dompurify.sanitize", kind: "call", description: "DOMPurify.sanitize() — HTML sanitization" },
];

/** Path sanitizers */
export const PATH_SANITIZERS: TaintSanitizerDef[] = [
  { name: "path.resolve", kind: "call", description: "path.resolve() — Path resolution" },
  { name: "path.join", kind: "call", description: "path.join() — Path joining" },
  { name: "path.normalize", kind: "call", description: "path.normalize() — Path normalization" },
  { name: "path.basename", kind: "call", description: "path.basename() — Extract filename" },
  { name: "path.extname", kind: "call", description: "path.extname() — Extract extension" },
];

/** All sanitizers combined */
export const ALL_SANITIZERS: TaintSanitizerDef[] = [
  ...TYPE_SANITIZERS,
  ...VALIDATION_SANITIZERS,
  ...ENCODING_SANITIZERS,
  ...PATH_SANITIZERS,
];

/** Check if a function name is a known sanitizer */
export function isSanitizer(name: string): TaintSanitizerDef | undefined {
  return ALL_SANITIZERS.find((s) => s.name === name);
}

/** Get all sanitizer names for quick lookup */
export function getSanitizerNames(): Set<string> {
  return new Set(ALL_SANITIZERS.map((s) => s.name));
}
