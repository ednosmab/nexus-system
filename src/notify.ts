import { execFileSync } from "node:child_process";
import type { ReminderPriority } from "./briefing.js";

/**
 * Send a desktop notification via notify-send.
 * Fails silently if notify-send is not available.
 */
export function sendDesktopNotification(
  title: string,
  message: string,
  priority: ReminderPriority = "medium"
): void {
  try {
    const urgency =
      priority === "high" ? "critical" : priority === "low" ? "low" : "normal";
    execFileSync(
      "notify-send",
      [title, message, `--urgency=${urgency}`],
      { stdio: "pipe", timeout: 2000 }
    );
  } catch {
    // notify-send indisponível — falha silenciosa.
  }
}
