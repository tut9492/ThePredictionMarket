"use client";

import { useMarketshareContext } from "./MarketshareProvider";
import type { WindowKey } from "@/utils/time";
import type { MetricKey } from "@/utils/aggregate";

export function WindowSelector() {
  const { window, setWindow } = useMarketshareContext();

  const windows = [
    { key: "7d" as const, label: "7D" },
    { key: "30d" as const, label: "30D" },
    { key: "all" as const, label: "ALL TIME" },
  ];

  return (
    <div className="flex gap-2 justify-center">
      {windows.map((w) => (
        <button
          key={w.key}
          onClick={() => setWindow(w.key)}
          className={`px-6 py-2 rounded-lg font-medium transition-colors uppercase ${
            window === w.key
              ? "bg-blue-500 text-white"
              : "bg-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}

export function MetricSelector() {
  const { metric, setMetric } = useMarketshareContext();

  return (
    <div className="flex gap-2 justify-center">
      <button
        onClick={() => setMetric("volume_usd")}
        className="px-6 py-2 rounded-lg font-medium transition-colors bg-blue-500 text-white uppercase"
      >
        VOLUME
      </button>
    </div>
  );
}

