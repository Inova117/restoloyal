// ============================================================================
// GLOBAL BRANDING TAB COMPONENT
// Restaurant Loyalty Platform - Platform Branding and Theme Management
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Palette, 
  Upload, 
  Save, 
  RefreshCw, 
  Eye,
  Download,
  Image,
  Type,
  Monitor,
  Smartphone,
  Tablet,
  Settings,
  Check
} from 'lucide-react';
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

export interface GlobalBrandingTabProps {
  className?: string;
  onSaveBranding?: (branding: BrandingConfig) => void;
}

interface BrandingConfig {
  general: {
    platformName: string;
    tagline: string;
    description: string;
    logoUrl: string;
    faviconUrl: string;
    appleTouchIconUrl: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: string;
    lineHeight: string;
    fontWeight: string;
  };
  layout: {
    borderRadius: string;
    spacing: string;
    maxWidth: string;
    sidebarWidth: string;
    headerHeight: string;
  };
  customCss: string;
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

interface PreviewDeviceProps {
  device: 'desktop' | 'tablet' | 'mobile';
  isActive: boolean;
  onClick: () => void;
}

// ============================================================================
// COLOR PICKER COMPONENT
// ============================================================================

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  description
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono"
        />
        <div 
          className="w-10 h-10 rounded border border-gray-300"
          style={{ backgroundColor: value }}
        />
      </div>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
};

// ============================================================================
// PREVIEW DEVICE COMPONENT
// ============================================================================

const PreviewDevice: React.FC<PreviewDeviceProps> = ({
  device,
  isActive,
  onClick
}) => {
  const getIcon = () => {
    switch (device) {
      case 'desktop':
        return Monitor;
      case 'tablet':
        return Tablet;
      case 'mobile':
        return Smartphone;
    }
  };

  const Icon = getIcon();

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <Icon className="h-4 w-4" />
      <span className="capitalize">{device}</span>
    </Button>
  );
};

// ============================================================================
// GLOBAL BRANDING TAB COMPONENT
// ============================================================================

