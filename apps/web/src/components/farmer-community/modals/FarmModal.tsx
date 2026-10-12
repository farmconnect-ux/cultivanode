"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { MapPin } from 'lucide-react';

interface Farm {
  id?: number | string;
  name: string;
  location: string;
  size: number;
  manager: string;
  crops: string[];
  livestock: number;
  status: string;
  revenue: number;
  lastInspection: string;
}

interface FarmModalProps {
  farm?: Farm | null;
  onClose: () => void;
}

export function FarmModal({ farm, onClose }: FarmModalProps) {
  const [formData, setFormData] = useState<Partial<Farm>>({
    name: '',
    location: '',
    size: 0,
    manager: '',
    crops: [],
    livestock: 0,
    status: 'active',
    revenue: 0,
    lastInspection: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);

  const availableCrops = [
    'Maize', 'Cassava', 'Soybeans', 'Yam', 'Sorghum', 'Rice', 'Groundnuts', 
    'Cowpeas', 'Oil Palm', 'Tomatoes', 'Peppers', 'Vegetables'
  ];

  useEffect(() => {
    if (farm) {
      setFormData(farm);
      setSelectedCrops(farm.crops || []);
    }
  }, [farm]);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const toggleCrop = (crop: string) => {
    const newCrops = selectedCrops.includes(crop)
      ? selectedCrops.filter(c => c !== crop)
      : [...selectedCrops, crop];
    
    setSelectedCrops(newCrops);
    updateFormData('crops', newCrops);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Farm name is required';
    }

    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.size || formData.size <= 0) {
      newErrors.size = 'Farm size must be greater than 0';
    }

    if (!formData.manager?.trim()) {
      newErrors.manager = 'Manager name is required';
    }

    if (selectedCrops.length === 0) {
      newErrors.crops = 'At least one crop must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-green-700" />
            <span>{farm ? 'Edit Farm' : 'Add New Farm'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Farm Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Green Valley Farm"
                  value={formData.name || ''}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="location">Location (State / LGA) *</Label>
                <Input
                  id="location"
                  placeholder="e.g. Ibadan, Oyo State"
                  value={formData.location || ''}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-[11px] text-red-600 mt-1">{errors.location}</p>}
              </div>
              
              <div>
                <Label htmlFor="size">Size (hectares) *</Label>
                <Input
                  id="size"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={formData.size || ''}
                  onChange={(e) => updateFormData('size', parseFloat(e.target.value) || 0)}
                  className={errors.size ? 'border-red-500' : ''}
                />
                {errors.size && <p className="text-[11px] text-red-600 mt-1">{errors.size}</p>}
              </div>
              
              <div>
                <Label htmlFor="manager">Farm Manager / Supervisor *</Label>
                <Input
                  id="manager"
                  placeholder="Manager name"
                  value={formData.manager || ''}
                  onChange={(e) => updateFormData('manager', e.target.value)}
                  className={errors.manager ? 'border-red-500' : ''}
                />
                {errors.manager && <p className="text-[11px] text-red-600 mt-1">{errors.manager}</p>}
              </div>
            </div>
          </div>

          {/* Crops Selection */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Crops & Production *</h3>
            
            <div>
              <Label>Select Primary Crops Grown</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {availableCrops.map(crop => (
                  <div key={crop} className="flex items-center space-x-2">
                    <Checkbox
                      id={crop}
                      checked={selectedCrops.includes(crop)}
                      onCheckedChange={() => toggleCrop(crop)}
                    />
                    <label htmlFor={crop} className="text-xs text-gray-700 cursor-pointer">{crop}</label>
                  </div>
                ))}
              </div>
              {errors.crops && <p className="text-[11px] text-red-600 mt-1">{errors.crops}</p>}
              
              {selectedCrops.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedCrops.map(crop => (
                    <Badge key={crop} variant="secondary" className="bg-green-100 text-green-800">
                      {crop}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Livestock & Financial */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Livestock & Financial</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="livestock">Number of Livestock</Label>
                <Input
                  id="livestock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.livestock || ''}
                  onChange={(e) => updateFormData('livestock', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="revenue">Annual Revenue (₦)</Label>
                <Input
                  id="revenue"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.revenue || ''}
                  onChange={(e) => updateFormData('revenue', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Farm Status</Label>
                <Select value={formData.status || 'active'} onValueChange={(value) => updateFormData('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="lastInspection">Last Inspection Date</Label>
                <Input
                  id="lastInspection"
                  type="date"
                  value={formData.lastInspection || ''}
                  onChange={(e) => updateFormData('lastInspection', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <Alert className="border-blue-100 bg-blue-50/70">
            <AlertDescription className="text-xs text-blue-900">
              <div className="flex items-start space-x-2">
                <Badge className="bg-blue-100 text-blue-800 text-[10px]">AI Insight</Badge>
                <div>
                  <p className="font-medium">Recommended for this farm size and region:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-800">
                    <li>Deploy 3-4 soil moisture IoT sensors across main crop zones</li>
                    <li>Configure schedule for early-morning drip irrigation</li>
                    <li>Enable crop disease risk monitoring for high humidity seasons</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} size="sm" className="bg-green-700 hover:bg-green-800 text-white">
            {farm ? 'Update Farm' : 'Add Farm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
