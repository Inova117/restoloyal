
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Scan, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AddStampDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddStampDialog = ({ open, onOpenChange }: AddStampDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [foundClient, setFoundClient] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Mock client data
  const mockClients = [
    { id: '1', name: 'John Doe', email: 'john@example.com', stamps: 7, maxStamps: 10, qrCode: 'QR123456' },
    { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', stamps: 3, maxStamps: 10, qrCode: 'QR123457' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', stamps: 9, maxStamps: 10, qrCode: 'QR123458' }
  ];

  const handleQrCodeInput = (value: string) => {
    setQrCode(value);
    
    // Find client by QR code
    const client = mockClients.find(c => c.qrCode === value);
    setFoundClient(client || null);
  };

  const handleScanQR = () => {
    setIsScanning(true);
    
    // Simulate QR scanning
    setTimeout(() => {
      const randomClient = mockClients[Math.floor(Math.random() * mockClients.length)];
      setQrCode(randomClient.qrCode);
      setFoundClient(randomClient);
      setIsScanning(false);
      
      toast({
        title: "QR Code Scanned",
        description: `Found client: ${randomClient.name}`,
      });
    }, 2000);
  };

  const handleAddStamp = async () => {
    if (!foundClient) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newStampCount = foundClient.stamps + 1;
    const isRewardReady = newStampCount >= foundClient.maxStamps;
    
    toast({
      title: "Stamp Added Successfully",
      description: isRewardReady 
        ? `${foundClient.name} is now eligible for a reward!`
        : `${foundClient.name} now has ${newStampCount}/${foundClient.maxStamps} stamps`,
    });
    
    setIsLoading(false);
    setQrCode('');
    setFoundClient(null);
    onOpenChange(false);
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
                        Current Progress: {foundClient.stamps}/{foundClient.maxStamps} stamps
                      </p>
                      <div className="w-full bg-green-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(foundClient.stamps / foundClient.maxStamps) * 100}%` }}
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