export const GlobalBrandingTab: React.FC<GlobalBrandingTabProps> = ({
  className,
  onSaveBranding
}) => {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [branding, setBranding] = useState<BrandingConfig>({
    general: {
      platformName: 'ZerionCore Restaurant Loyalty Platform',
      tagline: 'Empowering Restaurant Success',
      description: 'The complete loyalty platform for modern restaurants',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      appleTouchIconUrl: '/apple-touch-icon.png'
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      fontWeight: '400'
    },
    layout: {
      borderRadius: '8px',
      spacing: '16px',
      maxWidth: '1200px',
      sidebarWidth: '256px',
      headerHeight: '64px'
    },
    customCss: '/* Custom CSS styles */\n.custom-button {\n  border-radius: 12px;\n  transition: all 0.2s;\n}'
  });

  const updateBranding = (section: keyof BrandingConfig, field: string, value: any) => {
    if (section === 'customCss') {
      setBranding(prev => ({
        ...prev,
        customCss: value
      }));
    } else {
      setBranding(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In real implementation, this would call a service
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSaveBranding?.(branding);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save branding:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (field: string) => {
    // In real implementation, this would handle file upload
    console.log('Uploading file for:', field);
  };

  const handleExportTheme = () => {
    // In real implementation, this would export the theme
    const themeData = JSON.stringify(branding, null, 2);
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'platform-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionErrorBoundary name="Global Branding Tab">
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Global Branding & Themes
                </CardTitle>
                <CardDescription>
                  Customize the platform's visual identity and branding
                  {lastSaved && (
                    <span className="ml-2 text-xs">
                      • Last saved: {lastSaved.toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportTheme}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Theme
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="custom">Custom CSS</TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      General Branding
                    </CardTitle>
                    <CardDescription>
                      Basic platform information and assets
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="platformName">Platform Name</Label>
                        <Input
                          id="platformName"
                          value={branding.general.platformName}
                          onChange={(e) => updateBranding('general', 'platformName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                          id="tagline"
                          value={branding.general.tagline}
                          onChange={(e) => updateBranding('general', 'tagline', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={branding.general.description}
                        onChange={(e) => updateBranding('general', 'description', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Brand Assets</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Logo</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <Button variant="outline" size="sm" onClick={() => handleFileUpload('logo')}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Favicon</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <Button variant="outline" size="sm" onClick={() => handleFileUpload('favicon')}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Favicon
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Apple Touch Icon</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <Button variant="outline" size="sm" onClick={() => handleFileUpload('apple-touch-icon')}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Icon
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Color Settings */}
              <TabsContent value="colors">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Color Palette
                    </CardTitle>
                    <CardDescription>
                      Define the platform's color scheme
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Primary Colors</h4>
                        <ColorPicker
                          label="Primary"
                          value={branding.colors.primary}
                          onChange={(value) => updateBranding('colors', 'primary', value)}
                          description="Main brand color for buttons and links"
                        />
                        <ColorPicker
                          label="Secondary"
                          value={branding.colors.secondary}
                          onChange={(value) => updateBranding('colors', 'secondary', value)}
                          description="Secondary color for subtle elements"
                        />
                        <ColorPicker
                          label="Accent"
                          value={branding.colors.accent}
                          onChange={(value) => updateBranding('colors', 'accent', value)}
                          description="Accent color for highlights"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Background Colors</h4>
                        <ColorPicker
                          label="Background"
                          value={branding.colors.background}
                          onChange={(value) => updateBranding('colors', 'background', value)}
                          description="Main background color"
                        />
                        <ColorPicker
                          label="Surface"
                          value={branding.colors.surface}
                          onChange={(value) => updateBranding('colors', 'surface', value)}
                          description="Card and panel background"
                        />
                        <ColorPicker
                          label="Border"
                          value={branding.colors.border}
                          onChange={(value) => updateBranding('colors', 'border', value)}
                          description="Border and divider color"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                      <div className="space-y-4">
                        <h4 className="font-medium">Text Colors</h4>
                        <ColorPicker
                          label="Text"
                          value={branding.colors.text}
                          onChange={(value) => updateBranding('colors', 'text', value)}
                          description="Primary text color"
                        />
                        <ColorPicker
                          label="Text Secondary"
                          value={branding.colors.textSecondary}
                          onChange={(value) => updateBranding('colors', 'textSecondary', value)}
                          description="Secondary text color"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Status Colors</h4>
                        <ColorPicker
                          label="Success"
                          value={branding.colors.success}
                          onChange={(value) => updateBranding('colors', 'success', value)}
                          description="Success state color"
                        />
                        <ColorPicker
                          label="Warning"
                          value={branding.colors.warning}
                          onChange={(value) => updateBranding('colors', 'warning', value)}
                          description="Warning state color"
                        />
                        <ColorPicker
                          label="Error"
                          value={branding.colors.error}
                          onChange={(value) => updateBranding('colors', 'error', value)}
                          description="Error state color"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Typography Settings */}
              <TabsContent value="typography">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Typography
                    </CardTitle>
                    <CardDescription>
                      Configure fonts and text styling
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fontFamily">Body Font Family</Label>
                        <Select 
                          value={branding.typography.fontFamily} 
                          onValueChange={(value) => updateBranding('typography', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter, system-ui, sans-serif">Inter</SelectItem>
                            <SelectItem value="Roboto, system-ui, sans-serif">Roboto</SelectItem>
                            <SelectItem value="Open Sans, system-ui, sans-serif">Open Sans</SelectItem>
                            <SelectItem value="Poppins, system-ui, sans-serif">Poppins</SelectItem>
                            <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headingFont">Heading Font Family</Label>
                        <Select 
                          value={branding.typography.headingFont} 
                          onValueChange={(value) => updateBranding('typography', 'headingFont', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter, system-ui, sans-serif">Inter</SelectItem>
                            <SelectItem value="Roboto, system-ui, sans-serif">Roboto</SelectItem>
                            <SelectItem value="Open Sans, system-ui, sans-serif">Open Sans</SelectItem>
                            <SelectItem value="Poppins, system-ui, sans-serif">Poppins</SelectItem>
                            <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fontSize">Base Font Size</Label>
                        <Select 
                          value={branding.typography.fontSize} 
                          onValueChange={(value) => updateBranding('typography', 'fontSize', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12px">12px</SelectItem>
                            <SelectItem value="14px">14px</SelectItem>
                            <SelectItem value="16px">16px</SelectItem>
                            <SelectItem value="18px">18px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lineHeight">Line Height</Label>
                        <Select 
                          value={branding.typography.lineHeight} 
                          onValueChange={(value) => updateBranding('typography', 'lineHeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1.3">1.3</SelectItem>
                            <SelectItem value="1.4">1.4</SelectItem>
                            <SelectItem value="1.5">1.5</SelectItem>
                            <SelectItem value="1.6">1.6</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout Settings */}
              <TabsContent value="layout">
                <Card>
                  <CardHeader>
                    <CardTitle>Layout Configuration</CardTitle>
                    <CardDescription>
                      Adjust spacing, sizing, and layout properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="borderRadius">Border Radius</Label>
                        <Input
                          id="borderRadius"
                          value={branding.layout.borderRadius}
                          onChange={(e) => updateBranding('layout', 'borderRadius', e.target.value)}
                          placeholder="8px"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spacing">Base Spacing</Label>
                        <Input
                          id="spacing"
                          value={branding.layout.spacing}
                          onChange={(e) => updateBranding('layout', 'spacing', e.target.value)}
                          placeholder="16px"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxWidth">Max Content Width</Label>
                        <Input
                          id="maxWidth"
                          value={branding.layout.maxWidth}
                          onChange={(e) => updateBranding('layout', 'maxWidth', e.target.value)}
                          placeholder="1200px"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sidebarWidth">Sidebar Width</Label>
                        <Input
                          id="sidebarWidth"
                          value={branding.layout.sidebarWidth}
                          onChange={(e) => updateBranding('layout', 'sidebarWidth', e.target.value)}
                          placeholder="256px"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Custom CSS */}
              <TabsContent value="custom">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom CSS</CardTitle>
                    <CardDescription>
                      Add custom CSS styles for advanced customization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="customCss">Custom CSS Code</Label>
                      <Textarea
                        id="customCss"
                        value={branding.customCss}
                        onChange={(e) => updateBranding('customCss', '', e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                        placeholder="/* Add your custom CSS here */"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your changes look in real-time
                </CardDescription>
                <div className="flex gap-2 pt-2">
                  <PreviewDevice
                    device="desktop"
                    isActive={previewDevice === 'desktop'}
                    onClick={() => setPreviewDevice('desktop')}
                  />
                  <PreviewDevice
                    device="tablet"
                    isActive={previewDevice === 'tablet'}
                    onClick={() => setPreviewDevice('tablet')}
                  />
                  <PreviewDevice
                    device="mobile"
                    isActive={previewDevice === 'mobile'}
                    onClick={() => setPreviewDevice('mobile')}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className={cn(
                    'border rounded-lg overflow-hidden',
                    previewDevice === 'desktop' && 'aspect-video',
                    previewDevice === 'tablet' && 'aspect-[4/3]',
                    previewDevice === 'mobile' && 'aspect-[9/16]'
                  )}
                  style={{
                    backgroundColor: branding.colors.background,
                    color: branding.colors.text,
                    fontFamily: branding.typography.fontFamily
                  }}
                >
                  <div 
                    className="p-4 border-b"
                    style={{ 
                      backgroundColor: branding.colors.primary,
                      color: 'white',
                      height: branding.layout.headerHeight
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h1 className="font-bold text-lg">{branding.general.platformName}</h1>
                      <div className="flex gap-2">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        />
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: branding.typography.headingFont }}>
                        {branding.general.tagline}
                      </h2>
                      <p style={{ color: branding.colors.textSecondary }}>
                        {branding.general.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div 
                        className="px-4 py-2 rounded text-white text-sm"
                        style={{ 
                          backgroundColor: branding.colors.primary,
                          borderRadius: branding.layout.borderRadius
                        }}
                      >
                        Primary Button
                      </div>
                      <div 
                        className="px-4 py-2 rounded text-sm border"
                        style={{ 
                          borderColor: branding.colors.border,
                          borderRadius: branding.layout.borderRadius
                        }}
                      >
                        Secondary Button
                      </div>
                    </div>
                    <div 
                      className="p-4 rounded"
                      style={{ 
                        backgroundColor: branding.colors.surface,
                        borderRadius: branding.layout.borderRadius
                      }}
                    >
                      <h3 className="font-medium mb-2">Sample Card</h3>
                      <p className="text-sm" style={{ color: branding.colors.textSecondary }}>
                        This is how cards and panels will look with your current theme.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theme Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Colors Configured</span>
                  <StatusBadge status="active" label="Complete" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Typography Set</span>
                  <StatusBadge status="active" label="Complete" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Layout Configured</span>
                  <StatusBadge status="active" label="Complete" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Assets Uploaded</span>
                  <StatusBadge status="warning" label="Pending" size="sm" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
};

export default GlobalBrandingTab; 