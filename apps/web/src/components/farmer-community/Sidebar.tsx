'use client';

import React, { useEffect } from 'react';
import {
  LayoutGrid, MapPin, Wheat, Heart, Cpu, Droplets, CloudRain,
  BarChart3, CheckSquare, Settings, Leaf, Wrench, Users,
  DollarSign, ShoppingCart, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useIsMobile } from './ui/use-mobile';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
}

export const menuGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    ]
  },
  {
    label: 'Farm Operations',
    items: [
      { id: 'farms', label: 'Farms & Land', icon: MapPin },
      { id: 'crops', label: 'Crops & Fields', icon: Wheat },
      { id: 'livestock', label: 'Livestock', icon: Heart },
      { id: 'equipment', label: 'Machinery & Tools', icon: Wrench },
      { id: 'labor', label: 'Labor & Workforce', icon: Users },
      { id: 'irrigation', label: 'Irrigation & Water', icon: Droplets },
    ]
  },
  {
    label: 'Commerce',
    items: [
      { id: 'sales', label: 'Sales & Revenue', icon: DollarSign },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'iot-devices', label: 'IoT Devices', icon: Cpu },
      { id: 'weather', label: 'Microclimate Weather', icon: CloudRain },
      { id: 'reports', label: 'Reports & Audits', icon: BarChart3 },
      { id: 'tasks', label: 'Tasks & Alerts', icon: CheckSquare },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  }
];

function SidebarContent({
  activeTab, onTabChange, collapsed, onCollapsedChange, isMobileDrawer = false, onClose, userName, userEmail
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (c: boolean) => void;
  isMobileDrawer?: boolean;
  onClose?: () => void;
  userName?: string;
  userEmail?: string;
}) {
  const showLabels = !collapsed || isMobileDrawer;

  const handleItemClick = (id: string) => {
    onTabChange(id);
    if (onClose) onClose();
  };

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CN';

  return (
    <div className="flex flex-col h-full select-none" style={{ background: 'linear-gradient(180deg, #14532d 0%, #1a6b38 100%)' }}>
      {/* Brand Header */}
      <div className={`flex items-center border-b border-green-700/60 ${showLabels ? 'px-4 py-4' : 'justify-center px-2 py-4'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-green-400/20 shrink-0">
            <Leaf className="h-4.5 w-4.5 text-green-300" style={{ width: '18px', height: '18px' }} />
          </div>
          {showLabels && (
            <div>
              <span className="text-[15px] font-bold text-white tracking-tight font-serif">CultivaNode</span>
              <p className="text-[10px] text-green-300/80 leading-none mt-0.5">Farm Management OS</p>
            </div>
          )}
        </div>
        {isMobileDrawer && onClose && (
          <button onClick={onClose} className="ml-auto p-1 rounded-md text-green-300 hover:text-white hover:bg-green-700/50">
            <X className="h-4 w-4" />
          </button>
        )}
        {!isMobileDrawer && (
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="ml-auto p-1 rounded-md text-green-400 hover:text-white hover:bg-green-700/50 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Navigation Tree with Parent & Sub-Parent Menus */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {showLabels && (
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-green-400/60 select-none">
                {group.label}
              </p>
            )}
            {!showLabels && <div className="my-1 mx-2 border-t border-green-700/40" />}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={!showLabels ? item.label : undefined}
                  className={`relative group w-full flex items-center text-left transition-all duration-150 text-[13px]
                    ${showLabels ? 'px-3 mx-1 w-[calc(100%-8px)] py-2 rounded-lg' : 'justify-center py-2.5 w-full'}
                    ${isActive
                      ? 'bg-white/20 text-white font-semibold shadow-sm'
                      : 'text-green-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {/* Active indicator pill */}
                  {isActive && showLabels && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-green-300" />
                  )}

                  <Icon className={`shrink-0 ${showLabels ? 'h-4 w-4 mr-2.5' : 'h-4.5 w-4.5'} ${isActive ? 'text-green-300' : 'text-green-400/70 group-hover:text-green-300'}`}
                    style={!showLabels ? { width: '18px', height: '18px' } : undefined}
                  />
                  {showLabels && <span className="truncate">{item.label}</span>}

                  {/* Tooltip (when collapsed) */}
                  {!showLabels && (
                    <span className="absolute left-full ml-2.5 px-2.5 py-1 text-xs bg-gray-900 text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile badge */}
      {showLabels && (
        <div className="border-t border-green-700/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-400/30 flex items-center justify-center text-green-100 text-xs font-bold shrink-0 border border-green-400/40">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{userName || 'Producer Admin'}</p>
              <p className="text-[10px] text-green-300/80 truncate">{userEmail || 'farmer@cultivanode.com'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
  userName,
  userEmail
}: SidebarProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile && mobileOpen) onMobileOpenChange(false);
  }, [isMobile, mobileOpen, onMobileOpenChange]);

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onMobileOpenChange(false)} />
            <div className="relative z-50 w-64 shadow-2xl">
              <SidebarContent
                activeTab={activeTab}
                onTabChange={onTabChange}
                collapsed={false}
                onCollapsedChange={() => {}}
                isMobileDrawer
                onClose={() => onMobileOpenChange(false)}
                userName={userName}
                userEmail={userEmail}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className={`relative shrink-0 shadow-lg transition-all duration-200 ${collapsed ? 'w-14' : 'w-60'}`}>
      <SidebarContent
        activeTab={activeTab}
        onTabChange={onTabChange}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        userName={userName}
        userEmail={userEmail}
      />
    </aside>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/80 transition-colors" aria-label="Open menu">
      <Menu className="h-5 w-5" />
    </button>
  );
}
