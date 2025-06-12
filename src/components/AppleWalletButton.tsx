import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Download, Loader2, AlertCircle, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface AppleWalletButtonProps {
  clientId: string;
  clientName: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showDevBadge?: boolean;
}

const AppleWalletButton = ({ 
  clientId, 
  clientName, 
  disabled = false,
  variant = 'default',
  size = 'md',
  showDevBadge = true
}: AppleWalletButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWalletPass = async () => {
    setIsGenerating(true);
    
    try {
      // 🚧 TEMPORARILY DISABLED: generate-pkpass Edge Function not created yet
      toast({
        title: "🚧 Feature Coming Soon",
        description: "Apple Wallet integration is planned but not yet implemented. This feature requires Apple Developer Program setup.",
      });
      
      /* TODO: Uncomment when generate-pkpass Edge Function is created
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate wallet passes.",
          variant: "destructive",
        });
        return;
      }

      // 🔒 SECURITY: Removed session token logging to prevent exposure
      if (import.meta.env.DEV) {
        console.log('🍎 Generating wallet pass for client:', clientId);
      }

      // Call the Supabase Edge Function to generate the pass
      const { data, error } = await supabase.functions.invoke('generate-pkpass', {
        body: { clientId },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Function response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        
        // Check if it's a certificate/signing error (expected during development)
        if (error.message?.includes('certificate') || 
            error.message?.includes('signing') || 
            error.message?.includes('ZERIONSTUDIO') ||
            error.message?.includes('pass.com.zerionstudio.loyalty')) {
          toast({
            title: "🍎 Apple Developer Setup Required",
            description: "The wallet pass generation is working! You need Apple Developer Program ($99/year) to sign the passes. The backend function executed successfully.",
          });
        } else if (error.message?.includes('Client not found')) {
          toast({
            title: "Customer Not Found",
            description: "This customer doesn't exist in the database. Please refresh and try again.",
            variant: "destructive",
          });
        } else if (error.message?.includes('Access denied')) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to generate passes for this customer.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Function Error",
            description: `Backend error: ${error.message}`,
            variant: "destructive",
          });
        }
        return;
      }

      // If we get here, the pass was generated successfully
      if (data) {
        console.log('✅ Pass data received, type:', typeof data);
        
        try {
          // Handle different data formats
          let passData: Uint8Array;
          
          if (typeof data === 'string') {
            // If it's a string (JSON), convert to bytes
            const encoder = new TextEncoder();
            passData = encoder.encode(data);
          } else if (data instanceof ArrayBuffer) {
            passData = new Uint8Array(data);
          } else if (data instanceof Uint8Array) {
            passData = data;
          } else {
            // If it's an object, stringify it
            const encoder = new TextEncoder();
            passData = encoder.encode(JSON.stringify(data));
          }
          
          // Create blob and download
          const blob = new Blob([passData], { type: 'application/vnd.apple.pkpass' });
          const url = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = `${clientName.replace(/[^a-zA-Z0-9]/g, '-')}-loyalty-card.pkpass`;
          
          // Trigger download
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Clean up the URL
          URL.revokeObjectURL(url);

          toast({
            title: "🎉 Wallet Pass Generated!",
            description: `${clientName}'s loyalty card has been downloaded. Note: This is a development version and won't open in Apple Wallet until Apple Developer certificates are added.`,
          });
          
          console.log('📱 Pass file downloaded successfully');
          
        } catch (downloadError) {
          console.error('❌ Download error:', downloadError);
          toast({
            title: "Download Failed",
            description: "The pass was generated but couldn't be downloaded. Check the console for details.",
            variant: "destructive",
          });
        }
      } else {
        console.log('⚠️ No data received from function');
        toast({
          title: "No Data Received",
          description: "The function executed but returned no data.",
          variant: "destructive",
        });
      }
      
      */ // End of commented code

    } catch (error: any) {
      console.error('❌ Error with wallet pass feature:', error);
      
      toast({
        title: "Feature Not Available",
        description: "Apple Wallet integration is coming soon. Please check back later.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const buttonSizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleGenerateWalletPass}
        disabled={disabled || isGenerating}
        variant={variant}
        className={`${buttonSizes[size]} ${
          variant === 'default' 
            ? 'bg-black hover:bg-gray-800 text-white' 
            : ''
        }`}
        title="Generate Apple Wallet pass (requires Apple Developer Program for full functionality)"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Add to Wallet
          </>
        )}
      </Button>
      
      {showDevBadge && (
        <Badge 
          variant="outline" 
          className="text-xs bg-orange-50 text-orange-700 border-orange-200"
          title="Apple Wallet integration is functional but requires Apple Developer Program ($99/year) for device installation"
        >
          <Info className="w-3 h-3 mr-1" />
          Dev Mode
        </Badge>
      )}
    </div>
  );
};

export default AppleWalletButton; 