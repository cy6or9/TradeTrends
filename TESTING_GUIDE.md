# Testing Click Tracking & Analytics Locally

## Overview
This guide explains how to test the new click tracking, analytics dashboard, and trends features in your Codespaces environment using `netlify dev`.

## New Features Added

### 1. **Click Tracking System (`/go/*`)**
- Intercepts all deal clicks through `/go/amazon?id=<deal-id>` or `/go/travel?id=<deal-id>`
- Logs: timestamp, deal ID, network, referrer, user agent, IP hash (privacy-safe)
- Redirects to actual affiliate URL
- Rate limiting: 30 clicks per 10 minutes per IP

### 2. **Analytics Dashboard (`/admin/dashboard.html`)**
- Total clicks (7-day window)
- Clicks by network (Amazon vs Travel)
- Top 10 clicked deals
- Daily breakdown
- Estimated earnings calculator

### 3. **Trends Page (`/admin/trends.html`)**
- Displays cached trending products from Amazon
- Shows travel trending data
- Admin-only refresh button (respects 6-hour cache)
- Minimal scraping (title extraction only)

### 4. **Storage Adapter**
- **Production**: Uses Netlify Blobs (@netlify/blobs)
- **Local Dev**: Uses file-based storage in `.netlify/state/`
- Auto-detects environment

## Local Testing Steps

### Setup (One-Time)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Login to Netlify CLI**:
   ```bash
   npx netlify login
   ```
   This opens a browser to authorize.

3. **Link to your Netlify site**:
   ```bash
   npx netlify link
   ```
   Choose "Use current git remote origin".

4. **Set environment variable (optional)**:
   ```bash
   # In .netlify/.env or use Netlify UI to set TT_SALT
   echo "TT_SALT=your-random-salt-string" >> .netlify/.env
   ```

### Start Dev Server

```bash
npm run dev
```

Server starts at: **http://localhost:8888**

### Testing Workflow

#### Test 1: Click Tracking

1. Visit: `http://localhost:8888/`
2. Click any deal card (e.g., "View on Amazon")
3. You should be redirected through `/go/amazon?id=...` to the actual affiliate URL
4. Check console logs in terminal running `netlify dev`:
   ```
   ◈ Request from ::1: GET /go/amazon?id=amz-xyz
   ◈ Using file-based storage
   ◈ Click logged: {ts, id, network, ipHash}
   ```
5. Check file created: `.netlify/state/tt_clicks.json`
   ```bash
   cat .netlify/state/tt_clicks.json
   ```
   Should show click events array.

#### Test 2: Analytics Dashboard

1. Visit: `http://localhost:8888/admin/dashboard.html`
2. Login with Netlify Identity (if not already logged in)
3. Dashboard loads and calls `/api/analytics?days=7`
4. Should display:
   - Total clicks (from your test clicks)
   - Breakdown by network
   - Top clicked deals
   - Daily chart
5. Make more clicks on public site, refresh dashboard to see updates

#### Test 3: Trends Page

1. Visit: `http://localhost:8888/admin/trends.html`
2. Login if needed
3. Initial load may show "No trends data available"
4. Click **"Refresh Trends"** button
5. Watch terminal logs:
   ```
   ◈ Request from ::1: POST /api/refresh-trends
   ◈ Fetching Amazon Movers & Shakers...
   ◈ Fetching Amazon Best Sellers...
   ```
6. After ~10 seconds, trends data appears
7. Check cache file:
   ```bash
   cat .netlify/state/tt_trends.json
   ```
8. Try refreshing again immediately - should see message: "Cache still valid"
9. To force refresh: manually edit `tt_trends.json` and set `generatedAt` to 7 hours ago, then click refresh

#### Test 4: Rate Limiting

1. Write a simple script to make 31 clicks quickly:
   ```bash
   for i in {1..31}; do
     curl -L "http://localhost:8888/go/amazon?id=test-deal-$i"
   done
   ```
2. After 30 clicks, you should get:
   ```
   429 Too Many Requests
   Too many requests. Please try again later.
   ```
3. Check rate limit storage:
   ```bash
   cat .netlify/state/rate_limits.json
   ```

#### Test 5: Admin-Only Access

1. Visit trends page while logged OUT:
   - GET `/api/trends` works (public read)
2. Try clicking "Refresh Trends" while logged out:
   - POST `/api/refresh-trends` returns 403 Forbidden
3. Login with non-admin account (if available):
   - Should also get 403
