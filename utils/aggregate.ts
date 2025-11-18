import type { DataRow } from "@/lib/dune";
import type { PlatformKey } from "@/lib/dune";
import type { WindowKey } from "@/utils/time";
import { isWithinWindow } from "@/utils/time";

export type MetricKey = "volume_usd" | "open_interest_usd";

export interface ShareResult {
  platform: PlatformKey;
  value: number;
  share_pct: number;
}

/**
 * Filters data rows to only include those within the specified window
 * 
 * Note: For 24h window with weekly data, this estimates 24h volume by:
 * - Using the most recent week's data
 * - Dividing by 7 to estimate daily average
 * - This is an approximation, not exact 24h volume
 * 
 * For accurate 24h volume, daily or hourly data is required.
 */
export function filterWindow(
  rows: DataRow[],
  win: WindowKey,
  now: Date = new Date()
): DataRow[] {
  if (win === "24h" && rows.length > 0) {
    // For 24h window with weekly data, estimate 24h from most recent week
    const sortedRows = [...rows].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const mostRecentWeek = sortedRows[0];
    if (mostRecentWeek) {
      // Return the most recent week's data
      // The volume will be divided by 7 in the calculation to estimate 24h
      const weekStart = new Date(mostRecentWeek.timestamp);
      const filtered = rows.filter(row => {
        const rowDate = new Date(row.timestamp);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
        return rowDate >= weekStart && rowDate < weekEnd;
      });
      
      // For weekly data in 24h window, we need to estimate daily volume
      // Return the most recent week's data, but mark it for daily estimation
      return filtered;
    }
  }
  
  return rows.filter(row => isWithinWindow(row.timestamp, win, now));
}

/**
 * Sums metric values from data rows
 * Used for platform-specific aggregation
 * 
 * Note: For 24h window with weekly data, this should be called with
 * a flag to divide by 7 for daily estimation. Currently handled in API route.
 */
export function sumMetric(rows: DataRow[], metric: MetricKey): number {
  return rows.reduce((sum, row) => sum + (row[metric] || 0), 0);
}

/**
 * Estimates 24h volume from weekly data by dividing by 7
 * This is an approximation - for accurate 24h volume, daily/hourly data is needed
 */
export function estimate24hFromWeekly(weeklyVolume: number): number {
  return weeklyVolume / 7;
}

/**
 * Converts platform totals to share percentages
 * Returns sorted ASCENDING (low to high) by value
 */
export function toShare(totals: Map<PlatformKey, number>): ShareResult[] {
  const total = Array.from(totals.values()).reduce((sum, val) => sum + val, 0);

  const results: ShareResult[] = Array.from(totals.entries()).map(([platform, value]) => ({
    platform,
    value,
    share_pct: total > 0 ? (value / total) * 100 : 0,
  }));

  // Sort ASCENDING by value (low to high)
  results.sort((a, b) => a.value - b.value);

  return results;
}

