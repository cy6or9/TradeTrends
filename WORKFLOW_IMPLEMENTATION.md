# Draft/Publish Workflow - Implementation Summary

## ✅ Changes Made

### 1. CMS Configuration
**File:** [public/admin/config.yml](public/admin/config.yml)
```yaml
backend:
  name: git-gateway
  branch: content  # Changed from 'main'
```
**Effect:** All CMS publishes now go to `content` branch

### 2. Build Ignore Script
**File:** [netlify-ignore.sh](netlify-ignore.sh) (new file)
- Checks `$BRANCH` environment variable
- Returns exit code 0 (skip) for non-main branches
- Returns exit code 1 (build) for main branch

**Verification:**
```bash
# On main branch (should build)
$ ./netlify-ignore.sh
Status: PROCEEDING with build (main branch)
Exit code: 1 ✅

# On content branch (should skip)
$ BRANCH=content ./netlify-ignore.sh
Status: SKIPPING build (only main branch triggers builds)
Exit code: 0 ✅
```

### 3. Netlify Configuration
**File:** [netlify.toml](netlify.toml)
```toml
[build]
  publish = "public"
  functions = "netlify/functions"
  ignore = "bash ./netlify-ignore.sh"  # Added
```
**Effect:** Netlify runs script before each build to decide whether to proceed

### 4. Admin UI Banner
**File:** [public/admin/index.html](public/admin/index.html)

Added prominent banner above header:
```html
<div style="background: linear-gradient(135deg, #ff6b35 0%, #ffd700 100%); ...">
  📝 Draft Mode: Changes save to content branch (not live until merged to main)
</div>
```

**Visibility:** Shown on ALL admin pages (Dashboard, Trends, CMS)

### 5. Documentation
**Files updated:**
- [README.md](README.md) - Added "Publishing Workflow" section
- [public/admin/README.md](public/admin/README.md) - Detailed CMS workflow guide
- [PUBLISHING_WORKFLOW.md](PUBLISHING_WORKFLOW.md) - Quick reference (new)

## 🎯 How It Works Now

### Before (Old Workflow)
```
Edit in /admin → Publish → main branch → Netlify builds immediately → Live
```
**Problem:** Every edit triggers a build/deploy (wastes build minutes, shows incomplete work)

### After (New Workflow)
```
Edit in /admin → Publish → content branch → NO BUILD
                                              ↓
                          When ready to publish:
                                              ↓
                       Merge content → main → Netlify builds once → Live
```
**Benefits:**
- ✅ Add 10 deals = 1 build (instead of 10 builds)
- ✅ Review before publishing
- ✅ Collaborate without breaking live site
- ✅ Batch updates for efficient deploys

## 🔒 What's Protected

### Still Works (No Changes)
- ✅ Click tracking (`/go/*` system)
- ✅ Analytics dashboard
- ✅ Trends viewer
- ✅ Netlify Functions
- ✅ Netlify Identity authentication
- ✅ Admin role checks
- ✅ Storage system (Blobs/Files)
- ✅ Rate limiting
- ✅ Travelpayouts integration
- ✅ Local development (`npm run dev`)

### Configuration Unchanged
- ✅ Publish directory: `public`
- ✅ Functions directory: `netlify/functions`
- ✅ Redirects: `/go/*` and `/api/*`
- ✅ Headers and security settings
- ✅ JSON schema (amazon.json, travel.json)
- ✅ CMS collections and fields
- ✅ React DOM (`#nc-root` untouched)

## 📋 First-Time Setup Required

After deploying these changes, you need to create the `content` branch:

```bash
# One-time setup
git checkout -b content
git push -u origin content
git checkout main
```

**Why:** CMS needs a `content` branch to write to. This creates it from current `main`.

## 🧪 Testing Checklist

