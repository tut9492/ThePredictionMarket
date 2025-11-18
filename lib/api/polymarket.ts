
import type { DataRow, PlatformKey } from "../dune";

/**
 * Polymarket API Client
 * Documentation: https://docs.polymarket.com
 * Alternative: https://polymarket-data.com (community SDK)
 */
export interface PolymarketMarketData {
  volume_usd?: number;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Fetches market data from Polymarket API (public endpoints, no auth required)
 * @param timeWindow - Time window for data (24h, 7d, 30d)
 * @returns Array of DataRow objects
 * 
 * Documentation: https://docs.polymarket.com
 * Public APIs don't require authentication for market data
 * Alternative: https://polymarket-data.com (community SDK)
 */
export async function fetchPolymarketData(timeWindow: "24h" | "7d" | "30d" | "all"): Promise<DataRow[]> {
  try {
    // Use Polymarket Gamma API to fetch events with volume data
    // This is more reliable than the GraphQL subgraph
    const url = new URL("https://gamma-api.polymarket.com/events");
    
    // Get active events with volume data
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("archived", "false");
    url.searchParams.set("limit", "1000"); // Get many events to aggregate volume

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
      signal: AbortSignal.timeout(10000), // 10s timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Polymarket Gamma API error (${response.status}): ${response.statusText}`
      );
    }

    const events: any[] = await response.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      console.warn("Polymarket Events API: No events found in response");
      return [];
    }

    // Calculate time range for filtering
    const now = new Date();
    let startDate = new Date(now);
    switch (timeWindow) {
      case "24h":
        startDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "all":
        startDate.setFullYear(2020); // Start from platform launch
        break;
    }

    // Aggregate volume from events
    // Note: Events API provides current 24h volume per event, not historical daily data
    // For 24h window, we sum all event volumes
    // For longer windows, we estimate by using the 24h volume as a daily average
    
    let totalVolume = 0;
    events.forEach((event: any) => {
      // Get volume from event (24h volume or total volume)
      const volume24h = event.volume24hr || event.volume || 0;
      const volumeNum = typeof volume24h === "string" ? Number(volume24h) : volume24h;
      
      if (volumeNum > 0) {
        totalVolume += volumeNum;
      }
    });

    // Create data rows based on time window
    const dataRows: DataRow[] = [];
    
    if (timeWindow === "24h") {
      // For 24h, return a single row with today's aggregated volume
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      dataRows.push({
        timestamp: today.toISOString(),
        volume_usd: totalVolume,
        open_interest_usd: 0, // Events API doesn't provide open interest
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

    console.log(`Polymarket: Fetched volume data from ${events.length} events, total volume: ${totalVolume}`);
    
    return dataRows;
  } catch (error) {
    console.error("Error fetching Polymarket data from Gamma API:", error);
    
    // Fallback: Try GraphQL subgraph (may not work, but worth trying)
    try {
      return await fetchPolymarketDataFromSubgraph(timeWindow);
    } catch (fallbackError) {
      console.error("Polymarket GraphQL fallback also failed:", fallbackError);
      return [];
    }
  }
}

/**
 * Fallback: Try to fetch data from GraphQL subgraph
 */
async function fetchPolymarketDataFromSubgraph(timeWindow: "24h" | "7d" | "30d" | "all"): Promise<DataRow[]> {
    const now = Math.floor(Date.now() / 1000);
    let startTime = now;
    switch (timeWindow) {
      case "24h":
        startTime = now - 86400;
        break;
      case "7d":
        startTime = now - 604800;
        break;
      case "30d":
        startTime = now - 2592000;
        break;
      case "all":
        startTime = 0;
        break;
    }

  // Try GraphQL Subgraph endpoint
    const subgraphUrl = "https://api.thegraph.com/subgraphs/name/polymarket";
    
    // GraphQL query for market volume data
    const query = `
      query GetMarketVolume($startTime: Int!, $endTime: Int!) {
        markets(where: { endDate_gt: $startTime, endDate_lt: $endTime }) {
          id
          volume
          timestamp
        }
      }
    `;

    const response = await fetch(subgraphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          startTime,
          endTime: now,
        },
      }),
    });

    if (!response.ok) {
    throw new Error(`Polymarket GraphQL error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
  
  // Check for GraphQL errors
  if (data.errors) {
    throw new Error(`Polymarket GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
    
    // Transform Polymarket data to DataRow format
    return transformPolymarketData(data);
}

/**
 * Transforms Polymarket API response to DataRow format
 */
function transformPolymarketData(data: any): DataRow[] {
  // Handle GraphQL subgraph response
  if (data?.data?.markets) {
    return data.data.markets.map((market: any) => ({
      timestamp: market.timestamp 
        ? new Date(market.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      volume_usd: Number(market.volume) || 0,
      open_interest_usd: Number(market.openInterest) || 0,
    }));
  }

  // Handle REST API response
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      timestamp: item.timestamp 
        ? new Date(item.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      volume_usd: Number(item.volume_usd || item.volume || 0),
      open_interest_usd: Number(item.open_interest_usd || item.openInterest || 0),
    }));
  }

  return [];
}

