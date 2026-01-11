# Local CMS Development Guide

This guide explains how to test the Decap CMS admin panel locally in Codespaces or on your machine.

## 🎯 Quick Start

### Option 1: Full Auth Mode (Recommended)
Uses real Netlify Identity + Git Gateway for testing.

```bash
# Install dependencies
npm install

# One-time setup: Link to Netlify site
npx netlify login
npx netlify link

# Start dev server
npm run dev

# Open admin panel
# In Codespaces: Use the forwarded port URL (e.g., https://xxx-8888.app.github.dev/admin/)
# Locally: http://localhost:8888/admin/
```

### Option 2: Local-Only Mode (Fallback)
Bypasses Netlify Identity for quick local testing without authentication.

```bash
# Install dependencies
npm install

# Start both CMS proxy and dev server
npm run dev:full

# Open admin panel
# In Codespaces: Use the forwarded port URL
# Locally: http://localhost:8888/admin/
```

## 📋 Detailed Setup

### Prerequisites

- Node.js 18+ and npm
- GitHub account (for Codespaces) or local Git
- Netlify site with Identity enabled (for Option 1)

### Option 1: Full Auth Mode (Official Method)

This is the **recommended** way to test the CMS with real authentication and Git publishing.

#### Step 1: Link to Netlify Site

```bash
# Login to Netlify (opens browser)
npx netlify login

# Link this repo to your Netlify site
npx netlify link
# Select: "Use current git remote origin"
# Or manually enter your site name
```

**Why this is needed:**
- Provides access to Netlify Identity endpoints
- Enables Git Gateway for publishing
- Allows testing with real user roles

#### Step 2: Start Netlify Dev

```bash
npm run dev
```

This starts a local proxy server that:
- Serves your static site from `public/`
- Proxies Netlify Identity requests to production
- Enables serverless functions locally
- Provides Git Gateway for CMS publishing

#### Step 3: Access Admin Panel

**In GitHub Codespaces:**
1. Wait for port forwarding to activate
2. Click the "Ports" tab
3. Find port 8888
4. Click the globe icon or copy the forwarded URL
5. Add `/admin/` to the URL
6. Example: `https://xxx-8888.app.github.dev/admin/`

**Locally:**
1. Open: http://localhost:8888/admin/
2. You should see the CMS interface

#### Step 4: Login

1. Click "Login with Netlify Identity"
2. Sign in with your credentials
3. CMS will load with your collections

**Troubleshooting:**
- If login button doesn't appear: Check that Identity is enabled in Netlify UI
- If "Access Denied" appears: Ensure your user has the `admin` role (see below)
- If CMS won't load: Check browser console for errors

### Option 2: Local-Only Mode (No Auth)

Use this for quick UI testing **without** Netlify authentication.

#### How It Works

This mode uses Decap CMS's `local_backend` feature:
- CMS runs a local proxy server on port 8081
- Bypasses Netlify Identity (no login required)
- Files are edited directly in your local Git repo
- Changes are NOT pushed to GitHub automatically

#### When to Use

- Quick UI/UX testing
- Styling changes
- Testing CMS widgets
- Local development without internet

#### Setup

```bash
# Install dependencies (includes decap-server)
npm install

# Start both proxy and dev server
npm run dev:full
```

This runs:
1. `decap-server` - CMS proxy on port 8081
2. `netlify dev` - Site server on port 8888

#### Access Admin

Same as Option 1, but no login required:
- Navigate to `/admin/`
- CMS loads directly (bypasses auth)
- You can edit collections immediately

#### Limitations

- **No authentication** - Admin role checks bypassed
- **Local commits only** - Changes stay in your local Git
- **Manual push required** - Must `git push` to publish
- **No production testing** - Doesn't test real Identity flow

**Important:** This mode is for development only. Never disable authentication in production!

## 🔧 Configuration

### CMS Config ([public/admin/config.yml](../public/admin/config.yml))

```yaml
backend:
  name: git-gateway
  branch: content  # Drafts go here

# Enable local proxy backend for local-only mode
local_backend: true
```

### Package Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `netlify dev` | Full auth mode (recommended) |
| `cms:proxy` | `decap-server` | CMS proxy server only |
| `dev:full` | Both servers | Local-only mode (no auth) |

### Environment Detection

The admin panel automatically detects your environment:

```javascript
// In public/admin/index.html
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || 
                hostname.includes('app.github.dev');
```

**If detected as local:**
- Shows blue banner: "💡 Local Dev: Use npm run dev..."
- Suggests correct commands

**If detected as production:**
- No dev banner shown
- Normal authentication flow

## 🧪 Testing Workflow

### Testing CMS Changes

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Edit a deal:**
   - Navigate to `/admin/`
   - Login with Identity
   - Edit "Amazon Deals" or "Travel Promos"
   - Click "Publish"

