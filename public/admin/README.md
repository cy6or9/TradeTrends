# TradeTrends Admin - Draft/Publish Workflow

Clean, minimal admin interface with **draft/publish workflow** to prevent premature deploys.

## 📝 How the Workflow Works

The CMS uses a **two-branch system** for content management:

| Branch | Purpose | Deployed? |
|--------|---------|-----------|
| `content` | Draft edits from CMS | ❌ No |
| `main` | Live site content | ✅ Yes |

### When You Click "Publish" in CMS:
1. Changes save to `content` branch (NOT `main`)
2. Git commit is created
3. **NO Netlify build is triggered** (by design)
4. Deals remain in draft until merged to `main`

### To Make Deals Live:
Merge `content` → `main` (see "Publishing Workflow" section below)

This allows you to:
- ✅ Add multiple deals without deploying each time
- ✅ Review changes before going live
- ✅ Batch publish deals (trigger ONE build instead of many)
- ✅ Collaborate without breaking live site

## Files

### Active Files (Production)
- **index.html** (31 lines) - Minimal HTML shell, loads CMS once
- **cms.js** (328 lines) - All customizations (autofill, auth, roles)
- **admin.css** (46 lines) - Minimal styling for full-viewport CMS
- **config.yml** (90 lines) - CMS collections and backend config
- **diagnostics.js** - Browser console diagnostic tool

### Key Changes
✅ **Single CMS Load** - Only one `<script>` tag for Decap CMS  
✅ **No Manual Init** - CMS auto-initializes (no `CMS.init()` call)  
✅ **Separated Concerns** - Customizations in cms.js, not inline  
✅ **Clean Shell** - Body has only `#nc-root` + access denied message  
✅ **No Site CSS** - Admin CSS isolated from main site styles  

## How It Works

### Loading Sequence
1. **index.html** loads
2. **Netlify Identity widget** loads
3. **Decap CMS** loads and auto-initializes
4. **cms.js** loads and registers hooks:
   - `CMS.registerEventListener('preSave')` for autofill
   - Netlify Identity events for auth/roles
   - No DOM manipulation (CMS-safe)

### Local Development

```bash
# Start local dev server with Identity + Git Gateway
npm run dev

# Visit admin
open http://localhost:8888/admin
```

**Note**: Local admin requires Netlify Dev (not just `python -m http.server`) for:
- Netlify Identity authentication
- Git Gateway (write to repo)
- Netlify Functions (URL resolver)

**Local Limitation**: Changes you publish locally will go to `content` branch but won't deploy until merged to `main`.

### Production

Visit: `https://YOUR_SITE.netlify.app/admin`

## 🚀 Publishing Workflow

### Step 1: Edit Deals in CMS (Draft)
1. Login to `/admin`
2. Add or edit deals
3. Click "Publish"
4. ✅ Saved to `content` branch (not live yet)

### Step 2: Merge to Main (Go Live)

#### Option A: GitHub Web UI (Easiest)
1. Go to your GitHub repository
2. Click "Pull requests" → "New pull request"
3. Set base: `main`, compare: `content`
4. Click "Create pull request" → "Merge pull request"
5. ✅ Netlify builds and deploys automatically

#### Option B: Git Command Line
```bash
# Switch to main branch
git checkout main
git pull origin main

# Merge content into main
git merge origin/content

# Push to trigger deployment
git push origin main
```

### Step 3: Verify Live Site
- Visit your public URL
- Deals should now be visible
- Check dashboard for click tracking

## ⚠️ Important Notes

### Merge Conflicts
If you get conflicts in `public/data/*.json`:
- Open the file
- Keep ALL deals from both branches (merge the items arrays)
- Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- Commit and push

### Safety
- ❌ Never force push to `main` or `content`
- ✅ Always merge, never rebase
- ✅ Keep both deal lists when merging

### First-Time Setup
Create the `content` branch (one-time):
```bash
git checkout -b content
git push -u origin content
git checkout main
```

Then configure your Netlify site to use the CMS (already done in `config.yml`).

## Features

