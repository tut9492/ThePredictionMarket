import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { PolymarketAdapter } from "@/lib/platforms/polymarket";
import { PlatformAdapter } from "@/lib/platforms/base/types";
import { getImageUrl } from "@/lib/utils/images";

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
 * Fetch markets using the same logic as sync route (reuses sync function)
 * Processes markets in batches to avoid Vercel's 10-second timeout
 */
async function fetchMarketsFromSync(): Promise<Record<string, StoredMarket>> {
  const markets: Record<string, StoredMarket> = {};
  
  try {
    // Use the same sync logic directly (doesn't make HTTP call)
    const adapters: PlatformAdapter[] = [new PolymarketAdapter()];
    
    for (const adapter of adapters) {
      const promises = adapter.configs.map(async (config) => {
        try {
          const marketData = await adapter.searchMarket(config.searchTerms);
          if (marketData && adapter.name === 'Polymarket') {
            const marketImage = getImageUrl(marketData.image, config.image);
            markets[config.key] = {
              key: config.key,
              category: config.category,
              image: marketImage,
              polymarket: {
                title: marketData.title,
                candidates: marketData.candidates || [],
                volume: marketData.volume,
                url: marketData.url,
              },
              lastUpdated: new Date().toISOString(),
            };
            console.log(`[Markets Data] Fetched ${config.key}: ${marketData.candidates?.length || 0} candidates`);
          } else {
            console.warn(`[Markets Data] No data found for ${config.key}`);
          }
        } catch (error) {
          console.error(`[Markets Data] Error fetching ${config.key}:`, error);
        }
      });
      
      // Process in batches to avoid Vercel timeout (5 at a time)
      // This ensures we complete within the 10-second limit
      const batchSize = 5;
      for (let i = 0; i < promises.length; i += batchSize) {
        const batch = promises.slice(i, i + batchSize);
        await Promise.all(batch);
      }
    }
    
    console.log(`[Markets Data] Fetched ${Object.keys(markets).length} markets from sync logic`);
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





