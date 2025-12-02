/**
 * Vercel KV Storage Utility
 * Handles storing and retrieving market data from Vercel KV (Redis)
 */

import { kv } from '@vercel/kv';

const MARKETS_KEY = 'markets:data';
const MARKETS_TIMESTAMP_KEY = 'markets:timestamp';

export interface StoredMarket {
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
 * Store market data in KV
 */
export async function storeMarkets(markets: Record<string, StoredMarket>): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    await kv.set(MARKETS_KEY, JSON.stringify(markets));
    await kv.set(MARKETS_TIMESTAMP_KEY, timestamp);
    console.log(`[KV] Stored ${Object.keys(markets).length} markets at ${timestamp}`);
  } catch (error) {
    console.error('[KV] Error storing markets:', error);
    throw error;
  }
}

/**
 * Retrieve market data from KV
 */
export async function getMarkets(): Promise<Record<string, StoredMarket> | null> {
  try {
    const data = await kv.get<string>(MARKETS_KEY);
    if (!data) {
      console.log('[KV] No market data found');
      return null;
    }
    const markets = JSON.parse(data) as Record<string, StoredMarket>;
    const timestamp = await kv.get<string>(MARKETS_TIMESTAMP_KEY);
    console.log(`[KV] Retrieved ${Object.keys(markets).length} markets (last updated: ${timestamp || 'unknown'})`);
    return markets;
  } catch (error) {
    console.error('[KV] Error retrieving markets:', error);
    return null;
  }
}

/**
 * Get the timestamp of the last market update
 */
export async function getMarketsTimestamp(): Promise<string | null> {
  try {
    return await kv.get<string>(MARKETS_TIMESTAMP_KEY);
  } catch (error) {
    console.error('[KV] Error retrieving timestamp:', error);
    return null;
  }
}

/**
 * Check if KV is available
 */
export async function isKvAvailable(): Promise<boolean> {
  try {
    await kv.ping();
    return true;
  } catch (error) {
    console.warn('[KV] KV not available:', error);
    return false;
  }
}