/**
 * Top Market type for Polymarket
 */
export interface PolymarketTopMarket {
  id: string;
  title: string;
  category: string;
  platform: "polymarket";
  volume_24h: number;
  current_odds: number; // 0-1 (e.g., 0.45 = 45%)
  url: string;
}

/**
 * Fetches top 5 FEATURED/TRENDING events from Polymarket
 * Uses Events API which shows what's actually popular
 * @param limit - Number of markets to return (default: 5)
 * @returns Array of top markets
 */
export async function fetchPolymarketTopMarkets(limit: number = 5): Promise<PolymarketTopMarket[]> {
  try {
    // Polymarket Gamma API Events endpoint
    const url = new URL("https://gamma-api.polymarket.com/events");
    
    // Get all active events (not just featured) to get more variety
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("archived", "false");
    // REMOVED: featured filter to get more markets across all categories
    url.searchParams.set("order", "volume24hr");       // Sort by 24h volume
    url.searchParams.set("ascending", "false");
    url.searchParams.set("limit", "100");              // Get 100 to ensure we have enough for each category

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
      signal: AbortSignal.timeout(10000), // 10s timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Polymarket Gamma API error (${response.status}): ${response.statusText}`
      );
    }

    const events: any[] = await response.json();
    
    // Log response structure for debugging
    if (events.length > 0) {
      console.log("Polymarket Events API response sample:", JSON.stringify(events[0]).substring(0, 500));
    }
    
    // Transform events to markets and sort by volume, take top N
    return transformPolymarketEvents(events, limit);
  } catch (error) {
    console.error("Error fetching Polymarket top events from Gamma API, trying fallback:", error);
    // Fallback to GraphQL subgraph
    return await fetchPolymarketTopMarketsFromSubgraph(limit);
  }
}

/**
 * Transforms Polymarket Events API response to TopMarket format
 * Events API returns featured/trending events which contain markets
 */
