-- ============================================================================
-- 👥 STAFF MANAGEMENT TABLES - Day 2 Implementation  
-- Creates/updates staff management system compatible with existing schema
-- FIXED: Works with existing location_staff and user_roles tables
-- ============================================================================

-- 👥 USER_ROLES TABLE - Central role management
-- This table should already exist, we'll just add missing columns
DO $$ 
BEGIN
    -- Create user_roles table if it doesn't exist (it should exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_roles' AND table_schema='public') THEN
        CREATE TABLE public.user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
          location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('superadmin', 'client_admin', 'restaurant_admin', 'location_staff')),
          permissions JSONB DEFAULT '[]',
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, client_id, location_id)
        );
    END IF;

    -- Add missing columns to user_roles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_roles' AND column_name='permissions') THEN
        ALTER TABLE public.user_roles ADD COLUMN permissions JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_roles' AND column_name='status') THEN
        ALTER TABLE public.user_roles ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'pending'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_roles' AND column_name='updated_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 📧 STAFF INVITATIONS TABLE - Track staff invitations
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client_admin', 'restaurant_admin', 'location_staff')),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '[]',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📊 STAFF ACTIVITY LOG TABLE - Track staff actions
CREATE TABLE IF NOT EXISTS public.staff_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔐 STAFF SESSIONS TABLE - Track active sessions  
CREATE TABLE IF NOT EXISTS public.staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔍 INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_client_id ON public.user_roles(client_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_location_id ON public.user_roles(location_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON public.user_roles(status);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_client_id ON public.staff_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_location_id ON public.staff_invitations(location_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON public.staff_invitations(status);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_expires_at ON public.staff_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_staff_activity_log_user_id ON public.staff_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_log_client_id ON public.staff_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_log_action ON public.staff_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_staff_activity_log_created_at ON public.staff_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_staff_sessions_user_id ON public.staff_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_client_id ON public.staff_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_session_token ON public.staff_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_is_active ON public.staff_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires_at ON public.staff_sessions(expires_at);

-- 🔄 TRIGGERS for updated_at
DO $$
BEGIN
    -- Add trigger for user_roles if updated_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='user_roles' AND column_name='updated_at') THEN
        DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
        CREATE TRIGGER update_user_roles_updated_at
          BEFORE UPDATE ON public.user_roles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_staff_invitations_updated_at ON public.staff_invitations;
CREATE TRIGGER update_staff_invitations_updated_at
  BEFORE UPDATE ON public.staff_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 🔄 BUSINESS LOGIC TRIGGERS

-- Trigger to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-expire invitations that are past their expiry date
  UPDATE public.staff_invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run expiry check on any invitation insert/update
DROP TRIGGER IF EXISTS trigger_expire_old_invitations ON public.staff_invitations;
CREATE TRIGGER trigger_expire_old_invitations
  AFTER INSERT OR UPDATE ON public.staff_invitations
  FOR EACH STATEMENT
  EXECUTE FUNCTION expire_old_invitations();

-- Trigger to validate role hierarchy
CREATE OR REPLACE FUNCTION validate_role_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent location_staff from having client-level access
  IF NEW.role = 'location_staff' AND NEW.location_id IS NULL THEN
    RAISE EXCEPTION 'location_staff role requires a location_id';
  END IF;
  
  -- Prevent client_admin from being assigned to specific location
  IF NEW.role = 'client_admin' AND NEW.location_id IS NOT NULL THEN
    RAISE EXCEPTION 'client_admin role should not have location_id';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_role_hierarchy ON public.user_roles;
CREATE TRIGGER trigger_validate_role_hierarchy
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_role_hierarchy();

-- Trigger to sync location_staff table with user_roles
CREATE OR REPLACE FUNCTION sync_location_staff()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'location_staff' THEN
    -- Add to location_staff table if not exists
    INSERT INTO public.location_staff (
      user_id, location_id, client_id, email, name, is_active
    )
    SELECT 
      NEW.user_id, 
      NEW.location_id, 
      NEW.client_id,
      u.email,
      COALESCE(u.raw_user_meta_data->>'name', u.email),
      CASE WHEN NEW.status = 'active' THEN true ELSE false END
    FROM auth.users u
    WHERE u.id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
      location_id = EXCLUDED.location_id,
      client_id = EXCLUDED.client_id,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
      
  ELSIF TG_OP = 'UPDATE' AND NEW.role = 'location_staff' THEN
    -- Update location_staff table
    UPDATE public.location_staff 
    SET 
      location_id = NEW.location_id,
      client_id = NEW.client_id,
      is_active = CASE WHEN NEW.status = 'active' THEN true ELSE false END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
  ELSIF TG_OP = 'DELETE' AND OLD.role = 'location_staff' THEN
    -- Remove from location_staff table
    DELETE FROM public.location_staff WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Only add this trigger if location_staff table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='location_staff' AND table_schema='public') THEN
        DROP TRIGGER IF EXISTS trigger_sync_location_staff ON public.user_roles;
        CREATE TRIGGER trigger_sync_location_staff
          AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
          FOR EACH ROW
          EXECUTE FUNCTION sync_location_staff();
    END IF;
END $$;

-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles table
DROP POLICY IF EXISTS "Users can view roles in their hierarchy" ON public.user_roles;
CREATE POLICY "Users can view roles in their hierarchy" ON public.user_roles
  FOR SELECT USING (
    -- Users can see their own roles
    user_id = auth.uid() OR
    -- Superadmins can see all roles
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    ) OR
    -- Client admins can see roles in their client
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'client_admin'
        AND ur.client_id = user_roles.client_id
        AND ur.status = 'active'
    ) OR
    -- Location staff can see other staff at their location
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.location_id = user_roles.location_id
        AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can insert roles in their hierarchy" ON public.user_roles;
