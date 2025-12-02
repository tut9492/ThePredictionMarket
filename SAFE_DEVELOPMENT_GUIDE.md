# Safe Development Guide - Adding New Markets

## 🛡️ Protection Strategy

Before making ANY changes to add new markets/platforms, follow these steps:

### Step 1: Create a Branch from Stable Template

```bash
# Create a new branch from the stable checkpoint
git checkout -b feature/add-kalshi template-polymarket-stable

# Or if you're already on main:
git checkout -b feature/add-kalshi
git reset --hard template-polymarket-stable
```

### Step 2: Test Current Functionality

Before adding anything new, verify everything works:
1. ✅ Hero cards display correctly
2. ✅ List view displays correctly  
3. ✅ Badges overlap properly (not cropped)
4. ✅ Category filtering works
5. ✅ Sorting works
6. ✅ API calls are optimized

### Step 3: Add New Platform (Example: Kalshi)

#### 3.1 Create Platform Adapter
```bash
# Create directory structure
mkdir -p lib/platforms/kalshi
touch lib/platforms/kalshi/adapter.ts
touch lib/platforms/kalshi/index.ts
```

#### 3.2 Implement Adapter
Copy the structure from `lib/platforms/polymarket/adapter.ts` and adapt for Kalshi.

#### 3.3 Register Platform
**ONLY modify these two files:**
- `app/api/markets/sync/route.ts` - Add `new KalshiAdapter()` to adapters array
- `app/api/markets/data/route.ts` - Add `new KalshiAdapter()` to adapters array

**DO NOT modify:**
- ❌ `app/page.tsx` (unless adding UI features)
- ❌ `lib/storage/kv.ts` (storage is platform-agnostic)
- ❌ `lib/utils/*` (shared utilities)

### Step 4: Test Incrementally

After each change:
1. Test locally: `npm run dev`
2. Check TypeScript: `npm run build`
3. Verify API calls are still optimized
4. Test UI still works

### Step 5: Commit Frequently

```bash
# Commit after each working change
git add .
git commit -m "feat: Add Kalshi adapter structure"
git commit -m "feat: Register Kalshi in sync route"
git commit -m "feat: Register Kalshi in data route"
```

### Step 6: If Something Breaks

**STOP immediately and:**

```bash
# Option 1: Revert last commit
git reset --hard HEAD~1

# Option 2: Go back to stable template
git reset --hard template-polymarket-stable

# Option 3: Compare what changed
git diff template-polymarket-stable HEAD
```

## 🚨 Critical Files - Handle with Care

These files are the core of the template. Changes here can break everything:

### ⚠️ HIGH RISK
- `app/page.tsx` - Main UI component
- `app/api/markets/data/route.ts` - Data endpoint logic
- `app/api/markets/sync/route.ts` - Sync endpoint logic

### ✅ SAFE TO MODIFY
- `lib/platforms/polymarket/adapter.ts` - Add new market configs
- `lib/platforms/kalshi/adapter.ts` - New platform (doesn't exist yet)
- `lib/utils/*` - Shared utilities (well-tested)

## 📋 Pre-Deployment Checklist

Before pushing to main:

- [ ] All tests pass locally
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] API calls are still optimized (check Network tab)
- [ ] Badges still display correctly
- [ ] Category filtering still works
- [ ] Sorting still works
- [ ] KV storage still works (if applicable)
- [ ] Cron jobs still scheduled correctly

## 🔄 Rollback Plan

If deployment breaks:

```bash
# Quick rollback to stable template
git checkout template-polymarket-stable
git branch -D main  # Delete broken main (be careful!)
git checkout -b main template-polymarket-stable
git push origin main --force  # Force push (only if necessary!)
```

## 💡 Best Practices

1. **One Change at a Time**: Don't modify multiple files simultaneously
2. **Test After Each Change**: Verify functionality before moving on
3. **Use Branches**: Never work directly on main
4. **Commit Often**: Small, focused commits are easier to debug
5. **Document Changes**: Update docs as you go
6. **Ask for Help**: If unsure, check the template or ask

## 🎯 Adding New Markets (Same Platform)

If adding markets to existing Polymarket platform:

1. Edit `lib/platforms/polymarket/adapter.ts`
2. Add new config to `configs` array:
   ```typescript
   {
     key: "newMarket",
     searchTerms: ["term1", "term2"],
     category: "SPORTS",
     image: "/image.png",
   }
   ```
3. Test locally
4. Commit and push

**This is SAFE** - won't break existing functionality.

## 🎯 Adding New Platform (Kalshi)

Follow the modular architecture:
1. Create adapter following Polymarket pattern
2. Register in sync/data routes
3. Test thoroughly
4. Deploy incrementally

---

**Remember**: The template is your safety net. Use branches, test frequently, and rollback if needed!


