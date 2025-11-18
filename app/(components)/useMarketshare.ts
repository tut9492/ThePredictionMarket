"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WindowKey } from "@/utils/time";
import type { MetricKey } from "@/utils/aggregate";

interface MarketshareData {
  window: string;
  metric: string;
  updated_at: string;
  total_value: number;
  platforms: Array<{
    platform: string;
    value: number;
    share_pct: number;
    trend_pct: number;
  }>;
  warnings?: string[];
}

interface UseMarketshareOptions {
  window: WindowKey;
  metric: MetricKey;
  mode?: "live" | "mock";
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

interface UseMarketshareReturn {
  data: MarketshareData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

// In-memory cache with 5 min TTL
const cache = new Map<string, { data: MarketshareData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(options: UseMarketshareOptions): string {
  return `${options.window}-${options.metric}-${options.mode || "live"}`;
}

export function useMarketshare(
  options: UseMarketshareOptions
): UseMarketshareReturn {
  const { window, metric, mode = "live", autoRefresh = false, refreshInterval = 60 } = options;

  const [data, setData] = useState<MarketshareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(
    async (bypassCache = false) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const cacheKey = getCacheKey({ window, metric, mode });

      // Check cache unless bypassing
      if (!bypassCache) {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setData(cached.data);
          setLastUpdated(new Date(cached.timestamp));
          setLoading(false);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          window,
          metric,
          mode,
        });

        const url = `/api/marketshare?${params}`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result: MarketshareData = await response.json();

        // Update cache
        cache.set(cacheKey, { data: result, timestamp: Date.now() });

        setData(result);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, ignore
          return;
        }
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
        console.error("Error fetching market data:", errorMessage, err);
        setError(errorMessage);
        setData(null);
        setLoading(false);
      }
    },
    [window, metric, mode]
  );

  const refresh = useCallback(async () => {
    await fetchData(true); // Bypass cache
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window, metric, mode]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(false); // Use cache for auto-refresh
      }, refreshInterval * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, window, metric, mode]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}

