import type { PlatformKey } from "./dune";

/**
 * Identifies which platform a row belongs to based on the row data
 * The query has a "platform" column with values like "Kalshi", "Polymarket", etc.
 */
export function identifyPlatform(row: any): PlatformKey | null {
  // Check for platform column (case-insensitive)
  const platformKey = Object.keys(row).find(
    (key) => key.toLowerCase() === "platform"
  );

  if (platformKey && row[platformKey]) {
    const platformValue = String(row[platformKey]).toLowerCase().trim();
    
    // Map platform names to our PlatformKey type
    if (platformValue === "kalshi") return "kalshi";
    if (platformValue === "polymarket") return "polymarket";
    
    // Handle variations
    if (platformValue.includes("kalshi")) return "kalshi";
    if (platformValue.includes("polymarket")) return "polymarket";
    
    // "Opinion" is a separate platform - ignore it or map it appropriately
    // For now, we'll ignore "Opinion" data since it's not one of our 4 platforms
  }

  // If no identifier found, return null
  return null;
}

