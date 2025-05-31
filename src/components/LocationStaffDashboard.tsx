import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  Users, 
  QrCode, 
  Gift, 
  MapPin, 
  Clock, 
  Phone, 
  Mail,
  Store,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface LocationInfo {
  id: string
  name: string
  address: string
  city: string
  state: string
  phone?: string
  email?: string
  stamps_required: number
  reward_description: string
  operating_hours?: any
}

interface LocationStats {
  total_customers: number
  stamps_today: number
  rewards_today: number
  recent_activity: Array<{
    customer_name: string
    action: 'stamp' | 'reward'
    time: string
  }>
}

interface LocationStaffDashboardProps {
  locationId: string
}

export default function LocationStaffDashboard({ locationId }: LocationStaffDashboardProps) {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadLocationData()
  }, [locationId])

  const loadLocationData = async () => {
    try {
      setLoading(true)
      
      // Simulate loading location data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulated location info
      const simulatedLocation: LocationInfo = {
        id: locationId,
        name: 'Downtown Location',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        phone: '+1 (555) 123-4567',
        email: 'downtown@restaurant.com',
        stamps_required: 10,
        reward_description: 'Free appetizer after 10 stamps',
        operating_hours: {
          monday: '9:00 AM - 10:00 PM',
          tuesday: '9:00 AM - 10:00 PM',
          wednesday: '9:00 AM - 10:00 PM',
          thursday: '9:00 AM - 10:00 PM',
          friday: '9:00 AM - 11:00 PM',
          saturday: '8:00 AM - 11:00 PM',
          sunday: '8:00 AM - 9:00 PM'
        }
      }
      
      // Simulated location stats
      const simulatedStats: LocationStats = {
        total_customers: 245,
        stamps_today: 23,
        rewards_today: 4,
        recent_activity: [
          { customer_name: 'John Smith', action: 'stamp', time: '2 minutes ago' },
          { customer_name: 'Sarah Johnson', action: 'reward', time: '15 minutes ago' },
          { customer_name: 'Mike Davis', action: 'stamp', time: '32 minutes ago' },
          { customer_name: 'Emily Brown', action: 'stamp', time: '1 hour ago' },
          { customer_name: 'David Wilson', action: 'stamp', time: '1 hour ago' }
        ]
      }
      
      setLocationInfo(simulatedLocation)
      setLocationStats(simulatedStats)
      
      toast({
        title: "Location Data Loaded",
        description: `Welcome to ${simulatedLocation.name}`,
      })
      
    } catch (error) {
      console.error('Error loading location data:', error)
      toast({
        title: "Error",
        description: "Failed to load location data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!locationInfo || !locationStats) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Location Not Found</CardTitle>
            <CardDescription className="text-red-600">
              Unable to load location data. Please contact your manager.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Location Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8 text-blue-600" />
            {locationInfo.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locationInfo.address}, {locationInfo.city}, {locationInfo.state}
          </p>
        </div>
        <Badge variant="outline" className="text-green-700 border-green-300">
          Location Staff Access
        </Badge>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locationStats.total_customers}</div>
            <p className="text-xs text-muted-foreground">Registered at this location</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stamps Today</CardTitle>
            <QrCode className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locationStats.stamps_today}</div>
            <p className="text-xs text-muted-foreground">Stamps issued today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Today</CardTitle>
            <Gift className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locationStats.rewards_today}</div>
            <p className="text-xs text-muted-foreground">Rewards redeemed today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{locationInfo.phone || 'No phone number'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{locationInfo.email || 'No email address'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <span>{locationInfo.stamps_required} stamps required for reward</span>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Reward Description:</p>
              <p className="text-sm text-muted-foreground">{locationInfo.reward_description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest customer interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationStats.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {activity.action === 'stamp' ? (
                      <QrCode className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Gift className="h-4 w-4 text-green-600" />
                    )}
                    <span className="font-medium text-sm">{activity.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={activity.action === 'stamp' ? 'secondary' : 'default'} className="text-xs">
                      {activity.action === 'stamp' ? 'Stamp' : 'Reward'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operating Hours */}
      {locationInfo.operating_hours && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Operating Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(locationInfo.operating_hours).map(([day, hours]) => (
                <div key={day} className="text-center p-2 rounded-lg bg-gray-50">
                  <div className="font-medium text-sm capitalize">{day}</div>
                  <div className="text-xs text-muted-foreground">{hours as string}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions for Staff */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for location staff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="w-full justify-start" size="lg">
              <QrCode className="w-5 h-5 mr-2" />
              Scan Customer QR Code
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Users className="w-5 h-5 mr-2" />
              Register New Customer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 