import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  usePOSOperations, 
  CustomerRegistrationRequest, 
  AddStampRequest, 
  RedeemRewardRequest, 
  CustomerLookupRequest,
  Customer 
} from '@/hooks/usePOSOperations'
import { 
  QrCode, 
  UserPlus, 
  Star, 
  Gift, 
  Search, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

const POSOperationsManager: React.FC = () => {
  const { registerCustomer, addStamp, redeemReward, lookupCustomer, isLoading } = usePOSOperations()
  
  // Current location (in real app, this would come from staff context)
  const currentLocationId = 'loc_1'
  const currentLocationName = 'Main Street Store'
  
  // Customer Registration State
  const [registrationQRCode, setRegistrationQRCode] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Add Stamp State
  const [stampCustomerId, setStampCustomerId] = useState('')
  const [stampsEarned, setStampsEarned] = useState(1)
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [stampNotes, setStampNotes] = useState('')
  
  // Redeem Reward State
  const [rewardCustomerId, setRewardCustomerId] = useState('')
  const [rewardType, setRewardType] = useState('')
  const [stampsToRedeem, setStampsToRedeem] = useState(10)
  
  // Customer Lookup State
  const [lookupQRCode, setLookupQRCode] = useState('')
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupEmail, setLookupEmail] = useState('')
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([])
  
  // Current customer context
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  const locations = [
    { id: 'loc_1', name: 'Main Street Store' },
    { id: 'loc_2', name: 'Mall Location' },
    { id: 'loc_3', name: 'Airport Branch' }
  ]

  const rewardTypes = [
    'Free Coffee',
    'Free Pastry',
    '$5 Off',
    '$10 Off',
    'Free Meal',
    'Buy One Get One'
  ]

  const handleCustomerRegistration = async () => {
    const request: CustomerRegistrationRequest = {
      location_id: currentLocationId,
      qr_code: registrationQRCode || undefined,
      customer_data: registrationQRCode ? undefined : {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      }
    }

    const result = await registerCustomer(request)
    
    if (result.success && result.customer) {
      setSelectedCustomer(result.customer)
      // Clear form
      setRegistrationQRCode('')
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
    }
  }

  const handleAddStamp = async () => {
    if (!selectedCustomer && !stampCustomerId) {
      return
    }

    const request: AddStampRequest = {
      customer_id: selectedCustomer?.id || stampCustomerId,
      location_id: currentLocationId,
      stamps_earned: stampsEarned,
      amount: purchaseAmount ? parseFloat(purchaseAmount) : undefined,
      notes: stampNotes || undefined
    }

    const result = await addStamp(request)
    
    if (result.success) {
      // Clear form
      setStampCustomerId('')
      setStampsEarned(1)
      setPurchaseAmount('')
      setStampNotes('')
    }
  }

  const handleRedeemReward = async () => {
    if (!selectedCustomer && !rewardCustomerId) {
      return
    }

    const request: RedeemRewardRequest = {
      customer_id: selectedCustomer?.id || rewardCustomerId,
      location_id: currentLocationId,
      reward_type: rewardType,
      stamps_to_redeem: stampsToRedeem
    }

    const result = await redeemReward(request)
    
    if (result.success) {
      // Clear form
      setRewardCustomerId('')
      setRewardType('')
      setStampsToRedeem(10)
    }
  }

  const handleCustomerLookup = async () => {
    const request: CustomerLookupRequest = {
      location_id: currentLocationId,
      qr_code: lookupQRCode || undefined,
      phone: lookupPhone || undefined,
      email: lookupEmail || undefined
    }

    const result = await lookupCustomer(request)
    
    if (result.success && result.customers) {
      setFoundCustomers(result.customers)
    } else {
      setFoundCustomers([])
    }
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setStampCustomerId(customer.id)
    setRewardCustomerId(customer.id)
  }

  const clearCustomerSelection = () => {
    setSelectedCustomer(null)
    setStampCustomerId('')
    setRewardCustomerId('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">POS Operations</h2>
          <p className="text-muted-foreground">
            Manage customer registrations, stamps, and rewards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {currentLocationName}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            POS Terminal
          </Badge>
        </div>
      </div>

      {/* Selected Customer Context */}
      {selectedCustomer && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Selected Customer
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearCustomerSelection}>
                Clear Selection
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-green-700">Name</Label>
                <p className="font-medium text-green-800">{selectedCustomer.name}</p>
              </div>
              <div>
                <Label className="text-xs text-green-700">Email</Label>
                <p className="text-sm text-green-700">{selectedCustomer.email}</p>
              </div>
              <div>
                <Label className="text-xs text-green-700">Total Stamps</Label>
                <p className="font-medium text-green-800">{selectedCustomer.total_stamps}</p>
              </div>
              <div>
                <Label className="text-xs text-green-700">Total Rewards</Label>
                <p className="font-medium text-green-800">{selectedCustomer.total_rewards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lookup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lookup" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Customer Lookup
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Register
          </TabsTrigger>
          <TabsTrigger value="stamps" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Add Stamps
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Redeem Reward
          </TabsTrigger>
        </TabsList>

        {/* Customer Lookup Tab */}
        <TabsContent value="lookup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Customer Lookup
              </CardTitle>
              <CardDescription>
                Find existing customers by QR code, phone, or email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lookup-qr">QR Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lookup-qr"
                      placeholder="Scan or enter QR code"
                      value={lookupQRCode}
                      onChange={(e) => setLookupQRCode(e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lookup-phone">Phone Number</Label>
                  <Input
                    id="lookup-phone"
                    placeholder="+1-555-0123"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lookup-email">Email Address</Label>
                  <Input
                    id="lookup-email"
                    type="email"
                    placeholder="customer@example.com"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCustomerLookup}
                disabled={isLoading || (!lookupQRCode && !lookupPhone && !lookupEmail)}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Customer
                  </>
                )}
              </Button>

              {foundCustomers.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <h4 className="font-medium">Search Results</h4>
                  {foundCustomers.map((customer) => (
                    <Card key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => selectCustomer(customer)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{customer.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{customer.total_stamps} stamps</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {customer.total_rewards} rewards redeemed
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Registration Tab */}
        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Customer Registration
              </CardTitle>
              <CardDescription>
                Register new customers or scan existing QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-qr">QR Code (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="reg-qr"
                    placeholder="Scan customer QR code or leave empty for new customer"
                    value={registrationQRCode}
                    onChange={(e) => setRegistrationQRCode(e.target.value)}
                  />
                  <Button variant="outline" size="icon">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!registrationQRCode && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">New Customer Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer-name">Full Name *</Label>
                        <Input
                          id="customer-name"
                          placeholder="John Doe"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customer-phone">Phone Number *</Label>
                        <Input
                          id="customer-phone"
                          placeholder="+1-555-0123"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customer-email">Email Address *</Label>
                      <Input
                        id="customer-email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <Button 
                onClick={handleCustomerRegistration}
                disabled={isLoading || (!registrationQRCode && (!customerName || !customerEmail || !customerPhone))}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Customer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Stamps Tab */}
        <TabsContent value="stamps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Add Stamps
              </CardTitle>
              <CardDescription>
                Award loyalty stamps for customer purchases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCustomer && (
                <div className="space-y-2">
                  <Label htmlFor="stamp-customer-id">Customer ID</Label>
                  <Input
                    id="stamp-customer-id"
                    placeholder="Enter customer ID or select from lookup"
                    value={stampCustomerId}
                    onChange={(e) => setStampCustomerId(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stamps-earned">Stamps to Award *</Label>
                  <Select value={stampsEarned.toString()} onValueChange={(value) => setStampsEarned(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} stamp{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purchase-amount">Purchase Amount (Optional)</Label>
                  <Input
                    id="purchase-amount"
                    type="number"
                    step="0.01"
                    placeholder="25.99"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stamp-notes">Notes (Optional)</Label>
                <Textarea
                  id="stamp-notes"
                  placeholder="Additional notes about this transaction..."
                  value={stampNotes}
                  onChange={(e) => setStampNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleAddStamp}
                disabled={isLoading || (!selectedCustomer && !stampCustomerId)}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Stamps...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add {stampsEarned} Stamp{stampsEarned > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redeem Reward Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Redeem Reward
              </CardTitle>
              <CardDescription>
                Process reward redemptions for customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCustomer && (
                <div className="space-y-2">
                  <Label htmlFor="reward-customer-id">Customer ID</Label>
                  <Input
                    id="reward-customer-id"
                    placeholder="Enter customer ID or select from lookup"
                    value={rewardCustomerId}
                    onChange={(e) => setRewardCustomerId(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward-type">Reward Type *</Label>
                  <Select value={rewardType} onValueChange={setRewardType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reward type" />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stamps-to-redeem">Stamps to Redeem</Label>
                  <Select value={stampsToRedeem.toString()} onValueChange={(value) => setStampsToRedeem(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 stamps (Standard Reward)</SelectItem>
                      <SelectItem value="20">20 stamps (Premium Reward)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure the customer has enough stamps before processing the redemption.
                  Standard rewards require 10 stamps, premium rewards require 20 stamps.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleRedeemReward}
                disabled={isLoading || (!selectedCustomer && !rewardCustomerId) || !rewardType}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Redemption...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Redeem {rewardType} ({stampsToRedeem} stamps)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default POSOperationsManager 