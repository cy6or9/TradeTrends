# Environment Variables for TradeTrends

## Required for Production

### TT_SALT
**Purpose:** Salt string for IP address hashing in click tracking  
**Type:** String (random, secure)  
**Required:** Yes (production only)  
**Where to set:** Netlify UI → Site Settings → Environment Variables

**Why it's needed:**  
The click tracking system hashes IP addresses to provide privacy-preserving analytics. Without a unique salt, the hashes could be vulnerable to rainbow table attacks.

**How to generate a secure value:**
```bash
# Option 1: Use OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Use /dev/urandom (Linux/Mac)
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 48 | head -n 1
```

**Example value:**
```
TT_SALT=xK9mP2qR5tW8zC4vN7jL0hF3sA6dG1eM
```

**Security notes:**
- Keep this value secret (never commit to git)
- Don't share publicly
- Don't change it after deployment (would invalidate rate limiting)
- Use different values for staging vs production

---

## Local Development

### For `netlify dev`
You can optionally create `.env` file in project root:

```bash
# .env (already in .gitignore)
TT_SALT=local-dev-salt-not-secure
```

**Note:** The system falls back to `'default-salt'` if not set, which is fine for local testing.

---

## Netlify Identity (Already Configured)

These are handled automatically by Netlify Identity, no manual setup needed:
- `IDENTITY_URL` - Auto-set by Netlify
- `JWT_SECRET` - Managed by Netlify Identity
- `SITE_URL` - Auto-set by Netlify

---

## Admin Role Assignment

After deploying, you need to manually assign the `admin` role to users:

1. Go to Netlify UI → Identity tab
2. Click on a user
3. Scroll to "Metadata" section
4. Edit `app_metadata` (NOT `user_metadata`)
5. Add:
   ```json
   {
     "roles": ["admin"]
   }
   ```
6. Save

**Without the admin role**, users can:
- ✅ View analytics dashboard
- ✅ View trends data
- ❌ Refresh trends (admin-only)
- ❌ Access sensitive functions

---

## Optional: Netlify Blobs

If using Netlify Blobs for storage (instead of file-based):

### NETLIFY_BLOBS_CONTEXT
**Purpose:** Enables blob storage in functions  
**Type:** Auto-set by Netlify  
**Required:** No (system falls back to file storage)  
**Where to set:** Auto-configured

The storage adapter automatically detects Blobs availability. No manual configuration needed.

---

## Verification Checklist

Before deploying:
- [ ] Generate secure TT_SALT value
- [ ] Add TT_SALT to Netlify environment variables
- [ ] Ensure `.env` is in `.gitignore` (already done)
- [ ] Verify Netlify Identity is enabled
- [ ] Test locally with `npm run dev`

After deploying:
- [ ] Assign admin role to your user
- [ ] Test click tracking on live site
- [ ] Test admin dashboard access
- [ ] Verify trends refresh works (admin-only)
