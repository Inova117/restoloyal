// ============================================================================
// ADD STAMP DIALOG - UPDATED FOR 4-TIER HIERARCHY
// ============================================================================
// This component adds stamps to customer loyalty cards
// Can be used by location staff and client admins
// ============================================================================

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useUserRole, getUserClientContext } from '@/hooks/useUserRole'
import { Plus, Star, User, Calendar, MapPin } from 'lucide-react'
import type { Customer, Stamp } from '@/types/database'

interface AddStampDialogProps {
  onStampAdded: () => void
  customerId?: string // Optional: if specified, stamp will be added to this customer
  trigger?: React.ReactNode // Custom trigger element
}

export default function AddStampDialog({ 
  onStampAdded, 
  customerId,
  trigger 
}: AddStampDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const { role, roleData } = useUserRole()
  const { toast } = useToast()

  const [stampData, setStampData] = useState({
    customer_id: customerId || '',
    stamp_count: 1,
    notes: ''
  })

  // Get user context for multi-tenant isolation
  const userContext = getUserClientContext(roleData)

  // Load customers for this location/client
  useEffect(() => {
    if (open && !customerId) {
      loadCustomers()
    }
  }, [open, customerId])

  const loadCustomers = async () => {
    setLoadingCustomers(true)
    try {
      let query = (supabase as any)
        .from('customers')
        .select('id, name, email, phone, total_stamps, is_active')
        .eq('is_active', true)
        .order('name')

      // Filter by location for location staff, by client for client admins
      if (role === 'location_staff' && userContext.locationId) {
        query = query.eq('location_id', userContext.locationId)
      } else if (role === 'client_admin' && userContext.clientId) {
        query = query.eq('client_id', userContext.clientId)
      }

      const { data, error } = await query

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      })
    } finally {
      setLoadingCustomers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stampData.customer_id || stampData.stamp_count < 1) {
      toast({
        title: "Missing Information",
        description: "Please select a customer and enter a valid stamp count",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Get customer details first
      const { data: customer, error: customerError } = await (supabase as any)
        .from('customers')
        .select('id, name, location_id, client_id')
        .eq('id', stampData.customer_id)
        .single()

      if (customerError || !customer) {
        throw new Error('Customer not found')
      }

      // Create stamp record
      const stampRecord = {
        customer_id: stampData.customer_id,
        location_id: customer.location_id,
        client_id: customer.client_id,
        stamp_count: stampData.stamp_count,
        notes: stampData.notes.trim() || null,
        created_at: new Date().toISOString()
      }

      const { data: newStamp, error: stampError } = await (supabase as any)
        .from('stamps')
        .insert([stampRecord])
        .select('id, stamp_count, created_at')
        .single()

      if (stampError) {
        throw new Error(stampError.message || 'Failed to add stamp')
      }

      // Update customer's total stamps
      const { error: updateError } = await (supabase as any)
        .from('customers')
        .update({ 
          total_stamps: (supabase as any).sql`total_stamps + ${stampData.stamp_count}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', stampData.customer_id)

      if (updateError) {
        console.error('Error updating customer total stamps:', updateError)
        // Don't throw here, stamp was created successfully
      }

      toast({
        title: "Stamp Added",
        description: `Added ${stampData.stamp_count} stamp${stampData.stamp_count > 1 ? 's' : ''} to ${customer.name}'s loyalty card.`,
      })

      // Reset form
      setStampData({
        customer_id: customerId || '',
        stamp_count: 1,
        notes: ''
      })

      setOpen(false)
      onStampAdded()

    } catch (error) {
      console.error('Error adding stamp:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add stamp",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setStampData({
      customer_id: customerId || '',
      stamp_count: 1,
      notes: ''
    })
    setOpen(false)
  }

  // Check if user can add stamps
  const canAddStamps = role === 'superadmin' || 
                      role === 'client_admin' || 
                      (role === 'location_staff' && (roleData as any)?.permissions?.can_manage_loyalty)

  if (!canAddStamps) {
    return null
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Stamp
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
            <Star className="h-5 w-5" />
            Add Loyalty Stamp
          </DialogTitle>
          <DialogDescription>
            Add stamps to a customer's loyalty card. Stamps can be redeemed for rewards.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Customer Selection */}
            {!customerId && (
              <div className="space-y-2">
                <Label htmlFor="stampCustomer">
                  Customer *
                </Label>
                <Select
                  value={stampData.customer_id}
                  onValueChange={(value) => setStampData(prev => ({ ...prev, customer_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCustomers ? (
                      <SelectItem value="" disabled>Loading customers...</SelectItem>
                    ) : customers.length === 0 ? (
                      <SelectItem value="" disabled>No customers available</SelectItem>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {customer.total_stamps || 0} stamps • {customer.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Stamp Count */}
            <div className="space-y-2">
              <Label htmlFor="stampCount">
                Number of Stamps *
              </Label>
              <Input
                id="stampCount"
                type="number"
                min="1"
                max="10"
                value={stampData.stamp_count}
                onChange={(e) => setStampData(prev => ({ 
                  ...prev, 
                  stamp_count: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                placeholder="1"
                required
              />
              <p className="text-xs text-muted-foreground">
                How many stamps to add (1-10)
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="stampNotes">
                Notes
              </Label>
              <Textarea
                id="stampNotes"
                value={stampData.notes}
                onChange={(e) => setStampData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional: Purchase details, special occasion, etc."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add context about this stamp transaction
              </p>
            </div>

            {/* Current Date Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Stamp Date</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>

            {/* Location Context */}
            {role === 'location_staff' && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Your Location</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Stamp will be recorded for this location
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
              disabled={loading || !stampData.customer_id || stampData.stamp_count < 1}
            >
              {loading ? 'Adding...' : `Add ${stampData.stamp_count} Stamp${stampData.stamp_count > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
