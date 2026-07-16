/**
 * path-safety.ts — Path Traversal Prevention Utilities
 *
 * Provides functions to validate that user-supplied paths
 * stay within expected directory boundaries.
 */

import { basename, relative } from "node:path";

/**
 * Check if a resolved path stays within the allowed parent directory.
 * Returns true if the path is safe (no traversal).
 */
export function isPathSafe(resolvedPath: string, allowedParent: string): boolean {
  const rel = relative(allowedParent, resolvedPath);
  return !rel.startsWith("..") && !rel.startsWith("/");
}

/**
 * Validate that a user-supplied ID/filename contains no path separators
 * or traversal sequences. Returns the basename only (strips any directory).
 * Throws if the ID is empty or contains unsafe characters.
 */
export function sanitizePlanId(id: string): string {
  const cleaned = basename(id);
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new Error(`Invalid plan ID: "${id}"`);
  }
  if (/[\\/]/.test(id) || id.includes("..")) {
    throw new Error(`Plan ID contains path separators: "${id}"`);
  }
  return cleaned;
}

/**
 * Validate that a planName from MCP args is safe.
 * Returns the basename only. Throws if unsafe.
 */
export function sanitizePlanName(name: string): string {
  const cleaned = basename(name);
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new Error(`Invalid plan name: "${name}"`);
  }
  if (/[\\/]/.test(name) || name.includes("..")) {
    throw new Error(`Plan name contains path traversal: "${name}"`);
  }
  return cleaned;
}
