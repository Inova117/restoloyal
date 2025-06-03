-- QUICK DATABASE CLEANUP: Remove zerionstudio client manually
-- Execute this in Supabase SQL Editor if Edge Function can't be deployed immediately

-- Step 1: Check if client exists
SELECT id, name, slug FROM platform_clients WHERE slug = 'zerionstudio';

-- Step 2: Delete user roles first (avoid foreign key constraint)
DELETE FROM user_roles WHERE client_id IN (
  SELECT id FROM platform_clients WHERE slug = 'zerionstudio'
);

-- Step 3: Delete the platform client
DELETE FROM platform_clients WHERE slug = 'zerionstudio';

-- Step 4: Verify cleanup
SELECT id, name, slug FROM platform_clients WHERE slug = 'zerionstudio';
-- Should return no rows

-- Note: This manual cleanup allows recreation of 'zerionstudio' client
-- The Edge Function should be deployed for future automated deletions 