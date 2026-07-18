import { describe, it, expect } from "vitest";
import { shouldBlockInit } from "../commands/init.js";

describe("shouldBlockInit", () => {
  it("blocks when path contains shitenno-cli", () => {
    expect(shouldBlockInit("/path/to/shitenno-cli", false)).toBe(true);
  });

  it("blocks when path contains shitenno-cli as segment", () => {
    expect(shouldBlockInit("/home/runner/work/shitenno-cli/myproject", false)).toBe(true);
  });

  it("blocks /tmp/shitenno-cli-testdir", () => {
    expect(shouldBlockInit("/tmp/shitenno-cli-testdir", false)).toBe(true);
  });

  it("does not block regular project path", () => {
    expect(shouldBlockInit("/tmp/regular-project", false)).toBe(false);
  });

  it("does not block when force is true", () => {
    expect(shouldBlockInit("/path/to/shitenno-cli", true)).toBe(false);
  });

  it("does not block path without shitenno-cli", () => {
    expect(shouldBlockInit("/home/runner/work/shitenno/shitenno", false)).toBe(false);
  });
});
