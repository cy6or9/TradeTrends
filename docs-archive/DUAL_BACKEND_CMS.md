# Dual-Backend CMS Configuration

## Overview

TradeTrends CMS now supports **two backend modes**:

1. **Production Mode** (Git Gateway) - Used in deployed site
2. **Local Mode** (Local Backend) - Used in Codespaces/local development

This allows you to test and edit content locally without requiring Netlify deployment.

---

## 🏗️ Architecture

### Production (Deployed on Netlify)
```
Browser → Decap CMS → Git Gateway → GitHub (content branch)
                    ↓
              Netlify Identity (authentication)
```

### Local Development (Codespaces)
```
Browser → Decap CMS → Local Backend Server (port 8081) → Local files
```

---

## 🚀 Usage

### Option 1: Full Production Simulation (Recommended)

Uses Netlify Dev with Identity + Git Gateway:

```bash
npm run dev
```

Then visit: `http://localhost:8888/admin/`

**Features:**
- ✅ Real Netlify Identity authentication
- ✅ Writes to `content` branch via Git Gateway
- ✅ Full production parity
- ❌ Requires `netlify link` setup (one-time)

**When to use:** Testing the full workflow before deploying

---

### Option 2: Local-Only Mode (No Authentication)

Uses local backend server without Netlify:

```bash
npm run cms
```

Then in a **separate terminal or tab**:
```bash
npm run dev
# OR just open public/admin/index.html in browser
```

Or run both together:
```bash
npm run dev:cms
```

Then visit: `http://localhost:8888/admin/` (or `http://localhost:8000/admin/` if using simple HTTP server)

**Features:**
- ✅ No authentication needed
- ✅ Instant local file editing
- ✅ Works in Codespaces without Netlify setup
- ❌ Changes stored in `.decaps/` (local only)
- ❌ NOT pushed to Git automatically

**When to use:** Quick content edits, testing CMS UI, Codespaces development

---

## 📋 Setup Guide

### First-Time Setup (Both Modes)

```bash
# Install dependencies
npm install

# Dependencies installed:
# - decap-server (local backend proxy)
# - netlify-cli (for production simulation)
# - concurrently (run multiple servers)
```

### Option 1 Setup: Netlify Dev Mode

```bash
# One-time: Login to Netlify
npx netlify login

# One-time: Link to your Netlify site
npx netlify link

# Now you can run:
npm run dev
```

### Option 2 Setup: Local-Only Mode

No setup needed! Just run:
```bash
npm run cms
```

---

## 🎯 Configuration Details

### config.yml Settings

```yaml
backend:
  name: git-gateway        # Production backend
  branch: content          # Draft branch

local_backend: true        # Enable local mode
publish_mode: editorial_workflow  # Draft/Review/Ready workflow
```

**How it works:**
- Decap auto-detects if local backend server is running (port 8081)
- If yes → uses local backend
- If no → falls back to git-gateway

### Auto-Detection Script

In `public/admin/index.html`:

```javascript
// Detects Codespaces/localhost
if (hostname.includes('app.github.dev') || hostname === 'localhost') {
  window.CMS_LOCAL_BACKEND = true;
}
```

### Visual Indicators

When using local backend, you'll see:

```
🔧 LOCAL CMS MODE — CHANGES NOT PUBLISHED TO GIT
```

This banner appears when local backend server is detected.

---

## 📂 File Storage

### Production (Git Gateway)
- Changes committed to: `content` branch
- Stored in: GitHub repository
- Merge to `main` to publish

### Local Backend
- Changes stored in: `.decaps/` folder (gitignored)
- NOT committed to Git automatically
- Purely local drafts

---

## 🔄 Workflow Comparison

### Production Workflow (npm run dev)
```
1. Edit in CMS
2. Click "Publish"
3. → Commits to 'content' branch
4. Create PR: content → main
5. Merge to deploy
```

### Local Workflow (npm run cms)
```
1. Edit in CMS
2. Click "Publish"
3. → Saves to .decaps/ folder
4. Changes stay local (testing only)
```

---

## ⚠️ Important Notes

### When Using Local Backend

1. **Changes are NOT saved to Git** - They're stored in `.decaps/` folder
2. **Use for testing only** - Don't rely on local backend for permanent changes
3. **No authentication** - Anyone can edit (local only, not a security issue)
4. **Editorial workflow** - You'll see Draft/In Review/Ready states

