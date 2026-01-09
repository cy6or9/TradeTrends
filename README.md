# TradeTrends Deals (Static HTML + Admin Dashboard)

This is a **fast, Pinterest-friendly affiliate site** (dark theme) with an **admin-only dashboard** at `/admin/`.

## What you get
- Public site (fast static HTML):  
  - `/` (hub)  
  - `/amazon.html`  
  - `/travel.html`
- Data-driven content:
  - `data/amazon.json`
  - `data/travel.json`
- Admin dashboard:
  - `/admin/` (Decap CMS + Netlify Identity)

## Deploy to Netlify (recommended)
1. Create a new GitHub repo and upload this project (or drag-and-drop the `public/` folder + `data/` + `netlify.toml` in Netlify).
2. In Netlify:
   - Site settings → **Identity** → Enable Identity
   - Identity → **Invite users** → invite: `ipromoteliving@gmail.com`
   - Identity → Settings → **Registration** = *Invite only*
   - Identity → Services → Enable **Git Gateway**
3. In Identity:
   - Add your user role as `admin` (Identity → Users → your user → Roles → add `admin`)
4. Visit:
   - Public: your Netlify URL
   - Admin: `https://YOUR_SITE.netlify.app/admin/`

## Update deals
- Login to `/admin/`
- Edit **Amazon Deals** and **Travel Promos**
- Save/publish changes (writes to `data/*.json` in your repo)
- Public pages read the JSON and update immediately.

## Replace placeholder affiliate links
The sample data uses placeholder URLs.
Replace `affiliate_url` values with your real affiliate links.

## Notes
- Public pages are optimized for speed: static HTML + tiny JS renderer.
- Images are pulled from Unsplash via URL for demo. You can swap to your own images or Amazon-approved creatives.
