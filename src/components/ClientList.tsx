
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Phone, Mail, Gift, Plus, Users } from 'lucide-react';
import StampProgress from './StampProgress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  stamps: number;
  maxStamps: number;
  qr_code: string;
  created_at: string;
}

interface ClientListProps {
  clients: Client[];
  onRefresh?: () => void;
  restaurantId?: string;
}

const ClientList = ({ clients, onRefresh, restaurantId }: ClientListProps) => {
  const { user } = useAuth();

  const handleAddStamp = async (clientId: string, clientName: string) => {
    if (!restaurantId || !user) {
      toast({
        title: "Error",
        description: "Unable to add stamp. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('stamps')
        .insert({
          client_id: clientId,
          restaurant_id: restaurantId,
          added_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Stamp Added",
        description: `Added stamp for ${clientName}`,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error adding stamp:', error);
      toast({
        title: "Error",
        description: "Failed to add stamp. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRedeemReward = async (clientId: string, clientName: string, stamps: number) => {
    if (!restaurantId || !user) {
      toast({
        title: "Error",
        description: "Unable to redeem reward. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add reward record
      const { error: rewardError } = await supabase
        .from('rewards')
        .insert({
          client_id: clientId,
          restaurant_id: restaurantId,
          redeemed_by: user.id,
          stamps_used: stamps,
          description: 'Free item reward',
        });

      if (rewardError) throw rewardError;

      // Reset client stamps to 0
      const { error: updateError } = await supabase
        .from('clients')
        .update({ stamps: 0 })
        .eq('id', clientId);

      if (updateError) throw updateError;

      toast({
        title: "Reward Redeemed",
        description: `${clientName} has redeemed their reward! Stamps reset to 0.`,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      toast({
        title: "Error",
        description: "Failed to redeem reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShowQR = (qrCode: string, clientName: string) => {
    toast({
      title: "QR Code",
      description: `QR Code for ${clientName}: ${qrCode}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
        <p className="text-gray-600">{clients.length} total clients</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {client.name}
                  </CardTitle>
                  <div className="space-y-1 mt-2">
                    {client.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShowQR(client.qr_code, client.name)}
                  className="p-2"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">
                    {client.stamps}/{client.maxStamps}
                  </span>
                </div>
                <StampProgress 
                  current={client.stamps} 
                  total={client.maxStamps} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                {client.stamps >= client.maxStamps ? (
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    <Gift className="w-3 h-3 mr-1" />
                    Reward Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-3 py-1">
                    {client.maxStamps - client.stamps} stamps to go
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddStamp(client.id, client.name)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                  disabled={client.stamps >= client.maxStamps}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Stamp
                </Button>
                
                {client.stamps >= client.maxStamps && (
                  <Button
                    onClick={() => handleRedeemReward(client.id, client.name, client.stamps)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                  >
                    <Gift className="w-4 h-4 mr-1" />
                    Redeem
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Joined {new Date(client.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {clients.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-600 mb-4">Start by registering your first client</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add First Client
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientList;
