// ============================================================================
// ADD LOCATION DIALOG - UPDATED FOR 4-TIER HIERARCHY
// ============================================================================
// This component creates new locations (Tier 3) for clients
// Can only be used by client admins (Tier 2)
// ============================================================================

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useUserRole, getUserClientContext } from '@/hooks/useUserRole'
import { Plus, MapPin, Building, Phone, Mail } from 'lucide-react'
import type { Location } from '@/types/database'

interface AddLocationDialogProps {
  onLocationAdded: () => void
  trigger?: React.ReactNode // Custom trigger element
}

export default function AddLocationDialog({ 
  onLocationAdded, 
  trigger 
}: AddLocationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { role, roleData } = useUserRole()
  const { toast } = useToast()

  const [locationData, setLocationData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
    email: '',
    description: ''
  })

  // Get user context for multi-tenant isolation
  const userContext = getUserClientContext(roleData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!locationData.name.trim() || !locationData.address.trim()) {
      toast({
        title: "Missing Information",
        description: "Location name and address are required",
        variant: "destructive"
      })
      return
    }

    if (!userContext.clientId) {
      toast({
        title: "Access Error",
        description: "Cannot determine your client context",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Call create-location Edge Function
      const { data, error } = await supabase.functions.invoke('create-location', {
        body: {
          name: locationData.name.trim(),
          address: locationData.address.trim(),
          city: locationData.city.trim(),
          state: locationData.state.trim(),
          postal_code: locationData.postal_code.trim(),
          country: locationData.country,
          phone: locationData.phone.trim() || null,
          email: locationData.email.trim() || null,
          description: locationData.description.trim() || null
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create location')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create location')
      }

      toast({
        title: "Location Created",
        description: `${locationData.name} has been added to your business.`,
      })

      // Reset form
      setLocationData({
        name: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        phone: '',
        email: '',
        description: ''
      })

      setOpen(false)
      onLocationAdded()

    } catch (error) {
      console.error('Error creating location:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create location",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setLocationData({
      name: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
      phone: '',
      email: '',
      description: ''
    })
    setOpen(false)
  }

  // Only client admins can create locations
  if (role !== 'client_admin') {
    return null
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Location
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Add New Location
          </DialogTitle>
          <DialogDescription>
            Create a new location for your business. This will be a new point of service for your loyalty program.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Location Name */}
            <div className="space-y-2">
              <Label htmlFor="locationName">
                Location Name *
              </Label>
              <Input
                id="locationName"
                value={locationData.name}
                onChange={(e) => setLocationData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Downtown Store, Mall Location, etc."
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="locationAddress">
                Street Address *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="locationAddress"
                  value={locationData.address}
                  onChange={(e) => setLocationData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main Street"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationCity">
                  City
                </Label>
                <Input
                  id="locationCity"
                  value={locationData.city}
                  onChange={(e) => setLocationData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationState">
                  State/Province
                </Label>
                <Input
                  id="locationState"
                  value={locationData.state}
                  onChange={(e) => setLocationData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationPostal">
                  Postal Code
                </Label>
                <Input
                  id="locationPostal"
                  value={locationData.postal_code}
                  onChange={(e) => setLocationData(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="10001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationCountry">
                  Country
                </Label>
                <Input
                  id="locationCountry"
                  value={locationData.country}
                  onChange={(e) => setLocationData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="US"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationPhone">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="locationPhone"
                    value={locationData.phone}
                    onChange={(e) => setLocationData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationEmail">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="locationEmail"
                    type="email"
                    value={locationData.email}
                    onChange={(e) => setLocationData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="location@business.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="locationDescription">
                Description
              </Label>
              <Textarea
                id="locationDescription"
                value={locationData.description}
                onChange={(e) => setLocationData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this location (optional)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Special features, hours, or other details
              </p>
            </div>

            {/* Client Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4" />
                <span className="font-medium">Your Business</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This location will be added to your business account
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !locationData.name.trim() || !locationData.address.trim()}
            >
              {loading ? 'Creating...' : 'Create Location'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 