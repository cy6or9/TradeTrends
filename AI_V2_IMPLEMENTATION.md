# AI V2 System - Complete Implementation Guide

## Overview

The AI V2 system is a comprehensive revenue protection framework for TradeTrends. It prevents code changes that would break affiliate revenue flow through automated testing, validation, and deployment gates.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI V2 Revenue Protection                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │    LAYER 1: Real User Behavior Tests    │
        │    tests/e2e/revenue.spec.js            │
        │    - Click affiliate links              │
        │    - Follow redirects                   │
        │    - Verify Amazon/Travel destination   │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │    LAYER 2: Production Monitoring       │
        │    scripts/check-production.js          │
        │    - Test live /go function             │
        │    - Verify 302 redirects               │
        │    - Validate final destinations        │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │    LAYER 3: AI Memory System            │
        │    .ai/*.json                           │
        │    - Business rules                     │
        │    - Blocked patterns                   │
        │    - Incident history                   │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │    LAYER 4: Canary Deployment           │
        │    .github/workflows/                   │
        │    - PR previews                        │
        │    - Test before merge                  │
        │    - Automatic rollback                 │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │    LAYER 5: Revenue-Level Validation    │
        │    scripts/validate.js                  │
        │    - No empty affiliate URLs            │
        │    - No placeholder data                │
        │    - Correct /go routing                │
        └─────────────────────────────────────────┘
```

## Quick Start

### Installation

```bash
# Install dependencies (including Playwright)
npm install

# Install Playwright browsers (first time only)
npx playwright install chromium
```

### Running Tests

```bash
# Run all validation
npm run validate

# Run E2E tests (requires Netlify dev server)
npm run test:e2e

# Run production monitoring
npm run test:production

# Run everything
npm test
```

## Layer 1: E2E Revenue Tests

**File:** `tests/e2e/revenue.spec.js`  
**Purpose:** Simulates real user clicks and verifies affiliate revenue flow

### What It Tests

1. **Amazon Link Flow**
   - Clicks "View on Amazon" button
   - Verifies href contains `/go?network=amazon&id=X`
   - Opens new tab (target="_blank")
   - Follows redirects
   - Asserts final URL is Amazon domain

2. **Travel Link Flow**
   - Same flow for travel deals
   - Verifies Booking/TravelPayouts destination

3. **API Tests**
   - Direct /go function call
   - Verifies 302 redirect response
   - Checks Location header

4. **Regression Tests**
   - No broken `/?network=` patterns
   - At least one deal exists
   - Links use correct format

### Running Locally

```bash
# Start dev server in one terminal
npm run dev

# Run tests in another terminal
npx playwright test

# Or let the test runner start the server automatically
npm run test:e2e
```

### CI Integration

Tests run automatically on every PR via GitHub Actions. See `.github/workflows/canary-deployment.yml`.

## Layer 2: Production Monitoring

**File:** `scripts/check-production.js`  
**Purpose:** Verifies live production /go function is working

### What It Checks

1. **Homepage Accessibility**
   - `https://tradetrend.netlify.app` returns 200

2. **Amazon Network**
   - `/go?network=amazon&id=test` returns 302
   - Location header points to Amazon
   - Final destination is amazon.com or amzn.to

3. **Travel Network**
   - Same checks for travel network
   - Validates booking.com or travelpayouts.com destination

### Running

```bash
# Check production right now
npm run test:production

# Should output:
# ✅ Homepage is accessible
# ✅ amazon: Returns 302 redirect
# ✅ amazon: Final destination is valid affiliate partner
# ✅ travel: Returns 302 redirect
# ✅ travel: Final destination is valid affiliate partner
```

### GitHub Actions Integration

Runs automatically:
- After every push to `main` branch
- Creates a GitHub Issue if it fails
- Labels: `critical`, `revenue`, `production`

## Layer 3: AI Memory System

**Directory:** `.ai/`  
**Purpose:** Teach AI assistants about business context and prevent repeated mistakes

### Files

#### business.json
The "constitution" - defines what matters:
- Primary goal: affiliate revenue
- Must never break: /go function, redirects, SEO
- Critical files and their roles
- Deployment blocking conditions

#### blocked-patterns.json
Patterns that have caused failures:
- `href="/?network="` - broken URL pattern
- `/go redirect without 200!` - allows override
- Empty affiliate URLs
- Placeholder data in production

Used by `scripts/validate.js` to block known bad patterns.

#### known-good.json
Reference configurations:
- Last known good commit
- Validated redirect structure
- Function configurations
- Test timestamps

#### history.json
Incident log:
- When failures occurred
- What broke
- Root cause
- How it was fixed
- Prevention added

### AI Usage Instructions

**Before making changes:**
```javascript
// 1. Read business context
const business = require('./.ai/business.json');
console.log('Primary goal:', business.primaryGoal);

// 2. Check blocked patterns
const blocked = require('./.ai/blocked-patterns.json');
// Don't use patterns in blocked.patterns[]

// 3. Reference known-good
const knownGood = require('./.ai/known-good.json');
// Compare your changes against these
```

**After a failure:**
```javascript
// 1. Add to history.json
{
  "timestamp": "2026-01-12T10:30:00Z",
  "severity": "CRITICAL",
  "type": "redirect_failure",
  "description": "/go redirect stopped working",
  "affectedFiles": ["public/_redirects"],
  "rootCause": "Catch-all rule came before /go rule",
  "fix": "Moved /go rules above /* catch-all",
  "preventionAdded": "Added precedence check to validate.js"
}

// 2. Add to blocked-patterns.json
{
  "pattern": "/*  /index.html  200\\n/go",
  "reason": "Catch-all before /go - wrong order",
  "blockedAt": "2026-01-12",
  "severity": "CRITICAL"
}
```

## Layer 4: Canary Deployment

**File:** `.github/workflows/canary-deployment.yml`  
**Purpose:** Test changes in preview before production

### Workflow Steps

1. **Validate** - Run `scripts/validate.js`
2. **Build** - Generate production assets
3. **E2E Tests** - Run Playwright tests
4. **Deploy Canary** - Deploy to Netlify preview
5. **Test Canary** - Test /go on preview URL
6. **Monitor Production** - Check production after merge

### Pull Request Flow

```bash
# Developer creates PR
git checkout -b feature/new-deals
git add .
git commit -m "Add new deals"
git push origin feature/new-deals

# GitHub Actions automatically:
# 1. Validates code
# 2. Builds site
# 3. Runs E2E tests
# 4. Deploys to pr-123--tradetrend.netlify.app
# 5. Tests the preview
# 6. Comments on PR with results

# If ALL tests pass:
# ✅ Safe to merge

# If ANY test fails:
# ❌ Fix required - revenue at risk
```

### Creating Canary Branch

```bash
# Create canary branch from main
git checkout main
git pull
git checkout -b canary
git push origin canary

# Now all PRs will:
# 1. Deploy to canary domain
# 2. Run full test suite
# 3. Only allow merge if passing
```

## Layer 5: Revenue-Level Validation

**File:** `scripts/validate.js` (extended)  
**Purpose:** Catch revenue-breaking issues before deployment

### New Validations

1. **Deal Inventory**
   - ❌ Empty affiliate_url
   - ❌ Placeholder URLs (example.com)
   - ⚠️ Direct Amazon links (should use /go)

2. **Sitemap**
   - ❌ Contains localhost URLs
   - ⚠️ Missing required pages

3. **AI Memory System**
   - ❌ Invalid JSON in .ai/ files
   - ❌ Blocked patterns detected in code
   - ⚠️ Missing recommended patterns

4. **Redirect Rules** (already existed, now stricter)
   - ❌ Missing /go or /go/* rules
   - ❌ Missing 200! force flag
   - ❌ Wrong precedence order

### Running

```bash
npm run validate

# Output includes:
# 📄 Validating HTML files...
# 📦 Validating data files...
# 🗺️  Validating sitemap...
# 🤖 Validating AI memory system...
# 🔗 Validating affiliate link routing...
# 📊 Validation Summary
```

## Complete Test Workflow

```bash
# 1. Make changes to code
vim public/data/amazon.json

# 2. Run validation
npm run validate

# 3. Start dev server
npm run dev

# 4. Run E2E tests (in another terminal)
npm run test:e2e

# 5. If all pass, stage changes
git add .
git status --short

# 6. STOP - wait for admin approval
# Admin reviews changes and runs:
git commit -m "Add new Amazon deals"
git push origin main

# 7. GitHub Actions automatically:
#    - Deploys to production
#    - Waits 60 seconds
#    - Runs production monitor
#    - Alerts if anything fails
```

## Maintenance

### Adding New Blocked Patterns

When a new type of failure is discovered:

```bash
# Edit .ai/blocked-patterns.json
{
  "patterns": [
    {
      "pattern": "new-bad-pattern",
      "reason": "Why this breaks revenue",
      "blockedAt": "2026-01-12",
      "severity": "CRITICAL"
    }
  ]
}

# Validation script will automatically check it
npm run validate
```

### Updating Business Rules

```bash
# Edit .ai/business.json
{
  "mustNeverBreak": [
    "existing items...",
    "new critical component"
  ]
}
```

### Recording Incidents

```bash
# Edit .ai/history.json - append new incident
{
  "incidents": [
    {
      "timestamp": "2026-01-12T10:30:00Z",
      "severity": "CRITICAL",
      "type": "redirect_failure",
      "description": "What broke",
      "rootCause": "Why",
      "fix": "How it was resolved",
      "preventionAdded": "What validation/test was added"
    }
  ]
}
```

## Troubleshooting

### E2E Tests Failing

```bash
# Check if dev server is running
curl http://localhost:8888

# View test report
npx playwright show-report

# Run in headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test --debug
```

### Production Monitor Failing

```bash
# Check production directly
curl -I https://tradetrend.netlify.app/go?network=amazon&id=test

# Should see:
HTTP/2 302
location: https://amazon.com/...

# If you see 200 or different status, /go function is broken
```

### Validation Failing

```bash
# See full output
npm run validate

# Check specific file
node -e "console.log(JSON.parse(require('fs').readFileSync('public/data/amazon.json')))"

# Check _redirects order
cat public/_redirects
```

## Success Criteria

✅ **System is working when:**
- `npm run validate` passes with 0 errors
- `npm run test:e2e` passes all tests
- `npm run test:production` confirms live redirects work
- GitHub Actions deploy without failures
- No revenue-related issues are filed

❌ **System needs attention when:**
- Any validation errors appear
- E2E tests fail
- Production monitor creates GitHub Issue
- Affiliate links don't redirect correctly
- Revenue metrics drop unexpectedly

## Emergency Response

If production is broken:

```bash
# 1. Check production status
npm run test:production

# 2. If failing, check recent deploys
# View Netlify deploy log

# 3. Quick fix: revert last commit
git revert HEAD
git push origin main

# 4. Or: rollback in Netlify UI
# Deploys → Previous deploy → Publish

# 5. After service restored, investigate
# Check .ai/history.json
# Add incident record
# Update blocked-patterns.json
# Add new validation check
```

## Future Enhancements

- [ ] Add Slack/Discord alerts for production failures
- [ ] Implement automatic rollback on monitor failure
- [ ] Add revenue metrics tracking (click-through rate)
- [ ] Create dashboard for historical incident data
- [ ] Add visual regression testing for UI changes
- [ ] Implement A/B testing for button placement
- [ ] Add performance monitoring (Core Web Vitals)
