// ============================================================================
// ADD CUSTOMER DIALOG - UPDATED FOR 4-TIER HIERARCHY
// ============================================================================
// This component creates new customers (Tier 4) in the loyalty system
// Can be used by location staff and client admins
// ============================================================================

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useUserRole, getUserClientContext } from '@/hooks/useUserRole'
import { Plus, User, Mail, Phone, MapPin } from 'lucide-react'
import type { Customer } from '@/types/database'

interface AddCustomerDialogProps {
  onCustomerAdded: () => void
  locationId?: string // Optional: if specified, customer will be added to this location
  trigger?: React.ReactNode // Custom trigger element
}

export default function AddCustomerDialog({ 
  onCustomerAdded, 
  locationId,
  trigger 
}: AddCustomerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { role, roleData } = useUserRole()
  const { toast } = useToast()

  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

  // Get user context for multi-tenant isolation
  const userContext = getUserClientContext(roleData)
  const targetLocationId = locationId || userContext.locationId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Customer name is required",
        variant: "destructive"
      })
      return
    }

    if (!targetLocationId) {
      toast({
        title: "Location Required",
        description: "Cannot create customer without a location",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Call create-customer Edge Function
      const { data, error } = await supabase.functions.invoke('create-customer', {
        body: {
          name: customerData.name.trim(),
          email: customerData.email.trim() || null,
          phone: customerData.phone.trim() || null,
          location_id: targetLocationId,
          notes: customerData.notes.trim() || null
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create customer')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create customer')
      }

      toast({
        title: "Customer Created",
        description: `${customerData.name} has been added to the loyalty program.`,
      })

      // Reset form
      setCustomerData({
        name: '',
        email: '',
        phone: '',
        notes: ''
      })

      setOpen(false)
      onCustomerAdded()

    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setCustomerData({
      name: '',
      email: '',
      phone: '',
      notes: ''
    })
    setOpen(false)
  }

  // Check if user can create customers
  const canCreateCustomers = role === 'superadmin' || 
                            role === 'client_admin' || 
                            role === 'location_staff'

  if (!canCreateCustomers) {
    return null
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Customer
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Customer
          </DialogTitle>
          <DialogDescription>
            Create a new customer account for the loyalty program.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Customer Name *
              </Label>
              <Input
                id="customerName"
                value={customerData.name}
                onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer's full name"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@email.com"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: For sending loyalty updates
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="customerPhone">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerPhone"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: For SMS notifications
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="customerNotes">
                Notes
              </Label>
              <Input
                id="customerNotes"
                value={customerData.notes}
                onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special notes about this customer"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Preferences, allergies, etc.
              </p>
            </div>

            {/* Location Info */}
            {targetLocationId && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">
                    {role === 'location_staff' ? 'Your Location' : 'Selected Location'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer will be added to this location's loyalty program
                </p>
              </div>
            )}
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
              disabled={loading || !customerData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 