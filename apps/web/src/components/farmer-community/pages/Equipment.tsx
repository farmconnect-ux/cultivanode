"use client";

import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatCurrency, formatCurrencyCompact } from '../ui/currency-utils';
import { 
  Wrench, 
  Truck, 
  Calendar, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Plus, 
  Activity 
} from 'lucide-react';
import { EquipmentModal } from '../modals/EquipmentModal';

export function Equipment() {
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');

  const equipmentData = [
    {
      id: 'EQ001',
      name: 'Mahindra 8000 4WD',
      type: 'Tractor',
      category: 'Heavy Machinery',
      model: '8000',
      brand: 'Mahindra',
      year: 2022,
      serialNumber: 'MH8000-2022001',
      status: 'operational',
      location: 'Barn A',
      purchasePrice: 42000000,
      currentValue: 36500000,
      hoursUsed: 1245,
      fuelEfficiency: 18.5,
      lastMaintenance: '2026-08-15',
      nextMaintenance: '2026-10-15',
      maintenanceCost: 850000,
      operatingCost: 12500,
      condition: 'excellent'
    },
    {
      id: 'EQ002',
      name: 'Sonalika DI-750 III',
      type: 'Combine Harvester',
      category: 'Heavy Machinery',
      model: 'DI-750',
      brand: 'Sonalika',
      year: 2021,
      serialNumber: 'SL750001',
      status: 'operational',
      location: 'Field Storage B',
      purchasePrice: 65000000,
      currentValue: 52000000,
      hoursUsed: 890,
      fuelEfficiency: 24.0,
      lastMaintenance: '2026-08-01',
      nextMaintenance: '2026-10-25',
      maintenanceCost: 1450000,
      operatingCost: 18000,
      condition: 'good'
    },
    {
      id: 'EQ003',
      name: 'TAFE 45 DI Orchard',
      type: 'Tractor',
      category: 'Medium Machinery',
      model: '45 DI',
      brand: 'TAFE',
      year: 2020,
      serialNumber: 'TF450001',
      status: 'maintenance',
      location: 'Service Bay',
      purchasePrice: 28000000,
      currentValue: 21500000,
      hoursUsed: 2156,
      fuelEfficiency: 14.5,
      lastMaintenance: '2026-09-10',
      nextMaintenance: '2026-10-12',
      maintenanceCost: 920000,
      operatingCost: 9500,
      condition: 'fair'
    },
    {
      id: 'EQ004',
      name: 'Kubota MU4501 Utility',
      type: 'Utility Tractor',
      category: 'Medium Machinery',
      model: 'MU4501',
      brand: 'Kubota',
      year: 2023,
      serialNumber: 'KU4501001',
      status: 'operational',
      location: 'Greenhouse Area',
      purchasePrice: 32000000,
      currentValue: 29000000,
      hoursUsed: 756,
      fuelEfficiency: 11.2,
      lastMaintenance: '2026-09-20',
      nextMaintenance: '2026-11-20',
      maintenanceCost: 450000,
      operatingCost: 8200,
      condition: 'excellent'
    }
  ];

  const maintenanceData = [
    {
      id: 'M001',
      equipmentId: 'EQ001',
      equipmentName: 'Mahindra 8000 4WD',
      type: 'Scheduled',
      description: 'Engine oil filter change & hydraulic flush',
      scheduledDate: '2026-10-15',
      status: 'pending',
      technician: 'Rauf Aregbesola',
      estimatedCost: 185000,
      estimatedHours: 3
    },
    {
      id: 'M002',
      equipmentId: 'EQ003',
      equipmentName: 'TAFE 45 DI Orchard',
      type: 'Repair',
      description: 'Hydraulic lift valve overhaul',
      scheduledDate: '2026-10-12',
      status: 'in-progress',
      technician: 'Sunday Mechanics Crew',
      estimatedCost: 340000,
      estimatedHours: 6
    }
  ];

  const equipmentColumns = [
    {
      key: 'name',
      label: 'Machinery & Model',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-[11px]">{row.brand} {row.model} ({row.year})</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Category',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <Badge className="text-[10px] bg-green-100 text-green-800">
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-800">{value}</span>
        </div>
      )
    },
    {
      key: 'hoursUsed',
      label: 'Logged Hours',
      sortable: true,
      render: (value: number) => `${value.toLocaleString()} hrs`
    },
    {
      key: 'condition',
      label: 'Condition',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge className={`text-[10px] ${
          value === 'excellent' ? 'bg-green-100 text-green-800' :
          value === 'good' ? 'bg-blue-100 text-blue-800' :
          value === 'fair' ? 'bg-amber-100 text-amber-800' :
          'bg-rose-100 text-rose-800'
        }`}>
          {value}
        </Badge>
      )
    },
    {
      key: 'currentValue',
      label: 'Asset Value',
      sortable: true,
      render: (value: number) => formatCurrencyCompact(value)
    },
    {
      key: 'nextMaintenance',
      label: 'Next Service',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-xs">{new Date(value).toLocaleDateString('en-NG')}</span>
        </div>
      )
    }
  ];

  const maintenanceColumns = [
    {
      key: 'equipmentName',
      label: 'Equipment',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-[11px]">{row.equipmentId}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Service Type',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge className={`text-[10px] ${
          value === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {value}
        </Badge>
      )
    },
    {
      key: 'description',
      label: 'Scope of Work',
      render: (value: string) => <span className="text-xs text-gray-700">{value}</span>
    },
    {
      key: 'technician',
      label: 'Service Engineer',
      sortable: true
    },
    {
      key: 'estimatedCost',
      label: 'Estimated Cost',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true
    }
  ];

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Machinery & Farm Implements</h1>
          <p className="text-xs text-gray-500 mt-0.5">Asset registers, hours logged, service intervals and maintenance cost tracking.</p>
        </div>
        <Button 
          onClick={() => setShowAddEquipment(true)}
          className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Equipment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Fleet Units</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{equipmentData.length}</p>
              <p className="text-[11px] text-green-700 mt-0.5">3 operational</p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Fleet Valuation</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {formatCurrencyCompact(equipmentData.reduce((s, e) => s + e.currentValue, 0))}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">Depreciated asset value</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">In Maintenance</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">1</p>
              <p className="text-[11px] text-amber-700 mt-0.5">TAFE 45 DI at Bay</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Wrench className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Hours Logged</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {equipmentData.reduce((s, e) => s + e.hoursUsed, 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Operating hours</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 text-gray-700">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Fleet Register</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <DataTable
            data={equipmentData}
            columns={equipmentColumns}
            title="Registered Tractors & Heavy Implements"
            searchPlaceholder="Search machine by brand, model, location..."
            onAdd={() => setShowAddEquipment(true)}
          />
        </TabsContent>

        <TabsContent value="maintenance">
          <DataTable
            data={maintenanceData}
            columns={maintenanceColumns}
            title="Scheduled & Active Workshop Maintenance"
            searchPlaceholder="Search maintenance task..."
          />
        </TabsContent>
      </Tabs>

      {showAddEquipment && (
        <EquipmentModal
          equipment={editingEquipment}
          onClose={() => {
            setShowAddEquipment(false);
            setEditingEquipment(null);
          }}
        />
      )}
    </div>
  );
}
