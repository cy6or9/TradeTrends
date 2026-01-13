# Pre-Deployment Checklist

Run these commands before every deployment to catch errors early:

## 1. Validation Scripts
```bash
# Run all validations
npm run validate

# Run deployment-specific checks
npm run validate:deploy
```

## 2. Analytics Tests
```bash
# Test analytics dashboard error handling
npm run test:analytics

# Run all E2E tests
npm run test:e2e
```

## 3. Manual Verification

### Admin Dashboard (`/admin/dashboard.html`)
- [ ] Loads without console errors
- [ ] Shows initialization state when no data
- [ ] Tables display "No data yet" when empty
- [ ] No "NaN" or "Infinity" displayed
- [ ] Revenue health section loads
- [ ] Percentages are 0-100%

### All Admin Pages
- [ ] Header renders correctly
- [ ] Edit dropdown works
- [ ] Navigation links work
- [ ] No stuck loading spinners

### Public Pages
- [ ] Homepage carousels load
- [ ] Products page loads
- [ ] Activities page loads
- [ ] More menu works
- [ ] All navigation links work

## 4. Console Check

Open browser console on each page:
- [ ] No red errors (excluding known: identity.netlify.com, emrldtp.cc, favicon)
- [ ] No "map is not a function" errors
- [ ] No "Cannot read property" errors
- [ ] No unhandled promise rejections

## 5. Common Errors to Watch For

### ❌ Unsafe Array Operations
```javascript
// BAD
data.items.map(item => ...)

// GOOD
(Array.isArray(data.items) && data.items.length > 0) 
  ? data.items.map(item => ...) 
  : []
```

### ❌ Division by Zero
```javascript
// BAD
const percent = clicks / total * 100;

// GOOD
const percent = total > 0 ? clicks / total * 100 : 0;
```

### ❌ Missing Null Checks
```javascript
// BAD
const value = data.property;

// GOOD
const value = data?.property || 0;
```

### ❌ Unescaped HTML
```javascript
// BAD
innerHTML = `<div>${userInput}</div>`;

// GOOD
innerHTML = `<div>${escapeHtml(userInput)}</div>`;
```

## 6. If Tests Fail

### Validation Errors
```bash
npm run validate:deploy
```
Fix any warnings before deploying. Errors block deployment.

### E2E Test Failures
```bash
npm run test:analytics -- --debug
```
Check console output for details.

### Production Issues
```bash
npm run test:production
```
Verify live site after deployment.

## 7. Emergency Rollback

If errors appear in production:
1. Check Netlify deployment history
2. Click "Rollback to this deploy" on previous working version
3. Investigate locally before redeploying

## 8. Deployment Command

When all checks pass:
```bash
git add -A
git commit -m "Your commit message"
git push origin main
```

Netlify auto-deploys from main branch.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run validate` | Syntax validation |
| `npm run validate:deploy` | Pre-deployment checks |
| `npm run test:analytics` | Analytics dashboard tests |
| `npm run test:e2e` | All E2E tests |
| `npm run test:production` | Post-deployment verification |
| `npm run dev` | Local development server |

---

**Remember:** Prevention is better than rollback! Always run validations before deploying.
