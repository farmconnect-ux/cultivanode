"use client";

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatCurrency, formatCurrencyCompact } from '../ui/currency-utils';
import {
  Droplets, Thermometer, Wind, TrendingUp, MapPin,
  AlertTriangle, Clock, Wrench, Heart,
  Zap, CloudRain, ArrowUpRight, Activity, BrainCircuit
} from 'lucide-react';
import { QuickActionModal } from '../modals/QuickActionModal';

const statCards = [
  {
    label: 'Total Farm Area',
    value: '2,500',
    unit: 'hectares',
    sub: '12 active fields across Oyo & Ogun',
    icon: MapPin,
    gradient: 'from-emerald-600 to-green-700',
    iconBg: 'bg-white/20',
    trend: null
  },
  {
    label: 'Total Revenue',
    value: '₦58.8M',
    unit: 'this season',
    sub: '+12.5% vs last season',
    icon: TrendingUp,
    gradient: 'from-green-700 to-emerald-800',
    iconBg: 'bg-white/20',
    trend: 'up'
  },
  {
    label: 'Net Margin',
    value: '₦22.2M',
    unit: 'this season',
    sub: '37.8% verified profit',
    icon: TrendingUp,
    gradient: 'from-teal-600 to-emerald-700',
    iconBg: 'bg-white/20',
    trend: 'up'
  },
  {
    label: 'Machinery Fleet',
    value: '3 / 4',
    unit: 'operational',
    sub: '1 in scheduled maintenance',
    icon: Wrench,
    gradient: 'from-amber-600 to-amber-700',
    iconBg: 'bg-white/20',
    trend: null
  },
  {
    label: 'Livestock Herd',
    value: '2,673',
    unit: 'total animals',
    sub: '99.4% vaccine verified',
    icon: Heart,
    gradient: 'from-emerald-800 to-green-950',
    iconBg: 'bg-white/20',
    trend: 'up'
  },
];

const sensorReadings = [
  { id: 1, location: 'Field A – Zone 1 (Maize)', soilMoisture: 65, temperature: 28, humidity: 72, ph: 6.8, batteryLevel: 85, lastUpdated: '2 mins ago', status: 'optimal' },
  { id: 2, location: 'Field B – Zone 2 (Cassava)', soilMoisture: 45, temperature: 32, humidity: 58, ph: 7.2, batteryLevel: 92, lastUpdated: '5 mins ago', status: 'low-moisture' },
  { id: 3, location: 'Greenhouse Alpha (Nursery)', soilMoisture: 78, temperature: 26, humidity: 85, ph: 6.5, batteryLevel: 78, lastUpdated: '1 min ago', status: 'optimal' },
  { id: 4, location: 'Pasture North (Ruminants)', soilMoisture: 38, temperature: 35, humidity: 45, ph: 7.0, batteryLevel: 34, lastUpdated: '8 mins ago', status: 'low-battery' },
];

const equipmentStatus = [
  { name: 'Mahindra 8000 4WD', status: 'operational', hoursUsed: 1245, location: 'Field A' },
  { name: 'TAFE 45 DI Orchard', status: 'maintenance', hoursUsed: 890, location: 'Service Bay' },
  { name: 'Sonalika DI 750 III', status: 'operational', hoursUsed: 756, location: 'Barn B' },
  { name: 'Harvester Pro 230', status: 'operational', hoursUsed: 445, location: 'Field C' },
];

const recentSales = [
  { crop: 'Yellow Maize (OBA Super 9)', quantity: 2500, price: 640, revenue: 1600000, buyer: 'Premier Feedmills Ibadan', date: '2026-10-06', emoji: '🌽' },
  { crop: 'Cassava Tubers (TMS 30572)', quantity: 3200, price: 530, revenue: 1700000, buyer: 'Starch Nigeria Plc', date: '2026-10-04', emoji: '🥔' },
  { crop: 'Raw Groundnuts (SAMNUT 24)', quantity: 1800, price: 4530, revenue: 8160000, buyer: 'Vegetable Oil Mills Kano', date: '2026-09-28', emoji: '🥜' },
];

