-- Notification Campaigns Schema and RLS Policies
-- This migration creates tables for managing notification campaigns and logging

-- Create notification_campaigns table
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('push', 'email', 'sms', 'multi')),
  target_audience VARCHAR(50) NOT NULL CHECK (target_audience IN ('all_customers', 'location_customers', 'active_customers', 'inactive_customers', 'high_value_customers')),
  message_title VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  send_immediately BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'partially_sent', 'failed', 'deleted')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('push', 'email', 'sms')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'opened', 'clicked', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  external_id VARCHAR(255), -- ID from third-party service (OneSignal, SendGrid, Twilio)
  external_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign_activity_logs table
CREATE TABLE IF NOT EXISTS campaign_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('campaign_created', 'campaign_updated', 'campaign_scheduled', 'campaign_sent', 'campaign_deleted', 'campaign_paused', 'campaign_resumed')),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign_templates table (for reusable templates)
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('push', 'email', 'sms', 'multi')),
  message_title VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, template_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_client_id ON notification_campaigns (client_id);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_location_id ON notification_campaigns (location_id);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status ON notification_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_by ON notification_campaigns (created_by);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_scheduled_for ON notification_campaigns (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_at ON notification_campaigns (created_at);

CREATE INDEX IF NOT EXISTS idx_notification_logs_campaign_id ON notification_logs (campaign_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer_id ON notification_logs (customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs (status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_type ON notification_logs (notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs (sent_at);

CREATE INDEX IF NOT EXISTS idx_campaign_activity_logs_campaign_id ON campaign_activity_logs (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activity_logs_user_id ON campaign_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activity_logs_activity_type ON campaign_activity_logs (activity_type);
CREATE INDEX IF NOT EXISTS idx_campaign_activity_logs_created_at ON campaign_activity_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_campaign_templates_client_id ON campaign_templates (client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_template_type ON campaign_templates (template_type);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_is_active ON campaign_templates (is_active);

-- Enable RLS on all tables
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_campaigns table
DROP POLICY IF EXISTS "Platform admins can manage all campaigns" ON notification_campaigns;
CREATE POLICY "Platform admins can manage all campaigns" ON notification_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Client admins can manage their campaigns" ON notification_campaigns;
CREATE POLICY "Client admins can manage their campaigns" ON notification_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = notification_campaigns.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Restaurant admins can manage location campaigns" ON notification_campaigns;
CREATE POLICY "Restaurant admins can manage location campaigns" ON notification_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = notification_campaigns.client_id
      AND ur.role = 'restaurant_admin'
      AND ur.status = 'active'
      AND (
        notification_campaigns.location_id IS NULL OR
        ur.location_id = notification_campaigns.location_id
      )
    )
  );

-- RLS Policies for notification_logs table
DROP POLICY IF EXISTS "Platform admins can view all logs" ON notification_logs;
CREATE POLICY "Platform admins can view all logs" ON notification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Client admins can view their campaign logs" ON notification_logs;
CREATE POLICY "Client admins can view their campaign logs" ON notification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN notification_campaigns nc ON nc.id = notification_logs.campaign_id
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = nc.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Restaurant admins can view location campaign logs" ON notification_logs;
CREATE POLICY "Restaurant admins can view location campaign logs" ON notification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN notification_campaigns nc ON nc.id = notification_logs.campaign_id
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = nc.client_id
      AND ur.role = 'restaurant_admin'
      AND ur.status = 'active'
      AND (
        nc.location_id IS NULL OR
        ur.location_id = nc.location_id
      )
    )
  );

DROP POLICY IF EXISTS "System can insert notification logs" ON notification_logs;
CREATE POLICY "System can insert notification logs" ON notification_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for campaign_activity_logs table
DROP POLICY IF EXISTS "Platform admins can view all activity logs" ON campaign_activity_logs;
CREATE POLICY "Platform admins can view all activity logs" ON campaign_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Client admins can view their campaign activity" ON campaign_activity_logs;
CREATE POLICY "Client admins can view their campaign activity" ON campaign_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN notification_campaigns nc ON nc.id = campaign_activity_logs.campaign_id
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = nc.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own activity logs" ON campaign_activity_logs;
CREATE POLICY "Users can insert their own activity logs" ON campaign_activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert activity logs" ON campaign_activity_logs;
CREATE POLICY "System can insert activity logs" ON campaign_activity_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for campaign_templates table
DROP POLICY IF EXISTS "Platform admins can manage all templates" ON campaign_templates;
CREATE POLICY "Platform admins can manage all templates" ON campaign_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Client admins can manage their templates" ON campaign_templates;
CREATE POLICY "Client admins can manage their templates" ON campaign_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = campaign_templates.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Restaurant admins can view client templates" ON campaign_templates;
CREATE POLICY "Restaurant admins can view client templates" ON campaign_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = campaign_templates.client_id
      AND ur.role = 'restaurant_admin'
      AND ur.status = 'active'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notification_campaigns TO authenticated;
GRANT SELECT, INSERT ON notification_logs TO authenticated;
GRANT SELECT, INSERT ON campaign_activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON campaign_templates TO authenticated;

GRANT ALL ON notification_campaigns TO service_role;
GRANT ALL ON notification_logs TO service_role;
GRANT ALL ON campaign_activity_logs TO service_role;
GRANT ALL ON campaign_templates TO service_role;

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_notification_campaign_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_campaign_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_notification_campaigns_timestamp ON notification_campaigns;
CREATE TRIGGER update_notification_campaigns_timestamp
  BEFORE UPDATE ON notification_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_notification_campaign_timestamp();

DROP TRIGGER IF EXISTS update_campaign_templates_timestamp ON campaign_templates;
CREATE TRIGGER update_campaign_templates_timestamp
  BEFORE UPDATE ON campaign_templates
  FOR EACH ROW EXECUTE FUNCTION update_campaign_template_timestamp();

-- Create function to automatically set client_id for campaigns
CREATE OR REPLACE FUNCTION set_campaign_client_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If location_id is provided but client_id is not, get client_id from location
  IF NEW.location_id IS NOT NULL AND NEW.client_id IS NULL THEN
    SELECT l.client_id INTO NEW.client_id
    FROM locations l
    WHERE l.id = NEW.location_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic client_id setting
DROP TRIGGER IF EXISTS set_campaign_client_id_trigger ON notification_campaigns;
CREATE TRIGGER set_campaign_client_id_trigger
  BEFORE INSERT OR UPDATE ON notification_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_campaign_client_id();

-- Insert sample campaign templates
DO $$
DECLARE
  galletti_client_uuid UUID;
BEGIN
  -- Get Galletti client ID
  SELECT id INTO galletti_client_uuid FROM platform_clients WHERE slug = 'galletti' LIMIT 1;
  
  IF galletti_client_uuid IS NOT NULL THEN
    -- Insert sample templates
    INSERT INTO campaign_templates (client_id, template_name, template_type, message_title, message_content, created_by)
    VALUES 
      (galletti_client_uuid, 'Welcome New Customer', 'multi', 'Welcome to Galletti!', 'Thank you for joining our loyalty program! Earn stamps with every purchase and get rewarded.', (SELECT id FROM auth.users LIMIT 1)),
      (galletti_client_uuid, 'Reward Available', 'push', 'Your reward is ready!', 'You have earned a free item! Visit any Galletti location to redeem your reward.', (SELECT id FROM auth.users LIMIT 1)),
      (galletti_client_uuid, 'Special Promotion', 'email', 'Limited Time Offer!', 'Get double stamps on all purchases this weekend. Don''t miss out on this amazing deal!', (SELECT id FROM auth.users LIMIT 1)),
      (galletti_client_uuid, 'Birthday Special', 'sms', 'Happy Birthday!', 'Celebrate your special day with a free birthday treat from Galletti!', (SELECT id FROM auth.users LIMIT 1)),
      (galletti_client_uuid, 'Inactive Customer', 'multi', 'We miss you!', 'It''s been a while since your last visit. Come back and enjoy your favorite items with a special discount!', (SELECT id FROM auth.users LIMIT 1))
    ON CONFLICT (client_id, template_name) DO NOTHING;
    
    RAISE NOTICE 'Sample campaign templates inserted for Galletti client';
  END IF;
END $$;

-- Create view for campaign analytics
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
  nc.id,
  nc.campaign_name,
  nc.campaign_type,
  nc.target_audience,
  nc.status,
  nc.sent_count,
  nc.failed_count,
  nc.created_at,
  nc.sent_at,
  nc.completed_at,
  COUNT(nl.id) as total_notifications,
  COUNT(CASE WHEN nl.status = 'delivered' THEN 1 END) as delivered_count,
  COUNT(CASE WHEN nl.status = 'opened' THEN 1 END) as opened_count,
  COUNT(CASE WHEN nl.status = 'clicked' THEN 1 END) as clicked_count,
  COUNT(CASE WHEN nl.status = 'failed' THEN 1 END) as failed_notifications,
  CASE 
    WHEN COUNT(nl.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN nl.status = 'delivered' THEN 1 END)::decimal / COUNT(nl.id) * 100), 2)
    ELSE 0 
  END as delivery_rate,
  CASE 
    WHEN COUNT(nl.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN nl.status = 'opened' THEN 1 END)::decimal / COUNT(nl.id) * 100), 2)
    ELSE 0 
  END as open_rate,
  CASE 
    WHEN COUNT(nl.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN nl.status = 'clicked' THEN 1 END)::decimal / COUNT(nl.id) * 100), 2)
    ELSE 0 
  END as click_rate
