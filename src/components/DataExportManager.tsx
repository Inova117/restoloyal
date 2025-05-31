import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useDataExport, ExportRequest } from '@/hooks/useDataExport'
import { Download, FileText, Database, TrendingUp, Users, Gift, CreditCard, Calendar, MapPin, Filter } from 'lucide-react'

const DataExportManager: React.FC = () => {
  const { exportData, isExporting } = useDataExport()
  
  const [exportType, setExportType] = useState<'customers' | 'rewards' | 'transactions' | 'analytics'>('customers')
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [locationId, setLocationId] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const exportTypes = [
    {
      value: 'customers' as const,
      label: 'Customer Data',
      description: 'Export customer profiles, contact info, and activity summary',
      icon: Users,
      fields: ['ID', 'Name', 'Email', 'Phone', 'Location', 'Status', 'Total Stamps', 'Total Rewards', 'Created Date']
    },
    {
      value: 'rewards' as const,
      label: 'Rewards Data',
      description: 'Export reward redemptions and usage history',
      icon: Gift,
      fields: ['ID', 'Customer Name', 'Customer Email', 'Reward Type', 'Reward Value', 'Location', 'Redeemed Date', 'Stamps Used', 'Status']
    },
    {
      value: 'transactions' as const,
      label: 'Transaction Data',
      description: 'Export stamp transactions and purchase history',
      icon: CreditCard,
      fields: ['ID', 'Customer Name', 'Customer Email', 'Location', 'Transaction Type', 'Stamps Earned', 'Amount', 'Date', 'Notes']
    },
    {
      value: 'analytics' as const,
      label: 'Analytics Data',
      description: 'Export aggregated business metrics and performance data',
      icon: TrendingUp,
      fields: ['Metric', 'Location', 'Period', 'Value', 'Growth Rate', 'Last Updated']
    }
  ]

  const locations = [
    { id: 'loc_1', name: 'Main Street Store' },
    { id: 'loc_2', name: 'Mall Location' },
    { id: 'loc_3', name: 'Airport Branch' }
  ]

  const handleExport = async () => {
    const request: ExportRequest = {
      type: exportType,
      format,
      location_id: locationId && locationId !== 'all' ? locationId : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined
    }

    await exportData(request)
  }

  const selectedExportType = exportTypes.find(type => type.value === exportType)

  const getQuickDateRange = (days: number) => {
    const to = new Date()
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(to.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Export</h2>
          <p className="text-muted-foreground">
            Export customer, rewards, transactions, and analytics data for your franchise
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          Secure Export
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Type Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Data Type
              </CardTitle>
              <CardDescription>
                Choose the type of data you want to export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        exportType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setExportType(type.value)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${
                          exportType === type.value ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1">
                          <h3 className="font-medium">{type.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Export Filters
              </CardTitle>
              <CardDescription>
                Configure filters to customize your export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location (Optional)
                </Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range (Optional)
                </Label>
                
                {/* Quick Date Range Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => getQuickDateRange(30)}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => getQuickDateRange(90)}
                  >
                    Last 90 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => getQuickDateRange(365)}
                  >
                    Last year
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {/* Custom Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={format} onValueChange={(value: 'csv' | 'json') => setFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                    <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Summary & Action */}
        <div className="space-y-6">
          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Export Summary</CardTitle>
              <CardDescription>
                Review your export configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data Type:</span>
                  <Badge variant="outline">{selectedExportType?.label}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Format:</span>
                  <Badge variant="outline">{format.toUpperCase()}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm text-muted-foreground">
                    {locationId && locationId !== 'all' ? locations.find(l => l.id === locationId)?.name : 'All locations'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Date Range:</span>
                  <span className="text-sm text-muted-foreground">
                    {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All time'}
                  </span>
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Data Fields Preview */}
          {selectedExportType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Included Fields</CardTitle>
                <CardDescription>
                  Fields that will be included in your export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedExportType.fields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">{field}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-amber-800">Security Notice</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-amber-700">
                All exports are logged for audit purposes. Only data from your franchise locations will be included.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DataExportManager 