"use client";

import { useState, Suspense } from "react";
import { MarketCard } from "@/app/(components)/MarketCard";
import { Header } from "@/app/(components)/Header";

type CategoryKey = "ALL" | "POLITICS" | "SPORTS" | "CRYPTO" | "SOCIAL" | "DATA";

const LANDING_MARKETS = {
  superBowl: {
    category: "SPORTS" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "SUPER BOWL CHAMPION 2026",
      candidates: [
        { name: "PHILADELPHIA", odds: 14 },
        { name: "LOS ANGELES R", odds: 13 },
      ],
      volume: "543M VOL",
      url: "https://polymarket.com/event/super-bowl-champion-2026-731",
    },
    kalshi: {
      title: "PRO FOOTBALL CHAMPION?",
      candidates: [
        { name: "PHILADELPHIA", odds: 15 },
        { name: "LOS ANGELES R", odds: 13 },
      ],
      volume: "34.5M VOL",
      url: "https://kalshi.com/markets/kxsb/super-bowl/kxsb-26",
    },
  },
  demNominee: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "DEMOCRATIC PRESIDENTIAL NOMINEE 2028",
      candidates: [
        { name: "GAVIN NEWSOM", odds: 37 },
        { name: "ALEXANDRIA O.", odds: 10 },
      ],
      volume: "309M VOL",
      url: "https://polymarket.com/event/democratic-presidential-nominee-2028",
    },
    kalshi: {
      title: "DEMOCRATIC PRESIDENTIAL NOMINEE IN 2028?",
      candidates: [
        { name: "GAVIN NEWSOM", odds: 37 },
        { name: "ALEXANDRIA OCASIO-CORTEZ", odds: 10 },
      ],
      volume: "28.3M VOL",
      url: "https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28",
    },
  },
};

function HomeContent() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  const filteredMarkets = Object.entries(LANDING_MARKETS);

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
        {/* Toggle Buttons */}
        <div className="flex justify-end mb-8">
          <div className="bg-white border border-gray-300 rounded-lg p-1 inline-flex gap-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-6 py-2 rounded-md font-medium ${
                viewMode === "cards" ? "bg-black text-white" : "bg-white text-gray-700"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-6 py-2 rounded-md font-medium ${
                viewMode === "list" ? "bg-black text-white" : "bg-white text-gray-700"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Cards View */}
        {viewMode === "cards" && (
          <div>
            {filteredMarkets.map(([key, market]) => (
              <div key={key} className="grid grid-cols-2 gap-8 mb-12">
                <MarketCard
                  platform="polymarket"
                  title={market.polymarket.title}
                  candidates={market.polymarket.candidates}
                  volume={market.polymarket.volume}
                  image={market.image}
                  url={market.polymarket.url}
                />
                <MarketCard
                  platform="kalshi"
                  title={market.kalshi.title}
                  candidates={market.kalshi.candidates}
                  volume={market.kalshi.volume}
                  image={market.image}
                  url={market.kalshi.url}
                />
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-100 border-b-2 border-gray-300">
              <div className="col-span-1 text-sm font-bold text-gray-900 uppercase">Platform</div>
              <div className="col-span-4 text-sm font-bold text-gray-900 uppercase">Market</div>
              <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-center">Odds</div>
              <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-center">Yes</div>
              <div className="col-span-1 text-sm font-bold text-gray-900 uppercase text-center">No</div>
              <div className="col-span-2 text-sm font-bold text-gray-900 uppercase text-right">Volume</div>
            </div>

            {/* Table Rows - Show both Kalshi and Polymarket for each market */}
            {filteredMarkets.map(([key, market]) => (
              <div key={key}>
                {/* Kalshi Row */}
                <a
                  href={market.kalshi.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  {/* Platform Logo */}
                  <div className="col-span-1 flex items-center">
                    <div className="w-16 h-16 bg-white rounded border border-gray-200 p-2 relative">
                      <img 
                        src="/prediction-market/market-logos/kalshi.png"
                        alt="Kalshi"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute -top-1 -left-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">K</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Market Info with Image */}
                  <div className="col-span-4 flex items-center gap-4">
                    <img 
                      src={market.image}
                      alt={market.kalshi.title}
                      className="w-20 h-20 rounded object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-base text-gray-900 group-hover:text-black uppercase">
                        {market.kalshi.title}
                      </div>
                    </div>
                  </div>
                  
                  {/* Odds Column - Candidates */}
                  <div className="col-span-2 flex flex-col justify-center gap-2">
                    {market.kalshi.candidates.map((c, i) => (
                      <div key={i} className="text-sm text-gray-900 uppercase font-medium">
                        {c.name}
                      </div>
                    ))}
                  </div>
                  
                  {/* Yes Column */}
                  <div className="col-span-2 flex flex-col justify-center items-center gap-2">
                    {market.kalshi.candidates.map((c, i) => (
                      <div key={i} className="text-base font-semibold text-teal-600">
                        {c.odds}¢
                      </div>
                    ))}
                  </div>
                  
                  {/* No Column */}
                  <div className="col-span-1 flex flex-col justify-center items-center gap-2">
                    {market.kalshi.candidates.map((c, i) => (
                      <div key={i} className="text-base font-semibold text-pink-600">
                        {100 - c.odds}¢
                      </div>
                    ))}
                  </div>
                  
                  {/* Volume */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-base font-semibold text-gray-900">
                      {market.kalshi.volume.replace(' VOL', '')}
                    </span>
                  </div>
                </a>

                {/* Polymarket Row */}
                <a
                  href={market.polymarket.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  {/* Platform Logo */}
                  <div className="col-span-1 flex items-center">
                    <div className="w-16 h-16 bg-white rounded border border-gray-200 p-2 relative">
                      <img 
                        src="/prediction-market/market-logos/polymarket.png"
                        alt="Polymarket"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Market Info with Image */}
                  <div className="col-span-4 flex items-center gap-4">
                    <img 
                      src={market.image}
                      alt={market.polymarket.title}
                      className="w-20 h-20 rounded object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-base text-gray-900 group-hover:text-black uppercase">
                        {market.polymarket.title}
                      </div>
                    </div>
                  </div>
                  
                  {/* Odds Column - Candidates */}
                  <div className="col-span-2 flex flex-col justify-center gap-2">
                    {market.polymarket.candidates.map((c, i) => (
                      <div key={i} className="text-sm text-gray-900 uppercase font-medium">
                        {c.name}
                      </div>
                    ))}
                  </div>
                  
                  {/* Yes Column */}
                  <div className="col-span-2 flex flex-col justify-center items-center gap-2">
                    {market.polymarket.candidates.map((c, i) => (
                      <div key={i} className="text-base font-semibold text-teal-600">
                        {c.odds}¢
                      </div>
                    ))}
                  </div>
                  
                  {/* No Column */}
                  <div className="col-span-1 flex flex-col justify-center items-center gap-2">
                    {market.polymarket.candidates.map((c, i) => (
                      <div key={i} className="text-base font-semibold text-pink-600">
                        {100 - c.odds}¢
                      </div>
                    ))}
                  </div>
                  
                  {/* Volume */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-base font-semibold text-gray-900">
                      {market.polymarket.volume.replace(' VOL', '')}
                    </span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
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