FROM notification_campaigns nc
LEFT JOIN notification_logs nl ON nc.id = nl.campaign_id
WHERE nc.status != 'deleted'
GROUP BY nc.id, nc.campaign_name, nc.campaign_type, nc.target_audience, nc.status, 
         nc.sent_count, nc.failed_count, nc.created_at, nc.sent_at, nc.completed_at;

-- Grant access to the view
GRANT SELECT ON campaign_analytics TO authenticated;
GRANT SELECT ON campaign_analytics TO service_role;

-- Create function for scheduled campaign processing (for future cron job)
CREATE OR REPLACE FUNCTION process_scheduled_campaigns()
RETURNS void AS $$
DECLARE
  campaign_record RECORD;
BEGIN
  -- Find campaigns that are scheduled and ready to send
  FOR campaign_record IN 
    SELECT id, campaign_name
    FROM notification_campaigns
    WHERE status = 'scheduled'
    AND scheduled_for <= CURRENT_TIMESTAMP
  LOOP
    -- Update status to sending
    UPDATE notification_campaigns
    SET status = 'sending', sent_at = CURRENT_TIMESTAMP
    WHERE id = campaign_record.id;
    
    -- Log the processing (actual sending would be handled by Edge Function)
    INSERT INTO campaign_activity_logs (campaign_id, activity_type, user_id, details)
    VALUES (
      campaign_record.id,
      'campaign_sent',
      (SELECT created_by FROM notification_campaigns WHERE id = campaign_record.id),
      jsonb_build_object('automated', true, 'processed_at', CURRENT_TIMESTAMP)
    );
    
    RAISE NOTICE 'Processed scheduled campaign: %', campaign_record.campaign_name;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification preferences table (for customer opt-in/opt-out)
