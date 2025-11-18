import type { DataRow, PlatformKey } from "../dune";

/**
 * Limitless API Client
 * Documentation: Check Limitless API docs
 */
export interface LimitlessMarketData {
  volume_usd?: number;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Fetches market data from Limitless API (public endpoints, no auth required)
 * @param timeWindow - Time window for data (24h, 7d, 30d)
 * @returns Array of DataRow objects
 * 
 * Note: Limitless API endpoints may vary - adjust based on actual documentation
 */
export async function fetchLimitlessData(timeWindow: "24h" | "7d" | "30d" | "all"): Promise<DataRow[]> {
  try {
    // Limitless API endpoint (try public endpoint first)
    // Note: This is a placeholder - adjust based on actual Limitless API documentation
    const baseUrl = process.env.LIMITLESS_API_URL || "https://api.limitless.market";
    
    // Calculate time range
    const now = new Date();
    const startDate = new Date(now);
    switch (timeWindow) {
      case "24h":
        startDate.setHours(now.getHours() - 24);
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

    // Try public endpoint (no auth required)
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add API key if configured (optional)
    const apiKey = process.env.LIMITLESS_API_KEY;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(`${baseUrl}/api/v1/markets/stats`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Limitless API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Limitless data to DataRow format
    return transformLimitlessData(data);
  } catch (error) {
    console.error("Error fetching Limitless data:", error);
    return [];
  }
}

/**
 * Transforms Limitless API response to DataRow format
 */
function transformLimitlessData(data: any): DataRow[] {
  // TODO: Adjust based on actual Limitless API response structure
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    timestamp: item.timestamp || item.date || new Date().toISOString(),
    volume_usd: item.volume_usd || item.volume || 0,
    open_interest_usd: item.open_interest_usd || item.open_interest || 0,
  }));
}

/**
 * Top Market type for Limitless
 */
export interface LimitlessTopMarket {
  id: string;
  title: string;
  category: string;
  platform: "limitless";
  volume_24h: number;
  current_odds: number; // 0-1 (e.g., 0.45 = 45%)
  url: string;
}

/**
 * Fetches top 5 markets from Limitless Exchange
 * Endpoint: GET /markets/active/{categoryId}
 * Sorted by volume (highest first)
 * @param limit - Number of markets to return (default: 5)
 * @returns Array of top markets
 */
export async function fetchLimitlessTopMarkets(limit: number = 5): Promise<LimitlessTopMarket[]> {
  try {
    console.log("Limitless: Fetching markets");
    
    // Alternative endpoints to try
    // The correct endpoint is /markets/active (without category ID)
    // Response structure: {data: [...], totalMarketsCount: number}
    // sortBy options: trending, ending_soon, high_value, newest, lp_rewards
    // Use high_value or trending to get top markets by volume
    const endpoints = [
      "https://api.limitless.exchange/markets/active?page=1&limit=50&sortBy=high_value",  // Sort by volume
      "https://api.limitless.exchange/markets/active?page=1&limit=50&sortBy=trending",  // Sort by trending
      "https://api.limitless.exchange/markets/active?page=1&limit=50",  // No sortBy (fallback)
      "https://api.limitless.exchange/markets/active/1?page=1&limit=50&sortBy=high_value",
    ];

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log("Limitless: Trying endpoint", endpoint);
        
        const response = await fetch(endpoint, {
          next: { revalidate: 300 }, // Cache for 5 minutes
          signal: AbortSignal.timeout(10000), // 10s timeout
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/json',
          },
        });

        console.log("Limitless: Response status", response.status);

        if (!response.ok) {
          console.warn(`Limitless API error (${endpoint}): ${response.status} ${response.statusText}`);
          continue; // Try next endpoint
        }

        const data = await response.json();
        console.log("Limitless: Response data keys:", Object.keys(data));
        
        // Log response structure for debugging
        if (data && (Array.isArray(data) || data.markets || data.data)) {
          const sample = Array.isArray(data) ? data[0] : (data.markets?.[0] || data.data?.[0]);
          if (sample) {
            console.log("Limitless API response sample:", JSON.stringify(sample).substring(0, 500));
          }
        }
        
        const markets = transformLimitlessTopMarkets(data, limit);
        console.log("Limitless: Transformed", markets.length, "markets");
        
        if (markets.length > 0) {
          console.log("Limitless: Returning", markets.length, "markets");
          return markets;
        } else {
          console.warn("Limitless: No markets after transformation, trying next endpoint");
        }
      } catch (error) {
        console.warn(`Limitless endpoint failed (${endpoint}):`, error);
        continue; // Try next endpoint
      }
    }

    // If all endpoints fail, return empty array
    console.warn("Limitless: All API endpoints failed");
    return [];
  } catch (error) {
    console.error("Limitless: Fetch failed:", error);
    return [];
  }
}

/**
 * Transforms Limitless API response to TopMarket format
 * Handles different response structures (array, wrapped in object, etc.)
 */
