import { NextRequest, NextResponse } from "next/server";
import { fetchDuneResults, mapRows, type PlatformKey, type DataRow } from "@/lib/dune";
import { identifyPlatform } from "@/lib/platform-identifier";
import { filterWindow, sumMetric, toShare, type MetricKey } from "@/utils/aggregate";
import { windowStart, getPreviousWindowStart, type WindowKey } from "@/utils/time";
import { fetchAllPlatformsData, type DataSource } from "@/lib/api";
import { fetchKalshiTopMarkets } from "@/lib/api/kalshi";
import { fetchPolymarketTopMarkets } from "@/lib/api/polymarket";

export const dynamic = 'force-dynamic';

// Single query ID that returns data for all platforms
const DASHBOARD_QUERY_ID = 5753743;

// Mock data for different time windows
const MOCK_RESPONSES: Record<WindowKey, any> = {
  "24h": {
    window: "24h",
    metric: "volume_usd",
    updated_at: new Date().toISOString(),
    total_value: 344000000,
    platforms: [
      { platform: "polymarket", value: 158200000, share_pct: 46, trend_pct: 8.5 },
      { platform: "kalshi", value: 180100000, share_pct: 52, trend_pct: 15.7 },
    ],
  },
  "7d": {
    window: "7d",
    metric: "volume_usd",
    updated_at: new Date().toISOString(),
    total_value: 8500000000, // ~7.4x for 7 days
    platforms: [
      { platform: "kalshi", value: 3700000000, share_pct: 43.53, trend_pct: 7.2 },
      { platform: "polymarket", value: 4465000000, share_pct: 52.53, trend_pct: 14.3 },
    ],
  },
  "30d": {
    window: "30d",
    metric: "volume_usd",
    updated_at: new Date().toISOString(),
    total_value: 34200000000, // ~30x for 30 days
    platforms: [
      { platform: "kalshi", value: 15000000000, share_pct: 43.86, trend_pct: 6.5 },
      { platform: "polymarket", value: 17940000000, share_pct: 52.46, trend_pct: 13.1 },
    ],
  },
  "all": {
    window: "all",
    metric: "volume_usd",
    updated_at: new Date().toISOString(),
    total_value: 125000000000, // All-time total
    platforms: [
      { platform: "kalshi", value: 54750000000, share_pct: 43.8, trend_pct: 5.8 },
      { platform: "polymarket", value: 65650000000, share_pct: 52.52, trend_pct: 12.4 },
    ],
  },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const window = (searchParams.get("window") || "7d") as WindowKey;
  const metric = (searchParams.get("metric") || "volume_usd") as MetricKey;
  const mode = searchParams.get("mode") || "live";

  // Return mock data for development
  if (mode === "mock") {
    const mockData = MOCK_RESPONSES[window] || MOCK_RESPONSES["7d"];
    return NextResponse.json({
      ...mockData,
      window,
      metric,
      updated_at: new Date().toISOString(),
    });
  }

  const now = new Date();
  const warnings: string[] = [];

  // Determine data source: prefer direct APIs if available
  const useDirectAPIs = searchParams.get("source") !== "dune";
  const dataSource: DataSource = useDirectAPIs ? "direct" : "dune";

  let platformDataMap: Map<PlatformKey, DataRow[]> | undefined;

  if (dataSource === "direct") {
    // Try direct APIs first
    try {
      platformDataMap = await fetchAllPlatformsData(window, "direct");
      console.log(`Fetched data from direct APIs for ${platformDataMap.size} platforms`);
    } catch (error) {
      console.warn("Direct APIs failed, falling back to Dune:", error);
      warnings.push(`Direct APIs unavailable, using Dune: ${error instanceof Error ? error.message : "Unknown error"}`);
      // Fall through to Dune
    }
  }

  // Fallback to Dune if direct APIs not available or failed
  if (!platformDataMap || platformDataMap.size === 0) {
    let allRows: any[] = [];
    try {
      allRows = await fetchDuneResults(DASHBOARD_QUERY_ID);
      console.log(`Fetched ${allRows.length} rows from Dune query ${DASHBOARD_QUERY_ID}`);
      if (allRows.length > 0) {
        console.log("Sample row:", JSON.stringify(allRows[0], null, 2));
      } else {
        warnings.push("Dune query returned 0 rows - query may need to be executed or API key may be invalid");
      }
    } catch (error) {
      const errorMessage = `Failed to fetch data from Dune: ${error instanceof Error ? error.message : "Unknown error"}`;
      warnings.push(errorMessage);
      console.error(errorMessage, error);
      
      // If Dune fails completely, still return what we have (Polymarket from direct API)
      // Don't return empty - allow partial data to be displayed
      if (!platformDataMap || platformDataMap.size === 0) {
        // Only return empty if we have absolutely no data
        return NextResponse.json({
          window,
          metric,
          updated_at: now.toISOString(),
          total_value: 0,
          platforms: [],
          warnings,
        });
      }
    }

    const platformMap = new Map<PlatformKey, any[]>();
    allRows.forEach((row) => {
      const platform = identifyPlatform(row);
      if (platform) {
        if (!platformMap.has(platform)) {
          platformMap.set(platform, []);
        }
        platformMap.get(platform)!.push(row);
      } else {
        console.warn("Could not identify platform for row:", JSON.stringify(row, null, 2));
      }
    });
    console.log(`Grouped rows by platform:`, Array.from(platformMap.entries()).map(([p, rows]) => [p, rows.length]));

    platformDataMap = new Map<PlatformKey, DataRow[]>();
    for (const [platform, rows] of platformMap.entries()) {
      const mappedRows = mapRows(rows, platform);
      console.log(`${platform}: ${rows.length} raw rows, ${mappedRows.length} mapped rows`);
      platformDataMap.set(platform, mappedRows);
    }
  }

  // Special handling for 24h window: fetch real-time 24h volumes from direct APIs
  // For Kalshi: use events-volume endpoint (aggregated event volumes)
  // For Polymarket: sum volume_24h from top-markets endpoint
  let kalshiVolume24h: number | null = null;
  let polymarketVolume24h: number | null = null;

  if (window === "24h") {
    // Fetch Kalshi 24h volume using events aggregation logic
    // Fetch all markets and group by event_ticker, then sum volume_24h
    try {
      const baseUrl = "https://api.elections.kalshi.com/trade-api/v2/markets";
      const allMarkets: any[] = [];
      let cursor: string | null = null;
      let pageCount = 0;
      const maxPages = 100;

      // Fetch all pages using cursor pagination
      do {
        const url = new URL(baseUrl);
        url.searchParams.set("status", "open");
        url.searchParams.set("limit", "500");
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const response = await fetch(url.toString(), {
          next: { revalidate: 300 },
          signal: AbortSignal.timeout(15000),
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
        });

        if (!response.ok) break;
        const data = await response.json();
        if (!data?.markets || !Array.isArray(data.markets)) break;

        allMarkets.push(...data.markets);
        cursor = data.cursor || null;
        pageCount++;
        if (pageCount >= maxPages) break;
      } while (cursor);

      // Group markets by event_ticker and sum volume_24h per event
      const eventVolumes: Record<string, number> = {};
      allMarkets.forEach((market: any) => {
        const eventTicker = market.event_ticker || "UNKNOWN";
        const volume = market.volume_24h || market.volume || 0; // volume_24h is in cents
        if (!eventVolumes[eventTicker]) {
          eventVolumes[eventTicker] = 0;
        }
        eventVolumes[eventTicker] += volume;
      });

      // Sum all event volumes (volume is in cents, convert to dollars)
      kalshiVolume24h = Object.values(eventVolumes).reduce((sum, vol) => sum + vol, 0) / 100;
      console.log(`[Kalshi] Calculated 24h volume from events: $${kalshiVolume24h.toLocaleString()} (${allMarkets.length} markets, ${Object.keys(eventVolumes).length} events)`);
    } catch (error) {
      console.warn(`[Kalshi] Error calculating 24h volume:`, error);
    }

    // Fetch Polymarket 24h volume by summing volume_24h from top markets
    try {
      const polymarketMarkets = await fetchPolymarketTopMarkets(1000); // Get many markets
      // Sum all volume_24h from Polymarket markets
      polymarketVolume24h = polymarketMarkets.reduce((sum: number, market: any) => {
        return sum + (market.volume_24h || 0);
      }, 0);
      console.log(`[Polymarket] Calculated 24h volume from top-markets: $${polymarketVolume24h.toLocaleString()} (${polymarketMarkets.length} markets)`);
    } catch (error) {
      console.warn(`[Polymarket] Error calculating 24h volume:`, error);
    }
  }

  // For non-24h windows, still use events endpoint for Kalshi
  let kalshiVolume: number | null = null;
  if (window !== "24h") {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin || "http://localhost:3000";
      const kalshiResponse = await fetch(`${baseUrl}/api/kalshi-events-volume?window=${window}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (kalshiResponse.ok) {
        const kalshiData = await kalshiResponse.json();
        kalshiVolume = kalshiData.volume || 0; // Volume is already in dollars
        if (kalshiVolume !== null) {
          console.log(`[Kalshi] Fetched volume from events endpoint: $${kalshiVolume.toLocaleString()}`);
        }
      } else {
        console.warn(`[Kalshi] Failed to fetch from events endpoint: ${kalshiResponse.status}`);
      }
    } catch (error) {
      console.warn(`[Kalshi] Error fetching from events endpoint:`, error);
    }
  }

  // Calculate totals per platform
  const platformResults: Array<{ platform: PlatformKey; value: number }> = [];
  for (const [platform, rows] of platformDataMap.entries()) {
    // For 24h window, use real-time 24h volumes if available
    if (window === "24h") {
      if (platform === "kalshi" && kalshiVolume24h !== null) {
        console.log(`[Kalshi] Using real 24h volume: $${kalshiVolume24h.toLocaleString()}`);
        platformResults.push({ platform, value: kalshiVolume24h });
        continue;
      }
      if (platform === "polymarket" && polymarketVolume24h !== null) {
        console.log(`[Polymarket] Using real 24h volume: $${polymarketVolume24h.toLocaleString()}`);
        platformResults.push({ platform, value: polymarketVolume24h });
        continue;
      }
    }

    // Skip Kalshi if we have events volume for non-24h windows - we'll add it separately
    if (platform === "kalshi" && kalshiVolume !== null) {
      console.log(`[Kalshi] Skipping platformDataMap, will use events volume: $${kalshiVolume.toLocaleString()}`);
      continue;
    }

    const filteredRows = filterWindow(rows, window, now);
    console.log(`${platform}: ${filteredRows.length} rows within ${window} window`);
    let total = sumMetric(filteredRows, metric);
    
    // For 24h window, check if we have daily data or need to estimate from weekly
    // DeFi Llama provides daily data, so no estimation needed
    // Dune provides weekly data, so we estimate by dividing by 7
    if (window === "24h" && filteredRows.length > 0) {
      // Check if we have daily data (multiple rows with daily timestamps)
      // or weekly data (single row or weekly timestamps)
      const hasMultipleDays = filteredRows.length > 1;
      const hasDailyTimestamps = filteredRows.some(row => {
        const rowDate = new Date(row.timestamp);
        const daysDiff = Math.abs((now.getTime() - rowDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 1; // Timestamps within 1 day suggest daily data
      });
      
      const isDailyData = hasMultipleDays || hasDailyTimestamps;
      
      if (!isDailyData) {
        // Estimate 24h volume from weekly data (divide by 7)
        // This happens when using Dune data (weekly) instead of DeFi Llama (daily)
        total = total / 7;
        console.log(`${platform}: estimated 24h ${metric} = ${total} (from weekly data)`);
      } else {
        // Use actual daily data (from DeFi Llama or other daily sources)
        // Sum only the most recent day's volume
        const mostRecentDay = filteredRows
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        if (mostRecentDay) {
          total = mostRecentDay[metric] || 0;
          console.log(`${platform}: actual 24h ${metric} = ${total} (from daily data)`);
        }
      }
    }
    
    console.log(`${platform}: total ${metric} = ${total}`);
    platformResults.push({ platform, value: total });
  }

  // Ensure all platforms are represented (even if zero)
  // Add Kalshi and Polymarket with real 24h volumes if available for 24h window
  const allPlatforms: PlatformKey[] = ["kalshi", "polymarket"];
  const existingPlatforms = new Set(platformResults.map(p => p.platform));
  for (const platform of allPlatforms) {
    if (!existingPlatforms.has(platform)) {
      if (platform === "kalshi") {
        // For 24h window, use real 24h volume if available
        if (window === "24h" && kalshiVolume24h !== null) {
          console.log(`[Kalshi] Adding real 24h volume: $${kalshiVolume24h.toLocaleString()}`);
          platformResults.push({ platform, value: kalshiVolume24h });
        } else if (kalshiVolume !== null) {
          // For other windows, use events volume
          console.log(`[Kalshi] Adding events volume: $${kalshiVolume.toLocaleString()}`);
          platformResults.push({ platform, value: kalshiVolume });
        } else if (platformDataMap.has("kalshi")) {
          const kalshiRows = platformDataMap.get("kalshi") || [];
          const filteredRows = filterWindow(kalshiRows, window, now);
          const total = sumMetric(filteredRows, metric);
          console.log(`[Kalshi] Using platformDataMap volume: $${total.toLocaleString()}`);
          platformResults.push({ platform, value: total });
        } else {
          console.log(`[Kalshi] No data available, using 0`);
          platformResults.push({ platform, value: 0 });
        }
      } else if (platform === "polymarket" && window === "24h" && polymarketVolume24h !== null) {
        // For 24h window, use real 24h volume from top-markets
        console.log(`[Polymarket] Adding real 24h volume: $${polymarketVolume24h.toLocaleString()}`);
        platformResults.push({ platform, value: polymarketVolume24h });
      } else {
        platformResults.push({ platform, value: 0 });
      }
    }
  }

  // Calculate current period totals
  const totals = new Map<PlatformKey, number>();
  platformResults.forEach(({ platform, value }) => {
    totals.set(platform, value);
  });

  const totalValue = Array.from(totals.values()).reduce((sum, val) => sum + val, 0);

  // Calculate trends: compare with previous equivalent period
  const previousStart = getPreviousWindowStart(window, now);
  const trendPromises = platformResults.map(
    async ({ platform }): Promise<{ platform: PlatformKey; trend_pct: number }> => {
      if (!previousStart) {
        return { platform, trend_pct: 0 };
      }

      try {
        // Use the same dashboard query for trend calculation
        const rows = await fetchDuneResults(DASHBOARD_QUERY_ID);
        const platformRows = rows.filter((row) => identifyPlatform(row) === platform);
        const mappedRows = mapRows(platformRows, platform);

        // Filter for previous period
        const previousEnd = windowStart(window, now);
        if (!previousEnd) {
          return { platform, trend_pct: 0 };
        }

        const previousRows = mappedRows.filter(row => {
          const ts = new Date(row.timestamp);
          return ts >= previousStart && ts < previousEnd;
        });

        const previousTotal = sumMetric(previousRows, metric);
        const currentTotal = totals.get(platform) || 0;

        // Calculate percentage change
        let trend_pct = 0;
        if (previousTotal > 0) {
          trend_pct = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else if (currentTotal > 0) {
          trend_pct = 100; // Infinite growth from zero
        }

        return { platform, trend_pct };
      } catch (error) {
        console.error(`Failed to calculate trend for ${platform}:`, error);
        return { platform, trend_pct: 0 };
      }
    }
  );

  const trendResults = await Promise.all(trendPromises);
  const trends = new Map<PlatformKey, number>();
  trendResults.forEach(({ platform, trend_pct }) => {
    trends.set(platform, trend_pct);
  });

  // Convert to share results and sort ASCENDING
  const shareResults = toShare(totals);

  // Build response with trends
  const platforms = shareResults.map(({ platform, value, share_pct }) => ({
    platform,
    value,
    share_pct,
    trend_pct: trends.get(platform) || 0,
  }));

  return NextResponse.json({
    window,
    metric,
    updated_at: now.toISOString(),
    total_value: totalValue,
    platforms,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

