import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from Polymarket - get more markets to find multi-outcome ones
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?limit=100&active=true',
      {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    );

    const markets = await response.json();

    // Find a multi-outcome market
    let multiMarket: any = null;
    for (const m of markets) {
      const outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes;
      if (outcomes && Array.isArray(outcomes) && outcomes.length > 2) {
        multiMarket = { ...m, parsedOutcomes: outcomes };
        break;
      }
    }

    if (!multiMarket) {
      // Show first few markets for debugging
      const sampleMarkets = markets.slice(0, 3).map((m: any) => {
        const outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes;
        return {
          question: m.question,
          outcomesType: typeof m.outcomes,
          outcomesIsArray: Array.isArray(outcomes),
          outcomesLength: Array.isArray(outcomes) ? outcomes.length : 'N/A',
          firstOutcome: Array.isArray(outcomes) ? outcomes[0] : outcomes,
          allOutcomes: outcomes
        };
      });
      
      return NextResponse.json({ 
        error: 'No multi-outcome markets found (need >2 outcomes)',
        totalMarkets: markets.length,
        sampleMarkets
      });
    }

    const outcomes = multiMarket.parsedOutcomes;

    return NextResponse.json({
      marketQuestion: multiMarket.question,
      marketSlug: multiMarket.slug,
      outcomeCount: outcomes.length,
      outcomesAreStrings: typeof outcomes[0] === 'string',
      rawOutcomes: outcomes,
      marketKeys: Object.keys(multiMarket),
      // Check if there's an outcomePrices field
      outcomePrices: multiMarket.outcomePrices ? (
        typeof multiMarket.outcomePrices === 'string' 
          ? JSON.parse(multiMarket.outcomePrices) 
          : multiMarket.outcomePrices
      ) : null,
      // Show full market structure (limited)
      fullMarket: {
        id: multiMarket.id,
        question: multiMarket.question,
        slug: multiMarket.slug,
        outcomes: multiMarket.outcomes,
        outcomePrices: multiMarket.outcomePrices,
        volume: multiMarket.volume
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: String(error) 
    }, { status: 500 });
  }
}

