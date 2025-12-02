# Cron Jobs Setup Guide

This project uses Vercel Cron Jobs to sync market data **3 times per day** instead of on every page load.

## Schedule

The sync runs at:
- **8:00 AM EST** (1:00 PM UTC)
- **12:00 PM EST** (5:00 PM UTC)
- **8:00 PM EST** (1:00 AM UTC next day)

## How It Works

1. **Vercel Cron Jobs** automatically call `/api/markets/sync` at the scheduled times
2. **Sync Route** fetches fresh data from Polymarket API (1 API call)
3. **Data is stored** in Vercel KV (Redis) for fast retrieval
4. **Data Route** reads from KV instead of calling Polymarket API

## Setup Steps

### 1. Install Vercel KV

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database**
3. Select **KV** (Redis)
4. Create a new KV database
5. Copy the connection details

### 2. Add Environment Variables

Add these to your Vercel project settings (or `.env.local` for local dev):

```bash
# Vercel KV
KV_REST_API_URL=https://your-kv-instance.vercel.app
KV_REST_API_TOKEN=your-token-here
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token-here
```

### 3. Deploy

The cron jobs are configured in `vercel.json` and will automatically activate when deployed to Vercel.

### 4. Verify Cron Jobs

After deployment:
1. Go to Vercel Dashboard → Your Project → **Cron Jobs**
2. You should see 3 scheduled jobs
3. Check the logs to verify they're running successfully

## API Call Reduction

**Before:** 
- Every page load = 1 API call to Polymarket
- 100 page loads/day = 100 API calls

**After:**
- 3 scheduled syncs/day = 3 API calls to Polymarket
- All page loads read from KV = 0 API calls
- **97% reduction in API calls!**

## Manual Sync

You can manually trigger a sync by visiting:
```
https://your-site.vercel.app/api/markets/sync
```

## Troubleshooting

### KV Not Available
If KV is not configured, the system will:
1. Try to read from file system (local dev)
2. Fall back to fetching from API (should be rare)

### Cron Jobs Not Running
- Check Vercel Dashboard → Cron Jobs for errors
- Verify `vercel.json` is committed and deployed
- Check Vercel logs for sync route errors

### Stale Data
- Check KV storage in Vercel Dashboard
- Manually trigger sync: `/api/markets/sync`
- Verify cron jobs are running (check logs)

## Time Zone Notes

The cron schedule uses UTC times:
- EST is UTC-5 (winter)
- EDT is UTC-4 (summer/daylight saving)

If you need to adjust for daylight saving time, update the cron schedules in `vercel.json`.