function transformLimitlessTopMarkets(data: any, limit: number): LimitlessTopMarket[] {
  if (!data) {
    console.warn("Limitless API: No data in response");
    return [];
  }

  // Response structure (adjust based on actual response):
  // Could be: { markets: [...] } or { data: [...] } or just [...]
  let markets: any[] = [];
  
  if (Array.isArray(data)) {
    markets = data;
    console.log("Limitless: Response is direct array with", markets.length, "items");
  } else if (data.markets && Array.isArray(data.markets)) {
    markets = data.markets;
    console.log("Limitless: Response has markets array with", markets.length, "items");
  } else if (data.data && Array.isArray(data.data)) {
    markets = data.data;
    console.log("Limitless: Response has data array with", markets.length, "items");
  } else if (data.results && Array.isArray(data.results)) {
    markets = data.results;
    console.log("Limitless: Response has results array with", markets.length, "items");
  } else {
    console.warn("Limitless API: Unknown response format. Keys:", Object.keys(data));
    if (data && typeof data === 'object') {
      console.warn("Limitless: Full response structure:", JSON.stringify(data).substring(0, 500));
    }
    return [];
  }

  if (!Array.isArray(markets) || markets.length === 0) {
    console.warn("Limitless API: No markets found in response");
    return [];
  }

  console.log(`Limitless: Processing ${markets.length} markets`);

  // Filter, map, and take top 5
  const filtered = markets
    .filter((market: any) => {
      // Volume is a string in USDC cents (6 decimals), or use volumeFormatted
      // volumeFormatted is already in USD (e.g., "450.835826")
      const volStr = market.volumeFormatted || market.volume || "0";
      const vol = parseFloat(volStr);
      
      // If volume is a large number (in cents), divide by 1,000,000
      // Otherwise assume it's already in USD
      const volumeUsd = vol > 1000000 ? vol / 1000000 : vol;
      
      const hasVolume = volumeUsd > 100; // At least $100 volume
      if (!hasVolume) {
        console.log("Limitless: Market filtered out (low volume):", market.title || market.id, "volume:", volumeUsd);
      }
      return hasVolume;
    })
    .sort((a: any, b: any) => {
      // Sort by volume descending (client-side sort)
      const volAStr = a.volumeFormatted || a.volume || "0";
      const volBStr = b.volumeFormatted || b.volume || "0";
      const volA = parseFloat(volAStr);
      const volB = parseFloat(volBStr);
      const volumeA = volA > 1000000 ? volA / 1000000 : volA;
      const volumeB = volB > 1000000 ? volB / 1000000 : volB;
      return volumeB - volumeA;
    })
    .slice(0, limit) // Take top N
    .map((market: any) => {
      // Extract volume - prefer volumeFormatted (already in USD)
      // Otherwise parse volume string (in USDC cents, divide by 1M)
      let volume = 0;
      if (market.volumeFormatted) {
        volume = parseFloat(market.volumeFormatted);
      } else if (market.volume) {
        const vol = parseFloat(market.volume);
        // If it's a large number (likely in cents), divide by 1,000,000
        volume = vol > 1000000 ? vol / 1000000 : vol;
      } else {
        volume = parseFloat(market.volumeUsd || market.totalVolume || market.liquidity || market.value || "0");
      }

      // Extract probability/odds (0-1 range)
      // Limitless API returns prices as array [yesPrice, noPrice] in percentage (0-100)
      let odds = 0.5; // Default
      if (market.prices && Array.isArray(market.prices) && market.prices.length > 0) {
        // prices[0] is YES price in percentage (e.g., 48.9 = 48.9%)
        odds = parseFloat(market.prices[0]) / 100; // Convert to 0-1 range
      } else if (market.probability !== undefined) {
        odds = parseFloat(market.probability);
        if (odds > 1) odds = odds / 100; // Convert percentage to decimal
      } else if (market.price !== undefined) {
        odds = parseFloat(market.price);
        if (odds > 1) odds = odds / 100;
      } else if (market.yesPrice !== undefined) {
        odds = parseFloat(market.yesPrice);
        if (odds > 1) odds = odds / 100;
      }

      // Ensure odds is between 0 and 1
      odds = Math.max(0, Math.min(1, odds));

      // Extract category - Limitless returns categories as array ["Hourly"]
      const category = 
        (market.categories && Array.isArray(market.categories) && market.categories[0]) ||
        market.category?.name || 
        market.categoryName || 
        market.category ||
        extractCategoryFromQuestion(market.title || market.question || market.name || "");

      // Build URL
      const slug = market.slug || market.id || market.address;
      const url = `https://limitless.exchange/markets/${slug}`;

      return {
        id: market.id || market.address || market.slug || "unknown",
        title: market.title || market.question || market.name || "Unknown Market",
        category: category,
        platform: "limitless" as const,
        volume_24h: volume,
        current_odds: Math.max(0, Math.min(1, odds)),
        url: url,
      };
    });

  console.log(`Limitless: Transformed ${filtered.length} markets from ${markets.length} total`);
  
  if (filtered.length === 0) {
    console.warn("Limitless: No markets passed filters. Sample market:", JSON.stringify(markets[0]).substring(0, 300));
  }
  
  return filtered;
}

/**
 * Extract category from market question if tags are missing
 */
function extractCategoryFromQuestion(question: string): string {
  if (!question) return "General";
  
  const q = question.toLowerCase();
  
  if (q.includes("bitcoin") || q.includes("crypto") || q.includes("ethereum") || q.includes("btc") || q.includes("eth") || q.includes("doge") || q.includes("hype")) {
    return "Crypto";
  }
  if (q.includes("election") || q.includes("president") || q.includes("trump") || q.includes("biden")) {
    return "Politics";
  }
  if (q.includes("nfl") || q.includes("nba") || q.includes("super bowl") || q.includes("ncaa") || q.includes("lol") || q.includes("worlds")) {
    return "Sports";
  }
  if (q.includes("stock") || q.includes("ipo") || q.includes("earnings") || q.includes("s&p") || q.includes("sp500")) {
    return "Business";
  }
  if (q.includes("fed") || q.includes("rate") || q.includes("inflation") || q.includes("interest") || q.includes("cuts")) {
    return "Economics";
  }
  if (q.includes("ai") || q.includes("technology") || q.includes("spacex") || q.includes("agi")) {
    return "Technology";
  }
  if (q.includes("oscars") || q.includes("movie") || q.includes("netflix") || q.includes("entertainment")) {
    return "Entertainment";
  }
  
  return "General";
}

