#!/bin/bash
# Test dual-backend CMS configuration

echo "🧪 Testing Dual-Backend CMS Configuration"
echo "=========================================="
echo ""

# Check 1: Configuration files
echo "1️⃣  Checking configuration files..."

if grep -q "local_backend: true" public/admin/config.yml; then
    echo "   ✅ local_backend enabled in config.yml"
else
    echo "   ❌ local_backend NOT enabled"
    exit 1
fi

if grep -q "publish_mode: editorial_workflow" public/admin/config.yml; then
    echo "   ✅ editorial_workflow enabled"
else
    echo "   ❌ editorial_workflow NOT enabled"
    exit 1
fi

# Check 2: Scripts
echo ""
echo "2️⃣  Checking package.json scripts..."

if grep -q '"cms".*"decap-server"' package.json; then
    echo "   ✅ npm run cms script exists"
else
    echo "   ❌ cms script missing"
    exit 1
fi

if grep -q '"dev:cms"' package.json; then
    echo "   ✅ npm run dev:cms script exists"
else
    echo "   ❌ dev:cms script missing"
    exit 1
fi

# Check 3: Dependencies
echo ""
echo "3️⃣  Checking dependencies..."

if grep -q "decap-server" package.json; then
    echo "   ✅ decap-server installed"
else
    echo "   ❌ decap-server missing"
    exit 1
fi

if grep -q "concurrently" package.json; then
    echo "   ✅ concurrently installed"
else
    echo "   ❌ concurrently missing"
    exit 1
fi

# Check 4: Gitignore
echo ""
echo "4️⃣  Checking .gitignore..."

if grep -q ".decaps/" .gitignore; then
    echo "   ✅ .decaps/ in .gitignore"
else
    echo "   ❌ .decaps/ NOT in .gitignore"
    exit 1
fi

# Check 5: Auto-detection script
echo ""
echo "5️⃣  Checking auto-detection script..."

if grep -q "window.CMS_LOCAL_BACKEND = true" public/admin/index.html; then
    echo "   ✅ Auto-detection script present"
else
    echo "   ❌ Auto-detection script missing"
    exit 1
fi

# Check 6: Banners
echo ""
echo "6️⃣  Checking UI banners..."

if grep -q "local-cms-banner" public/admin/index.html; then
    echo "   ✅ Local CMS mode banner present"
else
    echo "   ❌ Local CMS mode banner missing"
    exit 1
fi

if grep -q "dev-notice" public/admin/index.html; then
    echo "   ✅ Dev environment notice present"
else
    echo "   ❌ Dev environment notice missing"
    exit 1
fi

# Summary
echo ""
echo "=========================================="
echo "✅ All configuration checks passed!"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "Option 1: Full production simulation"
echo "  $ npm run dev"
echo "  Then visit: http://localhost:8888/admin/"
echo ""
echo "Option 2: Local-only mode (no auth)"
echo "  $ npm run cms"
echo "  Then open admin in browser"
echo ""
echo "Option 3: Combined (recommended for Codespaces)"
echo "  $ npm run dev:cms"
echo "  Then visit: http://localhost:8888/admin/"
echo ""
echo "📚 Documentation:"
echo "  - DUAL_BACKEND_CMS.md - Complete guide"
echo "  - LOCAL_CMS_DEV.md - Quick reference"
echo ""