function transformPolymarketEvents(events: any[], limit: number): PolymarketTopMarket[] {
  if (!Array.isArray(events) || events.length === 0) {
    console.warn("Polymarket Events API: No events found in response");
    return [];
  }

  // Convert events to markets
  const markets = events
    .map((event: any) => {
      try {
        // Events have volume at event level
        const volume = event.volume24hr || event.volume || 0;
        const volumeNum = typeof volume === "string" ? Number(volume) : volume;
        
        // Lower threshold to get more variety (was 1M, now 100K)
        // This allows smaller markets to be included for better category coverage
        if (volumeNum < 100000) {
          return null;
        }

        // Get the first market from the event (the main outcome)
        // Events contain multiple markets, we want the primary one
        const market = event.markets?.[0];
        if (!market) {
          return null;
        }

        // Parse outcome prices if available
        let currentOdds = 0.5; // Default
        if (market.outcomePrices) {
          try {
            const prices = typeof market.outcomePrices === "string" 
              ? JSON.parse(market.outcomePrices) 
              : market.outcomePrices;
            currentOdds = Number(prices[0] || 0.5);
          } catch (e) {
            // Use default
            console.warn("Failed to parse outcomePrices for event:", event.id, e);
          }
        }

        // Category from event - normalize to match filter categories
        const rawCategory = event.category || 
                         event.tags?.[0]?.label || 
                         extractCategoryFromQuestion(event.title || "");
        
        // Normalize category names to match filter categories
        const category = normalizeCategory(rawCategory);

        // Build URL from event slug
        const eventSlug = event.slug || event.id;
        const url = `https://polymarket.com/event/${eventSlug}`;

        return {
          id: event.id || eventSlug,
          title: event.title || "Market",
          category: category,
          platform: "polymarket" as const,
          volume_24h: volumeNum,
          current_odds: Math.max(0, Math.min(1, currentOdds)),
          url: url,
        };
      } catch (error) {
        console.error("Error parsing event:", event.id, error);
        return null;
      }
    })
    .filter((m): m is PolymarketTopMarket => m !== null)  // Remove nulls
    .sort((a: PolymarketTopMarket, b: PolymarketTopMarket) => b.volume_24h - a.volume_24h);  // Sort by volume desc

  console.log(`Polymarket Events: Transformed ${markets.length} markets from ${events.length} events`);
  
  // Log category distribution
  const categoryCount: Record<string, number> = {};
  markets.forEach(m => {
    categoryCount[m.category] = (categoryCount[m.category] || 0) + 1;
  });
  console.log("[Polymarket] Categories found:", categoryCount);
  
  // Return ALL markets (not just top N) - let the frontend filter by category
  return markets;
}

/**
 * Normalize category names to match filter categories
 */
function normalizeCategory(category: string): string {
  if (!category) return "Other";
  
  const cat = category.toLowerCase();
  
  // Map to filter categories
  if (cat.includes("politics") || cat.includes("election") || cat.includes("government") || 
      cat.includes("gov shutdown") || cat.includes("shutdown") || cat.includes("senate") ||
      cat.includes("congress") || cat.includes("president") || cat.includes("biden") ||
      cat.includes("trump") || cat.includes("harris") || cat.includes("democrat") ||
      cat.includes("republican") || cat.includes("ukraine") || cat.includes("war")) {
    return "Politics";
  }
  
  if (cat.includes("sports") || cat.includes("nfl") || cat.includes("nba") ||
      cat.includes("football") || cat.includes("basketball") || cat.includes("super bowl") ||
      cat.includes("nhl") || cat.includes("hockey") || cat.includes("soccer") ||
      cat.includes("mlb") || cat.includes("baseball") || cat.includes("tennis") ||
      cat.includes("golf") || cat.includes("ufc") || cat.includes("mma")) {
    return "Sports";
  }
  
  if (cat.includes("crypto") || cat.includes("bitcoin") || cat.includes("btc") ||
      cat.includes("ethereum") || cat.includes("eth") || cat.includes("blockchain")) {
    return "Crypto";
  }
  
  // Social - now includes culture/entertainment content
  if (cat.includes("social") || cat.includes("twitter") || cat.includes("elon") ||
      cat.includes("musk") || cat.includes("facebook") || cat.includes("instagram") ||
      cat.includes("culture") || cat.includes("oscar") || cat.includes("movie") ||
      cat.includes("netflix") || cat.includes("entertainment") || cat.includes("music") ||
      cat.includes("celebrity") || cat.includes("mrbeast") || cat.includes("youtube") ||
      cat.includes("streaming") || cat.includes("tiktok") || cat.includes("influencer")) {
    return "Social";
  }
  
  if (cat.includes("tech") || cat.includes("technology") || cat.includes("ai") ||
      cat.includes("spacex") || cat.includes("agi")) {
    // Tech could be mapped to Culture or Other, let's use Other for now
    return "Other";
  }
  
  return "Other";
}

/**
 * Extract category from market question if tags are missing
 */