CREATE POLICY "Users can insert roles in their hierarchy" ON public.user_roles
  FOR INSERT WITH CHECK (
    -- Superadmins can create any role
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    ) OR
    -- Client admins can create roles in their client
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'client_admin'
        AND ur.client_id = user_roles.client_id
        AND ur.status = 'active'
    )
  );

-- RLS Policies for staff_invitations table
DROP POLICY IF EXISTS "Users can view invitations in their hierarchy" ON public.staff_invitations;
CREATE POLICY "Users can view invitations in their hierarchy" ON public.staff_invitations
  FOR SELECT USING (
    -- Users can see invitations they sent
    invited_by = auth.uid() OR
    -- Superadmins can see all invitations
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    ) OR
    -- Client admins can see invitations for their client
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'client_admin'
        AND ur.client_id = staff_invitations.client_id
        AND ur.status = 'active'
    )
  );

-- RLS Policies for staff_activity_log table
DROP POLICY IF EXISTS "Users can view activity in their hierarchy" ON public.staff_activity_log;
CREATE POLICY "Users can view activity in their hierarchy" ON public.staff_activity_log
  FOR SELECT USING (
    -- Users can see their own activity
    user_id = auth.uid() OR
    -- Superadmins can see all activity
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    ) OR
    -- Client admins can see activity in their client
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'client_admin'
        AND ur.client_id = staff_activity_log.client_id
        AND ur.status = 'active'
    )
  );

-- RLS Policies for staff_sessions table
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.staff_sessions;
CREATE POLICY "Users can view their own sessions" ON public.staff_sessions
  FOR SELECT USING (
    -- Users can only see their own sessions
    user_id = auth.uid() OR
    -- Superadmins can see all sessions
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    )
  );

-- 📝 COMMENTS for documentation
COMMENT ON TABLE public.user_roles IS 'Central role management for all user types';
COMMENT ON TABLE public.staff_invitations IS 'Staff invitation tracking and management';
COMMENT ON TABLE public.staff_activity_log IS 'Audit log of all staff actions';
COMMENT ON TABLE public.staff_sessions IS 'Active session tracking for security';

COMMENT ON COLUMN public.user_roles.permissions IS 'Array of permission strings for fine-grained access control';
COMMENT ON COLUMN public.staff_invitations.expires_at IS 'When the invitation expires (typically 7 days)';
COMMENT ON COLUMN public.staff_activity_log.details IS 'JSON details of the action performed';
COMMENT ON COLUMN public.staff_sessions.session_token IS 'Unique session identifier';

-- ✅ SUCCESS
SELECT 'Staff management tables created/updated successfully!' as status; 