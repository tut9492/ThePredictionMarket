import { NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

interface MarketConfig {
  key: string;
  searchTerms: string[];
  category: "POLITICS" | "SPORTS" | "CRYPTO" | "SOCIAL" | "DATA";
  image: string;
}

// Market configurations - Top 20 trending markets by volume
// Ordered by volume (highest first) to match Polymarket dashboard
const MARKET_CONFIGS: MarketConfig[] = [
  {
    key: "superBowl",
    searchTerms: ["super", "bowl", "champion", "2026"],
    category: "SPORTS",
    image: "/superbowl.png",
  },
  {
    key: "demNominee2028",
    searchTerms: ["democratic", "presidential", "nominee", "2028"],
    category: "POLITICS",
    image: "/democrats.jpg",
  },
  {
    key: "pokerChampionship",
    searchTerms: ["heads-up", "poker", "championship", "2025", "national"],
    category: "SPORTS",
    image: "/superbowl.png",
  },
  {
    key: "f1Champion",
    searchTerms: ["f1", "drivers", "champion", "lando", "norris"],
    category: "SPORTS",
    image: "/superbowl.png",
  },
  {
    key: "fedDecision",
    searchTerms: ["fed", "decision", "december", "bps"],
    category: "CRYPTO",
    image: "/superbowl.png",
  },
  {
    key: "presElection2028",
    searchTerms: ["presidential", "election", "winner", "2028"],
    category: "POLITICS",
    image: "/democrats.jpg",
  },
  {
    key: "premierLeague",
    searchTerms: ["english", "premier", "league", "winner", "arsenal"],
    category: "SPORTS",
    image: "/superbowl.png",
  },
  {
    key: "repNominee2028",
    searchTerms: ["republican", "presidential", "nominee", "2028"],
    category: "POLITICS",
    image: "/democrats.jpg",
  },
  {
    key: "championsLeague",
    searchTerms: ["uefa", "champions", "league", "winner"],
    category: "SPORTS",
    image: "/superbowl.png",
  },
  {
    key: "chileElection",
    searchTerms: ["chile", "presidential", "election", "kast"],
    category: "POLITICS",
    image: "/democrats.jpg",
  },
  {
    key: "highestGrossingMovie",
    searchTerms: ["highest", "grossing", "movie", "2025", "wicked"],
    category: "SOCIAL",
    image: "/superbowl.png",
  },
  {
    key: "bitcoinPrice2025",
    searchTerms: ["bitcoin", "price", "2025", "hit"],
    category: "CRYPTO",
    image: "/superbowl.png",
  },
  {
    key: "xiJinpingOut",
    searchTerms: ["xi", "jinping", "out", "2025"],
    category: "POLITICS",
    image: "/democrats.jpg",
  },
  {
    key: "nbaChampion2026",
    searchTerms: ["nba", "champion", "2026", "thunder"],
    category: "SPORTS",
    image: "/superbowl.png",
  },
  {
    key: "largestCompany2025",
    searchTerms: ["largest", "company", "2025", "nvidia"],
    category: "CRYPTO",
    image: "/superbowl.png",
  },
  {
    key: "ethereumPrice2025",
    searchTerms: ["ethereum", "price", "2025", "hit"],
    category: "CRYPTO",
    image: "/superbowl.png",
  },
  {
    key: "bitcoinPriceNovember",
    searchTerms: ["bitcoin", "price", "november", "200000"],
    category: "CRYPTO",
    image: "/superbowl.png",
  },
  {
    key: "spotifyArtist2025",
    searchTerms: ["spotify", "artist", "2025", "bad", "bunny"],
    category: "SOCIAL",
    image: "/superbowl.png",
  },
  {
    key: "russiaUkraineCeasefire",
    searchTerms: ["russia", "ukraine", "ceasefire", "2025"],
    category: "POLITICS",
    image: "/democrats.jpg",
  },
  {
    key: "laLigaWinner",
    searchTerms: ["la", "liga", "winner", "real", "madrid"],
    category: "SPORTS",
    image: "/superbowl.png",
  },
];

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
 * Search Polymarket events for matching markets
 */
async function searchPolymarketMarkets(searchTerms: string[]): Promise<any | null> {
  try {
    const url = new URL("https://gamma-api.polymarket.com/events");
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("limit", "200");
    // Order by all-time volume (or volume24hr if volume not available)
    url.searchParams.set("order", "volume");
    url.searchParams.set("ascending", "false");

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15000),
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
      return null;
    }

    // Search for event matching search terms
    const searchText = searchTerms.join(' ').toLowerCase();
    const matchingEvent = events.find((event: any) => {
      const title = (event.title || '').toLowerCase();
      const slug = (event.slug || '').toLowerCase();
      return searchTerms.some(term => 
        title.includes(term.toLowerCase()) || slug.includes(term.toLowerCase())
      );
    });

    if (!matchingEvent) {
      return null;
    }

    const markets = matchingEvent.markets || [];
    if (markets.length === 0) {
      return null;
    }

    const market = markets[0];
    
    // Parse outcome prices
    let yes = 50;
    let no = 50;
    let candidates: Array<{ name: string; odds: number }> = [];
    
    try {
      const outcomePrices = typeof market.outcomePrices === 'string' 
        ? JSON.parse(market.outcomePrices) 
        : market.outcomePrices;
      
      const outcomes = typeof market.outcomes === 'string' 
        ? JSON.parse(market.outcomes) 
        : market.outcomes || [];
      
      if (Array.isArray(outcomePrices) && outcomePrices.length >= 2) {
        yes = Math.round(Number(outcomePrices[0]) * 100);
        no = Math.round(Number(outcomePrices[1]) * 100);
      }

      // Get candidate names from outcomes
      if (Array.isArray(outcomes) && outcomes.length > 0) {
        // Filter out Yes/No and get actual candidates
        const candidateOutcomes = outcomes.filter((o: string) => 
          o !== 'Yes' && o !== 'No'
        );
        
        if (candidateOutcomes.length > 0) {
          // For markets with named candidates, use those
          candidateOutcomes.slice(0, 2).forEach((name: string, idx: number) => {
            const price = outcomePrices[idx] || 0.5;
            candidates.push({
              name: name.toUpperCase(),
              odds: Math.round(Number(price) * 100),
            });
          });
        } else {
          // Binary market - use Yes/No
          candidates = [
            { name: "YES", odds: yes },
            { name: "NO", odds: no },
          ];
        }
      } else {
        // Fallback to Yes/No
        candidates = [
          { name: "YES", odds: yes },
          { name: "NO", odds: no },
        ];
      }
    } catch (e) {
      console.warn(`[Polymarket] Failed to parse market data:`, e);
      candidates = [{ name: "YES", odds: 50 }, { name: "NO", odds: 50 }];
    }

    // Get volume - prefer all-time volume, fallback to 24h volume
    // Polymarket API provides: volume (all-time), volume24hr (24-hour), volume7d (7-day)
    const volume = matchingEvent.volume || matchingEvent.volume24hr || matchingEvent.volume7d || 0;
    const volumeNum = typeof volume === 'string' ? parseFloat(volume) : volume;
    const volumeFormatted = formatVolume(volumeNum);
    
    // Debug: Log available volume fields to understand what we're getting
    if (matchingEvent.volume || matchingEvent.volume24hr) {
      console.log(`[Volume Debug] ${matchingEvent.title}: volume=${matchingEvent.volume}, volume24hr=${matchingEvent.volume24hr}, volume7d=${matchingEvent.volume7d}`);
    }

    return {
      title: matchingEvent.title || market.question || 'Unknown Market',
      candidates,
      volume: volumeFormatted,
      url: `https://polymarket.com/event/${matchingEvent.slug || matchingEvent.ticker}`,
    };
  } catch (error) {
    console.error(`[Polymarket] Error searching markets:`, error);
    return null;
  }
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B VOL`;
  } else if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M VOL`;
  } else if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K VOL`;
  }
  return `${volume.toFixed(0)} VOL`;
}

/**
 * GET /api/markets/sync
 * Fetches all markets from Polymarket API and stores them
 */
export async function GET() {
  try {
    console.log('[Markets Sync] Starting sync...');
    
    const markets: Record<string, StoredMarket> = {};
    
    // Fetch all markets in parallel
    const marketPromises = MARKET_CONFIGS.map(async (config) => {
      const marketData = await searchPolymarketMarkets(config.searchTerms);
      
      if (marketData) {
        markets[config.key] = {
          key: config.key,
          category: config.category,
          image: config.image,
          polymarket: marketData,
          lastUpdated: new Date().toISOString(),
        };
        console.log(`[Markets Sync] Found: ${config.key}`);
      } else {
        console.warn(`[Markets Sync] Not found: ${config.key}`);
      }
    });

    await Promise.all(marketPromises);

    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    const { mkdir } = await import('fs/promises');
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
      console.log('[Markets Sync] Data directory ready');
    }

    // Save to JSON file
    await writeFile(DATA_FILE, JSON.stringify(markets, null, 2), 'utf-8');

    console.log(`[Markets Sync] Saved ${Object.keys(markets).length} markets`);

    return NextResponse.json({
      success: true,
      count: Object.keys(markets).length,
      markets: Object.keys(markets),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Markets Sync] Error:', error);
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

