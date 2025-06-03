import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface DebugState {
  appLoaded: boolean;
  authLoaded: boolean;
  userLoaded: boolean;
  roleLoaded: boolean;
  securityInitialized: boolean;
  errors: string[];
}

export default function DebugInfo() {
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const [debugState, setDebugState] = useState<DebugState>({
    appLoaded: false,
    authLoaded: false,
    userLoaded: false,
    roleLoaded: false,
    securityInitialized: false,
    errors: []
  });

  useEffect(() => {
    console.log('🔍 Debug Info - App component mounted');
    setDebugState(prev => ({ ...prev, appLoaded: true }));
  }, []);

  useEffect(() => {
    console.log('🔍 Debug Info - Auth loading state:', authLoading);
    setDebugState(prev => ({ ...prev, authLoaded: !authLoading }));
  }, [authLoading]);

  useEffect(() => {
    console.log('🔍 Debug Info - User state:', user ? 'Logged in' : 'Not logged in');
    setDebugState(prev => ({ ...prev, userLoaded: !!user }));
  }, [user]);

  useEffect(() => {
    console.log('🔍 Debug Info - Role loading state:', roleLoading, 'Role:', role);
    setDebugState(prev => ({ ...prev, roleLoaded: !roleLoading }));
  }, [roleLoading, role]);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">🔍 Debug Info</div>
      <div className="space-y-1">
        <div className={`${debugState.appLoaded ? 'text-green-400' : 'text-red-400'}`}>
          App Loaded: {debugState.appLoaded ? '✅' : '❌'}
        </div>
        <div className={`${debugState.authLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
          Auth Loaded: {debugState.authLoaded ? '✅' : '⏳'}
        </div>
        <div className={`${debugState.userLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
          User Loaded: {debugState.userLoaded ? '✅' : '⏳'}
        </div>
        <div className={`${debugState.roleLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
          Role Loaded: {debugState.roleLoaded ? '✅' : '⏳'}
        </div>
        {user && (
          <div className="text-blue-400">
            Role: {role || 'Loading...'}
          </div>
        )}
        {debugState.errors.length > 0 && (
          <div className="text-red-400">
            Errors: {debugState.errors.length}
          </div>
        )}
      </div>
      <div className="mt-2 text-xs opacity-75">
        Check console for detailed logs
      </div>
    </div>
  );
} 