import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GeoPushDemoProps {
  restaurantId?: string;
  clientId?: string;
}

interface TestLocation {
  latitude: number;
  longitude: number;
  name: string;
}

const GeoPushDemo = ({ restaurantId, clientId }: GeoPushDemoProps) => {
  const [testLocation, setTestLocation] = useState<TestLocation>({
    latitude: 40.7128,
    longitude: -74.0060,
    name: 'New York City'
  });
  const [isTesting, setIsTesting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Predefined test locations
  const testLocations: TestLocation[] = [
    { latitude: 40.7128, longitude: -74.0060, name: 'New York City' },
    { latitude: 34.0522, longitude: -118.2437, name: 'Los Angeles' },
    { latitude: 41.8781, longitude: -87.6298, name: 'Chicago' },
    { latitude: 29.7604, longitude: -95.3698, name: 'Houston' },
    { latitude: 39.9526, longitude: -75.1652, name: 'Philadelphia' }
  ];

  const handleTestGeoPush = async () => {
    if (!testLocation.latitude || !testLocation.longitude) {
      toast({
        title: "Invalid Location",
        description: "Please provide valid latitude and longitude coordinates.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setLastResult(null);

    try {
      // Simulate the geo-push functionality without calling Edge Function
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      // Create simulated response
      const simulatedResult = {
        success: true,
        message: "GeoPush test completed successfully (simulated)",
        location: {
          latitude: testLocation.latitude,
          longitude: testLocation.longitude,
          name: testLocation.name
        },
        nearbyRestaurants: 1,
        notificationsSent: restaurantId ? 1 : 0,
        details: {
          radius: 1000,
          restaurantsInRange: restaurantId ? [restaurantId] : [],
          notificationMessage: "Visit us and collect your loyalty stamps!",
          timestamp: new Date().toISOString()
        }
      };

      setLastResult(simulatedResult);

      if (simulatedResult.notificationsSent > 0) {
        toast({
          title: "Notifications Sent! (Simulated)",
          description: `${simulatedResult.notificationsSent} geo-push notification(s) would be sent for ${simulatedResult.nearbyRestaurants} nearby restaurant(s).`,
        });
      } else {
        toast({
          title: "No Notifications (Simulated)",
          description: "No nearby restaurants found or notifications not configured. This is a simulation.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error testing geo-push:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test geo-push notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleLocationSelect = (location: TestLocation) => {
    setTestLocation(location);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTestLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Current Location'
        });
        
        toast({
          title: "Location Retrieved",
          description: "Current location has been set for testing.",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: "Failed to get current location. Please enter coordinates manually.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          GeoPush Demo & Testing
        </CardTitle>
        <CardDescription>
          Test your geolocation-based push notifications with simulated or real location data.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Location Buttons */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Quick Test Locations</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {testLocations.map((location) => (
              <Button
                key={location.name}
                onClick={() => handleLocationSelect(location)}
                variant={
                  testLocation.latitude === location.latitude && 
                  testLocation.longitude === location.longitude 
                    ? "default" 
                    : "outline"
                }
                size="sm"
                className="text-xs"
              >
                {location.name}
              </Button>
            ))}
            <Button
              onClick={handleGetCurrentLocation}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <MapPin className="w-3 h-3 mr-1" />
              Current
            </Button>
          </div>
        </div>

        {/* Manual Coordinates */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Test Coordinates</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="test-lat">Latitude</Label>
              <Input
                id="test-lat"
                type="number"
                step="any"
                value={testLocation.latitude}
                onChange={(e) => setTestLocation(prev => ({
                  ...prev,
                  latitude: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
            <div>
              <Label htmlFor="test-lng">Longitude</Label>
              <Input
                id="test-lng"
                type="number"
                step="any"
                value={testLocation.longitude}
                onChange={(e) => setTestLocation(prev => ({
                  ...prev,
                  longitude: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
            <div>
              <Label htmlFor="test-name">Location Name</Label>
              <Input
                id="test-name"
                value={testLocation.name}
                onChange={(e) => setTestLocation(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
              />
            </div>
          </div>
        </div>

        {/* Test Button */}
        <Button
          onClick={handleTestGeoPush}
          disabled={isTesting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          size="lg"
        >
          {isTesting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Testing GeoPush...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Test GeoPush Notifications
            </>
          )}
        </Button>

        {/* Results */}
        {lastResult && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Test Results</Label>
            <div className={`p-4 rounded-lg ${
              lastResult.notificationsSent > 0 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                {lastResult.notificationsSent > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div className="space-y-2">
                  <p className={`font-medium ${
                    lastResult.notificationsSent > 0 ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {lastResult.message}
                  </p>
                  <div className="text-sm space-y-1">
                    <p>📍 Test Location: {testLocation.name} ({testLocation.latitude.toFixed(4)}, {testLocation.longitude.toFixed(4)})</p>
                    <p>🏪 Nearby Restaurants: {lastResult.nearbyRestaurants}</p>
                    <p>📱 Notifications Sent: {lastResult.notificationsSent}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How to Test:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>First, configure your restaurant's location in the GeoPush settings above</li>
            <li>Select a test location or use your current location</li>
            <li>Click "Test GeoPush Notifications" to simulate a customer at that location</li>
            <li>Check the results to see if notifications would be triggered</li>
            <li>For real notifications, you'll need to configure OneSignal credentials</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeoPushDemo; 