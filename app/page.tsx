"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/app/(components)/Header";

type CategoryKey = "ALL" | "POLITICS" | "SPORTS" | "CRYPTO" | "SOCIAL" | "DATA";

// STATIC DATA - No API calls
const LANDING_MARKETS = {
  // Politics Markets
  trumpEpsteinFiles: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "WILL TRUMP RELEASE EPSTEIN FILES BY NOVEMBER 20?",
      candidates: [
        { name: "YES", odds: 1 },
      ],
      volume: "911K VOL",
      url: "https://polymarket.com/event/will-trump-release-epstein-files-by-november-20",
    },
    kalshi: {
      title: "WILL TRUMP RELEASE EPSTEIN FILES BY NOVEMBER 21?",
      candidates: [
        { name: "YES", odds: 3 },
      ],
      volume: "911K VOL",
      url: "https://kalshi.com/markets/epstein-files-release",
    },
  },
  russiaUkraineCeasefire: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "RUSSIA X UKRAINE CEASEFIRE IN 2025?",
      candidates: [
        { name: "YES", odds: 10 },
      ],
      volume: "30M VOL",
      url: "https://polymarket.com/event/russia-ukraine-ceasefire-2025",
    },
    kalshi: {
      title: "RUSSIA X UKRAINE CEASEFIRE IN 2025?",
      candidates: [
        { name: "YES", odds: 10 },
      ],
      volume: "30M VOL",
      url: "https://kalshi.com/markets/russia-ukraine-ceasefire",
    },
  },
  fedDecision: {
    category: "CRYPTO" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "FED DECISION IN DECEMBER?",
      candidates: [
        { name: "50+ BPS DECREASE", odds: 1 },
        { name: "25 BPS DECREASE", odds: 36 },
      ],
      volume: "131M VOL",
      url: "https://polymarket.com/event/fed-decision-december-2025",
    },
    kalshi: {
      title: "FED DECISION IN DECEMBER?",
      candidates: [
        { name: "50+ BPS DECREASE", odds: 1 },
        { name: "25 BPS DECREASE", odds: 36 },
      ],
      volume: "131M VOL",
      url: "https://kalshi.com/markets/fed-decision-december",
    },
  },
  elonTweets: {
    category: "SOCIAL" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "ELON MUSK # TWEETS NOVEMBER 14 - NOVEMBER 21, 2025?",
      candidates: [
        { name: "140-159 TWEETS", odds: 12 },
        { name: "160-179 TWEETS", odds: 44 },
      ],
      volume: "12M VOL",
      url: "https://polymarket.com/event/elon-musk-tweets-november-14-21-2025",
    },
    kalshi: {
      title: "ELON MUSK # TWEETS NOVEMBER 14 - NOVEMBER 21, 2025?",
      candidates: [
        { name: "140-159 TWEETS", odds: 12 },
        { name: "160-179 TWEETS", odds: 44 },
      ],
      volume: "12M VOL",
      url: "https://kalshi.com/markets/elon-musk-tweets",
    },
  },
  nflBillsTexans: {
    category: "SPORTS" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "NFL: BUF BILLS VS. HOU TEXANS",
      candidates: [
        { name: "BUF BILLS", odds: 71 },
        { name: "HOU TEXANS", odds: 30 },
      ],
      volume: "1M VOL",
      url: "https://polymarket.com/event/nfl-bills-vs-texans",
    },
    kalshi: {
      title: "NFL: BUF BILLS VS. HOU TEXANS",
      candidates: [
        { name: "BUF BILLS", odds: 71 },
        { name: "HOU TEXANS", odds: 30 },
      ],
      volume: "1M VOL",
      url: "https://kalshi.com/markets/nfl-bills-texans",
    },
  },
  superBowl: {
    category: "SPORTS" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "SUPER BOWL CHAMPION 2026",
      candidates: [
        { name: "PHILADELPHIA", odds: 15 },
        { name: "LOS ANGELES R", odds: 12 },
      ],
      volume: "554M VOL",
      url: "https://polymarket.com/event/super-bowl-champion-2026-731",
    },
    kalshi: {
      title: "PRO FOOTBALL CHAMPION?",
      candidates: [
        { name: "PHILADELPHIA", odds: 15 },
        { name: "LOS ANGELES R", odds: 12 },
      ],
      volume: "554M VOL",
      url: "https://kalshi.com/markets/kxsb/super-bowl/kxsb-26",
    },
  },
  epsteinClientList: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "EPSTEIN CLIENT LIST RELEASED IN 2025?",
      candidates: [
        { name: "YES", odds: 10 },
      ],
      volume: "98K VOL",
      url: "https://polymarket.com/event/epstein-client-list-released-2025",
    },
    kalshi: {
      title: "EPSTEIN CLIENT LIST RELEASED IN 2025?",
      candidates: [
        { name: "YES", odds: 10 },
      ],
      volume: "98K VOL",
      url: "https://kalshi.com/markets/epstein-client-list",
    },
  },
  missUniverse: {
    category: "SPORTS" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "WHO WILL WIN MISS UNIVERSE 2025?",
      candidates: [
        { name: "MEXICO", odds: 20 },
        { name: "PHILIPPINES", odds: 19 },
      ],
      volume: "1M VOL",
      url: "https://polymarket.com/event/miss-universe-2025",
    },
    kalshi: {
      title: "WHO WILL WIN MISS UNIVERSE 2025?",
      candidates: [
        { name: "MEXICO", odds: 20 },
        { name: "PHILIPPINES", odds: 19 },
      ],
      volume: "1M VOL",
      url: "https://kalshi.com/markets/miss-universe-2025",
    },
  },
  mbsSuit: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "WILL MOHAMMED BIN SALMAN WEAR A SUIT AND...?",
      candidates: [
        { name: "YES", odds: 1 },
      ],
      volume: "237K VOL",
      url: "https://polymarket.com/event/mbs-suit-2025",
    },
    kalshi: {
      title: "WILL MOHAMMED BIN SALMAN WEAR A SUIT AND...?",
      candidates: [
        { name: "YES", odds: 1 },
      ],
      volume: "237K VOL",
      url: "https://kalshi.com/markets/mbs-suit",
    },
  },
  trumpFedChair: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "WHO WILL TRUMP NOMINATE AS FED CHAIR?",
      candidates: [
        { name: "KEVIN HASSETT", odds: 45 },
        { name: "CHRISTOPHER WALLER", odds: 21 },
      ],
      volume: "7M VOL",
      url: "https://polymarket.com/event/trump-fed-chair-nominee",
    },
    kalshi: {
      title: "WHO WILL TRUMP NOMINATE AS FED CHAIR?",
      candidates: [
        { name: "KEVIN HASSETT", odds: 45 },
        { name: "CHRISTOPHER WALLER", odds: 21 },
      ],
      volume: "7M VOL",
      url: "https://kalshi.com/markets/trump-fed-chair",
    },
  },
  maduroOut: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "MADURO OUT BY NOVEMBER 30, 2025?",
      candidates: [
        { name: "YES", odds: 4 },
      ],
      volume: "12M VOL",
      url: "https://polymarket.com/event/maduro-out-november-30-2025",
    },
    kalshi: {
      title: "MADURO OUT BY DECEMBER 31, 2025?",
      candidates: [
        { name: "YES", odds: 15 },
      ],
      volume: "12M VOL",
      url: "https://kalshi.com/markets/maduro-out",
    },
  },
  epsteinForeignAgent: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "EPSTEIN CONFIRMED AS FOREIGN AGENT IN 2025?",
      candidates: [
        { name: "YES", odds: 4 },
      ],
      volume: "105K VOL",
      url: "https://polymarket.com/event/epstein-foreign-agent-2025",
    },
    kalshi: {
      title: "EPSTEIN CONFIRMED AS FOREIGN AGENT IN 2025?",
      candidates: [
        { name: "YES", odds: 4 },
      ],
      volume: "105K VOL",
      url: "https://kalshi.com/markets/epstein-foreign-agent",
    },
  },
  epsteinFilesNames: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "WHO WILL BE NAMED IN NEWLY RELEASED EPSTEIN FILES?",
      candidates: [
        { name: "DAVID KOCH", odds: 67 },
        { name: "DAVID COPPERFIELD", odds: 54 },
      ],
      volume: "613K VOL",
      url: "https://polymarket.com/event/epstein-files-names",
    },
    kalshi: {
      title: "WHO WILL BE NAMED IN NEWLY RELEASED EPSTEIN FILES?",
      candidates: [
        { name: "DAVID KOCH", odds: 67 },
        { name: "DAVID COPPERFIELD", odds: 54 },
      ],
      volume: "613K VOL",
      url: "https://kalshi.com/markets/epstein-files-names",
    },
  },
  trumpTalks: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "WHO WILL TRUMP TALK TO IN NOVEMBER?",
      candidates: [
        { name: "ZOHRAN MAMDANI", odds: 98 },
        { name: "VOLODYMYR ZELENSKYY", odds: 86 },
      ],
      volume: "1M VOL",
      url: "https://polymarket.com/event/trump-talks-november",
    },
    kalshi: {
      title: "WHO WILL TRUMP TALK TO IN NOVEMBER?",
      candidates: [
        { name: "ZOHRAN MAMDANI", odds: 98 },
        { name: "VOLODYMYR ZELENSKYY", odds: 86 },
      ],
      volume: "1M VOL",
      url: "https://kalshi.com/markets/trump-talks-november",
    },
  },
  chileElection: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "CHILE PRESIDENTIAL ELECTION",
      candidates: [
        { name: "JOSÉ ANTONIO KAST", odds: 95 },
        { name: "JEANNETTE JARA", odds: 4 },
      ],
      volume: "78M VOL",
      url: "https://polymarket.com/event/chile-presidential-election-2025",
    },
    kalshi: {
      title: "CHILE PRESIDENTIAL ELECTION",
      candidates: [
        { name: "JOSÉ ANTONIO KAST", odds: 95 },
        { name: "JEANNETTE JARA", odds: 4 },
      ],
      volume: "78M VOL",
      url: "https://kalshi.com/markets/chile-election",
    },
  },
  aiBubble: {
    category: "CRYPTO" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "AI BUBBLE BURST BY DECEMBER 31, 2025?",
      candidates: [
        { name: "YES", odds: 4 },
      ],
      volume: "29K VOL",
      url: "https://polymarket.com/event/ai-bubble-burst-december-2025",
    },
    kalshi: {
      title: "AI BUBBLE BURST BY MARCH 31, 2026?",
      candidates: [
        { name: "YES", odds: 12 },
      ],
      volume: "29K VOL",
      url: "https://kalshi.com/markets/ai-bubble-burst",
    },
  },
};

function HomeContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("ALL");
  const [sortBy, setSortBy] = useState<"volume" | "trending">("volume");
  const [markets, setMarkets] = useState<Record<string, any>>(LANDING_MARKETS);
  const [marketTimestamps, setMarketTimestamps] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch market data from backend
  useEffect(() => {
    async function fetchMarkets() {
      try {
        const categoryParam = searchParams.get("category");
        const category = categoryParam || 'all';
        const apiUrl = `/api/markets/data${category !== 'all' ? `?category=${category}` : ''}`;
        
        // Add timeout to prevent infinite loading (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(apiUrl, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && Object.keys(result.data).length > 0) {
          // Transform backend data to match LANDING_MARKETS format
          const transformedMarkets: Record<string, any> = {};
          
          const timestamps: Record<string, string> = {};
          Object.entries(result.data).forEach(([key, marketData]: [string, any]) => {
            transformedMarkets[key] = {
              category: marketData.category as any,
              image: marketData.image,
              polymarket: {
                title: marketData.polymarket.title,
                candidates: marketData.polymarket.candidates,
                volume: marketData.polymarket.volume,
                url: marketData.polymarket.url,
              },
              // Keep kalshi structure for compatibility (using same data)
              kalshi: {
                title: marketData.polymarket.title,
                candidates: marketData.polymarket.candidates,
                volume: marketData.polymarket.volume,
                url: marketData.polymarket.url,
              },
            };
            // Store timestamp for trending sort
            if (marketData.lastUpdated) {
              timestamps[key] = marketData.lastUpdated;
            }
          });
          setMarketTimestamps(timestamps);
          
          setMarkets(transformedMarkets);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        // Keep static data as fallback
        // If fetch fails, still show the static LANDING_MARKETS data
      } finally {
        setLoading(false);
      }
    }
    
    fetchMarkets();
  }, [searchParams]); // Re-fetch when category changes

  // Read category from URL query parameter
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      // Map URL category to CategoryKey
      const categoryMap: Record<string, CategoryKey> = {
        politics: "POLITICS",
        sports: "SPORTS",
        crypto: "CRYPTO",
        social: "SOCIAL",
        data: "DATA",
      };
      const mappedCategory = categoryMap[categoryParam.toLowerCase()];
      if (mappedCategory) {
        setSelectedCategory(mappedCategory);
      }
    } else {
      setSelectedCategory("ALL");
    }
  }, [searchParams]);

  // Filter and sort markets based on selected category and sort option
  const filteredMarkets = Object.entries(markets)
    .filter(([key, market]) => {
      if (selectedCategory === "ALL") {
        return true;
      }
      return market.category === selectedCategory;
    })
    .sort(([keyA, marketA], [keyB, marketB]) => {
      if (sortBy === "trending") {
        // Sort by most recently updated (trending = newest activity first)
        const timestampA = marketTimestamps[keyA] || "0";
        const timestampB = marketTimestamps[keyB] || "0";
        return new Date(timestampB).getTime() - new Date(timestampA).getTime();
      } else {
        // Sort by volume (highest first)
        const parseVolume = (volumeStr: string): number => {
          const clean = volumeStr.replace(' VOL', '').trim();
          if (clean.endsWith('B')) {
            return parseFloat(clean) * 1_000_000_000;
          } else if (clean.endsWith('M')) {
            return parseFloat(clean) * 1_000_000;
          } else if (clean.endsWith('K')) {
            return parseFloat(clean) * 1_000;
          }
          return parseFloat(clean) || 0;
        };
        
        const volumeA = parseVolume(marketA.polymarket.volume);
        const volumeB = parseVolume(marketB.polymarket.volume);
        
        return volumeB - volumeA; // Descending order (highest first)
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF6]">
      <Header
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      <footer className="fixed bottom-6 right-6 z-50">
        <a 
          href="https://x.com/Tuteth_" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-110"
        >
          <img
            src="/prediction-market/market-logos/MASTER LOGO.png"
            alt="tut™"
            className="h-12 w-auto opacity-100 hover:opacity-80 transition-opacity cursor-pointer"
          />
        </a>
      </footer>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Hero Cards Section - Horizontal Ticker */}
        <div className="mb-12 overflow-hidden relative">
          <div className="flex gap-4 animate-scroll" style={{ pointerEvents: 'auto' }}>
            {/* Duplicate cards for seamless loop */}
            {[...filteredMarkets, ...filteredMarkets].map(([key, market], index) => (
              <a
                key={`${key}-${index}`}
                href={market.polymarket.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-80 cursor-pointer block"
              >
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-[11px] font-bold uppercase leading-tight text-gray-900 h-9 flex items-center">
                    {market.polymarket.title}
                  </h3>
                </div>
                <div className="flex">
                  <div className="flex-1 p-3">
                    {market.polymarket.candidates.map((candidate: any, idx: number) => (
                      <div key={idx} className="mb-2">
                        <div className="text-[10px] text-gray-600 uppercase mb-1">
                          {candidate.name}
                        </div>
                        <div className="flex gap-1 text-[10px]">
                          <span className="text-teal-600 font-bold">{candidate.odds}%</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-pink-600 font-bold">{100 - candidate.odds}%</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src="/prediction-market/market-logos/polymarket.png"
                        alt="Polymarket"
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-[9px] text-gray-500">{market.polymarket.volume}</span>
                    </div>
                  </div>
                  <div className="w-24 bg-black flex-shrink-0">
                    <img 
                      src={market.image} 
                      alt={market.polymarket.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* List View Section */}
        <div className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden shadow-sm">
          {/* Sort Toggles */}
          <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">Sort by:</span>
              <button
                onClick={() => setSortBy("volume")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  sortBy === "volume"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 hover:text-black border border-gray-300"
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => setSortBy("trending")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  sortBy === "trending"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 hover:text-black border border-gray-300"
                }`}
              >
                Trending
              </button>
            </div>
          </div>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-100 border-b-2 border-gray-300">
            <div className="col-span-1 text-sm font-bold text-gray-900 uppercase"></div>
            <div className="col-span-4 text-sm font-bold text-gray-900 uppercase">Market</div>
            <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-center">Odds</div>
            <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-center">Yes</div>
            <div className="col-span-1 text-sm font-bold text-gray-900 uppercase text-center">No</div>
            <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-right">Volume</div>
          </div>

          {/* Table Rows - Polymarket Only */}
          {filteredMarkets.map(([key, market]) => (
            <a
              key={key}
              href={market.polymarket.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="col-span-1 flex items-center">
                {/* Empty column - Platform column removed */}
              </div>
              
              <div className="col-span-4 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded overflow-hidden border border-gray-200">
                    <img 
                      src={market.image} 
                      alt={market.polymarket.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className="bg-white rounded-full p-0.5 shadow-md border-2 border-gray-300">
                      <img 
                        src="/prediction-market/market-logos/polymarket.png"
                        alt="Polymarket"
                        className="w-7 h-7 rounded-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base text-gray-900 group-hover:text-black uppercase">
                    {market.polymarket.title}
                  </div>
                </div>
              </div>
              
              <div className="col-span-2 flex flex-col justify-center gap-2">
                {market.polymarket.candidates.map((c: any, i: number) => (
                  <div key={i} className="text-sm text-gray-900 uppercase font-medium">
                    {c.name}
                  </div>
                ))}
              </div>
              
              <div className="col-span-2 flex flex-col justify-center items-center gap-2">
                {market.polymarket.candidates.map((c: any, i: number) => (
                  <div key={i} className="text-base font-semibold text-teal-600">
                    {c.odds}¢
                  </div>
                ))}
              </div>
              
              <div className="col-span-1 flex flex-col justify-center items-center gap-2">
                {market.polymarket.candidates.map((c: any, i: number) => (
                  <div key={i} className="text-base font-semibold text-pink-600">
                    {100 - c.odds}¢
                  </div>
                ))}
              </div>
              
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-base font-semibold text-gray-900">
                  {market.polymarket.volume.replace(' VOL', '')}
                </span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
