"use client";

import { useState, useEffect } from "react";

type TopMarket = {
  id: string;
  title: string;
  category: string;
  platform: string;
  volume_24h: number;
  current_odds: number;
  url: string;
};

type MarketsData = {
  kalshi: TopMarket[];
  polymarket: TopMarket[];
  updated_at: string;
};

type CategoryKey = "ALL" | "Politics" | "Sports" | "Crypto" | "Social";

const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: "ALL", label: "ALL", emoji: "" },
  { key: "Politics", label: "POLITICS", emoji: "🗳️" },
  { key: "Sports", label: "SPORTS", emoji: "🏀" },
  { key: "Crypto", label: "CRYPTO", emoji: "₿" },
  { key: "Social", label: "SOCIAL", emoji: "💬" },
];

export function TopMarkets() {
  const [marketsData, setMarketsData] = useState<MarketsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("ALL");

  useEffect(() => {
    fetch("/api/top-markets")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMarketsData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filter markets by selected category
  const filterMarkets = (markets: TopMarket[]): TopMarket[] => {
    if (!markets || markets.length === 0) return [];

    if (selectedCategory === "ALL") {
      // ALL: Return top 5 by volume (markets are already sorted by volume from API)
      return markets.slice(0, 5);
    }

    // Specific category: Filter by category, then return top 5 by volume
    // Markets are already sorted by volume from API, so filtered results maintain that order
    return markets
      .filter((m) => m.category === selectedCategory)
      .slice(0, 5);
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(0)}M`;
    if (volume >= 1_000) return `$${(volume / 1_000).toFixed(0)}K`;
    return `$${volume}`;
  };

  const formatOdds = (odds: number): string => {
    return `${Math.round(odds * 100)}% YES`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">TOP MARKETS BY VOLUME</h1>
        <div className="text-center">Loading top markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">TOP MARKETS BY VOLUME</h1>
        <div className="text-center text-red-600">Error: {error}</div>
        <div className="text-center text-sm text-gray-500 mt-2">Check browser console for details</div>
      </div>
    );
  }

  if (!marketsData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">TOP MARKETS BY VOLUME</h1>
        <div className="text-center">No data available</div>
      </div>
    );
  }

  const platforms = [
    { key: "kalshi" as const, name: "KALSHI" },
    { key: "polymarket" as const, name: "POLYMARKET" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <h1 className="text-4xl font-bold text-center mb-8">TOP MARKETS BY VOLUME</h1>

      {/* Category Filter Buttons */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`
              px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${
                selectedCategory === cat.key
                  ? "bg-black text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            {cat.emoji && <span className="mr-2">{cat.emoji}</span>}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platforms.map((platform) => {
          const markets = marketsData[platform.key] || [];
          const topFive = filterMarkets(markets);
          
          // Debug logging
          if (platform.key === "polymarket") {
            console.log(`Selected: ${selectedCategory}, Markets for Polymarket:`, {
              total: markets.length,
              filtered: topFive.length,
              categories: [...new Set(markets.map(m => m.category))]
            });
          }

          return (
            <div key={platform.key} className="space-y-4">
              <h2 className="font-bold text-lg">{platform.name}</h2>

              {topFive.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  NO MARKETS AVAILABLE
                </div>
              ) : (
                <div className="space-y-3">
                  {topFive.map((market, idx) => (
                    <div
                      key={market.id}
                      className="bg-white p-4 rounded-lg border border-gray-200"
                    >
                      <div className="text-sm text-gray-400 mb-1">{idx + 1}</div>
                      <h3 className="font-medium text-sm mb-2">{market.title}</h3>
                      <div className="text-xs text-gray-500 mb-2">{market.category}</div>
                      <div className="font-bold">{formatVolume(market.volume_24h)}</div>
                      <div className="text-xs text-gray-500">{formatOdds(market.current_odds)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8 text-xs text-gray-400">
        Last updated: {new Date(marketsData.updated_at).toLocaleTimeString()}
      </div>
    </div>
  );
}
