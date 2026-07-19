import { execFileSync } from "node:child_process";
import { platform } from "node:os";
import type { ReminderPriority } from "./briefing.js";
import { logger } from "./logger.js";

let warnedUnsupportedPlatform = false;

/**
 * Send a desktop notification via notify-send.
 * Fails silently if notify-send is not available.
 * On non-Linux platforms, logs a debug message once per process
 * so users can discover why desktop notifications don't appear.
 */
export function sendDesktopNotification(
  title: string,
  message: string,
  priority: ReminderPriority = "medium"
): void {
  if (platform() !== "linux") {
    if (!warnedUnsupportedPlatform) {
      logger.debug(
        "notify",
        `Desktop notifications require notify-send (Linux). Current platform: ${platform()}. High-priority reminders remain visible via "shugo briefing" and "shugo reminders".`
      );
      warnedUnsupportedPlatform = true;
    }
    return;
  }

  try {
    const urgency =
      priority === "high" ? "critical" : priority === "low" ? "low" : "normal";
    execFileSync(
      "notify-send",
      [title, message, `--urgency=${urgency}`],
      { stdio: "pipe", timeout: 2000 }
    );
  } catch {
    // notify-send not installed on this Linux (e.g. headless/server) — silent failure is correct here.
  }
}
