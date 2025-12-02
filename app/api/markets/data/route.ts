import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { PolymarketAdapter } from "@/lib/platforms/polymarket";
import { PlatformAdapter } from "@/lib/platforms/base/types";
import { getImageUrl } from "@/lib/utils/images";
import { matchSearchTerms } from "@/lib/utils/search";
import { extractCandidatesFromPolymarket } from "@/lib/utils/candidates";
import { extractImageUrl } from "@/lib/utils/images";
import { formatVolume } from "@/lib/utils/volume";
import { addPolymarketReferral } from "@/lib/utils/polymarket";
import { getMarkets, isKvAvailable } from "@/lib/storage/kv";

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
 * Fetch markets using optimized single API call approach
 * Makes ONE API call to fetch all events, then processes locally
 * This avoids Vercel timeout and is much faster
 */
async function fetchMarketsFromSync(): Promise<Record<string, StoredMarket>> {
  const markets: Record<string, StoredMarket> = {};
  
  try {
    const adapters: PlatformAdapter[] = [new PolymarketAdapter()];
    
    for (const adapter of adapters) {
      if (adapter.name === 'Polymarket') {
        // OPTIMIZATION: Make ONE API call to fetch all events
        const url = new URL(`${adapter.apiBase}/events`);
        url.searchParams.set("active", "true");
        url.searchParams.set("closed", "false");
        url.searchParams.set("limit", "200");
        url.searchParams.set("order", "volume");
        url.searchParams.set("ascending", "false");

        console.log('[Markets Data] Fetching all events in single API call...');
        const response = await fetch(url.toString(), {
          signal: AbortSignal.timeout(15000),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`[Markets Data] API error: ${response.status}`);
          return {};
        }

        const events: any[] = await response.json();
        console.log(`[Markets Data] Fetched ${events.length} events in single API call`);
        
        if (!Array.isArray(events) || events.length === 0) {
          return {};
        }

        // Now process each config locally using the fetched events
        for (const config of adapter.configs) {
          try {
            // Match event using search terms
            const matchingEvent = matchSearchTerms(
              events,
              config.searchTerms,
              (e) => e.title || '',
              (e) => e.slug || '',
              (e) => e.volume || e.volume24hr || 0
            );

            if (!matchingEvent) {
              console.warn(`[Markets Data] No match found for: ${config.key}`);
              continue;
            }

            const marketMarkets = matchingEvent.markets || [];
            if (marketMarkets.length === 0) {
              console.warn(`[Markets Data] No markets found for event: ${config.key}`);
              continue;
            }

            // Extract candidates
            const candidates = extractCandidatesFromPolymarket(marketMarkets, matchingEvent.title || '');

            // Get volume
            const volume = matchingEvent.volume || matchingEvent.volume24hr || matchingEvent.volume7d || 0;
            const volumeNum = typeof volume === 'string' ? parseFloat(volume) : volume;
            const volumeFormatted = formatVolume(volumeNum);

            // Extract image
            const imageUrl = extractImageUrl(matchingEvent, marketMarkets[0], '');
            const marketImage = getImageUrl(imageUrl, config.image);

            // Build URL with referral
            const slug = matchingEvent.slug || matchingEvent.ticker || '';
            const baseUrl = `${adapter.websiteBase}/event/${slug}`;
            const urlWithReferral = addPolymarketReferral(baseUrl);

            markets[config.key] = {
              key: config.key,
              category: config.category,
              image: marketImage,
              polymarket: {
                title: matchingEvent.title || marketMarkets[0].question || 'Unknown Market',
                candidates: candidates,
                volume: volumeFormatted,
                url: urlWithReferral,
              },
              lastUpdated: new Date().toISOString(),
            };
            console.log(`[Markets Data] Matched ${config.key}: ${candidates.length} candidates`);
          } catch (error) {
            console.error(`[Markets Data] Error processing ${config.key}:`, error);
          }
        }
      }
    }
    
    console.log(`[Markets Data] Processed ${Object.keys(markets).length} markets from single API call`);
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
    
    // Priority 1: Try to read from KV (fastest, works on Vercel)
    const kvAvailable = await isKvAvailable();
    if (kvAvailable) {
      const kvMarkets = await getMarkets();
      if (kvMarkets && Object.keys(kvMarkets).length > 0) {
        console.log('[Markets Data] Using data from KV storage');
        markets = kvMarkets;
        fileData = { lastUpdated: kvMarkets[Object.keys(kvMarkets)[0]]?.lastUpdated || new Date().toISOString() };
      } else {
        console.log('[Markets Data] KV storage empty, falling back to file/API');
      }
    }
    
    // Priority 2: If KV is empty or unavailable, try file system (local dev)
    if (Object.keys(markets).length === 0) {
      const isVercel = process.env.VERCEL === '1';
      
      if (!isVercel) {
        // Local: Try to read from file (faster, works great)
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
          
          if (Object.keys(markets).length > 0) {
            console.log('[Markets Data] Using data from file system');
          }
        } catch (fileError) {
          console.log('[Markets Data] File not found locally');
        }
      }
    }
    
    // Priority 3: If still no data, fetch from API (fallback only)
    if (Object.keys(markets).length === 0) {
      console.log('[Markets Data] No cached data found, fetching from API (this should be rare with cron jobs)...');
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
      // Log image for debugging
      if (key === 'superBowl' || key === 'highestGrossingMovie') {
        console.log(`[Markets Data] ${key} image:`, market.image);
      }
      
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
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





