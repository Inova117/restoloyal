// ============================================================================
// EMAIL TEMPLATES TAB COMPONENT
// Restaurant Loyalty Platform - Email Template Management
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Plus, 
  Search, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Send,
  Save,
  RefreshCw,
  FileText,
  Settings,
  Users,
  Bell
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
  DialogTrigger,
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

export interface EmailTemplatesTabProps {
  className?: string;
  onCreateTemplate?: () => void;
  onEditTemplate?: (template: EmailTemplate) => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  category: 'welcome' | 'notification' | 'marketing' | 'system' | 'support';
  status: 'active' | 'draft' | 'archived';
  htmlContent: string;
  textContent: string;
  variables: string[];
  lastModified: string;
  createdBy: string;
  usageCount: number;
}

interface EmailTemplateCardProps {
  template: EmailTemplate;
  onEdit?: (template: EmailTemplate) => void;
  onDelete?: (template: EmailTemplate) => void;
  onDuplicate?: (template: EmailTemplate) => void;
  onPreview?: (template: EmailTemplate) => void;
  onTest?: (template: EmailTemplate) => void;
}

// ============================================================================
// EMAIL TEMPLATE CARD COMPONENT
// ============================================================================

const EmailTemplateCard: React.FC<EmailTemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onTest
}) => {
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'welcome':
        return { label: 'Welcome', color: 'bg-blue-100 text-blue-800', icon: Users };
      case 'notification':
        return { label: 'Notification', color: 'bg-yellow-100 text-yellow-800', icon: Bell };
      case 'marketing':
        return { label: 'Marketing', color: 'bg-green-100 text-green-800', icon: Mail };
      case 'system':
        return { label: 'System', color: 'bg-purple-100 text-purple-800', icon: Settings };
      case 'support':
        return { label: 'Support', color: 'bg-orange-100 text-orange-800', icon: FileText };
      default:
        return { label: 'Other', color: 'bg-gray-100 text-gray-800', icon: Mail };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Map template status to StatusBadge status
  const getStatusBadgeStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'active' as const;
      case 'draft':
        return 'pending' as const;
      case 'archived':
        return 'inactive' as const;
      default:
        return 'inactive' as const;
    }
  };

  const categoryInfo = getCategoryInfo(template.category);
  const CategoryIcon = categoryInfo.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CategoryIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {template.description}
              </CardDescription>
            </div>
          </div>
          <StatusBadge 
            status={getStatusBadgeStatus(template.status)} 
            label={template.status === 'draft' ? 'Draft' : template.status === 'archived' ? 'Archived' : undefined}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Category:</span>
            <Badge className={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Subject:</span>
            <span className="text-sm font-medium line-clamp-1 max-w-48">
              {template.subject}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Usage:</span>
            <span className="text-sm font-medium">{template.usageCount} times</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Modified:</span>
            <span className="text-sm font-medium">{formatDate(template.lastModified)}</span>
          </div>

          <div className="pt-3 border-t">
            <div className="text-sm text-gray-600 mb-2">Variables:</div>
            <div className="flex flex-wrap gap-1">
              {template.variables.slice(0, 3).map((variable) => (
                <Badge key={variable} variant="outline" className="text-xs">
                  {variable}
                </Badge>
              ))}
              {template.variables.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.variables.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => onPreview?.(template)}>
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit?.(template)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDuplicate?.(template)}>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => onTest?.(template)}>
              <Send className="h-3 w-3 mr-1" />
              Test
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EMAIL TEMPLATES TAB COMPONENT
// ============================================================================