const upcomingTasks = [
  { task: 'Drip Irrigation – Field A Zone 2', priority: 'high', dueDate: 'Today, 2:00 PM', assignedTo: 'Ibrahim Musa' },
  { task: 'Maize Harvest – Field C (Cycle MZ-26)', priority: 'high', dueDate: 'Tomorrow, 6:00 AM', assignedTo: 'Harvest Team Alpha' },
  { task: 'Tractor 250-Hr Service (TAFE 45 DI)', priority: 'medium', dueDate: 'Oct 12, 10:00 AM', assignedTo: 'Maintenance Crew' },
  { task: 'Soil pH Testing – Field B Cassava Block', priority: 'low', dueDate: 'Oct 15, 9:00 AM', assignedTo: 'Agric Extension Officer' },
];

const weatherForecast = [
  { day: 'Today', high: 34, low: 26, icon: '☀️', rain: 10 },
  { day: 'Tue', high: 31, low: 24, icon: '⛅', rain: 40 },
  { day: 'Wed', high: 29, low: 22, icon: '🌧️', rain: 85 },
  { day: 'Thu', high: 30, low: 23, icon: '⛅', rain: 20 },
  { day: 'Fri', high: 33, low: 25, icon: '☀️', rain: 5 },
];

const aiRecommendations = [
  { type: 'irrigation', icon: Droplets, color: 'blue', message: 'Field B Zone 2 soil moisture at 45%. Schedule 45-min drip irrigation within 6 hrs.', confidence: 91, action: 'Schedule Irrigation' },
  { type: 'disease', icon: AlertTriangle, color: 'orange', message: 'High evening humidity forecast. Apply preventive anti-fungal spray to maize zone.', confidence: 84, action: 'Create Field Task' },
  { type: 'harvest', icon: TrendingUp, color: 'green', message: 'Maize in Field C has reached 12.5% harvest moisture. Optimal harvest window in 48 hrs.', confidence: 96, action: 'Log Harvest' },
];

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  optimal: { label: 'Optimal', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  'low-moisture': { label: 'Low Moisture', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' },
  'low-battery': { label: 'Low Battery', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' },
  operational: { label: 'Operational', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  maintenance: { label: 'Maintenance', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' },
  'out-of-service': { label: 'Out of Service', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' },
};

const priorityConfig: Record<string, string> = {
  high: 'bg-rose-100 text-rose-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-700',
};

const aiColorConfig: Record<string, { bg: string; icon: string; border: string }> = {
  blue: { bg: 'bg-blue-50/70', icon: 'text-blue-700', border: 'border-blue-100' },
  orange: { bg: 'bg-amber-50/70', icon: 'text-amber-700', border: 'border-amber-100' },
  green: { bg: 'bg-green-50/70', icon: 'text-green-800', border: 'border-green-100' },
};

export function Dashboard() {
  const [showQuickAction, setShowQuickAction] = useState(false);

  return (
    <div className="p-4 sm:p-5 space-y-5 min-h-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Farm Command Centre</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time telemetry, agronomy AI recommendations, and farm operations overview.</p>
        </div>
        <Button
          onClick={() => setShowQuickAction(true)}
          className="bg-green-700 hover:bg-green-800 text-white h-9 px-4 text-xs font-semibold shadow-xs"
        >
          <Zap className="h-3.5 w-3.5 mr-1.5" />
          Quick Action
        </Button>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative rounded-xl p-4 bg-gradient-to-br ${card.gradient} text-white overflow-hidden shadow-sm`}
            >
              {/* Background circle decoration */}
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
              <div className="absolute -right-1 top-6 w-8 h-8 rounded-full bg-white/10" />

              <div className={`inline-flex p-1.5 rounded-lg ${card.iconBg} mb-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-[11px] font-medium text-white/80 uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{card.value}</p>
              <p className="text-[11px] text-white/90 mt-0.5 flex items-center gap-0.5">
                {card.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* AI Recommendations */}
      <Card className="p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-100 text-green-800">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Agronomic AI Intelligence</h2>
          </div>
          <Badge className="bg-green-100 text-green-800 text-[10px] font-semibold">3 active recommendations</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aiRecommendations.map((rec) => {
            const Icon = rec.icon;
            const c = aiColorConfig[rec.color];
            return (
              <div key={rec.type} className={`rounded-xl p-3 border ${c.bg} ${c.border}`}>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white shadow-xs shrink-0">
                    <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 leading-snug">{rec.message}</p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-medium text-gray-600">{rec.confidence}% confidence</span>
                      </div>
                      <button 
                        onClick={() => setShowQuickAction(true)} 
                        className={`text-[10px] font-semibold ${c.icon} hover:underline cursor-pointer`}
                      >
                        {rec.action} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Middle Row: Sales | Weather | Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sales */}
        <Card className="p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Recent Farm Produce Sales</h3>
            <span className="text-[10px] text-green-700 font-medium">Verified Ledger</span>
          </div>
          <div className="space-y-2.5">
            {recentSales.map((sale, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50/80 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{sale.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{sale.crop}</p>
                    <p className="text-[11px] text-gray-500">{sale.quantity.toLocaleString()} units · {sale.buyer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-green-700">{formatCurrencyCompact(sale.revenue)}</p>
                  <p className="text-[10px] text-gray-400">{new Date(sale.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Weather Forecast */}
        <Card className="p-4 border border-gray-100 shadow-xs overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 to-emerald-50/30 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Farm Microclimate</h3>
              <CloudRain className="h-4 w-4 text-green-700" />
            </div>
            {/* Current */}
            <div className="flex items-center justify-between mb-3 p-3 rounded-xl bg-white/80 border border-gray-100 shadow-xs">
              <div>
                <p className="text-2xl font-bold text-gray-900">32°C</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Partly Cloudy · Ibadan Agronomy Zone</p>
              </div>
              <div className="text-right text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-1 justify-end"><Droplets className="h-3 w-3 text-blue-500" />68% humidity</div>
                <div className="flex items-center gap-1 justify-end"><Wind className="h-3 w-3 text-gray-400" />12 km/h wind</div>
              </div>
            </div>
            {/* Forecast */}
            <div className="grid grid-cols-5 gap-1">
              {weatherForecast.map((day, i) => (
                <div key={i} className={`flex flex-col items-center p-1.5 rounded-lg text-center ${i === 0 ? 'bg-green-100/70 border border-green-200/50' : 'bg-white/70'}`}>
                  <p className="text-[10px] text-gray-500">{day.day}</p>
                  <span className="text-base my-0.5">{day.icon}</span>
                  <p className="text-[10px] font-bold text-gray-800">{day.high}°</p>
                  <p className="text-[10px] text-blue-600">{day.rain}% rain</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Upcoming Field Tasks */}
        <Card className="p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Field Operations & Tasks</h3>
            <span className="text-[10px] text-gray-500">Scheduled</span>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{task.task}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />{task.dueDate} · {task.assignedTo}
                  </p>
                </div>
                <Badge className={`text-[10px] shrink-0 ${priorityConfig[task.priority]}`}>{task.priority}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sensor Readings */}
      <Card className="p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Real-time IoT Sensor Telemetry</h3>
          </div>
          <span className="text-[11px] text-gray-500">4 sensors active</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sensorReadings.map((sensor) => {
            const sc = statusConfig[sensor.status];
            return (
              <div key={sensor.id} className="rounded-xl border border-gray-100 bg-white p-3 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-800 truncate mr-1">{sensor.location}</p>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${sc.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Droplets className="h-3 w-3 text-blue-500 shrink-0" />
                    <span>{sensor.soilMoisture}% moisture</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Thermometer className="h-3 w-3 text-rose-500 shrink-0" />
                    <span>{sensor.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Wind className="h-3 w-3 text-gray-400 shrink-0" />
                    <span>{sensor.humidity}% humidity</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <span className="text-[10px] font-mono font-bold text-gray-700">pH {sensor.ph}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Battery {sensor.batteryLevel}%</span>
                    <span>{sensor.lastUpdated}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${sensor.batteryLevel > 50 ? 'bg-green-600' : sensor.batteryLevel > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${sensor.batteryLevel}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Equipment Status */}
      <Card className="p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Wrench className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Fleet & Machinery Telematics</h3>
          </div>
          <span className="text-[11px] text-gray-500">4 heavy implements</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {equipmentStatus.map((eq, i) => {
            const sc = statusConfig[eq.status];
            return (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-800 truncate mr-1">{eq.name}</p>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 ${sc.badge}`}>{sc.label}</span>
                <div className="text-[11px] text-gray-500 space-y-1">
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-gray-400" />{eq.hoursUsed.toLocaleString()} hrs logged</div>
                  <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gray-400" />{eq.location}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {showQuickAction && <QuickActionModal onClose={() => setShowQuickAction(false)} />}
    </div>
  );
}
