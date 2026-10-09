'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileMenuButton, menuGroups } from './Sidebar';
import Link from "next/link";
import { Dashboard } from "./pages/Dashboard";
import { Farms } from "./pages/Farms";
import { NotYourRecords } from "./NotYourRecords";
import type { FarmerLive } from "./live";
import type { Dictionary } from "@/i18n/get-dictionary";
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
  live: FarmerLive;
  t: Dictionary;
}

export function FarmerCommunityDashboard({
  initialTab = 'dashboard',
  userName,
  userEmail,
  onSignOut,
  live,
  t,
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
    const lang = live.lang;
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard live={live} />;
      case 'farms':
        return <Farms live={live} t={t} />;
      case 'crops':
        return (
          <NotYourRecords
            title="Crop cycles"
            body="A crop plan is tied to one of your farms. Open a farm, then its crop cycles. Sample crop boards are not shown here, so they cannot be mistaken for your season."
            href={`/${lang}/account/farms`}
            cta="Choose a farm"
          />
        );
      case 'livestock':
        return (
          <NotYourRecords
            title="Livestock"
            body="Herd, feed and health tools are not part of this pilot yet. Your farms stay on the farms list."
            href={`/${lang}/account/farms`}
            cta="Back to your farms"
          />
        );
      case 'equipment':
        return (
          <NotYourRecords
            title="Machinery"
            body="To get a tractor or sprayer onto your farm, search verified providers. To offer your own machine, publish a listing."
            href={`/${lang}/account/find`}
            cta="Hire nearby"
          />
        );
      case 'labor':
        return (
          <NotYourRecords
            title="Labour"
            body="Farm hands and operators are hired through the same booking as machinery. Payment in the pilot is direct, not through CultivaNode."
            href={`/${lang}/account/find`}
            cta="Find a service"
          />
        );
      case 'sales':
      case 'reports':
        return (
          <NotYourRecords
            title="Books and reports"
            body="There is no invented revenue on this screen. Costs from a confirmed job are recorded on the booking after both sides mark it paid."
            href={`/${lang}/account/bookings`}
            cta="Open bookings"
          />
        );
      case 'marketplace':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <NotYourRecords
              title="Hire for the farm"
              body="Search machinery and labour from one of your farms. Distance uses the farm pin and the provider's service radius."
              href={`/${lang}/account/find`}
              cta="Search nearby"
            />
            <NotYourRecords
              title="Produce market"
              body="Buying and selling produce is a separate market. It is not mixed with your farm's private records."
              href={`/${lang}/marketplace`}
              cta="Open the market"
            />
          </div>
        );
      case 'iot-devices':
      case 'irrigation':
      case 'weather':
        return (
          <NotYourRecords
            title="Sensors and weather"
            body="Live probes are not connected to this account yet. Do not treat sample moisture or rainfall as your field."
            href={`/${lang}/account`}
            cta="Back to your overview"
          />
        );
      case 'tasks':
        return <Dashboard live={live} />;
      case 'settings':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Profile", `/${lang}/account/profile`, "Name, phone and language"],
              ["Roles", `/${lang}/account/roles`, "Farmer, machinery owner, services"],
              ["Identity checks", `/${lang}/account/verification`, "NIN, BVN and payout details"],
              ["Messages", `/${lang}/account/inbox`, "Booking updates"],
              ["Privacy", `/${lang}/account/privacy`, "Consent and your data"],
              ["Listings", `/${lang}/account/listings`, "Equipment and services you offer"],
            ].map(([label, href, body]) => (
              <Link key={href} href={href} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-leaf-700">
                <p className="font-bold">{label}</p>
                <p className="mt-1 text-sm text-gray-600">{body}</p>
              </Link>
            ))}
          </div>
        );
      default:
        return <Dashboard live={live} />;
    }
  };

  // Find which group the active tab belongs to
  const activeGroup = menuGroups.find(g => g.items.some(i => i.id === activeTab))?.label || 'Overview';

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#f0f4f2] text-gray-900 font-sans">
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

      <div className="flex min-w-0 flex-1 flex-col">
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
              title="Open jobs"
            >
              <Bell className="h-4 w-4" />
              {live.bookings.some((b) => b.status === "requested" || b.status === "accepted" || b.status === "in_progress" || b.status === "awaiting_confirmation") && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-harvest-500" />
              )}
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
        <main className="flex-1 bg-[#f0f4f2] p-2 sm:p-4 md:p-6">
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