CREATE TABLE IF NOT EXISTS customer_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  promotional_notifications BOOLEAN DEFAULT true,
  transactional_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, client_id)
);

-- Enable RLS on notification preferences
ALTER TABLE customer_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policy for notification preferences
DROP POLICY IF EXISTS "Customers can manage their own preferences" ON customer_notification_preferences;
CREATE POLICY "Customers can manage their own preferences" ON customer_notification_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_notification_preferences.customer_id
      AND c.id = auth.uid()::text::uuid -- Assuming customer auth
    )
  );

DROP POLICY IF EXISTS "Client admins can view customer preferences" ON customer_notification_preferences;
CREATE POLICY "Client admins can view customer preferences" ON customer_notification_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = customer_notification_preferences.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON customer_notification_preferences TO authenticated;
GRANT ALL ON customer_notification_preferences TO service_role;

-- Create index for notification preferences
CREATE INDEX IF NOT EXISTS idx_customer_notification_preferences_customer_id ON customer_notification_preferences (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notification_preferences_client_id ON customer_notification_preferences (client_id);

-- Completion notices
DO $$
BEGIN
  RAISE NOTICE '=== NOTIFICATION CAMPAIGNS SCHEMA COMPLETE ===';
  RAISE NOTICE 'Created tables: notification_campaigns, notification_logs, campaign_activity_logs, campaign_templates, customer_notification_preferences';
  RAISE NOTICE 'Created view: campaign_analytics';
  RAISE NOTICE 'Created function: process_scheduled_campaigns';
  RAISE NOTICE 'All RLS policies and permissions configured';
  RAISE NOTICE 'Sample campaign templates inserted';
  RAISE NOTICE 'Ready for notification campaign management!';
END $$; 