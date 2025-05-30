
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

const Index = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddStampOpen, setIsAddStampOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - will be replaced with real Supabase data
  const [clients] = useState([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      stamps: 7,
      maxStamps: 10,
      qrCode: 'QR123456',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      phone: '+1234567891',
      stamps: 3,
      maxStamps: 10,
      qrCode: 'QR123457',
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '+1234567892',
      stamps: 10,
      maxStamps: 10,
      qrCode: 'QR123458',
      createdAt: '2024-01-10'
    }
  ]);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching restaurant:', error);
        } else {
          setRestaurant(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [user]);

  const totalClients = clients.length;
  const totalStamps = clients.reduce((sum, client) => sum + client.stamps, 0);
  const readyForReward = clients.filter(client => client.stamps >= client.maxStamps).length;

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
                    {clients.filter(client => client.stamps >= client.maxStamps).map(client => (
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
            <ClientList clients={clients} />
          </TabsContent>
        </Tabs>

        <AddClientDialog 
          open={isAddClientOpen} 
          onOpenChange={setIsAddClientOpen}
        />
        
        <AddStampDialog 
          open={isAddStampOpen} 
          onOpenChange={setIsAddStampOpen}
        />
      </div>
    </div>
  );
};

export default Index;
