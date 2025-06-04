import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { initializeSecurity } from '@/lib/security';
import { logInfo, logError } from '@/lib/logger';

// Pages
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import Index from '@/pages/Index';
import Landing from '@/pages/Landing';
import { RestaurantManagement } from '@/pages/RestaurantManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize security measures when app starts
    try {
      initializeSecurity();
      logInfo('Application initialized successfully', { 
        environment: import.meta.env.MODE,
        timestamp: new Date().toISOString()
      }, 'App');
    } catch (error) {
      logError(
        'Security initialization failed, continuing without some security features',
        error,
        'App'
      );
      // App continues to load even if security init fails
    }
  }, []);

  return (
    <PageErrorBoundary name="Application Root">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/restaurants" element={
                  <ProtectedRoute>
                    <RestaurantManagement />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </PageErrorBoundary>
  );
}

export default App;
