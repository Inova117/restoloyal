// ============================================================================
// FEATURE TOGGLES TAB COMPONENT
// Restaurant Loyalty Platform - Feature Flag Management
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ToggleLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save,
  RefreshCw,
  Flag,
  Users,
  Zap,
  Shield,
  Bell,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface FeatureTogglesTabProps {
  className?: string;
  onCreateFeature?: () => void;
  onEditFeature?: (feature: FeatureToggle) => void;
}

interface FeatureToggle {
  id: string;
  name: string;
  key: string;
  description: string;
  category: 'core' | 'ui' | 'api' | 'analytics' | 'security' | 'experimental';
  enabled: boolean;
  rolloutPercentage: number;
  targetAudience: 'all' | 'admins' | 'beta_users' | 'specific_clients';
  environment: 'development' | 'staging' | 'production';
  createdAt: string;
  lastModified: string;
  modifiedBy: string;
  dependencies: string[];
}

interface FeatureToggleCardProps {
  feature: FeatureToggle;
  onToggle?: (feature: FeatureToggle) => void;
  onEdit?: (feature: FeatureToggle) => void;
  onDelete?: (feature: FeatureToggle) => void;
}

// ============================================================================
// FEATURE TOGGLE CARD COMPONENT
// ============================================================================

const FeatureToggleCard: React.FC<FeatureToggleCardProps> = ({
  feature,
  onToggle,
  onEdit,
  onDelete
}) => {
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'core':
        return { label: 'Core', color: 'bg-blue-100 text-blue-800', icon: Settings };
      case 'ui':
        return { label: 'UI/UX', color: 'bg-purple-100 text-purple-800', icon: Eye };
      case 'api':
        return { label: 'API', color: 'bg-green-100 text-green-800', icon: Zap };
      case 'analytics':
        return { label: 'Analytics', color: 'bg-orange-100 text-orange-800', icon: Flag };
      case 'security':
        return { label: 'Security', color: 'bg-red-100 text-red-800', icon: Shield };
      case 'experimental':
        return { label: 'Experimental', color: 'bg-yellow-100 text-yellow-800', icon: Bell };
      default:
        return { label: 'Other', color: 'bg-gray-100 text-gray-800', icon: Flag };
    }
  };

  const getAudienceInfo = (audience: string) => {
    switch (audience) {
      case 'all':
        return { label: 'All Users', color: 'bg-green-100 text-green-800' };
      case 'admins':
        return { label: 'Admins Only', color: 'bg-blue-100 text-blue-800' };
      case 'beta_users':
        return { label: 'Beta Users', color: 'bg-purple-100 text-purple-800' };
      case 'specific_clients':
        return { label: 'Specific Clients', color: 'bg-orange-100 text-orange-800' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const categoryInfo = getCategoryInfo(feature.category);
  const audienceInfo = getAudienceInfo(feature.targetAudience);
  const CategoryIcon = categoryInfo.icon;

  return (
    <Card className={cn(
      'hover:shadow-lg transition-all duration-200',
      feature.enabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              feature.enabled ? 'bg-green-100' : 'bg-gray-100'
            )}>
              <CategoryIcon className={cn(
                'h-5 w-5',
                feature.enabled ? 'text-green-600' : 'text-gray-600'
              )} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {feature.name}
                {feature.enabled ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {feature.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={feature.enabled ? 'active' : 'inactive'} 
              label={feature.enabled ? 'Enabled' : 'Disabled'}
              size="sm"
            />
            <Switch
              checked={feature.enabled}
              onCheckedChange={() => onToggle?.(feature)}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Key:</span>
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {feature.key}
            </code>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Category:</span>
            <Badge className={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Audience:</span>
            <Badge className={audienceInfo.color}>
              {audienceInfo.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rollout:</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${feature.rolloutPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium">{feature.rolloutPercentage}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Environment:</span>
            <Badge variant="outline" className="capitalize">
              {feature.environment}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Modified:</span>
            <span className="text-sm font-medium">{formatDate(feature.lastModified)}</span>
          </div>

          {feature.dependencies.length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-sm text-gray-600 mb-2">Dependencies:</div>
              <div className="flex flex-wrap gap-1">
                {feature.dependencies.slice(0, 2).map((dep) => (
                  <Badge key={dep} variant="outline" className="text-xs">
                    {dep}
                  </Badge>
                ))}
                {feature.dependencies.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{feature.dependencies.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => onEdit?.(feature)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete?.(feature)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// FEATURE TOGGLES TAB COMPONENT
// ============================================================================

export const FeatureTogglesTab: React.FC<FeatureTogglesTabProps> = ({
  className,
  onCreateFeature,
  onEditFeature
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureToggle | null>(null);

  // Mock data - in real implementation, this would come from a service
  const [features, setFeatures] = useState<FeatureToggle[]>([
    {
      id: '1',
      name: 'Advanced Analytics Dashboard',
      key: 'advanced_analytics_dashboard',
      description: 'Enhanced analytics with real-time metrics and custom reports',
      category: 'analytics',
      enabled: true,
      rolloutPercentage: 100,
      targetAudience: 'all',
      environment: 'production',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      modifiedBy: 'John Doe',
      dependencies: []
    },
    {
      id: '2',
      name: 'Beta Mobile App Integration',
      key: 'beta_mobile_app_integration',
      description: 'New mobile app integration features for testing',
      category: 'experimental',
      enabled: false,
      rolloutPercentage: 25,
      targetAudience: 'beta_users',
      environment: 'staging',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      modifiedBy: 'Jane Smith',
      dependencies: ['advanced_analytics_dashboard']
    },
    {
      id: '3',
      name: 'Enhanced Security Logging',
      key: 'enhanced_security_logging',
      description: 'Detailed security event logging and monitoring',
      category: 'security',
      enabled: true,
      rolloutPercentage: 100,
      targetAudience: 'admins',
      environment: 'production',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      modifiedBy: 'Security Team',
      dependencies: []
    },
    {
      id: '4',
      name: 'New UI Theme System',
      key: 'new_ui_theme_system',
      description: 'Customizable themes and branding options',
      category: 'ui',
      enabled: false,
      rolloutPercentage: 10,
      targetAudience: 'specific_clients',
      environment: 'development',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      modifiedBy: 'UI Team',
      dependencies: ['advanced_analytics_dashboard']
    }
  ]);

  // Filter features based on search term and filters
  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && feature.enabled) ||
                         (statusFilter === 'disabled' && !feature.enabled);
    const matchesEnvironment = environmentFilter === 'all' || feature.environment === environmentFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesEnvironment;
  });

  const handleToggleFeature = (feature: FeatureToggle) => {
    setFeatures(prev => prev.map(f => 
      f.id === feature.id 
        ? { ...f, enabled: !f.enabled, lastModified: new Date().toISOString() }
        : f
    ));
  };

  const handleDeleteFeature = async () => {
    if (!selectedFeature) return;
    
    setFeatures(prev => prev.filter(f => f.id !== selectedFeature.id));
    setDeleteDialogOpen(false);
    setSelectedFeature(null);
  };

  const openDeleteDialog = (feature: FeatureToggle) => {
    setSelectedFeature(feature);
    setDeleteDialogOpen(true);
  };

  const enabledCount = features.filter(f => f.enabled).length;
  const disabledCount = features.filter(f => !f.enabled).length;

  return (
    <SectionErrorBoundary name="Feature Toggles Tab">
      <div className={cn('space-y-6', className)}>
        {/* Header and Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ToggleLeft className="h-5 w-5" />
                  Feature Toggles
                </CardTitle>
                <CardDescription>
                  Manage feature flags and rollouts • {enabledCount} enabled, {disabledCount} disabled
                </CardDescription>
              </div>
              <Button onClick={onCreateFeature}>
                <Plus className="h-4 w-4 mr-2" />
                Create Feature Toggle
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search features by name, key, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="ui">UI/UX</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Feature Toggles Grid */}
        {filteredFeatures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map((feature) => (
              <FeatureToggleCard
                key={feature.id}
                feature={feature}
                onToggle={handleToggleFeature}
                onEdit={onEditFeature}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <ToggleLeft className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || environmentFilter !== 'all'
                      ? 'No Feature Toggles Found' 
                      : 'No Feature Toggles Yet'
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || environmentFilter !== 'all'
                      ? 'No feature toggles match your current filters. Try adjusting your search criteria.'
                      : 'Get started by creating your first feature toggle.'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && environmentFilter === 'all' && (
                    <Button onClick={onCreateFeature}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Feature Toggle
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Feature Toggle</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the feature toggle <strong>{selectedFeature?.name}</strong>? 
                This action cannot be undone and may affect dependent features.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFeature}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Feature Toggle
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SectionErrorBoundary>
  );
};

export default FeatureTogglesTab; 