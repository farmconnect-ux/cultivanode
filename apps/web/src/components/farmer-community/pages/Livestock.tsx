"use client";

import React from 'react';
import { DataTable } from '../DataTable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, Activity, MapPin, Calendar, TrendingUp } from 'lucide-react';

export function Livestock() {
  const livestockData = [
    {
      id: 'L001',
      tag: 'CTL-NG-001',
      type: 'Cattle',
      breed: 'White Fulani',
      age: 36,
      weight: 480,
      health: 'Healthy',
      location: 'Barn A - Feedlot',
      lastCheckup: '2026-09-28',
      vaccination: 'Up to date',
      productivity: 'High'
    },
    {
      id: 'L002',
      tag: 'SHP-NG-015',
      type: 'Sheep',
      breed: 'Yankasa',
      age: 18,
      weight: 65,
      health: 'Healthy',
      location: 'Pasture North',
      lastCheckup: '2026-09-20',
      vaccination: 'Due soon',
      productivity: 'Medium'
    },
    {
      id: 'L003',
      tag: 'CHK-NG-234',
      type: 'Poultry',
      breed: 'Noiler Dual Purpose',
      age: 6,
      weight: 2.8,
      health: 'Optimal',
      location: 'Pen 2 Alpha',
      lastCheckup: '2026-10-02',
      vaccination: 'Up to date',
      productivity: 'High'
    },
    {
      id: 'L004',
      tag: 'GT-NG-044',
      type: 'Goat',
      breed: 'Red Sokoto',
      age: 14,
      weight: 38,
      health: 'Healthy',
      location: 'Barn B',
      lastCheckup: '2026-09-15',
      vaccination: 'Up to date',
      productivity: 'High'
    }
  ];

  const columns = [
    {
      key: 'tag',
      label: 'Animal Tag',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-[11px]">{row.type} · {row.breed}</div>
        </div>
      )
    },
    {
      key: 'age',
      label: 'Age (months)',
      sortable: true
    },
    {
      key: 'weight',
      label: 'Weight (kg)',
      sortable: true
    },
    {
      key: 'health',
      label: 'Health Status',
      sortable: true,
      filterable: true
    },
    {
      key: 'location',
      label: 'Location / Pen',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-800">{value}</span>
        </div>
      )
    },
    {
      key: 'lastCheckup',
      label: 'Last Vet Visit',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-xs">{new Date(value).toLocaleDateString('en-NG')}</span>
        </div>
      )
    },
    {
      key: 'vaccination',
      label: 'Vaccination',
      filterable: true,
      render: (value: string) => (
        <Badge className={`text-[10px] ${
          value === 'Up to date' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {value}
        </Badge>
      )
    },
    {
      key: 'productivity',
      label: 'Productivity',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge className={`text-[10px] ${
          value === 'High' ? 'bg-green-100 text-green-800' :
          value === 'Medium' ? 'bg-amber-100 text-amber-800' :
          'bg-rose-100 text-rose-800'
        }`}>
          {value}
        </Badge>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Livestock & Herd Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track veterinary health records, feed rations, vaccines, and animal weights.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total Animals</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">2,673</p>
              <p className="text-[11px] text-green-700 mt-0.5">Across cattle, poultry & sheep</p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
              <Heart className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Healthy Rate</p>
              <p className="text-2xl font-bold text-green-700 mt-0.5">99.4%</p>
              <p className="text-[11px] text-green-700 mt-0.5">Verified health status</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Vaccine Due</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">15</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Scheduled this week</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Heart className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Growth Index</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">92%</p>
              <p className="text-[11px] text-blue-700 mt-0.5">Target weight trajectory</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Livestock Table */}
      <DataTable
        data={livestockData}
        columns={columns}
        title="Herd & Flock Registry"
        searchPlaceholder="Search tag, breed, pen..."
      />
    </div>
  );
}
