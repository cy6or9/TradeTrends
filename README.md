# TradeTrends - Affiliate Marketing Platform

A **fast, Pinterest-friendly affiliate site** with dark neon theme, featuring click tracking analytics, trending products, and a full admin dashboard.

## 🚀 Features

### Public Site
- **Fast static pages:** `/`, `/amazon.html`, `/travel.html`
- **Click tracking:** All deal links use `/go/*` redirects for analytics
- **Mobile-optimized:** Responsive grid layouts
- **Dark neon theme:** Eye-catching yellow/orange accents
- **Travelpayouts integration:** Partnership verification

### Admin Dashboard
- **Analytics Dashboard** (`/admin/dashboard.html`):
  - 7-day click metrics
  - Top performing deals
  - Estimated earnings calculator
  - Real-time statistics
  
- **Trends Viewer** (`/admin/trends.html`):
  - Amazon movers & bestsellers
  - Travel destination trends
  - 6-hour cache with admin refresh
  - Graceful fallback system

- **CMS Editor** (`/admin/`):
  - Decap CMS for content management
  - Edit deals visually
  - Git-backed publishing
  - Netlify Identity authentication

### Backend (Serverless)
- **Netlify Functions:**
  - `/go/*` - Click tracking with rate limiting
  - `/api/analytics` - View click statistics
  - `/api/trends` - Cached trending data
  - `/api/refresh-trends` - Admin-only manual refresh
  
- **Storage System:**
  - Auto-detects Netlify Blobs (production)
  - Falls back to file storage (local dev)
  - Atomic updates with retry logic
  
- **Privacy & Security:**
  - IP hashing with SHA-256 + salt
  - 30 clicks per 10 minutes rate limiting
  - JWT-based admin authentication
  - No PII stored

## 📋 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Netlify account (free tier works)
- GitHub repository

### Local Development
```bash
# Install dependencies
npm install

# Start Netlify Dev server (with full auth)
npm run dev

# OR: Local-only mode (no auth, for quick testing)
npm run dev:full

# Visit site
open http://localhost:8888/
```

**Testing CMS locally:** See [LOCAL_CMS_DEV.md](LOCAL_CMS_DEV.md) for detailed instructions.

### First-Time Setup

1. **Link to Netlify (one-time):**
   ```bash
   npx netlify login
   npx netlify link
   ```

2. **Test Locally:**
   ```bash
   ./verify-deployment.sh  # Run automated checks
   npm run dev             # Start local server
   ```

3. **Click a few deals** on http://localhost:8888/
4. **Check dashboard** at http://localhost:8888/admin/dashboard.html
5. **Verify clicks tracked** in `.netlify/state/tt_clicks.json`

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing instructions.

## 🚢 Deployment

### Before You Deploy

**Required:**
1. Set `TT_SALT` environment variable in Netlify UI
   ```bash
   # Generate secure salt:
   openssl rand -base64 32
   ```
2. Enable Netlify Identity
3. Enable Git Gateway (for CMS)
4. Assign your user the `admin` role

See [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) for complete deployment guide.

### Deploy to Netlify

**Option 1: Git Integration (Recommended)**
```bash
git push origin main  # Auto-deploys
```

**Option 2: CLI Deploy**
```bash
npx netlify deploy --prod
```

### Post-Deployment
1. Visit your site and click a deal
2. Check `/admin/dashboard.html` shows clicks
3. Test trends refresh with admin account
4. Verify Travelpayouts script loads

## � Publishing Workflow (Draft → Live)

The CMS uses a **two-branch workflow** to prevent premature deploys:

| Branch | Purpose | Deployed? |
|--------|---------|-----------|
| `content` | Draft edits from CMS | ❌ No |
| `main` | Live production site | ✅ Yes |

### Day-to-Day: Adding Deals (Draft Mode)

1. **Login to `/admin`** and edit deals
2. **Click "Publish"** in CMS
3. ✅ Changes save to `content` branch (not live)
4. ❌ NO Netlify build triggered (by design)

This allows you to:
- Add multiple deals without deploying each time
- Review changes before going live
- Batch publish (trigger ONE build instead of many)

### When Ready: Publishing to Live Site