export const EmailTemplatesTab: React.FC<EmailTemplatesTabProps> = ({
  className,
  onCreateTemplate,
  onEditTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState('');

  // Mock data - in real implementation, this would come from a service
  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to {{platform_name}}!',
      description: 'Welcome email sent to new clients when they join the platform',
      category: 'welcome',
      status: 'active',
      htmlContent: '<h1>Welcome {{client_name}}!</h1><p>Thank you for joining {{platform_name}}.</p>',
      textContent: 'Welcome {{client_name}}! Thank you for joining {{platform_name}}.',
      variables: ['client_name', 'platform_name', 'login_url'],
      lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'John Doe',
      usageCount: 156
    },
    {
      id: '2',
      name: 'Password Reset',
      subject: 'Reset your password for {{platform_name}}',
      description: 'Email sent when users request a password reset',
      category: 'system',
      status: 'active',
      htmlContent: '<h1>Password Reset</h1><p>Click the link below to reset your password.</p>',
      textContent: 'Password Reset. Click the link below to reset your password.',
      variables: ['user_name', 'reset_link', 'platform_name'],
      lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'Jane Smith',
      usageCount: 89
    },
    {
      id: '3',
      name: 'Monthly Newsletter',
      subject: '{{platform_name}} Monthly Update - {{month}} {{year}}',
      description: 'Monthly newsletter with platform updates and insights',
      category: 'marketing',
      status: 'draft',
      htmlContent: '<h1>Monthly Update</h1><p>Here are the latest updates from {{platform_name}}.</p>',
      textContent: 'Monthly Update. Here are the latest updates from {{platform_name}}.',
      variables: ['platform_name', 'month', 'year', 'updates'],
      lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'Mike Johnson',
      usageCount: 12
    },
    {
      id: '4',
      name: 'System Maintenance Notice',
      subject: 'Scheduled Maintenance - {{maintenance_date}}',
      description: 'Notification about scheduled system maintenance',
      category: 'notification',
      status: 'active',
      htmlContent: '<h1>Maintenance Notice</h1><p>We will be performing maintenance on {{maintenance_date}}.</p>',
      textContent: 'Maintenance Notice. We will be performing maintenance on {{maintenance_date}}.',
      variables: ['maintenance_date', 'duration', 'platform_name'],
      lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'Admin',
      usageCount: 45
    }
  ]);

  // Filter templates based on search term and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    // In real implementation, this would call a service
    console.log('Deleting template:', selectedTemplate.id);
    setDeleteDialogOpen(false);
    setSelectedTemplate(null);
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    // In real implementation, this would call a service
    console.log('Duplicating template:', template.id);
  };

  const handleTestTemplate = async () => {
    if (!selectedTemplate || !testEmail) return;
    
    // In real implementation, this would send a test email
    console.log('Sending test email to:', testEmail, 'for template:', selectedTemplate.id);
    setTestDialogOpen(false);
    setTestEmail('');
    setSelectedTemplate(null);
  };

  const openPreviewDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const openDeleteDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const openTestDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTestDialogOpen(true);
  };

  return (
    <SectionErrorBoundary name="Email Templates Tab">
      <div className={cn('space-y-6', className)}>
        {/* Header and Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Templates
                </CardTitle>
                <CardDescription>
                  Manage email templates and notifications • {filteredTemplates.length} of {templates.length} templates
                </CardDescription>
              </div>
              <Button onClick={onCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates by name, subject, or description..."
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
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <EmailTemplateCard
                key={template.id}
                template={template}
                onEdit={onEditTemplate}
                onDelete={openDeleteDialog}
                onDuplicate={handleDuplicateTemplate}
                onPreview={openPreviewDialog}
                onTest={openTestDialog}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <Mail className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                      ? 'No Templates Found' 
                      : 'No Email Templates Yet'
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'No templates match your current filters. Try adjusting your search criteria.'
                      : 'Get started by creating your first email template.'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                    <Button onClick={onCreateTemplate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
              <DialogDescription>
                Preview how this email template will appear to recipients
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Subject:</Label>
                    <p className="font-medium">{selectedTemplate.subject}</p>
                  </div>
                  <div>
                    <Label>Category:</Label>
                    <p className="font-medium capitalize">{selectedTemplate.category}</p>
                  </div>
                </div>
                <div>
                  <Label>HTML Content:</Label>
                  <div 
                    className="mt-2 p-4 border rounded-lg bg-white"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }}
                  />
                </div>
                <div>
                  <Label>Text Content:</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50 font-mono text-sm">
                    {selectedTemplate.textContent}
                  </div>
                </div>
                <div>
                  <Label>Available Variables:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Test Email Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Test Email</DialogTitle>
              <DialogDescription>
                Send a test email using the template: {selectedTemplate?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Enter email address to send test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <p className="text-sm text-gray-600">
                The test email will be sent with sample data for all template variables.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTestTemplate} disabled={!testEmail}>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the template <strong>{selectedTemplate?.name}</strong>? 
                This action cannot be undone and will affect any automated emails using this template.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTemplate}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SectionErrorBoundary>
  );
};

export default EmailTemplatesTab; 