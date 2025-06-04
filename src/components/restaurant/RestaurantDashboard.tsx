// ============================================================================
// RESTAURANT DASHBOARD
// Restaurant Loyalty Platform - Restaurant Management Dashboard
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  RefreshCw,
  Edit,
  Trash2,
  BarChart3,
  Settings,
  Phone,
  Mail,
  Globe,
  Star
} from 'lucide-react';
import { useRestaurantManagement } from '@/hooks/platform/useRestaurantManagement';
import { MetricsCard } from '@/components/platform/shared/MetricsCard';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import type { RestaurantData, LocationData, StaffMemberData } from '@/services/platform';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface RestaurantDashboardProps {
  className?: string;
  clientId?: string;
  onCreateRestaurant?: () => void;
  onEditRestaurant?: (restaurant: RestaurantData) => void;
  onCreateLocation?: (restaurantId: string) => void;
  onCreateStaffMember?: (restaurantId: string) => void;
}

// ============================================================================
// RESTAURANT CARD COMPONENT
// ============================================================================

interface RestaurantCardProps {
  restaurant: RestaurantData;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-soft-emerald-50 text-soft-emerald-700 border-soft-emerald-100';
      case 'inactive': return 'bg-sage-100 text-sage-600 border-sage-200';
      case 'pending': return 'bg-soft-amber-50 text-soft-amber-700 border-soft-amber-100';
      default: return 'bg-sage-100 text-sage-600 border-sage-200';
    }
  };

  return (
    <div 
      className={cn(
        'group cursor-pointer transition-all duration-300 ease-out',
        'p-1 rounded-xl hover:bg-sage-turquoise-50/30',
        isSelected && 'bg-sage-turquoise-50/50'
      )}
      onClick={onSelect}
    >
      <Card className={cn(
        'border-0 shadow-sm hover:shadow-md transition-all duration-300',
        'bg-white/80 backdrop-blur-sm',
        isSelected && 'ring-2 ring-sage-turquoise-200 shadow-lg bg-white'
      )}>
        <CardHeader className="pb-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <CardTitle className="text-lg font-editorial leading-tight flex items-center gap-3">
                <div className="p-2 bg-sage-turquoise-100 rounded-xl group-hover:bg-sage-turquoise-200 transition-colors">
                  <Building className="h-4 w-4 text-sage-turquoise-600" />
                </div>
                {restaurant.name}
              </CardTitle>
              {restaurant.description && (
                <CardDescription className="text-sage-600 leading-relaxed">
                  {restaurant.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge 
                status={restaurant.status as any} 
                label={restaurant.status.charAt(0).toUpperCase() + restaurant.status.slice(1)}
                size="sm"
                className={cn(
                  'text-xs font-medium border rounded-full px-2.5 py-1',
                  getStatusColor(restaurant.status)
                )}
              />
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-sage-turquoise-100"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-soft-rose-100 hover:text-soft-rose-600"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Restaurant Details */}
          <div className="space-y-3">
            {restaurant.cuisine_type && (
              <div className="flex items-center gap-2 text-sm text-sage-600">
                <Star className="h-3 w-3 text-soft-amber-500" />
                <span>{restaurant.cuisine_type}</span>
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center gap-2 text-sm text-sage-600">
                <Phone className="h-3 w-3" />
                <span>{restaurant.phone}</span>
              </div>
            )}
            {restaurant.email && (
              <div className="flex items-center gap-2 text-sm text-sage-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{restaurant.email}</span>
              </div>
            )}
            {restaurant.website && (
              <div className="flex items-center gap-2 text-sm text-sage-600">
                <Globe className="h-3 w-3" />
                <span className="truncate">{restaurant.website}</span>
              </div>
            )}
          </div>

          {/* Loyalty Program */}
          <div className="bg-gradient-to-br from-sage-turquoise-50 to-sage-turquoise-100/50 p-4 rounded-xl border border-sage-turquoise-100">
            <h4 className="font-editorial font-medium text-sm text-sage-turquoise-800 mb-3">Loyalty Program</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-sage-turquoise-600 font-medium">Stamps Required:</span>
                <div className="font-semibold text-sage-turquoise-800">{restaurant.loyalty_program.stamps_to_reward}</div>
              </div>
              <div className="space-y-1">
                <span className="text-sage-turquoise-600 font-medium">Stamp Value:</span>
                <div className="font-semibold text-sage-turquoise-800">${restaurant.loyalty_program.stamp_value}</div>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="text-sage-turquoise-600 font-medium">Reward:</span>
                <div className="font-semibold text-sage-turquoise-800 leading-relaxed">{restaurant.loyalty_program.reward_description}</div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-sage-50 rounded-xl hover:bg-sage-100 transition-colors">
              <div className="text-lg font-editorial font-bold text-sage-800">{restaurant.total_customers.toLocaleString()}</div>
              <div className="text-xs text-sage-600 mt-1">Customers</div>
            </div>
            <div className="text-center p-3 bg-sage-50 rounded-xl hover:bg-sage-100 transition-colors">
              <div className="text-lg font-editorial font-bold text-sage-800">${restaurant.monthly_revenue.toLocaleString()}</div>
              <div className="text-xs text-sage-600 mt-1">Monthly Revenue</div>
            </div>
            <div className="text-center p-3 bg-sage-50 rounded-xl hover:bg-sage-100 transition-colors">
              <div className="text-lg font-editorial font-bold text-sage-800">{restaurant.locations_count}</div>
              <div className="text-xs text-sage-600 mt-1">Locations</div>
            </div>
            <div className="text-center p-3 bg-sage-50 rounded-xl hover:bg-sage-100 transition-colors">
              <div className="text-lg font-editorial font-bold text-sage-800">{restaurant.staff_count}</div>
              <div className="text-xs text-sage-600 mt-1">Staff</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// LOCATION ITEM COMPONENT
// ============================================================================

interface LocationItemProps {
  location: LocationData;
}

const LocationItem: React.FC<LocationItemProps> = ({ location }) => {
  return (
    <div className="group p-4 bg-gradient-to-r from-white to-sage-50 rounded-xl border border-sage-100 hover:border-sage-turquoise-200 hover:shadow-sm transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-sage-turquoise-100 rounded-xl group-hover:bg-sage-turquoise-200 transition-colors">
          <MapPin className="h-4 w-4 text-sage-turquoise-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-editorial font-medium text-sage-800">{location.name}</h4>
          <p className="text-sm text-sage-600 leading-relaxed">{location.address}, {location.city}</p>
          {location.phone && (
            <div className="flex items-center gap-2 text-xs text-sage-500">
              <Phone className="h-3 w-3" />
              <span>{location.phone}</span>
            </div>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STAFF ITEM COMPONENT
// ============================================================================

interface StaffItemProps {
  staff: StaffMemberData;
}

const StaffItem: React.FC<StaffItemProps> = ({ staff }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-sage-turquoise-50 text-sage-turquoise-700 border-sage-turquoise-200';
      case 'staff': return 'bg-soft-emerald-50 text-soft-emerald-700 border-soft-emerald-200';
      case 'cashier': return 'bg-soft-amber-50 text-soft-amber-700 border-soft-amber-200';
      default: return 'bg-sage-50 text-sage-600 border-sage-200';
    }
  };

  return (
    <div className="group p-4 bg-gradient-to-r from-white to-sage-50 rounded-xl border border-sage-100 hover:border-sage-turquoise-200 hover:shadow-sm transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-sage-100 rounded-xl group-hover:bg-sage-200 transition-colors">
          <Users className="h-4 w-4 text-sage-600" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h4 className="font-editorial font-medium text-sage-800">{staff.name}</h4>
            <Badge className={cn(
              'text-xs font-medium border rounded-full px-2.5 py-1',
              getRoleColor(staff.role)
            )}>
              {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
            </Badge>
          </div>
          {staff.email && (
            <div className="flex items-center gap-2 text-xs text-sage-500">
              <Mail className="h-3 w-3" />
              <span>{staff.email}</span>
            </div>
          )}
          {staff.phone && (
            <div className="flex items-center gap-2 text-xs text-sage-500">
              <Phone className="h-3 w-3" />
              <span>{staff.phone}</span>
            </div>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN RESTAURANT DASHBOARD COMPONENT
// ============================================================================

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({
  className,
  clientId,
  onCreateRestaurant,
  onEditRestaurant,
  onCreateLocation,
  onCreateStaffMember
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { 
    restaurants, 
    locations, 
    staff, 
    loading, 
    deleteRestaurant,
    selectRestaurant 
  } = useRestaurantManagement({
    clientId,
    autoLoad: true,
    refreshInterval: 30000
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    // Refresh is handled automatically by the hook
  };

  const handleDeleteRestaurant = async (restaurant: RestaurantData) => {
    if (confirm(`Are you sure you want to delete "${restaurant.name}"?`)) {
      await deleteRestaurant(restaurant.id);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const restaurantCount = restaurants.length;

  return (
    <SectionErrorBoundary name="Restaurant Dashboard">
      <div className={cn('min-h-screen bg-gradient-to-br from-sage-50 via-white to-sage-turquoise-50/30', className)}>
        <div className="container-editorial section-editorial-sm">
          
          {/* Dashboard Header */}
          <div className="dashboard-header slide-in-left">
            <div className="dashboard-header-title">
              <div className="p-4 bg-sage-turquoise-100 rounded-2xl hover-glow">
                <Building className="w-10 h-10 text-sage-turquoise-600 icon-bounce" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl lg:text-5xl font-editorial font-bold text-balance">Restaurant Management</h1>
                <p className="text-muted-foreground text-xl leading-relaxed">Manage restaurants, locations, and staff for your loyalty program</p>
              </div>
            </div>
            <div className="dashboard-header-actions slide-in-right">
              <Button 
                variant="outline" 
                effect="lift"
                onClick={handleRefresh} 
                disabled={loading}
                className="space-x-2"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                <span>Refresh</span>
              </Button>
              <Button 
                variant="sage" 
                effect="glow" 
                onClick={onCreateRestaurant}
                className="space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Restaurant</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="stats-grid stagger-fade-in">
            <MetricsCard
              title="Total Restaurants"
              value={restaurantCount}
              description="Active restaurants"
              icon={Building}
              loading={loading}
              status="positive"
              size="sm"
              variant="compact"
              className="border-l-4 border-l-sage-turquoise-500"
            />
            <MetricsCard
              title="Total Locations"
              value={restaurants.reduce((sum, r) => sum + r.locations_count, 0)}
              description="All locations"
              icon={MapPin}
              loading={loading}
              status="positive"
              size="sm"
              variant="compact"
              className="border-l-4 border-l-soft-emerald-500"
            />
            <MetricsCard
              title="Total Staff"
              value={restaurants.reduce((sum, r) => sum + r.staff_count, 0)}
              description="All staff members"
              icon={Users}
              loading={loading}
              status="positive"
              size="sm"
              variant="compact"
              className="border-l-4 border-l-soft-amber-500"
            />
            <MetricsCard
              title="Total Customers"
              value={restaurants.reduce((sum, r) => sum + r.total_customers, 0)}
              description="Across all restaurants"
              icon={BarChart3}
              loading={loading}
              status="positive"
              size="sm"
              variant="compact"
              className="border-l-4 border-l-soft-rose-400"
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 content-section">
            {/* Restaurants List */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="flex items-center gap-3 text-xl font-editorial">
                      <div className="p-2 bg-sage-turquoise-100 rounded-xl">
                        <Building className="h-5 w-5 text-sage-turquoise-600" />
                      </div>
                      Restaurants ({filteredRestaurants.length})
                    </CardTitle>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sage-400" />
                    <Input
                      placeholder="Search restaurants..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-10 border-sage-200 focus:border-sage-turquoise-300 focus:ring-sage-turquoise-200"
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  {loading && restaurants.length === 0 ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-sage-100 rounded-xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : filteredRestaurants.length > 0 ? (
                    <div className="space-y-4">
                      {filteredRestaurants.map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.id}
                          restaurant={restaurant}
                          isSelected={selectedRestaurant?.id === restaurant.id}
                          onSelect={() => selectRestaurant(restaurant)}
                          onEdit={() => onEditRestaurant?.(restaurant)}
                          onDelete={() => handleDeleteRestaurant(restaurant)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-6 bg-sage-100 rounded-2xl w-fit mx-auto mb-6">
                        <Building className="h-12 w-12 text-sage-400 mx-auto" />
                      </div>
                      <h3 className="text-lg font-editorial font-medium text-sage-800 mb-2">No Restaurants Found</h3>
                      <p className="text-sage-600 mb-6 leading-relaxed max-w-sm mx-auto">
                        {searchTerm ? 'No restaurants match your search criteria.' : 'Start by adding your first restaurant to begin.'}
                      </p>
                      {!searchTerm && (
                        <Button variant="sage" effect="glow" onClick={onCreateRestaurant} className="space-x-2">
                          <Plus className="h-4 w-4" />
                          <span>Add Restaurant</span>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Restaurant Details */}
            <div className="lg:col-span-2">
              {selectedRestaurant ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-sage-50 p-1 rounded-xl">
                    <TabsTrigger 
                      value="overview" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="locations" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                      Locations ({locations.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="staff" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                      Staff ({staff.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-6 tab-content-enter">
                    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl font-editorial">
                          <div className="p-2 bg-sage-turquoise-100 rounded-xl">
                            <Building className="h-5 w-5 text-sage-turquoise-600" />
                          </div>
                          {selectedRestaurant.name}
                        </CardTitle>
                        <CardDescription className="text-sage-600 leading-relaxed">
                          Restaurant overview and key metrics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-16">
                          <div className="p-6 bg-sage-100 rounded-2xl w-fit mx-auto mb-6">
                            <BarChart3 className="h-12 w-12 text-sage-400 mx-auto" />
                          </div>
                          <h3 className="text-lg font-editorial font-medium text-sage-800 mb-2">Analytics Coming Soon</h3>
                          <p className="text-sage-600 leading-relaxed max-w-sm mx-auto">
                            Detailed analytics and insights will be displayed here.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Locations Tab */}
                  <TabsContent value="locations" className="mt-6 tab-content-enter">
                    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3 text-xl font-editorial">
                            <div className="p-2 bg-sage-turquoise-100 rounded-xl">
                              <MapPin className="h-5 w-5 text-sage-turquoise-600" />
                            </div>
                            Locations ({locations.length})
                          </CardTitle>
                          <Button 
                            variant="sage" 
                            effect="glow" 
                            onClick={() => onCreateLocation?.(selectedRestaurant.id)}
                            className="space-x-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Location</span>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {locations.length > 0 ? (
                          <div className="space-y-4">
                            {locations.map((location) => (
                              <LocationItem key={location.id} location={location} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <div className="p-6 bg-sage-100 rounded-2xl w-fit mx-auto mb-6">
                              <MapPin className="h-12 w-12 text-sage-400 mx-auto" />
                            </div>
                            <h3 className="text-lg font-editorial font-medium text-sage-800 mb-2">No Locations</h3>
                            <p className="text-sage-600 mb-6 leading-relaxed max-w-sm mx-auto">
                              Add your first location to start managing multiple restaurant sites.
                            </p>
                            <Button 
                              variant="sage" 
                              effect="glow" 
                              onClick={() => onCreateLocation?.(selectedRestaurant.id)}
                              className="space-x-2"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Add Location</span>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Staff Tab */}
                  <TabsContent value="staff" className="mt-6 tab-content-enter">
                    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3 text-xl font-editorial">
                            <div className="p-2 bg-sage-turquoise-100 rounded-xl">
                              <Users className="h-5 w-5 text-sage-turquoise-600" />
                            </div>
                            Staff ({staff.length})
                          </CardTitle>
                          <Button 
                            variant="sage" 
                            effect="glow" 
                            onClick={() => onCreateStaffMember?.(selectedRestaurant.id)}
                            className="space-x-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Staff Member</span>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {staff.length > 0 ? (
                          <div className="space-y-4">
                            {staff.map((staffMember) => (
                              <StaffItem key={staffMember.id} staff={staffMember} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <div className="p-6 bg-sage-100 rounded-2xl w-fit mx-auto mb-6">
                              <Users className="h-12 w-12 text-sage-400 mx-auto" />
                            </div>
                            <h3 className="text-lg font-editorial font-medium text-sage-800 mb-2">No Staff Members</h3>
                            <p className="text-sage-600 mb-6 leading-relaxed max-w-sm mx-auto">
                              Add your first staff member to start managing your team.
                            </p>
                            <Button 
                              variant="sage" 
                              effect="glow" 
                              onClick={() => onCreateStaffMember?.(selectedRestaurant.id)}
                              className="space-x-2"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Add Staff Member</span>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="p-6 bg-sage-100 rounded-2xl w-fit mx-auto mb-6">
                        <Building className="h-12 w-12 text-sage-400 mx-auto" />
                      </div>
                      <h3 className="text-lg font-editorial font-medium text-sage-800 mb-2">Select a Restaurant</h3>
                      <p className="text-sage-600 leading-relaxed max-w-sm mx-auto">
                        Choose a restaurant from the list to view its details, locations, and staff.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
}; 