**Option 1: GitHub Web UI (Easiest)**
1. Go to your repository on GitHub
2. Navigate to "Pull requests" → "New pull request"
3. Set **base:** `main`, **compare:** `content`
4. Click "Create pull request"
5. Review the changes (see what deals you're publishing)
6. Click "Merge pull request"
7. ✅ Netlify automatically builds and deploys

**Option 2: Git Command Line**
```bash
# Create content branch (first-time only)
git checkout -b content
git push -u origin content
git checkout main

# Day-to-day publishing workflow:
git checkout main
git pull origin main
git merge origin/content
git push origin main  # Triggers Netlify deploy
```

### Handling Merge Conflicts

If you get conflicts in `public/data/*.json`:
1. Open the conflicted file
2. Keep ALL deals from both branches (merge the `items` arrays)
3. Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
4. Save, commit, and push

**Safety Tips:**
- ❌ Never force push to `main` or `content`
- ✅ Always merge, never rebase production branches
- ✅ Keep both deal lists when resolving conflicts

See [public/admin/README.md](public/admin/README.md) for detailed workflow guide.

## �📚 Documentation

| Document | Description |
|----------|-------------|
| [LOCAL_CMS_DEV.md](LOCAL_CMS_DEV.md) | **Local CMS testing guide (Codespaces/localhost)** |
| [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) | Complete deployment workflow |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Local testing procedures |
| [PUBLISHING_WORKFLOW.md](PUBLISHING_WORKFLOW.md) | Draft/publish workflow guide |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and fixes |
| [ENV_VARIABLES.md](ENV_VARIABLES.md) | Environment variable setup |
| [FUTURE_ENHANCEMENTS.md](FUTURE_ENHANCEMENTS.md) | Roadmap and ideas |

## 🔧 Configuration

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `TT_SALT` | Production | Salt for IP hashing (security) |

### Data Files

| File | Purpose |
|------|---------|
| `public/data/amazon.json` | Amazon deals (CMS-editable) |
| `public/data/travel.json` | Travel promos (CMS-editable) |

### Key Files

| Path | Description |
|------|-------------|
| `netlify/functions/go.js` | Click tracking redirect |
| `netlify/functions/api.js` | Analytics & trends API |
| `netlify/functions/lib/storage.js` | Storage adapter (Blobs/File) |
| `netlify/functions/lib/trends.js` | Trends scraper |
| `public/js/render.js` | Frontend card renderer |

## 🛠️ Tech Stack

- **Frontend:** Vanilla JS, HTML5, CSS3
- **Backend:** Netlify Functions (Node.js)
- **CMS:** Decap CMS 3.0.0 (React-based)
- **Auth:** Netlify Identity (JWT)
- **Storage:** Netlify Blobs + File fallback
- **Analytics:** Custom click tracking
- **Partnerships:** Travelpayouts verification

## 📊 Analytics Features

### Click Tracking
- Automatic link rewriting to `/go/*` format
- Privacy-preserving IP hashing
- Rate limiting (30 clicks/10min per IP)
- Network attribution (Amazon vs Travel)

### Dashboard Metrics
- Total clicks (7-day rolling window)
- Top performing deals
- Network breakdown
- Earnings estimates ($2.50 avg per click)

### Trends System
- Amazon movers & bestsellers scraping
- 6-hour cache TTL
- Minimal parsing (titles only)
- Graceful fallback to synthetic data

## 🔐 Admin Access

### Assign Admin Role
1. Go to Netlify UI → Identity
2. Click your user
3. Edit "app_metadata" (not user_metadata)
4. Add:
   ```json
   {
     "roles": ["admin"]
   }
   ```

### Admin Capabilities
- ✅ View analytics dashboard
- ✅ View trends data
- ✅ Manually refresh trends (POST /api/refresh-trends)
- ✅ Edit deals via CMS
- ✅ Publish changes to production

## 🧪 Testing

### Automated Verification
```bash
./verify-deployment.sh
```

### Manual Testing
```bash
# Start server
npm run dev

# Click deals on homepage
open http://localhost:8888/

# Check analytics
open http://localhost:8888/admin/dashboard.html

# Verify click storage
cat .netlify/state/tt_clicks.json
```

## 🐛 Troubleshooting

**Clicks redirect but don't count?**
- Check `.netlify/state/tt_clicks.json` exists
- Verify deal has valid `id` field
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problem-clicks-redirect-but-dont-show-in-dashboard)

**403 on admin endpoints?**
- Assign `admin` role to your user
- Re-login to Netlify Identity
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problem-admin-endpoints-return-403-forbidden)

**Trends not refreshing?**
- Cache is intentional (6 hours)
- Admin-only manual refresh available
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problem-trends-scraping-fails-or-returns-stale-data)

## 🚀 Future Enhancements

See [FUTURE_ENHANCEMENTS.md](FUTURE_ENHANCEMENTS.md) for roadmap:
- 📈 Last 24h stats widget on homepage
- 🔗 UTM link builder for campaigns
- 📊 Per-deal click history graphs
- 📥 CSV export for analytics
- 🔔 Webhook notifications
- ⏰ Extended cache duration (12-24h)

## 📄 License

MIT License - Feel free to use for your affiliate projects!

## 🤝 Contributing

Issues and PRs welcome! This is an open-source affiliate site template.
