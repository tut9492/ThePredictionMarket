# Prompt for Claude: Prediction Market Dashboard Status

## Context
I'm working on a Next.js 14 prediction market aggregator that displays live Polymarket data. Here's the current state:

## What This Site Does
- Displays prediction markets in hero cards and list views
- Shows live data from Polymarket API
- Supports category filtering (Politics, Sports, Crypto, Social, Data)
- Sorts by trending, volume, or newest
- Adds referral codes to all Polymarket links

## Current Architecture

### Data Flow
1. **Sync Route** (`/api/markets/sync`): 
   - Uses predefined `MARKET_CONFIGS` array (20 markets)
   - Searches Polymarket `/events` API by search terms
   - Matches events requiring 50%+ term matches
   - Extracts candidate names from multi-outcome markets
   - Saves to `data/markets.json` as keyed object

2. **Data Route** (`/api/markets/data`):
   - Reads cached `data/markets.json`
   - Auto-syncs if data >1 hour old
   - Supports `?category=` filtering
   - Returns data in frontend format

3. **Frontend** (`app/page.tsx`):
   - Fetches from `/api/markets/data`
   - Transforms to match component format
   - Filters by category (both server and client-side)
   - Falls back to static data if API fails

### Key Files
- `app/api/markets/sync/route.ts` - Fetches from Polymarket, saves to JSON
- `app/api/markets/data/route.ts` - Returns cached data
- `app/page.tsx` - Main landing page
- `data/markets.json` - Cached market data (file-based)

### Data Structure
```json
{
  "superBowl": {
    "key": "superBowl",
    "category": "SPORTS",
    "image": "https://...",
    "polymarket": {
      "title": "Super Bowl Champion 2026",
      "candidates": [
        { "name": "KANSAS CITY CHIEFS", "odds": 15 },
        { "name": "PHILADELPHIA EAGLES", "odds": 12 }
      ],
      "volume": "554M VOL",
      "url": "https://polymarket.com/event/...?via=tut"
    },
    "lastUpdated": "2025-01-XX..."
  }
}
```

## Recent Changes
- Sync route rewritten to use `/events` endpoint
- Better candidate name extraction from multi-outcome markets
- Improved image handling (API images preferred)
- Category filtering working (server + client-side)

## Known Issues
1. Redundant filtering (both server and client-side)
2. Category format inconsistency (POLITICS vs Politics)
3. Static fallback may show stale data
4. No user-facing error messages

## Important Constraints
- **DO NOT** modify UI components unless explicitly requested
- **DO NOT** change data structure without updating both routes
- **DO** preserve referral code `?via=tut` in all URLs
- **DO** maintain backward compatibility
- **DO** test sync route after changes

## Tech Stack
- Next.js 14.2.5 (App Router)
- TypeScript
- Tailwind CSS
- Polymarket API (`gamma-api.polymarket.com`)

## When Helping Me
- Understand the sync route is complex - be careful with candidate extraction logic
- The frontend expects specific data format - maintain compatibility
- Test sync route after any API changes
- Preserve existing functionality unless explicitly changing it