function extractCategoryFromQuestion(question: string): string {
  if (!question) return "Other";
  
  const q = question.toLowerCase();
  
  // Politics - check first (most common)
  if (q.includes("election") || q.includes("president") || q.includes("trump") ||
      q.includes("government") || q.includes("senate") || q.includes("shutdown") ||
      q.includes("democrat") || q.includes("republican") || q.includes("congress") ||
      q.includes("fed") || q.includes("rate") || q.includes("biden") || q.includes("harris")) {
    return "Politics";
  }
  
  // Sports - expanded keywords for better detection
  if (q.includes("nfl") || q.includes("nba") || q.includes("super bowl") ||
      q.includes("football") || q.includes("basketball") || q.includes("mvp") ||
      q.includes("champion") || q.includes("mlb") || q.includes("world series") ||
      q.includes("playoff") || q.includes("finals") || q.includes("ncaa") || q.includes("ncaab") ||
      q.includes("nhl") || q.includes("hockey") || q.includes("soccer") || q.includes("fifa") ||
      q.includes("premier league") || q.includes("uefa") || q.includes("champions league") ||
      q.includes("world cup") || q.includes("olympics") || q.includes("boxing") ||
      q.includes("ufc") || q.includes("mma") || q.includes("tennis") || q.includes("golf") ||
      q.includes("formula 1") || q.includes("f1") || q.includes("nascar") ||
      q.includes("college football") || q.includes("college basketball") ||
      q.includes("baseball") || q.includes("nhl") || q.includes("stanley cup")) {
    return "Sports";
  }
  
  // Crypto - expanded keywords
  if (q.includes("bitcoin") || q.includes("btc") || q.includes("crypto") ||
      q.includes("ethereum") || q.includes("eth") || q.includes("doge") ||
      q.includes("blockchain") || q.includes("defi") || q.includes("coin") ||
      q.includes("solana") || q.includes("cardano") || q.includes("polygon")) {
    return "Crypto";
  }
  
  // Social - now includes culture/entertainment content
  if (q.includes("twitter") || q.includes("elon") || q.includes("musk") ||
      q.includes("social media") || q.includes("facebook") || q.includes("tweet") ||
      q.includes("instagram") || q.includes("tiktok") || q.includes("x.com") ||
      q.includes("linkedin") || q.includes("reddit") ||
      // Culture/entertainment keywords now map to Social
      q.includes("oscar") || q.includes("movie") || q.includes("netflix") ||
      q.includes("mrbeast") || q.includes("video") || q.includes("celebrity") ||
      q.includes("music") || q.includes("emmy") || q.includes("grammy") || q.includes("entertainment") ||
      q.includes("streaming") || q.includes("youtube") || q.includes("spotify") ||
      q.includes("influencer") || q.includes("podcast") || q.includes("award") ||
      q.includes("film") || q.includes("tv show")) {
    return "Social";
  }
  
  // Default to Other
  return "Other";
}

/**
 * Fetches top markets from Polymarket GraphQL subgraph (fallback)
 */
async function fetchPolymarketTopMarketsFromSubgraph(limit: number): Promise<PolymarketTopMarket[]> {
  try {
    const subgraphUrl = "https://api.thegraph.com/subgraphs/name/polymarket";
    
    const query = `
      query GetTopMarkets($limit: Int!) {
        markets(
          first: 100
          orderBy: volume
          orderDirection: desc
          where: { active: true }
        ) {
          id
          question
          volume
          volume24h
          outcomes {
            price
          }
          conditionId
          slug
          category
        }
      }
    `;

    const response = await fetch(subgraphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { limit },
      }),
    });

    if (!response.ok) {
      throw new Error(`Polymarket GraphQL error: ${response.status}`);
    }

    const data = await response.json();
    
    return transformPolymarketTopMarketsFromSubgraph(data, limit);
  } catch (error) {
    console.error("Error fetching Polymarket top markets from GraphQL:", error);
    return [];
  }
}

/**
 * Transforms Polymarket REST API response to TopMarket format
 */
