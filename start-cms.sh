#!/bin/bash
# Clean start for TradeTrends CMS in dual-backend mode
# Kills any running servers on ports 8081 and 8888 before starting

set -e

echo "🧹 Cleaning up existing servers..."

# Kill any existing decap-server processes
if pgrep -f "decap-server" > /dev/null; then
    echo "  ↳ Killing existing decap-server processes..."
    pkill -f "decap-server" || true
    sleep 1
fi

# Kill any existing netlify dev processes  
if pgrep -f "netlify dev" > /dev/null; then
    echo "  ↳ Killing existing netlify dev processes..."
    pkill -f "netlify dev" || true
    sleep 1
fi

# Check if ports are free
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "  ⚠️  Port 8081 still in use, killing process..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "  ⚠️  Port 8888 still in use, killing process..."
    lsof -ti:8888 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo "✅ Ports cleared"
echo ""
echo "🚀 Starting TradeTrends CMS in dual-backend mode..."
echo ""
echo "📦 This will start:"
echo "  • decap-server (port 8081) - Local Git Gateway"
echo "  • netlify dev (port 8888) - Functions + Static Site"
echo ""
echo "📝 CMS will use:"
echo "  • Backend: git-gateway"
echo "  • Branch: content (drafts)"
echo "  • Local backend: Auto-detected when decap-server running"
echo ""
echo "🌐 After startup, visit:"
echo "  http://localhost:8888/admin/"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "────────────────────────────────────────"
echo ""

# Start both servers
npm run dev:cms
