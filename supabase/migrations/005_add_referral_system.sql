-- Migration: Add Referral System for Customer Acquisition
-- This migration creates tables and functions for referral tracking and rewards

-- Create referral_programs table for restaurant-specific referral settings
CREATE TABLE IF NOT EXISTS public.referral_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  
  -- Referral rewards configuration
  referrer_reward_type TEXT DEFAULT 'stamps', -- 'stamps', 'discount', 'free_item'
  referrer_reward_value INTEGER DEFAULT 5, -- Number of stamps or discount percentage
  referee_reward_type TEXT DEFAULT 'stamps',
  referee_reward_value INTEGER DEFAULT 3,
  
  -- Referral requirements
  min_referee_visits INTEGER DEFAULT 1, -- Minimum visits before referrer gets reward
  min_referee_stamps INTEGER DEFAULT 3, -- Minimum stamps before referrer gets reward
  max_referrals_per_customer INTEGER DEFAULT 10, -- Limit referrals per customer
  
  -- Program settings
  referral_code_prefix TEXT DEFAULT 'REF', -- Prefix for referral codes
  program_name TEXT DEFAULT 'Refer a Friend',
  program_description TEXT,
  terms_and_conditions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one program per restaurant
  UNIQUE(restaurant_id),
  CONSTRAINT valid_reward_type CHECK (referrer_reward_type IN ('stamps', 'discount', 'free_item')),
  CONSTRAINT valid_referee_reward_type CHECK (referee_reward_type IN ('stamps', 'discount', 'free_item'))
);

-- Enable RLS on referral_programs
ALTER TABLE public.referral_programs ENABLE ROW LEVEL SECURITY;

-- Create policy for referral_programs
CREATE POLICY "Restaurant owners can manage their referral programs" 
  ON public.referral_programs 
  FOR ALL 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Create referral_codes table for unique referral codes per customer
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 50, -- Limit uses per code
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique codes per restaurant
  UNIQUE(restaurant_id, referral_code),
  -- Ensure one code per client per restaurant
  UNIQUE(client_id, restaurant_id)
);

-- Enable RLS on referral_codes
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for referral_codes
CREATE POLICY "Restaurant owners can view their referral codes" 
  ON public.referral_codes 
  FOR SELECT 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage referral codes" 
  ON public.referral_codes 
  FOR ALL 
  USING (true);

-- Create referrals table for tracking individual referral relationships
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  referee_client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  
  -- Referral status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'qualified', 'rewarded', 'expired'
  referral_source TEXT DEFAULT 'manual', -- 'manual', 'qr_code', 'link', 'social'
  
  -- Qualification tracking
  referee_visits INTEGER DEFAULT 0,
  referee_stamps INTEGER DEFAULT 0,
  qualified_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  
  -- Reward tracking
  referrer_reward_given BOOLEAN DEFAULT false,
  referee_reward_given BOOLEAN DEFAULT false,
  referrer_reward_details JSONB,
  referee_reward_details JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent self-referrals
  CONSTRAINT no_self_referral CHECK (referrer_client_id != referee_client_id),
  -- Prevent duplicate referrals
  UNIQUE(referrer_client_id, referee_client_id, restaurant_id),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'qualified', 'rewarded', 'expired'))
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policy for referrals
CREATE POLICY "Restaurant owners can view their referrals" 
  ON public.referrals 
  FOR SELECT 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage referrals" 
  ON public.referrals 
  FOR ALL 
  USING (true);

-- Create referral_rewards table for tracking reward distributions
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  
  -- Reward details
  reward_type TEXT NOT NULL, -- 'stamps', 'discount', 'free_item'
  reward_value INTEGER NOT NULL,
  reward_description TEXT,
  recipient_type TEXT NOT NULL, -- 'referrer', 'referee'
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'issued', 'redeemed', 'expired'
  issued_at TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_reward_type CHECK (reward_type IN ('stamps', 'discount', 'free_item')),
  CONSTRAINT valid_recipient_type CHECK (recipient_type IN ('referrer', 'referee')),
  CONSTRAINT valid_reward_status CHECK (status IN ('pending', 'issued', 'redeemed', 'expired'))
);

