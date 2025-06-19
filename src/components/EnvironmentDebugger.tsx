// Debug component to verify environment variables in production
// Add this to any component and check browser console after deployment

import React, { useEffect, useRef } from 'react';

export const EnvironmentDebugger: React.FC = () => {
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    // Only run once and only in development or when explicitly enabled
    if (hasLoggedRef.current) return;
    
    const shouldDebug = import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true';
    
    if (shouldDebug) {
      hasLoggedRef.current = true;
      
      console.log('\n🔍 Environment Debug Info:');
      console.log('- MODE:', import.meta.env.MODE);
      console.log('- DEV:', import.meta.env.DEV);
      console.log('- PROD:', import.meta.env.PROD);
      
      // Check Supabase configuration
      console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 
        `${import.meta.env.VITE_SUPABASE_URL.substring(0, 40)}...` : 'MISSING');
      console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 
        'SET' : 'MISSING');
      
      // List all VITE_ variables
      const viteVars = Object.keys(import.meta.env)
        .filter(key => key.startsWith('VITE_'))
        .sort();
      console.log('- All VITE_ vars:', viteVars);
      
      // Validation
      if (!import.meta.env.VITE_SUPABASE_URL) {
        console.error('❌ VITE_SUPABASE_URL is missing!');
      }
      if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('❌ VITE_SUPABASE_ANON_KEY is missing!');
      }
      
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('✅ Supabase environment variables are configured correctly');
      }
      
      console.log('\n');
    }
  }, []); // Empty dependency array - only run once

  // Don't render anything in production unless debug mode is enabled
  const shouldShow = import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true';
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">🔍 Environment Debug</div>
      <div>Mode: {import.meta.env.MODE}</div>
      <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</div>
      <div>Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
      <div className="mt-2 text-xs opacity-75">
        Check browser console for details
      </div>
    </div>
  );
};