-- Migration: Add Apple Wallet Update Triggers
-- This migration adds triggers to automatically update timestamps for Apple Wallet live updates

-- Create or replace function to update client updated_at timestamp when stamps are added
CREATE OR REPLACE FUNCTION public.update_client_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Update the client's updated_at timestamp when a stamp is added
  UPDATE public.clients 
  SET updated_at = NOW() 
  WHERE id = NEW.client_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update client timestamp when stamp is added
DROP TRIGGER IF EXISTS on_stamp_added_update_client ON public.stamps;
CREATE TRIGGER on_stamp_added_update_client
  AFTER INSERT ON public.stamps
  FOR EACH ROW EXECUTE PROCEDURE public.update_client_timestamp();

-- Create or replace function to update client stamp count
CREATE OR REPLACE FUNCTION public.update_client_stamp_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment stamp count when a new stamp is added
    UPDATE public.clients 
    SET stamps = stamps + 1, updated_at = NOW()
    WHERE id = NEW.client_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement stamp count when a stamp is removed
    UPDATE public.clients 
    SET stamps = GREATEST(stamps - 1, 0), updated_at = NOW()
    WHERE id = OLD.client_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger to automatically update stamp count
DROP TRIGGER IF EXISTS on_stamp_change_update_count ON public.stamps;
CREATE TRIGGER on_stamp_change_update_count
  AFTER INSERT OR DELETE ON public.stamps
  FOR EACH ROW EXECUTE PROCEDURE public.update_client_stamp_count();

-- Create or replace function to reset stamps when reward is redeemed
CREATE OR REPLACE FUNCTION public.handle_reward_redemption()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Reset client stamps to 0 when reward is redeemed
  UPDATE public.clients 
  SET stamps = 0, updated_at = NOW()
  WHERE id = NEW.client_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for reward redemption
DROP TRIGGER IF EXISTS on_reward_redeemed_reset_stamps ON public.rewards;
CREATE TRIGGER on_reward_redeemed_reset_stamps
  AFTER INSERT ON public.rewards
  FOR EACH ROW EXECUTE PROCEDURE public.handle_reward_redemption();

-- Add device registration table for Apple Wallet push notifications
CREATE TABLE IF NOT EXISTS public.wallet_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_library_identifier TEXT NOT NULL,
  pass_type_identifier TEXT NOT NULL,
  serial_number TEXT NOT NULL, -- client_id
  push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique device registration per pass
  UNIQUE(device_library_identifier, pass_type_identifier, serial_number)
);

-- Enable RLS on wallet_devices
ALTER TABLE public.wallet_devices ENABLE ROW LEVEL SECURITY;

-- Create policy for wallet device registration (allow service role access)
CREATE POLICY "Service role can manage wallet devices" 
  ON public.wallet_devices 
  FOR ALL 
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_devices_serial_number ON public.wallet_devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_wallet_devices_push_token ON public.wallet_devices(push_token);

-- Add helpful comments
COMMENT ON TABLE public.wallet_devices IS 'Stores Apple Wallet device registrations for push notifications';
COMMENT ON FUNCTION public.update_client_timestamp() IS 'Updates client timestamp when stamps are modified for Apple Wallet sync';
COMMENT ON FUNCTION public.update_client_stamp_count() IS 'Automatically maintains accurate stamp counts';
COMMENT ON FUNCTION public.handle_reward_redemption() IS 'Resets stamps to 0 when rewards are redeemed'; 