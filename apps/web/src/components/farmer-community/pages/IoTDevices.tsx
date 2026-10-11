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
  MapPin,
  Plus,
  RefreshCw,
  Signal,
  Trash2,
  Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';

const INITIAL_DEVICES = [
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

export function IoTDevices() {
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'Soil Moisture',
    location: 'Field A - Zone 1 (Ibadan)',
    connectivity: 'LoRaWAN',
    battery: '95',
    firmware: 'v2.2.0'
  });

  const handleSyncAll = () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback(`Successfully synchronized ${devices.length} IoT hardware nodes across Ibadan, Kano, and Benue hubs.`);
      setTimeout(() => setSyncFeedback(null), 5000);
    }, 1200);
  };

  const handleAddDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const newId = formData.id.trim() || `DEV${String(devices.length + 1).padStart(3, '0')}`;
    const newDevice = {
      id: newId,
      name: formData.name,
      type: formData.type,
      location: formData.location,
      status: 'online',
      battery: parseInt(formData.battery, 10) || 100,
      lastReading: 'Just now',
      value: formData.type === 'Soil Moisture' ? '48%' : formData.type === 'Weather Monitor' ? '26°C' : 'Normal',
      connectivity: formData.connectivity,
      firmware: formData.firmware
    };
    setDevices([newDevice, ...devices]);
    setIsAddModalOpen(false);
    setFormData({
      id: '',
      name: '',
      type: 'Soil Moisture',
      location: 'Field A - Zone 1 (Ibadan)',
      connectivity: 'LoRaWAN',
      battery: '95',
      firmware: 'v2.2.0'
    });
  };

  const handleDeleteDevice = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
    if (selectedDevice?.id === id) {
      setSelectedDevice(null);
    }
  };

  const deviceStats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    warning: devices.filter(d => d.status === 'warning').length,
    offline: devices.filter(d => d.status === 'offline').length,
    avgBattery: devices.length ? Math.round(devices.reduce((sum, d) => sum + d.battery, 0) / devices.length) : 0
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
          'Weather Monitor': <Activity className="h-3.5 w-3.5 text-secondary" />,
          'Humidity': <Thermometer className="h-3.5 w-3.5 text-[#b45309]" />,
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
            value > 50 ? 'text-secondary' : 
            value > 20 ? 'text-[#b45309]' : 'text-red-500'
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
          <Wifi className="h-3 w-3 text-secondary" />
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
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Cpu className="h-4 w-4 mr-1 text-primary-container" />
            Add Device
          </Button>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary text-white text-xs disabled:opacity-50"
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All Nodes'}
          </Button>
        </div>
      </div>

      {/* Sync feedback */}
      {syncFeedback && (
        <Alert className="border-secondary/40 bg-surface-container-low text-primary">
          <CheckCircle className="h-4 w-4 text-primary-container" />
          <AlertDescription className="text-xs font-medium">
            {syncFeedback}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Total Devices</p>
              <p className="text-2xl font-bold text-gray-900">{deviceStats.total}</p>
            </div>
            <Cpu className="h-8 w-8 text-primary-container" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Online</p>
              <p className="text-2xl font-bold text-primary-container">{deviceStats.online}</p>
              <p className="text-xs text-primary-container font-medium">
                {deviceStats.total > 0 ? Math.round((deviceStats.online / deviceStats.total) * 100) : 0}% active
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary-container" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Warning</p>
              <p className="text-2xl font-bold text-[#b45309]">{deviceStats.warning}</p>
              <p className="text-xs text-[#b45309] font-medium">Low battery</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-[#b45309]" />
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
          <Battery className="h-4 w-4 text-[#b45309]" />
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
            data={devices}
            columns={columns}
            title="All IoT Hardware Nodes"
            searchPlaceholder="Search sensor or valve id..."
            onAdd={() => setIsAddModalOpen(true)}
            onEdit={(device) => setSelectedDevice(device)}
            onDelete={(device) => handleDeleteDevice(device.id)}
            pageSize={8}
          />
        </div>

        {/* Device Details */}
        <div className="space-y-4">
          <Card className="p-4 border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Device Types</h3>
            <div className="space-y-2">
              {[
                { type: 'Soil Moisture Sensors', count: devices.filter(d => d.type === 'Soil Moisture').length, color: 'bg-blue-100 text-blue-800' },
                { type: 'Weather Station Nodes', count: devices.filter(d => d.type === 'Weather Monitor').length, color: 'bg-secondary-container/40 text-primary' },
                { type: 'Humidity & Dewpoint', count: devices.filter(d => d.type === 'Humidity').length, color: 'bg-tertiary-fixed/60 text-[#92400e]' },
                { type: 'Irrigation Controllers', count: devices.filter(d => d.type === 'Irrigation').length, color: 'bg-node-100 text-node-800' },
                { type: 'Field Cameras', count: devices.filter(d => d.type === 'Camera').length, color: 'bg-purple-100 text-purple-800' }
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
                <Badge className="bg-tertiary-fixed/60 text-[#92400e]">Due</Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-700">IRR001 - Solenoid Valve Inspection</span>
                <Badge className="bg-red-100 text-red-800">Overdue</Badge>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-700">CAM001 - Solar Panel Cleaning</span>
                <Badge className="bg-secondary-container/40 text-primary">Scheduled</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Device Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddDeviceSubmit}>
            <DialogHeader>
              <DialogTitle>Register IoT Hardware Node</DialogTitle>
              <DialogDescription>
                Pair and register a new telemetry sensor, gateway probe or smart valve into CultivaNode IoT.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Device Name</label>
                <Input
                  required
                  placeholder="e.g., Soil Sensor Gamma - Plot 4"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Hardware Type</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Soil Moisture">Soil Moisture Sensor</option>
                    <option value="Weather Monitor">Weather Monitor Station</option>
                    <option value="Humidity">Humidity / Dewpoint</option>
                    <option value="Irrigation">Smart Valve Controller</option>
                    <option value="Camera">Telemetry Camera</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Connectivity</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={formData.connectivity}
                    onChange={(e) => setFormData({ ...formData, connectivity: e.target.value })}
                  >
                    <option value="LoRaWAN">LoRaWAN Long Range</option>
                    <option value="WiFi">WiFi (2.4 GHz)</option>
                    <option value="Zigbee">Zigbee Mesh</option>
                    <option value="Ethernet">Ethernet / POE</option>
                    <option value="4G LTE">GSM / 4G LTE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Farm Location</label>
                <Input
                  placeholder="e.g., Field A - Zone 3 (Ibadan)"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Custom Device ID (Optional)</label>
                  <Input
                    placeholder="Auto-generated if empty"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Initial Battery %</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.battery}
                    onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary text-white">
                Pair & Save Node
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Selected Device Telemetry Detail Modal */}
      {selectedDevice && (
        <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                <Badge className={selectedDevice.status === 'online' ? 'bg-secondary-container/40 text-primary' : 'bg-red-100 text-red-800'}>
                  {selectedDevice.status.toUpperCase()}
                </Badge>
                <DialogTitle>{selectedDevice.name}</DialogTitle>
              </div>
              <DialogDescription>
                Node ID: <span className="font-mono font-semibold">{selectedDevice.id}</span> · Firmware: {selectedDevice.firmware}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <span className="text-gray-500">Live Reading</span>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{selectedDevice.value}</p>
                </div>
                <div>
                  <span className="text-gray-500">Battery Level</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Battery className="h-4 w-4 text-primary-container" />
                    <span className="font-bold text-gray-900">{selectedDevice.battery}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Connectivity</span>
                  <div className="flex items-center space-x-1 mt-0.5 font-medium text-gray-800">
                    <Wifi className="h-3.5 w-3.5 text-secondary" />
                    <span>{selectedDevice.connectivity}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Last Telemetry Ping</span>
                  <p className="font-medium text-gray-800 mt-0.5">{selectedDevice.lastReading}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Installed Location</span>
                <div className="flex items-center space-x-1.5 text-gray-800 font-medium">
                  <MapPin className="h-4 w-4 text-primary-container" />
                  <span>{selectedDevice.location}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                  onClick={() => handleDeleteDevice(selectedDevice.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Device
                </Button>
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary text-white text-xs"
                  onClick={() => setSelectedDevice(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
