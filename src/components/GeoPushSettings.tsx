import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MapPin, Bell, Save, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import GeoPushDemo from './GeoPushDemo';

interface GeoPushSettingsProps {
  restaurantId?: string;
}

interface LocationSettings {
  latitude: number | null;
  longitude: number | null;
  notification_radius: number;
  notification_message: string;
  geo_notifications_enabled: boolean;
}

const GeoPushSettings = ({ restaurantId }: GeoPushSettingsProps) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<LocationSettings>({
    latitude: null,
    longitude: null,
    notification_radius: 500,
    notification_message: '',
    geo_notifications_enabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchSettings();
    }
  }, [restaurantId]);

  const fetchSettings = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('latitude, longitude, notification_radius, notification_message, geo_notifications_enabled')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;

      setSettings({
        latitude: data.latitude,
        longitude: data.longitude,
        notification_radius: data.notification_radius || 500,
        notification_message: data.notification_message || '',
        geo_notifications_enabled: data.geo_notifications_enabled ?? true
      });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load geolocation settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        
        toast({
          title: "Location Retrieved",
          description: "Current location has been set successfully.",
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: "Failed to get current location. Please enter coordinates manually.",
          variant: "destructive",
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSave = async () => {
    if (!restaurantId || !user) return;

    // Validate required fields
    if (!settings.latitude || !settings.longitude) {
      toast({
        title: "Missing Location",
        description: "Please set your restaurant's location coordinates.",
        variant: "destructive",
      });
      return;
    }

    if (settings.notification_radius < 50 || settings.notification_radius > 5000) {
      toast({
        title: "Invalid Radius",
        description: "Notification radius must be between 50 and 5000 meters.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          latitude: settings.latitude,
          longitude: settings.longitude,
          notification_radius: settings.notification_radius,
          notification_message: settings.notification_message,
          geo_notifications_enabled: settings.geo_notifications_enabled
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Geolocation settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof LocationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Geolocation Push Notifications
          </CardTitle>
          <CardDescription>
            Configure location-based notifications to engage customers when they're nearby your restaurant.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <Label className="text-base font-medium">Enable Geo-Push Notifications</Label>
                <p className="text-sm text-gray-600">Send notifications when customers are near your restaurant</p>
              </div>
            </div>
            <Switch
              checked={settings.geo_notifications_enabled}
              onCheckedChange={(checked) => handleInputChange('geo_notifications_enabled', checked)}
            />
          </div>

          {/* Location Coordinates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Restaurant Location</Label>
              <Button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                variant="outline"
                size="sm"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Current Location
                  </>
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="40.7128"
                  value={settings.latitude || ''}
                  onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || null)}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="-74.0060"
                  value={settings.longitude || ''}
                  onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || null)}
                />
              </div>
            </div>
            
            {settings.latitude && settings.longitude && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  📍 Location set: {settings.latitude.toFixed(6)}, {settings.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Notification Radius */}
          <div className="space-y-2">
            <Label htmlFor="radius">Notification Radius (meters)</Label>
            <Input
              id="radius"
              type="number"
              min="50"
              max="5000"
              value={settings.notification_radius}
              onChange={(e) => handleInputChange('notification_radius', parseInt(e.target.value) || 500)}
            />
            <p className="text-sm text-gray-600">
              Customers within this radius will receive notifications (50-5000 meters)
            </p>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom Notification Message</Label>
            <Textarea
              id="message"
              placeholder="You're near [Restaurant Name]! Come collect your loyalty stamps."
              value={settings.notification_message}
              onChange={(e) => handleInputChange('notification_message', e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-600">
              Leave empty to use the default message. [Restaurant Name] will be automatically replaced.
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">OneSignal Setup Required</p>
              <p className="text-amber-700">
                To use geo-push notifications, you need to configure OneSignal with your app credentials.
                Contact support for setup assistance.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !settings.latitude || !settings.longitude}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Geolocation Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Demo Component */}
      <GeoPushDemo restaurantId={restaurantId} />
    </div>
  );
};

export default GeoPushSettings; 