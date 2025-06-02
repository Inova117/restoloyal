# 🚀 **Edge Function Deployment Guide**

## **🔍 FIRST: Verify if Function Exists**

1. **Go to**: https://supabase.com/dashboard/project/benlobpdlknywgqtzdki
2. **Click**: Edge Functions (left sidebar)
3. **Look for**: `create-client-with-user`

**If you DON'T see it** → Continue with deployment below
**If you DO see it** → Check function logs for errors

## **📋 DEPLOY VIA SUPABASE DASHBOARD**

### **Step 1: Create New Function**
1. **Click**: "Create a new function"
2. **Name**: `create-client-with-user`
3. **Click**: "Create function"

### **Step 2: Copy Function Code**
1. **Delete** the default code in the editor
2. **Copy ALL content** from `supabase/functions/create-client-with-user/index.ts`
3. **Paste** into Supabase editor

### **Step 3: Deploy**
1. **Click**: "Deploy function" (blue button)
2. **Wait** for deployment to complete
3. **Check status**: Should show "Active"

## **🧪 TEST FUNCTION**

After deployment:

### **Via Supabase Dashboard**:
1. **Go to**: Edge Functions → `create-client-with-user`
2. **Click**: "Invoke function"
3. **Add test payload**:
   ```json
   {
     "name": "Test Restaurant",
     "contactEmail": "test@test.com",
     "plan": "trial"
   }
   ```
4. **Add headers**:
   ```
   Authorization: Bearer [your-session-token]
   ```

### **Expected Response**:
- **Success**: Function executes (even if fails due to auth)
- **Failure**: CORS or function not found errors

## **🚨 COMMON ISSUES**

### **"Function not found"**
- Function wasn't deployed properly
- Wrong function name
- Deploy didn't complete

### **"CORS error"**
- Function exists but has code errors
- CORS headers not properly configured
- Function crashed during OPTIONS request

### **"Unauthorized"** 
- ✅ **This is GOOD** - means function is working
- Just means you need proper auth headers

## **🔧 ALTERNATIVE: CLI DEPLOYMENT**

If you have Supabase CLI:

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref benlobpdlknywgqtzdki

# Deploy function
supabase functions deploy create-client-with-user
```

## **✅ VERIFICATION**

After deployment, the function should:
- ✅ Appear in Supabase Dashboard → Edge Functions
- ✅ Show status "Active"
- ✅ Respond to CORS preflight requests
- ✅ Be callable from your app (even if returns auth errors) 