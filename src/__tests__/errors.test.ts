import { describe, it, expect } from "vitest";
import {
  ShitenError,
  NotInitializedError,
  InvalidRuleError,
  ScriptNotAllowedError,
} from "../errors.js";

describe("ShitenError", () => {
  it("has name, message, and code", () => {
    const err = new ShitenError("something broke", "E_FAIL");
    expect(err.name).toBe("ShitenError");
    expect(err.message).toBe("something broke");
    expect(err.code).toBe("E_FAIL");
    expect(err.exitCode).toBe(1);
    expect(err).toBeInstanceOf(Error);
  });

  it("accepts custom exitCode", () => {
    const err = new ShitenError("fail", "E_FAIL", 2);
    expect(err.exitCode).toBe(2);
  });
});

describe("NotInitializedError", () => {
  it("is a ShitenError with default message", () => {
    const err = new NotInitializedError();
    expect(err).toBeInstanceOf(ShitenError);
    expect(err.name).toBe("ShitenError");
    expect(err.code).toBe("NOT_INITIALIZED");
    expect(err.message).toContain("not initialized");
  });
});

describe("InvalidRuleError", () => {
  it("is a ShitenError", () => {
    const err = new InvalidRuleError("bad rule");
    expect(err).toBeInstanceOf(ShitenError);
    expect(err.code).toBe("INVALID_RULE");
    expect(err.message).toContain("bad rule");
  });
});

describe("ScriptNotAllowedError", () => {
  it("is a ShitenError", () => {
    const err = new ScriptNotAllowedError("evil.sh");
    expect(err).toBeInstanceOf(ShitenError);
    expect(err.code).toBe("SCRIPT_NOT_ALLOWED");
    expect(err.message).toContain("evil.sh");
  });
});
