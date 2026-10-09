'use client';

import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Cpu, 
  Wifi, 
  Battery, 
  Thermometer, 
  Droplets, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';

export function IoTDevices() {
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const devicesData = [
    {
      id: 'SEN001',
      name: 'Soil Sensor Alpha',
      type: 'Soil Moisture',
      location: 'Field A - Zone 1 (Ibadan)',
      status: 'online',
      battery: 87,
      lastReading: '2024-08-09 14:30',
      value: '45%',
      connectivity: 'WiFi',
      firmware: 'v2.1.3'
    },
    {
      id: 'SEN002',
      name: 'Weather Station Beta',
      type: 'Weather Monitor',
      location: 'Field A - Central (Ibadan)',
      status: 'online',
      battery: 92,
      lastReading: '2024-08-09 14:29',
      value: '24°C',
      connectivity: 'LoRaWAN',
      firmware: 'v1.8.2'
    },
    {
      id: 'SEN003',
      name: 'Humidity Tracker',
      type: 'Humidity',
      location: 'Greenhouse 1 (Ogun)',
      status: 'warning',
      battery: 23,
      lastReading: '2024-08-09 14:25',
      value: '78%',
      connectivity: 'Zigbee',
      firmware: 'v2.0.1'
    },
    {
      id: 'IRR001',
      name: 'Smart Valve Controller',
      type: 'Irrigation',
      location: 'Field B - Zone 2 (Benue)',
      status: 'offline',
      battery: 0,
      lastReading: '2024-08-09 12:45',
      value: 'Closed',
      connectivity: 'WiFi',
      firmware: 'v1.5.7'
    },
    {
      id: 'CAM001',
      name: 'Livestock Telemetry Cam',
      type: 'Camera',
      location: 'Barn A (Kano)',
      status: 'online',
      battery: 100,
      lastReading: '2024-08-09 14:31',
      value: 'Recording',
      connectivity: 'Ethernet',
      firmware: 'v3.2.1'
    }
  ];

  const deviceStats = {
    total: devicesData.length,
    online: devicesData.filter(d => d.status === 'online').length,
    warning: devicesData.filter(d => d.status === 'warning').length,
    offline: devicesData.filter(d => d.status === 'offline').length,
    avgBattery: Math.round(devicesData.reduce((sum, d) => sum + d.battery, 0) / devicesData.length)
  };

  const columns = [
    {
      key: 'id',
      label: 'Device ID',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-xs">{row.name}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      filterable: true,
      render: (value: string) => {
        const icons = {
          'Soil Moisture': <Droplets className="h-3.5 w-3.5 text-blue-500" />,
          'Weather Monitor': <Activity className="h-3.5 w-3.5 text-leaf-600" />,
          'Humidity': <Thermometer className="h-3.5 w-3.5 text-harvest-600" />,
          'Irrigation': <Droplets className="h-3.5 w-3.5 text-node-600" />,
          'Camera': <Cpu className="h-3.5 w-3.5 text-purple-500" />
        };
        return (
          <div className="flex items-center space-x-1.5">
            {icons[value as keyof typeof icons]}
            <span className="text-xs font-medium text-gray-800">{value}</span>
          </div>
        );
      }
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600">{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true
    },
    {
      key: 'battery',
      label: 'Battery',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <Battery className={`h-3 w-3 ${
            value > 50 ? 'text-leaf-600' : 
            value > 20 ? 'text-harvest-500' : 'text-red-500'
          }`} />
          <span className="text-xs font-medium">{value}%</span>
        </div>
      )
    },
    {
      key: 'lastReading',
      label: 'Last Reading',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">{new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    {
      key: 'value',
      label: 'Current Value',
      render: (value: string) => (
        <Badge variant="secondary" className="text-xs font-mono font-medium">
          {value}
        </Badge>
      )
    },
    {
      key: 'connectivity',
      label: 'Connection',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Wifi className="h-3 w-3 text-leaf-600" />
          <span className="text-xs font-medium text-gray-700">{value}</span>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-serif">IoT Devices & Hardware</h1>
          <p className="text-sm text-gray-600">Telemetry, sensor gateway health and automation controllers across all farm estates</p>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="text-xs">
            <Cpu className="h-4 w-4 mr-1 text-leaf-700" />
            Add Device
          </Button>
          <Button size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs">
            <Activity className="h-4 w-4 mr-1" />
            Sync All Nodes
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Total Devices</p>
              <p className="text-2xl font-bold text-gray-900">{deviceStats.total}</p>
            </div>
            <Cpu className="h-8 w-8 text-leaf-700" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Online</p>
              <p className="text-2xl font-bold text-leaf-700">{deviceStats.online}</p>
              <p className="text-xs text-leaf-700 font-medium">{Math.round((deviceStats.online / deviceStats.total) * 100)}% active</p>
            </div>
            <CheckCircle className="h-8 w-8 text-leaf-700" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Warning</p>
              <p className="text-2xl font-bold text-harvest-600">{deviceStats.warning}</p>
              <p className="text-xs text-harvest-600 font-medium">Low battery</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-harvest-600" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Offline</p>
              <p className="text-2xl font-bold text-red-600">{deviceStats.offline}</p>
              <p className="text-xs text-red-600 font-medium">Need attention</p>
            </div>
            <Wifi className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Avg Battery</p>
              <p className="text-2xl font-bold text-gray-900">{deviceStats.avgBattery}%</p>
              <div className="w-16 mt-1">
                <Progress value={deviceStats.avgBattery} className="h-1 bg-gray-100" />
              </div>
            </div>
            <Battery className="h-8 w-8 text-node-600" />
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Alert className="border-red-200 bg-red-50/70">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-xs text-red-800">
            <strong>Device IRR001</strong> has been offline for 2 hours. Check power/solar link.
          </AlertDescription>
        </Alert>

        <Alert className="border-amber-200 bg-amber-50/70">
          <Battery className="h-4 w-4 text-harvest-600" />
          <AlertDescription className="text-xs text-amber-800">
            <strong>Device SEN003</strong> has low battery (23%). Schedule battery swap.
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50/70">
          <Cpu className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            <strong>Firmware OTA</strong> available for 3 gateway nodes. Upgrade recommended.
          </AlertDescription>
        </Alert>
      </div>

      {/* Device Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Devices Table */}
        <div className="lg:col-span-2">
          <DataTable
            data={devicesData}
            columns={columns}
            title="All IoT Hardware Nodes"
            searchPlaceholder="Search sensor or valve id..."
            onAdd={() => console.log('Add device')}
            onEdit={(device) => setSelectedDevice(device)}
            onDelete={(device) => console.log('Delete device:', device)}
            pageSize={8}
          />
        </div>

        {/* Device Details */}
        <div className="space-y-4">
          <Card className="p-4 border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Device Types</h3>
            <div className="space-y-2">
              {[
                { type: 'Soil Moisture Sensors', count: 1, color: 'bg-blue-100 text-blue-800' },
                { type: 'Weather Station Nodes', count: 1, color: 'bg-leaf-100 text-leaf-800' },
                { type: 'Humidity & Dewpoint', count: 1, color: 'bg-harvest-100 text-harvest-800' },
                { type: 'Irrigation Controllers', count: 1, color: 'bg-node-100 text-node-800' },
                { type: 'Field Cameras', count: 1, color: 'bg-purple-100 text-purple-800' }
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-gray-700">{item.type}</span>
                  <Badge className={item.color}>{item.count}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Telemetry Connectivity</h3>
            <div className="space-y-3">
              {[
                { type: 'GSM / 4G LTE', count: 2, status: 'Good' },
                { type: 'LoRaWAN Long Range', count: 1, status: 'Excellent' },
                { type: 'Zigbee Mesh', count: 1, status: 'Fair' },
                { type: 'Ethernet Backbone', count: 1, status: 'Excellent' }
              ].map((conn, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-800">{conn.type}</span>
                    <span className="text-gray-500">{conn.count} devices</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={conn.status === 'Excellent' ? 100 : conn.status === 'Good' ? 75 : 50} 
                      className="h-2 flex-1 bg-gray-100" 
                    />
                    <span className="text-xs text-gray-600 font-medium">{conn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Maintenance Schedule</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-700">SEN003 - Battery Replacement</span>
                <Badge className="bg-harvest-100 text-harvest-800">Due</Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-700">IRR001 - Solenoid Valve Inspection</span>
                <Badge className="bg-red-100 text-red-800">Overdue</Badge>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-700">CAM001 - Solar Panel Cleaning</span>
                <Badge className="bg-leaf-100 text-leaf-800">Scheduled</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
