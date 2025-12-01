import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { PolymarketAdapter } from "@/lib/platforms/polymarket";
import { PlatformAdapter } from "@/lib/platforms/base/types";
import { getImageUrl } from "@/lib/utils/images";
import { matchSearchTerms } from "@/lib/utils/search";
import { extractCandidatesFromPolymarket } from "@/lib/utils/candidates";
import { formatVolume } from "@/lib/utils/volume";
import { extractImageUrl } from "@/lib/utils/images";
import { addPolymarketReferral } from "@/lib/utils/polymarket";

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

const DATA_FILE = join(process.cwd(), 'data', 'markets.json');

interface StoredMarket {
  key: string;
  category: string;
  image: string;
  polymarket: {
    title: string;
    candidates: Array<{ name: string; odds: number }>;
    volume: string;
    url: string;
  };
  lastUpdated: string;
}

/**
 * Fetch markets using optimized approach - ONE API call instead of 20
 * Fetches all events once, then searches through them for each market config
 * This prevents Vercel timeout by reducing API calls from 20 to 1
 */
async function fetchMarketsFromSync(): Promise<Record<string, StoredMarket>> {
  const markets: Record<string, StoredMarket> = {};
  
  try {
    const adapters: PlatformAdapter[] = [new PolymarketAdapter()];
    
    for (const adapter of adapters) {
      // Make ONE API call to fetch all events (instead of 20 separate calls)
      let allEvents: any[] = [];
      try {
        const url = new URL(`${adapter.apiBase}/events`);
        url.searchParams.set("active", "true");
        url.searchParams.set("closed", "false");
        url.searchParams.set("limit", "200");
        url.searchParams.set("order", "volume");
        url.searchParams.set("ascending", "false");

        const response = await fetch(url.toString(), {
          signal: AbortSignal.timeout(10000), // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`[Markets Data] API error: ${response.status}`);
          return {};
        }

        allEvents = await response.json();
        if (!Array.isArray(allEvents) || allEvents.length === 0) {
          console.warn('[Markets Data] No events returned from API');
          return {};
        }
        
        console.log(`[Markets Data] Fetched ${allEvents.length} events in single API call`);
      } catch (error) {
        console.error('[Markets Data] Error fetching events:', error);
        return {};
      }

      // Now search through the cached events for each market config
      for (const config of adapter.configs) {
        try {
          // Search through cached events instead of making new API call
          const matchingEvent = matchSearchTerms(
            allEvents,
            config.searchTerms,
            (e) => e.title || '',
            (e) => e.slug || '',
            (e) => e.volume || e.volume24hr || 0
          );

          if (!matchingEvent) {
            console.warn(`[Markets Data] No match found for: ${config.key}`);
            continue;
          }

          const eventMarkets = matchingEvent.markets || [];
          if (eventMarkets.length === 0) {
            continue;
          }

          // Extract candidates
          const candidates = extractCandidatesFromPolymarket(eventMarkets, matchingEvent.title || '');

          // Get volume
          const volume = matchingEvent.volume || matchingEvent.volume24hr || matchingEvent.volume7d || 0;
          const volumeNum = typeof volume === 'string' ? parseFloat(volume) : volume;
          const volumeFormatted = formatVolume(volumeNum);

          // Extract image
          const imageUrl = extractImageUrl(matchingEvent, eventMarkets[0], '');
          const marketImage = getImageUrl(imageUrl, config.image);

          // Build URL
          const slug = matchingEvent.slug || matchingEvent.ticker || '';
          const baseUrl = `${adapter.websiteBase}/event/${slug}`;
          const urlWithReferral = addPolymarketReferral(baseUrl);

          markets[config.key] = {
            key: config.key,
            category: config.category,
            image: marketImage,
            polymarket: {
              title: matchingEvent.title || eventMarkets[0].question || 'Unknown Market',
              candidates: candidates || [],
              volume: volumeFormatted,
              url: urlWithReferral,
            },
            lastUpdated: new Date().toISOString(),
          };
          
          console.log(`[Markets Data] Matched ${config.key}: ${candidates?.length || 0} candidates`);
        } catch (error) {
          console.error(`[Markets Data] Error processing ${config.key}:`, error);
        }
      }
    }
    
    console.log(`[Markets Data] Fetched ${Object.keys(markets).length} markets from optimized sync`);
    return markets;
  } catch (error) {
    console.error('[Markets Data] Error in fetchMarketsFromSync:', error);
    return {};
  }
}

/**
 * GET /api/markets/data
 * Returns stored market data from the backend
 * Supports category filtering via ?category= query parameter
 * Falls back to fetching from sync logic if file system is unavailable (Vercel)
 * Uses batched processing to avoid Vercel's 10-second timeout
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let fileData: any = null;
    let markets: Record<string, any> = {};
    
    // Try to read the stored data file (works locally, may fail on Vercel)
    try {
      const fileContents = await readFile(DATA_FILE, 'utf-8');
      fileData = JSON.parse(fileContents);
    
      // Handle both array and object formats
      if (Array.isArray(fileData.markets)) {
        // If it's an array, convert to object keyed by market key
        fileData.markets.forEach((market: any) => {
          const key = market.key || market.id || `market_${market.id}`;
          markets[key] = market;
        });
      } else if (fileData.markets && typeof fileData.markets === 'object') {
        markets = fileData.markets;
      } else if (typeof fileData === 'object' && !Array.isArray(fileData)) {
        // If fileData itself is the markets object
        markets = fileData;
      }
    } catch (fileError) {
      // File system unavailable (Vercel) - use sync logic (batched to avoid timeout)
      console.log('[Markets Data] File system unavailable, fetching from sync logic...');
      markets = await fetchMarketsFromSync();
      fileData = { lastUpdated: new Date().toISOString() };
    }
    
    // Filter by category if specified
    if (category && category.toLowerCase() !== 'all') {
      const categoryLower = category.toLowerCase();
      const filteredMarkets: Record<string, any> = {};
      Object.entries(markets).forEach(([key, market]: [string, any]) => {
        if (market.category && market.category.toLowerCase() === categoryLower) {
          filteredMarkets[key] = market;
        }
      });
      markets = filteredMarkets;
    }
    
    // Transform to match frontend format
    const transformedData: Record<string, any> = {};
    Object.entries(markets).forEach(([key, market]: [string, any]) => {
      transformedData[key] = {
        category: market.category,
        image: market.image || '/superbowl.png',
        polymarket: {
          title: market.polymarket?.title || market.title || '',
          candidates: market.polymarket?.candidates || [],
          volume: market.polymarket?.volume || '0 VOL',
          url: market.polymarket?.url || '',
        },
        kalshi: market.kalshi || {
          title: market.polymarket?.title || market.title || '',
          candidates: market.polymarket?.candidates || [],
          volume: market.polymarket?.volume || '0 VOL',
          url: market.polymarket?.url || '',
        },
        lastUpdated: market.lastUpdated || fileData.lastUpdated || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: Object.keys(transformedData).length,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    // If file doesn't exist or can't be read, return empty
    console.warn('[Markets Data] File not found or error reading:', error);
    return NextResponse.json({
      success: true,
      data: {},
      message: 'No market data available. Run /api/markets/sync first.',
      timestamp: new Date().toISOString(),
    });
  }
}





