"use client";

import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Wheat, Droplets, Thermometer, TrendingUp, Calendar, MapPin, CheckSquare, Clock, AlertTriangle, Sprout } from 'lucide-react';

export function Crops() {
  const cropsData = [
    {
      id: 'C001',
      name: 'Maize',
      variety: 'OBA Super 9',
      field: 'Field A - Zone 1',
      area: 25.5,
      plantedDate: '2026-04-15',
      expectedHarvest: '2026-09-15',
      currentStage: 'Flowering',
      health: 'Good',
      yieldEstimate: 3200,
      soilMoisture: 45,
      temperature: 28,
      lastWatered: '2026-10-06'
    },
    {
      id: 'C002',
      name: 'Cassava',
      variety: 'TMS 30572',
      field: 'Field B - Zone 1',
      area: 35.2,
      plantedDate: '2026-03-20',
      expectedHarvest: '2027-03-20',
      currentStage: 'Bulking',
      health: 'Excellent',
      yieldEstimate: 18000,
      soilMoisture: 38,
      temperature: 30,
      lastWatered: '2026-10-05'
    },
    {
      id: 'C003',
      name: 'Sorghum',
      variety: 'SAMSORG 45',
      field: 'Field A - Zone 2',
      area: 18.7,
      plantedDate: '2026-05-10',
      expectedHarvest: '2026-11-10',
      currentStage: 'Grain Fill',
      health: 'Fair',
      yieldEstimate: 2800,
      soilMoisture: 32,
      temperature: 29,
      lastWatered: '2026-10-04'
    },
    {
      id: 'C004',
      name: 'Groundnut',
      variety: 'SAMNUT 24',
      field: 'Field C - Zone 1',
      area: 12.4,
      plantedDate: '2026-06-01',
      expectedHarvest: '2026-10-01',
      currentStage: 'Pod Development',
      health: 'Good',
      yieldEstimate: 1800,
      soilMoisture: 42,
      temperature: 27,
      lastWatered: '2026-10-03'
    }
  ];

  const upcomingTasks = [
    {
      id: 'T001',
      task: 'Drip Irrigation Schedule',
      field: 'Field A - Zone 1',
      crop: 'Maize',
      dueDate: '2026-10-10',
      priority: 'high',
      type: 'irrigation',
      assignedTo: 'Emeka Okafor',
      notes: 'Soil moisture below 40% threshold. Apply 25mm water.'
    },
    {
      id: 'T002',
      task: 'NPK Fertilizer Top-Dress',
      field: 'Field B - Zone 1',
      crop: 'Cassava',
      dueDate: '2026-10-12',
      priority: 'medium',
      type: 'fertilization',
      assignedTo: 'Chidi Nwosu',
      notes: 'Apply NPK 20-10-10 at 200kg/ha for bulking stage.'
    },
    {
      id: 'T003',
      task: 'Stem Borer & Pest Scouting',
      field: 'Field A - Zone 2',
      crop: 'Sorghum',
      dueDate: '2026-10-11',
      priority: 'high',
      type: 'pest-control',
      assignedTo: 'Adamu Musa',
      notes: 'Inspect whorl leaves for signs of infestation. Log threshold in scout registry.'
    },
    {
      id: 'T004',
      task: 'Selective Weeding',
      field: 'Field C - Zone 1',
      crop: 'Groundnut',
      dueDate: '2026-10-15',
      priority: 'medium',
      type: 'weeding',
      assignedTo: 'Fatima Bello',
      notes: 'Manual weeding required around pegging zone.'
    },
    {
      id: 'T005',
      task: 'Combine Harvester Prep',
      field: 'Field A - Zone 1',
      crop: 'Maize',
      dueDate: '2026-10-18',
      priority: 'low',
      type: 'harvest',
      assignedTo: 'Emeka Okafor',
      notes: 'Service harvester cutter-bar. Verify moisture is below 14%.'
    },
    {
      id: 'T006',
      task: 'Soil Core Nutrient Sampling',
      field: 'Field B - Zone 1',
      crop: 'Cassava',
      dueDate: '2026-10-20',
      priority: 'low',
      type: 'soil-test',
      assignedTo: 'Chidi Nwosu',
      notes: 'Sample top 30cm soil for post-harvest nitrogen & potassium profile.'
    }
  ];

  const taskTypeConfig: Record<string, { color: string; icon: React.ElementType }> = {
    irrigation: { color: 'bg-blue-100 text-blue-800', icon: Droplets },
    fertilization: { color: 'bg-green-100 text-green-800', icon: Sprout },
    'pest-control': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    weeding: { color: 'bg-yellow-100 text-yellow-800', icon: Wheat },
    harvest: { color: 'bg-orange-100 text-orange-800', icon: CheckSquare },
    'soil-test': { color: 'bg-purple-100 text-purple-800', icon: MapPin }
  };

  const priorityConfig: Record<string, string> = {
    high: 'bg-rose-100 text-rose-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-gray-100 text-gray-700'
  };

  const columns = [
    {
      key: 'name',
      label: 'Crop & Variety',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-[11px]">{row.variety}</div>
        </div>
      )
    },
    {
      key: 'field',
      label: 'Plot & Area',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-800">{value}</span>
          </div>
          <div className="text-gray-500 text-[11px]">{row.area} ha</div>
        </div>
      )
    },
    {
      key: 'currentStage',
      label: 'Growth Stage',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge className="text-[10px] bg-green-100 text-green-800">{value}</Badge>
      )
    },
    {
      key: 'health',
      label: 'Canopy Health',
      sortable: true,
      filterable: true
    },
    {
      key: 'soilMoisture',
      label: 'Soil Moisture',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-1.5">
          <Droplets className="h-3 w-3 text-blue-500" />
          <span className="text-xs font-medium text-gray-800">{value}%</span>
        </div>
      )
    },
    {
      key: 'temperature',
      label: 'Root Temperature',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-1.5">
          <Thermometer className="h-3 w-3 text-rose-500" />
          <span className="text-xs font-medium text-gray-800">{value}°C</span>
        </div>
      )
    },
    {
      key: 'yieldEstimate',
      label: 'Yield Forecast',
      sortable: true,
      render: (value: number) => `${value.toLocaleString()} kg/ha`
    },
    {
      key: 'expectedHarvest',
      label: 'Expected Harvest',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-xs">{new Date(value).toLocaleDateString('en-NG')}</span>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Crops & Field Cycles</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track vegetative growth stages, root moisture telemetry, and agronomist tasks.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Active Plots</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">4</p>
              <p className="text-[11px] text-green-700 mt-0.5">91.8 hectares seeded</p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Avg Yield Forecast</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">6,450</p>
              <p className="text-[11px] text-blue-700 mt-0.5">kg/ha across cycles</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Avg Moisture</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">39%</p>
              <p className="text-[11px] text-blue-700 mt-0.5">Optimal root profile</p>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700">
              <Droplets className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{upcomingTasks.length}</p>
              <p className="text-[11px] text-rose-700 mt-0.5">2 high priority</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <CheckSquare className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Tasks Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-4 w-4 text-green-700" />
            <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Crop Operations & Field Schedule</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingTasks.map((task) => {
            const typeConf = taskTypeConfig[task.type] || { color: 'bg-gray-100 text-gray-700', icon: CheckSquare };
            const TaskIcon = typeConf.icon;

            return (
              <div
                key={task.id}
                className={`border rounded-xl p-3 space-y-2 ${
                  task.priority === 'high' ? 'border-rose-200 bg-rose-50/20' :
                  task.priority === 'medium' ? 'border-amber-200 bg-amber-50/20' :
                  'border-gray-200 bg-gray-50/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${typeConf.color}`}>
                      <TaskIcon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{task.task}</p>
                      <p className="text-[11px] text-gray-500">{task.crop} · {task.field}</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${priorityConfig[task.priority]}`}>
                    {task.priority}
                  </Badge>
                </div>

                <p className="text-xs text-gray-600 leading-snug">{task.notes}</p>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px] text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>Due {task.dueDate}</span>
                  </div>
                  <span className="text-gray-600 font-medium">{task.assignedTo}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Crops Table */}
      <DataTable
        data={cropsData}
        columns={columns}
        title="Active Crop Plantings & Cycles"
        searchPlaceholder="Search crops, variety, plot..."
      />
    </div>
  );
}
