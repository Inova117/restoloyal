
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Users, Gift, Plus, Scan, LogOut, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ClientList from '@/components/ClientList';
import AddStampDialog from '@/components/AddStampDialog';
import AddClientDialog from '@/components/AddClientDialog';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddStampOpen, setIsAddStampOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!user) return;

      try {
        // Fetch restaurant data
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (restaurantError) {
          console.error('Error fetching restaurant:', restaurantError);
        } else {
          setRestaurant(restaurantData);

          // Fetch clients for this restaurant
          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('*')
            .eq('restaurant_id', restaurantData.id)
            .order('created_at', { ascending: false });

          if (clientsError) {
            console.error('Error fetching clients:', clientsError);
          } else {
            setClients(clientsData || []);
          }
        }
      } catch (error) {
        console.error('Database error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [user]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Store className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {restaurant?.name || 'Restaurant Loyalty Hub'}
              </h1>
              <p className="text-gray-600 text-lg">Manage your customer loyalty program</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsAddClientOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Client
            </Button>
            <Button 
              onClick={() => setIsAddStampOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Scan className="w-5 h-5 mr-2" />
              Add Stamp
            </Button>
            <Button 
              onClick={signOut}
              variant="outline"
              size="lg"
              className="border-2"
            >
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
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-white shadow-md">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Clients
            </TabsTrigger>
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
