"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MarketCard } from "@/app/(components)/MarketCard";
import { Header } from "@/app/(components)/Header";

type CategoryKey = "ALL" | "POLITICS" | "SPORTS" | "CRYPTO" | "SOCIAL" | "DATA";

// Static market data for hackathon demo
const LANDING_MARKETS = {
  superBowl: {
    category: "SPORTS" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "SUPER BOWL CHAMPIONS 2026",
      candidates: [
        { name: "KANSAS CITY", odds: 13 },
        { name: "LOS ANGELES R", odds: 11 },
      ],
      volume: "327M VOL",
      url: "https://polymarket.com/event/super-bowl-champion-2026-731",
    },
    kalshi: {
      title: "SUPER BOWL CHAMPIONS 2026",
      candidates: [
        { name: "KANSAS CITY", odds: 12 },
        { name: "PHILADELPHIA", odds: 12 },
      ],
      volume: "327M VOL",
      url: "https://kalshi.com/markets/kxsb/super-bowl/kxsb-26",
    },
  },
  demNominee: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "DEM. PRESIDENTIAL NOMINEE 2028",
      candidates: [
        { name: "GAVIN NEWSOM", odds: 37 },
        { name: "ALEXANDRIA O.", odds: 10 },
      ],
      volume: "298M VOL",
      url: "https://polymarket.com/event/democratic-presidential-nominee-2028",
    },
    kalshi: {
      title: "DEM. PRESIDENTIAL NOMINEE 2028",
      candidates: [
        { name: "GAVIN NEWSOM", odds: 13 },
        { name: "ALEXANDRIA O.", odds: 11 },
      ],
      volume: "28M VOL",
      url: "https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28",
    },
  },
  bitcoinPrice: {
    category: "CRYPTO" as const,
    image: "/superbowl.png", // Replace with bitcoin image
    polymarket: {
      title: "HOW HIGH WILL BITCOIN GET THIS YEAR?",
      candidates: [
        { name: "$130,000 OR ABOVE", odds: 10 },
        { name: "$140,000 OR ABOVE", odds: 6 },
      ],
      volume: "23.8M VOL",
      url: "https://polymarket.com/event/bitcoin-price-2025",
    },
    kalshi: {
      title: "HOW HIGH WILL BITCOIN GET THIS YEAR?",
      candidates: [
        { name: "$130,000 OR ABOVE", odds: 10 },
        { name: "$140,000 OR ABOVE", odds: 6 },
      ],
      volume: "23.8M VOL",
      url: "https://kalshi.com/markets/bitcoin",
    },
  },
  collegeFootball: {
    category: "SPORTS" as const,
    image: "/superbowl.png", // Replace with college football image
    polymarket: {
      title: "COLLEGE FOOTBALL CHAMPIONSHIP WINNER?",
      candidates: [
        { name: "OHIO ST.", odds: 38 },
        { name: "INDIANA", odds: 14 },
      ],
      volume: "18.0M VOL",
      url: "https://polymarket.com/event/college-football-championship",
    },
    kalshi: {
      title: "COLLEGE FOOTBALL CHAMPIONSHIP WINNER?",
      candidates: [
        { name: "OHIO ST.", odds: 38 },
        { name: "INDIANA", odds: 14 },
      ],
      volume: "18.0M VOL",
      url: "https://kalshi.com/markets/college-football",
    },
  },
  nycMayor: {
    category: "POLITICS" as const,
    image: "/democrats.jpg",
    polymarket: {
      title: "MARGIN OF VICTORY FOR ZOHRAN MAMDANI IN NYC MAYORAL ELECTION?",
      candidates: [
        { name: "9-11.99%", odds: 59 },
        { name: "6-8.99%", odds: 41 },
      ],
      volume: "16.6M VOL",
      url: "https://polymarket.com/event/nyc-mayoral-election",
    },
    kalshi: {
      title: "MARGIN OF VICTORY FOR ZOHRAN MAMDANI IN NYC MAYORAL ELECTION?",
      candidates: [
        { name: "9-11.99%", odds: 59 },
        { name: "6-8.99%", odds: 41 },
      ],
      volume: "16.6M VOL",
      url: "https://kalshi.com/markets/nyc-mayor",
    },
  },
  heisman: {
    category: "SPORTS" as const,
    image: "/superbowl.png",
    polymarket: {
      title: "COLLEGE FOOTBALL HEISMAN TROPHY WINNER?",
      candidates: [
        { name: "FERNANDO MENDOZA", odds: 47 },
        { name: "JULIAN SAYIN", odds: 36 },
      ],
      volume: "16.1M VOL",
      url: "https://polymarket.com/event/heisman-trophy",
    },
    kalshi: {
      title: "COLLEGE FOOTBALL HEISMAN TROPHY WINNER?",
      candidates: [
        { name: "FERNANDO MENDOZA", odds: 47 },
        { name: "JULIAN SAYIN", odds: 36 },
      ],
      volume: "16.1M VOL",
      url: "https://kalshi.com/markets/heisman",
    },
  },
  ethereumPrice: {
    category: "CRYPTO" as const,
    image: "/superbowl.png", // Replace with ethereum image
    polymarket: {
      title: "HOW HIGH WILL ETHEREUM GET THIS YEAR?",
      candidates: [
        { name: "$5,000 OR ABOVE", odds: 8 },
        { name: "$5,250 OR ABOVE", odds: 6 },
      ],
      volume: "15.3M VOL",
      url: "https://polymarket.com/event/ethereum-price-2025",
    },
    kalshi: {
      title: "HOW HIGH WILL ETHEREUM GET THIS YEAR?",
      candidates: [
        { name: "$5,000 OR ABOVE", odds: 8 },
        { name: "$5,250 OR ABOVE", odds: 6 },
      ],
      volume: "15.3M VOL",
      url: "https://kalshi.com/markets/ethereum",
    },
  },
};

function HomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  
  const getCategoryFromParam = (param: string | null): CategoryKey => {
    if (!param) return "ALL";
    const upperParam = param.toUpperCase();
    if (["POLITICS", "SPORTS", "CRYPTO", "SOCIAL", "DATA"].includes(upperParam)) {
      return upperParam as CategoryKey;
    }
    return "ALL";
  };

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(
    getCategoryFromParam(categoryParam)
  );

  useEffect(() => {
    setSelectedCategory(getCategoryFromParam(categoryParam));
  }, [categoryParam]);

  // Filter markets by category
  const filteredMarkets = Object.entries(LANDING_MARKETS).filter(
    ([_, market]) => selectedCategory === "ALL" || market.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-[#FAFAF6]">
      {/* Header */}
      <Header
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      {/* Footer with tut™ logo */}
      <footer className="fixed bottom-6 right-6 z-50">
        <img
          src="/prediction-market/market-logos/MASTER LOGO.png"
          alt="tut™"
          className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        />
      </footer>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Super Bowl Row */}
        {filteredMarkets.map(([key, market], index) => (
          <div key={key}>
            <div className="grid grid-cols-2 gap-8 mb-12">
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

            {/* Horizontal Divider between rows (not after last) */}
            {index < filteredMarkets.length - 1 && (
              <div className="border-t border-[#E5E5E5] mb-12"></div>
            )}
          </div>
        ))}

        {filteredMarkets.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No markets available in this category</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF6] flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
