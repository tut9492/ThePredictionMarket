/**
 * Main Sync Route - Uses Modular Architecture
 * This route uses platform adapters for extensible multi-platform support
 */

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { PolymarketAdapter } from "@/lib/platforms/polymarket";
import { PlatformAdapter } from "@/lib/platforms/base/types";
import { getImageUrl } from "@/lib/utils/images";
import { storeMarkets, isKvAvailable } from "@/lib/storage/kv";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

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

const DATA_FILE = join(process.cwd(), 'data', 'markets.json');

/**
 * Sync markets from a platform adapter
 */
async function syncPlatformMarkets(
  adapter: PlatformAdapter,
  markets: Record<string, StoredMarket>
): Promise<void> {
  console.log(`[Sync] Syncing ${adapter.name} markets...`);
  
  const promises = adapter.configs.map(async (config) => {
    const marketData = await adapter.searchMarket(config.searchTerms);
    
    if (marketData) {
      // Use API image if valid, otherwise fallback to config image
      const marketImage = getImageUrl(marketData.image, config.image);
      
      // For Polymarket, store in polymarket field (future: support other platforms)
      if (adapter.name === 'Polymarket') {
        markets[config.key] = {
          key: config.key,
          category: config.category,
          image: marketImage,
          polymarket: {
            title: marketData.title,
            candidates: marketData.candidates,
            volume: marketData.volume,
            url: marketData.url,
          },
          lastUpdated: new Date().toISOString(),
        };
      }
      
      console.log(`[Sync] Found: ${config.key} (${adapter.name})`);
    } else {
      console.warn(`[Sync] Not found: ${config.key} (${adapter.name})`);
    }
  });
  
  await Promise.all(promises);
}

/**
 * GET /api/markets/sync
 * Fetches all markets from platform adapters and stores them
 * Now uses modular architecture for extensible multi-platform support
 */
export async function GET() {
  try {
    console.log('[Sync] Starting modular sync...');
    
    const markets: Record<string, StoredMarket> = {};
    
    // Initialize platform adapters
    const adapters: PlatformAdapter[] = [
      new PolymarketAdapter(),
      // Future: Add more platforms here
      // new KalshiAdapter(),
    ];
    
    // Sync all platforms
    for (const adapter of adapters) {
      await syncPlatformMarkets(adapter, markets);
    }

    // Store in KV (works on Vercel and locally if KV is configured)
    try {
      const kvAvailable = await isKvAvailable();
      if (kvAvailable) {
        await storeMarkets(markets);
        console.log(`[Sync] Stored ${Object.keys(markets).length} markets in KV`);
      } else {
        console.log('[Sync] KV not available, skipping KV storage');
      }
    } catch (kvError) {
      console.warn('[Sync] Error storing in KV:', kvError);
    }

    // Also try to save to JSON file (works locally, may fail on Vercel's read-only file system)
    try {
      const dataDir = join(process.cwd(), 'data');
      try {
        await mkdir(dataDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, that's fine
        console.log('[Sync] Data directory ready');
      }

      await writeFile(DATA_FILE, JSON.stringify(markets, null, 2), 'utf-8');
      console.log(`[Sync] Saved ${Object.keys(markets).length} markets to file`);
    } catch (fileError) {
      // File system unavailable (Vercel) - this is expected
      console.log('[Sync] File system unavailable (Vercel), data stored in KV only');
    }

    return NextResponse.json({
      success: true,
      count: Object.keys(markets).length,
      markets: Object.keys(markets),
      data: markets, // Include full data for Vercel (file system unavailable)
      platforms: adapters.map(a => a.name),
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
