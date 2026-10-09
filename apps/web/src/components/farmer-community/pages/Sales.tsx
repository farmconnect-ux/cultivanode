"use client";

import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatCurrency, formatCurrencyCompact } from '../ui/currency-utils';
import { 
  TrendingUp, 
  Calendar, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { SaleModal } from '../modals/SaleModal';

export function Sales() {
  const [showAddSale, setShowAddSale] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);

  const salesData = [
    {
      id: 'S001',
      saleDate: '2026-10-06',
      crop: 'Yellow Maize',
      variety: 'OBA Super 9',
      quantity: 2500,
      unit: 'bags (100kg)',
      pricePerUnit: 64000,
      totalRevenue: 160000000,
      buyer: 'Premier Feedmills Ibadan',
      buyerContact: '08023456789',
      contractType: 'Direct Offtake',
      paymentStatus: 'paid',
      paymentDate: '2026-10-07',
      field: 'Field A - Zone 1',
      qualityGrade: 'Premium',
      moistureContent: 12.5,
      transportCost: 3500000,
      commissionFee: 1600000,
      netRevenue: 154900000,
      costOfProduction: 92000000,
      grossProfit: 62900000,
      profitMargin: 40.6
    },
    {
      id: 'S002',
      saleDate: '2026-10-04',
      crop: 'Cassava Tubers',
      variety: 'TMS 30572',
      quantity: 3200,
      unit: 'tonnes',
      pricePerUnit: 53000,
      totalRevenue: 169600000,
      buyer: 'Starch Nigeria Plc',
      buyerContact: '08034567890',
      contractType: 'Forward Contract',
      paymentStatus: 'paid',
      paymentDate: '2026-10-05',
      field: 'Field B - Zone 1',
      qualityGrade: 'Industrial Grade',
      moistureContent: 18.0,
      transportCost: 4200000,
      commissionFee: 1696000,
      netRevenue: 163704000,
      costOfProduction: 95000000,
      grossProfit: 68704000,
      profitMargin: 41.9
    },
    {
      id: 'S003',
      saleDate: '2026-09-28',
      crop: 'Raw Groundnuts',
      variety: 'SAMNUT 24',
      quantity: 1800,
      unit: 'bags (100kg)',
      pricePerUnit: 45300,
      totalRevenue: 81540000,
      buyer: 'Veg. Oil Mills Kano',
      buyerContact: '08045678901',
      contractType: 'Spot Sale',
      paymentStatus: 'paid',
      paymentDate: '2026-09-29',
      field: 'Field C - Zone 1',
      qualityGrade: 'Export Grade',
      moistureContent: 7.8,
      transportCost: 2800000,
      commissionFee: 815400,
      netRevenue: 77924600,
      costOfProduction: 44000000,
      grossProfit: 33924600,
      profitMargin: 43.5
    },
    {
      id: 'S004',
      saleDate: '2026-09-15',
      crop: 'White Yam Tubers',
      variety: 'Heda Variety',
      quantity: 4000,
      unit: 'tubers',
      pricePerUnit: 2500,
      totalRevenue: 10000000,
      buyer: 'Mile 12 Commercial Wholesalers',
      buyerContact: '08056789012',
      contractType: 'Direct Sale',
      paymentStatus: 'paid',
      paymentDate: '2026-09-16',
      field: 'Field D - Yam Mound',
      qualityGrade: 'Grade A Large',
      moistureContent: 0,
      transportCost: 500000,
      commissionFee: 100000,
      netRevenue: 9400000,
      costOfProduction: 4800000,
      grossProfit: 4600000,
      profitMargin: 48.9
    }
  ];

  const columns = [
    {
      key: 'crop',
      label: 'Crop & Variety',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-[11px]">{row.variety}</div>
        </div>
      )
    },
    {
      key: 'saleDate',
      label: 'Sale Date',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-xs">{new Date(value).toLocaleDateString('en-NG')}</span>
        </div>
      )
    },
    {
      key: 'buyer',
      label: 'Buyer / Off-taker',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="text-xs font-medium text-gray-900">{value}</div>
          <div className="text-gray-400 text-[10px]">{row.contractType}</div>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Volume',
      sortable: true,
      render: (value: number, row: any) => `${value.toLocaleString()} ${row.unit}`
    },
    {
      key: 'pricePerUnit',
      label: 'Unit Price',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'totalRevenue',
      label: 'Gross Settlement',
      sortable: true,
      render: (value: number) => (
        <span className="font-bold text-green-700">{formatCurrencyCompact(value)}</span>
      )
    },
    {
      key: 'grossProfit',
      label: 'Gross Margin',
      sortable: true,
      render: (value: number, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-800">{formatCurrencyCompact(value)}</div>
          <div className="text-[10px] text-green-700">{row.profitMargin}% margin</div>
        </div>
      )
    },
    {
      key: 'paymentStatus',
      label: 'Settlement Status',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge className={`text-[10px] ${
          value === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {value === 'paid' ? 'Paid In Ledger' : 'Pending Escrow'}
        </Badge>
      )
    }
  ];

  const totalGross = salesData.reduce((s, x) => s + x.totalRevenue, 0);
  const totalProfit = salesData.reduce((s, x) => s + x.grossProfit, 0);

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sales & Off-taker Revenue</h1>
          <p className="text-xs text-gray-500 mt-0.5">Commercial sales contracts, bulk commodity offtake, and escrow settlement audit.</p>
        </div>
        <Button 
          onClick={() => setShowAddSale(true)}
          className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold"
        >
          <Plus className="h-4 w-4 mr-1" />
          Record Produce Sale
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Gross Commercial Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrencyCompact(totalGross)}</p>
              <p className="text-[11px] text-green-700 mt-0.5">Verified escrow ledger</p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Net Farm Profit</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{formatCurrencyCompact(totalProfit)}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">42.4% avg margin</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Off-take Deals</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{salesData.length}</p>
              <p className="text-[11px] text-blue-700 mt-0.5">All settled</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Disbursement Speed</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">&lt; 24 hrs</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Instant ledger payout</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 text-gray-700">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Sales Table */}
      <DataTable
        data={salesData}
        columns={columns}
        title="Completed Harvest Sales & Contracts"
        searchPlaceholder="Search sale by crop, buyer, contract..."
        onAdd={() => setShowAddSale(true)}
      />

      {showAddSale && (
        <SaleModal
          sale={editingSale}
          onClose={() => {
            setShowAddSale(false);
            setEditingSale(null);
          }}
        />
      )}
    </div>
  );
}
