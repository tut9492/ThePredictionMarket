"use client";

import { useState } from "react";
import { Header } from "@/app/(components)/Header";

// Weekly Volume Data
const volumeData = [
  {
    platform: 'MYRIAD',
    current: 11054008,
    ath: 21576428,
    displayCurrent: '11.1M',
    displayATH: '21.6M',
    percentage: 51,
    color: '#8B5CF6',
    logo: '/prediction-market/market-logos/Myriad.jpg'
  },
  {
    platform: 'LIMITLESS',
    current: 14540118,
    ath: 15905424,
    displayCurrent: '14.5M',
    displayATH: '15.9M',
    percentage: 91,
    color: '#A3E635',
    logo: '/prediction-market/market-logos/limitless.png'
  },
  {
    platform: 'KALSHI',
    current: 1304733534,
    ath: 1304733534,
    displayCurrent: '1.30B',
    displayATH: '1.30B',
    percentage: 100,
    color: '#10B981',
    logo: '/prediction-market/market-logos/kalshi.png'
  },
  {
    platform: 'POLYMARKET',
    current: 1001788838,
    ath: 1107382201,
    displayCurrent: '1.00B',
    displayATH: '1.11B',
    percentage: 90,
    color: '#3B82F6',
    logo: '/prediction-market/market-logos/polymarket.png'
  }
];

const totalVolume = {
  platform: 'TOTAL',
  current: 2998087080,
  ath: 3154525841,
  displayCurrent: '3.0B',
  displayATH: '3.15B',
  percentage: 95,
  color: '#FBBF24'
};

// Weekly Users Data
const userData = [
  {
    platform: 'MYRIAD',
    current: 5436,
    ath: 7645,
    displayCurrent: '5.4K',
    displayATH: '7.6K',
    percentage: 71,
    color: '#8B5CF6',
    logo: '/prediction-market/market-logos/Myriad.jpg'
  },
  {
    platform: 'LIMITLESS',
    current: 6958,
    ath: 28615,
    displayCurrent: '7.0K',
    displayATH: '28.6K',
    percentage: 24,
    color: '#A3E635',
    logo: '/prediction-market/market-logos/limitless.png'
  },
  {
    platform: 'KALSHI',
    current: 120000,
    ath: 120000,
    displayCurrent: '120K',
    displayATH: '120K',
    percentage: 100,
    color: '#10B981',
    logo: '/prediction-market/market-logos/kalshi.png'
  },
  {
    platform: 'POLYMARKET',
    current: 225638,
    ath: 250868,
    displayCurrent: '225.6K',
    displayATH: '250.9K',
    percentage: 90,
    color: '#3B82F6',
    logo: '/prediction-market/market-logos/polymarket.png'
  }
];

const totalUsers = {
  platform: 'TOTAL',
  current: 408657,
  ath: 408657,
  displayCurrent: '408.7K',
  displayATH: '408.7K',
  percentage: 100,
  color: '#FBBF24'
};

function VerticalBarChart({ data, total, title }: any) {
  const allData = [...data, total];
  
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
      <h2 className="text-xl font-light uppercase mb-2 text-left text-gray-700 tracking-wide">
        {title}
      </h2>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-8">Week of November 3, 2025</p>
      
      {/* EXACT SAME STRUCTURE FOR BOTH CHARTS */}
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Chart area - EXACTLY 430px */}
        <div style={{ height: '430px', position: 'relative' }}>
          {/* Y-axis */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', backgroundColor: '#1f2937' }}></div>
          
          {/* X-axis */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '2px', backgroundColor: '#1f2937' }}></div>
          
          {/* Gridlines */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ borderTop: '1px solid #e5e7eb', width: '100%' }}></div>
            ))}
          </div>
          
          {/* Bars */}
          <div style={{ position: 'absolute', left: '16px', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
            {allData.map((item: any, index: number) => {
              const isTotal = item.platform === 'TOTAL';
              const percentageOfTotal = ((item.current / total.current) * 100).toFixed(1);
              
              // Height calculation - TOTAL at 92%, others scaled with square root
              const heightPercent = isTotal ? 92 : (Math.sqrt(item.current / total.current) * 92);
              const athHeightPercent = isTotal ? 92 : (Math.sqrt(item.ath / total.ath) * 92);
              
              return (
                <div 
                  key={index}
                  className="group relative"
                  style={{ 
                    width: isTotal ? '80px' : '70px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginLeft: isTotal ? '32px' : '0'
                  }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl text-sm whitespace-nowrap">
                      <div className="font-bold mb-2 text-center border-b border-gray-700 pb-2">
                        {item.platform}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-400">Current:</span>
                          <span className="font-semibold">{item.displayCurrent}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-400">ATH:</span>
                          <span className="font-semibold">{item.displayATH}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-400">% of ATH:</span>
                          <span className="font-semibold">{item.percentage}%</span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-gray-700">
                          <span className="text-gray-400">% of Total:</span>
                          <span className="font-semibold">{percentageOfTotal}%</span>
                        </div>
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                  
                  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    {/* ATH bar */}
                    <div 
                      className="transition-opacity duration-200 group-hover:opacity-40"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: `${athHeightPercent}%`,
                        backgroundColor: item.color,
                        opacity: 0.25,
                        borderRadius: '8px 8px 0 0',
                        transform: 'translateX(-8px)'
                      }}
                    ></div>
                    
                    {/* Current bar */}
                    <div 
                      className="transition-all duration-200 group-hover:brightness-110 group-hover:scale-105"
                      style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        backgroundColor: item.color,
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '8px',
                        minHeight: '70px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{item.displayCurrent}</div>
                      <div style={{ fontSize: '12px', color: 'white', opacity: 0.9 }}>{percentageOfTotal}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Logo area - EXACTLY 170px */}
        <div style={{ height: '170px', paddingTop: '12px', paddingLeft: '16px', display: 'flex', gap: '24px' }}>
          {allData.map((item: any, index: number) => {
            const isTotal = item.platform === 'TOTAL';
            
            return (
              <div 
                key={index}
                style={{ 
                  width: isTotal ? '80px' : '70px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginLeft: isTotal ? '32px' : '0'
                }}
              >
                {item.logo ? (
                  <div style={{ width: '48px', height: '48px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px', marginBottom: '8px' }}>
                    <img src={item.logo} alt={item.platform} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ height: '48px', marginBottom: '8px' }}></div>
                )}
                
                {isTotal && (
                  <div style={{ padding: '4px 16px', backgroundColor: '#FBBF24', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    TOTAL
                  </div>
                )}
                
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#4b5563', textTransform: 'uppercase' }}>
                  {item.platform}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DataPage() {
  const [selectedCategory, setSelectedCategory] = useState<"DATA">("DATA");

  return (
    <div className="min-h-screen bg-[#FAFAF6]">
      <Header
        selectedCategory={selectedCategory}
        onCategoryChange={(category) => {
          if (category !== "DATA") {
            window.location.href = "/";
          }
        }}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <VerticalBarChart 
            data={volumeData}
            total={totalVolume}
            title="VOLUME COMPARISON BETWEEN TOP PREDICTION MARKETS"
          />

          <VerticalBarChart 
            data={userData}
            total={totalUsers}
            title="TOTAL NUMBER OF USERS ON EACH PLATFORM"
          />
        </div>
      </main>

      <footer className="fixed bottom-6 right-6 z-50">
        <a 
          href="https://x.com/tut9492" 
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
    </div>
  );
}
