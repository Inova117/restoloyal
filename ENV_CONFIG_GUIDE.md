# 🔧 Production Environment Configuration Guide

## 🎯 **Problem: Reset Password Redirects to Localhost**

Your app is live at [https://restaurantloyalty.netlify.app/](https://restaurantloyalty.netlify.app/) but Supabase auth is configured for localhost development.

## ✅ **SOLUTION: Configure Production URLs**

### **Step 1: Update Supabase Authentication Settings**

1. **Go to Supabase Dashboard** → **Authentication** → **URL Configuration**

2. **Set Site URL:**
   ```
   https://restaurantloyalty.netlify.app
   ```

3. **Add Redirect URLs (one per line):**
   ```
   https://restaurantloyalty.netlify.app
   https://restaurantloyalty.netlify.app/auth/callback
   https://restaurantloyalty.netlify.app/auth/reset-password
   https://restaurantloyalty.netlify.app/auth/confirm
   https://restaurantloyalty.netlify.app/**
   http://localhost:3000/**
   http://localhost:5173/**
   ```

### **Step 2: Configure Netlify Environment Variables**

1. **Go to Netlify Dashboard** → **Your Site** → **Site settings** → **Environment variables**

2. **Click "Add Variable"** and add:

   **Variable 1:**
   ```
   Key: VITE_SUPABASE_URL
   Value: [Your Supabase Project URL]
   ```

   **Variable 2:**
   ```
   Key: VITE_SUPABASE_ANON_KEY  
   Value: [Your Supabase Anon Key]
   ```

3. **Click "Save"** and **Redeploy** your site

### **Step 3: Verify Your Supabase Credentials**

**Find your credentials in Supabase Dashboard:**

1. **Go to Supabase** → **Settings** → **API**
2. **Copy Project URL**: `https://your-project-ref.supabase.co`
3. **Copy anon/public key**: `eyJhbGciOiJIUzI1NiIs...`

### **Step 4: Test the Fix**

1. **Go to**: [https://restaurantloyalty.netlify.app/](https://restaurantloyalty.netlify.app/)
2. **Try "Forgot Password"**
3. **Check your email** - the reset link should now point to your production domain
4. **Click the reset link** - should redirect to `https://restaurantloyalty.netlify.app/auth/reset-password`

## 🔄 **Optional: Create Local Environment File**

For local development, create a `.env` file in your project root:

```bash
# .env (for local development only)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: Never commit `.env` files to Git! They should be in `.gitignore`.

## 🚨 **Current Configuration Check**

Based on your `supabase/config.toml`, your project ID is: `benlobpdlknywgqtzdki`

**Your Supabase URL should be:**
```
https://benlobpdlknywgqtzdki.supabase.co
```

## 🧪 **Testing Checklist**

After making these changes, test:

- ✅ **Login/Logout** on production site
- ✅ **Password reset** emails point to production domain  
- ✅ **Email confirmation** links work
- ✅ **Authentication redirects** stay on production domain
- ✅ **Local development** still works with localhost URLs

## 🔥 **If You're Still Having Issues**

1. **Clear browser cache** and cookies for both domains
2. **Wait 5-10 minutes** for Supabase changes to propagate
3. **Check Netlify deploy logs** for any environment variable errors
4. **Verify** the environment variables are actually set in Netlify

## 📞 **Next Steps**

Once this is working:
1. ✅ URLs configured correctly
2. ✅ Password reset working  
3. ✅ Ready to create Galletti users
4. ✅ Ready to test tier 2 access

**Let me know when you've updated the Supabase settings and I'll help you create your first Galletti user!** 🎯 