"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { formatCurrency } from '../ui/currency-utils';
import { DollarSign, Calculator } from 'lucide-react';

interface Sale {
  id?: string;
  saleDate: string;
  crop: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalRevenue: number;
  buyer: string;
  buyerContact: string;
  contractType: string;
  paymentStatus: string;
  paymentDate: string;
  field: string;
  qualityGrade: string;
  moistureContent: number;
  proteinContent: number;
  transportCost: number;
  commissionFee: number;
  netRevenue: number;
  costOfProduction: number;
  grossProfit: number;
  profitMargin: number;
  notes: string;
}

interface SaleModalProps {
  sale?: Sale | null;
  onClose: () => void;
}

const crops = [
  { name: 'Maize', varieties: ['OBA Super 9', 'SAMMAZ 15', 'SC 719', 'White Maize'] },
  { name: 'Cassava', varieties: ['TMS 30572', 'TME 419', 'Yellow Cassava', 'NR 8082'] },
  { name: 'Soybeans', varieties: ['TGX 1448-2E', 'TGX 1987-10F', 'SAMNUT 24'] },
  { name: 'Yam', varieties: ['White Yam (Heda)', 'Yellow Yam', 'Water Yam'] },
  { name: 'Sorghum', varieties: ['SAMSORG 45', 'SAMSORG 17', 'SK 5912'] },
  { name: 'Rice', varieties: ['FARO 44', 'FARO 52', 'Japonica', 'NERICA 1'] }
];

const contractTypes = ['Spot Sale', 'Forward Contract', 'Premium Contract', 'Direct Sale', 'Aggregator Contract'];
const qualityGrades = ['Premium', 'Export Grade', 'Standard', 'Feed Grade', 'Commercial'];
const units = ['bags (100kg)', 'tonnes', 'kg', 'truckloads'];

