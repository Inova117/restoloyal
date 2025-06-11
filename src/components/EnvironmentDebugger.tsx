// Debug component to verify environment variables in production
// Add this to any component and check browser console after deployment

import { useEffect } from 'react';

export function EnvironmentDebugger() {
  useEffect(() => {
    console.log('🔍 Environment Debug Info:');
    console.log('Mode:', import.meta.env.MODE);
    console.log('Dev:', import.meta.env.DEV);
    console.log('Prod:', import.meta.env.PROD);
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    console.log('Full import.meta.env:', import.meta.env);
  }, []);

  // Only show in development or if env vars are missing
  if (import.meta.env.PROD && import.meta.env.VITE_SUPABASE_URL) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'red',
      color: 'white',
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      🔍 ENV DEBUG: Check Console
    </div>
  );
}