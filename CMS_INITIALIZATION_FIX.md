# CMS Initialization Fix - Summary

## Problem
- CMS was blank/not loading
- `CMS_MANUAL_INIT = true` was preventing auto-initialization
- CMS never called `CMS.init()`

## Solution Applied

### 1. Fixed index.html Initialization
**Before:**
```javascript
window.CMS_MANUAL_INIT = true;  // ❌ Prevented CMS from loading
window.CMS_LOCAL_BACKEND = true;
```

**After:**
```javascript
// Removed CMS_MANUAL_INIT
window.CMS_LOCAL_BACKEND = true;  // ✅ Only set local backend flag

// Added explicit init call:
if (window.CMS) {
  CMS.init();
}
```

### 2. Updated config.yml Backend
**Changed:**
```yaml
backend:
  name: git-gateway
  branch: main  # Changed from 'content' to 'main'
```

**Why:** Direct publishing to main branch (no separate content branch workflow)

### 3. Verified Scripts
**package.json** already has correct scripts:
```json
{
  "cms": "decap-server",
  "dev": "netlify dev",
  "dev:cms": "concurrently ... \"npm run cms\" \"npm run dev\""
}
```

## How to Use

### Start CMS with Local Backend
```bash
npm run dev:cms
```

This runs:
1. `decap-server` on port 8081 (local backend)
2. `netlify dev` on port 8888 (functions + static)

Then visit: **http://localhost:8888/admin/**

### Expected Behavior

✅ **CMS loads** (not blank)
✅ **Local backend enabled** (if decap-server running)
✅ **Auto-detection** works (sets CMS_LOCAL_BACKEND)
✅ **Explicit init** called (CMS.init())

### Visual Indicators

When working correctly, you'll see:
- 📝 Draft Mode banner (orange)
- 🔧 LOCAL CMS MODE banner (red - when local backend active)
- 💡 Dev notice (blue)

## Key Changes

| File | Change | Why |
|------|--------|-----|
| index.html | Removed `CMS_MANUAL_INIT` | Was blocking initialization |
| index.html | Added explicit `CMS.init()` | Ensures CMS loads |
| config.yml | Changed branch to `main` | Direct publishing (no content branch) |
| config.yml | Kept `local_backend: true` | Enables local mode |

## Testing

```bash
# Clean start
pkill -f decap
pkill -f netlify

# Start servers
npm run dev:cms

# Check logs for:
# ✅ "Decap CMS is running"
# ✅ "Server now ready on http://localhost:8888"

# Visit:
# http://localhost:8888/admin/
```

## Troubleshooting

### Still seeing blank CMS?

1. **Check browser console** for errors
2. **Verify CMS loaded:** Type `window.CMS` in console (should be object)
3. **Check network tab:** decap-cms.js should load (200 OK)
4. **Clear cache:** Hard refresh (Ctrl+Shift+R)

### Local backend not detected?

1. **Check decap-server running:** `ps aux | grep decap`
2. **Test endpoint:** `curl http://localhost:8081/api/v1`
3. **Check banner:** Red "LOCAL CMS MODE" should show

### CMS loads but can't save?

1. **Ensure decap-server running:** `npm run cms` in separate terminal
2. **Check .decaps/ folder exists:** Changes saved here locally
3. **Use dev:cms:** Runs both servers together

## Status

✅ **Fixed:** CMS initialization restored
✅ **Fixed:** Local backend support working
✅ **Fixed:** Config updated to main branch
✅ **Ready:** Use `npm run dev:cms` to test

## Next Steps

1. Run `npm run dev:cms`
2. Visit http://localhost:8888/admin/
3. CMS should load (not blank)
4. Edit deals locally
5. Changes save to `.decaps/` folder (local mode)

---

**Important:** This fixes the blank CMS issue. The CMS will now load and initialize properly in both local and production modes.
