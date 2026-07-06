import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getEventBus, type NexusEventType } from "./event-bus.js";
import { validateCompletionGate } from "./task-completion.js";
import { transitionBacklogStatus, type BacklogStatus } from "./backlog-transitions.js";
import { logger } from "./logger.js";

export interface TaskPipelineConfig {
  projectRoot: string;
  nexusDir: string;
}

export interface TaskPipelineEvent {
  taskId: string;
  source: string;
  affectedFiles?: string[];
}

export function initializeTaskPipeline(config: TaskPipelineConfig): () => void {
  const bus = getEventBus();

  const onValidationComplete = (payload: Record<string, unknown>) => {
    const taskId = String(payload.taskId ?? "unknown");
    const affectedFiles = payload.affectedFiles as string[] | undefined;

    logger.debug("task-pipeline", `Validation completed for task: ${taskId}`);

    const result = validateCompletionGate({
      projectRoot: config.projectRoot,
      nexusDir: config.nexusDir,
      taskId,
      affectedFiles,
    });

    if (result.passed) {
      bus.publish("task.completed", {
        taskId,
        source: "validation_pass",
        affectedFiles: affectedFiles ?? [],
        gates: result.gates.map((g) => ({ name: g.name, passed: g.passed })),
      });
      logger.info("task-pipeline", `Task ${taskId} passed all gates — published task.completed`);
    } else {
      const failures = result.gates
        .filter((g) => !g.passed)
        .map((g) => `${g.name}: ${g.message}`);
      logger.info("task-pipeline", `Task ${taskId} gate(s) still failing: ${failures.join("; ")}`);
    }
  };

  const onTaskCompleted = (payload: Record<string, unknown>) => {
    const taskId = String(payload.taskId ?? "unknown");
    logger.info("task-pipeline", `Processing task.completed for: ${taskId}`);

    // 1. Update context_buffer.yaml
    updateContextBuffer(config.nexusDir, taskId);

    // 2. Update backlog status to concluído
    updateBacklogStatus(config.nexusDir, taskId);

    // 3. Log event
    logger.info("task-pipeline", `Task ${taskId} pipeline complete`);
  };

  const unsub1 = bus.subscribe("validation.completed" as NexusEventType, onValidationComplete);
  const unsub2 = bus.subscribe("task.completed" as NexusEventType, onTaskCompleted);

  return () => {
    unsub1();
    unsub2();
  };
}

function updateContextBuffer(nexusDir: string, taskId: string): void {
  const bufferPath = join(nexusDir, "governance", "context", "context_buffer.yaml");
  if (!existsSync(bufferPath)) {
    logger.warn("task-pipeline", `context_buffer.yaml not found at ${bufferPath}`);
    return;
  }

  try {
    let content = readFileSync(bufferPath, "utf-8");
    const now = new Date().toISOString();

    content = content.replace(
      /current_task:\s*\n\s*id:\s*.+\n\s*description:\s*.+\n\s*status:\s*.+\n\s*started_at:\s*.+\n\s*completed_at:\s*.+/,
      `current_task:\n  id: ${taskId}\n  description: "Task completed via pipeline"\n  status: "completed"\n  started_at: "unknown"\n  completed_at: "${now}"`
    );

    content = content.replace(
      /^session:\s*\n\s*id:\s*.+\n\s*started_at:\s*.+\n\s*status:\s*.+/m,
      (match) => match.replace(/status:\s*".+?"/, `status: "completed"`)
    );

    writeFileSync(bufferPath, content, "utf-8");
    logger.info("task-pipeline", "Updated context_buffer.yaml — task marked completed");
  } catch (error) {
    logger.error("task-pipeline", `Failed to update context_buffer.yaml: ${error}`);
  }
}

function updateBacklogStatus(nexusDir: string, taskId: string): void {
  const backlogPaths = [
    join(nexusDir, "docs", "BACKLOG.md"),
    join(nexusDir, "..", "nexus-system", "docs", "BACKLOG.md"),
  ];

  for (const path of backlogPaths) {
    if (!existsSync(path)) continue;

    const result = transitionBacklogStatus(path, taskId, "concluído" as BacklogStatus, {
      date: new Date().toISOString().slice(0, 10),
    });

    if (result.success) {
      logger.info("task-pipeline", `Updated BACKLOG.md: ${result.message}`);
      return;
    }
  }
}
