// ============================================================================
// CREATE RESTAURANT MODAL
// Restaurant Loyalty Platform - Restaurant Creation Form
// ============================================================================

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building, Star, DollarSign, Gift, X, AlertCircle } from 'lucide-react';
import { useRestaurantManagement } from '@/hooks/platform/useRestaurantManagement';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface CreateRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
}

interface RestaurantFormData {
  name: string;
  description: string;
  cuisine_type: string;
  phone: string;
  email: string;
  website: string;
  loyalty_program: {
    stamps_to_reward: number;
    reward_description: string;
    stamp_value: number;
  };
}

// ============================================================================
// CUISINE TYPE OPTIONS
// ============================================================================

const CUISINE_TYPES = [
  { value: 'american', label: 'American', icon: '🇺🇸' },
  { value: 'italian', label: 'Italian', icon: '🇮🇹' },
  { value: 'mexican', label: 'Mexican', icon: '🇲🇽' },
  { value: 'chinese', label: 'Chinese', icon: '🇨🇳' },
  { value: 'japanese', label: 'Japanese', icon: '🇯🇵' },
  { value: 'indian', label: 'Indian', icon: '🇮🇳' },
  { value: 'french', label: 'French', icon: '🇫🇷' },
  { value: 'greek', label: 'Greek', icon: '🇬🇷' },
  { value: 'thai', label: 'Thai', icon: '🇹🇭' },
  { value: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
  { value: 'seafood', label: 'Seafood', icon: '🐟' },
  { value: 'steakhouse', label: 'Steakhouse', icon: '🥩' },
  { value: 'pizza', label: 'Pizza', icon: '🍕' },
  { value: 'fast_food', label: 'Fast Food', icon: '🍔' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
  { value: 'bakery', label: 'Bakery', icon: '🥖' },
  { value: 'other', label: 'Other', icon: '🍽️' }
];

// ============================================================================
// FORM VALIDATION
// ============================================================================

const validateForm = (data: RestaurantFormData): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!data.name.trim()) {
    errors.push('Restaurant name is required');
  }

  if (!data.cuisine_type) {
    errors.push('Cuisine type is required');
  }

  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please enter a valid email address');
  }

  // Website validation
  if (data.website && !/^https?:\/\/.+\..+/.test(data.website)) {
    errors.push('Please enter a valid website URL (include http:// or https://)');
  }

  // Loyalty program validation
  if (data.loyalty_program.stamps_to_reward < 1 || data.loyalty_program.stamps_to_reward > 50) {
    errors.push('Stamps to reward must be between 1 and 50');
  }

  if (data.loyalty_program.stamp_value < 0.01 || data.loyalty_program.stamp_value > 100) {
    errors.push('Stamp value must be between $0.01 and $100.00');
  }

  if (!data.loyalty_program.reward_description.trim()) {
    errors.push('Reward description is required');
  }

  return errors;
};

// ============================================================================
// CREATE RESTAURANT MODAL COMPONENT
// ============================================================================

