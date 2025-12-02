import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://gamma-api.polymarket.com/events?limit=3&active=true&closed=false',
      { 
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 });
    }

    const events = await response.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    const sampleEvent = events[0];
    const sampleMarket = sampleEvent.markets?.[0];

    return NextResponse.json({
      eventTitle: sampleEvent.title,
      marketStructure: {
        outcomes: sampleMarket?.outcomes,
        outcomePrices: sampleMarket?.outcomePrices,
        outcomesType: typeof sampleMarket?.outcomes,
        outcomesIsArray: Array.isArray(sampleMarket?.outcomes),
        firstOutcome: sampleMarket?.outcomes?.[0],
        firstOutcomeType: typeof sampleMarket?.outcomes?.[0],
        firstOutcomeKeys: sampleMarket?.outcomes?.[0] ? Object.keys(sampleMarket.outcomes[0]) : null,
      },
      rawMarket: sampleMarket,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      message: error.message 
    }, { status: 500 });
  }
}