3. **Verify commit:**
   ```bash
   git log --oneline -1
   # Should show your CMS edit
   
   git status
   # Should show changes in public/data/*.json
   ```

4. **Check branch:**
   ```bash
   git branch
   # Should show: * content
   # CMS commits go to content branch
   ```

### Testing Without Deploy

The CMS is configured to write to the `content` branch:
- ✅ Changes are committed locally
- ✅ Git history is updated
- ❌ NO Netlify build is triggered
- ❌ Live site is NOT affected

To publish to live site, merge `content` → `main` (see [PUBLISHING_WORKFLOW.md](../PUBLISHING_WORKFLOW.md))

### Testing Admin Role

1. **Assign admin role** (in Netlify UI):
   - Identity tab → Your user → Edit
   - App metadata: `{"roles": ["admin"]}`

2. **Test authentication:**
   - Logout of CMS
   - Login again
   - Should NOT see "Access Denied" overlay
   - CMS should load successfully

3. **Test role check:**
   ```bash
   # In browser console on /admin/ page:
   window.netlifyIdentity.currentUser()?.app_metadata?.roles
   # Should return: ["admin"]
   ```

## 🐛 Troubleshooting

### "Login button doesn't appear"

**Cause:** Netlify Identity widget not loaded

**Fix:**
1. Check browser console for errors
2. Verify you're using `npm run dev` (not a static server)
3. Check that `netlify link` was successful
4. Try: `npx netlify link --force`

### "Error: No site linked"

**Cause:** Repository not linked to Netlify site

**Fix:**
```bash
# Re-link to your site
npx netlify link

# Or link by site ID
npx netlify link --id YOUR_SITE_ID
```

### "Access Denied" after login

**Cause:** User doesn't have `admin` role

**Fix:**
1. Go to Netlify UI → Identity
2. Click your user
3. Edit "app_metadata" (NOT user_metadata)
4. Add: `{"roles": ["admin"]}`
5. Save and re-login

### "CMS won't save changes"

**Cause:** Git Gateway not configured or not working

**Fix:**
1. Check Netlify UI → Identity → Services → Git Gateway (should be ON)
2. Verify you're logged in: `window.netlifyIdentity.currentUser()`
3. Check browser console for 401/403 errors
4. Try logout/login again

### "Port 8888 already in use"

**Cause:** Another process is using the port

**Fix:**
```bash
# Find and kill the process
lsof -ti:8888 | xargs kill -9

# Or use a different port
netlify dev --port 8889
```

### "Local backend not working"

**Cause:** decap-server not running or wrong port

**Fix:**
```bash
# Ensure dependencies installed
npm install

# Run with verbose logging
npm run cms:proxy

# Should see: "Proxy server listening on 8081"

# Then in another terminal:
npm run dev
```

### In Codespaces: "Cannot access forwarded port"

**Cause:** Port visibility set to private

**Fix:**
1. Open "Ports" tab in VS Code
2. Right-click port 8888
3. Change "Port Visibility" to "Public"
4. Copy the new forwarded URL

## 🔒 Security Notes

### Production vs Development

| Feature | Production | Development |
|---------|-----------|-------------|
| Authentication | Required | Optional (local_backend) |
| Git Gateway | Required | Optional |
| Admin role | Enforced | Bypassed (local mode) |
| HTTPS | Required | Not required |

### Local Backend Safety

The `local_backend` feature is **development-only**:
- ✅ Safe for local testing
- ✅ Doesn't affect production config
- ✅ Only works when proxy server is running
- ❌ Never enable in production (already prevented)

**How it works:**
1. Decap CMS checks for `local_backend: true` in config
2. If true, tries to connect to `http://localhost:8081`
3. If connection fails, falls back to `git-gateway`
4. Production (no localhost) always uses `git-gateway`

## 📚 Additional Resources

- [Decap CMS Docs](https://decapcms.org/docs/intro/)
- [Netlify Dev Docs](https://docs.netlify.com/cli/get-started/)
- [Git Gateway Guide](https://docs.netlify.com/visitor-access/git-gateway/)
- [Publishing Workflow](../PUBLISHING_WORKFLOW.md)
- [Deployment Checklist](../DEPLOY_CHECKLIST.md)

## 🎯 Summary

**For normal development:**
```bash
npm run dev
# Full authentication with Netlify Identity
```

**For quick local testing:**
```bash
npm run dev:full
# No authentication required
```

**In Codespaces:**
- Always use forwarded port URLs
- Set port visibility to Public
- Access via: `https://xxx-8888.app.github.dev/admin/`

**Best practice:**
- Use `npm run dev` for final testing before deploy
- Use `npm run dev:full` for quick UI changes
- Always test with real authentication before deploying
