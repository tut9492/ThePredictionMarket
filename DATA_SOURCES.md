# Data Sources & 24-Hour Volume Calculation

## Current Implementation

The dashboard currently uses **Dune Analytics** as the primary data source, which provides **weekly aggregated data** for all platforms.

### 24-Hour Volume Calculation

Since Dune provides weekly data (not daily/hourly), the 24-hour volume is **estimated** using the following method:

1. **Get the most recent week's data** from Dune
2. **Divide the weekly volume by 7** to estimate average daily volume
3. This gives an **approximation** of 24-hour volume

**Example:**
- Weekly volume: $2,405,741,131
- Estimated 24h volume: $2,405,741,131 ÷ 7 = **$343,677,304**

### Important Notes

⚠️ **This is an approximation, not exact 24-hour volume:**
- The calculation uses the **average daily volume** from the most recent week
- It does **not** represent the actual last 24 hours
- For accurate 24-hour volume, daily or hourly data would be required

✅ **The calculation is consistent:**
- 7d window: Shows full weekly volume
- 24h window: Shows weekly volume ÷ 7 (estimated daily)
- 30d window: Shows all weeks within 30 days
- All window: Shows all available data

## Data Source: Dune Analytics

- **Query ID**: 5753743
- **Data Type**: Weekly aggregated volume per platform
- **Platforms**: Kalshi, Polymarket, Myriad, Limitless
- **Columns**: 
  - `Week`: Timestamp (weekly)
  - `Notional USD Volume`: Volume in USD
  - `platform`: Platform name

## Future Improvements

To get **accurate 24-hour volume** from public data, we could:

1. **Use Daily/Hourly Dune Queries**: Create or find Dune queries that provide daily/hourly data
2. **Use Public APIs**: Integrate with platform public APIs that provide real-time 24h volume
   - Kalshi: Public API endpoints (if available)
   - Polymarket: GraphQL subgraph (if provides 24h volume)
   - Limitless: Public API (if available)
3. **Use Aggregator Services**: Services like PolyRouter that aggregate 24h volume data

## Current Status

✅ **Working**: 24-hour volume estimation from weekly data  
✅ **Working**: 7-day, 30-day, and all-time windows  
⚠️ **Approximation**: 24-hour volume is estimated, not exact  
📊 **Data Source**: Dune Analytics (weekly data)

