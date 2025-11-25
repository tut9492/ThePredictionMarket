import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

/**
 * Market configuration
 * Identifiers extracted from URLs in LANDING_MARKETS:
 * - Polymarket: slug from /event/{slug}
 * - Kalshi: ticker from /markets/{ticker} (last segment of URL path)
 */
const MARKETS_CONFIG = [
  {
    platform: 'Kalshi',
    identifier: 'kxsb-26', // From: https://kalshi.com/markets/kxsb/super-bowl/kxsb-26
    type: 'sports',
  },
  {
    platform: 'Polymarket',
    identifier: 'super-bowl-champion-2026-731', // From: https://polymarket.com/event/super-bowl-champion-2026-731
    type: 'sports',
  },
  {
    platform: 'Kalshi',
    identifier: 'kxpresnomd-28', // From: https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28
    type: 'politics',
  },
  {
    platform: 'Polymarket',
    identifier: 'democratic-presidential-nominee-2028', // From: https://polymarket.com/event/democratic-presidential-nominee-2028
    type: 'politics',
  },
];

interface MarketData {
  platform: string;
  marketId: string;
  marketName: string;
  odds: string;
  yes: number;
  no: number;
  volume: string;
  rawVolume: number;
  url?: string;
}

/**
 * Fetch market data from Polymarket
 * Polymarket uses events API - we need to search through events to find the one with matching slug
 */
async function fetchPolymarketMarket(slug: string): Promise<MarketData | null> {
  try {
    // Polymarket uses events API, fetch events and search for matching slug
    const url = new URL("https://gamma-api.polymarket.com/events");
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("limit", "500"); // Get enough events to find ours
    
    const response = await fetch(url.toString(), {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(10000),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Polymarket] API error: ${response.status}`);
      return null;
    }

    const events: any[] = await response.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      console.error(`[Polymarket] No events found`);
      return null;
    }

    // Find event with matching slug
    const event = events.find((e: any) => e.slug === slug || e.ticker === slug);
    
    if (!event) {
      console.error(`[Polymarket] No event found with slug: ${slug}`);
      return null;
    }
    
    // Get the first market from the event
    const markets = event.markets || [];
    if (markets.length === 0) {
      console.error(`[Polymarket] Event ${slug} has no markets`);
      return null;
    }

    const market = markets[0];
    
    // Extract market information
    const title = event.title || market.question || 'Unknown Market';
    
    // Parse outcome prices - they're stored as JSON string
    let yes = 50;
    let no = 50;
    try {
      const outcomePrices = typeof market.outcomePrices === 'string' 
        ? JSON.parse(market.outcomePrices) 
        : market.outcomePrices;
      
      if (Array.isArray(outcomePrices) && outcomePrices.length >= 2) {
        // Prices are in decimal (0-1), convert to cents (0-100)
        yes = Math.round(Number(outcomePrices[0]) * 100);
        no = Math.round(Number(outcomePrices[1]) * 100);
      }
    } catch (e) {
      console.warn(`[Polymarket] Failed to parse outcomePrices for ${slug}:`, e);
    }

    // Parse outcomes to get candidate names
    let outcomes: string[] = [];
    try {
      outcomes = typeof market.outcomes === 'string' 
        ? JSON.parse(market.outcomes) 
        : market.outcomes || [];
    } catch (e) {
      console.warn(`[Polymarket] Failed to parse outcomes for ${slug}:`, e);
    }

    // Format candidates for odds display (exclude Yes/No)
    const candidates = outcomes
      .filter((o: string) => o !== 'Yes' && o !== 'No')
      .slice(0, 2);
    
    const oddsText = candidates.length > 0 
      ? candidates.join(' vs ') 
      : 'Yes vs No';

    // Get volume from event (24h volume)
    const volume24h = event.volume24hr || event.volume || market.volume || 0;
    const volumeNum = typeof volume24h === 'string' ? parseFloat(volume24h) : volume24h;
    const volumeFormatted = formatVolume(volumeNum);

    return {
      platform: 'Polymarket',
      marketId: slug,
      marketName: title,
      odds: oddsText,
      yes,
      no: no === 50 ? 100 - yes : no, // Ensure they add up to 100
      volume: volumeFormatted,
      rawVolume: volumeNum,
      url: `https://polymarket.com/event/${slug}`,
    };
  } catch (error) {
    console.error(`[Polymarket] Error fetching market ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch market data from Kalshi
 * Kalshi doesn't have a direct endpoint for single markets, so we search through all markets
 */
async function fetchKalshiMarket(ticker: string): Promise<MarketData | null> {
  try {
    // Fetch all open markets and search for the one with matching ticker
    const url = new URL("https://api.elections.kalshi.com/trade-api/v2/markets");
    url.searchParams.set("status", "open");
    url.searchParams.set("limit", "500"); // Get enough markets to find ours
    
    const response = await fetch(url.toString(), {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(10000),
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Kalshi] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || !data.markets || !Array.isArray(data.markets)) {
      console.error(`[Kalshi] Invalid response format`);
      return null;
    }

    // Find market with matching ticker
    const market = data.markets.find((m: any) => m.ticker === ticker);
    
    if (!market) {
      console.error(`[Kalshi] Market ${ticker} not found in results`);
      return null;
    }

    // Extract market information
    const title = market.title || 'Unknown Market';
    
    // Kalshi prices are in cents (0-100)
    // Use yes_bid or yes_ask, or last_price as fallback
    const yes = market.yes_bid || market.yes_ask || market.last_price || 50;
    const no = market.no_bid || market.no_ask || (100 - yes);

    // Get candidate names from subtitle fields
    const yesSubtitle = market.yes_sub_title || '';
    const noSubtitle = market.no_sub_title || '';
    
    let oddsText = 'Yes vs No';
    if (yesSubtitle && noSubtitle) {
      oddsText = `${yesSubtitle} vs ${noSubtitle}`;
    } else if (yesSubtitle) {
      oddsText = yesSubtitle;
    } else if (noSubtitle) {
      oddsText = noSubtitle;
    }

    // Get volume (Kalshi volume is in cents)
    const volume24h = market.volume_24h || market.volume || 0;
    const volumeNum = typeof volume24h === 'number' ? volume24h / 100 : 0; // Convert cents to dollars
    const volumeFormatted = formatVolume(volumeNum);

    return {
      platform: 'Kalshi',
      marketId: ticker,
      marketName: title,
      odds: oddsText,
      yes: Math.round(yes),
      no: Math.round(no),
      volume: volumeFormatted,
      rawVolume: volumeNum,
      url: `https://kalshi.com/markets/${ticker}`,
    };
  } catch (error) {
    console.error(`[Kalshi] Error fetching market ${ticker}:`, error);
    return null;
  }
}

/**
 * Format volume as string (e.g., "34.5M", "543M")
 */
function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B`;
  } else if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  } else if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toFixed(0);
}

/**
 * GET /api/markets/update
 * Fetches live data for configured markets
 */
export async function GET() {
  try {
    const marketPromises = MARKETS_CONFIG.map(async (config) => {
      if (config.platform === 'Polymarket') {
        return fetchPolymarketMarket(config.identifier);
      } else if (config.platform === 'Kalshi') {
        return fetchKalshiMarket(config.identifier);
      }
      return null;
    });

    const results = await Promise.all(marketPromises);
    const validMarkets = results.filter((market): market is MarketData => market !== null);

    return NextResponse.json({
      success: true,
      data: validMarkets,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Markets Update] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

