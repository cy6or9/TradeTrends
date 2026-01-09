# TradeTrends - Local Development Guide

## Overview
TradeTrends is a static affiliate site using:
- **Decap CMS** (formerly Netlify CMS) for content management
- **Netlify Identity** for authentication
- **Git Gateway** for publishing content directly to GitHub
- **Netlify Functions** for URL resolution/autofill

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Access to the Netlify site (for authentication)
- Git configured with repo access

### Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Login to Netlify** (one-time setup)
   ```bash
   npx netlify login
   ```
   This opens a browser to authorize the CLI with your Netlify account.

3. **Link to the Netlify site** (one-time setup)
   ```bash
   npx netlify link
   ```
   Choose "Use current git remote origin" to link to your existing site.

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   This starts Netlify Dev at `http://localhost:8888` with:
   - Full Netlify Identity support (login/logout works)
   - Netlify Functions proxied at `/.netlify/functions/*`
   - Git Gateway enabled for CMS publishing

5. **Access the admin dashboard**
   - Open: `http://localhost:8888/admin`
   - Click "Login with Netlify Identity"
   - Edit content and click "Publish" - changes commit directly to GitHub

## Offline Development (No Authentication)

If you want to test the CMS UI without authentication:

### Enable Local Backend

1. **Edit** [public/admin/config.yml](public/admin/config.yml) and add at the top:
   ```yaml
   local_backend: true
   ```

2. **Run the local backend server** (in a separate terminal):
   ```bash
   npx decap-server
   ```
   Or with npx-cms-proxy-server:
   ```bash
   npx netlify-cms-proxy-server
   ```

3. **Start dev server**:
   ```bash
   npm run dev:offline
   ```

4. **Access admin**: `http://localhost:8888/admin`
   - No login required in local backend mode
   - Changes write directly to local files
   - Git commits are manual

**⚠️ IMPORTANT**: Remove `local_backend: true` before deploying to production!

## Project Structure

```
/workspaces/TradeTrends/
├── public/              # Netlify publish directory
│   ├── index.html       # Homepage
│   ├── amazon.html      # Amazon deals page
│   ├── travel.html      # Travel promos page
│   ├── admin/           # Decap CMS admin
│   │   ├── index.html   # CMS shell
│   │   ├── config.yml   # CMS configuration
│   │   ├── cms.js       # Custom autofill logic
│   │   └── admin.css    # Admin styling
│   ├── data/            # JSON data files (CMS writes here)
│   │   ├── amazon.json
│   │   └── travel.json
│   ├── css/
│   │   └── styles.css   # Frontend styling
│   └── js/
│       └── render.js    # Frontend JSON renderer
├── netlify/
│   └── functions/
│       └── resolve.js   # URL resolver for autofill
├── netlify.toml         # Netlify configuration
└── package.json         # Node scripts
```

## Data Flow

1. **Admin edits content** → `public/admin` (Decap CMS UI)
2. **CMS writes JSON** → `public/data/amazon.json` or `public/data/travel.json`
3. **CMS commits** → Git Gateway → GitHub main branch
4. **Netlify deploys** → Publishes `public/` directory
5. **Frontend fetches** → `/data/amazon.json` → Renders cards

## Troubleshooting

### "Failed to load config.yml"
- Ensure you're accessing via `http://localhost:8888/admin` (Netlify Dev)
- Don't use VSCode Simple Browser preview URLs

### "Unable to access identity API"
- Run `npx netlify link` to connect to your site
- Verify Netlify Identity is enabled in site settings
- Check that Git Gateway is enabled

### "Publish button doesn't update live site"
- Changes commit to GitHub immediately
- Netlify auto-deploys within 1-2 minutes
- Check deploy logs: `npx netlify watch`

### Port 8888 already in use
```bash
# Kill existing process
npx netlify dev --port 8889
```

### CMS shows blank page or React errors
- Check browser console for errors
- Verify [public/admin/cms.js](public/admin/cms.js) doesn't manipulate `#nc-root` element
- Clear browser cache and hard refresh (Ctrl+Shift+R)

## Environment Variables

No environment variables needed for local dev! Netlify Dev automatically:
- Injects your site's environment variables
- Provides Identity endpoints
- Proxies functions

## Testing Production Behavior

To test exactly as production will behave:
```bash
npm run build        # No-op for static sites
npx netlify deploy --prod --dir=public
```

## Additional Commands

```bash
# Check Netlify site status
npx netlify status

# Open site in browser
npx netlify open

# View deploy logs
npx netlify watch

# Manually trigger deploy
npx netlify deploy --prod
```

## Resources

- [Decap CMS Docs](https://decapcms.org/docs/)
- [Netlify Identity](https://docs.netlify.com/visitor-access/identity/)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)
- [Git Gateway](https://docs.netlify.com/visitor-access/git-gateway/)

---

**Need help?** Check [CHANGELOG.md](public/admin/CHANGELOG.md) for recent fixes or [README.md](public/admin/README.md) for CMS customization details.
