# Backend Data Storage Setup

This system fetches live market data from Polymarket API and stores it in a JSON file for the frontend to use.

## How It Works

1. **Sync Endpoint** (`/api/markets/sync`): Fetches all markets from Polymarket API and saves to `data/markets.json`
2. **Data Endpoint** (`/api/markets/data`): Returns the stored market data for the frontend

## Setup Steps

### Step 1: Sync Markets (One-time or Scheduled)

Call the sync endpoint to fetch and store market data:

```bash
# In your browser or terminal
curl http://localhost:3000/api/markets/sync
```

Or visit: `http://localhost:3000/api/markets/sync`

This will:
- Search Polymarket for each configured market
- Extract title, candidates, odds, volume, and URL
- Save to `data/markets.json`

### Step 2: Use the Data

The frontend can fetch from:

```bash
curl http://localhost:3000/api/markets/data
```

Or in your React component:

```typescript
const response = await fetch('/api/markets/data');
const { data } = await response.json();
```

## Market Configuration

Markets are configured in `app/api/markets/sync/route.ts` with:
- `key`: Unique identifier
- `searchTerms`: Terms to search Polymarket API
- `category`: POLITICS, SPORTS, CRYPTO, SOCIAL, DATA
- `image`: Image path for the market

## Data Structure

Stored in `data/markets.json`:

```json
{
  "superBowl": {
    "key": "superBowl",
    "category": "SPORTS",
    "image": "/superbowl.png",
    "polymarket": {
      "title": "SUPER BOWL CHAMPION 2026",
      "candidates": [
        { "name": "PHILADELPHIA", "odds": 15 },
        { "name": "LOS ANGELES R", "odds": 12 }
      ],
      "volume": "554M VOL",
      "url": "https://polymarket.com/event/..."
    },
    "lastUpdated": "2025-11-20T..."
  }
}
```

## Auto-Sync Options

### Option 1: Cron Job (Recommended)

Set up a cron job to sync every hour:

```bash
# Add to crontab (crontab -e)
0 * * * * curl http://localhost:3000/api/markets/sync
```

### Option 2: Vercel Cron (If Deployed)

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/markets/sync",
    "schedule": "0 * * * *"
  }]
}
```

### Option 3: Manual Sync

Just call the endpoint when you need fresh data.

## Updating the Frontend

To use the backend data instead of static data:

1. Fetch from `/api/markets/data` in your component
2. Transform the data to match your `LANDING_MARKETS` structure
3. Use the fetched data instead of static `LANDING_MARKETS`

## Troubleshooting

**No markets found:**
- Check search terms match Polymarket event titles
- Markets might be closed/inactive
- Try broader search terms

**File not found:**
- Run `/api/markets/sync` first
- Check `data/` directory exists
- Check file permissions

**Stale data:**
- Run sync endpoint again
- Check `lastUpdated` timestamp in data file





