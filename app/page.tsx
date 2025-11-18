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
      // POLYMARKET DATA
      title: "SUPER BOWL CHAMPION 2026",
      candidates: [
        { name: "PHILADELPHIA", odds: 14 },
        { name: "LOS ANGELES R", odds: 13 },
      ],
      volume: "543M VOL",
      url: "https://polymarket.com/event/super-bowl-champion-2026-731",
    },
    kalshi: {
      // KALSHI DATA
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
      // POLYMARKET DATA
      title: "DEMOCRATIC PRESIDENTIAL NOMINEE 2028",
      candidates: [
        { name: "GAVIN NEWSOM", odds: 37 },
        { name: "ALEXANDRIA O.", odds: 10 },
      ],
      volume: "309M VOL",
      url: "https://polymarket.com/event/democratic-presidential-nominee-2028",
    },
    kalshi: {
      // KALSHI DATA
      title: "DEMOCRATIC PRESIDENTIAL NOMINEE IN 2028?",
      candidates: [
        { name: "GAVIN NEWSOM", odds: 37 },
        { name: "ALEXANDRIA OCASIO-CORTEZ", odds: 10 },
      ],
      volume: "28.3M VOL",
      url: "https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28",
    },
  },
  bitcoinPrice: {
    category: "CRYPTO" as const,
    image: "/Bitcoin.webp",
    polymarket: {
      // POLYMARKET DATA
      title: "WHAT PRICE WILL BITCOIN HIT IN 2025?",
      candidates: [
        { name: "↓ 90,000", odds: 89 },
        { name: "$130,000 OR ABOVE", odds: 10 },
      ],
      volume: "58M VOL",
      url: "https://polymarket.com/event/what-price-will-bitcoin-hit-in-2025",
    },
    kalshi: {
      // KALSHI DATA
      title: "HOW HIGH WILL BITCOIN GET THIS YEAR?",
      candidates: [
        { name: "$130,000 OR ABOVE", odds: 10 },
        { name: "$140,000 OR ABOVE", odds: 6 },
      ],
      volume: "23.8M VOL",
      url: "https://kalshi.com/markets/kxbtcmaxy/how-high-will-bitcoin-get-this-year/kxbtcmaxy-25",
    },
  },
  ethereumPrice: {
    category: "CRYPTO" as const,
    image: "/Ethereum.webp",
    polymarket: {
      // POLYMARKET DATA
      title: "WHAT PRICE WILL ETHEREUM HIT IN 2025?",
      candidates: [
        { name: "$5,000", odds: 8 },
        { name: "$5,250 OR ABOVE", odds: 6 },
      ],
      volume: "37M VOL",
      url: "https://polymarket.com/event/what-price-will-ethereum-hit-in-2025",
    },
    kalshi: {
      // KALSHI DATA
      title: "HOW HIGH WILL ETHEREUM GET THIS YEAR?",
      candidates: [
        { name: "$5,000 OR ABOVE", odds: 8 },
        { name: "$5,250 OR ABOVE", odds: 6 },
      ],
      volume: "15.3M VOL",
      url: "https://kalshi.com/markets/kxethmaxy/how-high-will-ethereum-get-this-year/kxethmaxy-25dec31",
    },
  },
  nycMayor: {
    category: "POLITICS" as const,
    image: "/Zorhan.avif",
    polymarket: {
      // POLYMARKET DATA
      title: "ZOHRAN MAMDANI MARGIN OF VICTORY (SMALLER BRACKETS)",
      candidates: [
        { name: "5-10%", odds: 98 },
        { name: "9-11.99%", odds: 59 },
      ],
      volume: "558K VOL",
      url: "https://polymarket.com/event/zohran-mamdani-margin-of-victory-smaller-brackets",
    },
    kalshi: {
      // KALSHI DATA
      title: "MARGIN OF VICTORY FOR ZOHRAN MAMDANI IN THE NYC MAYORAL ELECTION?",
      candidates: [
        { name: "9-11.99%", odds: 59 },
        { name: "6-8.99%", odds: 41 },
      ],
      volume: "16.6M VOL",
      url: "https://kalshi.com/markets/kxelectionmovzohran/zohran-mov/kxelectionmovzohran-25",
    },
  },
  collegeFootball: {
    category: "SPORTS" as const,
    image: "/College Footbal.jpeg",
    polymarket: {
      // POLYMARKET DATA
      title: "COLLEGE FOOTBALL CHAMPION 2026",
      candidates: [
        { name: "OHIO STATE", odds: 39 },
        { name: "INDIANA", odds: 14 },
      ],
      volume: "3M VOL",
      url: "https://polymarket.com/event/college-football-champion-2026-684",
    },
    kalshi: {
      // KALSHI DATA
      title: "COLLEGE FOOTBALL CHAMPIONSHIP WINNER?",
      candidates: [
        { name: "OHIO ST.", odds: 38 },
        { name: "INDIANA", odds: 14 },
      ],
      volume: "18.0M VOL",
      url: "https://kalshi.com/markets/kxncaaf/ncaaf-championship/kxncaaf-26",
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
