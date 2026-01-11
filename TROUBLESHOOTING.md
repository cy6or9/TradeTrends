# Troubleshooting Guide for TradeTrends

## 🚀 CMS Development (Codespaces & Local)

### Running CMS in Development Mode

**Single command:**
```bash
npm run dev:cms
```

This starts `netlify dev` which includes:
- Static site server on port 8888
- Serverless functions
- **Local Git backend proxy** (built-in, no separate server needed)

### Accessing the CMS

**In GitHub Codespaces:**
1. Run `npm run dev:cms`
2. Wait for "Server now ready on http://localhost:8888"
3. Click on the "Ports" tab in VS Code
4. Find port 8888, click the globe icon to open in browser
5. Add `/admin/` to the URL path
6. Full URL pattern: `https://<codespace-name>-8888.app.github.dev/admin/`

**On Local Machine:**
1. Run `npm run dev:cms`
2. Open http://localhost:8888/admin/

### Verifying Local Backend Connection

Open browser console (F12) and look for these logs:

**In Codespaces (correct):**
```
🔍 Detecting environment: { origin: "https://name-8888.app.github.dev", ... }
✅ Local backend mode: codespaces
📡 CMS local backend URL: https://name-8888.app.github.dev/api/v1
🎬 Initializing Decap CMS...
✅ CMS initialized successfully
```

**On Localhost (correct):**
```
🔍 Detecting environment: { origin: "http://localhost:8888", ... }
✅ Local backend mode: localhost
📡 CMS local backend URL: http://localhost:8888/api/v1
🎬 Initializing Decap CMS...
✅ CMS initialized successfully
```

**Production (correct):**
```
🔍 Detecting environment: { origin: "https://yoursite.netlify.app", ... }
🌐 Production mode: Using git-gateway
🎬 Initializing Decap CMS...
✅ CMS initialized successfully
```

### Problem: CMS is Blank or Shows Connection Error

**Symptoms:**
- CMS loads but shows blank screen
- Console shows `ERR_FAILED` or CORS errors
- Error: "Failed to fetch" in console

**Cause:** Netlify Dev server is not running, or using old separate decap-server

**Fix:**
1. Make sure you're using `npm run dev:cms` (which runs `netlify dev`)
2. Stop any old processes first:
   ```bash
   pkill -f "netlify"
   pkill -f "decap"
   ```
3. Restart:
   ```bash
   npm run dev:cms
   ```
4. Wait for: `Server now ready on http://localhost:8888`
5. Refresh browser (Ctrl+Shift+R to hard refresh)

### Problem: CORS Error or "No Access-Control-Allow-Origin"

**Symptoms:**
- Console shows: `Access to fetch at '...-8081...' from origin '...-8888...' has been blocked by CORS`
- GET request shows `net::ERR_FAILED 302`

**Cause:** Using old configuration that tried to connect to separate decap-server port

**Fix:**
1. Pull latest code with updated configuration
2. Verify console shows: `📡 CMS local backend URL: https://...-8888.app.github.dev/api/v1`
   - Should be **same origin** (8888), not separate port (8081)
3. If still showing 8081, clear browser cache and hard refresh

### Problem: "Login with Netlify Identity" Appears in Local Mode

**Expected Behavior:**
- In local backend mode, you should NOT need to login
- CMS should show collections immediately after a brief "Loading" state
- If login appears, local backend may not be detected

**Fix:**
1. Check console logs for backend detection:
   - Should show: `✅ Local backend mode: codespaces` (or `localhost`)
   - Should show: `📡 Using local backend: https://...-8888.app.github.dev/api/v1`
2. If showing git-gateway instead of local backend:
   - Make sure `netlify dev` is running (not deployed site)
   - Check netlify.toml has `[dev]` section
   - Hard refresh browser (Ctrl+Shift+R)
3. Test the backend proxy manually in a new terminal:
   ```bash
   # In Codespaces:
   curl https://$(echo $CODESPACE_NAME)-8888.app.github.dev/api/v1
   
   # On localhost:
   curl http://localhost:8888/api/v1
   ```
   Should return: `{"repo":"","branch":""}`

### Problem: Changes Not Saving

**Symptoms:**
- Can edit deals in CMS
- Click "Save" or "Publish"
- Changes don't appear in JSON files

**Diagnosis:**
1. Check which backend mode is active (see console logs)
2. In local backend mode:
   - Changes save to `.decaps/` folder (NOT Git)
   - This is for testing UI only
   - To commit to Git, use `npm run dev` + Netlify Identity login
3. In git-gateway mode:
   - Changes commit to `content` branch
   - Must merge to `main` to deploy

