'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Smartphone,
  Mail,
  Save
} from 'lucide-react';

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    alerts: true
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'Africa/Lagos (WAT, UTC+1)',
    units: 'metric (Hectares, kg, Litres)'
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-serif">Enterprise Settings</h1>
          <p className="text-sm text-gray-600">Manage account credentials, alert channels, microclimate units and data backups</p>
        </div>
        <Button className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs shadow-sm">
          <Save className="h-4 w-4 mr-1" />
          Save Preferences
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Alert Channels</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs">Preferences</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
          <TabsTrigger value="data" className="text-xs">Data & Backups</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6 border-gray-100 shadow-sm">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 bg-leaf-100 rounded-full flex items-center justify-center border-2 border-leaf-200">
                <User className="h-8 w-8 text-leaf-800" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">Alhaji Bello Dan-Borno</h3>
                <p className="text-sm text-gray-600">Principal Estate Manager & Producer</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs">
                  Change Photo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-xs font-semibold text-gray-700">First Name</Label>
                <Input id="firstName" defaultValue="Bello" className="h-9 text-xs mt-1" />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs font-semibold text-gray-700">Last Name</Label>
                <Input id="lastName" defaultValue="Dan-Borno" className="h-9 text-xs mt-1" />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address</Label>
                <Input id="email" type="email" defaultValue="bello@cultivanode.farm" className="h-9 text-xs mt-1" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">Phone Number (SMS / WhatsApp)</Label>
                <Input id="phone" defaultValue="+234 803 123 4567" className="h-9 text-xs mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="role" className="text-xs font-semibold text-gray-700">Platform Permissions</Label>
                <Select defaultValue="manager">
                  <SelectTrigger className="h-9 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" className="text-xs">Estate Owner / Executive Admin</SelectItem>
                    <SelectItem value="manager" className="text-xs">Farm Operations Manager</SelectItem>
                    <SelectItem value="agronomist" className="text-xs">Agronomist & Soil Specialist</SelectItem>
                    <SelectItem value="worker" className="text-xs">Field Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6 border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold mb-4 flex items-center text-gray-900">
              <Bell className="h-5 w-5 mr-2 text-leaf-700" />
              Notification & Dispatch Channels
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Summaries</p>
                  <p className="text-xs text-gray-500">Daily yield digest and weekly accounting ledger reports</p>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications(prev => ({...prev, email: checked}))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">SMS / WhatsApp Emergency Pings</p>
                  <p className="text-xs text-gray-500">Immediate text message when borehole or solar sensors trip offline</p>
                </div>
                <Switch 
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications(prev => ({...prev, sms: checked}))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Browser & Mobile Push Alerts</p>
                  <p className="text-xs text-gray-500">Real-time alerts for commodity buyer bids and weather warnings</p>
                </div>
                <Switch 
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications(prev => ({...prev, push: checked}))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Automated Equipment Faults</p>
                  <p className="text-xs text-gray-500">Critical diagnostic codes broadcasted from connected tractors and pumps</p>
                </div>
                <Switch 
                  checked={notifications.alerts}
                  onCheckedChange={(checked) => setNotifications(prev => ({...prev, alerts: checked}))}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6 border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold mb-4 text-gray-900">Localization & Agronomy Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme" className="text-xs font-semibold text-gray-700">Display Theme</Label>
                <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({...prev, theme: value}))}>
                  <SelectTrigger className="h-9 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" className="text-xs">CultivaNode Classic (Green & Cream)</SelectItem>
                    <SelectItem value="dark" className="text-xs">Dark Field Mode</SelectItem>
                    <SelectItem value="auto" className="text-xs">System Synchronized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language" className="text-xs font-semibold text-gray-700">Language</Label>
                <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({...prev, language: value}))}>
                  <SelectTrigger className="h-9 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en" className="text-xs">English (Nigeria)</SelectItem>
                    <SelectItem value="yo" className="text-xs">Yorùbá</SelectItem>
                    <SelectItem value="ha" className="text-xs">Hausa</SelectItem>
                    <SelectItem value="ig" className="text-xs">Igbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone" className="text-xs font-semibold text-gray-700">Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({...prev, timezone: value}))}>
                  <SelectTrigger className="h-9 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Lagos (WAT, UTC+1)" className="text-xs">West Africa Time (WAT, UTC+1)</SelectItem>
                    <SelectItem value="UTC" className="text-xs">UTC Universal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="units" className="text-xs font-semibold text-gray-700">Agronomic Measurement Units</Label>
                <Select value={preferences.units} onValueChange={(value) => setPreferences(prev => ({...prev, units: value}))}>
                  <SelectTrigger className="h-9 text-xs bg-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric" className="text-xs">Metric (Hectares, Kilograms, Litres)</SelectItem>
                    <SelectItem value="imperial" className="text-xs">Imperial (Acres, Pounds, Gallons)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <Card className="p-6 border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold mb-4 flex items-center text-gray-900">
              <Shield className="h-5 w-5 mr-2 text-leaf-700" />
              Security & Credential Management
            </h3>
            
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="currentPassword" className="text-xs font-semibold text-gray-700">Current Password</Label>
                <Input id="currentPassword" type="password" className="h-9 text-xs mt-1" />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-xs font-semibold text-gray-700">New Password</Label>
                <Input id="newPassword" type="password" className="h-9 text-xs mt-1" />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" className="h-9 text-xs mt-1" />
              </div>
              <Button size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs">
                Update Master Password
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold mb-2 text-gray-900">Two-Factor SMS Verification</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Protect ledger disbursements and bulk crop trades with OTP authorization</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                Enable 2FA OTP
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-4">
          <Card className="p-6 border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold mb-4 flex items-center text-gray-900">
              <Database className="h-5 w-5 mr-2 text-leaf-700" />
              Data Exports & Encrypted Backups
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 border border-gray-100 rounded-lg bg-white">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Export Farm Database</p>
                  <p className="text-xs text-gray-500">Download complete boundary polygons, crop cycles and ledger books in GeoJSON/CSV</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Export Data
                </Button>
              </div>

              <div className="flex items-center justify-between p-3.5 border border-gray-100 rounded-lg bg-white">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Import External Shapefiles & Telemetry</p>
                  <p className="text-xs text-gray-500">Import field boundaries from Trimble, John Deere Operations Center or QGIS</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Import Files
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