### When Using Netlify Dev

1. **Requires Netlify account** - Must run `netlify link` first
2. **Writes to content branch** - Real Git commits
3. **Full authentication** - Uses Netlify Identity
4. **Production parity** - Identical to deployed site

---

## 🐛 Troubleshooting

### "Local backend not detected"

**Problem:** CMS shows Git Gateway login even in local mode

**Solutions:**
1. Ensure `npm run cms` is running in background
2. Check that port 8081 is not blocked
3. Visit `http://localhost:8081/api/v1` - should return JSON
4. Restart CMS: Kill `npm run cms` and restart

### "Cannot connect to localhost:8081"

**Problem:** Local backend server not starting

**Solutions:**
```bash
# Check if port is in use
lsof -i :8081

# Kill process if needed
kill -9 <PID>

# Restart
npm run cms
```

### "Changes not appearing in .decaps/"

**Problem:** Using git-gateway instead of local backend

**Check:**
```bash
# Should exist and be running:
ps aux | grep decap-server

# Should return JSON:
curl http://localhost:8081/api/v1
```

**Fix:** Banner should show "LOCAL CMS MODE" - if not, local backend isn't active

### "Git Gateway login in Codespaces"

**Problem:** CMS prompts for Netlify login in Codespaces

**Cause:** Local backend server not running or not detected

**Fix:**
```bash
# Terminal 1: Start local backend
npm run cms

# Terminal 2: Wait 5 seconds, then start dev server
npm run dev

# Or use combined command:
npm run dev:cms
```

---

## 🔐 Security

### Production
- ✅ Netlify Identity authentication required
- ✅ Admin role enforcement
- ✅ Git Gateway handles permissions
- ✅ All changes audited in Git history

### Local Development
- ⚠️ No authentication (local files only)
- ⚠️ Anyone with access to dev server can edit
- ✅ Not a security concern (localhost/Codespaces only)
- ✅ Changes don't affect production

---

## 📊 Decision Matrix

| Need | Use Mode | Command |
|------|----------|---------|
| Test CMS UI | Local Backend | `npm run cms` |
| Quick content edit | Local Backend | `npm run cms` |
| Codespaces development | Local Backend | `npm run dev:cms` |
| Pre-production testing | Netlify Dev | `npm run dev` |
| Validate publishing workflow | Netlify Dev | `npm run dev` |
| Test Identity/auth | Netlify Dev | `npm run dev` |

---

## 📚 Related Documentation

- [PUBLISHING_WORKFLOW.md](../PUBLISHING_WORKFLOW.md) - How to publish content to live site
- [LOCAL_DEVELOPMENT.md](../LOCAL_DEVELOPMENT.md) - Full local dev guide
- [README.md](../README.md) - Project overview

---

## 🎓 Quick Start Examples

### Example 1: Quick Content Edit in Codespaces

```bash
# Start local CMS server
npm run cms

# Open browser to forwarded port
# Edit deals in CMS
# Changes save to .decaps/ folder
```

### Example 2: Full Production Testing

```bash
# One-time setup
npx netlify login
npx netlify link

# Daily use
npm run dev

# Test full workflow:
# 1. Edit deals in /admin
# 2. Publish (goes to content branch)
# 3. Check GitHub for commit
# 4. Merge content → main
```

### Example 3: Combined Local + Dev Server

```bash
# Run both servers together
npm run dev:cms

# Now you have:
# - Local CMS backend (port 8081)
# - Netlify dev server (port 8888)
# - Full click tracking
# - Analytics dashboard
# - All features working
```

---

## ✅ Verification Checklist

After setup, verify both modes work:

### Local Backend Mode
- [ ] Run `npm run cms`
- [ ] Visit admin
- [ ] See "LOCAL CMS MODE" banner
- [ ] Can edit deals without login
- [ ] Changes saved to `.decaps/` folder

### Netlify Dev Mode
- [ ] Run `npm run dev`
- [ ] Visit admin
- [ ] See "Use netlify dev for full CMS" notice
- [ ] Login with Netlify Identity works
- [ ] Publish creates commit in `content` branch

---

**Status:** ✅ Dual-backend system ready for use!

Choose your mode based on your needs and start editing content.