-- Enable RLS on referral_rewards
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create policy for referral_rewards
CREATE POLICY "Restaurant owners can view their referral rewards" 
  ON public.referral_rewards 
  FOR SELECT 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage referral rewards" 
  ON public.referral_rewards 
  FOR ALL 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_client_id ON public.referral_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_restaurant_id ON public.referral_codes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(referral_code);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_restaurant_id ON public.referrals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_id ON public.referral_rewards(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_client_id ON public.referral_rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON public.referral_rewards(status);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code(
  p_client_id UUID,
  p_restaurant_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_prefix TEXT;
  v_code TEXT;
  v_counter INTEGER := 0;
  v_max_attempts INTEGER := 100;
BEGIN
  -- Get the referral code prefix from the program
  SELECT referral_code_prefix INTO v_prefix
  FROM public.referral_programs
  WHERE restaurant_id = p_restaurant_id;
  
  -- Default prefix if no program exists
  IF v_prefix IS NULL THEN
    v_prefix := 'REF';
  END IF;
  
  -- Generate unique code
  LOOP
    v_counter := v_counter + 1;
    
    -- Generate code: PREFIX + first 3 chars of client name + random 4 digits
    SELECT v_prefix || UPPER(LEFT(REGEXP_REPLACE(c.name, '[^A-Za-z]', '', 'g'), 3)) || 
           LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0')
    INTO v_code
    FROM public.clients c
    WHERE c.id = p_client_id;
    
    -- Check if code is unique
    IF NOT EXISTS (
      SELECT 1 FROM public.referral_codes 
      WHERE restaurant_id = p_restaurant_id AND referral_code = v_code
    ) THEN
      RETURN v_code;
    END IF;
    
    -- Prevent infinite loop
    IF v_counter >= v_max_attempts THEN
      -- Fallback to UUID-based code
      v_code := v_prefix || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- Function to create referral code for a client
CREATE OR REPLACE FUNCTION public.create_referral_code(
  p_client_id UUID,
  p_restaurant_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_code TEXT;
  v_existing_code TEXT;
BEGIN
  -- Check if client already has a referral code
  SELECT referral_code INTO v_existing_code
  FROM public.referral_codes
  WHERE client_id = p_client_id AND restaurant_id = p_restaurant_id;
  
  IF v_existing_code IS NOT NULL THEN
    RETURN v_existing_code;
  END IF;
  
  -- Generate new code
  v_code := public.generate_referral_code(p_client_id, p_restaurant_id);
  
  -- Insert the new referral code
  INSERT INTO public.referral_codes (
    client_id,
    restaurant_id,
    referral_code
  ) VALUES (
    p_client_id,
    p_restaurant_id,
    v_code
  );
  
  RETURN v_code;
END;
$$;

-- Function to process a referral
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referral_code TEXT,
  p_referee_client_id UUID,
  p_restaurant_id UUID,
  p_referral_source TEXT DEFAULT 'manual'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_referral_code_id UUID;
  v_referrer_client_id UUID;
  v_referral_id UUID;
  v_program_active BOOLEAN;
BEGIN
  -- Check if referral program is active
  SELECT is_active INTO v_program_active
  FROM public.referral_programs
  WHERE restaurant_id = p_restaurant_id;
  
  IF NOT COALESCE(v_program_active, false) THEN
    RAISE EXCEPTION 'Referral program is not active for this restaurant';
  END IF;
  
  -- Find the referral code and referrer
  SELECT rc.id, rc.client_id INTO v_referral_code_id, v_referrer_client_id
  FROM public.referral_codes rc
  WHERE rc.referral_code = p_referral_code 
    AND rc.restaurant_id = p_restaurant_id
    AND rc.is_active = true;
  
  IF v_referral_code_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive referral code';
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_client_id = p_referee_client_id THEN
    RAISE EXCEPTION 'Self-referral is not allowed';
  END IF;
  
  -- Check if referral already exists
  IF EXISTS (
    SELECT 1 FROM public.referrals
    WHERE referrer_client_id = v_referrer_client_id
      AND referee_client_id = p_referee_client_id
      AND restaurant_id = p_restaurant_id
  ) THEN
    RAISE EXCEPTION 'Referral already exists between these clients';
  END IF;
  
  -- Create the referral record
  INSERT INTO public.referrals (
    referrer_client_id,
    referee_client_id,
    restaurant_id,
    referral_code_id,
    referral_source,
    status
  ) VALUES (
    v_referrer_client_id,
    p_referee_client_id,
    p_restaurant_id,
    v_referral_code_id,
    p_referral_source,
    'pending'
  ) RETURNING id INTO v_referral_id;
  
  -- Update referral code usage
  UPDATE public.referral_codes
  SET times_used = times_used + 1,
      updated_at = NOW()
  WHERE id = v_referral_code_id;
  
  -- Track analytics event
  PERFORM public.track_customer_event(
    p_referee_client_id,
    p_restaurant_id,
    'referral_created',
    jsonb_build_object(
      'referral_id', v_referral_id,
      'referrer_client_id', v_referrer_client_id,
      'referral_code', p_referral_code,
      'source', p_referral_source
    )
  );
  
  RETURN v_referral_id;
END;
$$;

-- Function to check and update referral qualification
CREATE OR REPLACE FUNCTION public.check_referral_qualification(
  p_referee_client_id UUID,
  p_restaurant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_referral RECORD;
  v_program RECORD;
  v_referee_visits INTEGER;
  v_referee_stamps INTEGER;
BEGIN
  -- Get pending referrals for this referee
  FOR v_referral IN
    SELECT * FROM public.referrals
    WHERE referee_client_id = p_referee_client_id
      AND restaurant_id = p_restaurant_id
      AND status = 'pending'
  LOOP
    -- Get program requirements
    SELECT * INTO v_program
    FROM public.referral_programs
    WHERE restaurant_id = p_restaurant_id;
    
    -- Get referee's current stats
    SELECT 
      COALESCE(visit_count.total_visits, 0),
      COALESCE(c.stamps, 0)
    INTO v_referee_visits, v_referee_stamps
    FROM public.clients c
    LEFT JOIN (
      SELECT client_id, COUNT(*) as total_visits
      FROM public.customer_analytics 
      WHERE event_type = 'visit'
      GROUP BY client_id
    ) visit_count ON c.id = visit_count.client_id
    WHERE c.id = p_referee_client_id;
    
    -- Update referral with current stats
    UPDATE public.referrals
    SET referee_visits = v_referee_visits,
        referee_stamps = v_referee_stamps,
        updated_at = NOW()
    WHERE id = v_referral.id;
    
    -- Check if qualification criteria are met
    IF v_referee_visits >= COALESCE(v_program.min_referee_visits, 1) AND
       v_referee_stamps >= COALESCE(v_program.min_referee_stamps, 3) THEN
      
      -- Mark as qualified
      UPDATE public.referrals
      SET status = 'qualified',
          qualified_at = NOW(),
          updated_at = NOW()
      WHERE id = v_referral.id;
      
      -- Track qualification event
      PERFORM public.track_customer_event(
        p_referee_client_id,
        p_restaurant_id,
        'referral_qualified',
        jsonb_build_object(
          'referral_id', v_referral.id,
          'referee_visits', v_referee_visits,
          'referee_stamps', v_referee_stamps
        )
      );
      
      -- Process rewards
      PERFORM public.process_referral_rewards(v_referral.id);
    END IF;
  END LOOP;
END;
$$;

-- Function to process referral rewards
CREATE OR REPLACE FUNCTION public.process_referral_rewards(
  p_referral_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_referral RECORD;
  v_program RECORD;
BEGIN
  -- Get referral details
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE id = p_referral_id AND status = 'qualified';
  
  IF v_referral IS NULL THEN
    RETURN;
  END IF;
  
  -- Get program details
  SELECT * INTO v_program
  FROM public.referral_programs
  WHERE restaurant_id = v_referral.restaurant_id;
  
  -- Create referrer reward
  IF NOT v_referral.referrer_reward_given THEN
    INSERT INTO public.referral_rewards (
      referral_id,
      client_id,
      restaurant_id,
      reward_type,
      reward_value,
      reward_description,
      recipient_type,
      status,
      issued_at
    ) VALUES (
      p_referral_id,
      v_referral.referrer_client_id,
      v_referral.restaurant_id,
      v_program.referrer_reward_type,
      v_program.referrer_reward_value,
      'Referral reward for bringing a friend',
      'referrer',
      'issued',
      NOW()
    );
    
    -- Apply stamps reward if applicable
    IF v_program.referrer_reward_type = 'stamps' THEN
      UPDATE public.clients
      SET stamps = stamps + v_program.referrer_reward_value,
          updated_at = NOW()
      WHERE id = v_referral.referrer_client_id;
    END IF;
  END IF;
  
  -- Create referee reward
  IF NOT v_referral.referee_reward_given THEN
    INSERT INTO public.referral_rewards (
      referral_id,
      client_id,
      restaurant_id,
      reward_type,
      reward_value,
      reward_description,
      recipient_type,
      status,
      issued_at
    ) VALUES (
      p_referral_id,
      v_referral.referee_client_id,
      v_referral.restaurant_id,
      v_program.referee_reward_type,
      v_program.referee_reward_value,
      'Welcome reward for being referred',
      'referee',
      'issued',
      NOW()
    );
    
    -- Apply stamps reward if applicable
    IF v_program.referee_reward_type = 'stamps' THEN
      UPDATE public.clients
      SET stamps = stamps + v_program.referee_reward_value,
          updated_at = NOW()
      WHERE id = v_referral.referee_client_id;
    END IF;
  END IF;
  
  -- Mark referral as rewarded
  UPDATE public.referrals
  SET status = 'rewarded',
      rewarded_at = NOW(),
      referrer_reward_given = true,
      referee_reward_given = true,
      updated_at = NOW()
  WHERE id = p_referral_id;
END;
$$;

-- Trigger to check referral qualification when client data changes
CREATE OR REPLACE FUNCTION public.check_referral_on_client_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Check referral qualification when stamps are updated
  IF NEW.stamps != OLD.stamps THEN
    PERFORM public.check_referral_qualification(NEW.id, NEW.restaurant_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_client_update_check_referral ON public.clients;
CREATE TRIGGER on_client_update_check_referral
  AFTER UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.check_referral_on_client_update();

-- Trigger to check referral qualification on analytics events
CREATE OR REPLACE FUNCTION public.check_referral_on_analytics_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Check referral qualification on visit events
  IF NEW.event_type = 'visit' THEN
    PERFORM public.check_referral_qualification(NEW.client_id, NEW.restaurant_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_analytics_event_check_referral ON public.customer_analytics;
CREATE TRIGGER on_analytics_event_check_referral
  AFTER INSERT ON public.customer_analytics
  FOR EACH ROW EXECUTE PROCEDURE public.check_referral_on_analytics_event();

-- Add helpful comments
COMMENT ON TABLE public.referral_programs IS 'Restaurant-specific referral program configurations';
COMMENT ON TABLE public.referral_codes IS 'Unique referral codes for each customer';
COMMENT ON TABLE public.referrals IS 'Individual referral relationships and tracking';
COMMENT ON TABLE public.referral_rewards IS 'Rewards issued for successful referrals';
COMMENT ON FUNCTION public.generate_referral_code(UUID, UUID) IS 'Generates unique referral codes for customers';
COMMENT ON FUNCTION public.create_referral_code(UUID, UUID) IS 'Creates or returns existing referral code for a client';
COMMENT ON FUNCTION public.process_referral(TEXT, UUID, UUID, TEXT) IS 'Processes a new referral using a referral code';
COMMENT ON FUNCTION public.check_referral_qualification(UUID, UUID) IS 'Checks and updates referral qualification status';
COMMENT ON FUNCTION public.process_referral_rewards(UUID) IS 'Issues rewards for qualified referrals'; 