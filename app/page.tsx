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
          <div>
            <div className="bg-white rounded-lg border p-6">
              {filteredMarkets.map(([key, market]) => (
                <div key={key} className="border-b py-4 last:border-0">
                  <h3 className="font-bold">{market.kalshi.title}</h3>
                  <p className="text-sm text-gray-600">{market.kalshi.volume}</p>
                </div>
              ))}
            </div>
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