**Fix for Git commits:**
```bash
# Stop dev:cms, use regular dev with Identity
npm run dev

# Login with Netlify Identity when CMS loads
# Edit and save - will commit to content branch
```

---

## Analytics & Click Tracking

## Problem: Clicks redirect but don't show in dashboard

### Symptoms
- Clicking deals on homepage redirects to Amazon/partner site ✅
- But dashboard shows 0 clicks ❌
- `.netlify/state/tt_clicks.json` doesn't exist or is empty

### Diagnosis Steps

#### 1. Check if redirects are working
```bash
# Start dev server
npm run dev

# In another terminal, test the redirect manually
curl -i http://localhost:8888/go/amazon?id=DEAL001

# Expected output:
# HTTP/1.1 302 Found
# Location: https://amazon.com/... (affiliate URL)
```

#### 2. Check if function is logging clicks
```bash
# After clicking a deal, check the state file
cat .netlify/state/tt_clicks.json

# Should see something like:
# {"clicks":[{"dealId":"DEAL001","network":"amazon","timestamp":1234567890,"ipHash":"abc123..."}]}
```

#### 3. Check Netlify Dev logs
Look in the terminal where `npm run dev` is running for errors like:
- ❌ `ENOENT: no such file or directory` → Storage write failed
- ❌ `Cannot find deal with id` → Deal ID mismatch
- ❌ `Rate limit exceeded` → Too many test clicks (wait 10 min or delete state file)

### Common Causes & Fixes

#### Cause 1: Deal IDs don't match
**Symptom:** Function logs "Deal not found with id: XXX"

**Check:**
```bash
# List deal IDs in your data files
cat public/data/amazon.json | grep -o '"id":"[^"]*"'
cat public/data/travel.json | grep -o '"id":"[^"]*"'
```

**Fix:** Ensure every deal has an `id` field in the JSON files

#### Cause 2: Storage directory not created
**Symptom:** `ENOENT` errors in function logs

**Fix:**
```bash
# Manually create the directory
mkdir -p .netlify/state

# Check permissions
ls -la .netlify/state
# Should be writable by your user
```

#### Cause 3: Rate limiting triggered
**Symptom:** Redirects work, but no new clicks logged

**Fix:**
```bash
# Check current state
cat .netlify/state/tt_rate_limit.json

# Delete to reset (local dev only!)
rm .netlify/state/tt_rate_limit.json
```

