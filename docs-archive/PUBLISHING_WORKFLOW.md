# Publishing Workflow - Quick Reference

## 🎯 One-Time Setup (First Deploy Only)

### 1. Create the content branch
```bash
git checkout -b content
git push -u origin content
git checkout main
```

### 2. Verify Netlify Configuration
- ✅ Netlify Identity enabled
- ✅ Git Gateway enabled
- ✅ Your user has `admin` role
- ✅ `TT_SALT` environment variable set

## 📝 Daily Workflow

### Adding Deals (Draft Mode)

```
1. Visit /admin
2. Login with Netlify Identity
3. Add/edit deals
4. Click "Publish"
   ↓
✅ Saved to 'content' branch
❌ NOT deployed (not live yet)
```

### Publishing to Live Site

#### Quick Method (GitHub Web)
```
1. Go to GitHub repository
2. Pull requests → New
3. Base: main, Compare: content
4. Create → Merge
   ↓
✅ Netlify builds automatically
✅ Deals are now live!
```

#### Command Line Method
```bash
git checkout main
git pull origin main
git merge origin/content
git push origin main
```

## 🔍 How to Check Status

### Are my deals in draft?
```bash
# View content branch on GitHub
https://github.com/YOUR_USERNAME/TradeTrends/tree/content/public/data

# Or locally:
git checkout content
cat public/data/amazon.json
```

### Are my deals live?
```bash
# View main branch
https://github.com/YOUR_USERNAME/TradeTrends/tree/main/public/data

# Or visit your live site
https://YOUR_SITE.netlify.app/
```

### What's different between branches?
```bash
# On GitHub:
Compare: content → main

# Or locally:
git diff main..content -- public/data/
```

## ⚠️ Troubleshooting

### "I published but don't see changes on live site"
**Cause:** Changes are in `content` branch, not `main`  
**Fix:** Merge `content` → `main` (see workflow above)

### "Merge says there are conflicts"
**Cause:** Someone edited the same deals  
**Fix:**
1. Open the conflicted JSON file
2. Keep ALL deals (merge both arrays)
3. Remove markers: `<<<<<<<`, `=======`, `>>>>>>>`
4. Save, commit, push

### "I want to discard draft changes"
```bash
git checkout content
git reset --hard origin/main
git push -f origin content
```
**⚠️ WARNING:** This deletes ALL unpublished drafts!

### "Netlify built my content branch"
**Should not happen** (netlify-ignore.sh prevents this)  
**Check:** netlify.toml has `ignore = "bash ./netlify-ignore.sh"`

## 📊 Batch Publishing Example

**Scenario:** Add 10 deals over 3 days, publish all at once

```
Day 1: Add 3 deals → Publish (content branch)
Day 2: Add 4 deals → Publish (content branch)
Day 3: Add 3 deals → Publish (content branch)

Ready to launch:
→ Merge content to main
→ ONE Netlify build
→ All 10 deals go live together

Benefit: 1 build instead of 10!
```

## 🎨 Visual Workflow

```
┌─────────────────┐
│  Edit in /admin │ ← Add/edit deals
└────────┬────────┘
         │ Click "Publish"
         ▼
   ┌─────────────┐
   │   content   │ ← Draft (not live)
   │   branch    │
   └─────────────┘
         │
         │ Merge when ready
         ▼
   ┌─────────────┐
   │    main     │ ← Triggers build
   │   branch    │
   └─────────────┘
         │
         ▼
   ┌─────────────┐
   │  Live Site  │ ← Deals visible to public
   └─────────────┘
```

## 🔐 Safety Checklist

Before merging content → main:
- [ ] Review all changes in GitHub diff
- [ ] Test deals locally if possible
- [ ] Ensure affiliate URLs are correct
- [ ] Check image URLs are valid
- [ ] Verify no placeholder data

After merging:
- [ ] Wait for Netlify build to complete
- [ ] Visit live site and verify deals appear
- [ ] Click a deal to test /go/* tracking
- [ ] Check dashboard shows clicks

## 📚 Full Documentation

- [README.md](README.md) - Full project overview
- [public/admin/README.md](public/admin/README.md) - Detailed CMS workflow
- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) - Deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

## 💡 Pro Tips

1. **Batch your updates** - Add multiple deals before merging
2. **Use descriptive commit messages** - "Added 5 Amazon deals for Black Friday"
3. **Keep content branch up to date** - Merge main → content occasionally
4. **Review before merging** - Use GitHub's diff view to double-check
5. **Test locally first** - Run `npm run dev` to preview changes

## 🚀 Quick Commands

```bash
# See what's in draft
git checkout content && git pull

# Publish to live
git checkout main && git pull && git merge origin/content && git push

# Sync content with main
git checkout content && git merge main && git push

# View differences
git diff main..content -- public/data/
```
