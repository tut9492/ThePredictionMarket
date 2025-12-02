# Prediction Market Dashboard - Current Status

## Overview
This is a Next.js 14 prediction market aggregator that displays live market data from Polymarket. The site shows markets in hero cards and list views with category filtering, sorting, and real-time data updates.

## Tech Stack
- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Source**: Polymarket API (`gamma-api.polymarket.com`)
- **Storage**: File-based caching (`data/markets.json`)

## Current Architecture

### API Routes

#### 1. `/api/markets/sync` (GET)
**Purpose**: Fetches and caches market data from Polymarket

**How it works**:
- Uses predefined `MARKET_CONFIGS` array with 20 top markets
- Each config has: `key`, `searchTerms[]`, `category`, `image`
- Searches Polymarket `/events` API (not `/markets`) for matching events
- Uses fuzzy matching: requires 50%+ of search terms to match
- Extracts candidate names from multi-outcome markets intelligently
- Stores results in `data/markets.json` as keyed object

**Data Structure Saved**:
```json
{
  "superBowl": {
    "key": "superBowl",
    "category": "SPORTS",
    "image": "https://polymarket.com/...",
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

**Key Features**:
- ✅ Searches by event title/slug matching search terms
- ✅ Handles multi-outcome markets (extracts team/candidate names)
- ✅ Falls back to Yes/No for binary markets
- ✅ Uses API images when available, falls back to config images
- ✅ Adds referral code `?via=tut` to all URLs
- ✅ Formats volume (K/M/B notation)

#### 2. `/api/markets/data` (GET)
**Purpose**: Returns cached market data to frontend

**How it works**:
- Reads from `data/markets.json`
- Auto-triggers sync if file missing or >1 hour old
- Returns data in format expected by frontend
- Supports category filtering via `?category=` query param

**Response Format**:
```json
{
  "success": true,
  "data": {
    "superBowl": { ... },
    "demNominee2028": { ... }
  },
  "timestamp": "..."
}
```

#### 3. `/api/markets/route.ts` (GET)
**Purpose**: Alternative endpoint for market data (may be unused)

**Status**: Exists but frontend uses `/api/markets/data` instead

### Frontend

#### Main Page (`app/page.tsx`)
**Features**:
- Hero cards (top markets with images)
- List view (table format)
- Category filtering (ALL, POLITICS, SPORTS, CRYPTO, SOCIAL, DATA)
- Sorting (Trending, Volume, Newest)
- Responsive design

**Data Flow**:
1. Fetches from `/api/markets/data`
2. Transforms to match `LANDING_MARKETS` format
3. Filters by selected category (client-side)
4. Sorts by selected option
5. Falls back to static `LANDING_MARKETS` if API fails

**Category Filtering**:
- URL updates: `/?category=crypto`
- Frontend reads category from URL via `useSearchParams()`
- Passes category to API: `/api/markets/data?category=crypto`
- API filters server-side, frontend also filters client-side (redundant but safe)

## Current Data Flow

```
1. User visits site
   ↓
2. Frontend calls /api/markets/data
   ↓
3. API checks data/markets.json age
   ↓
4a. If fresh (<1hr): Return cached data
4b. If stale/missing: Trigger /api/markets/sync in background
   ↓
5. Sync searches Polymarket /events API for each MARKET_CONFIG
   ↓
6. Matches events by search terms (50%+ match required)
   ↓
7. Extracts candidates, prices, volume, images
   ↓
8. Saves to data/markets.json
   ↓
9. Frontend receives data, transforms, displays
```

## Recent Changes

### Latest Sync Route Rewrite
The sync route was completely rewritten to:
- Use `/events` endpoint instead of `/markets`
- Search for specific markets by config rather than fetching all
- Better candidate name extraction from multi-outcome markets
- Improved image handling (API images preferred)

### Previous Issues (Now Fixed)
- ✅ Categories now properly inferred from question text
- ✅ URLs properly constructed with slug field
- ✅ Images fetched from API correctly
- ✅ Outcome names extracted correctly (not just YES/NO)
- ✅ Volume sorting working

## Known Issues / Areas for Improvement

1. **Redundant Filtering**: Frontend filters client-side even though API filters server-side
2. **Static Fallback**: Falls back to hardcoded `LANDING_MARKETS` if API fails (may show stale data)
3. **Search Accuracy**: Market matching relies on search terms - may miss markets if terms don't match exactly
4. **No Error UI**: API errors are logged but user sees fallback data silently
5. **Category Mapping**: Frontend uses uppercase (POLITICS) but API uses title case (Politics) - works but inconsistent

## File Structure

```
app/
├── page.tsx                    # Main landing page (hero cards + list)
├── api/
│   ├── markets/
│   │   ├── sync/route.ts      # Fetches from Polymarket, saves to JSON
│   │   ├── data/route.ts      # Returns cached data to frontend
│   │   └── route.ts           # Alternative endpoint (unused?)
├── (components)/
│   ├── MarketCard.tsx         # Hero card component
│   ├── MarketsTable.tsx       # List view component
│   └── Header.tsx             # Navigation header
data/
└── markets.json               # Cached market data (gitignored)
```

## Environment Setup

**Required**:
- Node.js (v18+)
- npm/yarn

**Run**:
```bash
npm install
npm run dev  # Starts on localhost:3000
```

**Sync Data**:
- Visit: `http://localhost:3000/api/markets/sync`
- Or: Auto-triggers when data is stale

## Polymarket API Integration

**Base URL**: `https://gamma-api.polymarket.com`

**Endpoints Used**:
- `/events` - Search for events by title/slug
  - Params: `active=true`, `closed=false`, `limit=200`, `order=volume`, `ascending=false`

**Data Fields Used**:
- `title` - Event title
- `slug` - URL slug
- `markets[]` - Array of markets within event
- `volume` / `volume24hr` / `volume7d` - Trading volume
- `image` / `icon` - Event images
- `outcomes` - JSON string array of outcome names
- `outcomePrices` - JSON string array of prices

## Testing Checklist

- [ ] `/api/markets/sync` returns success and saves data
- [ ] `/api/markets/data` returns cached markets
- [ ] `/api/markets/data?category=crypto` filters correctly
- [ ] Frontend displays markets correctly
- [ ] Category buttons filter markets
- [ ] Market links open correct Polymarket pages
- [ ] Images load correctly
- [ ] Candidate names show correctly (not just YES/NO)
- [ ] Volume displays correctly (K/M/B format)
- [ ] Referral code `?via=tut` in all URLs

## Next Steps / Recommendations

1. **Unify Category Format**: Use consistent casing (either all uppercase or title case)
2. **Remove Redundant Filtering**: Either filter server-side OR client-side, not both
3. **Add Error Boundaries**: Show user-friendly error messages
4. **Improve Search**: Consider using Polymarket's search API or better matching algorithm
5. **Add Loading States**: Show skeleton loaders while fetching
6. **Add Refresh Button**: Manual refresh option for users
7. **Cache Strategy**: Consider using Next.js cache or Redis instead of file system

## Notes for AI Assistants

- **DO NOT** modify UI components unless explicitly requested
- **DO NOT** change the data structure without updating both sync and data routes
- **DO** preserve the referral code `?via=tut` in all URLs
- **DO** maintain backward compatibility with existing data format
- **DO** test sync route after any changes to ensure it still works
- The sync route is complex - be careful when modifying candidate extraction logic