4. Login with admin account:
   - Refresh works

#### Test 6: CMS Integration

1. Visit: `http://localhost:8888/admin/`
2. Should see updated header with:
   - **Dashboard** button
   - **Trends** button
   - **CMS** button (stays on current page)
3. Click through navigation - all pages should match dark theme
4. CMS should still work normally (no React errors)

## File Structure

```
netlify/
  functions/
    go.js              # Click tracking redirect
    api.js             # Analytics & trends API
    lib/
      storage.js       # Storage adapter (blobs/file)
      trends.js        # Trends fetcher

public/
  admin/
    dashboard.html     # Analytics dashboard (NEW)
    trends.html        # Trends page (NEW)
    index.html         # CMS (updated header)
  js/
    render.js          # Updated to use /go links

.netlify/
  state/               # Local storage (gitignored)
    tt_clicks.json     # Click events
    tt_trends.json     # Cached trends
    rate_limits.json   # Rate limit tracking
```

## API Endpoints

### `GET /api/analytics?days=7`
- Returns click statistics
- Public (no auth required)
- Query params: `days` (default: 7)

### `GET /api/trends`
- Returns cached trends data
- Public read access
- Returns stale data with warning if cache > 6 hours

### `POST /api/refresh-trends?force=true`
- Refreshes trends cache
- **Admin-only** (requires JWT token)
- Query params: `force=true` to bypass cache check
- Respects 6-hour minimum cache age

### `GET /go/:network?id=<deal-id>`
- Logs click and redirects
- Rate limited: 30 clicks / 10 min per IP
- Networks: `amazon`, `travel`

## Debugging Tips

### Check Function Logs
```bash
# Terminal running netlify dev shows all function logs
◈ Request from ::1: GET /api/analytics
◈ Using file-based storage
◈ Returning 200
```

### Inspect Storage Files
```bash
# Click data
cat .netlify/state/tt_clicks.json | jq '.clicks | length'

# Trends cache
cat .netlify/state/tt_trends.json | jq '.generatedAt'

# Rate limits
cat .netlify/state/rate_limits.json | jq 'keys | length'
```

### Clear Storage
```bash
rm -rf .netlify/state/*.json
```

### Test Without Auth
```bash
# Analytics (public)
curl http://localhost:8888/api/analytics

# Trends (public read)
curl http://localhost:8888/api/trends

# Refresh trends (admin-only, will fail)
curl -X POST http://localhost:8888/api/refresh-trends
# Expected: {"error":"Admin access required"}
```

## Common Issues

### "Failed to load analytics"
- Check that you've made at least one click through `/go` link
- Verify `.netlify/state/tt_clicks.json` exists
- Check function logs for errors

### "Netlify Blobs not available"
- **This is normal in local dev!**
- Functions automatically fall back to file storage
- In production (deployed), Blobs will be used

### Trends fetching fails
- Amazon may block requests if too frequent
- Timeout is set to 8 seconds per source
- Failed sources are logged but don't break the page
- Check terminal logs for specific errors

### Dashboard shows $0.00 earnings
- This is normal if you have no clicks yet
- Earnings formula:
  ```
  clicks × 2% conversion × $50 avg order × 3% commission
  ```
- Estimates are intentionally conservative

### Rate limit triggering too early
- Check your IP isn't being shared with other processes
- Local dev uses IP hash, so all localhost requests count together
- To reset: `rm .netlify/state/rate_limits.json`

## Production Deployment Notes

**DO NOT deploy yet** - this is for local testing only per your requirements.

When ready to deploy:
1. Ensure `TT_SALT` environment variable is set in Netlify UI
2. Netlify Blobs will automatically be used (no code changes needed)
3. Rate limiting will track individual visitor IPs
4. Admin-only endpoints require proper Netlify Identity roles

## Security Notes

- IP addresses are **never stored raw** - only SHA-256 hashes
- Click data is capped at 10,000 recent events
- Rate limit data auto-cleans (keeps 1000 most recent IPs)
- Admin endpoints verify JWT tokens and check roles
- Trends fetching uses polite User-Agent and respects timeouts
- No sensitive data in error messages

## Performance Notes

- Click tracking: < 100ms overhead
- Analytics aggregation: O(n) where n = clicks in time window
- Trends cache: refreshes max once per 6 hours
- File storage: suitable for dev, use Blobs in production
- Rate limiting: O(1) lookup with periodic cleanup

---

**Ready to test!** Start with Test 1 (click tracking) and work through the workflow.
