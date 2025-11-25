# Landing Page UI & Code Review

## 📋 Current State Overview

**File:** `app/page.tsx`  
**Status:** ✅ Working  
**Dev Server:** Running on `http://localhost:3000`

---

## 🎨 UI Structure

### Header Section
- **Logo:** Site Logo (left, 200px offset)
- **Title:** "THE PREDICTION MARKET" (centered, large, uppercase)
- **Subtitle:** "YOUR HOME FOR EVERYTHING PREDICTION MARKETS" (centered, small, gray)
- **Login Button:** Black button with X/Twitter icon (right, 200px offset)
- **Navigation:** Category pills (ALL, 🗳️ POLITICS, 🏀 SPORTS, ₿ CRYPTO, 💬 SOCIAL, 📊 DATA)

### Main Content Area
- **View Toggle:** Cards/List buttons (top right, white background with black border)
- **Cards View:** Side-by-side market cards (Polymarket + Kalshi for each market)
- **List View:** Live data table with MarketsTable component

### Footer
- **Fixed Position:** Bottom right corner
- **Content:** tut™ logo linking to Twitter/X (`https://x.com/Tuteth_`)
- **Hover Effect:** Scale up on hover

---

## 📊 Current Markets Data

### Market 1: Super Bowl
- **Category:** SPORTS
- **Image:** `/superbowl.png`
- **Polymarket:**
  - Title: "SUPER BOWL CHAMPION 2026"
  - Candidates: PHILADELPHIA (14%), LOS ANGELES R (13%)
  - Volume: 543M VOL
  - URL: `https://polymarket.com/event/super-bowl-champion-2026-731`
- **Kalshi:**
  - Title: "PRO FOOTBALL CHAMPION?"
  - Candidates: PHILADELPHIA (15%), LOS ANGELES R (13%)
  - Volume: 34.5M VOL
  - URL: `https://kalshi.com/markets/kxsb/super-bowl/kxsb-26`

### Market 2: Democratic Nominee
- **Category:** POLITICS
- **Image:** `/democrats.jpg`
- **Polymarket:**
  - Title: "DEMOCRATIC PRESIDENTIAL NOMINEE 2028"
  - Candidates: GAVIN NEWSOM (37%), ALEXANDRIA O. (10%)
  - Volume: 309M VOL
  - URL: `https://polymarket.com/event/democratic-presidential-nominee-2028`
- **Kalshi:**
  - Title: "DEMOCRATIC PRESIDENTIAL NOMINEE IN 2028?"
  - Candidates: GAVIN NEWSOM (37%), ALEXANDRIA OCASIO-CORTEZ (10%)
  - Volume: 28.3M VOL
  - URL: `https://kalshi.com/markets/kxpresnomd/democratic-primary-winner/kxpresnomd-28`

---

## 🎯 Key Features

### 1. View Modes
- **Cards View:** Side-by-side market cards with images
- **List View:** Live data table (fetches from `/api/markets/update`)

### 2. Market Cards
- Split layout: Info (left) + Image (right)
- Shows candidates with odds percentages
- YES/NO buttons (non-functional, prevent default)
- Platform logo and volume at bottom
- Clickable (opens market URL in new tab)

### 3. Live Data Integration
- `MarketsTable` component fetches live data
- Auto-refreshes every 30 seconds
- Shows platform logos, odds, volume
- Clickable rows (open market URLs)

---

## 📁 Code Files

### Main Page: `app/page.tsx`
```typescript
"use client";

import { useState, Suspense } from "react";
import { MarketCard } from "@/app/(components)/MarketCard";
import { Header } from "@/app/(components)/Header";
import MarketsTable from "@/app/(components)/MarketsTable";

type CategoryKey = "ALL" | "POLITICS" | "SPORTS" | "CRYPTO" | "SOCIAL" | "DATA";

const LANDING_MARKETS = {
  superBowl: { /* ... */ },
  demNominee: { /* ... */ },
};

function HomeContent() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  
  // ... component code
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
```

### Header Component: `app/(components)/Header.tsx`
- Sticky header with logo, title, login button
- Category navigation with query parameters
- Responsive layout with fixed offsets

