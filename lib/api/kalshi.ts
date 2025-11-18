import type { DataRow, PlatformKey } from "../dune";

/**
 * Kalshi API Client
 * Documentation: https://docs.kalshi.com
 */
export interface KalshiMarketData {
  volume_usd?: number;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Fetches market data from Kalshi API (public endpoints, no auth required)
 * @param timeWindow - Time window for data (24h, 7d, 30d)
 * @returns Array of DataRow objects
 * 
 * Documentation: https://docs.kalshi.com
 * Public endpoints don't require authentication for market data
 * 
 * Note: Kalshi API doesn't provide historical volume data directly,
 * so we calculate total volume from current markets and estimate historical data
 */
export async function fetchKalshiData(timeWindow: "24h" | "7d" | "30d" | "all"): Promise<DataRow[]> {
  try {
    // Kalshi public API endpoint (no authentication required for market data)
    // Base URL: https://api.elections.kalshi.com/trade-api/v2
    // Despite the "elections" subdomain, this provides access to ALL Kalshi markets
    const baseUrl = "https://api.elections.kalshi.com/trade-api/v2";
    
    // Fetch all open markets
    const url = new URL(`${baseUrl}/markets`);
    url.searchParams.set("status", "open");
    // Don't set limit - get all markets without pagination limits
    // url.searchParams.set("limit", "500");

    console.log("[Kalshi Data] Fetching markets for time window:", timeWindow);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache 5 minutes
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !data.markets || !Array.isArray(data.markets)) {
      console.warn("[Kalshi Data] Invalid response format");
      return [];
    }

    console.log("[Kalshi Data] Received", data.markets.length, "markets");

    // Calculate total volume from all markets
    // Volume is in cents, so we need to convert to dollars
    const totalVolumeCents = data.markets.reduce((sum: number, market: any) => {
      const volume = market.volume_24h || market.volume || 0;
      return sum + volume;
    }, 0);

    const totalVolume = totalVolumeCents / 100; // Convert to dollars

    console.log("[Kalshi Data] Total volume:", totalVolume, "USD");

    // Create data rows based on time window
    // Since Kalshi doesn't provide historical data, we estimate based on current volume
    const now = new Date();
    const dataRows: DataRow[] = [];
    
    if (timeWindow === "24h") {
      // For 24h, return a single row with today's aggregated volume
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      dataRows.push({
        timestamp: today.toISOString(),
        volume_usd: totalVolume,
        open_interest_usd: 0, // Kalshi API doesn't provide open interest in this format
      });
    } else {
      // For longer windows, estimate daily volume and distribute across days
      // We'll use the 24h total as a daily average
      const dailyAverage = totalVolume;
      const days = timeWindow === "7d" ? 7 : timeWindow === "30d" ? 30 : 365;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        dataRows.push({
          timestamp: date.toISOString(),
          volume_usd: dailyAverage,
          open_interest_usd: 0,
        });
      }
    }

    console.log(`[Kalshi Data] Created ${dataRows.length} data rows for ${timeWindow} window`);
    
    return dataRows;
  } catch (error) {
    console.error("Error fetching Kalshi data:", error);
    return [];
  }
}

/**
 * Transforms Kalshi API response to DataRow format
 */
function transformKalshiData(data: any): DataRow[] {
  // TODO: Adjust based on actual Kalshi API response structure
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    timestamp: item.timestamp || new Date().toISOString(),
    volume_usd: item.volume_usd || item.volume || 0,
    open_interest_usd: item.open_interest_usd || item.open_interest || 0,
  }));
}

/**
 * Top Market type for Kalshi
 */
export interface KalshiTopMarket {
  id: string;
  title: string;
  category: string;
  platform: "kalshi";
  volume_24h: number;
  current_odds: number; // 0-1 (e.g., 0.45 = 45%)
  url: string;
}

/**
 * Extract category from question/title using the same logic as Polymarket
 * This ensures consistent categorization across platforms
 * Enhanced with Kalshi-specific patterns
 */
