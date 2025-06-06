// ============================================================================
// SYSTEM CONFIG TAB COMPONENT
// Restaurant Loyalty Platform - System Configuration Management
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Shield, 
  Mail,
  Bell,
  Globe} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface SystemConfigTabProps {
  className?: string;
  onSaveConfig?: (config: SystemConfig) => void;
}

interface SystemConfig {
  general: {
    platformName: string;
    platformUrl: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
    debugMode: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireMFA: boolean;
    allowedDomains: string[];
    ipWhitelist: string[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableSSL: boolean;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    enableSMSNotifications: boolean;
    notificationRetentionDays: number;
  };
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    enableQueryLogging: boolean;
    backupFrequency: string;
    retentionPeriod: number;
  };
}

interface ConfigSectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

// ============================================================================
// CONFIG SECTION COMPONENT
// ============================================================================

const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  description,
  icon: Icon,
  children
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SYSTEM CONFIG TAB COMPONENT
// ============================================================================

export const SystemConfigTab: React.FC<SystemConfigTabProps> = ({
  className,
  onSaveConfig
}) => {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      platformName: 'ZerionCore Restaurant Loyalty Platform',
      platformUrl: 'https://platform.zerioncore.com',
      timezone: 'UTC',
      language: 'en',
      maintenanceMode: false,
      debugMode: false
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireMFA: true,
      allowedDomains: ['zerioncore.com', 'galletti.com'],
      ipWhitelist: []
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@zerioncore.com',
      smtpPassword: '••••••••',
      fromEmail: 'noreply@zerioncore.com',
      fromName: 'ZerionCore Platform',
      enableSSL: true
    },
    notifications: {
      enableEmailNotifications: true,
      enablePushNotifications: true,
      enableSMSNotifications: false,
      notificationRetentionDays: 30
    },
    database: {
      connectionPoolSize: 20,
      queryTimeout: 30,
      enableQueryLogging: false,
      backupFrequency: 'daily',
      retentionPeriod: 90
    }
  });

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In real implementation, this would call a service
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSaveConfig?.(config);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    // In real implementation, this would send a test email
    console.log('Testing email configuration...');
  };

  return (
    <SectionErrorBoundary name="System Config Tab">
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Manage platform-wide settings and configurations
                  {lastSaved && (
                    <span className="ml-2 text-xs">
                      • Last saved: {lastSaved.toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge 
                  status={config.general.maintenanceMode ? 'warning' : 'healthy'} 
                  label={config.general.maintenanceMode ? 'Maintenance Mode' : 'System Online'}
                />
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Configuration
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Configuration Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <ConfigSection
              title="General Settings"
              description="Basic platform configuration and global settings"
              icon={Globe}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={config.general.platformName}
                    onChange={(e) => updateConfig('general', 'platformName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformUrl">Platform URL</Label>
                  <Input
                    id="platformUrl"
                    value={config.general.platformUrl}
                    onChange={(e) => updateConfig('general', 'platformUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={config.general.timezone} 
                    onValueChange={(value) => updateConfig('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select 
                    value={config.general.language} 
                    onValueChange={(value) => updateConfig('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-600">
                      Enable to temporarily disable platform access for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={config.general.maintenanceMode}
                    onCheckedChange={(checked) => updateConfig('general', 'maintenanceMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-gray-600">
                      Enable detailed logging and error reporting
                    </p>
                  </div>
                  <Switch
                    checked={config.general.debugMode}
                    onCheckedChange={(checked) => updateConfig('general', 'debugMode', checked)}
                  />
                </div>
              </div>
            </ConfigSection>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <ConfigSection
              title="Security Settings"
              description="Authentication, authorization, and security policies"
              icon={Shield}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Multi-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">
                      Require MFA for all admin users
                    </p>
                  </div>
                  <Switch
                    checked={config.security.requireMFA}
                    onCheckedChange={(checked) => updateConfig('security', 'requireMFA', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedDomains">Allowed Email Domains</Label>
                <Textarea
                  id="allowedDomains"
                  placeholder="Enter one domain per line (e.g., company.com)"
                  value={config.security.allowedDomains.join('\n')}
                  onChange={(e) => updateConfig('security', 'allowedDomains', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                />
              </div>
            </ConfigSection>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <ConfigSection
              title="Email Configuration"
              description="SMTP settings for sending platform emails"
              icon={Mail}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={config.email.smtpHost}
                    onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={config.email.smtpPort}
                    onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={config.email.smtpUser}
                    onChange={(e) => updateConfig('email', 'smtpUser', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={config.email.smtpPassword}
                    onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={config.email.fromEmail}
                    onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={config.email.fromName}
                    onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable SSL/TLS</Label>
                    <p className="text-sm text-gray-600">
                      Use secure connection for SMTP
                    </p>
                  </div>
                  <Switch
                    checked={config.email.enableSSL}
                    onCheckedChange={(checked) => updateConfig('email', 'enableSSL', checked)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleTestEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Test Email Configuration
                  </Button>
                </div>
              </div>
            </ConfigSection>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <ConfigSection
              title="Notification Settings"
              description="Configure platform notification preferences"
              icon={Bell}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.enableEmailNotifications}
                    onCheckedChange={(checked) => updateConfig('notifications', 'enableEmailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Send browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.enablePushNotifications}
                    onCheckedChange={(checked) => updateConfig('notifications', 'enablePushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.enableSMSNotifications}
                    onCheckedChange={(checked) => updateConfig('notifications', 'enableSMSNotifications', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="retentionDays">Notification Retention (days)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  value={config.notifications.notificationRetentionDays}
                  onChange={(e) => updateConfig('notifications', 'notificationRetentionDays', parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-600">
                  How long to keep notification history
                </p>
              </div>
            </ConfigSection>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database">
            <ConfigSection
              title="Database Configuration"
              description="Database connection and performance settings"
              icon={Database}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="connectionPoolSize">Connection Pool Size</Label>
                  <Input
                    id="connectionPoolSize"
                    type="number"
                    value={config.database.connectionPoolSize}
                    onChange={(e) => updateConfig('database', 'connectionPoolSize', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="queryTimeout">Query Timeout (seconds)</Label>
                  <Input
                    id="queryTimeout"
                    type="number"
                    value={config.database.queryTimeout}
                    onChange={(e) => updateConfig('database', 'queryTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select 
                    value={config.database.backupFrequency} 
                    onValueChange={(value) => updateConfig('database', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retentionPeriod">Backup Retention (days)</Label>
                  <Input
                    id="retentionPeriod"
                    type="number"
                    value={config.database.retentionPeriod}
                    onChange={(e) => updateConfig('database', 'retentionPeriod', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Query Logging</Label>
                    <p className="text-sm text-gray-600">
                      Log all database queries for debugging
                    </p>
                  </div>
                  <Switch
                    checked={config.database.enableQueryLogging}
                    onCheckedChange={(checked) => updateConfig('database', 'enableQueryLogging', checked)}
                  />
                </div>
              </div>
            </ConfigSection>
          </TabsContent>
        </Tabs>
      </div>
    </SectionErrorBoundary>
  );
};

export default SystemConfigTab; 