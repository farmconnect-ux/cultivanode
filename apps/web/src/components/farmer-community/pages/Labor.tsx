"use client";

import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatCurrency, formatCurrencyCompact } from '../ui/currency-utils';
import { 
  Users, 
  Clock, 
  DollarSign, 
  UserPlus, 
  TrendingUp, 
  MapPin, 
  Timer, 
  Wrench 
} from 'lucide-react';
import { LaborModal } from '../modals/LaborModal';
import { TimeTrackingModal } from '../modals/TimeTrackingModal';

export function Labor() {
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showTimeTracking, setShowTimeTracking] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [activeTab, setActiveTab] = useState('personnel');

  const personnelData = [
    {
      id: 'P001',
      name: 'Ibrahim Musa',
      type: 'hired',
      role: 'Farm Lead / Agronomist',
      specialization: 'Crop Management',
      hourlyRate: 2500,
      hoursThisWeek: 42,
      hoursThisMonth: 168,
      phone: '08023456789',
      email: 'ibrahim.m@cultivanode.ng',
      status: 'active',
      startDate: '2024-03-15',
      location: 'Field A',
      overtime: 2,
      weeklyCost: 105000,
      monthlyCost: 420000
    },
    {
      id: 'P002',
      name: 'Emmanuel Eze',
      type: 'own',
      role: 'Heavy Machinery Operator',
      specialization: 'Heavy Machinery',
      hourlyRate: 3200,
      hoursThisWeek: 40,
      hoursThisMonth: 160,
      phone: '08034567890',
      email: 'emmanuel.e@cultivanode.ng',
      status: 'active',
      startDate: '2023-06-10',
      location: 'Service Bay',
      overtime: 0,
      weeklyCost: 128000,
      monthlyCost: 512000
    },
    {
      id: 'P003',
      name: 'Blessing Adeyemi',
      type: 'hired',
      role: 'Livestock Care Specialist',
      specialization: 'Animal Care',
      hourlyRate: 2800,
      hoursThisWeek: 45,
      hoursThisMonth: 180,
      phone: '08045678901',
      email: 'blessing.a@cultivanode.ng',
      status: 'active',
      startDate: '2024-01-20',
      location: 'Barn A',
      overtime: 5,
      weeklyCost: 133000,
      monthlyCost: 532000
    },
    {
      id: 'P004',
      name: 'Fatima Abubakar',
      type: 'hired',
      role: 'Irrigation & Nursery Tech',
      specialization: 'Irrigation Systems',
      hourlyRate: 2200,
      hoursThisWeek: 38,
      hoursThisMonth: 152,
      phone: '08056789012',
      email: 'fatima.a@cultivanode.ng',
      status: 'active',
      startDate: '2024-05-05',
      location: 'Greenhouse Alpha',
      overtime: 0,
      weeklyCost: 83600,
      monthlyCost: 334400
    }
  ];

  const machineryUsageData = [
    {
      id: 'MU001',
      equipmentId: 'EQ001',
      equipmentName: 'Mahindra 8000 4WD',
      operator: 'Emmanuel Eze',
      date: '2026-10-06',
      totalHours: 8,
      field: 'Field A - Zone 1',
      task: 'Deep Ploughing',
      fuelUsed: 48.5,
      totalCost: 125600,
      efficiency: 'Optimal'
    },
    {
      id: 'MU002',
      equipmentId: 'EQ002',
      equipmentName: 'Sonalika DI-750 III',
      operator: 'Emmanuel Eze',
      date: '2026-10-04',
      totalHours: 6,
      field: 'Field C - Grain Plot',
      task: 'Combine Harvesting',
      fuelUsed: 52.0,
      totalCost: 148000,
      efficiency: 'Good'
    }
  ];

  const personnelColumns = [
    {
      key: 'name',
      label: 'Worker Name',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-[11px]">{row.role}</div>
        </div>
      )
    },
    {
      key: 'specialization',
      label: 'Specialization',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge className="text-[10px] bg-green-100 text-green-800">{value}</Badge>
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
      label: 'Field / Station',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-800">{value}</span>
        </div>
      )
    },
    {
      key: 'hourlyRate',
      label: 'Rate / hr',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'hoursThisWeek',
      label: 'Hours Logged',
      sortable: true,
      render: (value: number) => `${value} hrs/wk`
    },
    {
      key: 'weeklyCost',
      label: 'Weekly Cost',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    }
  ];

  const machineryUsageColumns = [
    {
      key: 'equipmentName',
      label: 'Implement',
      sortable: true
    },
    {
      key: 'operator',
      label: 'Operator',
      sortable: true
    },
    {
      key: 'task',
      label: 'Operational Task',
      sortable: true
    },
    {
      key: 'field',
      label: 'Field / Plot',
      sortable: true
    },
    {
      key: 'totalHours',
      label: 'Operating Hours',
      sortable: true,
      render: (value: number) => `${value} hrs`
    },
    {
      key: 'fuelUsed',
      label: 'Diesel Used',
      sortable: true,
      render: (value: number) => `${value} L`
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    }
  ];

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Labor & Farm Workforce</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage agricultural staff, tractor operators, time tracking and payroll disbursements.</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowTimeTracking(true)}
            variant="outline"
            className="text-xs"
          >
            <Timer className="h-4 w-4 mr-1 text-blue-600" />
            Time Tracking
          </Button>
          <Button 
            onClick={() => setShowAddWorker(true)}
            className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Worker
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{personnelData.length}</p>
              <p className="text-[11px] text-green-700 mt-0.5">All verified operators</p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Weekly Payroll</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {formatCurrencyCompact(personnelData.reduce((s, p) => s + p.weeklyCost, 0))}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">Disbursed via platform ledger</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Hours Logged</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {personnelData.reduce((s, p) => s + p.hoursThisWeek, 0)} hrs
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">This work week</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 text-gray-700">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Machinery Ops</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">14 hrs</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Tractor field hours</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Wrench className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="personnel">Workforce Roster</TabsTrigger>
          <TabsTrigger value="machinery">Tractor & Implement Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="personnel">
          <DataTable
            data={personnelData}
            columns={personnelColumns}
            title="Farm Personnel & Field Labor"
            searchPlaceholder="Search workers by name, role, field..."
            onAdd={() => setShowAddWorker(true)}
          />
        </TabsContent>

        <TabsContent value="machinery">
          <DataTable
            data={machineryUsageData}
            columns={machineryUsageColumns}
            title="Daily Operator & Machine Runtime Log"
            searchPlaceholder="Search operation logs..."
          />
        </TabsContent>
      </Tabs>

      {showAddWorker && (
        <LaborModal
          worker={editingWorker}
          onClose={() => {
            setShowAddWorker(false);
            setEditingWorker(null);
          }}
        />
      )}

      {showTimeTracking && (
        <TimeTrackingModal
          onClose={() => setShowTimeTracking(false)}
        />
      )}
    </div>
  );
}
