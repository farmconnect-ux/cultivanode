import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { MapPin, Droplets, FileText, Bell } from 'lucide-react';

interface QuickActionModalProps {
  isOpen?: boolean;
  open?: boolean;
  type?: string;
  onClose: () => void;
  onAction?: (type: string, data?: any) => void;
}

export function QuickActionModal({
  isOpen,
  open: propOpen,
  type: initialType = 'farm',
  onClose,
  onAction,
}: QuickActionModalProps) {
  const isModalOpen = isOpen !== undefined ? isOpen : (propOpen !== undefined ? propOpen : true);
  const [activeType, setActiveType] = useState<string>(initialType);
  const [formData, setFormData] = useState<Record<string, any>>({});

  if (!isModalOpen) return null;

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderContent = () => {
    switch (activeType) {
      case 'farm':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">Add New Farm</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="farmName">Farm Name</Label>
                <Input
                  id="farmName"
                  placeholder="e.g. Oyo Green Valley"
                  value={formData.farmName || ''}
                  onChange={(e) => updateFormData('farmName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location">Location / State</Label>
                <Input
                  id="location"
                  placeholder="e.g. Ibadan, Oyo State"
                  value={formData.location || ''}
                  onChange={(e) => updateFormData('location', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="size">Size (hectares/acres)</Label>
                <Input
                  id="size"
                  type="number"
                  placeholder="50"
                  value={formData.size || ''}
                  onChange={(e) => updateFormData('size', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="manager">Manager / Supervisor</Label>
                <Input
                  id="manager"
                  placeholder="Manager name"
                  value={formData.manager || ''}
                  onChange={(e) => updateFormData('manager', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Farm topography, irrigation status, notes..."
                value={formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 'irrigation':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Schedule Irrigation</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="zone">Zone/Field</Label>
                <Select value={formData.zone || ''} onValueChange={(value) => updateFormData('zone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field-a-1">Field A - Zone 1</SelectItem>
                    <SelectItem value="field-a-2">Field A - Zone 2</SelectItem>
                    <SelectItem value="field-b-1">Field B - Zone 1</SelectItem>
                    <SelectItem value="greenhouse-1">Greenhouse 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={formData.duration || ''}
                  onChange={(e) => updateFormData('duration', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime || ''}
                  onChange={(e) => updateFormData('startTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={formData.frequency || ''} onValueChange={(value) => updateFormData('frequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className="bg-blue-100 text-blue-800 text-[10px]">AI Recommendation</Badge>
              </div>
              <p className="text-xs text-blue-900">
                Based on current soil moisture (38%) and weather forecast, we recommend 45 minutes of drip irrigation starting at 6:00 AM.
              </p>
            </div>
          </div>
        );

      case 'report':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Generate Report</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={formData.reportType || ''} onValueChange={(value) => updateFormData('reportType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production Summary</SelectItem>
                    <SelectItem value="financial">Financial Analysis</SelectItem>
                    <SelectItem value="environmental">Environmental Impact</SelectItem>
                    <SelectItem value="livestock">Livestock Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="period">Time Period</Label>
                <Select value={formData.period || ''} onValueChange={(value) => updateFormData('period', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="quarter">Last quarter</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="farms">Farms to Include</Label>
                <Select value={formData.farms || ''} onValueChange={(value) => updateFormData('farms', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Farms</SelectItem>
                    <SelectItem value="green-valley">Green Valley Farm</SelectItem>
                    <SelectItem value="sunrise-acres">Sunrise Acres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="format">Format</Label>
                <Select value={formData.format || ''} onValueChange={(value) => updateFormData('format', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'alert':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">Send Alert</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="alertType">Alert Type</Label>
                <Select value={formData.alertType || ''} onValueChange={(value) => updateFormData('alertType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="maintenance">Maintenance Required</SelectItem>
                    <SelectItem value="weather">Weather Warning</SelectItem>
                    <SelectItem value="system">System Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="recipients">Recipients</Label>
                <Select value={formData.recipients || ''} onValueChange={(value) => updateFormData('recipients', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-managers">All Farm Managers</SelectItem>
                    <SelectItem value="specific-farm">Specific Farm Team</SelectItem>
                    <SelectItem value="maintenance">Maintenance Team</SelectItem>
                    <SelectItem value="custom">Custom Recipients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your alert message..."
                  value={formData.message || ''}
                  onChange={(e) => updateFormData('message', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="urgent"
                  checked={formData.urgent || false}
                  onChange={(e) => updateFormData('urgent', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600"
                />
                <label htmlFor="urgent" className="text-xs font-medium text-gray-700 cursor-pointer">Mark as urgent</label>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown action type</div>;
    }
  };

  const getActionLabel = () => {
    switch (activeType) {
      case 'farm': return 'Add Farm';
      case 'irrigation': return 'Schedule Irrigation';
      case 'report': return 'Generate Report';
      case 'alert': return 'Send Alert';
      default: return 'Submit';
    }
  };

  const handleSubmit = () => {
    onAction?.(activeType, formData);
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Quick Action</DialogTitle>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveType('farm')}
                className={`px-2 py-1 text-[11px] rounded-md font-medium transition-colors ${activeType === 'farm' ? 'bg-leaf-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Farm
              </button>
              <button
                type="button"
                onClick={() => setActiveType('irrigation')}
                className={`px-2 py-1 text-[11px] rounded-md font-medium transition-colors ${activeType === 'irrigation' ? 'bg-leaf-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Irrigation
              </button>
              <button
                type="button"
                onClick={() => setActiveType('report')}
                className={`px-2 py-1 text-[11px] rounded-md font-medium transition-colors ${activeType === 'report' ? 'bg-leaf-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Report
              </button>
              <button
                type="button"
                onClick={() => setActiveType('alert')}
                className={`px-2 py-1 text-[11px] rounded-md font-medium transition-colors ${activeType === 'alert' ? 'bg-leaf-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Alert
              </button>
            </div>
          </div>
        </DialogHeader>
        
        {renderContent()}
        
        <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white">
            {getActionLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
