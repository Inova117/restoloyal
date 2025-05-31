import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Users, Gift, Plus, Scan, LogOut, Store, MapPin, BarChart3, Share2, Building2, Crown, Shield, Settings, ArrowLeft } from 'lucide-react';
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
import MultiLocationDashboard from '@/components/MultiLocationDashboard';
import GallettiHQDashboard from '@/components/GallettiHQDashboard';
import ZerionPlatformDashboard from '@/components/ZerionPlatformDashboard';
import POSInterface from '@/components/POSInterface';

interface Restaurant {
  id: string;
  name: string;
  stamps_required: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  stamps: number;
  qr_code: string;
  created_at: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!user || roleLoading) return;

      try {
        console.log('Fetching data for user:', user.id, 'Role:', role);
        
        // Only restaurant owners need to fetch restaurant data
        if (role === 'restaurant_owner') {
          // Fetch restaurant data
          const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (restaurantError) {
            console.error('Error fetching restaurant:', restaurantError);
            toast({
              title: "Database Error",
              description: `Failed to fetch restaurant data: ${restaurantError.message}`,
              variant: "destructive",
            });
            return;
          }

          if (!restaurantData) {
            console.log('No restaurant found for user, creating default restaurant...');
            // Create a default restaurant for the user
            const { data: newRestaurant, error: createError } = await supabase
              .from('restaurants')
              .insert({
                user_id: user.id,
                name: 'My Restaurant',
                stamps_required: 10,
                reward_description: 'Free item after 10 stamps'
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating restaurant:', createError);
              toast({
                title: "Setup Error",
                description: `Failed to create restaurant: ${createError.message}`,
                variant: "destructive",
              });
              return;
            }

            setRestaurant(newRestaurant);
            console.log('Created new restaurant:', newRestaurant);
          } else {
            setRestaurant(restaurantData);
            console.log('Found existing restaurant:', restaurantData);

            // Fetch clients for this restaurant
            const { data: clientsData, error: clientsError } = await supabase
              .from('clients')
              .select('*')
              .eq('restaurant_id', restaurantData.id)
              .order('created_at', { ascending: false });

            if (clientsError) {
              console.error('Error fetching clients:', clientsError);
              toast({
                title: "Database Error",
                description: `Failed to fetch clients: ${clientsError.message}`,
                variant: "destructive",
              });
            } else {
              setClients(clientsData || []);
              console.log('Fetched clients:', clientsData?.length || 0);
            }
          }
        } else {
          // For ZerionCore, Galletti HQ and Location Staff, show welcome message
          toast({
            title: "Welcome",
            description: `Logged in as ${getRoleDisplayName(role)}`,
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to database. Please check your connection.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [user, role, roleLoading]);

  // Set default tab based on role
  useEffect(() => {
    if (!roleLoading) {
      const availableTabs = getAvailableTabs(role);
      if (availableTabs.length > 0) {
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
    if (!restaurant) return;
    
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error refreshing clients:', error);
    } else {
      setClients(clientsData || []);
    }
  };

  const availableTabs = getAvailableTabs(role);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Render different layouts based on role
  if (role === 'zerion_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">ZerionCore Platform</h1>
                <div className="flex items-center gap-2">
                  <p className="text-gray-600 text-lg">Restaurant Loyalty Platform Management</p>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {getRoleDisplayName(role)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2"
                onClick={() => setShowPlatformSettings(true)}
              >
                <Settings className="w-5 h-5 mr-2" />
                Platform Settings
              </Button>
              <Button onClick={signOut} variant="outline" size="lg" className="border-2">
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <ZerionPlatformDashboard 
            showPlatformSettings={showPlatformSettings}
            setShowPlatformSettings={setShowPlatformSettings}
          />
        </div>
      </div>
    );
  }

  if (role === 'galletti_hq') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Galletti Corporate HQ</h1>
                <div className="flex items-center gap-2">
                  <p className="text-gray-600 text-lg">Corporate management for all restaurant brands</p>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {getRoleDisplayName(role)}
                  </Badge>
                  {isViewingAsAdmin && (
                    <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                      <Crown className="w-3 h-3" />
                      Super Admin View
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isViewingAsAdmin && (
                <Button 
                  onClick={returnToPlatform} 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Return to Platform
                </Button>
              )}
              <Button onClick={signOut} variant="outline" size="lg" className="border-2">
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <GallettiHQDashboard />
        </div>
      </div>
    );
  }

  if (role === 'location_staff') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Store className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {restaurantName || 'Location Staff Dashboard'}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-gray-600 text-lg">Point of Sale & Customer Management</p>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {getRoleDisplayName(role)}
                  </Badge>
                  {isViewingAsAdmin && (
                    <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                      <Building2 className="w-3 h-3" />
                      HQ View
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isViewingAsAdmin && (
                <Button 
                  onClick={returnToHQ} 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Return to HQ
                </Button>
              )}
              <Button onClick={signOut} variant="outline" size="lg" className="border-2">
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <POSInterface />
        </div>
      </div>
    );
  }

  // Restaurant Owner Dashboard (original layout)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Store className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {restaurant?.name || restaurantName || 'Restaurant Management'}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-gray-600 text-lg">Manage your restaurant locations and loyalty program</p>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {getRoleDisplayName(role)}
                </Badge>
                {isViewingAsAdmin && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                    <Crown className="w-3 h-3" />
                    Super Admin View
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isViewingAsAdmin && (
              <Button 
                onClick={returnToPlatform} 
                variant="outline" 
                size="lg" 
                className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Return to Platform
              </Button>
            )}
            {permissions.canManageClients && (
              <Button 
                onClick={() => setIsAddClientOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg" 
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Client
              </Button>
            )}
            {permissions.canAddStamps && (
              <Button 
                onClick={() => setIsAddStampOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Scan className="w-5 h-5 mr-2" />
                Add Stamp
              </Button>
            )}
            <Button onClick={signOut} variant="outline" size="lg" className="border-2">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalClients}</div>
              <p className="text-xs text-gray-500 mt-1">Active customers</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Stamps</CardTitle>
              <QrCode className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalStamps}</div>
              <p className="text-xs text-gray-500 mt-1">Stamps issued</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ready for Rewards</CardTitle>
              <Gift className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{readyForReward}</div>
              <p className="text-xs text-gray-500 mt-1">Clients eligible</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full bg-white shadow-md`} style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
            {availableTabs.map(tabId => {
              const tabConfig = {
                dashboard: { label: 'Dashboard', icon: null },
                clients: { label: 'Clients', icon: null },
                geopush: { label: 'GeoPush', icon: MapPin },
                analytics: { label: 'Analytics', icon: BarChart3 },
                referrals: { label: 'Referrals', icon: Share2 },
                locations: { label: 'Locations', icon: Building2 }
              }[tabId];

              if (!tabConfig) return null;

              return (
                <TabsTrigger 
                  key={tabId}
                  value={tabId} 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  {tabConfig.icon && <tabConfig.icon className="w-4 h-4 mr-1" />}
                  {tabConfig.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-green-600" />
                    Recent Rewards
                  </CardTitle>
                  <CardDescription>Clients who completed their stamp cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clients.filter(client => client.stamps >= (restaurant?.stamps_required || 10)).map(client => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.email}</p>
                        </div>
                        <Badge className="bg-green-600 text-white">Ready</Badge>
                      </div>
                    ))}
                    {readyForReward === 0 && (
                      <p className="text-gray-500 text-center py-4">No clients ready for rewards yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-purple-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common tasks for managing your loyalty program</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setIsAddStampOpen(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
                    size="lg"
                  >
                    <Scan className="w-5 h-5 mr-3" />
                    Scan QR & Add Stamp
                  </Button>
                  <Button 
                    onClick={() => setIsAddClientOpen(true)}
                    variant="outline" 
                    className="w-full justify-start border-2 hover:bg-blue-50"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Register New Client
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-2 hover:bg-purple-50"
                    size="lg"
                  >
                    <QrCode className="w-5 h-5 mr-3" />
                    Generate QR Codes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <ClientList 
              clients={clients.map(client => ({
                ...client,
                maxStamps: restaurant?.stamps_required || 10
              }))} 
              onRefresh={refreshClients}
              restaurantId={restaurant?.id}
            />
          </TabsContent>

          <TabsContent value="geopush">
            <GeoPushSettings restaurantId={restaurant?.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard restaurantId={restaurant?.id} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralDashboard />
          </TabsContent>

          <TabsContent value="locations">
            <MultiLocationDashboard />
          </TabsContent>
        </Tabs>

        <AddClientDialog 
          open={isAddClientOpen} 
          onOpenChange={setIsAddClientOpen}
          restaurantId={restaurant?.id}
          onClientAdded={refreshClients}
        />
        
        <AddStampDialog 
          open={isAddStampOpen} 
          onOpenChange={setIsAddStampOpen}
          clients={clients}
          restaurantId={restaurant?.id}
          stampsRequired={restaurant?.stamps_required || 10}
          onStampAdded={refreshClients}
        />
      </div>
    </div>
  );
};

export default Index;
