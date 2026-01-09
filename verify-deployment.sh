#!/bin/bash
# Pre-Deployment Verification Script for TradeTrends
# Run this before deploying to production

set -e

echo "🔍 TradeTrends Pre-Deployment Checklist"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Netlify Dev Configuration
echo "1️⃣  Checking npm scripts..."
if grep -q '"dev": "netlify dev"' package.json; then
    echo -e "${GREEN}✓${NC} npm run dev uses 'netlify dev'"
else
    echo -e "${RED}✗${NC} npm run dev does NOT use 'netlify dev'"
    echo "   Fix: Update package.json scripts.dev to 'netlify dev'"
    exit 1
fi

# Check 2: Redirects Configuration
echo ""
echo "2️⃣  Checking netlify.toml redirects..."
if grep -q 'from = "/go/\*"' netlify.toml && grep -q 'to = "/.netlify/functions/go"' netlify.toml; then
    echo -e "${GREEN}✓${NC} /go/* redirect configured"
else
    echo -e "${RED}✗${NC} /go/* redirect missing or incorrect"
    exit 1
fi

if grep -q 'from = "/api/\*"' netlify.toml && grep -q 'to = "/.netlify/functions/api"' netlify.toml; then
    echo -e "${GREEN}✓${NC} /api/* redirect configured"
else
    echo -e "${RED}✗${NC} /api/* redirect missing or incorrect"
    exit 1
fi

# Check 3: Functions Exist
echo ""
echo "3️⃣  Checking Netlify Functions..."
if [ -f "netlify/functions/go.js" ]; then
    echo -e "${GREEN}✓${NC} go.js exists"
else
    echo -e "${RED}✗${NC} go.js missing"
    exit 1
fi

if [ -f "netlify/functions/api.js" ]; then
    echo -e "${GREEN}✓${NC} api.js exists"
else
    echo -e "${RED}✗${NC} api.js missing"
    exit 1
fi

if [ -f "netlify/functions/lib/storage.js" ]; then
    echo -e "${GREEN}✓${NC} storage.js exists"
else
    echo -e "${RED}✗${NC} storage.js missing"
    exit 1
fi

if [ -f "netlify/functions/lib/trends.js" ]; then
    echo -e "${GREEN}✓${NC} trends.js exists"
else
    echo -e "${RED}✗${NC} trends.js missing"
    exit 1
fi

# Check 4: Public Site Links Updated
echo ""
echo "4️⃣  Checking public site uses /go links..."
if grep -q '/go/' public/js/render.js; then
    echo -e "${GREEN}✓${NC} render.js uses /go/* links"
else
    echo -e "${RED}✗${NC} render.js not updated to use /go/* links"
    exit 1
fi

# Check 5: Admin Pages Exist
echo ""
echo "5️⃣  Checking admin pages..."
for page in "public/admin/dashboard.html" "public/admin/trends.html"; do
    if [ -f "$page" ]; then
        echo -e "${GREEN}✓${NC} $page exists"
    else
        echo -e "${RED}✗${NC} $page missing"
        exit 1
    fi
done

# Check 6: Travelpayouts Script
echo ""
echo "6️⃣  Checking Travelpayouts verification script..."
if grep -q "emrldtp.cc/NDg3NDU2" public/index.html; then
    echo -e "${GREEN}✓${NC} Travelpayouts script in index.html"
else
    echo -e "${YELLOW}⚠${NC}  Travelpayouts script missing from index.html"
fi

# Check 7: Dependencies
echo ""
echo "7️⃣  Checking package dependencies..."
if [ -f "package.json" ]; then
    if grep -q "@netlify/blobs" package.json; then
        echo -e "${GREEN}✓${NC} @netlify/blobs dependency present"
    else
        echo -e "${YELLOW}⚠${NC}  @netlify/blobs missing (will use file storage)"
    fi
    
    if grep -q "netlify-cli" package.json; then
        echo -e "${GREEN}✓${NC} netlify-cli dependency present"
    else
        echo -e "${RED}✗${NC} netlify-cli missing"
        exit 1
    fi
fi

# Check 8: Environment Variables Warning
echo ""
echo "8️⃣  Environment Variables Check..."
echo -e "${YELLOW}⚠${NC}  IMPORTANT: Set these in Netlify UI before deploying:"
echo "   • TT_SALT - Random string for IP hashing (required for security)"
echo "   Example: TT_SALT=your-random-secure-salt-string-here"

# Check 9: Git Status
echo ""
echo "9️⃣  Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠${NC}  Uncommitted changes detected:"
    git status --short
    echo ""
    echo "   Consider committing before deployment"
else
    echo -e "${GREEN}✓${NC} All changes committed"
fi

# Check 10: Data Files
echo ""
echo "🔟  Checking data files..."
if [ -f "public/data/amazon.json" ] && [ -f "public/data/travel.json" ]; then
    AMAZON_COUNT=$(cat public/data/amazon.json | grep -o '"id"' | wc -l)
    TRAVEL_COUNT=$(cat public/data/travel.json | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓${NC} Amazon deals: $AMAZON_COUNT items"
    echo -e "${GREEN}✓${NC} Travel promos: $TRAVEL_COUNT items"
else
    echo -e "${RED}✗${NC} Data files missing"
    exit 1
fi

# Summary
echo ""
echo "========================================"
echo "✅ Pre-Deployment Checks Complete!"
echo ""
echo "📋 Manual Checks Required:"
echo ""
echo "1. Local Testing Checklist:"
echo "   □ Run: npm run dev"
echo "   □ Visit: http://localhost:8888/"
echo "   □ Click 2-3 deals on homepage"
echo "   □ Visit: http://localhost:8888/admin/dashboard.html"
echo "   □ Verify: Total clicks > 0"
echo "   □ Check: .netlify/state/tt_clicks.json exists"
echo ""
echo "2. Admin Access Test:"
echo "   □ Visit: http://localhost:8888/admin/"
echo "   □ Login with Netlify Identity"
echo "   □ Verify: You have 'admin' role"
echo "   □ Visit: http://localhost:8888/admin/trends.html"
echo "   □ Click: 'Refresh Trends' button"
echo "   □ Verify: Data loads without 403 error"
echo ""
echo "3. Before Deploying:"
echo "   □ Set TT_SALT in Netlify UI (Site Settings → Environment Variables)"
echo "   □ Verify Git Gateway is enabled"
echo "   □ Verify Netlify Identity is enabled"
echo "   □ Check your user has 'admin' role in Identity settings"
echo ""
echo "4. After Deployment:"
echo "   □ Visit live site and click a deal"
echo "   □ Check /admin/dashboard.html shows clicks"
echo "   □ Test trends refresh (admin-only)"
echo "   □ Verify Travelpayouts script loads on all pages"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Deploy commands:"
echo "  git push                    # Auto-deploys via GitHub integration"
echo "  OR"
echo "  npx netlify deploy --prod  # Manual deploy via CLI"
