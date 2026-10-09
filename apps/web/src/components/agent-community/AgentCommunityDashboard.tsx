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
import type { Account } from '@/lib/account/session';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import {
  Users,
  CheckCircle,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Phone,
  FileText,
  Shield,
  Layers,
  Menu,
  X,
  Search,
  Filter,
  Check,
  Compass,
  Sprout,
  Activity,
  AlertTriangle,
  Award,
  Navigation,
  FileCheck2,
  Bug,
  Droplets
} from 'lucide-react';

export type AgentFarmer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  state: string | null;
  lga: string | null;
  created_at: string;
};

const DEFAULT_FARMERS: AgentFarmer[] = [
  {
    id: 'FARMER-01',
    full_name: 'Adewale Babatunde',
    phone: '+234 803 234 5678',
    state: 'Oyo',
    lga: 'Ibadan North',
    created_at: '2024-08-01'
  },
  {
    id: 'FARMER-02',
    full_name: 'Fatima Garba',
    phone: '+234 805 345 6789',
    state: 'Oyo',
    lga: 'Akinyele',
    created_at: '2024-08-03'
  },
  {
    id: 'FARMER-03',
    full_name: 'Chinedu Eze',
    phone: '+234 812 456 7890',
    state: 'Oyo',
    lga: 'Ibarapa East',
    created_at: '2024-08-05'
  },
  {
    id: 'FARMER-04',
    full_name: 'Ibrahim Aliyu',
    phone: '+234 802 567 8901',
    state: 'Oyo',
    lga: 'Ogbomosho North',
    created_at: '2024-08-07'
  }
];

interface FieldVerification {
  id: string;
  farmerName: string;
  location: string;
  hectares: number;
  crop: string;
  status: 'pending' | 'verified';
  date: string;
}

const DEFAULT_VERIFICATIONS: FieldVerification[] = [
  {
    id: 'VER-01',
    farmerName: 'Adewale Babatunde',
    location: 'Ibadan North (Plot 3)',
    hectares: 4.5,
    crop: 'Maize (OBA Super 9)',
    status: 'pending',
    date: 'Today, 2:00 PM'
  },
  {
    id: 'VER-02',
    farmerName: 'Fatima Garba',
    location: 'Akinyele Outpost',
    hectares: 8.0,
    crop: 'Cassava (TMS 30572)',
    status: 'pending',
    date: 'Tomorrow, 10:00 AM'
  },
  {
    id: 'VER-03',
    farmerName: 'Chinedu Eze',
    location: 'Ibarapa East',
    hectares: 12.0,
    crop: 'Soybeans',
    status: 'verified',
    date: 'Aug 04, 2024'
  }
];