export const CreateRestaurantModal: React.FC<CreateRestaurantModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess
}) => {
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    description: '',
    cuisine_type: '',
    phone: '',
    email: '',
    website: '',
    loyalty_program: {
      stamps_to_reward: 10,
      reward_description: 'Free item',
      stamp_value: 1.00
    }
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createRestaurant } = useRestaurantManagement({ autoLoad: false });
  const { toast } = useToast();

  const handleInputChange = (field: keyof RestaurantFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleLoyaltyProgramChange = (field: keyof RestaurantFormData['loyalty_program'], value: string | number) => {
    setFormData(prev => ({
      ...prev,
      loyalty_program: {
        ...prev.loyalty_program,
        [field]: field === 'stamps_to_reward' ? Number(value) : field === 'stamp_value' ? Number(value) : value
      }
    }));
    
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const success = await createRestaurant({
        ...formData,
        client_id: clientId,
        // Clean up optional fields
        description: formData.description.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined
      });

      if (success) {
        toast({
          title: 'Restaurant Created',
          description: `${formData.name} has been created successfully.`
        });

        // Reset form
        setFormData({
          name: '',
          description: '',
          cuisine_type: '',
          phone: '',
          email: '',
          website: '',
          loyalty_program: {
            stamps_to_reward: 10,
            reward_description: 'Free item',
            stamp_value: 1.00
          }
        });

        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create restaurant. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: '',
        cuisine_type: '',
        phone: '',
        email: '',
        website: '',
        loyalty_program: {
          stamps_to_reward: 10,
          reward_description: 'Free item',
          stamp_value: 1.00
        }
      });
      setErrors([]);
      onClose();
    }
  };

  const selectedCuisine = CUISINE_TYPES.find(c => c.value === formData.cuisine_type);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-xl">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto p-4 bg-sage-turquoise-100 rounded-2xl w-fit mb-4">
            <Building className="h-8 w-8 text-sage-turquoise-600" />
          </div>
          <DialogTitle className="text-2xl font-editorial font-bold">Create New Restaurant</DialogTitle>
          <DialogDescription className="text-sage-600 leading-relaxed">
            Set up your restaurant profile and configure your loyalty program
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Display */}
          {errors.length > 0 && (
            <div className="p-4 bg-soft-rose-50 border border-soft-rose-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-soft-rose-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-soft-rose-800">Please fix the following errors:</h4>
                  <ul className="space-y-1 text-sm text-soft-rose-700">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-soft-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-sage-100">
              <div className="p-2 bg-sage-100 rounded-lg">
                <Building className="h-4 w-4 text-sage-600" />
              </div>
              <h3 className="text-lg font-editorial font-semibold text-sage-800">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-sage-700">
                  Restaurant Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter restaurant name"
                  className="border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-sage-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your restaurant"
                  className="border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200 min-h-[80px]"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine_type" className="text-sm font-medium text-sage-700">
                  Cuisine Type *
                </Label>
                <Select value={formData.cuisine_type} onValueChange={(value) => handleInputChange('cuisine_type', value)}>
                  <SelectTrigger className="border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200">
                    <SelectValue placeholder="Select cuisine type">
                      {selectedCuisine && (
                        <div className="flex items-center gap-2">
                          <span>{selectedCuisine.icon}</span>
                          <span>{selectedCuisine.label}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CUISINE_TYPES.map((cuisine) => (
                      <SelectItem key={cuisine.value} value={cuisine.value}>
                        <div className="flex items-center gap-2">
                          <span>{cuisine.icon}</span>
                          <span>{cuisine.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-sage-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-sage-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="restaurant@example.com"
                  className="border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium text-sage-700">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourrestaurant.com"
                  className="border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200"
                />
              </div>
            </div>
          </div>

          {/* Loyalty Program Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-sage-100">
              <div className="p-2 bg-sage-turquoise-100 rounded-lg">
                <Gift className="h-4 w-4 text-sage-turquoise-600" />
              </div>
              <h3 className="text-lg font-editorial font-semibold text-sage-800">Loyalty Program</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stamps_to_reward" className="text-sm font-medium text-sage-700">
                  Stamps Required for Reward *
                </Label>
                <Input
                  id="stamps_to_reward"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.loyalty_program.stamps_to_reward}
                  onChange={(e) => handleLoyaltyProgramChange('stamps_to_reward', e.target.value)}
                  className="border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200"
                  required
                />
                <p className="text-xs text-sage-500">How many stamps customers need to earn a reward</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stamp_value" className="text-sm font-medium text-sage-700">
                  Stamp Value *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sage-400" />
                  <Input
                    id="stamp_value"
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={formData.loyalty_program.stamp_value}
                    onChange={(e) => handleLoyaltyProgramChange('stamp_value', e.target.value)}
                    className="pl-10 border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200"
                    required
                  />
                </div>
                <p className="text-xs text-sage-500">Dollar value of each stamp earned</p>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="reward_description" className="text-sm font-medium text-sage-700">
                  Reward Description *
                </Label>
                <Input
                  id="reward_description"
                  type="text"
                  value={formData.loyalty_program.reward_description}
                  onChange={(e) => handleLoyaltyProgramChange('reward_description', e.target.value)}
                  placeholder="e.g., Free appetizer, 20% off next meal, Free dessert"
                  className="border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200"
                  required
                />
                <p className="text-xs text-sage-500">What customers receive when they complete their stamp card</p>
              </div>
            </div>

            {/* Loyalty Program Preview */}
            <div className="bg-gradient-to-br from-sage-turquoise-50 to-sage-turquoise-100/50 p-6 rounded-xl border border-sage-turquoise-200">
              <h4 className="font-editorial font-medium text-sage-turquoise-800 mb-4 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Loyalty Program Preview
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sage-turquoise-600">Stamps to Complete:</span>
                  <Badge className="bg-sage-turquoise-200 text-sage-turquoise-800 border-sage-turquoise-300">
                    {formData.loyalty_program.stamps_to_reward} stamps
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sage-turquoise-600">Value per Stamp:</span>
                  <Badge className="bg-sage-turquoise-200 text-sage-turquoise-800 border-sage-turquoise-300">
                    ${formData.loyalty_program.stamp_value.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sage-turquoise-600">Total Program Value:</span>
                  <Badge className="bg-sage-turquoise-200 text-sage-turquoise-800 border-sage-turquoise-300">
                    ${(formData.loyalty_program.stamps_to_reward * formData.loyalty_program.stamp_value).toFixed(2)}
                  </Badge>
                </div>
                <div className="pt-2 border-t border-sage-turquoise-200">
                  <span className="text-sage-turquoise-600 text-sm">Customer Reward:</span>
                  <div className="font-medium text-sage-turquoise-800 mt-1">
                    {formData.loyalty_program.reward_description || 'No reward description set'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6 border-t border-sage-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              variant="sage"
              effect="glow"
              disabled={isSubmitting}
              className="space-x-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Building className="h-4 w-4" />
                  <span>Create Restaurant</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 