### Market Card Component: `app/(components)/MarketCard.tsx`
- Split card layout (info + image)
- Candidate display with odds
- Platform logo and volume
- Clickable link to market

### Markets Table Component: `app/(components)/MarketsTable.tsx`
- Fetches live data from `/api/markets/update`
- Auto-refresh every 30 seconds
- Table layout with platform logos
- Shows odds, volume, market names

---

## 🎨 Design System

### Colors
- **Background:** `#FAFAF6` (off-white)
- **Primary:** Black (`#000000`)
- **Borders:** `#E5E5E5` (light gray)
- **Text:** Black, gray-600, gray-700
- **Buttons:** Green (YES), Red (NO)
- **Platform Badges:** Teal (Kalshi), Blue (Polymarket)

### Typography
- **Font:** Aboreto (custom font)
- **Title:** 3xl, light, uppercase, tracking-wide
- **Subtitle:** sm, light, uppercase, gray-600
- **Market Titles:** lg, semibold, uppercase
- **Candidates:** sm, medium, uppercase

### Spacing
- **Container:** max-w-7xl, mx-auto, px-6, py-12
- **Card Gap:** gap-8, mb-12
- **Padding:** p-6 (cards), px-8 py-6 (table rows)

---

## 🔧 Technical Details

### State Management
- `selectedCategory`: Currently not filtering (shows all markets)
- `viewMode`: Toggles between "cards" and "list"

### Data Flow
1. **Static Data:** `LANDING_MARKETS` object (hardcoded)
2. **Live Data:** `MarketsTable` fetches from API route
3. **API Route:** `/api/markets/update` (fetches from Polymarket & Kalshi)

### Routing
- Category navigation uses query parameters (`/?category=politics`)
- Data page: `/data`
- All other routes: `/`

---

## 🐛 Known Issues / Notes

1. **Category Filtering:** `selectedCategory` state exists but doesn't filter markets
2. **Static Data:** Cards view uses hardcoded `LANDING_MARKETS`
3. **Live Data:** List view uses `MarketsTable` with live API data
4. **YES/NO Buttons:** Non-functional (prevent default, no action)
5. **Old List View:** Commented out but still in code (lines 140-297)

---

## 📝 Recommendations for Review

### Potential Improvements
1. **Category Filtering:** Implement actual filtering based on `selectedCategory`
2. **Live Data in Cards:** Option to use live data in cards view too
3. **YES/NO Functionality:** Connect buttons to actual trading (if needed)
4. **Loading States:** Better loading indicators
5. **Error Handling:** Better error messages for API failures
6. **Responsive Design:** Check mobile/tablet layouts
7. **Accessibility:** Add ARIA labels, keyboard navigation

### Code Cleanup
1. Remove old static list view code (lines 140-297)
2. Extract `LANDING_MARKETS` to separate config file
3. Add TypeScript types for market data
4. Add error boundaries

---

## 🚀 Current Functionality

✅ **Working:**
- Page loads and displays markets
- Cards view shows static data
- List view shows live data (if API works)
- View toggle switches between modes
- Navigation links work
- Footer link works

⚠️ **Needs Testing:**
- Live data API endpoint
- Market identifiers (may be outdated)
- Category filtering
- Responsive design

---

## 📸 Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]    THE PREDICTION MARKET    [Login]            │
│            YOUR HOME FOR...                             │
│  [ALL] [POLITICS] [SPORTS] [CRYPTO] [SOCIAL] [DATA]    │
├─────────────────────────────────────────────────────────┤
│                                    [Cards] [List]        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Market Card  │  │ Market Card  │                    │
│  │ (Polymarket) │  │   (Kalshi)   │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Market Card  │  │ Market Card  │                    │
│  │ (Polymarket) │  │   (Kalshi)   │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                                    [tut™ Logo]
```

---

## 📞 Questions for Review

1. Should category filtering be implemented?
2. Should cards view also use live data?
3. Are the market identifiers still valid?
4. Should YES/NO buttons be functional?
5. Is the design responsive enough?
6. Should we add more markets to `LANDING_MARKETS`?

---

**Last Updated:** November 20, 2025  
**Status:** ✅ Functional, needs improvements




