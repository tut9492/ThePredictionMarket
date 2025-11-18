import { NextResponse } from "next/server";
import { fetchKalshiTopMarkets } from "@/lib/api/kalshi";
import { fetchPolymarketTopMarkets } from "@/lib/api/polymarket";

// Types
type PlatformKey = "kalshi" | "polymarket";

type TopMarket = {
  id: string;
  title: string;
  category: string;
  platform: PlatformKey;
  volume_24h: number;
  current_odds: number; // 0-1 (e.g., 0.45 = 45%)
  url: string;
};

type TopMarketsResponse = {
  kalshi: TopMarket[];
  polymarket: TopMarket[];
  updated_at: string;
};


export async function GET() {
  try {
    console.log("=== FETCHING TOP MARKETS ===");
    
    // Fetch from both platforms in parallel
    const [kalshiData, polymarketData] = await Promise.all([
      fetchKalshiTopMarkets(200).catch((error) => {
        console.error("Error fetching Kalshi top markets:", error);
        return [];
      }),
      fetchPolymarketTopMarkets(50).catch((error) => {
        console.error("Error fetching Polymarket top markets:", error);
        return [];
      }),
    ]);
    
    console.log("Kalshi:", kalshiData.length, "markets");
    console.log("Polymarket:", polymarketData.length, "markets");
    
    // Log category distribution for both
    const kalshiCategoryCount: Record<string, number> = {};
    kalshiData.forEach(m => {
      kalshiCategoryCount[m.category] = (kalshiCategoryCount[m.category] || 0) + 1;
    });
    console.log("[Kalshi] Categories found:", kalshiCategoryCount);
    
    const polymarketCategoryCount: Record<string, number> = {};
    polymarketData.forEach(m => {
      polymarketCategoryCount[m.category] = (polymarketCategoryCount[m.category] || 0) + 1;
    });
    console.log("[Polymarket] Categories found:", polymarketCategoryCount);

    console.log("=== Final Results ===");
    console.log("Kalshi:", kalshiData.length);
    console.log("Polymarket:", polymarketData.length);

    return NextResponse.json({
      kalshi: kalshiData,           // ✅ Real Kalshi data
      polymarket: polymarketData,   // ✅ Real Polymarket data
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Failed to fetch top markets" },
      { status: 500 }
    );
  }
}

