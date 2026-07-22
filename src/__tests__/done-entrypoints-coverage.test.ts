import { describe, it, expect } from "vitest";

const PIPELINE_GATES = ["tests", "lint", "documentation", "backlog", "plan_status"];
const LIFECYCLE_CHECKS = ["BUILD", "TESTS", "LINT", "GATE_SELF_TEST"];

describe("cobertura das duas portas de entrada para done", () => {
  it("snapshot dos conjuntos de gate — mudança exige atualizar o comentário cruzado", () => {
    expect(PIPELINE_GATES).toMatchSnapshot();
    expect(LIFECYCLE_CHECKS).toMatchSnapshot();
  });
});
