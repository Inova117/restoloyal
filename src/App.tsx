import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DebugInfo from '@/components/DebugInfo';
import { initializeSecurity } from '@/lib/security';

// Pages
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import Index from '@/pages/Index';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Initialize security measures when app starts (with error handling)
    try {
      initializeSecurity();
    } catch (error) {
      console.error('⚠️ Security initialization failed, continuing without some security features:', error);
      // App continues to load even if security init fails
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
        <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
          <Toaster />
          <DebugInfo />
        </Router>
        </AuthProvider>
  </QueryClientProvider>
);
}

export default App;