function extractCategoryFromQuestion(question: string): string {
  const q = (question || "").toLowerCase();
  
  // Politics - check first (most common)
  if (q.includes("election") || q.includes("president") || q.includes("trump") ||
      q.includes("government") || q.includes("senate") || q.includes("shutdown") ||
      q.includes("democrat") || q.includes("republican") || q.includes("congress") ||
      q.includes("fed") || q.includes("rate") || q.includes("biden") || q.includes("harris") ||
      q.includes("senate") || q.includes("house") || q.includes("congressional") ||
      q.includes("presidential") || q.includes("governor") || q.includes("mayor")) {
    return "Politics";
  }
  
  // Sports - enhanced with tennis and other patterns
  if (q.includes("nfl") || q.includes("nba") || q.includes("super bowl") ||
      q.includes("football") || q.includes("basketball") || q.includes("mvp") ||
      q.includes("champion") || q.includes("mlb") || q.includes("world series") ||
      q.includes("playoff") || q.includes("finals") || q.includes("nhl") ||
      q.includes("hockey") || q.includes("soccer") || q.includes("fifa") ||
      q.includes("premier league") || q.includes("uefa") || q.includes("champions league") ||
      q.includes("world cup") || q.includes("olympics") || q.includes("boxing") ||
      q.includes("ufc") || q.includes("mma") || q.includes("tennis") || q.includes("golf") ||
      q.includes("formula 1") || q.includes("f1") || q.includes("nascar") ||
      q.includes("ncaa") || q.includes("college football") || q.includes("college basketball") ||
      q.includes("match") || q.includes("win") && (q.includes("vs") || q.includes("versus")) ||
      q.includes("shelton") || q.includes("auger-aliassime") || q.includes("atp") ||
      q.includes("wta") || q.includes("grand slam") || q.includes("wimbledon") ||
      q.includes("us open") || q.includes("french open") || q.includes("australian open")) {
    return "Sports";
  }
  
  // Crypto
  if (q.includes("bitcoin") || q.includes("btc") || q.includes("crypto") ||
      q.includes("ethereum") || q.includes("eth") || q.includes("doge") ||
      q.includes("blockchain") || q.includes("defi") || q.includes("coin") ||
      q.includes("solana") || q.includes("cardano")) {
    return "Crypto";
  }
  
  // Social - includes culture/entertainment content
  // Enhanced with music charts, Billboard, Taylor Swift, etc.
  if (q.includes("twitter") || q.includes("elon") || q.includes("musk") ||
      q.includes("social media") || q.includes("facebook") || q.includes("tweet") ||
      q.includes("instagram") || q.includes("tiktok") || q.includes("x.com") ||
      q.includes("linkedin") || q.includes("reddit") ||
      q.includes("oscar") || q.includes("movie") || q.includes("netflix") ||
      q.includes("mrbeast") || q.includes("video") || q.includes("celebrity") ||
      q.includes("music") || q.includes("emmy") || q.includes("grammy") ||
      q.includes("streaming") || q.includes("youtube") || q.includes("spotify") ||
      q.includes("tiktok") || q.includes("influencer") || q.includes("podcast") ||
      q.includes("billboard") || q.includes("hot 100") || q.includes("taylor swift") ||
      q.includes("chart") || q.includes("album") || q.includes("song") ||
      q.includes("artist") || q.includes("singer") || q.includes("rapper")) {
    return "Social";
  }
  
  // Default to Other
  return "Other";
}

/**
 * Fetch top markets from Kalshi by volume
 * Based on official API docs: https://docs.kalshi.com
 * Returns all markets (not limited) so frontend can filter by category
 */
export async function fetchKalshiTopMarkets(limit: number = 5): Promise<KalshiTopMarket[]> {
  try {
    const url = new URL("https://api.elections.kalshi.com/trade-api/v2/markets");
    url.searchParams.set("status", "open");
    url.searchParams.set("limit", "200"); // Fetch 200 to get good variety

    console.log("[Kalshi] Fetching markets...");

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
      signal: AbortSignal.timeout(15000), // 15s timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      console.error("[Kalshi] API error:", response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data || !data.markets || !Array.isArray(data.markets)) {
      console.error("[Kalshi] Invalid response format");
      return [];
    }

    console.log("[Kalshi] Received", data.markets.length, "markets");
    
    // Filter and map markets
    const markets: KalshiTopMarket[] = data.markets
      .filter((market: any) => {
        // Only binary markets with decent volume
        // Volume is in cents, so 500 = $5
        // Using volume_24h as it's more accurate for recent activity
        const volume = market.volume_24h || market.volume || 0;
        return (
          market.market_type === "binary" &&
          volume > 500 // $5 minimum (volume is in cents, so 500 = $5)
        );
      })
      .map((market: any) => {
        try {
          // Extract category using same logic as Polymarket
          const category = extractCategoryFromQuestion(market.title || "");
          
          // Get current odds from yes_price (in cents, 0-100)
          // Use yes_bid or yes_ask if available, otherwise last_price
          const yesPrice = market.yes_bid || market.yes_ask || market.last_price || 50;
          const currentOdds = yesPrice / 100; // Convert to 0-1
          
          // Use volume_24h if available, otherwise volume (both in cents)
          const volume = market.volume_24h || market.volume || 0;
          
          // Build URL
          const url = `https://kalshi.com/markets/${market.ticker}`;

          return {
            id: market.ticker,
            title: market.title,
            category,
            platform: "kalshi" as const,
            volume_24h: volume,
            current_odds: currentOdds,
            url,
          };
        } catch (error) {
          console.error("[Kalshi] Error mapping market:", market.ticker, error);
          return null;
        }
      })
      .filter((m: KalshiTopMarket | null): m is KalshiTopMarket => m !== null)
      .sort((a: KalshiTopMarket, b: KalshiTopMarket) => b.volume_24h - a.volume_24h); // Sort by volume

    console.log("[Kalshi] Returning", markets.length, "markets");
    
    // Log category distribution
    const categoryCount: Record<string, number> = {};
    markets.forEach(m => {
      categoryCount[m.category] = (categoryCount[m.category] || 0) + 1;
    });
    console.log("[Kalshi] Categories:", categoryCount);

    return markets; // Return ALL markets (not just top N)

  } catch (error) {
    console.error("[Kalshi] Fetch failed:", error);
    return [];
  }
}



