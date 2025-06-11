# 🚀 Netlify Deployment Troubleshooting Guide

## 📊 Current Status

✅ **Your code is correctly configured!**
- All `import.meta.env.VITE_*` usage is correct
- No incorrect `process.env` usage in frontend
- `.gitignore` properly excludes `.env` files
- Build configuration is valid
- **Analysis confirms: Standard single-project structure (not monorepo)**

## 🔧 Root Cause Analysis

Your project has a **prebuild verification script** (`scripts/verify-env.js`) that:
1. Runs before every `npm run build`
2. Checks for required environment variables
3. **Fails the build** if variables are missing

This is **GOOD SECURITY PRACTICE** but requires proper Netlify configuration.

## 🏗️ MONOREPO & BASE DIRECTORY ISSUES

### Issue #1: Monorepo Structure
**❌ Problem:** Building from subfolder but Netlify uses wrong directory  
**✅ Your Status:** Standard single-project structure (no issue)

**If you were in a monorepo:**
1. Go to Netlify > Site settings > Build & deploy > Build settings
2. Set **Base directory** to your subfolder (e.g., `apps/web`, `frontend`)
3. Set **Publish directory** to `dist` (relative to base directory)

### Issue #2: Multiple Build Contexts
**❌ Problem:** netlify.toml overrides environment variables  
**⚠️ Your Status:** You have `netlify.toml` with multiple contexts

**Check for environment overrides:**
```toml
[context.production.environment]
VITE_SUPABASE_URL = "some_value"  # This overrides Netlify UI!
```

**Solution:** Remove environment overrides from `netlify.toml` OR ensure they match your intended values.

### Issue #3: Multiple Build Outputs
**❌ Problem:** Wrong publish directory (dist vs build vs out)  
**✅ Your Status:** Correctly using `dist` directory

**Verification:** Your `netlify.toml` correctly sets `publish = "dist"`

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
Base directory: (leave empty - single project)
```

## 🐛 Advanced Troubleshooting Steps

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
- ✅ **Branch deploys** context (if using branch deploys)

### Step 3: Check netlify.toml Overrides

Your `netlify.toml` has these contexts:
- `[context.production]`
- `[context.deploy-preview]`
- `[context.branch-deploy]`

**Ensure these don't override your environment variables!**

### Step 4: Force New Build

🚨 **CRITICAL:** If you added variables after first deploy:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** dropdown  
3. Select **"Clear cache and deploy site"**

**Why?** Vite bakes env vars into build at build-time, not runtime.

### Step 5: Debug with EnvironmentDebugger Component

**I've created a debug component for you:** `src/components/EnvironmentDebugger.tsx`

**Usage:**
```tsx
import { EnvironmentDebugger } from '@/components/EnvironmentDebugger';

function App() {
  return (
    <div>
      <EnvironmentDebugger />
      {/* Your app content */}
    </div>
  );
}
```

After deployment:
1. Open your deployed site
2. Open browser console (F12)
3. Look for "🔍 Environment Debug Info:"
4. Check if your `VITE_*` variables appear

**Expected output:**
```javascript
🔍 Environment Debug Info:
Mode: production
VITE_SUPABASE_URL: https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY: SET
All VITE_ vars: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", ...]
```

**If variables are undefined:** Environment variables weren't present during build.

## 🔬 Local Testing

Test your build process locally:

```bash
# Advanced deployment check (covers monorepo issues)
node scripts/netlify-advanced-check.js

# Basic deployment check
node scripts/netlify-deploy-check.js

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

### Pattern 5: "Monorepo build fails"
**Cause:** Netlify building from wrong directory
**Solution:** Set correct base directory in build settings
**Your Status:** ✅ Not applicable (single project)

### Pattern 6: "netlify.toml overrides environment"
**Cause:** Context-specific environment overrides in config file
**Solution:** Remove overrides or ensure they match intended values
**Your Status:** ⚠️ Check your `netlify.toml` for environment overrides

### Pattern 7: "process.env not working in Vite"
**Cause:** Using Node.js environment pattern in frontend code
**Solution:** Replace with `import.meta.env`
**Your Status:** ✅ No issues found

## 🎯 Deployment Checklist

Before deploying:

- [ ] Connect GitHub repo to Netlify
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Base directory: (leave empty for single project)
- [ ] Add required environment variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Verify variable names (no typos/spaces)
- [ ] Set variables for all relevant contexts (Production, Deploy Preview, Branch Deploy)
- [ ] Check `netlify.toml` for environment overrides
- [ ] Add `EnvironmentDebugger` component temporarily
- [ ] Trigger initial deploy
- [ ] If env vars added after deploy: "Clear cache and deploy site"
- [ ] Test in browser console: check debug output

## 💡 Pro Tips

1. **Never commit `.env` files** - Your `.gitignore` correctly prevents this

2. **Use exact variable names** - Copy from `env.example` to avoid typos

3. **Test build locally first** - Catch issues before deployment

4. **Monitor build logs** - Netlify shows if prebuild script fails

5. **Use Deploy Previews** - Test environment setup on feature branches

6. **Check netlify.toml carefully** - Context overrides can be tricky

7. **Use the debug component** - Fastest way to verify env vars in production

## 🔧 Quick Fix Commands

Run these to verify your setup:

```bash
# Comprehensive deployment check (includes monorepo analysis)
node scripts/netlify-advanced-check.js

# Basic deployment check
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
4. **Use the debug component** - Add `EnvironmentDebugger` to see exact env state
5. **Check for netlify.toml overrides** - Ensure no context-specific environment conflicts
6. **Contact Netlify support** - With build logs if infrastructure issues

**Remember:** The error is almost always missing/incorrect environment variables in Netlify UI, not your code configuration. 