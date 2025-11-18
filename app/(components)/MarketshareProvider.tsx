"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { WindowKey } from "@/utils/time";
import type { MetricKey } from "@/utils/aggregate";

interface MarketshareContextType {
  window: WindowKey;
  metric: MetricKey;
  setWindow: (window: WindowKey) => void;
  setMetric: (metric: MetricKey) => void;
}

const MarketshareContext = createContext<MarketshareContextType | undefined>(undefined);

export function MarketshareProvider({ children }: { children: ReactNode }) {
  const [window, setWindow] = useState<WindowKey>("7d");
  const [metric, setMetric] = useState<MetricKey>("volume_usd");

  return (
    <MarketshareContext.Provider value={{ window, metric, setWindow, setMetric }}>
      {children}
    </MarketshareContext.Provider>
  );
}

export function useMarketshareContext(): MarketshareContextType {
  const context = useContext(MarketshareContext);
  if (!context) {
    throw new Error("useMarketshareContext must be used within MarketshareProvider");
  }
  return context;
}

