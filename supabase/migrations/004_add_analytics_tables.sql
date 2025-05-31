-- Migration: Add Analytics Tables for Business Intelligence
-- This migration creates tables and views for advanced analytics and reporting

-- Create customer_analytics table for tracking customer behavior
CREATE TABLE IF NOT EXISTS public.customer_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'visit', 'stamp_earned', 'reward_redeemed', 'wallet_added'
  event_data JSONB, -- Additional event-specific data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Indexes for performance
  CONSTRAINT valid_event_type CHECK (event_type IN ('visit', 'stamp_earned', 'reward_redeemed', 'wallet_added', 'geo_notification'))
);

-- Enable RLS on customer_analytics
ALTER TABLE public.customer_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for customer_analytics (restaurant owners can view their data)
CREATE POLICY "Restaurant owners can view their analytics" 
  ON public.customer_analytics 
  FOR SELECT 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Create policy for service role to insert analytics
CREATE POLICY "Service role can insert analytics" 
  ON public.customer_analytics 
  FOR INSERT 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_analytics_client_id ON public.customer_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_restaurant_id ON public.customer_analytics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_event_type ON public.customer_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_created_at ON public.customer_analytics(created_at);

-- Create business_metrics table for daily/weekly/monthly aggregations
CREATE TABLE IF NOT EXISTS public.business_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  
  -- Customer metrics
  new_customers INTEGER DEFAULT 0,
  active_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  -- Engagement metrics
  total_stamps INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  rewards_redeemed INTEGER DEFAULT 0,
  
  -- Retention metrics
  retention_rate DECIMAL(5,2), -- Percentage
  avg_stamps_per_customer DECIMAL(8,2),
  avg_days_between_visits DECIMAL(8,2),
  
  -- Wallet metrics
  wallet_passes_generated INTEGER DEFAULT 0,
  geo_notifications_sent INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique metrics per restaurant/date/period
  UNIQUE(restaurant_id, metric_date, period_type),
  CONSTRAINT valid_period_type CHECK (period_type IN ('daily', 'weekly', 'monthly'))
);

-- Enable RLS on business_metrics
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for business_metrics
CREATE POLICY "Restaurant owners can view their metrics" 
  ON public.business_metrics 
  FOR ALL 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Create indexes for business_metrics
CREATE INDEX IF NOT EXISTS idx_business_metrics_restaurant_id ON public.business_metrics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_business_metrics_date ON public.business_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_business_metrics_period ON public.business_metrics(period_type);

-- Create customer_cohorts table for cohort analysis
CREATE TABLE IF NOT EXISTS public.customer_cohorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  cohort_month DATE NOT NULL, -- First month customer joined
  period_number INTEGER NOT NULL, -- 0 = first month, 1 = second month, etc.
  customers_count INTEGER NOT NULL,
  active_customers INTEGER NOT NULL,
  retention_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique cohort data
  UNIQUE(restaurant_id, cohort_month, period_number)
);

-- Enable RLS on customer_cohorts
ALTER TABLE public.customer_cohorts ENABLE ROW LEVEL SECURITY;

-- Create policy for customer_cohorts
CREATE POLICY "Restaurant owners can view their cohorts" 
  ON public.customer_cohorts 
  FOR ALL 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Create indexes for customer_cohorts
CREATE INDEX IF NOT EXISTS idx_customer_cohorts_restaurant_id ON public.customer_cohorts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_cohorts_month ON public.customer_cohorts(cohort_month);

-- Create analytics views for easy querying

-- View: Customer lifetime value and engagement
CREATE OR REPLACE VIEW public.customer_insights AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.restaurant_id,
  c.stamps,
  c.created_at as joined_date,
  
  -- Engagement metrics
  COALESCE(stamp_count.total_stamps, 0) as lifetime_stamps,
  COALESCE(reward_count.total_rewards, 0) as lifetime_rewards,
  COALESCE(visit_count.total_visits, 0) as total_visits,
  
  -- Timing metrics
  EXTRACT(DAYS FROM (NOW() - c.created_at)) as days_since_joined,
  last_activity.last_visit,
  EXTRACT(DAYS FROM (NOW() - last_activity.last_visit)) as days_since_last_visit,
  
  -- Calculated metrics
  CASE 
    WHEN COALESCE(visit_count.total_visits, 0) > 0 
    THEN COALESCE(stamp_count.total_stamps, 0)::DECIMAL / visit_count.total_visits 
    ELSE 0 
  END as avg_stamps_per_visit,
  
  -- Customer status
  CASE 
    WHEN EXTRACT(DAYS FROM (NOW() - COALESCE(last_activity.last_visit, c.created_at))) <= 30 THEN 'Active'
    WHEN EXTRACT(DAYS FROM (NOW() - COALESCE(last_activity.last_visit, c.created_at))) <= 90 THEN 'At Risk'
    ELSE 'Inactive'
  END as customer_status

