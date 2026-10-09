"use client";

import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { MapPin, Users, Wheat, TrendingUp } from 'lucide-react';
import { FarmModal } from '../modals/FarmModal';
import { formatCurrencyCompact } from '../ui/currency-utils';

export function Farms() {
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any>(null);

  const farmsData = [
    {
      id: 1,
      name: 'Oyo Agrohub Valley',
      location: 'Ibadan, Oyo State',
      size: 145.5,
      manager: 'Ibrahim Musa',
      crops: ['Maize', 'Cassava', 'Soybeans'],
      livestock: 85,
      status: 'active',
      revenue: 28500000,
      lastInspection: '2026-09-15'
    },
    {
      id: 2,
      name: 'Sunrise Estates & Plots',
      location: 'Abeokuta, Ogun State',
      size: 89.2,
      manager: 'Adebayo Ogunlesi',
      crops: ['Yam', 'Cassava'],
      livestock: 45,
      status: 'active',
      revenue: 16800000,
      lastInspection: '2026-09-22'
    },
    {
      id: 3,
      name: 'Savannah Grain Ranch',
      location: 'Zaria, Kaduna State',
      size: 234.8,
      manager: 'Usman Danladi',
      crops: ['Sorghum', 'Soybeans'],
      livestock: 156,
      status: 'active',
      revenue: 42000000,
      lastInspection: '2026-08-30'
    },
    {
      id: 4,
      name: 'Benue Food Basket Plot',
      location: 'Makurdi, Benue State',
      size: 78.3,
      manager: 'Terrence Iorfa',
      crops: ['Yam', 'Soybeans'],
      livestock: 23,
      status: 'active',
      revenue: 14200000,
      lastInspection: '2026-09-18'
    },
    {
      id: 5,
      name: 'Osun Organic Orchard',
      location: 'Osogbo, Osun State',
      size: 56.7,
      manager: 'Folashade Adeleke',
      crops: ['Oil Palm', 'Vegetables'],
      livestock: 0,
      status: 'active',
      revenue: 19500000,
      lastInspection: '2026-10-01'
    }
  ];

  const columns = [
    {
      key: 'name',
      label: 'Farm Name',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-[11px] flex items-center mt-0.5">
            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
            {row.location}
          </div>
        </div>
      )
    },
    {
      key: 'size',
      label: 'Area (ha)',
      sortable: true,
      render: (value: number) => `${value} ha`
    },
    {
      key: 'manager',
      label: 'Supervisor',
      sortable: true,
      filterable: true
    },
    {
      key: 'crops',
      label: 'Crops',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map(crop => (
            <Badge key={crop} variant="secondary" className="text-[10px] bg-green-100 text-green-800">
              {crop}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="secondary" className="text-[10px]">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'livestock',
      label: 'Livestock',
      sortable: true,
      render: (value: number) => value > 0 ? `${value} head` : 'None'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true
    },
    {
      key: 'revenue',
      label: 'Season Revenue',
      sortable: true,
      render: (value: number) => formatCurrencyCompact(value)
    },
    {
      key: 'lastInspection',
      label: 'Inspected',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-NG')
    }
  ];

  const totalStats = {
    totalFarms: farmsData.length,
    totalArea: farmsData.reduce((sum, farm) => sum + farm.size, 0),
    totalRevenue: farmsData.reduce((sum, farm) => sum + farm.revenue, 0),
    activeFarms: farmsData.filter(farm => farm.status === 'active').length
  };

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Farms & Field Holdings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage agricultural estates, field boundaries, and farm supervisors.</p>
        </div>
        <Button 
          onClick={() => setShowAddFarm(true)}
          className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold"
        >
          Add New Farm
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total Farms</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalStats.totalFarms}</p>
              <p className="text-[11px] text-green-700 mt-0.5">{totalStats.activeFarms} active operations</p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total Area</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalStats.totalArea.toFixed(1)} ha</p>
              <p className="text-[11px] text-blue-700 mt-0.5">Across all agricultural zones</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Wheat className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Season Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrencyCompact(totalStats.totalRevenue)}</p>
              <p className="text-[11px] text-green-700 mt-0.5">Verified off-taker ledger</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Avg Farm Size</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{(totalStats.totalArea / totalStats.totalFarms).toFixed(1)} ha</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Per operational estate</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 text-gray-700">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Farms Table */}
      <DataTable
        data={farmsData}
        columns={columns}
        title="All Registered Farm Properties"
        searchPlaceholder="Search farms by name, state, supervisor..."
        onAdd={() => setShowAddFarm(true)}
        onEdit={(farm) => setEditingFarm(farm)}
        onDelete={(farm) => console.log('Delete farm:', farm)}
      />

      {/* Add/Edit Farm Modal */}
      {(showAddFarm || editingFarm) && (
        <FarmModal
          farm={editingFarm}
          onClose={() => {
            setShowAddFarm(false);
            setEditingFarm(null);
          }}
        />
      )}
    </div>
  );
}
