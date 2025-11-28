/**
 * Debug endpoint to see what data is being returned
 */

import { NextResponse } from "next/server";
import { PolymarketAdapter } from "@/lib/platforms/polymarket";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adapter = new PolymarketAdapter();
    
    // Test fetching one market
    const testConfig = adapter.configs[0]; // superBowl
    console.log(`[Debug] Testing market: ${testConfig.key}`);
    console.log(`[Debug] Search terms:`, testConfig.searchTerms);
    
    const marketData = await adapter.searchMarket(testConfig.searchTerms);
    
    return NextResponse.json({
      success: true,
      config: testConfig,
      marketData: marketData,
      candidates: marketData?.candidates || [],
      candidateCount: marketData?.candidates?.length || 0,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

