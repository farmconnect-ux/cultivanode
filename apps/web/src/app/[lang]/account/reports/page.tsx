import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Droplets,
  Zap,
  ArrowLeft,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";

const reportTemplates = [
  {
    id: "production",
    name: "Crop Yield & Harvest Performance",
    desc: "Actual metric tons harvested vs target GAP yield across field plots",
    category: "Agronomy",
  },
  {
    id: "financial",
    name: "Enterprise Cost of Production",
    desc: "Unit production cost per hectare, input expenditure & gross margin",
    category: "Finance",
  },
  {
    id: "water_resources",
    name: "Irrigation & Water Efficiency",
    desc: "Cubic meters of borehole water pumped per kg of dry matter yield",
    category: "IoT & Resources",
  },
  {
    id: "fleet_efficiency",
    name: "Machinery Fuel Burn & Fleet Utilization",
    desc: "Liters of diesel consumed per tilled hectare and maintenance downtime",
    category: "Mechanisation",
  },
];

export default async function FarmReportsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);

  const quickMetrics = [
    { label: "Cycle Gross Revenue", value: "₦5,470,000", change: "+18.4%", positive: true, icon: DollarSign, color: "text-leaf-700" },
    { label: "Operating Direct Costs", value: "₦3,215,000", change: "-6.2%", positive: true, icon: TrendingDown, color: "text-node-700" },
    { label: "Irrigation Water Volume", value: "48,200 L", change: "-4.5%", positive: true, icon: Droplets, color: "text-node-700" },
    { label: "Machinery Fuel Diesel", value: "340 Litres", change: "+2.1%", positive: false, icon: Zap, color: "text-harvest-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/${lang}/account?ws=farmer`}
            className="inline-flex items-center gap-1 text-xs font-bold text-leaf-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <span className="text-muted">/</span>
          <span className="text-xs font-bold text-muted">Intelligence & Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-xs hover:bg-cream">
            <Calendar className="h-3.5 w-3.5 text-muted" />
            This Cycle (2026/A)
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-leaf-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-leaf-800">
            <Download className="h-3.5 w-3.5" />
            Export CSV / PDF
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-800 sm:text-3xl">
          Farm Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-muted">
          Enterprise reporting, standard-plan-actual yield variances & resource efficiency audits.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickMetrics.map((m, idx) => (
          <Card key={idx} className="p-4 border border-line bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase font-bold tracking-wider">{m.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{m.value}</p>
                <p className={`text-xs font-bold ${m.positive ? "text-leaf-700" : "text-harvest-700"}`}>
                  {m.change} vs benchmark
                </p>
              </div>
              <div className="rounded-xl bg-cream p-2.5">
                <m.icon className={`h-6 w-6 ${m.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Report Generation Center */}
      <Card className="border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Standard Operational Reports</h2>
            <p className="text-xs text-muted">Audit-ready documentation for banks, certifiers & offtakers</p>
          </div>
          <Badge tone="leaf" className="text-xs">GAP Compliant</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reportTemplates.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-line/60 bg-cream/30 p-4 transition hover:bg-cream/70 hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {r.category}
                  </span>
                  <BarChart3 className="h-4 w-4 text-leaf-700" />
                </div>
                <h3 className="mt-1 font-bold text-ink text-sm">{r.name}</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">{r.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-[11px] text-muted">Generated monthly & at harvest</span>
                <button className="inline-flex items-center gap-1 text-xs font-bold text-leaf-700 hover:underline">
                  <Download className="h-3 w-3" />
                  Generate Report →
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
