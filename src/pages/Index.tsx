import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { QrCode, Users, Gift, Plus, Scan, LogOut, Store, BarChart3, Building2, Crown, Settings, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, getAvailableTabs, returnToPlatform, returnToHQ } from '@/hooks/useUserRole';
import ClientList from '@/components/ClientList';
import AddStampDialog from '@/components/AddStampDialog';
import AddCustomerDialog from '@/components/AddCustomerDialog';
import AddLocationDialog from '@/components/AddLocationDialog';
import AddStaffDialog from '@/components/AddStaffDialog';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import GallettiHQDashboard from '@/components/GallettiHQDashboard';
import ZerionPlatformDashboard from '@/components/ZerionPlatformDashboard';
import POSInterface from '@/components/POSInterface';
import type { Customer, Location, Client } from '@/types/database';

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { role, roleData, loading: roleLoading, error: roleError } = useUserRole();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  
  // State for different user contexts
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || !role || !roleData) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        switch (role) {
          case 'superadmin':
            await loadSuperadminData();
            break;
          case 'client_admin':
            await loadClientAdminData();
            break;
          case 'location_staff':
            await loadLocationStaffData();
            break;
          case 'customer':
            await loadCustomerData();
            break;
          default:
            console.warn('Unknown role:', role);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: "Connection Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setTimeout(() => setPageLoaded(true), 100);
      }
    };

    loadInitialData();
  }, [user, role, roleData]);

  const loadSuperadminData = async () => {
    // Note: Clients data is managed by ZerionPlatformDashboard component
    // No need to load clients data here
  };

  const loadClientAdminData = async () => {
    const clientAdmin = roleData as any;
    const clientId = clientAdmin.client_id;

    // Load client data
    const { data: clientData } = await (supabase as any)
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientData) {
      setCurrentClient(clientData);
    }

    // Load locations for this client
    const { data: locationsData, error: locationsError } = await (supabase as any)
      .from('locations')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (locationsError) {
      console.error('Error loading locations:', locationsError);
    } else {
      setLocations(locationsData || []);
    }

    // Load customers across all locations
    const { data: customersData, error: customersError } = await (supabase as any)
      .from('customers')
      .select(`
        *,
        locations (
          id,
          name
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('Error loading customers:', customersError);
    } else {
      setCustomers(customersData || []);
    }
  };

  const loadLocationStaffData = async () => {
    const locationStaff = roleData as any;
    const locationId = locationStaff.location_id;
    const clientId = locationStaff.client_id;

    // Load location data
    const { data: locationData } = await (supabase as any)
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (locationData) {
      setCurrentLocation(locationData);
    }

    // Load client data
    const { data: clientData } = await (supabase as any)
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientData) {
      setCurrentClient(clientData);
    }

    // Load customers for this location
    const { data: customersData, error: customersError } = await (supabase as any)
      .from('customers')
      .select('*')
      .eq('location_id', locationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('Error loading customers:', customersError);
    } else {
      setCustomers(customersData || []);
    }
  };

  const loadCustomerData = async () => {
    const customer = roleData as any;
    const locationId = customer.location_id;
    const clientId = customer.client_id;

    // Load location data
    const { data: locationData } = await (supabase as any)
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (locationData) {
      setCurrentLocation(locationData);
    }

    // Load client data
    const { data: clientData } = await (supabase as any)
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientData) {
      setCurrentClient(clientData);
    }
  };

  // Set default tab based on role
  useEffect(() => {
    if (!roleLoading && role) {
      const availableTabs = getAvailableTabs(role);
      if (availableTabs.length > 0 && availableTabs[0]) {
        setActiveTab(availableTabs[0]);
      }
    }
  }, [role, roleLoading]);

  const refreshCustomers = async () => {
    if (!role || !roleData) return;

    try {
      switch (role) {
        case 'client_admin':
          await loadClientAdminData();
          break;
        case 'location_staff':
          await loadLocationStaffData();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error refreshing customers:', error);
      toast({
        title: "Refresh Error",
        description: "Could not refresh customer data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const availableTabs = getAvailableTabs(role);

  if (roleLoading || loading) {
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

  if (roleError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">Access Error</div>
          <div className="text-muted-foreground">{roleError}</div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">No Role Assigned</div>
          <div className="text-muted-foreground">
            Your account doesn't have a role assigned. Please contact your administrator.
          </div>
          <Button onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'superadmin':
        return <Crown className="h-5 w-5" />;
      case 'client_admin':
        return <Building2 className="h-5 w-5" />;
      case 'location_staff':
        return <Store className="h-5 w-5" />;
      case 'customer':
        return <Users className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'superadmin':
        return 'Platform Administrator';
      case 'client_admin':
        return `${currentClient?.name || 'Client'} Administrator`;
      case 'location_staff':
        return `${currentLocation?.name || 'Location'} Staff`;
      case 'customer':
        return 'Customer Portal';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className={`min-h-screen bg-background transition-opacity duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-4 justify-between">
          <div className="flex items-center space-x-4">
            {getRoleIcon()}
            <div>
              <h1 className="text-xl font-semibold">{getRoleTitle()}</h1>
              {role !== 'superadmin' && (
                <p className="text-sm text-muted-foreground">
                  {role === 'customer' ? currentLocation?.name : 
                   role === 'location_staff' ? `${currentClient?.name} - ${currentLocation?.name}` :
                   currentClient?.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {role === 'client_admin' && (
              <Button variant="outline" size="sm" onClick={returnToHQ}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to HQ
              </Button>
            )}
            {role === 'superadmin' && (
              <Button variant="outline" size="sm" onClick={returnToPlatform}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Platform View
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab === 'platform' && <Crown className="h-4 w-4 mr-2" />}
                {tab === 'dashboard' && <BarChart3 className="h-4 w-4 mr-2" />}
                {tab === 'clients' && <Building2 className="h-4 w-4 mr-2" />}
                {tab === 'locations' && <Store className="h-4 w-4 mr-2" />}
                {tab === 'customers' && <Users className="h-4 w-4 mr-2" />}
                {tab === 'stamps' && <Plus className="h-4 w-4 mr-2" />}
                {tab === 'rewards' && <Gift className="h-4 w-4 mr-2" />}
                {tab === 'analytics' && <BarChart3 className="h-4 w-4 mr-2" />}
                {tab === 'settings' && <Settings className="h-4 w-4 mr-2" />}
                {tab === 'loyalty' && <QrCode className="h-4 w-4 mr-2" />}
                {tab === 'history' && <Scan className="h-4 w-4 mr-2" />}
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Superadmin Platform View */}
          {role === 'superadmin' && (
            <>
              <TabsContent value="platform">
                <ZerionPlatformDashboard />
              </TabsContent>
                             <TabsContent value="clients">
                 <div className="space-y-6">
                   <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-bold">Platform Clients</h2>
                     <ClientList refreshTrigger={0} />
                   </div>
                 </div>
               </TabsContent>
              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>
            </>
          )}

          {/* Client Admin Views */}
          {role === 'client_admin' && (
            <>
              <TabsContent value="dashboard">
                <GallettiHQDashboard />
              </TabsContent>
              <TabsContent value="locations">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Locations</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {locations.map((location) => (
                      <div key={location.id} className="p-4 border rounded-lg">
                        <h3 className="font-semibold">{location.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {location.address}, {location.city}, {location.state}
                        </p>
                        <div className="mt-2 flex space-x-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            Manage Staff
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
                             <TabsContent value="customers">
                 <div className="space-y-6">
                   <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-bold">All Customers</h2>
                     <div className="flex gap-2">
                       <AddCustomerDialog onCustomerAdded={refreshCustomers} />
                       <AddLocationDialog onLocationAdded={() => window.location.reload()} />
                       <AddStaffDialog onStaffAdded={() => window.location.reload()} />
                     </div>
                   </div>
                   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {customers.map((customer) => (
                       <div key={customer.id} className="p-4 border rounded-lg">
                         <h3 className="font-semibold">{customer.name}</h3>
                         <p className="text-sm text-muted-foreground">
                           Stamps: {customer.total_stamps}
                         </p>
                         <div className="mt-2 flex space-x-2">
                           <Button size="sm" variant="outline">
                             View Details
                           </Button>
                           <AddStampDialog 
                             customerId={customer.id}
                             onStampAdded={refreshCustomers}
                             trigger={
                               <Button size="sm" variant="outline">
                                 Add Stamp
                               </Button>
                             }
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </TabsContent>
              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>
            </>
          )}

          {/* Location Staff Views */}
          {role === 'location_staff' && (
            <>
              <TabsContent value="dashboard">
                <POSInterface />
              </TabsContent>
                             <TabsContent value="customers">
                 <div className="space-y-6">
                   <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-bold">Location Customers</h2>
                     <AddCustomerDialog onCustomerAdded={refreshCustomers} />
                   </div>
                   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {customers.map((customer) => (
                       <div key={customer.id} className="p-4 border rounded-lg">
                         <h3 className="font-semibold">{customer.name}</h3>
                         <p className="text-sm text-muted-foreground">
                           Stamps: {customer.total_stamps}
                         </p>
                         <div className="mt-2 flex space-x-2">
                           <Button size="sm" variant="outline">
                             View Details
                           </Button>
                           <AddStampDialog 
                             customerId={customer.id}
                             onStampAdded={refreshCustomers}
                             trigger={
                               <Button size="sm" variant="outline">
                                 Add Stamp
                               </Button>
                             }
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </TabsContent>
               <TabsContent value="stamps">
                 <div className="space-y-6">
                   <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-bold">Add Stamps</h2>
                     <AddStampDialog onStampAdded={refreshCustomers} />
                   </div>
                   <div className="p-4 border rounded-lg">
                     <p className="text-muted-foreground">
                       Select a customer and add stamps to their loyalty card.
                     </p>
                   </div>
                 </div>
               </TabsContent>
            </>
          )}

          {/* Customer Views */}
          {role === 'customer' && (
            <>
              <TabsContent value="loyalty">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">My Loyalty Card</h2>
                  <div className="p-6 border rounded-lg">
                    <h3 className="font-semibold mb-2">
                      {currentLocation?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Stamps: {(roleData as any)?.total_stamps || 0} / {(currentClient?.settings as any)?.stamps_required_for_reward || 10}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, ((roleData as any)?.total_stamps || 0) / ((currentClient?.settings as any)?.stamps_required_for_reward || 10) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="rewards">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Available Rewards</h2>
                  <p className="text-muted-foreground">
                    Earn {(currentClient?.settings as any)?.stamps_required_for_reward || 10} stamps to unlock rewards!
                  </p>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
