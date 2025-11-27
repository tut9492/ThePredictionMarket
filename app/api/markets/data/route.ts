import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

const DATA_FILE = join(process.cwd(), 'data', 'markets.json');

/**
 * GET /api/markets/data
 * Returns stored market data from the backend
 * Supports category filtering via ?category= query parameter
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // Try to read the stored data file
    const fileContents = await readFile(DATA_FILE, 'utf-8');
    const fileData = JSON.parse(fileContents);
    
    // Handle both array and object formats
    let markets: Record<string, any> = {};
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





