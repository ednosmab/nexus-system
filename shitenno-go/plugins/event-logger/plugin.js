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
    "custom-metric": async (input) => {
      const ctx = input || {};
      const shitenDir = ctx.shitenDir;
      const command = ctx.command || "unknown";
      const duration = ctx.duration || 0;

      if (!shitenDir) return null;

      const telemetryDir = join(shitenDir, "telemetry");
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
