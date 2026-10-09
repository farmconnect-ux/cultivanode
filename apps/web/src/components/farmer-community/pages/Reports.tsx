'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatCurrency, formatCurrencyCompact } from '../ui/currency-utils';
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Droplets, Zap } from 'lucide-react';

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const reportTypes = [
    { id: 'production', name: 'Production & Yield Report', description: 'Grain harvest weights, tuber yields and livestock productivity' },
    { id: 'financial', name: 'Financial & Ledger Statement', description: 'Gross revenue, input expenses, and net profit margins' },
    { id: 'environmental', name: 'Environmental Impact Audit', description: 'Borehole water extraction, solar kWh generation, soil health' },
    { id: 'operational', name: 'Workforce & Equipment Summary', description: 'Tractor hours, diesel usage, seasonal labor shifts' }
  ];

  const quickStats = [
    { label: 'Total Revenue', value: '₦14,850,000', change: '+12%', color: 'text-leaf-700' },
    { label: 'Operating Costs', value: '₦5,230,000', change: '-8%', color: 'text-red-600' },
    { label: 'Water Usage', value: '2,340,000L', change: '-5%', color: 'text-blue-600' },
    { label: 'Solar Generation', value: '45,600 kWh', change: '+3%', color: 'text-harvest-600' }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-serif">Reports & Analytics</h1>
          <p className="text-sm text-gray-600">Export audited agricultural performance reports and financial ledgers</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 h-8 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week" className="text-xs">Last Week</SelectItem>
              <SelectItem value="month" className="text-xs">Last Month</SelectItem>
              <SelectItem value="quarter" className="text-xs">Last Quarter</SelectItem>
              <SelectItem value="year" className="text-xs">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs shadow-sm">
            <Download className="h-4 w-4 mr-1" />
            Export CSV / PDF
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((stat, index) => (
          <Card key={index} className="p-4 border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                <p className={`text-xs font-semibold ${stat.color}`}>{stat.change} vs prior term</p>
              </div>
              {index === 0 && <DollarSign className="h-8 w-8 text-leaf-700" />}
              {index === 1 && <TrendingUp className="h-8 w-8 text-red-600" />}
              {index === 2 && <Droplets className="h-8 w-8 text-blue-600" />}
              {index === 3 && <Zap className="h-8 w-8 text-harvest-600" />}
            </div>
          </Card>
        ))}
      </div>

      {/* Report Generation */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="text-xs">Generate Reports</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report) => (
              <Card key={report.id} className="p-4 border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{report.name}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{report.description}</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-leaf-700" />
                </div>
                <div className="space-y-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Select farm estate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Farm Estates</SelectItem>
                      <SelectItem value="ibadan" className="text-xs">Ibadan Agro Hub</SelectItem>
                      <SelectItem value="benue" className="text-xs">Benue Yam & Grains</SelectItem>
                      <SelectItem value="kano" className="text-xs">Kano Groundnut Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="w-full bg-leaf-800 hover:bg-leaf-900 text-white h-8 text-xs shadow-sm">
                    Generate Report
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-4 border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Reports</h3>
            <div className="space-y-2">
              {[
                { name: 'Crop Yield & Harvest - Q3 2024', date: '2024-08-09', type: 'Production', status: 'Ready' },
                { name: 'Financial Ledger & Margin Statement', date: '2024-07-31', type: 'Financial', status: 'Ready' },
                { name: 'Environmental & Borehole Audit - July', date: '2024-08-01', type: 'Environmental', status: 'Processing' },
                { name: 'Labor Payroll & Equipment Hours', date: '2024-08-05', type: 'Operational', status: 'Ready' }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(report.date).toLocaleDateString()}</span>
                      <Badge variant="secondary" className="text-xs">{report.type}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${
                      report.status === 'Ready' ? 'bg-leaf-100 text-leaf-800' : 'bg-harvest-100 text-harvest-800'
                    }`}>
                      {report.status}
                    </Badge>
                    {report.status === 'Ready' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analytics Overview */}
      <Card className="p-4 border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Enterprise Performance Overview</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agronomic Yield Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Crop Yield Efficiency</span>
                <span className="text-leaf-700 font-semibold">+8.5%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Livestock Productivity</span>
                <span className="text-leaf-700 font-semibold">+12.3%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Land Utilization</span>
                <span className="text-node-700 font-semibold">94.2%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost & Margin Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Cost per Hectare</span>
                <span className="text-leaf-700 font-semibold">-5.2%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Solar vs Diesel Savings</span>
                <span className="text-leaf-700 font-semibold">+₦480,000</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Casual Labor Efficiency</span>
                <span className="text-harvest-600 font-semibold">+6.4%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resource Sustainability</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Groundwater Conservation</span>
                <span className="text-leaf-700 font-semibold">-8.7%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Soil Carbon Sequestration</span>
                <span className="text-leaf-700 font-semibold">+4.3%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Harvest Waste Reduction</span>
                <span className="text-leaf-700 font-semibold">-12.5%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
