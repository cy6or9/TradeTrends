# TradeTrends Safety Rules

## 🚨 CRITICAL - NEVER DO THIS

### Revenue Protection
1. ❌ NEVER delete revenue-producing pages (index.html, amazon.html, travel.html)
2. ❌ NEVER remove affiliate links from product cards
3. ❌ NEVER remove click tracking (/go redirects)
4. ❌ NEVER remove analytics scripts
5. ❌ NEVER break the /api/analytics endpoint
6. ❌ NEVER commit placeholder affiliate URLs (example.com, placeholder.com)

### Deployment Protection
7. ❌ NEVER push code that breaks `npm run build`
8. ❌ NEVER block Netlify deployment pipeline
9. ❌ NEVER commit invalid JSON files
10. ❌ NEVER remove netlify.toml or corrupt redirects
11. ❌ NEVER push unfinished features to main branch
12. ❌ NEVER remove environment variable documentation

### Data Integrity
13. ❌ NEVER delete public/data/amazon.json or public/data/travel.json
14. ❌ NEVER remove required fields from deal objects (id, title, affiliate_url, image)
15. ❌ NEVER commit deals without verification

### User Experience
16. ❌ NEVER add popups or interstitials
17. ❌ NEVER slow down page load with heavy scripts
18. ❌ NEVER break mobile responsiveness
19. ❌ NEVER remove SEO meta tags once added

### Security
20. ❌ NEVER commit API keys or secrets
21. ❌ NEVER expose admin endpoints publicly
22. ❌ NEVER disable authentication on admin pages in production
23. ❌ NEVER remove rate limiting

---

## ✅ ALWAYS DO THIS

### Before Every Commit
1. ✅ Run `npm run build` locally
2. ✅ Validate all JSON files
3. ✅ Test affiliate links manually
4. ✅ Check that images load
5. ✅ Test on mobile viewport
6. ✅ Verify no console errors

### On Every Deploy
1. ✅ Wait for CI to pass
2. ✅ Check Netlify deploy preview
3. ✅ Test affiliate click flow
4. ✅ Verify analytics tracking
5. ✅ Check Lighthouse score

### For Every New Feature
1. ✅ Test in dev mode first
2. ✅ Ensure backwards compatibility
3. ✅ Document in commit message
4. ✅ Add to .ai/codex.md if significant
5. ✅ Verify production build works

---

## 🎯 PRODUCTION READINESS CHECKLIST

### Every Page Must Have:
- [ ] Valid HTML5 structure
- [ ] Title tag (unique per page)
- [ ] Meta description
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Canonical URL
- [ ] Responsive viewport meta
- [ ] Favicon link
- [ ] Analytics tracking
- [ ] Netlify Identity (if admin page)

### Every Deal Must Have:
- [ ] Unique ID
- [ ] Title (non-empty, not "New Deal")
- [ ] Working affiliate URL (not example.com)
- [ ] Image URL (accessible, <500KB)
- [ ] Category
- [ ] Network (amazon/travel)
- [ ] Price hint (if Amazon)
- [ ] Last verified date

### Every Function Must:
- [ ] Handle errors gracefully
- [ ] Return proper status codes
- [ ] Have CORS headers if needed
- [ ] Log errors for debugging
- [ ] Have rate limiting if public

---

## 🔥 EMERGENCY PROTOCOLS

### If Production Breaks
1. Check Netlify deploy logs immediately
2. If fixable in <5 minutes → Fix and hotfix deploy
3. If not → Rollback to last working commit
4. Post-mortem: Document what broke and how to prevent

### If Affiliate Links Stop Working
1. CRITICAL: Fix immediately (revenue impact)
2. Test /go function locally
3. Check netlify.toml redirects
4. Verify deal JSON has correct URLs
5. Deploy hotfix ASAP

### If Analytics Stops
1. Check if tracking script loads
2. Verify /api/analytics responds
3. Check Netlify function logs
4. Fix and deploy within 1 hour

### If SEO Tanks
1. Check robots.txt not blocking
2. Verify meta tags present
3. Check sitemap.xml valid
4. Ensure canonical URLs correct
5. Submit to Google Search Console

---

## 📊 MONITORING REQUIREMENTS

### Daily Checks (Automated)
- CI pipeline status
- Netlify deployment status
- API function health
- JSON file validity

### Weekly Checks (Manual)
- Lighthouse scores
- Affiliate click rate
- Page load times
- Image loading
- Mobile usability

### Monthly Checks (Manual)
- Google Search Console data
- Pinterest analytics
- Revenue per click
- Top performing deals
- Remove dead deals

---

## 🛠️ ALLOWED CHANGES

### Safe Changes (No Review Needed)
- Adding new deals to JSON
- Updating deal images
- Fixing typos
- Updating meta descriptions
- Optimizing images
- Improving CTA copy
- Adding structured data

### Risky Changes (Test Thoroughly)
- Modifying render.js logic
- Changing netlify.toml redirects
- Updating Netlify functions
- Changing CSS layout significantly
- Adding new dependencies

### Forbidden Changes (Human Approval Required)
- Removing affiliate tracking
- Changing authentication flow
- Modifying payment/monetization logic
- Disabling analytics
- Removing SEO infrastructure

---

## 🎓 BEST PRACTICES

### Commit Messages
- Use conventional commits: `fix:`, `feat:`, `chore:`
- Be specific: "Fix amazon.json syntax error" not "Fix bug"
- Reference issues: "Closes #123"
- Use emoji for AI commits: `🤖 AutoFix:`, `🚀 Deploy:`, `♻️ Refactor:`

### Code Organization
- Keep functions small (<100 lines)
- One function per file when possible
- Comment complex logic
- Remove dead code immediately

### Performance
- Images: WebP format, <100KB
- CSS: Single file, <50KB
- JS: Vanilla when possible, <30KB per file
- HTML: Minify in production

### SEO
- Unique title per page (50-60 chars)
- Meta description (150-160 chars)
- H1 tag on every page (only one)
- Alt text on all images
- Internal linking between pages

---

## 🚀 DEPLOYMENT FLOW

### Development
1. Make changes locally
2. Test with `netlify dev`
3. Validate JSON
4. Run build command
5. Check for console errors

### Staging (if needed)
1. Push to develop branch
2. Wait for CI to pass
3. Check deploy preview
4. Test affiliate flow
5. Verify analytics

### Production
1. Merge to main
2. Wait for CI to pass
3. Netlify auto-deploys
4. Monitor deploy logs
5. Quick smoke test (homepage, 1 affiliate link)

---

## ⚠️ WARNING SIGNS

### Immediate Action Required
- CI failing on main branch
- Netlify deploy failed
- 500 errors on any page
- Affiliate links returning 404
- Analytics not tracking

### Investigation Needed
- Lighthouse score drops >10 points
- Page load >3 seconds
- Affiliate click rate drops >50%
- High bounce rate (>70%)
- Low session duration (<30s)

### Nice to Fix
- Lighthouse score 85-89
- Images could be optimized further
- Minor CSS improvements
- Copy tweaks for conversion

---

## 📝 DOCUMENTATION RULES

1. Update .ai/codex.md for major changes
2. Update README.md for user-facing changes
3. Delete outdated .md files (keep docs lean)
4. Comment complex code inline
5. Keep netlify.toml comments updated
