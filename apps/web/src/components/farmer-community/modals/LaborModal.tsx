import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../ui/currency-utils';
import { Users } from 'lucide-react';
import { 
  workerTypes, 
  workerRoles, 
  specializations, 
  availableSkills, 
  statusOptions 
} from './labor-constants';
import { 
  Worker, 
  validateWorkerForm, 
  calculateAnnualCost, 
  getDefaultWorkerData 
} from './labor-helpers';

interface LaborModalProps {
  worker?: Worker | null;
  onClose: () => void;
}

export function LaborModal({ worker, onClose }: LaborModalProps) {
  const [formData, setFormData] = useState<Partial<Worker>>(getDefaultWorkerData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (worker) {
      setFormData(worker);
      setSelectedSkills(worker.skills || []);
    }
  }, [worker]);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const toggleSkill = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    
    setSelectedSkills(newSkills);
    updateFormData('skills', newSkills);
  };

  const handleSubmit = () => {
    const validationErrors = validateWorkerForm(formData);
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
            <Users className="h-5 w-5 text-green-700" />
            <span>{worker ? 'Edit Personnel' : 'Add New Farm Worker'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ibrahim Musa"
                  value={formData.name || ''}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="type">Worker Type *</Label>
                <Select value={formData.type || 'hired'} onValueChange={(value) => updateFormData('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workerTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role">Job Role *</Label>
                <Select value={formData.role || ''} onValueChange={(value) => updateFormData('role', value)}>
                  <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {workerRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-[11px] text-red-600 mt-1">{errors.role}</p>}
              </div>
              
              <div>
                <Label htmlFor="specialization">Specialization *</Label>
                <Select value={formData.specialization || ''} onValueChange={(value) => updateFormData('specialization', value)}>
                  <SelectTrigger className={errors.specialization ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map(spec => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.specialization && <p className="text-[11px] text-red-600 mt-1">{errors.specialization}</p>}
              </div>
              
              <div>
                <Label htmlFor="hourlyRate">Daily / Hourly Rate (₦) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => updateFormData('hourlyRate', parseFloat(e.target.value) || 0)}
                  className={errors.hourlyRate ? 'border-red-500' : ''}
                />
                {errors.hourlyRate && <p className="text-[11px] text-red-600 mt-1">{errors.hourlyRate}</p>}
                {Boolean(formData.hourlyRate && formData.hourlyRate > 0) && (
                  <p className="text-[11px] text-green-700 mt-1">
                    Est. Annual: {formatCurrency(calculateAnnualCost(formData.hourlyRate || 0))}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || 'active'} onValueChange={(value) => updateFormData('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Contact Information</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="08012345678"
                  value={formData.phone || ''}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="worker@farm.ng"
                  value={formData.email || ''}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <Label htmlFor="location">Assigned Field / Station *</Label>
                <Input
                  id="location"
                  placeholder="Field A - Grain Zone"
                  value={formData.location || ''}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-[11px] text-red-600 mt-1">{errors.location}</p>}
              </div>
              
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Skills & Certifications</h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {availableSkills.map(skill => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-green-700 text-white border-green-700 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} size="sm" className="bg-green-700 hover:bg-green-800 text-white">
            {worker ? 'Update Worker' : 'Add Worker'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
