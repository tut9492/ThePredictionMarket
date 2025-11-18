"use client";

import { useEffect, useState } from "react";

type PlatformKey = "kalshi" | "polymarket";

export type TopMarket = {
  id: string;
  title: string;
  category: string;
  platform: PlatformKey;
  volume_24h: number;
  current_odds: number;
  url: string;
};

export type TopMarketsData = {
  kalshi: TopMarket[];
  polymarket: TopMarket[];
  updated_at: string;
};

export function useTopMarkets() {
  const [data, setData] = useState<TopMarketsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/top-markets");
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      console.error("Top markets fetch error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refresh: fetchData };
}

