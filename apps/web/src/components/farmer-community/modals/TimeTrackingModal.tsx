import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { formatCurrency } from '../ui/currency-utils';
import { Timer, Clock } from 'lucide-react';

interface TimeTrackingModalProps {
  onClose: () => void;
}

export function TimeTrackingModal({ onClose }: TimeTrackingModalProps) {
  const [formData, setFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '08:00',
    clockOut: '17:00',
    breakTime: 1,
    task: 'Field Preparation',
    location: 'Field A - Zone 1',
    notes: '',
    equipment: 'Mahindra 8000',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const workers = [
    { id: 'P001', name: 'Ibrahim Musa', rate: 2500 },
    { id: 'P002', name: 'Emmanuel Eze', rate: 3200 },
    { id: 'P003', name: 'Blessing Adeyemi', rate: 2800 },
    { id: 'P004', name: 'Fatima Abubakar', rate: 2200 },
  ];

  const tasks = [
    'Crop Cultivation',
    'Equipment Operation',
    'Livestock Care',
    'Irrigation Setup',
    'Harvest Operations',
    'Field Preparation',
    'Equipment Maintenance',
    'Pest & Spray Application',
    'General Farm Labor'
  ];

  const locations = [
    'Field A - Zone 1',
    'Field A - Zone 2',
    'Field B - Cassava Hub',
    'Field C - Grain Plot',
    'Barn A',
    'Service Bay',
    'Greenhouse Alpha',
    'Pasture North'
  ];

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const calculateHours = () => {
    if (formData.clockIn && formData.clockOut) {
      const start = new Date(`2026-01-01T${formData.clockIn}`);
      const end = new Date(`2026-01-01T${formData.clockOut}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.max(0, diffHours - (formData.breakTime || 0));
    }
    return 0;
  };

  const calculateCost = () => {
    const selectedWorker = workers.find(w => w.id === formData.workerId);
    if (selectedWorker) {
      const totalHours = calculateHours();
      return totalHours * selectedWorker.rate;
    }
    return 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.workerId) newErrors.workerId = 'Please select a worker';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.clockIn) newErrors.clockIn = 'Clock in time is required';
    if (!formData.clockOut) newErrors.clockOut = 'Clock out time is required';
    if (!formData.task) newErrors.task = 'Task is required';
    if (!formData.location) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onClose();
    }
  };

  const totalHours = calculateHours();
  const cost = calculateCost();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center space-x-2">
            <Timer className="h-5 w-5 text-blue-700" />
            <span>Farm Labour Time Tracking</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="workerId">Farm Worker *</Label>
              <Select value={formData.workerId} onValueChange={(val) => updateFormData('workerId', val)}>
                <SelectTrigger className={errors.workerId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.rate)}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.workerId && <p className="text-[11px] text-red-600 mt-1">{errors.workerId}</p>}
            </div>

            <div>
              <Label htmlFor="date">Work Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData('date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="clockIn">Clock In</Label>
              <Input
                id="clockIn"
                type="time"
                value={formData.clockIn}
                onChange={(e) => updateFormData('clockIn', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="clockOut">Clock Out</Label>
              <Input
                id="clockOut"
                type="time"
                value={formData.clockOut}
                onChange={(e) => updateFormData('clockOut', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="task">Task Performed *</Label>
              <Select value={formData.task} onValueChange={(val) => updateFormData('task', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Field / Plot *</Label>
              <Select value={formData.location} onValueChange={(val) => updateFormData('location', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-700">Effective Logged Time: <strong>{totalHours.toFixed(1)} hrs</strong></span>
            </div>
            <span className="text-xs font-semibold text-green-800">Labour Cost: {formatCurrency(cost)}</span>
          </div>

          <div>
            <Label htmlFor="notes">Notes / Observations</Label>
            <Textarea
              id="notes"
              placeholder="Fuel used, area covered, equipment issues..."
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} size="sm" className="bg-green-700 hover:bg-green-800 text-white">
            Save Log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
