# TradeTrends AI Codex

## System Purpose
TradeTrends is an affiliate-first product discovery engine optimized for Pinterest traffic, Google Discover, and direct product search. Every decision must prioritize:
- Affiliate conversion rate
- Page speed (Lighthouse 90+)
- Pinterest/social virality
- SEO ranking

## Autofix Protocols

### When Build Fails

**Detection:** CI pipeline fails, deployment blocked

**Action Protocol:**
1. Read full GitHub Actions logs
2. Identify root cause (dependency, syntax, missing file, config error)
3. Fix immediately:
   - Bad JSON → Validate & fix syntax
   - Missing dependency → Add to package.json
   - Broken function → Fix logic or remove
   - Config error → Update netlify.toml
4. Commit fix with message: `🤖 AutoFix: [issue description]`
5. Push and re-trigger CI
6. If still fails after 2 attempts → Alert human

**Prevention:**
- Never commit without testing locally
- Always validate JSON before commit
- Run `npm run build` before pushing

---

### When Lighthouse/SEO Is Weak

**Detection:** Lighthouse score <90, poor social previews

**Action Protocol:**

#### Meta Tags (Priority 1)
- Add Open Graph tags to ALL public pages:
  ```html
  <meta property="og:title" content="[Page Title]">
  <meta property="og:description" content="[Deal description]">
  <meta property="og:image" content="[Product image URL]">
  <meta property="og:url" content="[Canonical URL]">
  <meta property="og:type" content="website">
  ```
- Add Twitter Cards:
  ```html
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="[Page Title]">
  <meta name="twitter:description" content="[Description]">
  <meta name="twitter:image" content="[Product image]">
  ```
- Add canonical URL: `<link rel="canonical" href="[URL]">`

#### Performance (Priority 2)
- Compress images to WebP (<100KB each)
- Lazy load all images: `loading="lazy"`
- Minimize CSS (<50KB total)
- Minimize JS (<30KB total)
- Use CDN for external resources
- Add `fetchpriority="high"` to hero images

#### Structured Data (Priority 3)
- Add Product schema for deal pages
- Add BreadcrumbList for navigation
- Add Organization schema on homepage

---

### When Conversion Is Low

**Detection:** Low click-through on affiliate links, high bounce rate

**Action Protocol:**

#### Product Cards
- **Bigger images:** Min 400x400px, show product clearly
- **Stronger headlines:** Use power words (Deal, Save, Limited, Popular)
- **Clear CTAs:** "View on Amazon" → "Shop Now & Save"
- **Urgency:** Add "Limited Time" or "Verified Today" badges
- **Social proof:** Add "Popular" or "Featured" tags

#### Pinterest Optimization
- **Vertical images:** 2:3 aspect ratio (600x900px)
- **Text overlays:** Add deal info to image
- **Rich Pins:** Enable product pins
- **Multiple pins:** Create variations per product

#### Click Path
- **Fewer clicks:** Homepage → Product card → Affiliate link (max 1 click)
- **No popups:** Never interrupt purchase flow
- **Fast load:** <2 seconds to interactive
- **Mobile first:** Touch-friendly buttons (min 44px)

---

### When Analytics Shows Issues

**Action Protocol:**
- Low impressions → Improve SEO meta tags
- High bounce → Improve above-the-fold content
- Low clicks → Make CTAs more prominent
- Slow load → Optimize images & scripts

---

## Emergency Protocols

### Production Down
1. Check Netlify deploy logs
2. Check GitHub Actions
3. Identify failing function
4. Rollback to last working commit if >5min to fix
5. Fix and redeploy

### Affiliate Links Broken
1. Scan all JSON files for broken URLs
2. Test sample links
3. Update broken links immediately
4. Deploy hotfix

### Security Issue
1. Check for exposed keys/tokens
2. Rotate immediately
3. Update environment variables
4. Redeploy

---

## Continuous Improvement

### Weekly Tasks
- Review Lighthouse scores
- Check affiliate click rates
- Optimize slow pages
- Add new high-converting deals
- Remove low-performing deals

### Monthly Tasks
- A/B test CTA copy
- Test new product categories
- Analyze Pinterest traffic
- Update images for seasonal relevance

---

## Code Quality Standards

### HTML
- Semantic tags (article, section, nav)
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text on all images
- ARIA labels for accessibility

### CSS
- Mobile-first responsive
- Use CSS Grid for layouts
- Minimize custom properties
- No inline styles (except dynamic)

### JavaScript
- Vanilla JS preferred (no frameworks)
- Async/defer for scripts
- Error handling on all fetch calls
- No blocking operations

### JSON Data
- Validate before commit
- Required fields: id, title, affiliate_url, image
- Standardize price format
- Include last_verified date

---

## Success Metrics

**Must maintain:**
- Lighthouse Performance: >90
- Lighthouse SEO: >95
- Page load time: <2s
- Mobile usability: 100%
- Affiliate click rate: >5%
- Deploy success rate: >95%

**Red flags:**
- Any build failure
- Missing affiliate links
- Broken images
- 404 errors
- Lighthouse score drop >10 points
