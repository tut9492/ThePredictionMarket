import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

/**
 * Kalshi Events Volume Endpoint
 * Fetches all open events and calculates total trading volume
 * Events are aggregated (e.g., "Pro Football Champion") vs individual markets
 * This gives us the higher volumes we see on Kalshi's website
 * No authentication required - uses public API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const window = searchParams.get("window") || "all";
    
    console.log("[Kalshi Events Volume] Fetching volume data...");

    // Fetch all open markets from Kalshi using pagination
    // We'll group markets by event_ticker to get event-level volumes
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
        console.error("[Kalshi Events Volume] API error:", response.status);
        break;
      }

      const data = await response.json();
      
      if (!data || !data.markets || !Array.isArray(data.markets)) {
        console.error("[Kalshi Events Volume] Invalid response format");
        break;
      }

      allMarkets.push(...data.markets);
      cursor = data.cursor || null;
      pageCount++;
      
      console.log(`[Kalshi Events Volume] Page ${pageCount}: Received ${data.markets.length} markets, cursor: ${cursor ? 'yes' : 'no'}`);

      // Safety check to prevent infinite loops
      if (pageCount >= maxPages) {
        console.warn(`[Kalshi Events Volume] Reached max pages limit (${maxPages}), stopping pagination`);
        break;
      }
    } while (cursor);

    console.log(`[Kalshi Events Volume] Total markets fetched: ${allMarkets.length} across ${pageCount} pages`);

    if (allMarkets.length === 0) {
      return NextResponse.json({ 
        volume: 0,
        event_count: 0,
        error: "No markets found",
        timestamp: new Date().toISOString(),
      });
    }

    // Group markets by event_ticker and sum volumes per event
    const eventVolumes: Record<string, number> = {};
    const eventTitles: Record<string, string> = {};
    
    allMarkets.forEach((market: any) => {
      const eventTicker = market.event_ticker || "UNKNOWN";
      const volume = window === "24h" || window === "7d" 
        ? (market.volume_24h || market.volume || 0)
        : (market.volume || market.volume_24h || 0);
      
      if (!eventVolumes[eventTicker]) {
        eventVolumes[eventTicker] = 0;
        eventTitles[eventTicker] = market.title || eventTicker;
      }
      eventVolumes[eventTicker] += volume;
    });

    const allEvents = Object.keys(eventVolumes).map(eventTicker => ({
      event_ticker: eventTicker,
      title: eventTitles[eventTicker],
      volume: eventVolumes[eventTicker],
    }));

    // Debug: Log sample event to see available fields
    if (allEvents.length > 0) {
      const sample = allEvents[0];
      console.log("[Kalshi Events Volume] Sample event fields:", Object.keys(sample));
      console.log("[Kalshi Events Volume] Sample event:", {
        event_ticker: sample.event_ticker,
        title: sample.title?.substring(0, 50),
        volume: sample.volume,
      });
    }

    // Calculate total volume from aggregated events
    // Volume is in cents, so we need to convert to dollars
    const totalVolumeCents = allEvents.reduce((sum: number, event: any) => {
      return sum + (event.volume || 0);
    }, 0);

    // Convert from cents to dollars
    const totalVolume = totalVolumeCents / 100;

    // Debug: Log top 5 events by volume
    const topEvents = allEvents
      .filter((e: any) => (e.volume || 0) > 0)
      .sort((a: any, b: any) => {
        return (b.volume || 0) - (a.volume || 0);
      })
      .slice(0, 5);

    console.log("[Kalshi Events Volume] Top 5 events by volume:");
    topEvents.forEach((event: any, index: number) => {
      const volume = event.volume || 0;
      const volumeDollars = volume / 100;
      console.log(`  ${index + 1}. ${event.event_ticker || event.title?.substring(0, 40)}: $${volumeDollars.toFixed(2)} (${volume} cents)`);
    });

    // Count events with actual volume
    const activeEvents = allEvents.filter((e: any) => {
      return (e.volume || 0) > 0;
    }).length;

    console.log("[Kalshi Events Volume] Total volume (cents):", totalVolumeCents);
    console.log("[Kalshi Events Volume] Total volume (dollars):", totalVolume);
    console.log("[Kalshi Events Volume] Active events:", activeEvents);

    return NextResponse.json({
      volume: totalVolume, // Volume in dollars
      volume_cents: totalVolumeCents, // Volume in cents (for reference)
      event_count: allEvents.length,
      active_event_count: activeEvents,
      window,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[Kalshi Events Volume] Error:", error);
    return NextResponse.json({ 
      volume: 0,
      event_count: 0,
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
}

