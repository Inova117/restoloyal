-- ⚡ QUICK PLATFORM ADMIN FIX - SAFE VERSION
-- Run this in Supabase SQL Editor to give yourself platform admin access

-- Step 1: Check what's currently in platform_admin_users table
SELECT 
    pau.id,
    pau.email,
    pau.role,
    pau.status,
    pau.created_at
FROM platform_admin_users pau;

-- Step 2: Check if martin@zerionstudio.com exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'martin@zerionstudio.com';

-- Step 3: Check if martin@zerionstudio.com is already a platform admin
SELECT 
    pau.id,
    pau.email,
    pau.role,
    pau.status
FROM platform_admin_users pau
JOIN auth.users au ON pau.user_id = au.id
WHERE au.email = 'martin@zerionstudio.com';

-- Step 4: Add martin@zerionstudio.com as platform admin (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM platform_admin_users pau
        JOIN auth.users au ON pau.user_id = au.id  
        WHERE au.email = 'martin@zerionstudio.com'
    ) THEN
        INSERT INTO platform_admin_users (user_id, email, role, status)
        SELECT 
            id,
            email,
            'platform_admin',
            'active'
        FROM auth.users 
        WHERE email = 'martin@zerionstudio.com';
        
        RAISE NOTICE 'Added martin@zerionstudio.com as platform admin';
    ELSE
        RAISE NOTICE 'martin@zerionstudio.com is already a platform admin';
    END IF;
END
$$;

-- Step 5: Final verification - show all platform admins
SELECT 
    pau.id,
    pau.email,
    pau.role,
    pau.status,
    au.email as auth_email,
    pau.created_at
FROM platform_admin_users pau
JOIN auth.users au ON pau.user_id = au.id
ORDER BY pau.created_at; 