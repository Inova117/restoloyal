# 🚨 **URGENT: Environment URL Mismatch Fix**

## **Problem Identified**
Your app is trying to reach: `https://sosdnyzzhzowoxsztgol.supabase.co`
But it should be reaching: `https://benlobpdlknywgqtzdki.supabase.co`

This is causing the CORS error when creating clients.

## **🔥 IMMEDIATE SOLUTIONS**

### **Solution A: Fix Netlify Environment Variables**

1. **Go to Netlify Dashboard**: [app.netlify.com](https://app.netlify.com)
2. **Find your site**: Restaurant Loyalty
3. **Navigate**: Site settings → Environment variables  
4. **Find and UPDATE these variables**:

   **❌ Current (Wrong)**:
   ```
   VITE_SUPABASE_URL=https://sosdnyzzhzowoxsztgol.supabase.co
   VITE_SUPABASE_ANON_KEY=[current wrong key]
   ```

   **✅ Should be (Correct)**:
   ```
   VITE_SUPABASE_URL=https://benlobpdlknywgqtzdki.supabase.co
   VITE_SUPABASE_ANON_KEY=[correct key for benlobpdlknywgqtzdki project]
   ```

5. **Get correct values**:
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Find project `benlobpdlknywgqtzdki`
   - Go to Settings → API
   - Copy **Project URL** and **anon public key**

6. **Redeploy**: Deploys tab → Trigger deploy → Deploy site

### **Solution B: Check Which Supabase Project Has Your Data**

**Option 1**: Your data is in `benlobpdlknywgqtzdki` (expected)
- Fix Netlify environment variables as above
- Deploy Edge Function to `benlobpdlknywgqtzdki`

**Option 2**: Your data is actually in `sosdnyzzhzowoxsztgol` 
- Update docs to use `sosdnyzzhzowoxsztgol` 
- Deploy Edge Function to that project instead

## **🧪 Quick Test**

After fixing environment variables:

1. **Check current URL**: Open browser dev tools → Network tab
2. **Try creating client** from dashboard
3. **Verify request goes to**: `https://benlobpdlknywgqtzdki.supabase.co`

## **🔧 Deploy Edge Function to Correct Project**

Once you know the correct project:

### **Via Supabase Dashboard**:
1. Go to correct project dashboard  
2. Edge Functions → Create new function
3. Name: `create-client-with-user`
4. Paste content from `supabase/functions/create-client-with-user/index.ts`
5. Deploy

### **Via CLI** (if you have it):
```bash
# Link to correct project
supabase link --project-ref [correct-project-id]

# Deploy function
supabase functions deploy create-client-with-user
```

## **Expected Result**

After fix, creating a client should:
- ✅ No CORS errors
- ✅ Successful response with client data
- ✅ Toast: "🎉 Client Created Successfully!"
- ✅ Client appears in dashboard list 