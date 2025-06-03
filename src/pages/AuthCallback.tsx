import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your invitation...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the auth session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          return;
        }

        // Check if this is an invitation
        const type = searchParams.get('type');
        const client = searchParams.get('client');
        const email = searchParams.get('email');

        if (type === 'invitation') {
          // This is an invitation - redirect to auth page with invitation parameters
          const inviteParams = new URLSearchParams({
            type: 'invitation',
            ...(client && { client }),
            ...(email && { email })
          });

          setStatus('success');
          setMessage('Invitation received! Redirecting to setup...');
          
          setTimeout(() => {
            navigate(`/auth?${inviteParams.toString()}`);
          }, 1500);
        } else if (data.session?.user) {
          // Regular auth callback - user is logged in
          setStatus('success');
          setMessage('Successfully logged in! Redirecting...');
          
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          // No session - redirect to login
          setStatus('error');
          setMessage('No active session found. Redirecting to login...');
          
          setTimeout(() => {
            navigate('/auth');
          }, 2000);
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Redirecting to login...');
        
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />;
      case 'success':
        return <UserCheck className="w-12 h-12 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          {getIcon()}
        </div>
        
        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Processing...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Something went wrong'}
        </h1>
        
        <p className="text-gray-600 mb-6 max-w-md">
          {message}
        </p>
        
        {status === 'loading' && (
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <button
            onClick={() => navigate('/auth')}
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Go to login page
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 