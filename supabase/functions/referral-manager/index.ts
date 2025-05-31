// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReferralProgramConfig {
  is_active: boolean
  referrer_reward_type: 'stamps' | 'discount' | 'free_item'
  referrer_reward_value: number
  referee_reward_type: 'stamps' | 'discount' | 'free_item'
  referee_reward_value: number
  min_referee_visits: number
  min_referee_stamps: number
  max_referrals_per_customer: number
  referral_code_prefix: string
  program_name: string
  program_description?: string
  terms_and_conditions?: string
}

interface ReferralStats {
  total_referrals: number
  pending_referrals: number
  qualified_referrals: number
  rewarded_referrals: number
  total_rewards_issued: number
  top_referrers: Array<{
    client_name: string
    referral_count: number
    rewards_earned: number
  }>
  recent_referrals: Array<{
    referrer_name: string
    referee_name: string
    status: string
    created_at: string
    qualified_at?: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const restaurantId = url.searchParams.get('restaurant_id')

    if (!restaurantId) {
      return new Response(JSON.stringify({ error: 'Restaurant ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify restaurant ownership
    const { data: restaurant } = await supabaseClient
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .eq('user_id', user.id)
      .single()

    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    switch (action) {
      case 'get_program':
        return await getReferralProgram(supabaseClient, restaurantId)
      
      case 'update_program':
        const programData = await req.json()
        return await updateReferralProgram(supabaseClient, restaurantId, programData)
      
      case 'create_code':
        const { client_id } = await req.json()
        return await createReferralCode(supabaseClient, client_id, restaurantId)
      
      case 'process_referral':
        const { referral_code, referee_client_id, referral_source } = await req.json()
        return await processReferral(supabaseClient, referral_code, referee_client_id, restaurantId, referral_source)
      
      case 'get_stats':
        return await getReferralStats(supabaseClient, restaurantId)
      
      case 'get_referrals':
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '20')
        return await getReferrals(supabaseClient, restaurantId, page, limit)
      
      case 'get_client_referrals':
        const clientId = url.searchParams.get('client_id')
        return await getClientReferrals(supabaseClient, clientId!, restaurantId)
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Referral Manager Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function getReferralProgram(supabaseClient: any, restaurantId: string) {
  const { data, error } = await supabaseClient
    .from('referral_programs')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get referral program: ${error.message}`)
  }

  // Return default program if none exists
  const defaultProgram: ReferralProgramConfig = {
    is_active: false,
    referrer_reward_type: 'stamps',
    referrer_reward_value: 5,
    referee_reward_type: 'stamps',
    referee_reward_value: 3,
    min_referee_visits: 1,
    min_referee_stamps: 3,
    max_referrals_per_customer: 10,
    referral_code_prefix: 'REF',
    program_name: 'Refer a Friend',
    program_description: 'Invite friends and earn rewards when they visit!',
    terms_and_conditions: 'Referral rewards are issued after the referred customer meets qualification requirements.'
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data: data || defaultProgram 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function updateReferralProgram(supabaseClient: any, restaurantId: string, programData: ReferralProgramConfig) {
  const { data, error } = await supabaseClient
    .from('referral_programs')
    .upsert({
      restaurant_id: restaurantId,
      ...programData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update referral program: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function createReferralCode(supabaseClient: any, clientId: string, restaurantId: string) {
  const { data, error } = await supabaseClient.rpc('create_referral_code', {
    p_client_id: clientId,
    p_restaurant_id: restaurantId
  })

  if (error) {
    throw new Error(`Failed to create referral code: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    referral_code: data 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function processReferral(
  supabaseClient: any, 
  referralCode: string, 
  refereeClientId: string, 
  restaurantId: string, 
  referralSource: string = 'manual'
) {
  const { data, error } = await supabaseClient.rpc('process_referral', {
    p_referral_code: referralCode,
    p_referee_client_id: refereeClientId,
    p_restaurant_id: restaurantId,
    p_referral_source: referralSource
  })

  if (error) {
    throw new Error(`Failed to process referral: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    referral_id: data 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getReferralStats(supabaseClient: any, restaurantId: string): Promise<Response> {
  // Get basic referral counts
  const { data: referralCounts } = await supabaseClient
    .from('referrals')
    .select('status')
    .eq('restaurant_id', restaurantId)

  const stats: ReferralStats = {
    total_referrals: referralCounts?.length || 0,
    pending_referrals: referralCounts?.filter((r: any) => r.status === 'pending').length || 0,
    qualified_referrals: referralCounts?.filter((r: any) => r.status === 'qualified').length || 0,
    rewarded_referrals: referralCounts?.filter((r: any) => r.status === 'rewarded').length || 0,
    total_rewards_issued: 0,
    top_referrers: [],
    recent_referrals: []
  }

  // Get total rewards issued
  const { data: rewardsData } = await supabaseClient
    .from('referral_rewards')
    .select('reward_value')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'issued')

  stats.total_rewards_issued = rewardsData?.reduce((sum: number, r: any) => sum + r.reward_value, 0) || 0

  // Get top referrers
  const { data: topReferrers } = await supabaseClient
    .from('referrals')
    .select(`
      referrer_client_id,
      clients!referrer_client_id(name),
      referral_rewards!inner(reward_value)
    `)
    .eq('restaurant_id', restaurantId)
    .eq('status', 'rewarded')

  const referrerStats: Record<string, any> = {}
  topReferrers?.forEach((referral: any) => {
    const clientId = referral.referrer_client_id
    if (!referrerStats[clientId]) {
      referrerStats[clientId] = {
        client_name: referral.clients.name,
        referral_count: 0,
        rewards_earned: 0
      }
    }
    referrerStats[clientId].referral_count++
    referrerStats[clientId].rewards_earned += referral.referral_rewards.reward_value
  })

  stats.top_referrers = Object.values(referrerStats)
    .sort((a: any, b: any) => b.referral_count - a.referral_count)
    .slice(0, 5)

  // Get recent referrals
  const { data: recentReferrals } = await supabaseClient
    .from('referrals')
    .select(`
      status,
      created_at,
      qualified_at,
      clients!referrer_client_id(name),
      referee:clients!referee_client_id(name)
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(10)

  stats.recent_referrals = recentReferrals?.map((r: any) => ({
    referrer_name: r.clients.name,
    referee_name: r.referee.name,
    status: r.status,
    created_at: r.created_at,
    qualified_at: r.qualified_at
  })) || []

  return new Response(JSON.stringify({ 
    success: true, 
    data: stats 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getReferrals(supabaseClient: any, restaurantId: string, page: number, limit: number) {
  const offset = (page - 1) * limit

  const { data, error, count } = await supabaseClient
    .from('referrals')
    .select(`
      *,
      referrer:clients!referrer_client_id(id, name, email),
      referee:clients!referee_client_id(id, name, email),
      referral_code:referral_codes(referral_code)
    `, { count: 'exact' })
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get referrals: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getClientReferrals(supabaseClient: any, clientId: string, restaurantId: string) {
  // Get client's referral code
  const { data: referralCode } = await supabaseClient
    .from('referral_codes')
    .select('referral_code, times_used')
    .eq('client_id', clientId)
    .eq('restaurant_id', restaurantId)
    .single()

  // Get referrals made by this client
  const { data: referralsMade } = await supabaseClient
    .from('referrals')
    .select(`
      *,
      referee:clients!referee_client_id(name, email)
    `)
    .eq('referrer_client_id', clientId)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  // Get rewards earned
  const { data: rewardsEarned } = await supabaseClient
    .from('referral_rewards')
    .select('*')
    .eq('client_id', clientId)
    .eq('restaurant_id', restaurantId)
    .eq('recipient_type', 'referrer')

  return new Response(JSON.stringify({ 
    success: true, 
    data: {
      referral_code: referralCode?.referral_code,
      code_usage: referralCode?.times_used || 0,
      referrals_made: referralsMade || [],
      rewards_earned: rewardsEarned || []
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
} 