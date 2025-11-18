"use client";

import { useState, useEffect, useRef } from "react";
import { useMarketshare } from "./useMarketshare";
import { useMarketshareContext } from "./MarketshareProvider";
import html2canvas from "html2canvas";
import type { PlatformKey } from "@/lib/dune";

const PLATFORM_COLORS: Record<PlatformKey, string> = {
  kalshi: "#00C9A7", // Teal
  polymarket: "#5B8DEE", // Blue
};

const MAX_BAR_HEIGHT = 400;
const BAR_WIDTH = 120;
const BAR_GAP = 24;

/**
 * Formats large numbers: 20000000 → "20MIL", 1500000000 → "1.5B"
 */
function formatBarValue(value: number): string {
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return billions % 1 === 0 ? `${billions}B` : `${billions.toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return millions % 1 === 0 ? `${millions}MIL` : `${millions.toFixed(1)}MIL`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Formats percentage: 52.55 → "53%", 0.8 → "0.8%"
 */
function formatPercent(pct: number): string {
  if (pct < 1) {
    return `${pct.toFixed(1)}%`;
  }
  return `${Math.round(pct)}%`;
}

/**
 * Returns time ago string: "just now", "2 minutes ago", "3 hours ago", etc.
 */
function timeAgo(date: Date | null): string {
  if (!date) return "never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`;
  return date.toLocaleDateString();
}

/**
 * Platform Logo Component with fallback logic
 * Tries PNG first, then SVG, then shows text
 */
function PlatformLogo({ platform }: { platform: PlatformKey }) {
  const [pngError, setPngError] = useState(false);
  const [jpgError, setJpgError] = useState(false);
  const [svgError, setSvgError] = useState(false);

  const getLogoPath = (ext: string) => {
    return `/prediction-market/market-logos/${platform}.${ext}`;
  };

  const pngSrc = getLogoPath("png");
  const jpgSrc = getLogoPath("jpg");
  const svgSrc = getLogoPath("svg");

  // If all formats failed, show text
  if (pngError && jpgError && svgError) {
    return (
      <div className="w-12 h-12 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase">
        {platform.slice(0, 3)}
      </div>
    );
  }

  // Try PNG first
  if (!pngError) {
    return (
      <img
        src={pngSrc}
        alt={`${platform} logo`}
        className="w-12 h-12 object-contain"
        onError={() => setPngError(true)}
      />
    );
  }

  // If PNG failed, try JPG (e.g., Myriad.jpg)
  if (!jpgError) {
    return (
      <img
        src={jpgSrc}
        alt={`${platform} logo`}
        className="w-12 h-12 object-contain"
        onError={() => setJpgError(true)}
      />
    );
  }

  // If JPG failed, try SVG
  if (!svgError) {
    return (
      <img
        src={svgSrc}
        alt={`${platform} logo`}
        className="w-12 h-12 object-contain"
        onError={() => setSvgError(true)}
      />
    );
  }

  // Fallback to text
  return (
    <div className="w-12 h-12 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase">
      {platform.slice(0, 3)}
    </div>
  );
}

