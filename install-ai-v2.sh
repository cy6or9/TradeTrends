#!/bin/bash
# AI V2 System - Manual Installation & Testing Guide
# Run this script to complete the implementation

set -e  # Exit on any error

echo "═══════════════════════════════════════════════════════"
echo "   TradeTrends AI V2 System - Installation Script"
echo "═══════════════════════════════════════════════════════"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
echo "   Running: npm install"
npm install

echo ""
echo "✅ Dependencies installed"
echo ""

# Step 2: Install Playwright browsers
echo "🌐 Step 2: Installing Playwright browsers..."
echo "   Running: npx playwright install chromium"
npx playwright install chromium

echo ""
echo "✅ Playwright browsers installed"
echo ""

# Step 3: Run validation
echo "🔍 Step 3: Running validation..."
echo "   Running: npm run validate"
npm run validate

echo ""
echo "✅ Validation passed"
echo ""

# Step 4: Check if dev server is running
echo "🚀 Step 4: Checking for dev server..."
if curl -s http://localhost:8888 > /dev/null 2>&1; then
    echo "✅ Dev server is running"
    RUN_E2E=true
else
    echo "⚠️  Dev server not detected"
    echo "   To run E2E tests, start dev server in another terminal:"
    echo "   npm run dev"
    echo ""
    echo "   Then run E2E tests manually:"
    echo "   npm run test:e2e"
    echo ""
    RUN_E2E=false
fi

# Step 5: Run E2E tests (if dev server is running)
if [ "$RUN_E2E" = true ]; then
    echo ""
    echo "🎭 Step 5: Running E2E tests..."
    echo "   Running: npm run test:e2e"
    npm run test:e2e
    
    echo ""
    echo "✅ E2E tests passed"
fi

echo ""

# Step 6: Run production monitor (optional)
echo "🌍 Step 6: Testing production..."
echo "   Running: npm run test:production"
echo "   (This tests the live site)"
echo ""

if npm run test:production; then
    echo ""
    echo "✅ Production is healthy"
else
    echo ""
    echo "⚠️  Production check failed (this is OK if site isn't deployed yet)"
fi

echo ""

# Summary
echo "═══════════════════════════════════════════════════════"
echo "   Installation Summary"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "✅ Dependencies installed"
echo "✅ Playwright browsers installed"
echo "✅ Validation passed"

if [ "$RUN_E2E" = true ]; then
    echo "✅ E2E tests passed"
else
    echo "⏳ E2E tests pending (start dev server first)"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "   Next Steps"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. Review the changes:"
echo "   git status --short"
echo ""
echo "2. Stage the files:"
echo "   git add ."
echo ""
echo "3. Review what will be committed:"
echo "   git status"
echo ""
echo "4. STOP and wait for Admin approval before commit/push"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