### Local Testing (Before Deploy)
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:8888/admin/
- [ ] Verify banner shows "Draft Mode: Changes save to content branch"
- [ ] Edit a deal and click Publish
- [ ] Check git: changes should be on local content branch (if Git Gateway is configured)

### After Deploying to Netlify
- [ ] Create `content` branch (one-time)
- [ ] Visit live `/admin`
- [ ] Add a test deal
- [ ] Click Publish
- [ ] Go to GitHub: verify commit is on `content` branch
- [ ] Check Netlify: should NOT have triggered a build
- [ ] Create PR: content → main
- [ ] Merge PR
- [ ] Netlify should build automatically
- [ ] Verify deal appears on live site

## 📊 Expected Behavior

### Scenario 1: Edit on Content Branch
```
Action: CMS Publish
Git: Commit to 'content'
Netlify: ❌ No build (netlify-ignore.sh returns 0)
Live Site: ❌ No changes (as expected)
```

### Scenario 2: Merge to Main Branch
```
Action: git merge content (or GitHub PR)
Git: Commit to 'main'
Netlify: ✅ Build triggered (netlify-ignore.sh returns 1)
Live Site: ✅ Changes visible
```

### Scenario 3: Direct Push to Main
```
Action: git push origin main (manual)
Git: Commit to 'main'
Netlify: ✅ Build triggered (normal behavior)
Live Site: ✅ Changes visible
```

## 🔍 Verification Commands

### Check CMS Configuration
```bash
cat public/admin/config.yml | grep -A 1 "backend:"
# Should show: branch: content
```

### Check Netlify Configuration
```bash
cat netlify.toml | grep "ignore"
# Should show: ignore = "bash ./netlify-ignore.sh"
```

### Test Build Ignore Script
```bash
# Main branch (should proceed with build)
./netlify-ignore.sh
# Exit code: 1 ✅

# Content branch (should skip build)
BRANCH=content ./netlify-ignore.sh
# Exit code: 0 ✅

# Other branch (should skip build)
BRANCH=feature-xyz ./netlify-ignore.sh
# Exit code: 0 ✅
```

### Check Banner in Admin
```bash
grep -A 2 "Draft Mode" public/admin/index.html
# Should find the banner HTML
```

## 🚨 Rollback Plan (If Needed)

If you need to revert to direct publishing:

```bash
# 1. Change CMS back to main branch
sed -i 's/branch: content/branch: main/' public/admin/config.yml

# 2. Remove build ignore from netlify.toml
sed -i '/ignore = /d' netlify.toml

# 3. Commit and push
git add public/admin/config.yml netlify.toml
git commit -m "Revert to direct publishing"
git push origin main
```

**Note:** Banner will still show but can be ignored (or remove from index.html)

## 📝 Notes

### Local Development
- Git Gateway may not work fully in `netlify dev` (limitation of local Identity)
- CMS will try to write to `content` branch but may not succeed locally
- This is normal - test publishing workflow in production

### Netlify Build Minutes
- This change significantly reduces build consumption
- Example: 30 deal edits = 1 build (instead of 30)
- Saves 29 build minutes per batch!

### Branch Management
- Keep `content` branch alive (don't delete)
- Occasionally merge `main` → `content` to stay in sync
- If conflicts occur, keep newer deals (merge arrays)

## 🎉 Summary

**What Changed:**
- CMS writes to `content` branch (not `main`)
- Netlify ignores builds on `content` branch
- Admin UI shows draft mode banner
- Documentation updated with workflows

**What Didn't Change:**
- Everything else (tracking, analytics, functions, etc.)
- Site architecture
- Data schema
- Authentication

**Outcome:**
- More efficient deploys
- Better content review workflow
- No accidental publishes
- Cleaner git history

---

**Status:** ✅ Ready to deploy!

**Next Steps:**
1. Review changes: `git log --oneline -5`
2. Push to GitHub: `git push origin main`
3. Create `content` branch: See "First-Time Setup" above
4. Test workflow: Add a deal, verify it stays in draft
