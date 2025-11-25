"use client";

import { useState, useEffect } from "react";

interface MarketData {
  platform: string;
  marketId: string;
  marketName: string;
  odds: string;
  yes: number;
  no: number;
  volume: string;
  rawVolume: number;
  url?: string;
}

interface MarketsResponse {
  success: boolean;
  data: MarketData[];
  timestamp: string;
  error?: string;
}

/**
 * MarketsTable Component
 * Displays live market data in a table format
 * Auto-refreshes every 30 seconds
 */
export default function MarketsTable() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/markets/update', {
        next: { revalidate: 30 },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: MarketsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch markets');
      }

      setMarkets(data.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchMarkets();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMarkets, 30000);

    return () => clearInterval(interval);
  }, []);

  // Group markets by name (to show Kalshi and Polymarket side by side)
  const groupedMarkets = markets.reduce((acc, market) => {
    // Extract base market name (remove platform-specific suffixes)
    const baseName = market.marketName
      .replace(/\?/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!acc[baseName]) {
      acc[baseName] = [];
    }
    acc[baseName].push(market);
    return acc;
  }, {} as Record<string, MarketData[]>);

  if (loading && markets.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3 text-gray-600">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-300 p-8 shadow-sm">
        <div className="text-red-600 mb-4">
          <strong>Error loading markets:</strong> {error}
        </div>
        <button
          onClick={fetchMarkets}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-8 shadow-sm">
        <div className="text-center py-12 text-gray-600">
          No market data available. Please check your market identifiers in the API route.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden shadow-sm">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between px-8 py-4 bg-gray-100 border-b-2 border-gray-300">
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase">Live Market Data</h2>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchMarkets}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-100 border-b-2 border-gray-300">
        <div className="col-span-1 text-sm font-bold text-gray-900 uppercase">Platform</div>
        <div className="col-span-4 text-sm font-bold text-gray-900 uppercase">Market</div>
        <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-center">Odds</div>
        <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-center">Yes</div>
        <div className="col-span-1 text-sm font-bold text-gray-900 uppercase text-center">No</div>
        <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-right">Volume</div>
      </div>

      {/* Table Rows */}
      {Object.entries(groupedMarkets).map(([baseName, marketGroup]) => (
        <div key={baseName}>
          {marketGroup.map((market) => (
            <a
              key={`${market.platform}-${market.marketId}`}
              href={market.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              {/* Platform Logo */}
              <div className="col-span-1 flex items-center">
                <div className="w-16 h-16 bg-white rounded border border-gray-200 p-2 relative">
                  <img
                    src={
                      market.platform === 'Kalshi'
                        ? '/prediction-market/market-logos/kalshi.png'
                        : '/prediction-market/market-logos/polymarket.png'
                    }
                    alt={market.platform}
                    className="w-full h-full object-contain"
                  />
                  <div
                    className={`absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center ${
                      market.platform === 'Kalshi' ? 'bg-teal-500' : 'bg-blue-500'
                    }`}
                  >
                    <span className="text-white text-xs font-bold">
                      {market.platform === 'Kalshi' ? 'K' : 'P'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Market Info */}
              <div className="col-span-4 flex items-center gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-base text-gray-900 group-hover:text-black uppercase">
                    {market.marketName}
                  </div>
                </div>
              </div>

              {/* Odds Column */}
              <div className="col-span-2 flex flex-col justify-center gap-2">
                <div className="text-sm text-gray-900 uppercase font-medium">
                  {market.odds || 'Yes vs No'}
                </div>
              </div>

              {/* Yes Column */}
              <div className="col-span-2 flex flex-col justify-center items-center gap-2">
                <div className="text-base font-semibold text-teal-600">
                  {market.yes}¢
                </div>
              </div>

              {/* No Column */}
              <div className="col-span-1 flex flex-col justify-center items-center gap-2">
                <div className="text-base font-semibold text-pink-600">
                  {market.no}¢
                </div>
              </div>

              {/* Volume */}
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-base font-semibold text-gray-900">
                  {market.volume}
                </span>
              </div>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}





