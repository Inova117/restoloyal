import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  QrCode, 
  Users, 
  Gift, 
  Search, 
  Plus,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  qr_code: string
  stamps: number
  stamps_required: number
  last_visit: string
  total_visits: number
}

interface RecentTransaction {
  id: string
  customer_name: string
  action: 'stamp' | 'reward'
  time: string
  stamps_before?: number
  stamps_after?: number
}

export default function POSInterface() {
  const [qrInput, setQrInput] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Simulated customer database
  const [customers] = useState<Customer[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@email.com',
      phone: '+1 (555) 123-4567',
      qr_code: 'QR1234567890',
      stamps: 8,
      stamps_required: 10,
      last_visit: '2024-01-15',
      total_visits: 12
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      phone: '+1 (555) 234-5678',
      qr_code: 'QR2345678901',
      stamps: 10,
      stamps_required: 10,
      last_visit: '2024-01-14',
      total_visits: 8
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike@email.com',
      phone: '+1 (555) 345-6789',
      qr_code: 'QR3456789012',
      stamps: 3,
      stamps_required: 10,
      last_visit: '2024-01-13',
      total_visits: 5
    }
  ])

  useEffect(() => {
    // Load recent transactions
    setRecentTransactions([
      { id: '1', customer_name: 'Alice Brown', action: 'stamp', time: '5 minutes ago', stamps_before: 7, stamps_after: 8 },
      { id: '2', customer_name: 'Bob Wilson', action: 'reward', time: '12 minutes ago', stamps_before: 10, stamps_after: 0 },
      { id: '3', customer_name: 'Carol Lee', action: 'stamp', time: '25 minutes ago', stamps_before: 4, stamps_after: 5 }
    ])
  }, [])

  const handleQRScan = () => {
    if (!qrInput.trim()) {
      toast({
        title: "Invalid QR Code",
        description: "Please enter a QR code",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    // Simulate QR lookup
    setTimeout(() => {
      const customer = customers.find(c => c.qr_code === qrInput.trim())
      if (customer) {
        setCurrentCustomer(customer)
        setQrInput('')
        toast({
          title: "Customer Found",
          description: `Welcome back, ${customer.name}!`
        })
      } else {
        toast({
          title: "Customer Not Found",
          description: "QR code not recognized. Please register the customer first.",
          variant: "destructive"
        })
      }
      setLoading(false)
    }, 1000)
  }

  const handleCustomerSearch = () => {
    if (!searchInput.trim()) return

    setLoading(true)
    
    // Simulate customer search
    setTimeout(() => {
      const customer = customers.find(c => 
        c.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        c.email.toLowerCase().includes(searchInput.toLowerCase()) ||
        c.phone.includes(searchInput)
      )
      
      if (customer) {
        setCurrentCustomer(customer)
        setSearchInput('')
        toast({
          title: "Customer Found",
          description: `Found ${customer.name}`
        })
      } else {
        toast({
          title: "Customer Not Found",
          description: "No customer found with that information",
          variant: "destructive"
        })
      }
      setLoading(false)
    }, 800)
  }

  const handleAddStamp = () => {
    if (!currentCustomer) return

    const newStamps = currentCustomer.stamps + 1
    const updatedCustomer = { ...currentCustomer, stamps: newStamps }
    setCurrentCustomer(updatedCustomer)

    // Add to recent transactions
    const newTransaction: RecentTransaction = {
      id: Date.now().toString(),
      customer_name: currentCustomer.name,
      action: 'stamp',
      time: 'Just now',
      stamps_before: currentCustomer.stamps,
      stamps_after: newStamps
    }
    setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)])

    toast({
      title: "Stamp Added",
      description: `${currentCustomer.name} now has ${newStamps} stamps`,
    })
  }

  const handleRedeemReward = () => {
    if (!currentCustomer || currentCustomer.stamps < currentCustomer.stamps_required) return

    const updatedCustomer = { ...currentCustomer, stamps: 0 }
    setCurrentCustomer(updatedCustomer)

    // Add to recent transactions
    const newTransaction: RecentTransaction = {
      id: Date.now().toString(),
      customer_name: currentCustomer.name,
      action: 'reward',
      time: 'Just now',
      stamps_before: currentCustomer.stamps,
      stamps_after: 0
    }
    setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)])

    toast({
      title: "Reward Redeemed",
      description: `${currentCustomer.name} redeemed their reward!`,
    })
  }

  const getStampProgress = (stamps: number, required: number) => {
    return Math.min((stamps / required) * 100, 100)
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Point of Sale</h1>
        <p className="text-gray-600">Downtown Location - Loyalty Management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Lookup Section */}
        <div className="space-y-6">
          {/* QR Code Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>Scan or enter customer QR code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter QR code (e.g., QR1234567890)"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQRScan()}
                />
                <Button onClick={handleQRScan} disabled={loading}>
                  {loading ? 'Scanning...' : 'Scan'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Try: QR1234567890, QR2345678901, or QR3456789012
              </p>
            </CardContent>
          </Card>

          {/* Customer Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-green-600" />
                Customer Search
              </CardTitle>
              <CardDescription>Search by name, email, or phone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search customer..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                />
                <Button onClick={handleCustomerSearch} disabled={loading} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      {transaction.action === 'stamp' ? (
                        <QrCode className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Gift className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-medium text-sm">{transaction.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.action === 'stamp' ? 'secondary' : 'default'} className="text-xs">
                        {transaction.action === 'stamp' ? 'Stamp' : 'Reward'}
                      </Badge>
                      <span className="text-xs text-gray-500">{transaction.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Information & Actions */}
        <div className="space-y-6">
          {currentCustomer ? (
            <>
              {/* Customer Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{currentCustomer.name}</h3>
                    <p className="text-gray-600">{currentCustomer.email}</p>
                    <p className="text-gray-600">{currentCustomer.phone}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>QR: {currentCustomer.qr_code}</span>
                    <span>Visits: {currentCustomer.total_visits}</span>
                    <span>Last: {currentCustomer.last_visit}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Loyalty Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Loyalty Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">
                      {currentCustomer.stamps} / {currentCustomer.stamps_required} stamps
                    </span>
                    {currentCustomer.stamps >= currentCustomer.stamps_required ? (
                      <Badge className="bg-green-600 text-white">
                        <Gift className="h-3 w-3 mr-1" />
                        Reward Ready!
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {currentCustomer.stamps_required - currentCustomer.stamps} more needed
                      </Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getStampProgress(currentCustomer.stamps, currentCustomer.stamps_required)}%` }}
                    ></div>
                  </div>

                  {/* Stamp Circles */}
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: currentCustomer.stamps_required }, (_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          i < currentCustomer.stamps
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}
                      >
                        {i < currentCustomer.stamps ? '✓' : i + 1}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleAddStamp}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Stamp
                  </Button>
                  
                  <Button 
                    onClick={handleRedeemReward}
                    disabled={currentCustomer.stamps < currentCustomer.stamps_required}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
                    size="lg"
                  >
                    <Gift className="h-5 w-5 mr-2" />
                    Redeem Reward
                  </Button>

                  <Button 
                    onClick={() => setCurrentCustomer(null)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Clear Customer
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            /* No Customer Selected */
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No Customer Selected</h3>
                <p className="text-gray-500">Scan a QR code or search for a customer to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 