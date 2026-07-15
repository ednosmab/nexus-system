import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initializeTaskPipeline,
  type TaskPipelineConfig,
} from "../task-pipeline.js";
import { getEventBus, resetEventBus, type ShitenEventType } from "../event-bus.js";

describe("task-pipeline", () => {
  let config: TaskPipelineConfig;
  let cleanup: (() => void) | null;

  beforeEach(() => {
    resetEventBus();
    config = {
      projectRoot: process.cwd(),
      shitenDir: process.cwd(),
    };
    cleanup = null;
  });

  afterEach(() => {
    if (cleanup) cleanup();
    resetEventBus();
  });

  it("initializes and returns cleanup function", () => {
    cleanup = initializeTaskPipeline(config);
    expect(typeof cleanup).toBe("function");
  });

  it("subscribes to validation.completed event", () => {
    cleanup = initializeTaskPipeline(config);
    const bus = getEventBus();
    expect(bus.listenerCount("validation.completed" as ShitenEventType)).toBeGreaterThanOrEqual(1);
  });

  it("subscribes to task.completed event", () => {
    cleanup = initializeTaskPipeline(config);
    const bus = getEventBus();
    expect(bus.listenerCount("task.completed" as ShitenEventType)).toBeGreaterThanOrEqual(1);
  });
});