function transformPolymarketTopMarkets(data: any, limit: number): PolymarketTopMarket[] {
  if (!data) {
    console.warn("Polymarket API returned empty data");
    return [];
  }

  // Handle different response structures
  const markets = Array.isArray(data) 
    ? data 
    : (data.data || data.markets || data.results || []);
  
  if (!Array.isArray(markets) || markets.length === 0) {
    console.warn("Polymarket API: No markets found in response", Object.keys(data));
    return [];
  }

  // Filter active markets with volume > 0 and transform
  const transformed = markets
    .filter((market: any) => {
      const isActive = market.active !== false && 
                       market.status !== "closed" && 
                       market.state !== "closed";
      
      // Try multiple volume field names
      const volume = market.volume24h || market.volume_24h || 
                     market.volume || market.totalVolume || 
                     market.dailyVolume || market.daily_volume || 0;
      
      return isActive && Number(volume) > 0;
    })
    .map((market: any) => {
      // Extract volume (try multiple field names)
      const volume24h = market.volume24h || market.volume_24h || 
                        market.volume || market.totalVolume || 
                        market.dailyVolume || market.daily_volume || 0;
      
      // Extract odds (Polymarket uses decimal 0-1)
      let price = market.outcomes?.[0]?.price || 
                  market.yes_price || market.yesPrice || 
                  market.price || market.lastPrice || 0.5;
      
      if (typeof price === "string") {
        price = parseFloat(price);
      }
      
      // If price is in cents (0-100), convert to decimal (0-1)
      if (price > 1) {
        price = price / 100;
      }
      
      const odds = Math.max(0, Math.min(1, price || 0.5));
      
      // Extract market info
      const slug = market.slug || market.conditionId || market.condition_id || market.id;
      const title = market.question || market.title || market.name || "Market";
      
      // Extract category (try multiple field names)
      const category = market.category || 
                       market.tags?.[0] || 
                       market.group || 
                       market.topic || 
                       "General";

      return {
        id: slug || market.conditionId || market.id,
        title: title,
        category: category,
        platform: "polymarket" as const,
        volume_24h: Number(volume24h),
        current_odds: odds,
        url: `https://polymarket.com/event/${slug || market.conditionId || market.id}`,
      };
    })
    .sort((a: PolymarketTopMarket, b: PolymarketTopMarket) => b.volume_24h - a.volume_24h) // Sort by volume descending
    .slice(0, limit);

  console.log(`Polymarket: Transformed ${transformed.length} markets from ${markets.length} total`);
  
  return transformed;
}

/**
 * Transforms Polymarket GraphQL subgraph response to TopMarket format
 */
function transformPolymarketTopMarketsFromSubgraph(data: any, limit: number): PolymarketTopMarket[] {
  if (!data?.data?.markets || !Array.isArray(data.data.markets)) {
    console.warn("Polymarket GraphQL: No markets found in response");
    return [];
  }

  const markets = data.data.markets;

  // Filter markets with volume > 0 and transform
  const transformed = markets
    .filter((market: any) => {
      const volume = market.volume24h || market.volume || 0;
      return Number(volume) > 0;
    })
    .map((market: any) => {
      // Extract volume
      const volume24h = market.volume24h || market.volume || 0;
      
      // Extract odds (Polymarket uses decimal 0-1)
      let price = market.outcomes?.[0]?.price || 0.5;
      
      if (typeof price === "string") {
        price = parseFloat(price);
      }
      
      // If price is in cents (0-100), convert to decimal (0-1)
      if (price > 1) {
        price = price / 100;
      }
      
      const odds = Math.max(0, Math.min(1, price || 0.5));
      
      // Extract market info
      const slug = market.slug || market.conditionId || market.id;
      const title = market.question || market.title || "Market";
      const category = market.category || market.tags?.[0] || "General";

      return {
        id: slug || market.conditionId || market.id,
        title: title,
        category: category,
        platform: "polymarket" as const,
        volume_24h: Number(volume24h),
        current_odds: odds,
        url: `https://polymarket.com/event/${slug || market.conditionId || market.id}`,
      };
    })
    .sort((a: PolymarketTopMarket, b: PolymarketTopMarket) => b.volume_24h - a.volume_24h) // Sort by volume descending
    .slice(0, limit);

  console.log(`Polymarket GraphQL: Transformed ${transformed.length} markets from ${markets.length} total`);
  
  return transformed;
}

