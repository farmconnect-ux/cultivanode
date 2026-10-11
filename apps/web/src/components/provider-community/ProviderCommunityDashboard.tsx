'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '../farmer-community/ui/card';
import { Button } from '../farmer-community/ui/button';
import { Badge } from '../farmer-community/ui/badge';
import { Progress } from '../farmer-community/ui/progress';
import { Alert, AlertDescription } from '../farmer-community/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../farmer-community/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../farmer-community/ui/dialog';
import { Input } from '../farmer-community/ui/input';
import { formatCurrency, formatCurrencyCompact } from '../farmer-community/ui/currency-utils';
import type { BookingSummary } from '@/lib/account/bookings';
import type { Account } from '@/lib/account/session';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import {
  Tractor,
  Wrench,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Phone,
  FileText,
  User,
  Settings,
  Shield,
  Layers,
  ChevronRight,
  Menu,
  X,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Truck,
  Droplets,
  Fuel,
  Activity,
  Check
} from 'lucide-react';

interface MachineryItem {
  id: string;
  name: string;
  category: string;
  horsepower: number;
  status: 'available' | 'deployed' | 'maintenance';
  hoursOperated: number;
  dailyRate: number;
  location: string;
  operator: string;
  fuelLevel: number;
}

const DEFAULT_FLEET: MachineryItem[] = [
  {
    id: 'FLEET-01',
    name: 'John Deere 5075E 4WD',
    category: 'Tractor (75 HP)',
    horsepower: 75,
    status: 'deployed',
    hoursOperated: 482,
    dailyRate: 75000,
    location: 'Ibadan North - Adewale Maize Farm',
    operator: 'Kazeem Oladipo',
    fuelLevel: 68
  },
  {
    id: 'FLEET-02',
    name: 'Massey Ferguson 375 Xtra',
    category: 'Tractor (75 HP)',
    horsepower: 75,
    status: 'available',
    hoursOperated: 320,
    dailyRate: 70000,
    location: 'Central Depot - Ibadan',
    operator: 'Suleiman Dan-Ali',
    fuelLevel: 95
  },
  {
    id: 'FLEET-03',
    name: 'New Holland TC5.30',
    category: 'Combine Harvester',
    horsepower: 130,
    status: 'available',
    hoursOperated: 180,
    dailyRate: 180000,
    location: 'Central Depot - Ibadan',
    operator: 'Tunde Adeleke',
    fuelLevel: 80
  },
  {
    id: 'FLEET-04',
    name: 'DJI Agras T40 Spray Drone',
    category: 'Agrochemical Drone',
    horsepower: 0,
    status: 'deployed',
    hoursOperated: 95,
    dailyRate: 45000,
    location: 'Oyo Valley - Sector 2',
    operator: 'Emeka Nwosu',
    fuelLevel: 92
  }
];

const DEFAULT_SERVICES = [
  { id: 'SRV-01', name: 'Deep Disc Ploughing', unit: 'per hectare', rate: 38000, active: true },
  { id: 'SRV-02', name: 'Secondary Harrowing', unit: 'per hectare', rate: 22000, active: true },
  { id: 'SRV-03', name: 'Ridge & Bed Preparation', unit: 'per hectare', rate: 25000, active: true },
  { id: 'SRV-04', name: 'Grain Combine Harvesting', unit: 'per hectare', rate: 65000, active: true },
  { id: 'SRV-05', name: 'Precision Drone Spraying', unit: 'per hectare', rate: 15000, active: true }
];

