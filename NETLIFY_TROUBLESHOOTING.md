# 🚀 Netlify Deployment Troubleshooting Guide

## 📊 Current Status

✅ **Your code is correctly configured!**
- All `import.meta.env.VITE_*` usage is correct
- No incorrect `process.env` usage in frontend
- `.gitignore` properly excludes `.env` files
- Build configuration is valid

## 🔧 Root Cause Analysis

Your project has a **prebuild verification script** (`scripts/verify-env.js`) that:
1. Runs before every `npm run build`
2. Checks for required environment variables
3. **Fails the build** if variables are missing

This is **GOOD SECURITY PRACTICE** but requires proper Netlify configuration.

## 🎯 Required Netlify Configuration

### 1. Environment Variables (CRITICAL)

In Netlify UI: **Site Settings > Environment variables**

**REQUIRED (Build will fail without these):**
```
VITE_SUPABASE_URL = https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY = your_actual_anon_key_here
```

**RECOMMENDED:**
```
VITE_PLATFORM_ADMIN_EMAILS = admin@zerioncore.com,platform@zerioncore.com
VITE_GALLETTI_ADMIN_EMAILS = admin@galletti.com,owner@galletti.com
VITE_APP_URL = https://your-netlify-site.netlify.app
```

### 2. Build Settings

```
Build command: npm run build
Publish directory: dist
Node.js version: 18 or higher
```

## 🐛 Troubleshooting Steps

### Step 1: Verify Variable Names (CRITICAL)
❌ **Common Mistakes:**
- Extra spaces: `VITE_SUPABASE_URL ` (trailing space)
- Wrong prefix: `SUPABASE_URL` (missing VITE_)
- Typos: `VITE_SUPABASE_ULR`

✅ **Correct Format:**
```
Key: VITE_SUPABASE_URL
Value: https://abcdefg.supabase.co
```

### Step 2: Check Variable Context

In Netlify, ensure variables are set for:
- ✅ **Production** context
- ✅ **Deploy previews** context (if using PR previews)

### Step 3: Force New Build

🚨 **CRITICAL:** If you added variables after first deploy:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** dropdown  
3. Select **"Clear cache and deploy site"**

**Why?** Vite bakes env vars into build at build-time, not runtime.

### Step 4: Debug in Browser

After deployment:
1. Open your deployed site
2. Open browser console (F12)
3. Type: `console.log(import.meta.env)`
4. Check if your `VITE_*` variables appear

**Expected output:**
```javascript
{
  MODE: "production",
  VITE_SUPABASE_URL: "https://your-project.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJ...",
  // ... other VITE_ variables
}
```

**If variables are undefined:** Environment variables weren't present during build.

## 🔬 Local Testing

Test your build process locally:

```bash
# Check what VITE_ variables are available locally
node -e "console.log(Object.keys(process.env).filter(k => k.startsWith('VITE_')))"

# Run verification script manually
npm run verify-env

# Test build (will fail without proper .env setup)
npm run build

# If build succeeds, test the result
npm run preview
```

## 🚨 Common Failure Patterns

### Pattern 1: "No VITE_ variables found"
**Cause:** Variables not set in Netlify OR not prefixed with `VITE_`
**Solution:** Add variables with exact `VITE_` prefix

### Pattern 2: "import.meta.env returns undefined values"
**Cause:** Variables added after build, cached build served
**Solution:** "Clear cache and deploy site"

### Pattern 3: "Build fails with missing variables"
**Cause:** Your project's prebuild script enforces required variables
**Solution:** Add all required variables before triggering build

### Pattern 4: "Works locally, fails on Netlify"
**Cause:** Local `.env` file vs. Netlify environment variables
**Solution:** Ensure Netlify has same variables as your local `.env`

## 🎯 Deployment Checklist

Before deploying:

- [ ] Connect GitHub repo to Netlify
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add required environment variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Verify variable names (no typos/spaces)
- [ ] Set variables for both Production and Deploy Preview contexts
- [ ] Trigger initial deploy
- [ ] If env vars added after deploy: "Clear cache and deploy site"
- [ ] Test in browser console: `console.log(import.meta.env)`

## 💡 Pro Tips

1. **Never commit `.env` files** - Your `.gitignore` correctly prevents this

2. **Use exact variable names** - Copy from `env.example` to avoid typos

3. **Test build locally first** - Catch issues before deployment

4. **Monitor build logs** - Netlify shows if prebuild script fails

5. **Use Deploy Previews** - Test environment setup on feature branches

## 🔧 Quick Fix Commands

Run these to verify your setup:

```bash
# Comprehensive deployment check
node scripts/netlify-deploy-check.js

# Test environment verification  
npm run verify-env

# Local build test (needs .env.local with values)
npm run build && npm run preview
```

## 🆘 Emergency Deployment

If you need to deploy immediately without full env setup:

1. **Temporarily disable prebuild script:**
   - Comment out `"prebuild": "node scripts/verify-env.js"` in `package.json`
   - Deploy
   - Re-enable script after adding env vars

2. **Use build override:**
   ```bash
   # In Netlify build command field:
   npm install && npx vite build
   ```

**⚠️ WARNING:** This bypasses security checks. Add proper env vars ASAP.

---

## 📞 Still Having Issues?

Your codebase is correctly configured. If deployment still fails:

1. **Check Netlify build logs** - Look for specific error messages
2. **Verify Supabase credentials** - Test them in Supabase dashboard  
3. **Try minimal deployment** - Deploy with just the two required variables
4. **Contact Netlify support** - With build logs if infrastructure issues

**Remember:** The error is almost always missing/incorrect environment variables in Netlify UI, not your code configuration. 