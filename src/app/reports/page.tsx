'use client';

import { useState, useEffect } from 'react';
import {
  Download, DollarSign, TrendingUp, FileText, Users,
  ArrowUpRight, BarChart3, Calendar, Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportData {
  monthlyRevenue: Array<{ month: string; revenue: number; invoices: number }>;
  paymentStatus: Array<{ status: string; count: number; color: string }>;
  topClients: Array<{ client: string; revenue: number; invoices: number }>;
  yearlyGrowth: Array<{ year: string; revenue: number }>;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({ monthlyRevenue: [], paymentStatus: [], topClients: [], yearlyGrowth: [] });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last6months');

  useEffect(() => { fetchReportData(); }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange === 'last30days') startDate.setDate(endDate.getDate() - 30);
      else if (dateRange === 'last3months') startDate.setMonth(endDate.getMonth() - 3);
      else if (dateRange === 'last6months') startDate.setMonth(endDate.getMonth() - 6);
      else startDate.setFullYear(endDate.getFullYear() - 1);

      const res = await fetch(`/api/invoices?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const data = await res.json();
      if (data.success) processReportData(data.data || []);
      else toast.error('Failed to fetch report data');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const processReportData = (invoices: Array<{ status: string; total: number; issueDate: string; client?: { name: string } }>) => {
    const monthlyData = generateMonthlyData(invoices);
    const statusData = [
      { status: 'Paid', count: invoices.filter(i => i.status === 'paid').length, color: '#10b981' },
      { status: 'Unpaid', count: invoices.filter(i => i.status === 'unpaid').length, color: '#ef4444' },
      { status: 'Partial', count: invoices.filter(i => i.status === 'partial').length, color: '#f59e0b' },
      { status: 'Cancelled', count: invoices.filter(i => i.status === 'cancelled').length, color: '#64748b' },
    ];
    const clientRevenue = invoices.reduce((acc: Record<string, { revenue: number; invoices: number }>, inv) => {
      const name = inv.client?.name || 'Unknown';
      if (!acc[name]) acc[name] = { revenue: 0, invoices: 0 };
      if (inv.status === 'paid') acc[name].revenue += inv.total;
      acc[name].invoices += 1;
      return acc;
    }, {});
    const topClients = Object.entries(clientRevenue).map(([client, d]) => ({ client, revenue: d.revenue, invoices: d.invoices })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    setReportData({ monthlyRevenue: monthlyData, paymentStatus: statusData, topClients, yearlyGrowth: generateYearlyData(invoices) });
  };

  const generateMonthlyData = (invoices: Array<{ issueDate: string; status: string; total: number }>) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cur = new Date().getMonth();
    return months.slice(Math.max(0, cur - 5), cur + 1).map((month, idx) => {
      const mi = (cur - 5 + idx + 12) % 12;
      const mis = invoices.filter(i => new Date(i.issueDate).getMonth() === mi && i.status === 'paid');
      return { month, revenue: mis.reduce((s, i) => s + i.total, 0), invoices: mis.length };
    });
  };

  const generateYearlyData = (invoices: Array<{ issueDate: string; status: string; total: number }>) => {
    const cur = new Date().getFullYear();
    return [cur - 2, cur - 1, cur].map(year => ({
      year: year.toString(),
      revenue: invoices.filter(i => new Date(i.issueDate).getFullYear() === year && i.status === 'paid').reduce((s, i) => s + i.total, 0),
    }));
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  const totalRevenue = reportData.monthlyRevenue.reduce((s, i) => s + i.revenue, 0);
  const totalInvoices = reportData.monthlyRevenue.reduce((s, i) => s + i.invoices, 0);
  const growthRate = reportData.yearlyGrowth.length > 1
    ? Math.round(((reportData.yearlyGrowth[reportData.yearlyGrowth.length - 1].revenue - reportData.yearlyGrowth[reportData.yearlyGrowth.length - 2].revenue) / (reportData.yearlyGrowth[reportData.yearlyGrowth.length - 2].revenue || 1)) * 100)
    : 0;

  const maxRevenue = Math.max(...reportData.monthlyRevenue.map(m => m.revenue), 1);

  const statCards = [
    { label: 'Total Revenue', value: fmt(totalRevenue), icon: DollarSign, iconBg: 'bg-indigo-500/20', iconColor: 'text-indigo-400', gradient: 'from-indigo-500 to-violet-600' },
    { label: 'Total Invoices', value: totalInvoices.toString(), icon: FileText, iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Active Clients', value: reportData.topClients.length.toString(), icon: Users, iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Growth Rate', value: `${growthRate >= 0 ? '+' : ''}${growthRate}%`, icon: TrendingUp, iconBg: growthRate >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20', iconColor: growthRate >= 0 ? 'text-emerald-400' : 'text-red-400', gradient: growthRate >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-600' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-slate-500 text-sm animate-pulse">Loading reports...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">Analytics</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">Business performance insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="input-premium pl-9 pr-4 appearance-none cursor-pointer w-full sm:w-auto sm:min-w-[160px]">
              <option value="last30days">Last 30 Days</option>
              <option value="last3months">Last 3 Months</option>
              <option value="last6months">Last 6 Months</option>
              <option value="lastyear">Last Year</option>
            </select>
          </div>
          <button onClick={() => toast.success('Export coming soon!')} className="btn-premium flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} rounded-t-[20px]`} />
              <div className="flex items-start justify-between mb-4">
                <div className={`icon-box ${card.iconBg}`}><Icon className={`w-5 h-5 ${card.iconColor}`} /></div>
                <ArrowUpRight className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-slate-100">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="icon-box bg-indigo-500/20">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Monthly Revenue</h3>
              <p className="text-xs text-slate-500">Revenue trend over time</p>
            </div>
          </div>
        </div>

        {reportData.monthlyRevenue.length > 0 ? (
          <div className="flex items-end gap-3 h-48">
            {reportData.monthlyRevenue.map((item, i) => {
              const heightPct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '160px' }}>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-500 opacity-80 group-hover:opacity-100 transition-all duration-300 relative overflow-hidden"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {item.revenue > 0 && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-dark-800 text-slate-200 text-[10px] font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 z-10">
                        {fmt(item.revenue)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{item.month}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-500 text-sm">No data for selected period</p>
          </div>
        )}
      </div>

      {/* Payment Status + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {/* Payment Status */}
        <div className="glass-card-static p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="icon-box bg-violet-500/20">
              <Award className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Payment Status</h3>
          </div>
          <div className="space-y-3">
            {reportData.paymentStatus.map((item) => {
              const total = reportData.paymentStatus.reduce((s, i) => s + i.count, 0);
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              const colorMap: Record<string, string> = { Paid: 'bg-emerald-500', Unpaid: 'bg-red-500', Partial: 'bg-amber-500', Cancelled: 'bg-slate-500' };
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300 font-medium">{item.status}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{item.count}</span>
                      <span className="text-xs font-semibold text-slate-300">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${colorMap[item.status] || 'bg-slate-500'} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Clients */}
        <div className="lg:col-span-2 glass-card-static overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
            <div className="icon-box bg-blue-500/20">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Top Clients by Revenue</h3>
              <p className="text-xs text-slate-500">Highest value clients</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Revenue</th>
                  <th>Invoices</th>
                  <th>Avg. Value</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topClients.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">No data available</td></tr>
                ) : (
                  reportData.topClients.map((client, i) => (
                    <tr key={i}>
                      <td data-label="#">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-700/50 text-slate-500'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td data-label="Client" className="font-medium text-slate-200">{client.client}</td>
                      <td data-label="Revenue" className="font-semibold text-emerald-400">{fmt(client.revenue)}</td>
                      <td data-label="Invoices" className="text-slate-400">{client.invoices}</td>
                      <td data-label="Avg. Value" className="text-slate-400">{fmt(client.revenue / client.invoices)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Yearly Growth */}
      <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="icon-box bg-emerald-500/20">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Yearly Growth</h3>
            <p className="text-xs text-slate-500">Year-over-year comparison</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {reportData.yearlyGrowth.map((item, i) => {
            const prev = i > 0 ? reportData.yearlyGrowth[i - 1].revenue : null;
            const growth = prev && prev > 0 ? Math.round(((item.revenue - prev) / prev) * 100) : null;
            return (
              <div key={item.year} className="glass-card p-5 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{item.year}</p>
                <p className="text-xl font-bold text-slate-100 mb-2">{fmt(item.revenue)}</p>
                {growth !== null && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${growth >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {growth >= 0 ? '+' : ''}{growth}% YoY
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