export function ProviderCommunityDashboard({
  lang,
  account,
  t,
  bookings = [],
  listingsCount = 0
}: {
  lang: Locale;
  account: Account;
  t: Dictionary;
  bookings: BookingSummary[];
  listingsCount?: number;
}) {
  const [activeMenu, setActiveMenu] = useState<'overview' | 'jobs' | 'fleet' | 'services' | 'financials' | 'profile'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Stateful Data
  const [fleet, setFleet] = useState<MachineryItem[]>(DEFAULT_FLEET);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [localBookings, setLocalBookings] = useState<BookingSummary[]>(bookings);

  // Modals
  const [isAddMachineryOpen, setIsAddMachineryOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedJobAction, setSelectedJobAction] = useState<{ id: string; title: string; action: 'accept' | 'decline' | 'complete' } | null>(null);

  // Forms
  const [machineryForm, setMachineryForm] = useState({
    name: '',
    category: 'Tractor (75 HP)',
    horsepower: '75',
    dailyRate: '75000',
    operator: 'Assigned Driver',
    location: 'Central Depot - Ibadan'
  });

  const [payoutForm, setPayoutForm] = useState({
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    amount: '350000'
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddMachinery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineryForm.name) return;
    const newItem: MachineryItem = {
      id: `FLEET-${String(fleet.length + 1).padStart(2, '0')}`,
      name: machineryForm.name,
      category: machineryForm.category,
      horsepower: parseInt(machineryForm.horsepower, 10) || 75,
      status: 'available',
      hoursOperated: 0,
      dailyRate: parseFloat(machineryForm.dailyRate) || 50000,
      location: machineryForm.location,
      operator: machineryForm.operator,
      fuelLevel: 100
    };
    setFleet([newItem, ...fleet]);
    setIsAddMachineryOpen(false);
    showFeedback(`Machinery "${newItem.name}" added to active fleet!`);
    setMachineryForm({
      name: '',
      category: 'Tractor (75 HP)',
      horsepower: '75',
      dailyRate: '75000',
      operator: 'Assigned Driver',
      location: 'Central Depot - Ibadan'
    });
  };

  const handleJobActionConfirm = () => {
    if (!selectedJobAction) return;
    const { id, action, title } = selectedJobAction;
    setLocalBookings(prev => prev.map(b => {
      if (b.id === id) {
        if (action === 'accept') return { ...b, status: 'accepted' };
        if (action === 'decline') return { ...b, status: 'cancelled' };
        if (action === 'complete') return { ...b, status: 'completed' };
      }
      return b;
    }));
    showFeedback(`Job "${title}" has been marked as ${action === 'accept' ? 'ACCEPTED' : action === 'decline' ? 'DECLINED' : 'COMPLETED'}.`);
    setSelectedJobAction(null);
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPayoutModalOpen(false);
    showFeedback(`Payout request of ₦${parseInt(payoutForm.amount, 10).toLocaleString()} submitted to ${payoutForm.bankName} (${payoutForm.accountNumber}). Processing in 24 hours.`);
  };

  const incomingRequests = localBookings.filter((b) => b.status === 'requested');
  const activeJobs = localBookings.filter((b) => ['accepted', 'in_progress'].includes(b.status));
  const completedJobs = localBookings.filter((b) => ['confirmed', 'completed'].includes(b.status));

  const totalEarned = completedJobs.length * 95000 + 450000;
  const inEscrow = activeJobs.length * 85000;

  const firstName = account.profile.full_name?.split(' ')[0] ?? 'Provider';

  const menuItems = [
    { id: 'overview', label: 'Fleet Pulse', icon: Activity, badge: null },
    { id: 'jobs', label: 'Jobs & Bookings', icon: Calendar, badge: incomingRequests.length || null },
    { id: 'fleet', label: 'Machinery Roster', icon: Tractor, badge: fleet.length },
    { id: 'services', label: 'Service Catalog', icon: Layers, badge: services.length },
    { id: 'financials', label: 'Escrow & Payouts', icon: DollarSign, badge: null },
    { id: 'profile', label: 'Depot & Settings', icon: Settings, badge: null }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-gray-50/50">
      {/* Mobile Menu Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-secondary-container/40 rounded-lg text-primary">
            <Tractor className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Provider Fleet OS</h2>
            <p className="text-xs text-primary-container font-medium">Verified Mechanization Partner</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${mobileMenuOpen ? 'block' : 'hidden'} 
        lg:block w-full lg:w-64 bg-white border-r border-gray-200 shrink-0 z-30
      `}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
              <Tractor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 leading-tight">Agro-Fleet Pro</h2>
              <span className="inline-flex items-center text-xs text-primary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded-full mt-0.5">
                <CheckCircle className="h-3 w-3 mr-1 text-secondary" />
                Verified Depot
              </span>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors
                  ${isActive 
                    ? 'bg-primary text-white shadow-xs' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge className={`text-xs px-1.5 py-0 ${isActive ? 'bg-white/20 text-white' : 'bg-tertiary-fixed/60 text-[#92400e]'}`}>
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Depot Status */}
        <div className="p-4 mx-3 my-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Available Units</span>
            <span className="font-bold text-gray-900">{fleet.filter(f => f.status === 'available').length} / {fleet.length}</span>
          </div>
          <Progress 
            value={(fleet.filter(f => f.status === 'available').length / (fleet.length || 1)) * 100} 
            className="h-1.5 bg-gray-200" 
          />
          <div className="flex justify-between items-center text-gray-500 pt-1">
            <span>Depot Hub:</span>
            <span className="font-medium text-gray-800">Oyo / Ibadan</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-5">
        {feedback && (
          <Alert className="border-secondary/40 bg-surface-container-low text-primary animate-in fade-in">
            <CheckCircle className="h-4 w-4 text-primary-container" />
            <AlertDescription className="text-xs font-medium">
              {feedback}
            </AlertDescription>
          </Alert>
        )}

        {/* 1. OVERVIEW / FLEET PULSE */}
        {activeMenu === 'overview' && (
          <div className="space-y-5">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-serif">
                  Good day, {firstName}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Mechanization operations overview across Oyo, Benue, and Kwara farming belts.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs text-primary"
                  onClick={() => setIsAddMachineryOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1 text-primary-container" />
                  + Add Machinery
                </Button>
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary text-white text-xs shadow-sm"
                  onClick={() => setIsPayoutModalOpen(true)}
                >
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  Request Payout
                </Button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4 border-l-4 border-l-caution border-gray-100 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Incoming Requests</span>
                <p className="text-2xl font-bold text-[#b45309] mt-1">{incomingRequests.length}</p>
                <p className="text-xs text-[#b45309] font-medium mt-0.5">Awaiting response</p>
              </Card>

              <Card className="p-4 border-l-4 border-l-node-600 border-gray-100 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active In-Field</span>
                <p className="text-2xl font-bold text-node-800 mt-1">{activeJobs.length}</p>
                <p className="text-xs text-node-700 font-medium mt-0.5">Tractors deployed</p>
              </Card>

              <Card className="p-4 border-l-4 border-l-primary-container border-gray-100 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Settled Revenue</span>
                <p className="text-2xl font-bold text-primary mt-1">{formatCurrencyCompact(totalEarned)}</p>
                <p className="text-xs text-primary-container font-medium mt-0.5">+₦{inEscrow.toLocaleString()} in escrow</p>
              </Card>

              <Card className="p-4 border-l-4 border-l-blue-500 border-gray-100 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider Rating</span>
                <p className="text-2xl font-bold text-gray-900 mt-1">4.9 ★</p>
                <p className="text-xs text-primary-container font-medium mt-0.5">Top 5% verified depot</p>
              </Card>
            </div>

            {/* Urgent Job Action Banner */}
            {incomingRequests.length > 0 && (
              <div className="p-4 bg-caution-soft/60 border border-caution/30 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-[#b45309]" />
                  <div>
                    <h3 className="text-xs font-bold text-[#78350f]">
                      {incomingRequests.length} Farmer Booking Request(s) Awaiting Confirmation
                    </h3>
                    <p className="text-xs text-[#b45309]">Accept within 24 hours to secure equipment dispatch escrow.</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-tertiary-container hover:bg-tertiary-container text-white text-xs"
                  onClick={() => setActiveMenu('jobs')}
                >
                  Review Bookings
                </Button>
              </div>
            )}

            {/* Two Column Grid: Active Deployments & Live Fleet Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Active In-Field Deployments */}
              <Card className="lg:col-span-2 p-5 border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-primary-container" />
                    Live Field Operations & Telemetry
                  </h3>
                  <Badge variant="secondary" className="text-xs">Live GPS Linked</Badge>
                </div>

                {fleet.filter(f => f.status === 'deployed').length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No equipment currently deployed in the field.</p>
                ) : (
                  <div className="space-y-3">
                    {fleet.filter(f => f.status === 'deployed').map(item => (
                      <div key={item.id} className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                            <p className="text-xs text-gray-500 flex items-center mt-0.5">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              {item.location}
                            </p>
                          </div>
                          <Badge className="bg-secondary-container/40 text-primary text-xs">In Field Operation</Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                          <div>
                            <span className="text-gray-500">Operator:</span>
                            <p className="font-semibold text-gray-800">{item.operator}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Daily Rate:</span>
                            <p className="font-semibold text-primary-container">{formatCurrency(item.dailyRate)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Fuel Level:</span>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <Progress value={item.fuelLevel} className="h-1.5 flex-1 bg-gray-200" />
                              <span className="font-bold text-gray-700 text-xs">{item.fuelLevel}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Machinery Ready Queue */}
              <Card className="p-5 border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <Tractor className="h-4 w-4 mr-2 text-primary-container" />
                    Available at Depot
                  </h3>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-primary-container" onClick={() => setActiveMenu('fleet')}>
                    View All
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {fleet.filter(f => f.status === 'available').map(m => (
                    <div key={m.id} className="p-3 bg-white border border-gray-100 rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-900">{m.name}</span>
                        <span className="text-primary-container font-semibold">{formatCurrency(m.dailyRate)}/day</span>
                      </div>
                      <p className="text-xs text-gray-500">{m.category} · {m.horsepower} HP</p>
                      <div className="flex justify-between text-xs text-gray-400 pt-1">
                        <span>Operator: {m.operator}</span>
                        <span>Fuel: {m.fuelLevel}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2. JOBS & BOOKINGS */}
        {activeMenu === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-serif">Jobs & Field Bookings</h1>
                <p className="text-xs text-gray-600">Review incoming farmer requests, dispatch equipment, and confirm completed acreage.</p>
              </div>
            </div>

            <Tabs defaultValue="incoming" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="incoming" className="text-xs">
                  Incoming Requests ({incomingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs">
                  Active Jobs ({activeJobs.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">
                  Completed & Settled ({completedJobs.length})
                </TabsTrigger>
              </TabsList>

              {/* Incoming Requests Tab */}
              <TabsContent value="incoming" className="space-y-3">
                {incomingRequests.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500 text-xs">
                    <CheckCircle className="h-8 w-8 mx-auto text-secondary mb-2" />
                    <p className="font-semibold text-gray-700">No pending booking requests.</p>
                    <p>New farmer inquiries for tillage, planting or spraying will appear here.</p>
                  </Card>
                ) : (
                  incomingRequests.map((req) => (
                    <Card key={req.id} className="p-4 border-2 border-caution/30 bg-caution-soft/20 space-y-3">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-sm text-gray-900">{req.title}</h3>
                            <Badge className="bg-tertiary-fixed/60 text-[#92400e] text-xs">New Inquiry</Badge>
                          </div>
                          <p className="text-xs text-gray-600 font-medium mt-0.5">
                            {req.farm_name} · {[req.job_lga, req.job_state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">Agreed Escrow:</span>
                          <p className="text-base font-bold text-primary">{formatCurrency(req.total_price_kobo / 100)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-lg border border-gray-100">
                        <div>
                          <span className="text-gray-500">Service:</span>
                          <p className="font-semibold text-gray-800">{req.service_type || 'Tractor Tillage'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Requested Dates:</span>
                          <p className="font-semibold text-gray-800">{req.date_range_display || 'Immediate'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Farm Location:</span>
                          <p className="font-semibold text-gray-800">{req.job_lga}, {req.job_state}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Farmer Contact:</span>
                          <p className="font-semibold text-gray-800">{req.contact_phone || 'Verified on platform'}</p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs text-red-600 hover:bg-red-50"
                          onClick={() => setSelectedJobAction({ id: req.id, title: req.title, action: 'decline' })}
                        >
                          Decline Request
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary text-white text-xs"
                          onClick={() => setSelectedJobAction({ id: req.id, title: req.title, action: 'accept' })}
                        >
                          Accept & Dispatch Tractor
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Active Jobs Tab */}
              <TabsContent value="active" className="space-y-3">
                {activeJobs.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500 text-xs">
                    <p className="font-semibold text-gray-700">No active jobs currently in execution.</p>
                  </Card>
                ) : (
                  activeJobs.map((req) => (
                    <Card key={req.id} className="p-4 border-gray-200 bg-white space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-sm text-gray-900">{req.title}</h3>
                            <Badge className="bg-node-100 text-node-800 text-xs">In Field Progress</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{req.farm_name} · {req.job_lga}, {req.job_state}</p>
                        </div>
                        <p className="text-base font-bold text-primary">{formatCurrency(req.total_price_kobo / 100)}</p>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary text-white text-xs"
                          onClick={() => setSelectedJobAction({ id: req.id, title: req.title, action: 'complete' })}
                        >
                          Mark Acreage Completed & Release Escrow
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Completed Jobs Tab */}
              <TabsContent value="completed" className="space-y-3">
                {completedJobs.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500 text-xs">
                    <p className="font-semibold text-gray-700">Completed jobs will appear here with settlement proof.</p>
                  </Card>
                ) : (
                  completedJobs.map((req) => (
                    <Card key={req.id} className="p-4 border-gray-100 bg-white flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{req.title}</p>
                        <p className="text-gray-500 mt-0.5">{req.farm_name} · Completed & Settled</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-secondary-container/40 text-primary mb-1">Settled to Bank</Badge>
                        <p className="font-bold text-gray-900">{formatCurrency(req.total_price_kobo / 100)}</p>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* 3. MACHINERY ROSTER */}
        {activeMenu === 'fleet' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-serif">Machinery Roster & Fleet</h1>
                <p className="text-xs text-gray-600">Track equipment horsepower, operator assignments, operating hours and daily rental tariffs.</p>
              </div>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary text-white text-xs"
                onClick={() => setIsAddMachineryOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Register New Equipment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fleet.map((item) => (
                <Card key={item.id} className="p-4 border-gray-100 bg-white space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-surface-container-low rounded-lg flex items-center justify-center text-primary border border-secondary/20">
                        <Tractor className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.category} · {item.horsepower} HP</p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${
                      item.status === 'available' ? 'bg-secondary-container/40 text-primary' :
                      item.status === 'deployed' ? 'bg-node-100 text-node-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-500">Daily Tariff:</span>
                      <p className="font-bold text-primary">{formatCurrency(item.dailyRate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Hours Meter:</span>
                      <p className="font-semibold text-gray-800">{item.hoursOperated} hrs</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Assigned Driver:</span>
                      <p className="font-semibold text-gray-800">{item.operator}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                      {item.location}
                    </span>
                    <span className="flex items-center font-medium text-gray-700">
                      <Fuel className="h-3.5 w-3.5 mr-1 text-[#b45309]" />
                      {item.fuelLevel}% Fuel
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 4. SERVICES CATALOG */}
        {activeMenu === 'services' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">Service Catalog & Hectare Tariffs</h1>
              <p className="text-xs text-gray-600">Configured mechanization rates offered on CultivaNode Marketplace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((srv) => (
                <Card key={srv.id} className="p-4 border-gray-100 bg-white flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{srv.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{srv.unit}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-base font-bold text-primary">{formatCurrency(srv.rate)}</p>
                    <Badge className="bg-secondary-container/40 text-primary text-xs">Live on Marketplace</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 5. FINANCIALS & PAYOUTS */}
        {activeMenu === 'financials' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-serif">Financials, Escrow & Settlements</h1>
                <p className="text-xs text-gray-600">Track paid farmer job escrows and direct deposits to your Nigerian bank account.</p>
              </div>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary text-white text-xs"
                onClick={() => setIsPayoutModalOpen(true)}
              >
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                Request Bank Payout
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-gray-100 bg-white">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Settled Earnings</span>
                <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(totalEarned)}</p>
                <p className="text-xs text-primary-container mt-1">Disbursed to primary commercial bank</p>
              </Card>

              <Card className="p-5 border-gray-100 bg-white">
                <span className="text-xs text-gray-500 font-semibold uppercase">Active In Escrow</span>
                <p className="text-3xl font-bold text-node-800 mt-1">{formatCurrency(inEscrow)}</p>
                <p className="text-xs text-gray-500 mt-1">Held until field completion confirmation</p>
              </Card>

              <Card className="p-5 border-gray-100 bg-white">
                <span className="text-xs text-gray-500 font-semibold uppercase">Platform Service Fee</span>
                <p className="text-3xl font-bold text-gray-700 mt-1">3.5%</p>
                <p className="text-xs text-gray-500 mt-1">Includes GPS telemetry & invoice audit</p>
              </Card>
            </div>

            <Card className="p-5 border-gray-100 bg-white space-y-3">
              <h3 className="font-bold text-sm text-gray-900">Recent Escrow Settlements</h3>
              <div className="space-y-2 text-xs">
                {[
                  { desc: 'Deep Ploughing (12 ha) - Adewale Farm', date: 'Yesterday', amount: 456000, bank: 'Access Bank ***6789' },
                  { desc: 'Cassava Ridging (8 ha) - Green Valley', date: 'Aug 04, 2024', amount: 200000, bank: 'Access Bank ***6789' },
                  { desc: 'Drone Spraying (20 ha) - Plateau Hub', date: 'Jul 29, 2024', amount: 300000, bank: 'Access Bank ***6789' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                    <div>
                      <p className="font-bold text-gray-900">{item.desc}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.date} · Deposited to {item.bank}</p>
                    </div>
                    <span className="font-bold text-primary text-sm">+{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* 6. BUSINESS PROFILE & SETTINGS */}
        {activeMenu === 'profile' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">Depot & Business Profile</h1>
              <p className="text-xs text-gray-600">Verification details, operator licenses and service coverage zones.</p>
            </div>

            <Card className="p-5 border-gray-100 bg-white space-y-4 text-xs">
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
                <div className="h-14 w-14 bg-secondary-container/40 rounded-xl flex items-center justify-center text-primary">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">{account.profile.full_name || 'Agro-Fleet Pro'}</h3>
                  <p className="text-gray-500">Tier 2 Accredited Mechanization Depot</p>
                  <Badge className="bg-secondary-container/40 text-primary mt-1">Verified CAC / Cooperative</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 font-medium">Headquarters State</span>
                  <p className="font-semibold text-gray-800 mt-0.5">Oyo State</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Primary Depot LGA</span>
                  <p className="font-semibold text-gray-800 mt-0.5">Ibadan North</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Registered Operators</span>
                  <p className="font-semibold text-gray-800 mt-0.5">4 Certified Drivers</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Payout Bank</span>
                  <p className="font-semibold text-gray-800 mt-0.5">Access Bank (0123456789)</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary text-white text-xs"
                  onClick={() => showFeedback('Depot profile and operating territory updated.')}
                >
                  Save Depot Profile
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Add Machinery Modal */}
      <Dialog open={isAddMachineryOpen} onOpenChange={setIsAddMachineryOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddMachinery}>
            <DialogHeader>
              <DialogTitle>Register Machinery into Fleet</DialogTitle>
              <DialogDescription>
                Add tractor, harvester, or drone to receive automated farmer service bookings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700">Equipment Make & Model</label>
                <Input
                  required
                  placeholder="e.g. John Deere 5075E, Massey Ferguson 385"
                  value={machineryForm.name}
                  onChange={(e) => setMachineryForm({ ...machineryForm, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Category</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={machineryForm.category}
                    onChange={(e) => setMachineryForm({ ...machineryForm, category: e.target.value })}
                  >
                    <option value="Tractor (75 HP)">Tractor (75 HP)</option>
                    <option value="Tractor (90 HP+)">Heavy Tractor (90 HP+)</option>
                    <option value="Combine Harvester">Combine Harvester</option>
                    <option value="Agrochemical Drone">Agrochemical Drone</option>
                    <option value="Boom Sprayer">Boom Sprayer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Horsepower (HP)</label>
                  <Input
                    type="number"
                    value={machineryForm.horsepower}
                    onChange={(e) => setMachineryForm({ ...machineryForm, horsepower: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Daily Rental Tariff (₦)</label>
                  <Input
                    type="number"
                    value={machineryForm.dailyRate}
                    onChange={(e) => setMachineryForm({ ...machineryForm, dailyRate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Assigned Driver / Operator</label>
                  <Input
                    value={machineryForm.operator}
                    onChange={(e) => setMachineryForm({ ...machineryForm, operator: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Current Depot / Yard Location</label>
                <Input
                  value={machineryForm.location}
                  onChange={(e) => setMachineryForm({ ...machineryForm, location: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddMachineryOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary text-white">
                Save Machinery
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payout Modal */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handlePayoutSubmit}>
            <DialogHeader>
              <DialogTitle>Request Bank Settlement Payout</DialogTitle>
              <DialogDescription>
                Transfer settled job revenues directly to your verified commercial bank account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="bg-surface-container-low p-3 rounded-lg border border-secondary/30">
                <span className="text-primary">Available Settled Balance:</span>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalEarned)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Withdrawal Amount (₦)</label>
                <Input
                  type="number"
                  min="5000"
                  max={totalEarned}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Bank Name</label>
                  <Input
                    value={payoutForm.bankName}
                    onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Account Number</label>
                  <Input
                    value={payoutForm.accountNumber}
                    onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPayoutModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary text-white">
                Authorize Payout
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Job Action Confirmation Modal */}
      {selectedJobAction && (
        <Dialog open={!!selectedJobAction} onOpenChange={() => setSelectedJobAction(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="capitalize">
                {selectedJobAction.action} Job Request
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {selectedJobAction.action} <strong>{selectedJobAction.title}</strong>?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button size="sm" variant="outline" onClick={() => setSelectedJobAction(null)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                className={selectedJobAction.action === 'decline' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary text-white'}
                onClick={handleJobActionConfirm}
              >
                Confirm {selectedJobAction.action}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
