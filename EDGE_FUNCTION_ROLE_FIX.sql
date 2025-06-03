-- ⚡ UPDATE EDGE FUNCTION TO ACCEPT SUPER_ADMIN
-- Update the Edge Function code to accept both platform_admin and super_admin roles

-- In your Edge Function, change this line:
-- OLD CODE:
-- .eq('role', 'platform_admin')

-- NEW CODE:
-- .in('role', ['platform_admin', 'super_admin'])

-- Full section to replace in your Edge Function:

/*
    // Check if user has platform admin role
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('platform_admin_users')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('status', 'active')
      .in('role', ['platform_admin', 'super_admin'])  // ⚡ CHANGE THIS LINE
      .single()
*/ const { data: adminCheck, error: adminError } = await supabaseClient.from('platform_admin_users').select('role').eq('user_id', requestingUser.id).eq('status', 'active').single();