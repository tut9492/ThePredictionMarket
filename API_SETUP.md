# API Setup Guide

This dashboard supports fetching data directly from Kalshi, Polymarket, and Limitless APIs using **public endpoints that don't require authentication**, with automatic fallback to Dune Analytics.

## ✅ Good News: Public APIs Available!

**Kalshi** and **Polymarket** both offer public API endpoints that don't require API keys for market data. You can use these APIs immediately without any authentication!

## Environment Variables

Add the following to your `.env.local` file:

```bash
# Dune Analytics (required - fallback)
DUNE_API_KEY=your_dune_api_key_here

# Optional: API keys for authenticated endpoints (not required for public data)
# Kalshi API keys (only needed for trading/portfolio access, not market data)
# KALSHI_API_KEY=your_kalshi_api_key
# KALSHI_API_SECRET=your_kalshi_api_secret

# Polymarket API key (only needed for authenticated endpoints)
# POLYMARKET_API_KEY=your_polymarket_api_key

# Limitless API (optional - try public endpoint first)
# LIMITLESS_API_KEY=your_limitless_api_key
# LIMITLESS_API_URL=https://api.limitless.market
```

## Public API Endpoints

### Kalshi
- **Public Endpoint**: `https://api.kalshi.com/trade-api/v2`
- **No Authentication Required**: Public endpoints for market data don't require API keys
- **Documentation**: [Kalshi API Docs](https://docs.kalshi.com)
- **Note**: API keys are only needed for authenticated endpoints (trading, portfolio)

### Polymarket
- **Public Endpoint**: GraphQL Subgraph at `https://api.thegraph.com/subgraphs/name/polymarket`
- **No Authentication Required**: Public APIs for market data
- **Documentation**: [Polymarket API Docs](https://docs.polymarket.com)
- **Alternative**: Community SDK at [polymarket-data.com](https://polymarket-data.com)

### Limitless
- **Public Endpoint**: Try public endpoints first (may vary)
- **Documentation**: Check Limitless documentation for public endpoints
- **Note**: API keys may be optional depending on endpoint

## Getting API Keys (Optional - Only for Authenticated Endpoints)

### Kalshi (Optional)
1. Visit [Kalshi API Documentation](https://docs.kalshi.com)
2. Sign up for a Kalshi account
3. Generate API keys from Account Settings → API Keys
4. **Note**: Only needed for trading/portfolio access, not market data

### Polymarket (Optional)
1. Visit [Polymarket API Documentation](https://docs.polymarket.com)
2. Create a builder account
3. Generate API keys from Builder Profile → Builder Keys
4. **Note**: Only needed for authenticated endpoints, not public market data

### Limitless (Optional)
1. Check Limitless API documentation
2. Generate API keys if required for your use case

## How It Works

1. **Direct APIs First**: If API keys are configured, the system will try to fetch data directly from each platform's API
2. **Automatic Fallback**: If direct APIs fail or aren't configured, the system automatically falls back to Dune Analytics
3. **Hybrid Mode**: You can use direct APIs for some platforms (e.g., Kalshi, Polymarket) and Dune for others (e.g., Myriad)

## API Endpoints

The current implementation includes placeholder endpoints. You'll need to:

1. **Update API endpoints** in:
   - `lib/api/kalshi.ts` - Update the base URL and endpoint paths
   - `lib/api/polymarket.ts` - Update the base URL and endpoint paths
   - `lib/api/limitless.ts` - Update the base URL and endpoint paths

2. **Adjust data transformation** functions to match each API's response format

3. **Test each API** individually before enabling in production

## Testing

You can test the API integration by:

1. Adding your API keys to `.env.local`
2. Restarting the development server
3. Checking the console logs for API fetch status
4. Using the `?source=direct` query parameter to force direct API usage

## Current Status

- ✅ API client structure created
- ✅ Unified data fetching interface
- ✅ Automatic fallback to Dune
- ⚠️ API endpoints need to be updated based on actual API documentation
- ⚠️ Data transformation functions need to match actual API responses

