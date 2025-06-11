// TEMPORARY FIX: Simple environment variable verification that doesn't run at import time
// This fixes the production error where environment variables are available during build
// but the verification at import time fails in the browser

export const getSupabaseURL = (): string => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    console.error('🚨 VITE_SUPABASE_URL not found in environment variables');
    console.error('Available env vars:', Object.keys(import.meta.env));
    throw new Error('VITE_SUPABASE_URL environment variable is required');
  }
  return url;
};

export const getSupabaseAnonKey = (): string => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    console.error('🚨 VITE_SUPABASE_ANON_KEY not found in environment variables');
    console.error('Available env vars:', Object.keys(import.meta.env));
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
  }
  return key;
}; 