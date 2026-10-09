'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileMenuButton, menuGroups } from './Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Farms } from './pages/Farms';
import { Crops } from './pages/Crops';
import { Livestock } from './pages/Livestock';
import { Equipment } from './pages/Equipment';
import { Labor } from './pages/Labor';
import { Sales } from './pages/Sales';
import { Marketplace } from './pages/Marketplace';
import { IoTDevices } from './pages/IoTDevices';
import { Irrigation } from './pages/Irrigation';
import { Weather } from './pages/Weather';
import { Reports } from './pages/Reports';
import { Tasks } from './pages/Tasks';
import { Settings } from './pages/Settings';
import { QuickActionModal } from './modals/QuickActionModal';
import { useIsMobile } from './ui/use-mobile';
import { Button } from './ui/button';
import { signOut } from '@/actions/auth';
import { Leaf, Plus, Bell, LogOut } from 'lucide-react';

const pageTitles: Record<string, string> = {
  dashboard: 'Executive Dashboard',
  farms: 'Farm Estates & Land Registry',
  crops: 'Crop Cycles & Phenology',
  livestock: 'Livestock Herd Management',
  equipment: 'Machinery & Tractor Fleet',
  labor: 'Workforce & Time Tracking',
  sales: 'Sales & Revenue Ledger',
  marketplace: 'Commodities Marketplace',
  'iot-devices': 'IoT Hardware & Sensors',
  irrigation: 'Irrigation & Pumping Stations',
  weather: 'Hyper-Local Microclimate',
  reports: 'Reports & Audited Exports',
  tasks: 'Field Tasks & Alerts',
  settings: 'System & Farm Preferences',
};

interface FarmerCommunityDashboardProps {
  initialTab?: string;
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
}

export function FarmerCommunityDashboard({
  initialTab = 'dashboard',
  userName,
  userEmail,
  onSignOut,
}: FarmerCommunityDashboardProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(urlTab || initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleQuickAction = (type: string, data?: any) => {
    console.log('Farmer Community Quick Action Triggered:', type, data);
    if (type === 'farm') handleTabChange('farms');
    else if (type === 'irrigation') handleTabChange('irrigation');
    else if (type === 'report') handleTabChange('reports');
    else if (type === 'alert') handleTabChange('tasks');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'farms':
        return <Farms />;
      case 'crops':
        return <Crops />;
      case 'livestock':
        return <Livestock />;
      case 'equipment':
        return <Equipment />;
      case 'labor':
        return <Labor />;
      case 'sales':
        return <Sales />;
      case 'marketplace':
        return <Marketplace />;
      case 'iot-devices':
        return <IoTDevices />;
      case 'irrigation':
        return <Irrigation />;
      case 'weather':
        return <Weather />;
      case 'reports':
        return <Reports />;
      case 'tasks':
        return <Tasks />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Find which group the active tab belongs to
  const activeGroup = menuGroups.find(g => g.items.some(i => i.id === activeTab))?.label || 'Overview';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f2] text-gray-900 font-sans">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
        userName={userName}
        userEmail={userEmail}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 backdrop-blur border-b border-gray-200/80 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            {isMobile && <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-leaf-50 text-leaf-800">
                <Leaf className="h-4 w-4 text-leaf-700" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                  <span>{activeGroup}</span>
                  <span>/</span>
                  <span className="text-leaf-800 font-semibold">{pageTitles[activeTab] || 'FarmOS'}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight font-serif hidden sm:block">
                  {pageTitles[activeTab] || 'Farm Dashboard'}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              onClick={() => setQuickActionOpen(true)}
              className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs font-semibold shadow-sm h-8 px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Quick Action
            </Button>
            
            <button
              onClick={() => handleTabChange('tasks')}
              className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              title="Alerts and tasks"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-harvest-500 animate-pulse" />
            </button>

            <button
              onClick={() => {
                if (onSignOut) {
                  onSignOut();
                } else {
                  signOut();
                }
              }}
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-700 transition px-2 py-1 rounded"
              title="Sign out of CultivaNode"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[#f0f4f2] p-2 sm:p-4 md:p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
        onAction={handleQuickAction}
      />
    </div>
  );
}
export default FarmerCommunityDashboard;
