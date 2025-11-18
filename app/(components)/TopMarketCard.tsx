"use client";

import type { TopMarket } from "./useTopMarkets";

type TopMarketCardProps = {
  market: TopMarket;
  rank: number;
};

function formatVolume(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${Math.round(value / 1_000_000)}M`;
  }
  return `$${value.toLocaleString()}`;
}

export function TopMarketCard({ market, rank }: TopMarketCardProps) {
  const oddsPercentage = Math.round(market.current_odds * 100);

  return (
    <a
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
    >
      {/* Rank + Title */}
      <div className="flex items-start gap-2 mb-2">
        <div className="text-xl font-bold text-gray-300 group-hover:text-blue-500 transition-colors">
          {rank}
        </div>
        <h4 className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
          {market.title}
        </h4>
      </div>

      {/* Meta Info */}
      <div className="text-xs text-gray-600 space-y-1 ml-7">
        <div className="font-semibold text-gray-500">{market.category}</div>
        <div className="font-bold text-gray-900">{formatVolume(market.volume_24h)}</div>
        <div>{oddsPercentage}% YES</div>
      </div>
    </a>
  );
}