FROM public.clients c
LEFT JOIN (
  SELECT client_id, COUNT(*) as total_stamps
  FROM public.stamps 
  GROUP BY client_id
) stamp_count ON c.id = stamp_count.client_id
LEFT JOIN (
  SELECT client_id, COUNT(*) as total_rewards
  FROM public.rewards 
  GROUP BY client_id
) reward_count ON c.id = reward_count.client_id
LEFT JOIN (
  SELECT client_id, COUNT(*) as total_visits
  FROM public.customer_analytics 
  WHERE event_type = 'visit'
  GROUP BY client_id
) visit_count ON c.id = visit_count.client_id
LEFT JOIN (
  SELECT client_id, MAX(created_at) as last_visit
  FROM public.customer_analytics 
  WHERE event_type = 'visit'
  GROUP BY client_id
) last_activity ON c.id = last_activity.client_id;

-- View: Restaurant performance summary
CREATE OR REPLACE VIEW public.restaurant_performance AS
SELECT 
  r.id,
  r.name,
  r.created_at as restaurant_since,
  
  -- Customer metrics
  COALESCE(customer_stats.total_customers, 0) as total_customers,
  COALESCE(customer_stats.active_customers, 0) as active_customers,
  COALESCE(customer_stats.new_customers_30d, 0) as new_customers_30d,
  
  -- Engagement metrics
  COALESCE(engagement_stats.total_stamps, 0) as total_stamps,
  COALESCE(engagement_stats.total_rewards, 0) as total_rewards,
  COALESCE(engagement_stats.stamps_30d, 0) as stamps_last_30d,
  COALESCE(engagement_stats.rewards_30d, 0) as rewards_last_30d,
  
  -- Calculated metrics
  CASE 
    WHEN COALESCE(customer_stats.total_customers, 0) > 0 
    THEN COALESCE(engagement_stats.total_stamps, 0)::DECIMAL / customer_stats.total_customers 
    ELSE 0 
  END as avg_stamps_per_customer,
  
  CASE 
    WHEN COALESCE(customer_stats.total_customers, 0) > 0 
    THEN (COALESCE(customer_stats.active_customers, 0)::DECIMAL / customer_stats.total_customers * 100)
    ELSE 0 
  END as customer_retention_rate

