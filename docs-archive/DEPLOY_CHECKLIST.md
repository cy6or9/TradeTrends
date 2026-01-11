# Pre-Deployment Checklist ✅

## Automated Verification (Run This First!)

```bash
./verify-deployment.sh
```

This script checks:
- ✅ npm run dev uses `netlify dev`
- ✅ Redirects configured in netlify.toml
- ✅ All functions exist
- ✅ Public site uses /go/* links
- ✅ Admin pages present
- ✅ Dependencies installed
- ✅ Data files have valid content
- ⚠️ Uncommitted changes warning
- ⚠️ Environment variable reminder

---

## Manual Testing (Local Dev)

### 1. Start Development Server
```bash
npm run dev
```

Expected output:
```
◈ Netlify Dev ◈
◈ Functions server is listening on 63279
◈ Loaded function go (294 ms)
◈ Loaded function api (178 ms)
◈ Server now ready on http://localhost:8888
```

### 2. Test Public Site
- Visit http://localhost:8888/
- Should show 4 Amazon deals
- Visit http://localhost:8888/travel.html
- Should show 3 travel promos
- Click 2-3 deals (should redirect to Amazon/partners)

### 3. Verify Click Tracking
```bash
# Check if clicks were logged
cat .netlify/state/tt_clicks.json

# Should show:
# {"clicks":[{"dealId":"DEAL001","network":"amazon",...}]}
```

### 4. Test Analytics Dashboard
- Visit http://localhost:8888/admin/dashboard.html
- "Total Clicks (7d)" should show > 0
- "Top Deals" table should list clicked deals
- "Estimated Earnings" should calculate (clicks × $2.50)

### 5. Test Trends Page
- Visit http://localhost:8888/admin/trends.html
- Should show Amazon movers/bestsellers
- "Last updated" should show recent time
- ⚠️ "Refresh Trends" button won't work locally (requires production admin role)

### 6. Test CMS (Optional)
- Visit http://localhost:8888/admin/
- Should load Decap CMS interface
- Can edit deals if Netlify Identity configured locally
- ⚠️ Local changes won't persist (uses Git Gateway)

---

## Before Deploying to Production

### Required Steps

#### 1. Set Environment Variable
1. Go to Netlify UI → Your Site → Site Settings → Environment Variables
2. Add new variable:
   - **Key:** `TT_SALT`
   - **Value:** Generate secure random string:
     ```bash
     openssl rand -base64 32
     ```
   - **Scope:** All (Production, Deploy Previews, Branch Deploys)

#### 2. Verify Netlify Identity
1. Go to Netlify UI → Identity tab
2. Ensure "Enable Identity" is ON
3. Ensure "Enable Git Gateway" is ON (for CMS)
4. Invite yourself as a user (if not already)

#### 3. Assign Admin Role
1. In Identity tab, click on your user
2. Scroll to "App metadata" section
3. Edit and add:
   ```json
   {
     "roles": ["admin"]
   }
   ```
4. Save changes

### Optional (Recommended)

#### Enable Netlify Blobs (Better than File Storage)
- Check if your plan includes Blobs
- No setup needed - storage adapter auto-detects

#### Configure Protected Paths
- Admin pages already protected via netlify.toml
- Verify `/admin/*` requires authentication

---

## Deployment Methods

### Option 1: Git Push (Recommended)
```bash
# Commit any remaining changes
git add .
git commit -m "Ready for production"

# Push to main branch (triggers auto-deploy)
git push origin main
```

Netlify will automatically:
- Detect changes in main branch
- Run build (if configured)
- Deploy to production
- Enable functions and redirects

### Option 2: Manual CLI Deploy
```bash
# Deploy to production
npx netlify deploy --prod

# Or deploy preview first
npx netlify deploy
# Then promote: npx netlify deploy --prod
```

---

## Post-Deployment Verification

### Immediate Tests (First 5 Minutes)

#### 1. Site Loads
- Visit your live URL (e.g., https://yoursite.netlify.app)
- All pages load without errors
- Check browser console for issues

#### 2. Click Tracking Works
- Click 1-2 deals on live site
- Should redirect to Amazon/partners ✅
- Wait 30 seconds for processing

#### 3. Dashboard Shows Data
- Visit https://yoursite.netlify.app/admin/dashboard.html
- Login with Netlify Identity
- Should show click count > 0
- If not, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

#### 4. Admin Functions Work
- Visit https://yoursite.netlify.app/admin/trends.html
- Click "Refresh Trends"
- Should update without 403 error
- If 403, verify admin role assigned

#### 5. Travelpayouts Script Loads
- Open browser DevTools → Network tab
- Load homepage
- Find request to `emrldtp.cc/NDg3NDU2.js`
- Should return 200 OK

### Extended Tests (First Hour)

#### 6. CMS Publishing
- Visit /admin/, login
- Edit a deal (change title)
- Click "Publish"
- Wait 30-60 seconds
- Verify change appears on public site

#### 7. Rate Limiting
- Click same deal 35+ times rapidly
- Should eventually return 429 or show message
- Confirms rate limiting active

#### 8. Multiple Devices
- Test from different IP address (mobile data)
- Verify clicks track separately

#### 9. Check Function Logs
- Go to Netlify UI → Functions tab
- Look for errors in logs
- Common issues:
  - TT_SALT not set → Add env var
  - Blobs errors → Will fall back to file storage (okay)

---

## Monitoring Setup (Optional but Recommended)

### 1. Netlify Analytics (Paid)
- Enable in Netlify UI
- Track pageviews, top pages, sources
- Costs ~$9/month

### 2. Function Logs
- Check regularly for errors
- Look for patterns (repeated 500s, timeouts)

### 3. Google Analytics (Free)
- Add GA4 script to all pages
- Track conversions, user flow
- Set up goals for deal clicks

### 4. Uptime Monitoring (Free)
- Use UptimeRobot or similar
- Ping homepage every 5 minutes
- Alert if site down

---

## Rollback Plan (If Something Goes Wrong)

### Quick Rollback via Netlify UI
1. Go to Netlify UI → Deploys tab
2. Find last working deploy
3. Click "..." → "Publish deploy"
4. Site reverts in ~30 seconds

### Rollback via Git
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or hard reset (use carefully!)
git reset --hard HEAD~1
git push -f origin main
```

---

## Success Criteria

Your deployment is successful when:

- ✅ All pages load (/, /amazon.html, /travel.html, /admin/*)
- ✅ Deals redirect via /go/* links
- ✅ Dashboard shows click counts
- ✅ Admin can refresh trends
- ✅ CMS can publish changes
- ✅ No console errors
- ✅ No function errors in logs
- ✅ Travelpayouts script loads
- ✅ Mobile site works
- ✅ Rate limiting active

---

## Getting Help

### Documentation
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and fixes
- [ENV_VARIABLES.md](ENV_VARIABLES.md) - Environment setup
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Detailed testing instructions
- [FUTURE_ENHANCEMENTS.md](FUTURE_ENHANCEMENTS.md) - Ideas for improvements

### Quick Debugging
```bash
# Check function logs locally
npm run dev
# (Watch terminal output)

# Check production function logs
npx netlify functions:log go
npx netlify functions:log api

# Test API endpoints directly
curl https://yoursite.netlify.app/api/analytics?days=7
curl https://yoursite.netlify.app/api/trends
```

### Common Issues
1. **403 on /api/refresh-trends** → Assign admin role
2. **Clicks redirect but don't count** → Check TT_SALT env var
3. **CMS won't save** → Enable Git Gateway
4. **Trends stuck** → Cache is intentional (6 hours)
5. **Rate limited during testing** → Delete .netlify/state/*.json locally

---

## Final Pre-Deploy Command

Run this one final time before pushing:

```bash
./verify-deployment.sh && \
npm run dev &
sleep 5 && \
curl -I http://localhost:8888/ && \
curl -I http://localhost:8888/go/amazon?id=DEAL001 && \
echo "✅ All checks passed! Ready to deploy." || \
echo "❌ Issues detected. Review output above."
```

---

## Deploy Now?

If all checks pass:

```bash
git push origin main
```

Then watch: https://app.netlify.com → Your Site → Deploys

Expected: Build succeeds in 30-60 seconds → Site live! 🚀
