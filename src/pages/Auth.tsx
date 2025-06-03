import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Store, Mail, Lock, User, Phone, Key, UserCheck } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if this is an invitation flow
  const [isInvitation, setIsInvitation] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState('');
  const [clientName, setClientName] = useState('');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');

  // Invitation form state
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState('');

  useEffect(() => {
    // Check for invitation parameters
    const type = searchParams.get('type');
    const email = searchParams.get('email');
    const client = searchParams.get('client');
    
    if (type === 'invite' || type === 'invitation') {
      setIsInvitation(true);
      if (email) setInvitationEmail(email);
      if (client) setClientName(client.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }

    // Handle Supabase auth state changes for invitations
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        toast({
          title: "Welcome!",
          description: "Successfully logged in to your dashboard",
        });
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams, navigate]);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleInvitationSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (invitePassword !== inviteConfirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (invitePassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: invitePassword
      });

      if (updateError) throw updateError;

      toast({
        title: "Password Set Successfully!",
        description: `Welcome to ${clientName}. You can now access your dashboard.`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Failed to set password",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            restaurant_name: restaurantName,
            owner_name: ownerName,
            phone: phone,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create restaurant record
        try {
          const { error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
              user_id: data.user.id,
              name: restaurantName,
              phone: phone,
            });

          if (restaurantError) {
            console.error('Error creating restaurant:', restaurantError);
            toast({
              title: "Restaurant creation failed",
              description: "Account created but restaurant setup failed. Please contact support.",
              variant: "destructive",
            });
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
        }

        toast({
          title: "Account created!",
          description: "Welcome to your restaurant loyalty program.",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If this is an invitation, show the set password form
  if (isInvitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <UserCheck className="w-12 h-12 text-green-600 mr-3" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to {clientName}</h1>
              <p className="text-gray-600">Set your password to get started</p>
            </div>
          </div>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-green-600" />
                Set Your Password
              </CardTitle>
              <CardDescription>
                {invitationEmail ? `Setting up account for ${invitationEmail}` : 'Complete your account setup'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvitationSetPassword} className="space-y-4">
                {invitationEmail && (
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        value={invitationEmail}
                        disabled
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="invite-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="invite-password"
                      type="password"
                      placeholder="Create a secure password"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invite-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="invite-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={inviteConfirmPassword}
                      onChange={(e) => setInviteConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading || !invitePassword || invitePassword !== inviteConfirmPassword}
                >
                  {isLoading ? "Setting Password..." : "Set Password & Continue"}
                </Button>
              </form>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsInvitation(false)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in instead
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular login/signup flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Store className="w-12 h-12 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Loyalty</h1>
            <p className="text-gray-600">Manage your customer rewards</p>
          </div>
        </div>

        <Tabs defaultValue="login" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
            <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Welcome Back</CardTitle>
                <CardDescription>Sign in to your restaurant account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Create Account</CardTitle>
                <CardDescription>Set up your restaurant loyalty program</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-name">Restaurant Name</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="restaurant-name"
                        type="text"
                        placeholder="Your restaurant name"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner-name">Owner Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="owner-name"
                        type="text"
                        placeholder="Your full name"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Restaurant phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
