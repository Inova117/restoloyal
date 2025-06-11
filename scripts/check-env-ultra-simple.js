#!/usr/bin/env node

// Ultra-simple environment checker - no fancy features
console.log('Environment Variables Check');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL:', url ? 'PRESENT' : 'MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', key ? 'PRESENT' : 'MISSING');

if (!url || !key) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('SUCCESS: All variables present');
console.log('Proceeding with build...'); 