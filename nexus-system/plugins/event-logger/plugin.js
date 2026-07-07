/**
 * event-logger plugin — Command metrics logging
 *
 * Logs metrics for each command execution to plugin-metrics.jsonl.
 */

import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const eventLoggerPlugin = {
  name: "event-logger",
  version: "1.0.0",
  description: "Logs metrics for each command execution",
  hooks: {
    "custom-metric": async (input: unknown) => {
      const ctx = input as Record<string, unknown>;
      const nexusDir = ctx.nexusDir as string;
      const command = ctx.command as string || "unknown";
      const duration = (ctx.duration as number) || 0;

      if (!nexusDir) return null;

      const telemetryDir = join(nexusDir, "telemetry");
      if (!existsSync(telemetryDir)) {
        mkdirSync(telemetryDir, { recursive: true });
      }

      const metricsPath = join(telemetryDir, "plugin-metrics.jsonl");
      const entry = {
        timestamp: new Date().toISOString(),
        command,
        duration,
        plugin: "event-logger",
      };

      appendFileSync(metricsPath, JSON.stringify(entry) + "\n", "utf-8");

      return null;
    },
  },
};

export default eventLoggerPlugin;