#### Cause 4: Wrong server (not using netlify dev)
**Symptom:** 404 errors on /go/* paths

**Fix:**
```bash
# ❌ Wrong:
# python -m http.server 8000
# npx serve public

# ✅ Correct:
npm run dev
```

#### Cause 5: Deal missing affiliate URL
**Symptom:** Function returns 404 after finding deal

**Check:**
```bash
# Verify all deals have affiliate URLs
cat public/data/amazon.json | grep -o '"affiliate_url":"[^"]*"'
```

**Fix:** Add `affiliate_url` field to all deals in JSON files

---

## Problem: Admin endpoints return 403 Forbidden

### Symptoms
- Dashboard loads ✅
- Analytics API works ✅  
- Trends refresh returns 403 ❌

### Diagnosis

#### 1. Check if you're logged in
```javascript
// In browser console on dashboard page
window.netlifyIdentity.currentUser()
// Should return user object, not null
```

#### 2. Check if admin role is assigned
```javascript
// In browser console
const user = window.netlifyIdentity.currentUser();
console.log(user?.app_metadata?.roles);
// Should include 'admin'
```

### Fix: Assign Admin Role

#### Local Development (Netlify Dev)
```bash
# Admin role checking doesn't work in local dev
# The function will see: clientContext.user = undefined

# For local testing, temporarily disable admin check:
# Edit netlify/functions/api.js
# Comment out the admin check in /api/refresh-trends route
```

#### Production (After Deployment)
1. Go to Netlify UI → Your Site → Identity
2. Click on your user
3. Edit "app_metadata" (NOT user_metadata)
4. Add:
   ```json
   {
     "roles": ["admin"]
   }
   ```
5. Save and re-login

---

## Problem: Trends scraping fails or returns stale data

### Symptoms
- Trends page shows old data
- Refresh button doesn't update
- Console shows network errors

### Diagnosis

#### 1. Check trends cache
```bash
# Local dev
cat .netlify/state/tt_trends_cache.json

# Check the generatedAt timestamp
# Should be within 6 hours for fresh data
```

#### 2. Test trends fetching manually
```bash
# In browser console on trends page
fetch('/api/trends')
  .then(r => r.json())
  .then(d => console.log(d))

# Check:
# - Is generatedAt recent?
# - Are there items in the array?
# - Any error messages?
```

### Common Issues

#### Issue 1: Network timeouts
**Symptom:** Trends API returns 500 error

**Cause:** Amazon.com took too long to respond (>8s timeout)

**Fix:** Cache will serve old data, no action needed

#### Issue 2: Cache never refreshes
**Symptom:** Refresh button does nothing

**Check:**
```bash
# Look for errors in netlify dev terminal
# Common errors:
# - "Request timeout" → Normal, cache is kept
# - "403 Forbidden" → Admin auth failed
# - "500 Internal Server Error" → Check function logs
```

**Fix:** Ensure you're logged in with admin role

#### Issue 3: Scraping blocked by Amazon
**Symptom:** Trends show only synthetic fallback data

**Cause:** Amazon may block scraping from certain IPs

**Mitigation:** 
- Cache is intentionally long (6 hours)
- Minimal scraping (only titles, no prices)
- Graceful fallback to synthetic data
- Not critical for site operation

---

## Problem: Local testing shows errors after deployment

### Symptoms
- Site works locally ✅
- After deploy, functions fail ❌

### Common Causes

#### 1. Missing environment variables
**Fix:** Set `TT_SALT` in Netlify UI → Site Settings → Environment Variables

#### 2. Netlify Blobs not initialized
**Symptom:** Storage errors in function logs

**Fix:** Storage adapter auto-falls back to Blobs, but check:
- Netlify Blobs is enabled on your plan
- Redeploy after enabling

#### 3. Function timeouts
**Symptom:** Functions return 504 Gateway Timeout

**Cause:** 
- Trends scraping takes >10s (Netlify limit)
- Too many deals in JSON files (slow file parsing)

**Fix:**
- Trends scraper has 8s timeout (safe)
- Keep deal files under 100 items each

---

## Quick Debugging Commands

```bash
# Check if netlify dev is running correctly
curl -I http://localhost:8888/

# Test redirect endpoint
curl -i http://localhost:8888/go/amazon?id=DEAL001

# Test analytics API
curl http://localhost:8888/api/analytics?days=7

# Test trends API
curl http://localhost:8888/api/trends

# Check local storage files
ls -lah .netlify/state/
cat .netlify/state/tt_clicks.json | jq .
cat .netlify/state/tt_rate_limit.json | jq .
cat .netlify/state/tt_trends_cache.json | jq .

# Clear rate limiting (local only!)
rm .netlify/state/tt_rate_limit.json

# Clear entire local state (fresh start)
rm -rf .netlify/state/*.json

# Check netlify dev logs in real-time
# (Just watch the terminal where npm run dev is running)
```

---

## Testing Checklist

Use this to verify everything works:

### Phase 1: Basic Site
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:8888/ loads homepage
- [ ] Homepage shows 4 Amazon deals
- [ ] http://localhost:8888/travel.html shows 3 promos
- [ ] Clicking a deal redirects to affiliate URL

### Phase 2: Click Tracking
- [ ] Click 2-3 different deals on homepage
- [ ] File `.netlify/state/tt_clicks.json` is created
- [ ] File contains array with 2-3 click objects
- [ ] Each click has: dealId, network, timestamp, ipHash

### Phase 3: Analytics Dashboard
- [ ] http://localhost:8888/admin/dashboard.html loads
- [ ] "Total Clicks (7d)" shows count > 0
- [ ] "Top Deals" table shows the deals you clicked
- [ ] Click counts match your test clicks

### Phase 4: Admin (Limited in Local Dev)
- [ ] http://localhost:8888/admin/ loads CMS
- [ ] Can login with Netlify Identity (if configured)
- [ ] http://localhost:8888/admin/trends.html loads
- [ ] Trends data shows (cached from initial load)
- [ ] ⚠️  Refresh button won't work locally (requires production admin role)

### Phase 5: Production (After Deploy)
- [ ] Live site loads all pages
- [ ] Click tracking works on live site
- [ ] Dashboard shows live click data
- [ ] Admin can refresh trends (with admin role)
- [ ] Travelpayouts script loads (check browser devtools)

---

## Still Having Issues?

### Check these files for debugging:

1. **netlify.toml** - Redirects configuration
2. **netlify/functions/go.js** - Add console.log to see what's happening
3. **netlify/functions/lib/storage.js** - Check createStorage() logic
4. **.gitignore** - Ensure .netlify/ is ignored
5. **package.json** - Verify "dev": "netlify dev"

### Enable verbose logging:

```javascript
// Add to top of netlify/functions/go.js
console.log('Function invoked:', {
  query: event.queryStringParameters,
  path: event.path
});
```

### Check Netlify Dev environment:

```bash
# Should see functions discovered
npm run dev

# Look for:
# ◈ Functions server is listening on 63279
# ◈ Loaded function go
# ◈ Loaded function api
```
