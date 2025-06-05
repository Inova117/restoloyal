import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Users, Gift, Plus, Scan, LogOut, Store, MapPin, BarChart3, Share2, Building2, Crown, Shield, Settings, ArrowLeft, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, getAvailableTabs, getRoleDisplayName, returnToPlatform, returnToHQ } from '@/hooks/useUserRole';
import ClientList from '@/components/ClientList';
import AddStampDialog from '@/components/AddStampDialog';
import AddClientDialog from '@/components/AddClientDialog';
import GeoPushSettings from '@/components/GeoPushSettings';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import ReferralDashboard from '@/components/ReferralDashboard';
import GallettiHQDashboard from '@/components/GallettiHQDashboard';
import ZerionPlatformDashboard from '@/components/ZerionPlatformDashboard';
import POSInterface from '@/components/POSInterface';
import { RestaurantManagement } from '@/pages/RestaurantManagement';

interface Restaurant {
  id: string;
  name: string;
  stamps_required: number;
  address?: string | null;
  created_at: string;
  email?: string | null;
  phone?: string | null;
  reward_description?: string | null;
  updated_at: string;
  user_id: string;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stamps: number;
  qr_code: string;
  created_at: string;
  restaurant_id: string;
  updated_at: string;
}

const Index = () => {
  const { user, signOut } = useAuth();
  const { role, permissions, isLoading: roleLoading, clientName, restaurantName, isViewingAsAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddStampOpen, setIsAddStampOpen] = useState(false);
  const [showPlatformSettings, setShowPlatformSettings] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || loading || role === 'location_staff') return

      try {
        // 🔒 SECURITY: Log role context only, not sensitive user data
        if (import.meta.env.DEV) {
          console.log('🔍 Loading dashboard data for role:', role);
          console.log('🔍 User ID:', user.id);
          console.log('🔍 Loading state:', loading);
          console.log('🔍 Role loading state:', roleLoading);
        }

        // For ZerionCore admin - no data loading needed, just show platform dashboard
        if (role === 'zerion_admin') {
          if (import.meta.env.DEV) {
            console.log('🔧 ZerionCore admin detected - skipping restaurant data loading');
          }
          return // ZerionCore admin uses ZerionPlatformDashboard component
        }

        // For ZerionCore admin viewing Galletti dashboard
        if (role === 'galletti_hq' && isViewingAsAdmin) {
          return // Skip data loading for admin view
        }

        // Check if user has a restaurant (only for restaurant owners)
        if (role === 'restaurant_owner') {
          const { data: restaurants, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('user_id', user.id)

          if (error) {
            console.error('❌ Error fetching restaurants:', error.message)
            throw error
          }

          if (import.meta.env.DEV) {
            console.log('🏪 Found restaurants:', restaurants?.length || 0);
          }

          if (!restaurants || restaurants.length === 0) {
            // 🔒 SECURITY: Safe logging without user details
            if (import.meta.env.DEV) {
              console.log('🆕 Creating default restaurant for new user');
            }
            
            // Create default restaurant for new restaurant owners
            const { data: newRestaurant, error: createError } = await supabase
              .from('restaurants')
              .insert({
                user_id: user.id,
                name: 'My Restaurant',
                stamps_required: 10,
                reward_description: 'Free item after 10 stamps'
              })
              .select()
              .single()

            if (createError) {
              console.error('❌ Error creating restaurant:', createError.message)
              toast({
                title: "Setup Error",
                description: "Failed to create restaurant. Please try refreshing the page.",
                variant: "destructive",
              })
              return
            }

            if (newRestaurant) {
              setRestaurant(newRestaurant as Restaurant)
            }
            setClients([]) // New restaurant has no clients yet
          } else {
            const firstRestaurant = restaurants[0];
            if (firstRestaurant) {
              setRestaurant(firstRestaurant as Restaurant)
              
              // 🔍 ENHANCED CLIENT LOADING with better error handling
              if (import.meta.env.DEV) {
                console.log('🔍 Loading clients for restaurant:', firstRestaurant.id);
              }

              // Load from 'clients' table (legacy but working)
              const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .eq('restaurant_id', firstRestaurant.id)
                .order('created_at', { ascending: false })

              if (clientsError) {
                console.error('❌ Error fetching clients:', clientsError.message)
                toast({
                  title: "Data Loading Error",
                  description: "Could not load customer data. Please check your database connection.",
                  variant: "destructive",
                })
              } else {
                setClients((clientsData || []) as Client[])
                if (import.meta.env.DEV) {
                  console.log('📊 Final clients loaded:', clientsData?.length || 0);
                }
              }
            }
          }
        }
      } catch (error) {
        // 🔒 SECURITY: Safe error logging
        console.error('❌ Error loading initial data:', error instanceof Error ? error.message : 'Unknown error')
        toast({
          title: "Connection Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        // Trigger page loaded animation after a short delay
        setTimeout(() => setPageLoaded(true), 100)
        
        if (import.meta.env.DEV) {
          console.log('🎬 Page loading complete, setting pageLoaded to true');
        }
      }
    }

    loadInitialData()
  }, [user, loading, role, isViewingAsAdmin])

  // Ensure pageLoaded gets set even if data loading doesn't run
  useEffect(() => {
    if (!loading && !roleLoading) {
      const timer = setTimeout(() => {
        setPageLoaded(true);
        if (import.meta.env.DEV) {
          console.log('🎬 Fallback: Setting pageLoaded to true');
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [loading, roleLoading]);

  // Debug logging for render
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🎨 Rendering dashboard for role:', role, 'pageLoaded:', pageLoaded);
      if (role === 'zerion_admin') {
        console.log('🎨 Rendering ZerionCore Admin Layout');
      }
    }
  }, [role, pageLoaded]);

  // Set default tab based on role
  useEffect(() => {
    if (!roleLoading && role) {
      const availableTabs = getAvailableTabs(role);
      if (availableTabs.length > 0 && availableTabs[0]) {
        setActiveTab(availableTabs[0]);
      }
    }
  }, [role, roleLoading]);

  const totalClients = clients.length;
  const totalStamps = clients.reduce((sum, client) => sum + client.stamps, 0);
  const readyForReward = clients.filter(client => 
    client.stamps >= (restaurant?.stamps_required || 10)
  ).length;

  const refreshClients = async () => {
    if (!restaurant) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Cannot refresh clients: no restaurant loaded');
      }
      return;
    }
    
    if (import.meta.env.DEV) {
      console.log('🔄 Refreshing clients for restaurant:', restaurant.id);
    }
    
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error refreshing clients:', error.message);
      toast({
        title: "Refresh Error",
        description: "Could not refresh customer data. Please try again.",
        variant: "destructive",
      })
    } else {
      setClients((clientsData || []) as Client[]);
      if (import.meta.env.DEV) {
        console.log('✅ Clients refreshed successfully:', clientsData?.length || 0);
      }
    }
  };

  // Transform clients to include maxStamps for ClientList component
  const transformedClients = clients.map(client => ({
    ...client,
    maxStamps: restaurant?.stamps_required || 10
  })) as any; // Type assertion to handle the component interface mismatch

  const availableTabs = getAvailableTabs(role);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-editorial">
          <div className="loading-skeleton w-12 h-12 rounded-full mx-auto mb-6"></div>
          <div className="space-y-3">
            <div className="loading-skeleton w-48 h-6 rounded mx-auto"></div>
            <div className="loading-skeleton w-64 h-4 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SINGLE RETURN WITH CONDITIONAL CONTENT - FIXES REACT ERROR #310
  return (
    <div className="min-h-screen bg-background page-enter">
      <div className="container-editorial section-editorial-sm">
        
        {/* Debug logging for render */}
        {/* Debug logging moved to useEffect */}
        
        {/* ZerionCore Admin Layout */}
        {role === 'zerion_admin' && (
          <>
            <div className="dashboard-header slide-in-left">
              <div className="dashboard-header-title">
                <div className="p-4 bg-sage-turquoise-100 rounded-2xl hover-glow">
                  <Crown className="w-10 h-10 text-sage-turquoise-600 icon-bounce" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-5xl font-editorial font-bold text-balance">Fydely HQ</h1>
                  <p className="text-muted-foreground text-xl leading-relaxed">Enterprise business loyalty management</p>
                </div>
              </div>
              <div className="dashboard-header-actions slide-in-right">
                <Button 
                  variant="outline" 
                  effect="lift"
                  onClick={() => navigate('/restaurants')}
                  className="space-x-2"
                >
                  <Store className="w-4 h-4" />
                  <span>Restaurant Management</span>
                </Button>
                <Button 
                  variant="outline" 
                  effect="lift"
                  onClick={() => setShowPlatformSettings(true)}
                  className="space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Platform Settings</span>
                </Button>
                <Button variant="outline" effect="lift" onClick={signOut} className="space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
            
            <div className="tab-content-enter">
              <ZerionPlatformDashboard 
                showPlatformSettings={showPlatformSettings}
                setShowPlatformSettings={setShowPlatformSettings}
              />
            </div>
          </>
        )}

        {/* Galletti HQ Layout */}
        {role === 'galletti_hq' && (
          <>
            <div className="dashboard-header slide-in-left">
              <div className="dashboard-header-title">
                <div className="p-4 bg-sage-turquoise-100 rounded-2xl hover-glow">
                  <Building2 className="w-10 h-10 text-sage-turquoise-600 hover-scale" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-5xl font-editorial font-bold text-balance">Galletti HQ Dashboard</h1>
                  <p className="text-muted-foreground text-xl leading-relaxed">Multi-location restaurant management</p>
                </div>
              </div>
              <div className="dashboard-header-actions slide-in-right">
                {isViewingAsAdmin && (
                  <Button variant="outline" effect="lift" onClick={returnToPlatform} className="space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Platform</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  effect="lift"
                  onClick={() => navigate('/restaurants')}
                  className="space-x-2"
                >
                  <Store className="w-4 h-4" />
                  <span>Restaurant Management</span>
                </Button>
                <Button variant="outline" effect="lift" onClick={signOut} className="space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
            
            <div className="tab-content-enter">
              <GallettiHQDashboard />
            </div>
          </>
        )}

        {/* Location Staff Layout */}
        {role === 'location_staff' && (
          <>
            <div className="dashboard-header slide-in-left">
              <div className="dashboard-header-title">
                <div className="p-4 bg-sage-turquoise-100 rounded-2xl hover-glow">
                  <Store className="w-10 h-10 text-sage-turquoise-600 hover-scale" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-5xl font-editorial font-bold text-balance">{restaurantName || 'Restaurant'} Dashboard</h1>
                  <p className="text-muted-foreground text-xl leading-relaxed">Location staff interface</p>
                </div>
              </div>
              <div className="dashboard-header-actions slide-in-right">
                {isViewingAsAdmin && (
                  <Button variant="outline" effect="lift" onClick={returnToHQ} className="space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to HQ</span>
                  </Button>
                )}
                {user?.user_metadata?.role === 'client_admin' && (
                  <Button 
                    variant="default" 
                    effect="glow" 
                    onClick={() => {
                      // Force switch to client admin view
                      sessionStorage.removeItem('force_location_staff')
                      sessionStorage.setItem('force_client_admin', 'true')
                      window.location.reload()
                    }} 
                    className="space-x-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Client Dashboard</span>
                  </Button>
                )}
                <Button variant="outline" effect="lift" onClick={signOut} className="space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>

            <Tabs 
              value={availableTabs.includes(activeTab) ? activeTab : availableTabs[0]} 
              onValueChange={setActiveTab} 
              className="content-section"
            >
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
                {availableTabs.includes('pos') && (
                  <TabsTrigger value="pos" className="space-x-2 interactive-subtle">
                    <Scan className="w-4 h-4" />
                    <span>POS System</span>
                  </TabsTrigger>
                )}
                {availableTabs.includes('customers') && (
                  <TabsTrigger value="customers" className="space-x-2 interactive-subtle">
                    <Users className="w-4 h-4" />
                    <span>Customers</span>
                  </TabsTrigger>
                )}
                {availableTabs.includes('analytics') && (
                  <TabsTrigger value="analytics" className="space-x-2 interactive-subtle">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="pos" className="content-section tab-content-enter">
                <POSInterface />
              </TabsContent>

              <TabsContent value="customers" className="content-section tab-content-enter">
                <div className="action-bar">
                  <div className="content-section-header">
                    <h2 className="content-section-title">Customer Management</h2>
                    <p className="content-section-description">Manage customer loyalty and rewards</p>
                  </div>
                  <div className="action-group">
                    <Button onClick={() => setIsAddClientOpen(true)} effect="lift" className="space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Customer</span>
                    </Button>
                    <Button onClick={() => setIsAddStampOpen(true)} variant="sage" effect="glow" className="space-x-2">
                      <Gift className="w-4 h-4" />
                      <span>Add Stamp</span>
                    </Button>
                  </div>
                </div>
                
                <ClientList 
                  clients={transformedClients} 
                  restaurantId={restaurant?.id}
                  onRefresh={refreshClients}
                />
              </TabsContent>

              <TabsContent value="analytics" className="content-section tab-content-enter">
                <AnalyticsDashboard />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Restaurant Owner Layout - Default */}
        {role === 'restaurant_owner' && (
          <>
            <div className="dashboard-header slide-in-left">
              <div className="dashboard-header-title">
                <div className="p-4 bg-sage-turquoise-100 rounded-2xl hover-glow">
                  <Store className="w-10 h-10 text-sage-turquoise-600 hover-scale" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-5xl font-editorial font-bold text-balance">
                    {restaurant?.name || 'Restaurant'} Loyalty
                  </h1>
                  <p className="text-muted-foreground text-xl leading-relaxed">Manage your customer loyalty program</p>
                </div>
              </div>
              <Button variant="outline" effect="lift" onClick={signOut} className="space-x-2 slide-in-right">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid stagger-fade-in">
              <div className="stats-card interactive-card">
                <div className="stats-card-header">
                  <h3 className="hierarchy-secondary">Total Customers</h3>
                  <Users className="h-6 w-6 text-sage-turquoise-600 hover-scale" />
                </div>
                <div className="stats-card-value text-sage-turquoise-600">{totalClients}</div>
                <p className="stats-card-label">Active loyalty members</p>
              </div>
              
              <div className="stats-card interactive-card">
                <div className="stats-card-header">
                  <h3 className="hierarchy-secondary">Total Stamps</h3>
                  <Gift className="h-6 w-6 text-soft-emerald-500 hover-scale" />
                </div>
                <div className="stats-card-value text-soft-emerald-500">{totalStamps}</div>
                <p className="stats-card-label">Stamps collected</p>
              </div>
              
              <div className="stats-card interactive-card">
                <div className="stats-card-header">
                  <h3 className="hierarchy-secondary">Ready for Reward</h3>
                  <QrCode className="h-6 w-6 text-soft-amber-500 hover-scale" />
                </div>
                <div className="stats-card-value text-soft-amber-500">{readyForReward}</div>
                <p className="stats-card-label">Customers eligible</p>
              </div>
            </div>

            <Tabs 
              value={availableTabs.includes(activeTab) ? activeTab : availableTabs[0]} 
              onValueChange={setActiveTab} 
              className="content-section"
            >
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-none lg:flex">
                <TabsTrigger value="dashboard" className="space-x-2 interactive-subtle">
                  <Store className="w-4 h-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="customers" className="space-x-2 interactive-subtle">
                  <Users className="w-4 h-4" />
                  <span>Customers</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="content-section tab-content-enter">
                <div className="content-section-header">
                  <h2 className="content-section-title">Quick Actions</h2>
                  <p className="content-section-description">Common tasks and operations</p>
                </div>
                
                <div className="grid-editorial-sm grid-cols-1 md:grid-cols-2 lg:grid-cols-4 stagger-fade-in">
                  <div className="card-editorial-compact interactive-card" onClick={() => setIsAddClientOpen(true)}>
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="p-6 bg-sage-turquoise-100 rounded-2xl hover-glow">
                        <Plus className="w-10 h-10 text-sage-turquoise-600 hover-scale" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="hierarchy-primary text-lg">Add Customer</h3>
                        <p className="hierarchy-tertiary">Register new loyalty member</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-editorial-compact interactive-card" onClick={() => setIsAddStampOpen(true)}>
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="p-6 bg-soft-emerald-100 rounded-2xl hover-glow">
                        <Gift className="w-10 h-10 text-soft-emerald-500 hover-scale" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="hierarchy-primary text-lg">Add Stamp</h3>
                        <p className="hierarchy-tertiary">Reward customer visit</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-editorial-compact interactive-card">
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="p-6 bg-soft-amber-100 rounded-2xl hover-glow">
                        <Scan className="w-10 h-10 text-soft-amber-500 hover-scale" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="hierarchy-primary text-lg">Scan QR Code</h3>
                        <p className="hierarchy-tertiary">Quick customer lookup</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-editorial-compact interactive-card">
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="p-6 bg-soft-rose-100 rounded-2xl hover-glow">
                        <BarChart3 className="w-10 h-10 text-soft-rose-400 hover-scale" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="hierarchy-primary text-lg">View Analytics</h3>
                        <p className="hierarchy-tertiary">Track performance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="customers" className="content-section tab-content-enter">
                <div className="action-bar">
                  <div className="content-section-header">
                    <h2 className="content-section-title">Customer Management</h2>
                    <p className="content-section-description">Manage your loyalty program members</p>
                  </div>
                  <div className="action-group">
                    <Button onClick={() => setIsAddClientOpen(true)} effect="lift" className="space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Customer</span>
                    </Button>
                    <Button onClick={() => setIsAddStampOpen(true)} variant="sage" effect="glow" className="space-x-2">
                      <Gift className="w-4 h-4" />
                      <span>Add Stamp</span>
                    </Button>
                  </div>
                </div>
                
                <ClientList 
                  clients={transformedClients} 
                  restaurantId={restaurant?.id}
                  onRefresh={refreshClients}
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Dialogs - Always rendered */}
        <AddClientDialog 
          open={isAddClientOpen} 
          onOpenChange={setIsAddClientOpen}
          restaurantId={restaurant?.id}
          onClientAdded={refreshClients}
        />
        
        <AddStampDialog 
          open={isAddStampOpen} 
          onOpenChange={setIsAddStampOpen}
          clients={transformedClients}
          restaurantId={restaurant?.id}
          stampsRequired={restaurant?.stamps_required || 10}
          onStampAdded={refreshClients}
        />
      </div>
    </div>
  );
};

export default Index;
