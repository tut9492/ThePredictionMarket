# The Prediction Market Dashboard

## 🎯 Project Overview
A comprehensive analytics dashboard that aggregates and compares data across the top prediction market platforms (Polymarket and Kalshi). Provides real-time volume metrics, user statistics, and market comparisons to help traders make informed decisions.

## 🚀 Live Demo
[Add your deployed link here - Vercel/Netlify]

## 📹 Demo Video
[Add your 5-minute demo video link here]

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Custom React components with inline styles
- **Deployment:** Vercel

## ✨ Key Features
- Side-by-side platform comparison (Polymarket vs Kalshi)
- Real-time volume and user metrics
- Category filtering (Politics, Sports, Crypto, Social, Data)
- ATH (All-Time High) tracking with visual overlays
- Responsive design optimized for all screen sizes
- Clean, minimal UI optimized for data visualization
- Direct links to trade on respective platforms

## 📊 Core Functionality
1. **Data Aggregation:** Pulls data from Polymarket and Kalshi APIs
2. **Visual Analytics:** Interactive vertical bar charts showing volume and user comparisons
3. **Historical Tracking:** ATH indicators show peak performance vs current metrics
4. **Category Navigation:** Filter markets by type (Politics, Sports, Crypto, Social, Data)
5. **Market Cards:** Side-by-side comparison cards with direct links to trade

## 💰 Revenue Model
[You'll write this section]

## 🎯 Target Users
- Prediction market traders seeking cross-platform insights
- Market researchers analyzing prediction market trends
- Crypto/DeFi enthusiasts tracking market volumes
- Media/analysts covering prediction market industry

## 📁 Project Structure
```
/app
  /page.tsx              # Landing page with market cards
  /data/page.tsx         # Analytics dashboard with charts
  /(components)
    /Header.tsx          # Navigation header with category filters
    /MarketCard.tsx      # Individual market display cards
    /CategoryNav.tsx     # Category navigation component
  /api
    /marketshare         # Market share data endpoint
    /top-markets         # Top markets aggregation
    /kalshi-events-volume # Kalshi volume data
/lib
  /api                   # API clients for platforms
/public
  /prediction-market
    /market-logos        # Platform logos
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone [your-repo-url]

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 🧪 Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 📈 Future Enhancements
- Real-time WebSocket data feeds
- User authentication and saved preferences
- Price alerts and notifications
- Historical data charting
- Mobile app version
- API endpoint for developers
- Additional platform integrations

## 👥 Team
[You'll write this section - 150 words about your team]

## 📝 License
MIT License

## 🔗 Links
- [Polymarket](https://polymarket.com)
- [Kalshi](https://kalshi.com)
- [Project Documentation](link-to-docs)

---

Built for [Hackathon Name] - Prediction Markets Track