export function EnhancedMarketShareChart() {
  const { window, metric } = useMarketshareContext();
  const { data, loading, error, lastUpdated, refresh } = useMarketshare({
    window,
    metric,
    mode: "live", // Using real Dune API data
    autoRefresh: true,
    refreshInterval: 60,
  });

  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  // Calculate bar heights
  const maxValue = data
    ? Math.max(...data.platforms.map((p) => p.value), 1)
    : 1;

  const handleBarHover = (platform: string, event: React.MouseEvent) => {
    setHoveredPlatform(platform);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleBarLeave = () => {
    setHoveredPlatform(null);
  };

  const handleExportPNG = async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#f9fafb",
        scale: 2,
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `market-share-${window}-${metric}-${timestamp}.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to export PNG:", error);
      alert("Failed to export PNG. Please try again.");
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-gray-500">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const statusColor = lastUpdated && Date.now() - lastUpdated.getTime() < 120000 ? "green" : "yellow";

  return (
    <div className="w-full max-w-7xl mx-auto px-6 relative">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-5xl font-normal text-left tracking-[0.3em] uppercase mb-2 text-gray-800">
          {window === "24h" ? "24-HOUR TRADING VOLUME" : "THE PREDICTION MARKET"}
        </h1>
      </div>

      {/* Header: Status + Export */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              statusColor === "green" ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <span className="text-gray-600">
            Updated {timeAgo(lastUpdated)}
          </span>
          <button
            onClick={() => {
              refresh();
            }}
            className="ml-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
        <button
          onClick={handleExportPNG}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          EXPORT PNG
        </button>
      </div>

      {/* Chart Container */}
      <div ref={chartRef} className="bg-white rounded-xl shadow-lg p-8 relative">
        <div className="flex items-end justify-between gap-12 relative" style={{ minHeight: MAX_BAR_HEIGHT + 100 }}>
          {/* Bars Section */}
          <div className="flex-1 max-w-[800px] flex items-end justify-center gap-8 relative" style={{ minHeight: MAX_BAR_HEIGHT + 100 }}>
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {[0, 25, 50, 75, 100].map((pct) => (
                <div
                  key={pct}
                  className="absolute left-0 right-0 border-t border-gray-200"
                  style={{
                    bottom: `${pct}%`,
                  }}
                />
              ))}
              <div className="absolute left-0 top-0 bottom-0 border-l border-gray-200" />
            </div>

            {/* Bars */}
            {data.platforms.map((platform, index) => {
            const height = (platform.value / maxValue) * MAX_BAR_HEIGHT;
            const color = PLATFORM_COLORS[platform.platform as PlatformKey] || "#gray";
            const isHovered = hoveredPlatform === platform.platform;

            return (
              <div
                key={platform.platform}
                className="flex flex-col items-center relative"
                style={{ width: BAR_WIDTH }}
              >
                {/* Top Label: Volume */}
                <div className="mb-2 text-center">
                  <div className="text-sm font-semibold text-gray-800">
                    {formatBarValue(platform.value)}
                  </div>
                </div>

                {/* Trend Indicator */}
                <div
                  className={`mb-2 text-xs font-medium ${
                    platform.trend_pct >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {platform.trend_pct >= 0 ? "↑" : "↓"} {Math.abs(platform.trend_pct).toFixed(1)}%
                </div>

                {/* Share Percentage */}
                <div className="mb-2 text-sm font-semibold text-gray-700">
                  {formatPercent(platform.share_pct)}
                </div>

                {/* Clean Solid Bar (no text inside) */}
                <div
                  className="relative rounded-t-2xl transition-all duration-600 cursor-pointer"
                  style={{
                    width: BAR_WIDTH,
                    height: height,
                    backgroundColor: color,
                    transform: isHovered ? "scale(1.02)" : "scale(1)",
                    boxShadow: isHovered
                      ? "0 10px 25px rgba(0,0,0,0.15)"
                      : "none",
                  }}
                  onMouseEnter={(e) => handleBarHover(platform.platform, e)}
                  onMouseLeave={handleBarLeave}
                >
                  {/* No text inside bar - clean solid bar */}
                </div>

                {/* Platform Logo */}
                <div className="mt-3 flex items-center justify-center">
                  <PlatformLogo platform={platform.platform as PlatformKey} />
                </div>
              </div>
            );
          })}
          </div>

        {/* Tooltip */}
        {hoveredPlatform && (
          <div
            className="fixed z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="text-sm font-semibold mb-1 uppercase">{hoveredPlatform}</div>
            {data.platforms
              .find((p) => p.platform === hoveredPlatform)
              ?.value && (
                <>
                  <div className="text-xs text-gray-300">
                    {formatBarValue(
                      data.platforms.find((p) => p.platform === hoveredPlatform)!.value
                    )}
                  </div>
                  <div className="text-xs text-gray-300">
                    Share: {formatPercent(
                      data.platforms.find((p) => p.platform === hoveredPlatform)!.share_pct
                    )}
                  </div>
                  <div
                    className={`text-xs ${
                      (data.platforms.find((p) => p.platform === hoveredPlatform)?.trend_pct || 0) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    Trend:{" "}
                    {(data.platforms.find((p) => p.platform === hoveredPlatform)?.trend_pct || 0) >= 0
                      ? "↑"
                      : "↓"}{" "}
                    {Math.abs(
                      data.platforms.find((p) => p.platform === hoveredPlatform)?.trend_pct || 0
                    ).toFixed(1)}%
                  </div>
                </>
              )}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            />
          </div>
        )}

          {/* Total Volume Display */}
          <div className="flex flex-col items-end justify-end pb-16 min-w-[280px]">
            <div className="text-right">
              <div className="text-3xl uppercase tracking-[0.25em] text-gray-500 font-normal">
                Total
              </div>
              <div className="text-3xl uppercase tracking-[0.25em] text-gray-500 font-normal mt-2">
                Volume
              </div>
              <div className="flex items-baseline mt-4">
                <span className="text-[140px] leading-none text-gray-800 font-normal">
                  {(data.total_value / 1_000_000_000).toFixed(1)}
                </span>
                <span className="text-[80px] ml-4 text-gray-600 font-normal">BIL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

