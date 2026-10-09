'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Droplets, Power, Clock, MapPin, Activity, TrendingDown } from 'lucide-react';

export function Irrigation() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-serif">Irrigation Management</h1>
          <p className="text-sm text-gray-600">Control water distribution, borehole pressure and drip lines across your fields</p>
        </div>
        <Button className="bg-leaf-800 hover:bg-leaf-900 text-white shadow-sm">
          <Droplets className="h-4 w-4 mr-1" />
          Schedule Irrigation
        </Button>
      </div>

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
              <p className="text-2xl font-bold text-leaf-700">3</p>
              <p className="text-xs text-gray-500 font-medium">of 8 farm sectors</p>
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
          {[
            { id: 'Zone 1', location: 'Ibadan Farm - North (Maize)', status: 'active', duration: 45, remaining: 15, soilMoisture: 45 },
            { id: 'Zone 2', location: 'Ibadan Farm - South (Cassava)', status: 'scheduled', duration: 30, remaining: 0, soilMoisture: 38 },
            { id: 'Zone 3', location: 'Benue Outpost - Plot 2', status: 'active', duration: 60, remaining: 35, soilMoisture: 42 },
            { id: 'Zone 4', location: 'Greenhouse 1 - Nursery', status: 'offline', duration: 0, remaining: 0, soilMoisture: 65 },
            { id: 'Zone 5', location: 'Greenhouse 2 - Hydroponics', status: 'idle', duration: 0, remaining: 0, soilMoisture: 58 },
            { id: 'Zone 6', location: 'Kano Field - Soya Drip', status: 'scheduled', duration: 40, remaining: 0, soilMoisture: 32 }
          ].map(zone => (
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
                    <Progress value={(zone.remaining / zone.duration) * 100} className="h-2 bg-gray-100" />
                  </div>
                )}
                
                <div className="flex space-x-1.5 mt-3 pt-2 border-t border-gray-100">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                    <Power className="h-3 w-3 mr-1 text-leaf-700" />
                    {zone.status === 'active' ? 'Stop Valve' : 'Start Valve'}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                    <Clock className="h-3 w-3 mr-1 text-gray-500" />
                    Timer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
