'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatCurrency, formatCurrencyCompact } from '../ui/currency-utils';
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Droplets, Zap, CheckCircle, RefreshCw } from 'lucide-react';

interface ReportHistoryItem {
  id: string;
  name: string;
  date: string;
  type: string;
  status: 'Ready' | 'Processing';
  dataRows: (string | number)[][];
  headers: string[];
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [
    headers.join(','),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  const reportTypes = [
    { 
      id: 'production', 
      name: 'Production & Yield Report', 
      description: 'Grain harvest weights, tuber yields and livestock productivity',
      headers: ['Commodity', 'Variety', 'Field Location', 'Planted Area (ha)', 'Harvest Output (MT)', 'Yield Eff (%)'],
      rows: [
        ['Maize', 'OBA Super 9', 'Ibadan Farm - Zone 1', '12.5', '45.2', '94%'],
        ['Cassava', 'TMS 30572', 'Ibadan Farm - Zone 2', '8.0', '180.0', '96%'],
        ['Soybean', 'TGX 1448-2E', 'Benue Outpost', '15.0', '32.4', '91%'],
        ['Groundnut', 'SAMNUT 24', 'Kano Cooperative', '20.0', '48.0', '89%']
      ]
    },
    { 
      id: 'financial', 
      name: 'Financial & Ledger Statement', 
      description: 'Gross revenue, input expenses, and net profit margins',
      headers: ['Account Ledger', 'Category', 'Description', 'Income (NGN)', 'Expense (NGN)', 'Net Margin'],
      rows: [
        ['Grain Sales', 'Revenue', 'OBA Super 9 Maize bulk sale', '4850000', '0', '+4850000'],
        ['Fertilizer Purchase', 'Inputs', 'NPK 15-15-15 (80 bags)', '0', '2100000', '-2100000'],
        ['Tractor Service', 'Mechanization', 'Deep ploughing & harrowing', '0', '650000', '-650000'],
        ['Tubers Sales', 'Revenue', 'Cassava bulk farm-gate', '3200000', '0', '+3200000']
      ]
    },
    { 
      id: 'environmental', 
      name: 'Environmental Impact Audit', 
      description: 'Borehole water extraction, solar kWh generation, soil health',
      headers: ['Telemetry Metric', 'Estate Hub', 'Monthly Reading', 'Target Benchmark', 'Status'],
      rows: [
        ['Groundwater Extraction', 'Ibadan Agro Hub', '2,340,000 Litres', '2,500,000 Litres', 'Sustainable (-6.4%)'],
        ['Solar PV Generation', 'All Sites', '45,600 kWh', '42,000 kWh', 'Surplus (+8.5%)'],
        ['Soil Organic Carbon', 'Benue Outpost', '2.8%', '> 2.5%', 'Optimal']
      ]
    },
    { 
      id: 'operational', 
      name: 'Workforce & Equipment Summary', 
      description: 'Tractor hours, diesel usage, seasonal labor shifts',
      headers: ['Asset / Worker Team', 'Operational Hours', 'Fuel Consumed (L)', 'Completed Task', 'Operator Rating'],
      rows: [
        ['John Deere 5075E Tractor', '184 hrs', '620L', 'Field A & B Ridging', '4.9 / 5.0'],
        ['Massey Ferguson 375', '142 hrs', '490L', 'Haulage & Transport', '4.8 / 5.0'],
        ['Ibadan Seasonal Weeders', '320 man-hrs', '-', 'Hand weeding Zone 2', '5.0 / 5.0']
      ]
    }
  ];

  const [history, setHistory] = useState<ReportHistoryItem[]>([
    {
      id: 'rep-01',
      name: 'Crop Yield & Harvest - Q3 2024',
      date: '2024-08-09',
      type: 'Production',
      status: 'Ready',
      headers: reportTypes[0].headers,
      dataRows: reportTypes[0].rows
    },
    {
      id: 'rep-02',
      name: 'Financial Ledger & Margin Statement',
      date: '2024-07-31',
      type: 'Financial',
      status: 'Ready',
      headers: reportTypes[1].headers,
      dataRows: reportTypes[1].rows
    },
    {
      id: 'rep-03',
      name: 'Environmental & Borehole Audit - July',
      date: '2024-08-01',
      type: 'Environmental',
      status: 'Ready',
      headers: reportTypes[2].headers,
      dataRows: reportTypes[2].rows
    },
    {
      id: 'rep-04',
      name: 'Labor Payroll & Equipment Hours',
      date: '2024-08-05',
      type: 'Operational',
      status: 'Ready',
      headers: reportTypes[3].headers,
      dataRows: reportTypes[3].rows
    }
  ]);

  const quickStats = [
    { label: 'Total Revenue', value: '₦14,850,000', change: '+12%', color: 'text-leaf-700' },
    { label: 'Operating Costs', value: '₦5,230,000', change: '-8%', color: 'text-red-600' },
    { label: 'Water Usage', value: '2,340,000L', change: '-5%', color: 'text-blue-600' },
    { label: 'Solar Generation', value: '45,600 kWh', change: '+3%', color: 'text-harvest-600' }
  ];

  const handleExportFullReport = () => {
    downloadCsv(
      `CultivaNode_Full_Summary_${selectedPeriod}.csv`,
      ['Metric', 'Value', 'Trend'],
      [
        ['Total Farm Revenue', '₦14,850,000', '+12%'],
        ['Operating Costs', '₦5,230,000', '-8%'],
        ['Net Agricultural Surplus', '₦9,620,000', '+24%'],
        ['Water Extraction', '2,340,000 Litres', '-5%'],
        ['Solar Generation', '45,600 kWh', '+3%'],
        ['Active Farm Estates', '3 Hubs (Ibadan, Benue, Kano)', 'Optimal']
      ]
    );
    setFeedback(`Full summary report for (${selectedPeriod}) exported successfully.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleGenerateReport = (rep: typeof reportTypes[0]) => {
    setGeneratingReportId(rep.id);
    setTimeout(() => {
      setGeneratingReportId(null);
      downloadCsv(`${rep.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`, rep.headers, rep.rows);
      
      const newHistoryItem: ReportHistoryItem = {
        id: `rep-${Date.now()}`,
        name: `${rep.name} - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        type: rep.name.split(' ')[0],
        status: 'Ready',
        headers: rep.headers,
        dataRows: rep.rows
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      setFeedback(`Generated & downloaded: ${rep.name}`);
      setTimeout(() => setFeedback(null), 4000);
    }, 1000);
  };

  const handleDownloadHistoryItem = (item: ReportHistoryItem) => {
    downloadCsv(`${item.name.replace(/\s+/g, '_')}.csv`, item.headers, item.dataRows);
    setFeedback(`Downloaded: ${item.name}`);
    setTimeout(() => setFeedback(null), 4000);
  };

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
          <Button 
            size="sm" 
            className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs shadow-sm"
            onClick={handleExportFullReport}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV / PDF
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert className="border-leaf-300 bg-leaf-50 text-leaf-900">
          <CheckCircle className="h-4 w-4 text-leaf-700" />
          <AlertDescription className="text-xs font-medium">
            {feedback}
          </AlertDescription>
        </Alert>
      )}

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
          <TabsTrigger value="history" className="text-xs">Export History ({history.length})</TabsTrigger>
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
                  <Button 
                    size="sm" 
                    className="w-full bg-leaf-800 hover:bg-leaf-900 text-white h-8 text-xs shadow-sm disabled:opacity-50"
                    onClick={() => handleGenerateReport(report)}
                    disabled={generatingReportId === report.id}
                  >
                    {generatingReportId === report.id ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Generating CSV...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Generate & Download CSV
                      </>
                    )}
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
              {history.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(report.date).toLocaleDateString()}</span>
                      <Badge variant="secondary" className="text-xs">{report.type}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="text-xs bg-leaf-100 text-leaf-800">
                      {report.status}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs text-leaf-800 hover:bg-leaf-50"
                      onClick={() => handleDownloadHistoryItem(report)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
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
