// Deno TypeScript definitions for notification-system Edge Function

// Standard library types
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
}

// Notification System types
export interface NotificationCampaign {
  id?: string;
  client_id: string;
  location_id?: string;
  title: string;
  message: string;
  campaign_type: 'promotional' | 'loyalty_reminder' | 'welcome' | 'churn_prevention' | 'reward_available';
  target_criteria: {
    loyalty_levels?: ('bronze' | 'silver' | 'gold' | 'platinum')[];
    visit_frequency?: 'high' | 'medium' | 'low';
    last_visit_days?: number;
    stamp_range?: { min: number; max: number };
    churn_risk?: ('low' | 'medium' | 'high')[];
    location_ids?: string[];
    customer_ids?: string[];
  };
  schedule: {
    send_immediately: boolean;
    scheduled_at?: string;
  };
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  sent_at?: string;
  created_by: string;
}

export interface NotificationDelivery {
  id?: string;
  campaign_id: string;
  customer_id: string;
  notification_type: 'push' | 'email' | 'sms';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked';
  sent_at?: string;
  delivered_at?: string;
  clicked_at?: string;
  error_message?: string;
  metadata?: any;
}

export interface SendNotificationRequest {
  campaign_id?: string;
  customer_ids: string[];
  notification: {
    title: string;
    body: string;
    data?: any;
  };
  notification_types: ('push' | 'email' | 'sms')[];
  send_immediately?: boolean;
}

export interface CustomerSegmentation {
  total_customers: number;
  segments: {
    loyalty_levels: { [key: string]: number };
    visit_frequency: { [key: string]: number };
    churn_risk: { [key: string]: number };
    location_distribution: { [key: string]: number };
  };
  matching_criteria: number;
}

export interface CampaignAnalytics {
  campaign_id: string;
  total_targeted: number;
  total_sent: number;
  total_delivered: number;
  total_clicked: number;
  delivery_rate: number;
  click_rate: number;
  engagement_score: number;
}

export interface UserRole {
  tier: string;
  role_id: string;
  client_id: string;
  location_id?: string;
}

export {}; 