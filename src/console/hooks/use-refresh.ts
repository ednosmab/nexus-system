/**
 * use-refresh.ts — Auto-refresh hook
 *
 * Periodically re-collects data for live dashboard updates.
 */

import { useState, useEffect, useCallback } from "react";
import { getOrCollectConsoleData, clearConsoleDataCache, type ConsoleData } from "../data-collector.js";

export function useRefresh(
  projectRoot: string,
  shitennoDir: string,
  intervalMs: number = 0
) {
  const [data, setData] = useState<ConsoleData>(() =>
    getOrCollectConsoleData(projectRoot, shitennoDir)
  );
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(() => {
    clearConsoleDataCache(); // Force fresh data on manual refresh
    const newData = getOrCollectConsoleData(projectRoot, shitennoDir);
    setData(newData);
    setLastRefresh(new Date());
  }, [projectRoot, shitennoDir]);

  useEffect(() => {
    if (intervalMs <= 0) return;

    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, refresh]);

  return { data, refresh, lastRefresh };
}
