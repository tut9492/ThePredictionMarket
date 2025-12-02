/**
 * Modular Sync Route (v2)
 * Uses platform adapters for extensible multi-platform support
 */

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { PolymarketAdapter } from "@/lib/platforms/polymarket";
import { PlatformAdapter } from "@/lib/platforms/base/types";
import { getImageUrl } from "@/lib/utils/images";

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
  console.log(`[Sync v2] Syncing ${adapter.name} markets...`);
  
  const promises = adapter.configs.map(async (config) => {
    const marketData = await adapter.searchMarket(config.searchTerms);
    
    if (marketData) {
      // Use API image if valid, otherwise fallback to config image
      const marketImage = getImageUrl(marketData.image, config.image);
      
      // Debug logging
      if (marketData.image && marketData.image.trim() !== '' && marketData.image.startsWith('http')) {
        console.log(`[Image] ${config.key}: Using API image - ${marketData.image.substring(0, 60)}...`);
      } else {
        console.log(`[Image] ${config.key}: No valid API image, using config fallback - ${config.image}`);
      }
      
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
      
      console.log(`[Sync v2] Found: ${config.key} (${adapter.name})`);
    } else {
      console.warn(`[Sync v2] Not found: ${config.key} (${adapter.name})`);
    }
  });
  
  await Promise.all(promises);
}

/**
 * GET /api/markets/sync-v2
 * Fetches all markets from platform adapters and stores them
 */
export async function GET() {
  try {
    console.log('[Sync v2] Starting modular sync...');
    
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
    
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
      console.log('[Sync v2] Data directory ready');
    }
    
    // Save to JSON file
    await writeFile(DATA_FILE, JSON.stringify(markets, null, 2), 'utf-8');
    
    console.log(`[Sync v2] Saved ${Object.keys(markets).length} markets`);
    
    return NextResponse.json({
      success: true,
      count: Object.keys(markets).length,
      markets: Object.keys(markets),
      platforms: adapters.map(a => a.name),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sync v2] Error:', error);
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




