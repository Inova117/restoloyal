-- 🚨 EMERGENCY FIX - BYPASS ALL AUTH ISSUES
-- This will create the client directly without Edge Function
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS temporarily on platform_clients
ALTER TABLE platform_clients DISABLE ROW LEVEL SECURITY;

-- Step 2: Create the client directly
INSERT INTO platform_clients (
    name,
    slug,
    contact_email,
    contact_phone,
    plan,
    status,
    created_at,
    updated_at
) VALUES (
    'Casa Panpite',  -- Change this to your desired client name
    'casa-panpite',  -- Change this to your desired slug
    'admin@casapanpite.com',  -- Change this to the client's email
    '+1234567890',   -- Change this to the client's phone (or NULL)
    'basic',         -- Plan type
    'active',        -- Status
    NOW(),           -- Created at
    NOW()            -- Updated at
);

-- Step 3: Get the created client ID
SELECT 
    id,
    name,
    slug,
    contact_email,
    status,
    created_at
FROM platform_clients 
WHERE slug = 'casa-panpite';

-- Step 4: Re-enable RLS
ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the client was created
SELECT 
    pc.id,
    pc.name,
    pc.slug,
    pc.contact_email,
    pc.plan,
    pc.status,
    pc.created_at
FROM platform_clients pc
ORDER BY pc.created_at DESC
LIMIT 5; 