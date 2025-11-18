# Deployment Guide

## 🚀 Recommended: Deploy to Vercel (Free & Easy)

Vercel is made by the Next.js team and offers free hosting with automatic deployments.

### Step 1: Deploy to Vercel

1. **Go to**: https://vercel.com
2. **Sign up** with your GitHub account
3. **Click**: "Add New Project"
4. **Import** your repository: `tut9492/ThePredictionMarket`
5. **Configure**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto)
   - Output Directory: `.next` (auto)
6. **Click**: "Deploy"

Your site will be live in ~2 minutes at: `https://thepredictionmarket.vercel.app`

### Step 2: Connect Your GoDaddy Domain

1. **In Vercel Dashboard**: Go to your project → Settings → Domains
2. **Add Domain**: Enter your GoDaddy domain (e.g., `yourdomain.com`)
3. **Update DNS in GoDaddy**:
   - Log into GoDaddy
   - Go to DNS Management
   - Add/Update these records:
     - **Type A**: `@` → `76.76.21.21` (Vercel IP)
     - **Type CNAME**: `www` → `cname.vercel-dns.com`
   - Or use Vercel's nameservers (recommended):
     - Change nameservers to Vercel's (shown in Vercel dashboard)

### Step 3: Environment Variables (If Needed)

If you have API keys:
1. In Vercel: Settings → Environment Variables
2. Add any keys from your `.env.local` file
3. Redeploy

---

## Alternative: Deploy to Netlify

1. **Go to**: https://app.netlify.com
2. **Sign up** with GitHub
3. **New site from Git** → Select your repository
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. **Deploy**

---

## Using GoDaddy Hosting Directly (Not Recommended)

GoDaddy shared hosting doesn't support Next.js well. Options:

### Option A: GoDaddy cPanel (Limited)
- Only works for static exports
- Requires: `next export` (deprecated in Next.js 13+)
- Not ideal for your app

### Option B: GoDaddy VPS/Dedicated Server
- More expensive
- Requires server management
- Can run Node.js

**Recommendation**: Use Vercel (free) and point your GoDaddy domain to it.

---

## Quick Deploy Commands

### Vercel CLI (Alternative Method)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd "/Users/shanemacinnes/Desktop/Prediction Market"
vercel

# Follow prompts:
# - Link to existing project or create new
# - Deploy to production
```

---

## Post-Deployment Checklist

- [ ] Site is accessible
- [ ] Domain is connected (if using custom domain)
- [ ] Environment variables are set
- [ ] API routes are working
- [ ] Images are loading
- [ ] Test on mobile devices

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

