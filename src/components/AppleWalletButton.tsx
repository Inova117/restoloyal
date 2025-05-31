import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AppleWalletButtonProps {
  clientId: string;
  clientName: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const AppleWalletButton = ({ 
  clientId, 
  clientName, 
  disabled = false,
  variant = 'default',
  size = 'md'
}: AppleWalletButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWalletPass = async () => {
    setIsGenerating(true);
    
    try {
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

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show message about feature being temporarily unavailable
      toast({
        title: "Feature Temporarily Unavailable",
        description: "Apple Wallet pass generation is currently being set up. This feature will be available soon!",
        variant: "destructive",
      });

    } catch (error: any) {
      console.error('Error generating wallet pass:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Apple Wallet pass. Please try again.",
        variant: "destructive",
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
    <Button
      onClick={handleGenerateWalletPass}
      disabled={disabled || isGenerating}
      variant={variant}
      className={`${buttonSizes[size]} ${
        variant === 'default' 
          ? 'bg-black hover:bg-gray-800 text-white' 
          : ''
      }`}
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
  );
};

export default AppleWalletButton; 