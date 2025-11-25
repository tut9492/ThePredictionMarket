/**
 * Market Discovery Script
 * Searches Polymarket and Kalshi for specific markets
 * Run with: node discover-markets.js
 */

const searchTerms = [
  { name: "Super Bowl", keywords: ["super bowl", "champion", "football"] },
  { name: "Democratic Nominee", keywords: ["democratic", "presidential", "nominee", "2028"] },
];

async function searchPolymarket(keywords) {
  try {
    const url = new URL("https://gamma-api.polymarket.com/events");
    url.searchParams.set("active", "true");
    url.searchParams.set("limit", "100");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const events = await response.json();
    
    if (!Array.isArray(events)) {
      return [];
    }

    // Search for events matching keywords
    const matches = events.filter((event) => {
      const title = (event.title || "").toLowerCase();
      const slug = (event.slug || "").toLowerCase();
      const searchText = title + " " + slug;
      
      return keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
    });

    return matches.map((event) => ({
      platform: "Polymarket",
      identifier: event.slug || event.id,
      name: event.title,
      url: `https://polymarket.com/event/${event.slug || event.id}`,
      volume: event.volume24hr || event.volume || 0,
    }));
  } catch (error) {
    console.error("Error searching Polymarket:", error.message);
    return [];
  }
}

async function searchKalshi(keywords) {
  try {
    const url = new URL("https://api.elections.kalshi.com/trade-api/v2/markets");
    url.searchParams.set("status", "open");
    url.searchParams.set("limit", "200");

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.markets || !Array.isArray(data.markets)) {
      return [];
    }

    // Search for markets matching keywords
    const matches = data.markets.filter((market) => {
      const title = (market.title || "").toLowerCase();
      const ticker = (market.ticker || "").toLowerCase();
      const searchText = title + " " + ticker;
      
      return keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
    });

    return matches.map((market) => ({
      platform: "Kalshi",
      identifier: market.ticker,
      name: market.title,
      url: `https://kalshi.com/markets/${market.ticker}`,
      volume: market.volume_24h || market.volume || 0,
    }));
  } catch (error) {
    console.error("Error searching Kalshi:", error.message);
    return [];
  }
}

async function discoverMarkets() {
  console.log("🔍 Discovering markets...\n");

  const results = [];

  for (const searchTerm of searchTerms) {
    console.log(`Searching for: ${searchTerm.name}`);
    
    const [polymarketResults, kalshiResults] = await Promise.all([
      searchPolymarket(searchTerm.keywords),
      searchKalshi(searchTerm.keywords),
    ]);

    results.push(...polymarketResults, ...kalshiResults);
    
    console.log(`  Found ${polymarketResults.length} Polymarket markets`);
    console.log(`  Found ${kalshiResults.length} Kalshi markets\n`);
  }

  // Remove duplicates
  const uniqueResults = results.filter((result, index, self) =>
    index === self.findIndex((r) => r.identifier === result.identifier)
  );

  console.log("📋 Market Configuration:\n");
  console.log("const MARKETS_CONFIG = [");
  
  uniqueResults.forEach((result) => {
    console.log(`  {`);
    console.log(`    platform: '${result.platform}',`);
    console.log(`    identifier: '${result.identifier}',`);
    console.log(`    name: '${result.name}',`);
    console.log(`    type: '${result.platform === 'Polymarket' ? 'sports' : 'politics'}',`);
    console.log(`  },`);
  });
  
  console.log("];\n");

  console.log("✅ Discovery complete!");
  console.log(`Found ${uniqueResults.length} unique markets\n`);

  // Show details
  uniqueResults.forEach((result) => {
    console.log(`${result.platform}: ${result.name}`);
    console.log(`  Identifier: ${result.identifier}`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Volume: $${(result.volume / 100).toLocaleString()}\n`);
  });

  return uniqueResults;
}

// Run if called directly
if (require.main === module) {
  discoverMarkets().catch(console.error);
}

module.exports = { discoverMarkets };

