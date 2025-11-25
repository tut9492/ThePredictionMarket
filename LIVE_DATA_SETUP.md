# Live Market Data Setup Guide

This guide explains how to use the live market data fetching system.

## Files Created

1. **`discover-markets.js`** - Script to discover market identifiers
2. **`app/api/markets/update/route.ts`** - API endpoint to fetch live market data
3. **`app/(components)/MarketsTable.tsx`** - React component to display live data

## Quick Start

### Step 1: Test the API Route

Start your dev server:
```bash
npm run dev
```

Test the API endpoint:
```bash
curl http://localhost:3000/api/markets/update
```

You should see JSON with market data like:
```json
{
  "success": true,
  "data": [
    {
      "platform": "Kalshi",
      "marketId": "kxsb-26",
      "marketName": "Pro Football Champion?",
      "odds": "PHILADELPHIA vs LOS ANGELES R",
      "yes": 15,
      "no": 85,
      "volume": "34.5M",
      "rawVolume": 34500000,
      "url": "https://kalshi.com/markets/kxsb-26"
    }
  ],
  "timestamp": "2025-11-20T10:45:00Z"
}
```

### Step 2: Use MarketsTable Component

You can use the `MarketsTable` component in two ways:

#### Option A: Replace List View (Recommended)

Update `app/page.tsx` to use live data in list view:

```typescript
import MarketsTable from "@/app/(components)/MarketsTable";

// In your list view section:
{viewMode === "list" && (
  <MarketsTable />
)}
```

#### Option B: Add as Separate Section

Add it anywhere in your page:

```typescript
import MarketsTable from "@/app/(components)/MarketsTable";

export default function Page() {
  return (
    <div>
      <h1>Live Markets</h1>
      <MarketsTable />
    </div>
  );
}
```

## Finding Market Identifiers

### Using the Discovery Script

Run the discovery script to find market identifiers:

```bash
node discover-markets.js
```

This will search both Polymarket and Kalshi for markets matching your keywords and output configuration code.

### Manual Extraction

**Polymarket:**
- URL: `https://polymarket.com/event/super-bowl-champion-2026-731`
- Identifier: `super-bowl-champion-2026-731` (the slug after `/event/`)

**Kalshi:**
- URL: `https://kalshi.com/markets/kxsb/super-bowl/kxsb-26`
- Identifier: `kxsb-26` (the last segment of the URL path)

## Updating Market Identifiers

Edit `app/api/markets/update/route.ts` and update the `MARKETS_CONFIG` array:

```typescript
const MARKETS_CONFIG = [
  {
    platform: 'Kalshi',
    identifier: 'YOUR-TICKER-HERE',
    type: 'sports',
  },
  {
    platform: 'Polymarket',
    identifier: 'your-slug-here',
    type: 'sports',
  },
  // Add more markets...
];
```

## Features

- ✅ Auto-refreshes every 30 seconds
- ✅ Manual refresh button
- ✅ Loading states
- ✅ Error handling
- ✅ Clickable rows (opens market URL)
- ✅ Platform logos with badges
- ✅ Formatted volume (e.g., "34.5M")
- ✅ Yes/No odds in cents

## Troubleshooting

### "Market not found" errors

1. Verify the identifier is correct (run discovery script)
2. Check that the market is still active/open
3. Test the API endpoint directly with `curl`

### No data showing

1. Check browser console for errors
2. Verify API route is accessible: `curl http://localhost:3000/api/markets/update`
3. Ensure market identifiers are correct in `MARKETS_CONFIG`

### Old data showing

- The table auto-refreshes every 30 seconds
- Click "Refresh Data" button for immediate update
- Check `lastUpdate` timestamp in the header

## API Response Format

The API returns:

```typescript
{
  success: boolean;
  data: MarketData[];
  timestamp: string;
  error?: string;
}

interface MarketData {
  platform: string;
  marketId: string;
  marketName: string;
  odds: string;
  yes: number;        // Price in cents (0-100)
  no: number;         // Price in cents (0-100)
  volume: string;     // Formatted (e.g., "34.5M")
  rawVolume: number;  // Raw number
  url?: string;       // Market URL
}
```

## Next Steps

1. Test the API endpoint
2. Integrate `MarketsTable` into your page
3. Update market identifiers as needed
4. Customize styling if desired




