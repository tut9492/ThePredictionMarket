import type { DataRow, PlatformKey } from "../dune";
import { fetchKalshiData } from "./kalshi";
import { fetchPolymarketData } from "./polymarket";
import { fetchDefiLlamaData, fetchAllDefiLlamaData } from "./defillama";
import { fetchDuneResults, mapRows } from "../dune";
import { identifyPlatform } from "../platform-identifier";

/**
 * Data source configuration
 */
export type DataSource = "dune" | "direct";

export interface PlatformDataSource {
  platform: PlatformKey;
  source: DataSource;
}

/**
 * Fetches data for a specific platform from the configured source
 * Polymarket: Uses direct API
 * Kalshi: Uses Dune
 */
export async function fetchPlatformData(
  platform: PlatformKey,
  timeWindow: "24h" | "7d" | "30d" | "all",
  source: DataSource = "direct"
): Promise<DataRow[]> {
  // Polymarket uses direct API
  if (platform === "polymarket" && source === "direct") {
    try {
          const polymarketData = await fetchPolymarketData(timeWindow);
          if (polymarketData.length > 0) {
        console.log(`Using Polymarket direct API (${polymarketData.length} records)`);
            return polymarketData;
      }
    } catch (error) {
      console.warn(`Polymarket direct API failed, falling back to Dune:`, error);
    }
  }

  // Kalshi uses Dune
  try {
    const DASHBOARD_QUERY_ID = 5753743;
    const allRows = await fetchDuneResults(DASHBOARD_QUERY_ID);
    const platformRows = allRows.filter((row) => identifyPlatform(row) === platform);
    const mappedRows = mapRows(platformRows, platform);
    
    if (mappedRows.length > 0) {
      console.log(`Using Dune data for ${platform} (${mappedRows.length} records)`);
      return mappedRows;
    } else {
      console.warn(`No Dune data found for ${platform}`);
    }
  } catch (error) {
    console.error(`Failed to fetch data for ${platform} from Dune:`, error);
  }

  return [];
}

/**
 * Fetches data for all platforms in parallel
 * Polymarket: Uses direct API
 * Kalshi: Uses Dune
 */
export async function fetchAllPlatformsData(
  timeWindow: "24h" | "7d" | "30d" | "all",
  source: DataSource = "direct"
): Promise<Map<PlatformKey, DataRow[]>> {
  const platforms: PlatformKey[] = ["kalshi", "polymarket"];
  
  const results = await Promise.all(
    platforms.map(async (platform) => {
      const data = await fetchPlatformData(platform, timeWindow, source);
      return [platform, data] as [PlatformKey, DataRow[]];
    })
  );

  return new Map(results);
}

