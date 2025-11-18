export type WindowKey = "24h" | "7d" | "30d" | "all";

/**
 * Returns the start date for a given time window
 * Returns null for "all" window
 */
export function windowStart(key: WindowKey, now: Date = new Date()): Date | null {
  if (key === "all") {
    return null;
  }

  const utcNow = new Date(now.toISOString());
  const start = new Date(utcNow);

  switch (key) {
    case "24h":
      start.setUTCHours(utcNow.getUTCHours() - 24);
      break;
    case "7d":
      start.setUTCDate(utcNow.getUTCDate() - 7);
      break;
    case "30d":
      start.setUTCDate(utcNow.getUTCDate() - 30);
      break;
  }

  return start;
}

/**
 * Checks if a timestamp (ISO string) is within the given window
 * For weekly data, we check if the week overlaps with the window
 */
export function isWithinWindow(ts: string, key: WindowKey, now: Date = new Date()): boolean {
  if (key === "all") {
    return true;
  }

  const start = windowStart(key, now);
  if (!start) {
    return true;
  }

  const timestamp = new Date(ts);
  
  // For weekly data, check if the week overlaps with the window
  // A week is considered within the window if:
  // - The week starts before the window end (now)
  // - The week ends after the window start
  const weekStart = new Date(timestamp);
  const weekEnd = new Date(timestamp);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7); // Week is 7 days
  
  // Check if week overlaps with window
  // Week overlaps if: weekStart <= now AND weekEnd >= start
  return weekStart <= now && weekEnd >= start;
}

/**
 * Returns the start date of the previous equivalent window
 * Used for trend calculations
 */
export function getPreviousWindowStart(key: WindowKey, now: Date = new Date()): Date | null {
  if (key === "all") {
    return null;
  }

  const currentStart = windowStart(key, now);
  if (!currentStart) {
    return null;
  }

  const utcNow = new Date(now.toISOString());
  const duration = utcNow.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return previousStart;
}

