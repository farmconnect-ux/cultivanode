'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Droplets, Power, Clock, MapPin, Activity, TrendingDown, CheckCircle, Plus } from 'lucide-react';

interface Zone {
  id: string;
  location: string;
  status: 'active' | 'scheduled' | 'offline' | 'idle';
  duration: number;
  remaining: number;
  soilMoisture: number;
}

const INITIAL_ZONES: Zone[] = [
  { id: 'Zone 1', location: 'Ibadan Farm - North (Maize)', status: 'active', duration: 45, remaining: 15, soilMoisture: 45 },
  { id: 'Zone 2', location: 'Ibadan Farm - South (Cassava)', status: 'scheduled', duration: 30, remaining: 0, soilMoisture: 38 },
  { id: 'Zone 3', location: 'Benue Outpost - Plot 2', status: 'active', duration: 60, remaining: 35, soilMoisture: 42 },
  { id: 'Zone 4', location: 'Greenhouse 1 - Nursery', status: 'offline', duration: 0, remaining: 0, soilMoisture: 65 },
  { id: 'Zone 5', location: 'Greenhouse 2 - Hydroponics', status: 'idle', duration: 0, remaining: 0, soilMoisture: 58 },
  { id: 'Zone 6', location: 'Kano Field - Soya Drip', status: 'scheduled', duration: 40, remaining: 0, soilMoisture: 32 }
];

export function Irrigation() {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    zoneId: 'Zone 2',
    duration: '45',
    time: '06:30',
    waterSource: 'Solar Borehole Pump 1'
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleValve = (zoneId: string) => {
    setZones(prev => prev.map(zone => {
      if (zone.id === zoneId) {
        if (zone.status === 'active') {
          showFeedback(`Valve controller for ${zone.id} closed. Flow stopped.`);
          return { ...zone, status: 'idle', remaining: 0 };
        } else {
          showFeedback(`Valve controller for ${zone.id} opened! Active drip cycle started.`);
          return { ...zone, status: 'active', duration: 45, remaining: 45 };
        }
      }
      return zone;
    }));
  };

  const handleCycleTimer = (zoneId: string) => {
    setZones(prev => prev.map(zone => {
      if (zone.id === zoneId) {
        const nextDur = zone.duration === 15 ? 30 : zone.duration === 30 ? 45 : zone.duration === 45 ? 60 : 15;
        showFeedback(`Timer for ${zone.id} set to ${nextDur} minutes.`);
        return { ...zone, duration: nextDur, remaining: zone.status === 'active' ? nextDur : 0 };
      }
      return zone;
    }));
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setZones(prev => prev.map(z => {
      if (z.id === scheduleForm.zoneId) {
        return {
          ...z,
          status: 'scheduled',
          duration: parseInt(scheduleForm.duration, 10) || 45,
          remaining: 0
        };
      }
      return z;
    }));
    setIsScheduleModalOpen(false);
    showFeedback(`Automated irrigation cycle for ${scheduleForm.zoneId} scheduled at ${scheduleForm.time} (${scheduleForm.duration} min).`);
  };

  const activeZonesCount = zones.filter(z => z.status === 'active').length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-serif">Irrigation Management</h1>
          <p className="text-sm text-gray-600">Control water distribution, borehole pressure and drip lines across your fields</p>
        </div>
        <Button 
          className="bg-leaf-800 hover:bg-leaf-900 text-white shadow-sm"
          onClick={() => setIsScheduleModalOpen(true)}
        >
          <Droplets className="h-4 w-4 mr-1" />
          Schedule Irrigation
        </Button>
      </div>

      {feedback && (
        <Alert className="border-leaf-300 bg-leaf-50 text-leaf-900">
          <CheckCircle className="h-4 w-4 text-leaf-700" />
          <AlertDescription className="text-xs font-medium">
            {feedback}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Daily Usage</p>
              <p className="text-2xl font-bold text-gray-900">2,340L</p>
              <p className="text-xs text-leaf-700 font-medium">-5% vs yesterday</p>
            </div>
            <Droplets className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Active Zones</p>
              <p className="text-2xl font-bold text-leaf-700">{activeZonesCount}</p>
              <p className="text-xs text-gray-500 font-medium">of {zones.length} sectors online</p>
            </div>
            <Activity className="h-8 w-8 text-leaf-700" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Water Efficiency</p>
              <p className="text-2xl font-bold text-leaf-700">94%</p>
              <p className="text-xs text-leaf-700 font-medium">Optimal drip delivery</p>
            </div>
            <TrendingDown className="h-8 w-8 text-leaf-700" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Next Cycle</p>
              <p className="text-2xl font-bold text-gray-900">6:00 AM</p>
              <p className="text-xs text-blue-600 font-medium">Benue Field C</p>
            </div>
            <Clock className="h-8 w-8 text-node-600" />
          </div>
        </Card>
      </div>

      {/* Irrigation Zones */}
      <Card className="p-4 border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Irrigation Zones & Solar Pumps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(zone => (
            <Card key={zone.id} className="p-3 border border-gray-200/80 bg-white shadow-none">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{zone.id}</h4>
                  <p className="text-xs text-gray-600 flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                    {zone.location}
                  </p>
                </div>
                <Badge className={`text-xs ${
                  zone.status === 'active' ? 'bg-leaf-100 text-leaf-800' :
                  zone.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  zone.status === 'offline' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {zone.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Soil Moisture</span>
                  <span className="font-semibold text-gray-800">{zone.soilMoisture}%</span>
                </div>
                <Progress value={zone.soilMoisture} className="h-2 bg-gray-100" />
                
                {zone.status === 'active' && (
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Cycle Remaining</span>
                      <span className="font-semibold text-leaf-700">{zone.remaining} min</span>
                    </div>
                    <Progress value={(zone.remaining / (zone.duration || 1)) * 100} className="h-2 bg-gray-100" />
                  </div>
                )}
                
                <div className="flex space-x-1.5 mt-3 pt-2 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={`flex-1 h-7 text-xs ${zone.status === 'active' ? 'bg-red-50 text-red-700 border-red-200' : 'text-leaf-800'}`}
                    onClick={() => handleToggleValve(zone.id)}
                  >
                    <Power className="h-3 w-3 mr-1" />
                    {zone.status === 'active' ? 'Stop Valve' : 'Start Valve'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-7 text-xs text-gray-700"
                    onClick={() => handleCycleTimer(zone.id)}
                  >
                    <Clock className="h-3 w-3 mr-1 text-gray-500" />
                    {zone.duration ? `${zone.duration}m Timer` : 'Timer'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Schedule Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleScheduleSubmit}>
            <DialogHeader>
              <DialogTitle>Schedule Field Irrigation</DialogTitle>
              <DialogDescription>
                Configure automated solenoid valve duration and solar pump triggers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700">Select Zone</label>
                <select
                  className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                  value={scheduleForm.zoneId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, zoneId: e.target.value })}
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.id} - {z.location}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Start Time</label>
                  <Input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Cycle Duration (minutes)</label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={scheduleForm.duration}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, duration: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Water Supply Source</label>
                <select
                  className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                  value={scheduleForm.waterSource}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, waterSource: e.target.value })}
                >
                  <option value="Solar Borehole Pump 1">Solar Borehole Pump 1 (Primary)</option>
                  <option value="Solar Borehole Pump 2">Solar Borehole Pump 2 (Benue Outpost)</option>
                  <option value="Rainwater Catchment Reservoir">Rainwater Catchment Reservoir B</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white">
                Save Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
