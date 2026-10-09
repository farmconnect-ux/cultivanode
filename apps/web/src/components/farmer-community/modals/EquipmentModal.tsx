import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { formatCurrency } from '../ui/currency-utils';
import { Wrench, Calculator } from 'lucide-react';
import { 
  equipmentTypes, 
  equipmentCategories, 
  equipmentBrands, 
  equipmentConditions, 
  equipmentStatusOptions 
} from './equipment-constants';
import { 
  Equipment, 
  validateEquipmentForm, 
  calculateDepreciation, 
  getDefaultEquipmentData 
} from './equipment-helpers';

interface EquipmentModalProps {
  equipment?: Equipment | null;
  onClose: () => void;
}

export function EquipmentModal({ equipment, onClose }: EquipmentModalProps) {
  const [formData, setFormData] = useState<Partial<Equipment>>(getDefaultEquipmentData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
    }
  }, [equipment]);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleSubmit = () => {
    const validationErrors = validateEquipmentForm(formData);
    if (Object.keys(validationErrors).length === 0) {
      onClose();
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-amber-600" />
            <span>{equipment ? 'Edit Equipment' : 'Add New Equipment'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Equipment Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Mahindra 8000"
                  value={formData.name || ''}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="type">Equipment Type *</Label>
                <Select value={formData.type || ''} onValueChange={(value) => updateFormData('type', value)}>
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-[11px] text-red-600 mt-1">{errors.type}</p>}
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category || ''} onValueChange={(value) => updateFormData('category', value)}>
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-[11px] text-red-600 mt-1">{errors.category}</p>}
              </div>
              
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Select value={formData.brand || ''} onValueChange={(value) => updateFormData('brand', value)}>
                  <SelectTrigger className={errors.brand ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.brand && <p className="text-[11px] text-red-600 mt-1">{errors.brand}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="Model code"
                  value={formData.model || ''}
                  onChange={(e) => updateFormData('model', e.target.value)}
                  className={errors.model ? 'border-red-500' : ''}
                />
                {errors.model && <p className="text-[11px] text-red-600 mt-1">{errors.model}</p>}
              </div>
              
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year || ''}
                  onChange={(e) => updateFormData('year', parseInt(e.target.value) || 0)}
                  className={errors.year ? 'border-red-500' : ''}
                />
                {errors.year && <p className="text-[11px] text-red-600 mt-1">{errors.year}</p>}
              </div>
              
              <div>
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <Input
                  id="serialNumber"
                  placeholder="Serial No"
                  value={formData.serialNumber || ''}
                  onChange={(e) => updateFormData('serialNumber', e.target.value)}
                  className={errors.serialNumber ? 'border-red-500' : ''}
                />
                {errors.serialNumber && <p className="text-[11px] text-red-600 mt-1">{errors.serialNumber}</p>}
              </div>
              
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g. Field Bay A"
                  value={formData.location || ''}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-[11px] text-red-600 mt-1">{errors.location}</p>}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Financial Information</h3>
            
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price (₦) *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => updateFormData('purchasePrice', parseFloat(e.target.value) || 0)}
                  className={errors.purchasePrice ? 'border-red-500' : ''}
                />
                {errors.purchasePrice && <p className="text-[11px] text-red-600 mt-1">{errors.purchasePrice}</p>}
              </div>
              
              <div>
                <Label htmlFor="currentValue">Current Value (₦) *</Label>
                <Input
                  id="currentValue"
                  type="number"
                  min="0"
                  value={formData.currentValue || ''}
                  onChange={(e) => updateFormData('currentValue', parseFloat(e.target.value) || 0)}
                  className={errors.currentValue ? 'border-red-500' : ''}
                />
                {errors.currentValue && <p className="text-[11px] text-red-600 mt-1">{errors.currentValue}</p>}
              </div>
              
              <div>
                <Label htmlFor="operatingCost">Operating Cost (₦/hr)</Label>
                <Input
                  id="operatingCost"
                  type="number"
                  min="0"
                  value={formData.operatingCost || ''}
                  onChange={(e) => updateFormData('operatingCost', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="maintenanceCost">Annual Maintenance (₦)</Label>
                <Input
                  id="maintenanceCost"
                  type="number"
                  min="0"
                  value={formData.maintenanceCost || ''}
                  onChange={(e) => updateFormData('maintenanceCost', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Operational Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Operational Status</h3>
            
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="hoursUsed">Hours Used</Label>
                <Input
                  id="hoursUsed"
                  type="number"
                  min="0"
                  value={formData.hoursUsed || ''}
                  onChange={(e) => updateFormData('hoursUsed', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="fuelEfficiency">Fuel (L/hr)</Label>
                <Input
                  id="fuelEfficiency"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.fuelEfficiency || ''}
                  onChange={(e) => updateFormData('fuelEfficiency', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || 'operational'} onValueChange={(value) => updateFormData('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentStatusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition || 'excellent'} onValueChange={(value) => updateFormData('condition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentConditions.map(condition => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cost Analysis Alert */}
          {formData.purchasePrice && formData.purchasePrice > 0 && (
            <Alert className="border-amber-200 bg-amber-50/70">
              <div className="flex items-start gap-2">
                <Calculator className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <AlertDescription className="text-xs text-amber-900">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Asset Value Analysis:</strong>
                      <p className="mt-0.5 text-amber-800">
                        Purchase: {formatCurrency(formData.purchasePrice)} · Current: {formatCurrency(formData.currentValue || 0)}
                      </p>
                    </div>
                    <div>
                      <strong>Maintenance Interval:</strong>
                      <p className="mt-0.5 text-amber-800">
                        Next recommended routine inspection in 150 operating hours.
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            {equipment ? 'Update Equipment' : 'Add Equipment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