FROM public.restaurants r
LEFT JOIN (
  SELECT 
    c.restaurant_id,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN ci.customer_status = 'Active' THEN 1 END) as active_customers,
    COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_customers_30d
  FROM public.clients c
  LEFT JOIN public.customer_insights ci ON c.id = ci.id
  GROUP BY c.restaurant_id
) customer_stats ON r.id = customer_stats.restaurant_id
LEFT JOIN (
  SELECT 
    c2.restaurant_id,
    COUNT(CASE WHEN s.created_at IS NOT NULL THEN 1 END) as total_stamps,
    COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as stamps_30d,
    COUNT(CASE WHEN rw.created_at IS NOT NULL THEN 1 END) as total_rewards,
    COUNT(CASE WHEN rw.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as rewards_30d
  FROM public.clients c2
  LEFT JOIN public.stamps s ON c2.id = s.client_id
  LEFT JOIN public.rewards rw ON c2.id = rw.client_id
  GROUP BY c2.restaurant_id
) engagement_stats ON r.id = engagement_stats.restaurant_id;

-- Function to track customer analytics events
CREATE OR REPLACE FUNCTION public.track_customer_event(
  p_client_id UUID,
  p_restaurant_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.customer_analytics (
    client_id,
    restaurant_id,
    event_type,
    event_data
  ) VALUES (
    p_client_id,
    p_restaurant_id,
    p_event_type,
    p_event_data
  );
END;
$$;

-- Function to calculate and update business metrics
CREATE OR REPLACE FUNCTION public.calculate_business_metrics(
  p_restaurant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_period_type TEXT DEFAULT 'daily'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  metrics_record RECORD;
BEGIN
  -- Calculate date range based on period type
  CASE p_period_type
    WHEN 'daily' THEN
      start_date := p_date;
      end_date := p_date;
    WHEN 'weekly' THEN
      start_date := p_date - EXTRACT(DOW FROM p_date)::INTEGER;
      end_date := start_date + INTERVAL '6 days';
    WHEN 'monthly' THEN
      start_date := DATE_TRUNC('month', p_date);
      end_date := (DATE_TRUNC('month', p_date) + INTERVAL '1 month - 1 day')::DATE;
  END CASE;

  -- Calculate metrics
  SELECT 
    COUNT(DISTINCT CASE WHEN c.created_at::DATE BETWEEN start_date AND end_date THEN c.id END) as new_customers,
    COUNT(DISTINCT CASE WHEN ca.created_at::DATE BETWEEN start_date AND end_date THEN ca.client_id END) as active_customers,
    COUNT(DISTINCT CASE WHEN ca.created_at::DATE BETWEEN start_date AND end_date AND ca.event_type = 'visit' 
                         AND EXISTS(SELECT 1 FROM public.customer_analytics ca2 
                                   WHERE ca2.client_id = ca.client_id 
                                   AND ca2.created_at < start_date) THEN ca.client_id END) as returning_customers,
    COUNT(CASE WHEN s.created_at::DATE BETWEEN start_date AND end_date THEN 1 END) as total_stamps,
    COUNT(CASE WHEN ca.event_type = 'visit' AND ca.created_at::DATE BETWEEN start_date AND end_date THEN 1 END) as total_visits,
    COUNT(CASE WHEN r.created_at::DATE BETWEEN start_date AND end_date THEN 1 END) as rewards_redeemed
  INTO metrics_record
  FROM public.restaurants rest
  LEFT JOIN public.clients c ON rest.id = c.restaurant_id
  LEFT JOIN public.customer_analytics ca ON c.id = ca.client_id
  LEFT JOIN public.stamps s ON c.id = s.client_id
  LEFT JOIN public.rewards r ON c.id = r.client_id
  WHERE rest.id = p_restaurant_id;

  -- Insert or update business metrics
  INSERT INTO public.business_metrics (
    restaurant_id,
    metric_date,
    period_type,
    new_customers,
    active_customers,
    returning_customers,
    total_stamps,
    total_visits,
    rewards_redeemed
  ) VALUES (
    p_restaurant_id,
    p_date,
    p_period_type,
    metrics_record.new_customers,
    metrics_record.active_customers,
    metrics_record.returning_customers,
    metrics_record.total_stamps,
    metrics_record.total_visits,
    metrics_record.rewards_redeemed
  )
  ON CONFLICT (restaurant_id, metric_date, period_type)
  DO UPDATE SET
    new_customers = EXCLUDED.new_customers,
    active_customers = EXCLUDED.active_customers,
    returning_customers = EXCLUDED.returning_customers,
    total_stamps = EXCLUDED.total_stamps,
    total_visits = EXCLUDED.total_visits,
    rewards_redeemed = EXCLUDED.rewards_redeemed,
    updated_at = NOW();
END;
$$;

-- Create triggers to automatically track events

-- Track stamp events
CREATE OR REPLACE FUNCTION public.track_stamp_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM public.track_customer_event(
    NEW.client_id,
    NEW.restaurant_id,
    'stamp_earned',
    jsonb_build_object('stamp_id', NEW.id, 'added_by', NEW.added_by)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stamp_track_event ON public.stamps;
CREATE TRIGGER on_stamp_track_event
  AFTER INSERT ON public.stamps
  FOR EACH ROW EXECUTE PROCEDURE public.track_stamp_event();

-- Track reward events
CREATE OR REPLACE FUNCTION public.track_reward_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM public.track_customer_event(
    NEW.client_id,
    NEW.restaurant_id,
    'reward_redeemed',
    jsonb_build_object('reward_id', NEW.id, 'stamps_used', NEW.stamps_used, 'redeemed_by', NEW.redeemed_by)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reward_track_event ON public.rewards;
CREATE TRIGGER on_reward_track_event
  AFTER INSERT ON public.rewards
  FOR EACH ROW EXECUTE PROCEDURE public.track_reward_event();

-- Add helpful comments
COMMENT ON TABLE public.customer_analytics IS 'Tracks all customer events for analytics and insights';
COMMENT ON TABLE public.business_metrics IS 'Aggregated business metrics for reporting dashboards';
COMMENT ON TABLE public.customer_cohorts IS 'Customer cohort analysis for retention tracking';
COMMENT ON VIEW public.customer_insights IS 'Comprehensive customer behavior and engagement metrics';
COMMENT ON VIEW public.restaurant_performance IS 'Restaurant-level performance and KPI summary';
COMMENT ON FUNCTION public.track_customer_event(UUID, UUID, TEXT, JSONB) IS 'Records customer events for analytics tracking';
COMMENT ON FUNCTION public.calculate_business_metrics(UUID, DATE, TEXT) IS 'Calculates and stores business metrics for reporting'; 