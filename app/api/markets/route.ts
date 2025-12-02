import { NextResponse } from 'next/server';

interface PolymarketOutcome {
  id: string;
  title: string;
  price: string;
  index: number;
}

interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  description?: string;
  end_date_iso: string;
  outcomes: PolymarketOutcome[];
  active: boolean;
  closed: boolean;
  volume?: string;
  liquidity?: string;
  image?: string;  // Market image URL
  icon?: string;   // Alternative image field
  market_image?: string;  // Another possible field
}

interface ProcessedMarket {
  id: string;
  name: string;
  outcomes: Array<{
    name: string;
    price: number;
    percentage: string;
  }>;
  url: string;
  endDate: string;
  volume: number;
  active: boolean;
  image: string;  // Image URL for the market
}

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
const POLYMARKET_URL_BASE = 'https://polymarket.com/event';
const REFERRAL_CODE = 'tut';

// Fallback placeholder image
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300/667eea/ffffff?text=Prediction+Market';

// Helper function to get the best available image URL
function getMarketImage(market: PolymarketMarket): string {
  // Try multiple possible image fields from Polymarket API
  const imageUrl = market.image || 
                   market.icon || 
                   market.market_image || 
                   (market as any).imageUrl ||
                   (market as any).thumbnail;
  
  // If we found an image, return it
  if (imageUrl) {
    // Handle relative URLs
    if (imageUrl.startsWith('/')) {
      return `https://polymarket.com${imageUrl}`;
    }
    // Handle full URLs
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // Handle other formats
    return `https://polymarket.com/${imageUrl}`;
  }
  
  // Return placeholder if no image found
  return PLACEHOLDER_IMAGE;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const active = searchParams.get('active') || 'true';
    
    const response = await fetch(
      `${POLYMARKET_API_BASE}/markets?limit=${limit}&active=${active}&closed=false`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const markets: PolymarketMarket[] = await response.json();

    const processedMarkets: ProcessedMarket[] = markets
      .filter(market => market.outcomes && market.outcomes.length > 0)
      .map(market => {
        const sortedOutcomes = [...market.outcomes].sort((a, b) => a.index - b.index);
        
        return {
          id: market.id,
          name: market.question,
          outcomes: sortedOutcomes.map(outcome => {
            const price = parseFloat(outcome.price);
            return {
              name: outcome.title,  // Use title for actual outcome names
              price: price,
              percentage: `${(price * 100).toFixed(1)}%`
            };
          }),
          url: `${POLYMARKET_URL_BASE}/${market.slug}?via=${REFERRAL_CODE}`,
          endDate: market.end_date_iso,
          volume: parseFloat(market.volume || '0'),
          active: market.active,
          image: getMarketImage(market)  // Add image URL
        };
      });

    return NextResponse.json({
      success: true,
      markets: processedMarkets,
      count: processedMarkets.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market data',
        markets: []
      },
      { status: 500 }
    );
  }
}







