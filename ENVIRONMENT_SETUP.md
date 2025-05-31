# 🔧 Environment Setup Guide

## 🚨 Security Notice

**IMPORTANT**: This project previously had hardcoded Supabase credentials in the source code, which has been fixed. All credentials must now be properly configured through environment variables.

## 📋 Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Supabase Edge Functions (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Development Mode
VITE_MOCK_MODE=false
```

## 🔑 How to Get Supabase Credentials

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Wait for the project to be fully provisioned

### 2. Get Your Project URL
- In your Supabase dashboard, go to **Settings** → **API**
- Copy the **Project URL** (format: `https://your-project-ref.supabase.co`)

### 3. Get Your Anon Key
- In the same **Settings** → **API** page
- Copy the **anon/public** key (starts with `eyJhbGciOiJIUzI1NiIs...`)

### 4. Get Your Service Role Key (for Edge Functions)
- In **Settings** → **API**
- Copy the **service_role** key (⚠️ **Keep this secret!**)

## 📁 Environment File Setup

### Step 1: Create `.env` file
```bash
# In the project root directory
touch .env
```

### Step 2: Add your credentials
```bash
# Replace with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Verify `.env` is in `.gitignore`
The `.env` file should **NEVER** be committed to version control. Verify it's listed in `.gitignore`:

```bash
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 🗄️ Database Setup

### 1. Run Database Schema
Execute the database setup script in your Supabase SQL Editor:

```sql
-- Run this file in Supabase SQL Editor
-- File: database-setup.sql
```

### 2. Enable Row Level Security
Ensure RLS is enabled for all tables:

```sql
-- This should already be included in the setup script
ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ... etc
```

### 3. Deploy Edge Functions
Deploy the Supabase Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy
```

## 🚀 Development Setup

### 1. Install Dependencies
```bash
npm install
# or
bun install
```

### 2. Start Development Server
```bash
npm run dev
# or
bun dev
```

### 3. Verify Environment
The application will throw an error if environment variables are missing:
```
Missing Supabase environment variables. Please check your .env file...
```

## 🔒 Security Best Practices

### ✅ Do's
- ✅ Store all secrets in `.env` files
- ✅ Add `.env` to `.gitignore`
- ✅ Use different credentials for development/production
- ✅ Rotate keys regularly
- ✅ Use service role key only for server-side operations

### ❌ Don'ts
- ❌ Never commit `.env` files to version control
- ❌ Never hardcode credentials in source code
- ❌ Never share service role keys publicly
- ❌ Never use production credentials in development

## 🌍 Production Deployment

### Environment Variables for Production

Set these environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

**Netlify:**
```bash
# In Netlify dashboard: Site settings → Environment variables
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

**Docker:**
```dockerfile
ENV VITE_SUPABASE_URL=your_supabase_url
ENV VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🧪 Testing Environment

For testing, you can use a separate Supabase project:

```bash
# .env.test
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_test_anon_key
VITE_MOCK_MODE=true
```

## 🆘 Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables" error**
- Ensure `.env` file exists in project root
- Check variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart development server after adding variables

**2. "Failed to fetch" errors**
- Verify your Supabase project URL is correct
- Check if your Supabase project is active
- Ensure anon key is valid and not expired

**3. Authentication issues**
- Verify RLS policies are set up correctly
- Check if user roles are properly configured
- Ensure Edge Functions are deployed

**4. CORS errors**
- Add your domain to Supabase allowed origins
- Check Edge Function CORS headers

### Getting Help

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test Supabase connection in the Supabase dashboard
4. Check the Supabase logs for Edge Function errors

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) 