### ✅ Preserved Functionality
- Google OAuth login
- Role-based access control (admin role required)
- URL-first autofill system:
  - Auto-generates IDs from ASINs/URLs
  - Detects network (Amazon/Travel)
  - Suggests categories
  - Resolves shortened URLs via Netlify Function
- User metadata normalization (prevents widget crashes)
- Git Gateway publishing
- Media uploads

### 🛡️ Crash Prevention
- **Single CMS load** (no duplicate React roots)
- **No `CMS.init()` calls** (auto-init only)
- **No DOM manipulation** (uses CMS hooks instead)
- **Separated scripts** (no inline customization)

## Debugging

### Check for issues:
```javascript
// In browser console at /admin
// Option 1: Load diagnostic script
await import('/admin/diagnostics.js');

// Option 2: Quick check
console.log('CMS loaded:', !!window.CMS);
console.log('CMS scripts:', document.querySelectorAll('script[src*="decap-cms"]').length);
console.log('User:', window.netlifyIdentity?.currentUser()?.email);
```

### Common Issues

**CMS not rendering (blank page)**
- Check: Only 1 CMS script tag (not 0, not 2+)
- Check: `#nc-root` exists and has height > 0
- Check: No CSS hiding `#nc-root`

**React error: "removeChild"**
- Cause: Multiple CMS script tags
- Fix: Remove duplicates, keep only one

**"Access Denied" shows for admin users**
- Check: User has `admin` role in Netlify Identity
- Check: `user.app_metadata.roles` includes "admin"
- Not: widget display name (unreliable)

**Autofill not working**
- Check: cms.js loaded successfully
- Check: Console shows "🚀 Initializing CMS-safe autofill system..."
- Check: Netlify Function `/resolve` is deployed

## File Reduction

| Version | Lines | Description |
|---------|-------|-------------|
| Original | 803 | Inline scripts, DOM manipulation, duplicate loads |
| Bloated | 370 | Attempted fix, still had issues |
| **Current** | **31** | Minimal shell, clean separation |

**Total reduction**: 96% smaller, 0 crashes

## Architecture

```
index.html (31 lines)
├── <div id="nc-root"></div>         ← CMS mounts here
├── netlify-identity-widget.js       ← Auth
├── decap-cms@3.0.0.js               ← CMS (SINGLE LOAD)
└── cms.js (328 lines)               ← Customizations
    ├── URL autofill (CMS hooks)
    ├── Role detection (Identity events)
    ├── User metadata normalization
    └── Access control
```

**No SPA shell, no site CSS, no layout conflicts.**

## Testing Checklist

- [ ] Admin page loads without React errors
- [ ] `#nc-root` is visible (not hidden)
- [ ] Only 1 CMS script tag
- [ ] Login modal appears for logged-out users
- [ ] Google OAuth works
- [ ] Admin role users see CMS interface
- [ ] Non-admin users see "Access Denied"
- [ ] Collections load (Amazon Deals, Travel Promos)
- [ ] Entries display in list view
- [ ] Can create new entry
- [ ] Autofill triggers on affiliate_url paste
- [ ] Can save entry
- [ ] Can publish changes
- [ ] Media library works
- [ ] Preview pane renders

## Maintenance

### Adding new CMS features
✅ **Do**: Add to cms.js using CMS APIs:
- `CMS.registerWidget()`
- `CMS.registerPreviewTemplate()`
- `CMS.registerEventListener()`

❌ **Don't**: 
- Add inline scripts to index.html
- Manipulate DOM (querySelector, appendChild, etc.)
- Call `CMS.init()` manually
- Load CMS multiple times

### Updating CMS version
```html
<!-- In index.html, change version: -->
<script src="https://unpkg.com/decap-cms@^3.1.0/dist/decap-cms.js"></script>
```

## Resources

- [Decap CMS Docs](https://decapcms.org/docs/)
- [CMS Configuration](https://decapcms.org/docs/configuration-options/)
- [Custom Widgets](https://decapcms.org/docs/custom-widgets/)
- [Netlify Identity](https://docs.netlify.com/visitor-access/identity/)
- [Git Gateway](https://docs.netlify.com/visitor-access/git-gateway/)
