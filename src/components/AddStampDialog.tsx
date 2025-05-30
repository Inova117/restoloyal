
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Scan, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  email: string;
  stamps: number;
  qr_code: string;
}

interface AddStampDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  restaurantId?: string;
  stampsRequired: number;
  onStampAdded?: () => void;
}

const AddStampDialog = ({ 
  open, 
  onOpenChange, 
  clients, 
  restaurantId, 
  stampsRequired,
  onStampAdded 
}: AddStampDialogProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleQrCodeInput = (value: string) => {
    setQrCode(value);
    
    // Find client by QR code
    const client = clients.find(c => c.qr_code === value);
    setFoundClient(client || null);
  };

  const handleScanQR = () => {
    setIsScanning(true);
    
    // Simulate QR scanning with a random client
    setTimeout(() => {
      if (clients.length > 0) {
        const randomClient = clients[Math.floor(Math.random() * clients.length)];
        setQrCode(randomClient.qr_code);
        setFoundClient(randomClient);
        
        toast({
          title: "QR Code Scanned",
          description: `Found client: ${randomClient.name}`,
        });
      }
      setIsScanning(false);
    }, 2000);
  };

  const handleAddStamp = async () => {
    if (!foundClient || !restaurantId || !user) return;
    
    setIsLoading(true);
    
    try {
      // Add stamp to the stamps table
      const { error } = await supabase
        .from('stamps')
        .insert({
          client_id: foundClient.id,
          restaurant_id: restaurantId,
          added_by: user.id,
        });

      if (error) throw error;

      const newStampCount = foundClient.stamps + 1;
      const isRewardReady = newStampCount >= stampsRequired;
      
      toast({
        title: "Stamp Added Successfully",
        description: isRewardReady 
          ? `${foundClient.name} is now eligible for a reward!`
          : `${foundClient.name} now has ${newStampCount}/${stampsRequired} stamps`,
      });
      
      setQrCode('');
      setFoundClient(null);
      onOpenChange(false);
      
      if (onStampAdded) {
        onStampAdded();
      }
    } catch (error: any) {
      console.error('Error adding stamp:', error);
      toast({
        title: "Error Adding Stamp",
        description: error.message || "Failed to add stamp. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setQrCode('');
    setFoundClient(null);
    setIsScanning(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-green-600" />
            Add Stamp
          </DialogTitle>
          <DialogDescription>
            Scan or enter a client's QR code to add a stamp to their loyalty card.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qrCode" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </Label>
            <div className="flex gap-2">
              <Input
                id="qrCode"
                type="text"
                placeholder="Enter or scan QR code"
                value={qrCode}
                onChange={(e) => handleQrCodeInput(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleScanQR}
                disabled={isScanning}
                className="bg-green-600 hover:bg-green-700 text-white px-4"
              >
                {isScanning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Scan className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {foundClient && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">{foundClient.name}</h3>
                    <p className="text-sm text-green-700">{foundClient.email}</p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-green-800">
                        Current Progress: {foundClient.stamps}/{stampsRequired} stamps
                      </p>
                      <div className="w-full bg-green-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(foundClient.stamps / stampsRequired) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {qrCode && !foundClient && (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900">Client Not Found</h3>
                    <p className="text-sm text-red-700">No client found with QR code: {qrCode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading || isScanning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStamp}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={!foundClient || isLoading || isScanning}
            >
              {isLoading ? 'Adding...' : 'Add Stamp'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStampDialog;
