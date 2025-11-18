import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

/**
 * Kalshi Total Volume Endpoint
 * Fetches all open markets and calculates total trading volume
 * No authentication required - uses public API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const window = searchParams.get("window") || "all";
    
    console.log("[Kalshi Volume] Fetching volume data...");

    // Fetch all open markets from Kalshi using pagination
    // Kalshi API uses cursor-based pagination
    const baseUrl = "https://api.elections.kalshi.com/trade-api/v2/markets";
    const allMarkets: any[] = [];
    let cursor: string | null = null;
    let pageCount = 0;
    const maxPages = 100; // Safety limit to prevent infinite loops

    // Fetch all pages using cursor pagination
    do {
      const url = new URL(baseUrl);
      url.searchParams.set("status", "open");
      url.searchParams.set("limit", "500"); // Max per page
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

      if (!response.ok) {
        console.error("[Kalshi Volume] API error:", response.status);
        break;
      }

      const data = await response.json();
      
      if (!data || !data.markets || !Array.isArray(data.markets)) {
        console.error("[Kalshi Volume] Invalid response format");
        break;
      }

      allMarkets.push(...data.markets);
      cursor = data.cursor || null;
      pageCount++;
      
      console.log(`[Kalshi Volume] Page ${pageCount}: Received ${data.markets.length} markets, cursor: ${cursor ? 'yes' : 'no'}`);

      // Safety check to prevent infinite loops
      if (pageCount >= maxPages) {
        console.warn(`[Kalshi Volume] Reached max pages limit (${maxPages}), stopping pagination`);
        break;
      }
    } while (cursor);

    console.log(`[Kalshi Volume] Total markets fetched: ${allMarkets.length} across ${pageCount} pages`);

    if (allMarkets.length === 0) {
      return NextResponse.json({ 
        volume: 0,
        market_count: 0,
        error: "No markets found",
        timestamp: new Date().toISOString(),
      });
    }

    const data = { markets: allMarkets };

    // Debug: Log sample market to see available fields
    if (data.markets.length > 0) {
      const sample = data.markets[0];
      console.log("[Kalshi Volume] Sample market fields:", Object.keys(sample));
      console.log("[Kalshi Volume] Sample market:", {
        ticker: sample.ticker,
        title: sample.title?.substring(0, 50),
        volume: sample.volume,
        volume_24h: sample.volume_24h,
        notional_value: sample.notional_value,
        notional_value_dollars: sample.notional_value_dollars,
      });
    }

    // Calculate total volume
    // Volume is in cents, so we need to convert to dollars
    // Use volume_24h for recent activity, or volume for all-time
    const totalVolumeCents = data.markets.reduce((sum: number, market: any) => {
      // Prefer volume_24h for 24h window, otherwise use volume (all-time)
      const volume = window === "24h" || window === "7d" 
        ? (market.volume_24h || market.volume || 0)
        : (market.volume || market.volume_24h || 0);
      return sum + volume;
    }, 0);

    // Convert from cents to dollars
    const totalVolume = totalVolumeCents / 100;

    // Debug: Log top 5 markets by volume
    const topMarkets = data.markets
      .filter((m: any) => (m.volume_24h || m.volume || 0) > 0)
      .sort((a: any, b: any) => {
        const volA = a.volume_24h || a.volume || 0;
        const volB = b.volume_24h || b.volume || 0;
        return volB - volA;
      })
      .slice(0, 5);

    console.log("[Kalshi Volume] Top 5 markets by volume:");
    topMarkets.forEach((market: any, index: number) => {
      const volume = market.volume_24h || market.volume || 0;
      const volumeDollars = volume / 100;
      console.log(`  ${index + 1}. ${market.ticker}: $${volumeDollars.toFixed(2)} (${volume} cents)`);
    });

    // Count markets with actual volume
    const activeMarkets = data.markets.filter((m: any) => {
      const volume = m.volume_24h || m.volume || 0;
      return volume > 0;
    }).length;

    // Calculate volume by category for additional insights
    // Note: Kalshi API doesn't provide category field, so we'll use "Other" for now
    const volumeByCategory: Record<string, number> = {};
    data.markets.forEach((market: any) => {
      const volume = (market.volume_24h || market.volume || 0) / 100; // Convert to dollars
      const category = market.category || "Other";
      volumeByCategory[category] = (volumeByCategory[category] || 0) + volume;
    });

    console.log("[Kalshi Volume] Total volume (cents):", totalVolumeCents);
    console.log("[Kalshi Volume] Total volume (dollars):", totalVolume);
    console.log("[Kalshi Volume] Active markets:", activeMarkets);
    console.log("[Kalshi Volume] Top categories:", Object.keys(volumeByCategory).slice(0, 5));

    return NextResponse.json({
      volume: totalVolume, // Volume in dollars
      volume_cents: totalVolumeCents, // Volume in cents (for reference)
      market_count: data.markets.length,
      active_market_count: activeMarkets,
      volume_by_category: volumeByCategory,
      window,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[Kalshi Volume] Error:", error);
    return NextResponse.json({ 
      volume: 0,
      market_count: 0,
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
}
