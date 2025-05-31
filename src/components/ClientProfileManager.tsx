import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Building2, Mail, Phone, MapPin, Palette } from 'lucide-react'
import { useClientProfile, useCurrentClientId } from '@/hooks/useClientProfile'

export function ClientProfileManager() {
  const { clientId, loading: clientIdLoading } = useCurrentClientId()
  const { profile, loading, error, updateProfile, refetch } = useClientProfile(clientId || undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    logo: '',
    theme: {
      primary_color: '#3B82F6',
      secondary_color: '#10B981',
      accent_color: '#F59E0B'
    },
    billing_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  })

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        logo: profile.logo || '',
        theme: profile.theme || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B'
        },
        billing_address: profile.billing_address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        }
      })
    }
  }, [profile])

  const handleSave = async () => {
    if (!clientId) return

    const success = await updateProfile(formData)
    if (success) {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        logo: profile.logo || '',
        theme: profile.theme || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B'
        },
        billing_address: profile.billing_address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        }
      })
    }
    setIsEditing(false)
  }

  if (clientIdLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading client information...</span>
      </div>
    )
  }

  if (!clientId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Client Access</h3>
          <p className="text-gray-600">
            You don't have client admin access. Please contact support if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <h3 className="text-lg font-semibold mb-2">Error Loading Profile</h3>
            <p>{error}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
          <p className="text-gray-600">
            Unable to load your brand profile. Please contact support.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Profile</h1>
          <p className="text-gray-600">Manage your restaurant brand information</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
            {profile.status}
          </Badge>
          <Badge variant="outline">
            {profile.plan}
          </Badge>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                disabled={!isEditing}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                disabled={!isEditing}
                placeholder="contact@brand.com"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  value={formData.theme.primary_color}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    theme: { ...formData.theme, primary_color: e.target.value }
                  })}
                  disabled={!isEditing}
                  placeholder="#3B82F6"
                />
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: formData.theme.primary_color }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  value={formData.theme.secondary_color}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    theme: { ...formData.theme, secondary_color: e.target.value }
                  })}
                  disabled={!isEditing}
                  placeholder="#10B981"
                />
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: formData.theme.secondary_color }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="accent_color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent_color"
                  value={formData.theme.accent_color}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    theme: { ...formData.theme, accent_color: e.target.value }
                  })}
                  disabled={!isEditing}
                  placeholder="#F59E0B"
                />
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: formData.theme.accent_color }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Billing Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.billing_address.street}
              onChange={(e) => setFormData({ 
                ...formData, 
                billing_address: { ...formData.billing_address, street: e.target.value }
              })}
              disabled={!isEditing}
              placeholder="123 Main Street"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.billing_address.city}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  billing_address: { ...formData.billing_address, city: e.target.value }
                })}
                disabled={!isEditing}
                placeholder="New York"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.billing_address.state}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  billing_address: { ...formData.billing_address, state: e.target.value }
                })}
                disabled={!isEditing}
                placeholder="NY"
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.billing_address.zip}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  billing_address: { ...formData.billing_address, zip: e.target.value }
                })}
                disabled={!isEditing}
                placeholder="10001"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.billing_address.country}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  billing_address: { ...formData.billing_address, country: e.target.value }
                })}
                disabled={!isEditing}
                placeholder="USA"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  )
} 