export function SaleModal({ sale, onClose }: SaleModalProps) {
  const [formData, setFormData] = useState<Partial<Sale>>({
    saleDate: new Date().toISOString().split('T')[0],
    crop: '',
    variety: '',
    quantity: 0,
    unit: 'bags (100kg)',
    pricePerUnit: 0,
    totalRevenue: 0,
    buyer: '',
    buyerContact: '',
    contractType: 'Spot Sale',
    paymentStatus: 'pending',
    paymentDate: '',
    field: '',
    qualityGrade: 'Standard',
    moistureContent: 0,
    proteinContent: 0,
    transportCost: 0,
    commissionFee: 0,
    netRevenue: 0,
    costOfProduction: 0,
    grossProfit: 0,
    profitMargin: 0,
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sale) {
      setFormData(sale);
    }
  }, [sale]);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      
      if (key === 'quantity' || key === 'pricePerUnit') {
        updated.totalRevenue = (updated.quantity || 0) * (updated.pricePerUnit || 0);
      }
      
      if (key === 'totalRevenue' || key === 'transportCost' || key === 'commissionFee') {
        const totalRev = updated.totalRevenue || 0;
        const transport = updated.transportCost || 0;
        const commission = updated.commissionFee || 0;
        updated.netRevenue = totalRev - transport - commission;
      }
      
      if (key === 'netRevenue' || key === 'costOfProduction') {
        const netRev = updated.netRevenue || 0;
        const cost = updated.costOfProduction || 0;
        updated.grossProfit = netRev - cost;
        updated.profitMargin = netRev > 0 ? (updated.grossProfit / netRev) * 100 : 0;
      }
      
      return updated;
    });
    
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.saleDate) newErrors.saleDate = 'Sale date is required';
    if (!formData.crop) newErrors.crop = 'Crop type is required';
    if (!formData.variety) newErrors.variety = 'Variety is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.pricePerUnit || formData.pricePerUnit <= 0) newErrors.pricePerUnit = 'Price per unit must be greater than 0';
    if (!formData.buyer?.trim()) newErrors.buyer = 'Buyer name is required';
    if (!formData.buyerContact?.trim()) newErrors.buyerContact = 'Buyer contact is required';
    if (!formData.field) newErrors.field = 'Field is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onClose();
    }
  };

  const getVarietiesForCrop = (cropName: string) => {
    const crop = crops.find(c => c.name === cropName);
    return crop ? crop.varieties : [];
  };

  const selectedCropVarieties = getVarietiesForCrop(formData.crop || '');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-700" />
            <span>{sale ? 'Edit Sale Record' : 'Record New Produce Sale'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Basic Sale Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Sale Details</h3>
            
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="saleDate">Sale Date *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate || ''}
                  onChange={(e) => updateFormData('saleDate', e.target.value)}
                  className={errors.saleDate ? 'border-red-500' : ''}
                />
                {errors.saleDate && <p className="text-[11px] text-red-600 mt-1">{errors.saleDate}</p>}
              </div>
              
              <div>
                <Label htmlFor="crop">Crop Type *</Label>
                <Select value={formData.crop || ''} onValueChange={(value) => {
                  updateFormData('crop', value);
                  updateFormData('variety', '');
                }}>
                  <SelectTrigger className={errors.crop ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {crops.map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.crop && <p className="text-[11px] text-red-600 mt-1">{errors.crop}</p>}
              </div>
              
              <div>
                <Label htmlFor="variety">Variety *</Label>
                <Select 
                  value={formData.variety || ''} 
                  onValueChange={(value) => updateFormData('variety', value)}
                >
                  <SelectTrigger className={errors.variety ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select variety" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCropVarieties.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.variety && <p className="text-[11px] text-red-600 mt-1">{errors.variety}</p>}
              </div>
              
              <div>
                <Label htmlFor="field">Source Field / Plot *</Label>
                <Input
                  id="field"
                  placeholder="e.g. Field A – Zone 1"
                  value={formData.field || ''}
                  onChange={(e) => updateFormData('field', e.target.value)}
                  className={errors.field ? 'border-red-500' : ''}
                />
                {errors.field && <p className="text-[11px] text-red-600 mt-1">{errors.field}</p>}
              </div>
            </div>
          </div>

          {/* Quantity and Pricing */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Quantity & Pricing</h3>
            
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity || ''}
                  onChange={(e) => updateFormData('quantity', parseFloat(e.target.value) || 0)}
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && <p className="text-[11px] text-red-600 mt-1">{errors.quantity}</p>}
              </div>
              
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit || 'bags (100kg)'} onValueChange={(value) => updateFormData('unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pricePerUnit">Price per {formData.unit} (₦) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.pricePerUnit || ''}
                  onChange={(e) => updateFormData('pricePerUnit', parseFloat(e.target.value) || 0)}
                  className={errors.pricePerUnit ? 'border-red-500' : ''}
                />
                {errors.pricePerUnit && <p className="text-[11px] text-red-600 mt-1">{errors.pricePerUnit}</p>}
              </div>
              
              <div>
                <Label htmlFor="totalRevenue">Total Revenue (₦)</Label>
                <Input
                  id="totalRevenue"
                  type="text"
                  value={formatCurrency(formData.totalRevenue || 0)}
                  readOnly
                  className="bg-gray-50 font-semibold text-green-800"
                />
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Buyer Information</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="buyer">Buyer / Off-taker Name *</Label>
                <Input
                  id="buyer"
                  placeholder="e.g. Grand Cereals Kano"
                  value={formData.buyer || ''}
                  onChange={(e) => updateFormData('buyer', e.target.value)}
                  className={errors.buyer ? 'border-red-500' : ''}
                />
                {errors.buyer && <p className="text-[11px] text-red-600 mt-1">{errors.buyer}</p>}
              </div>
              
              <div>
                <Label htmlFor="buyerContact">Buyer Contact (Phone) *</Label>
                <Input
                  id="buyerContact"
                  placeholder="08098765432"
                  value={formData.buyerContact || ''}
                  onChange={(e) => updateFormData('buyerContact', e.target.value)}
                  className={errors.buyerContact ? 'border-red-500' : ''}
                />
                {errors.buyerContact && <p className="text-[11px] text-red-600 mt-1">{errors.buyerContact}</p>}
              </div>
              
              <div>
                <Label htmlFor="contractType">Contract Type</Label>
                <Select value={formData.contractType || 'Spot Sale'} onValueChange={(value) => updateFormData('contractType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quality and Payment */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1">Quality & Settlement</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="qualityGrade">Quality Grade</Label>
                <Select value={formData.qualityGrade || 'Standard'} onValueChange={(value) => updateFormData('qualityGrade', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityGrades.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="moistureContent">Moisture Content (%)</Label>
                <Input
                  id="moistureContent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.moistureContent || ''}
                  onChange={(e) => updateFormData('moistureContent', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={formData.paymentStatus || 'pending'} onValueChange={(value) => updateFormData('paymentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid (In Ledger)</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Logistics & Settlement Notes</Label>
            <Textarea
              id="notes"
              placeholder="Delivery terms, weighbridge ticket number, escrow reference..."
              value={formData.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              rows={2}
            />
          </div>

          {/* Financial Summary Alert */}
          {Boolean(formData.totalRevenue && formData.totalRevenue > 0) && (
            <Alert className="border-green-200 bg-green-50/70">
              <div className="flex items-start gap-2">
                <Calculator className="h-4 w-4 text-green-700 shrink-0 mt-0.5" />
                <AlertDescription className="text-xs text-green-900">
                  <strong>Sale Summary:</strong> Total Gross Revenue of {formatCurrency(formData.totalRevenue || 0)} for {formData.quantity} {formData.unit} at {formatCurrency(formData.pricePerUnit || 0)} per unit.
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} size="sm" className="bg-green-700 hover:bg-green-800 text-white">
            {sale ? 'Update Sale' : 'Record Sale'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
