#!/bin/bash
# Quick Setup Script for TradeTrends Local Development

set -e

echo "🚀 TradeTrends - Local Development Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if npm packages are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✓ Dependencies installed"
echo ""

# Check if netlify is linked
if [ ! -f ".netlify/state.json" ]; then
    echo "⚠️  Netlify site not linked yet"
    echo ""
    echo "For FULL CMS authentication (recommended):"
    echo "  1. Run: npx netlify login"
    echo "  2. Run: npx netlify link"
    echo "  3. Then run this script again"
    echo ""
    echo "Or skip linking and use local-only mode (see below)"
    echo ""
fi

echo "📋 Available Development Modes:"
echo ""
echo "1️⃣  Full Auth Mode (Recommended)"
echo "   Command: npm run dev"
echo "   • Uses real Netlify Identity login"
echo "   • Full Git Gateway integration"
echo "   • Test with production auth flow"
echo "   • Requires: netlify link (one-time setup)"
echo ""

echo "2️⃣  Local-Only Mode (Quick Testing)"
echo "   Command: npm run dev:full"
echo "   • No authentication required"
echo "   • Direct local file editing"
echo "   • Faster for UI testing"
echo "   • No Netlify linking needed"
echo ""

echo "📖 Documentation:"
echo "   • Full guide: LOCAL_CMS_DEV.md"
echo "   • Quick ref: README.md"
echo ""

echo "🎯 Next Steps:"
echo ""

if [ -f ".netlify/state.json" ]; then
    echo "✓ Netlify site linked!"
    echo ""
    echo "Start development server:"
    echo "  npm run dev"
    echo ""
    echo "Then open: http://localhost:8888/admin/"
    echo ""
    echo "In Codespaces:"
    echo "  1. Check 'Ports' tab"
    echo "  2. Make port 8888 Public"
    echo "  3. Use forwarded URL + /admin/"
else
    echo "Choose a development mode:"
    echo ""
    echo "Option A - Full Auth (requires setup):"
    echo "  npx netlify login"
    echo "  npx netlify link"
    echo "  npm run dev"
    echo ""
    echo "Option B - Local-Only (no setup):"
    echo "  npm run dev:full"
    echo ""
fi

echo "=========================================="
echo "Happy coding! 🎉"
