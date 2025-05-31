-- Migration: Add Geolocation Support for Push Notifications
-- This migration adds location fields to restaurants and creates geo-trigger logging

-- Add location fields to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS notification_radius INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS notification_message TEXT,
ADD COLUMN IF NOT EXISTS geo_notifications_enabled BOOLEAN DEFAULT true;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON public.restaurants(latitude, longitude);

-- Create geo_triggers table for logging location-based notifications
CREATE TABLE IF NOT EXISTS public.geo_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id),
  restaurants_triggered TEXT[], -- Array of restaurant IDs
  notifications_sent INTEGER DEFAULT 0,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on geo_triggers
ALTER TABLE public.geo_triggers ENABLE ROW LEVEL SECURITY;

-- Create policy for geo_triggers (service role access for logging)
CREATE POLICY "Service role can manage geo triggers" 
  ON public.geo_triggers 
  FOR ALL 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_geo_triggers_location ON public.geo_triggers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_geo_triggers_user_id ON public.geo_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_geo_triggers_client_id ON public.geo_triggers(client_id);
CREATE INDEX IF NOT EXISTS idx_geo_triggers_triggered_at ON public.geo_triggers(triggered_at);

-- Create notification_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  geo_notifications_enabled BOOLEAN DEFAULT true,
  notification_radius INTEGER DEFAULT 500, -- User's preferred radius in meters
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique settings per user/client combination
  UNIQUE(user_id, client_id)
);

-- Enable RLS on notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_settings
CREATE POLICY "Users can view their own notification settings" 
  ON public.notification_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification settings" 
  ON public.notification_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
  ON public.notification_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index for notification settings
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_client_id ON public.notification_settings(client_id);

-- Create function to check if notifications should be sent based on quiet hours
CREATE OR REPLACE FUNCTION public.should_send_notification(
  user_id_param UUID,
  client_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  settings RECORD;
  current_time_only TIME;
BEGIN
  -- Get current time
  current_time_only := CURRENT_TIME;
  
  -- Get user's notification settings
  SELECT * INTO settings
  FROM public.notification_settings
  WHERE user_id = user_id_param
  AND (client_id_param IS NULL OR client_id = client_id_param)
  ORDER BY client_id NULLS LAST
  LIMIT 1;
  
  -- If no settings found, default to allowing notifications
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- Check if geo notifications are disabled
  IF NOT settings.geo_notifications_enabled THEN
    RETURN false;
  END IF;
  
  -- Check quiet hours
  IF settings.quiet_hours_start IS NOT NULL AND settings.quiet_hours_end IS NOT NULL THEN
    -- Handle quiet hours that span midnight
    IF settings.quiet_hours_start <= settings.quiet_hours_end THEN
      -- Same day quiet hours (e.g., 22:00 to 06:00 next day)
      IF current_time_only >= settings.quiet_hours_start AND current_time_only <= settings.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Quiet hours span midnight (e.g., 22:00 to 06:00)
      IF current_time_only >= settings.quiet_hours_start OR current_time_only <= settings.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Add sample location data for testing (you can remove this in production)
-- UPDATE public.restaurants 
-- SET 
--   latitude = 40.7128,
--   longitude = -74.0060,
--   notification_radius = 500,
--   notification_message = 'Welcome! Come collect your loyalty stamps.',
--   geo_notifications_enabled = true
-- WHERE latitude IS NULL;

-- Add helpful comments
COMMENT ON TABLE public.geo_triggers IS 'Logs geolocation-based notification triggers for analytics';
COMMENT ON TABLE public.notification_settings IS 'User preferences for push notifications and quiet hours';
COMMENT ON COLUMN public.restaurants.latitude IS 'Restaurant latitude for geolocation notifications';
COMMENT ON COLUMN public.restaurants.longitude IS 'Restaurant longitude for geolocation notifications';
COMMENT ON COLUMN public.restaurants.notification_radius IS 'Radius in meters for triggering proximity notifications';
COMMENT ON COLUMN public.restaurants.notification_message IS 'Custom message for proximity notifications';
COMMENT ON FUNCTION public.should_send_notification(UUID, UUID) IS 'Checks if notifications should be sent based on user preferences and quiet hours'; 