export function AgentCommunityDashboard({
  lang,
  account,
  t,
  farmers = []
}: {
  lang: Locale;
  account: Account;
  t: Dictionary;
  farmers: AgentFarmer[];
}) {
  const [activeMenu, setActiveMenu] = useState<'console' | 'farmers' | 'verifications' | 'bookings' | 'advisory' | 'earnings'>('console');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Stateful Data
  const initialFarmers = farmers.length > 0 ? farmers : DEFAULT_FARMERS;
  const [farmerList, setFarmerList] = useState<AgentFarmer[]>(initialFarmers);
  const [verifications, setVerifications] = useState<FieldVerification[]>(DEFAULT_VERIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<FieldVerification | null>(null);

  // Onboard Form
  const [onboardForm, setOnboardForm] = useState({
    fullName: '',
    phone: '',
    state: 'Oyo',
    lga: 'Ibadan North',
    primaryCrop: 'Maize',
    farmSizeHa: '5.0'
  });

  // Commission & Stats
  const commissionBalance = farmerList.length * 2500 + verifications.filter(v => v.status === 'verified').length * 5000 + 45000;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOnboardFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.fullName) return;
    const newFarmer: AgentFarmer = {
      id: `FARMER-${String(farmerList.length + 1).padStart(2, '0')}`,
      full_name: onboardForm.fullName,
      phone: onboardForm.phone || '+234 800 000 0000',
      state: onboardForm.state,
      lga: onboardForm.lga,
      created_at: new Date().toISOString().split('T')[0]
    };
    setFarmerList([newFarmer, ...farmerList]);
    setIsOnboardModalOpen(false);
    showFeedback(`Farmer "${newFarmer.full_name}" registered successfully! Onboarding stipend (+₦2,500) credited to commission ledger.`);
    setOnboardForm({
      fullName: '',
      phone: '',
      state: 'Oyo',
      lga: 'Ibadan North',
      primaryCrop: 'Maize',
      farmSizeHa: '5.0'
    });
  };

  const handleCompleteVerification = () => {
    if (!selectedVerification) return;
    setVerifications(prev => prev.map(v => {
      if (v.id === selectedVerification.id) {
        return { ...v, status: 'verified' };
      }
      return v;
    }));
    showFeedback(`Plot for "${selectedVerification.farmerName}" verified via GPS. Verification fee (+₦5,000) credited!`);
    setIsVerifyModalOpen(false);
    setSelectedVerification(null);
  };

  const filteredFarmers = farmerList.filter(f =>
    (f.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.lga || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const agentName = account.profile.full_name?.split(' ')[0] ?? 'Agent';

  const menuItems = [
    { id: 'console', label: 'Field Console', icon: Activity, badge: null },
    { id: 'farmers', label: 'Managed Farmers', icon: Users, badge: farmerList.length },
    { id: 'verifications', label: 'Field Verifications', icon: FileCheck2, badge: verifications.filter(v => v.status === 'pending').length || null },
    { id: 'bookings', label: 'Assisted Bookings', icon: Layers, badge: 3 },
    { id: 'advisory', label: 'Agronomy Advisory', icon: Sprout, badge: null },
    { id: 'earnings', label: 'Commissions & KYC', icon: DollarSign, badge: null }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-gray-50/50">
      {/* Mobile Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-leaf-100 rounded-lg text-leaf-800">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Agent Field OS</h2>
            <p className="text-xs text-leaf-700 font-medium">Territory: Oyo State Zone</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${mobileMenuOpen ? 'block' : 'hidden'} 
        lg:block w-full lg:w-64 bg-white border-r border-gray-200 shrink-0 z-30
      `}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-leaf-800 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 leading-tight">Field Officer Console</h2>
              <span className="inline-flex items-center text-xs text-leaf-700 font-semibold bg-leaf-50 px-2 py-0.5 rounded-full mt-0.5">
                <CheckCircle className="h-3 w-3 mr-1 text-leaf-600" />
                Tier 2 Accredited
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
                    ? 'bg-leaf-800 text-white shadow-xs' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge className={`text-xs px-1.5 py-0 ${isActive ? 'bg-white/20 text-white' : 'bg-harvest-100 text-harvest-800'}`}>
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Territory Status */}
        <div className="p-4 mx-3 my-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Earned Commission</span>
            <span className="font-bold text-leaf-800">{formatCurrencyCompact(commissionBalance)}</span>
          </div>
          <Progress value={78} className="h-1.5 bg-gray-200" />
          <div className="flex justify-between items-center text-gray-500 pt-1">
            <span>Primary Zone:</span>
            <span className="font-medium text-gray-800">Ibadan / Akinyele</span>
          </div>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-5">
        {feedback && (
          <Alert className="border-leaf-300 bg-leaf-50 text-leaf-900 animate-in fade-in">
            <CheckCircle className="h-4 w-4 text-leaf-700" />
            <AlertDescription className="text-xs font-medium">
              {feedback}
            </AlertDescription>
          </Alert>
        )}

        {/* 1. FIELD CONSOLE */}
        {activeMenu === 'console' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-serif">
                  Field Console · {agentName}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Onboard smallholders, map plot boundaries, and coordinate tractor pooling across local farming clusters.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs shadow-sm"
                  onClick={() => setIsOnboardModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  + Onboard Farmer
                </Button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4 border-l-4 border-l-leaf-600 border-gray-100 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Farmers Onboarded</span>
                <p className="text-2xl font-bold text-leaf-800 mt-1">{farmerList.length}</p>
                <p className="text-xs text-leaf-700 font-medium mt-0.5">Active in your zone</p>
              </Card>

              <Card className="p-4 border-l-4 border-l-harvest-500 border-gray-100 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Verifications Due</span>
                <p className="text-2xl font-bold text-harvest-700 mt-1">{verifications.filter(v => v.status === 'pending').length}</p>
                <p className="text-xs text-harvest-700 font-medium mt-0.5">Field GPS checks</p>
              </Card>

              <Card className="p-4 border-l-4 border-l-node-600 border-gray-100 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assisted Bookings</span>
                <p className="text-2xl font-bold text-node-800 mt-1">3</p>
                <p className="text-xs text-node-700 font-medium mt-0.5">Group tillage active</p>
              </Card>

              <Card className="p-4 border-l-4 border-l-blue-500 border-gray-100 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Commission Ledger</span>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrencyCompact(commissionBalance)}</p>
                <p className="text-xs text-leaf-700 font-medium mt-0.5">Ready for withdrawal</p>
              </Card>
            </div>

            {/* Today's Field Visits */}
            <Card className="p-5 border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                  <Navigation className="h-4 w-4 mr-2 text-leaf-700" />
                  Today's Field Visits & Verification Itinerary
                </h3>
                <Badge variant="secondary" className="text-xs">GPS Route Active</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifications.map((v) => (
                  <div key={v.id} className="p-4 bg-white border border-gray-200/80 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{v.farmerName}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{v.location} · {v.crop}</p>
                      </div>
                      <Badge className={`text-xs ${v.status === 'verified' ? 'bg-leaf-100 text-leaf-800' : 'bg-harvest-100 text-harvest-800'}`}>
                        {v.status === 'verified' ? 'Verified' : 'Pending Walkthrough'}
                      </Badge>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 pt-1">
                      <span>Area: <strong className="text-gray-800">{v.hectares} ha</strong></span>
                      <span>Scheduled: <strong className="text-gray-800">{v.date}</strong></span>
                    </div>

                    {v.status === 'pending' && (
                      <Button 
                        size="sm" 
                        className="w-full bg-leaf-800 hover:bg-leaf-900 text-white text-xs h-8"
                        onClick={() => {
                          setSelectedVerification(v);
                          setIsVerifyModalOpen(true);
                        }}
                      >
                        <Compass className="h-3.5 w-3.5 mr-1" />
                        Execute GPS Verification Walk
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* 2. MANAGED FARMERS */}
        {activeMenu === 'farmers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-serif">Managed Farmers Directory</h1>
                <p className="text-xs text-gray-600">Profiles, telephone lines, and acreages of farmers onboarded under your extension jurisdiction.</p>
              </div>
              <Button 
                size="sm" 
                className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs"
                onClick={() => setIsOnboardModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Onboard New Farmer
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  placeholder="Search farmer name or LGA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFarmers.map((f) => (
                <Card key={f.id} className="p-4 border-gray-100 bg-white space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-leaf-100 rounded-full flex items-center justify-center text-leaf-800 font-bold text-sm">
                        {f.full_name?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">{f.full_name}</h3>
                        <p className="text-xs text-gray-500">{f.lga}, {f.state} State</p>
                      </div>
                    </div>
                    <Badge className="bg-leaf-100 text-leaf-800 text-xs">KYC Onboarded</Badge>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                    <span className="text-gray-500 font-medium">Contact: {f.phone}</span>
                    <a
                      href={`tel:${f.phone}`}
                      className="inline-flex items-center text-leaf-800 hover:underline font-semibold"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call Farmer
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 3. FIELD VERIFICATIONS */}
        {activeMenu === 'verifications' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">Field Boundary & Title Verifications</h1>
              <p className="text-xs text-gray-600">Conduct on-ground GPS boundary walkthroughs to certify land parcels for credit and insurance.</p>
            </div>

            <div className="space-y-3">
              {verifications.map((v) => (
                <Card key={v.id} className="p-4 border-gray-100 bg-white flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-gray-900">{v.farmerName}</h3>
                      <Badge className={`text-xs ${v.status === 'verified' ? 'bg-leaf-100 text-leaf-800' : 'bg-harvest-100 text-harvest-800'}`}>
                        {v.status === 'verified' ? 'GPS Certified' : 'Awaiting Check'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{v.location} · {v.crop} · {v.hectares} ha</p>
                  </div>

                  {v.status === 'pending' ? (
                    <Button 
                      size="sm" 
                      className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs"
                      onClick={() => {
                        setSelectedVerification(v);
                        setIsVerifyModalOpen(true);
                      }}
                    >
                      Certify Plot GPS
                    </Button>
                  ) : (
                    <div className="flex items-center text-leaf-700 text-xs font-semibold">
                      <Check className="h-4 w-4 mr-1 text-leaf-600" />
                      Audited & Certified
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 4. ASSISTED BOOKINGS */}
        {activeMenu === 'bookings' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">Assisted Mechanization Pooling</h1>
              <p className="text-xs text-gray-600">Pool smallholder farms in contiguous blocks to request discounted tractor and spraying passes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-gray-100 bg-white space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-gray-900">Akinyele Maize Cluster (Pool A)</h3>
                  <Badge className="bg-leaf-100 text-leaf-800 text-xs">Ready for Dispatch</Badge>
                </div>
                <p className="text-xs text-gray-500">6 Farmers pooled · 28.5 contiguous hectares</p>
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="font-bold text-leaf-800">₦32,000 / ha (Bulk Rate)</span>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => showFeedback('Booking dispatched to nearest depot.')}>
                    Dispatch Tractor
                  </Button>
                </div>
              </Card>

              <Card className="p-4 border-gray-100 bg-white space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-gray-900">Ibarapa Cassava Cluster (Pool B)</h3>
                  <Badge className="bg-node-100 text-node-800 text-xs">Pooling Farmers</Badge>
                </div>
                <p className="text-xs text-gray-500">4 Farmers pooled · 16.0 hectares (Need 4 ha more)</p>
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-800">Target: 20 ha</span>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => showFeedback('Farmer invited to pool.')}>
                    + Add Farmer to Pool
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 5. AGRONOMY ADVISORY */}
        {activeMenu === 'advisory' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">Field Agronomy & Pest Diagnosis</h1>
              <p className="text-xs text-gray-600">Advisory protocols for Fall Armyworm, Cassava Mosaic and fertilizer dosing in Oyo agro-climatic zone.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-gray-100 bg-white space-y-2">
                <div className="flex items-center space-x-2 text-harvest-700 font-bold text-xs">
                  <Bug className="h-4 w-4" />
                  <span>Fall Armyworm (Spodoptera frugiperda)</span>
                </div>
                <p className="text-xs text-gray-600">
                  Target window: Early whorl stage (V2-V6). Recommended application: Emamectin benzoate (50g/ha) or Chlorantraniliprole in morning hours.
                </p>
                <Badge className="bg-harvest-100 text-harvest-800 text-xs">Active Warning Zone</Badge>
              </Card>

              <Card className="p-4 border-gray-100 bg-white space-y-2">
                <div className="flex items-center space-x-2 text-leaf-700 font-bold text-xs">
                  <Droplets className="h-4 w-4" />
                  <span>Maize Top-Dressing (Urea) Protocol</span>
                </div>
                <p className="text-xs text-gray-600">
                  Apply 50kg Urea per ha at 4-5 weeks after planting when soil is moist. Avoid broadcasting during hot midday sun.
                </p>
                <Badge className="bg-leaf-100 text-leaf-800 text-xs">Recommended Practice</Badge>
              </Card>
            </div>
          </div>
        )}

        {/* 6. EARNINGS & KYC */}
        {activeMenu === 'earnings' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-serif">Commission Ledger & Payouts</h1>
                <p className="text-xs text-gray-600">Your extension incentives and bank disbursement balance.</p>
              </div>
              <Button 
                size="sm" 
                className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs"
                onClick={() => setIsPayoutModalOpen(true)}
              >
                Withdraw Commission
              </Button>
            </div>

            <Card className="p-5 border-gray-100 bg-white space-y-3">
              <span className="text-xs text-gray-500 font-semibold uppercase">Accrued Commission</span>
              <p className="text-3xl font-bold text-leaf-800">{formatCurrency(commissionBalance)}</p>
              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Farmer Onboarding Bonuses ({farmerList.length} × ₦2,500):</span>
                  <span className="font-bold text-gray-900">₦{(farmerList.length * 2500).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GPS Field Verification Audits:</span>
                  <span className="font-bold text-gray-900">₦15,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assisted Mechanization Commission (3%):</span>
                  <span className="font-bold text-gray-900">₦30,000</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Onboard Farmer Modal */}
      <Dialog open={isOnboardModalOpen} onOpenChange={setIsOnboardModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleOnboardFarmer}>
            <DialogHeader>
              <DialogTitle>Onboard Local Smallholder Farmer</DialogTitle>
              <DialogDescription>
                Register farmer into the digital cluster to enable mechanization booking and verified marketplace access.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700">Full Name</label>
                <Input
                  required
                  placeholder="e.g. Babatunde Adeleke"
                  value={onboardForm.fullName}
                  onChange={(e) => setOnboardForm({ ...onboardForm, fullName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Phone Number (SMS / Call)</label>
                <Input
                  required
                  placeholder="e.g. +234 803 123 4567"
                  value={onboardForm.phone}
                  onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">State</label>
                  <Input
                    value={onboardForm.state}
                    onChange={(e) => setOnboardForm({ ...onboardForm, state: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">LGA</label>
                  <Input
                    value={onboardForm.lga}
                    onChange={(e) => setOnboardForm({ ...onboardForm, lga: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Primary Crop</label>
                  <Input
                    value={onboardForm.primaryCrop}
                    onChange={(e) => setOnboardForm({ ...onboardForm, primaryCrop: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Estimated Acreage (ha)</label>
                  <Input
                    type="number"
                    value={onboardForm.farmSizeHa}
                    onChange={(e) => setOnboardForm({ ...onboardForm, farmSizeHa: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOnboardModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white">
                Register & Claim Bonus
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Field Verification Modal */}
      {selectedVerification && (
        <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Certify Farm Boundary GPS</DialogTitle>
              <DialogDescription>
                Auditing parcel coordinates for <strong>{selectedVerification.farmerName}</strong> ({selectedVerification.location}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="bg-leaf-50 p-3 rounded-lg border border-leaf-200">
                <span className="text-leaf-800">GPS Boundary Walk Polygons:</span>
                <p className="font-mono text-xs font-bold text-leaf-900 mt-1">
                  7.4019° N, 3.9173° E (4 Vertices Captured)
                </p>
                <p className="text-xs text-leaf-700 mt-1">Calculated Area: {selectedVerification.hectares} ha · Accuracy: ±1.2m</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Crop Health & Stage</label>
                <Input defaultValue="Vegetative stage, optimal soil moisture" className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Community Head Confirmation</label>
                <Input defaultValue="Confirmed by Baale / Cooperative Chief" className="mt-1" />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button size="sm" variant="outline" onClick={() => setIsVerifyModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white" onClick={handleCompleteVerification}>
                Approve & Certify Verification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Payout Modal */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={(e) => {
            e.preventDefault();
            setIsPayoutModalOpen(false);
            showFeedback('Commission disbursement of ₦45,000 sent to your registered bank account.');
          }}>
            <DialogHeader>
              <DialogTitle>Withdraw Commission Earnings</DialogTitle>
              <DialogDescription>
                Direct deposit to your verified agent bank account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="bg-leaf-50 p-3 rounded-lg border border-leaf-200">
                <span className="text-leaf-800">Available Balance:</span>
                <p className="text-lg font-bold text-leaf-900">{formatCurrency(commissionBalance)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Withdrawal Amount (₦)</label>
                <Input type="number" defaultValue="45000" className="mt-1" />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPayoutModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white">
                Confirm Withdrawal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
