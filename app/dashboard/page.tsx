import { MarketshareProvider } from "@/app/(components)/MarketshareProvider";
import { EnhancedMarketShareChart } from "@/app/(components)/EnhancedMarketShareChart";
import { WindowSelector } from "@/app/(components)/MarketShareChart";
import { TopMarkets } from "@/app/(components)/TopMarkets";

export default function DashboardPage() {
  return (
    <MarketshareProvider>
      <div className="min-h-screen bg-gray-50 py-12 relative">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div className="flex flex-wrap gap-4">
              <WindowSelector />
            </div>
          </div>
        </div>

        <EnhancedMarketShareChart />

        {/* Top Markets Section */}
        <TopMarkets />

        {/* TUT Logo - Fixed position, outside chart card */}
        <div className="fixed bottom-8 right-8 z-50">
          <a
            href="https://x.com/tuteth_"
            target="_blank"
            rel="noopener noreferrer"
            className="block opacity-80 hover:opacity-100 transition-opacity"
          >
            <img
              src="/prediction-market/market-logos/MASTER LOGO.png"
              alt="TUT"
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
          </a>
        </div>
      </div>
    </MarketshareProvider>
  );
}

