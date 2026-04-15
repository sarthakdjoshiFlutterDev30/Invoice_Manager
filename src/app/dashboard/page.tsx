'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Eye,
  RefreshCw,
  ArrowUpRight,
  Zap,
  Activity,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  pendingAmount: number;
  totalClients: number;
  monthlyRevenue: number;
  growthRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    pendingAmount: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    growthRate: 0,
  });

  const [recentInvoices, setRecentInvoices] = useState<Array<{
    _id: string;
    invoiceNumber: string;
    client: { name: string };
    total: number;
    subtotal?: number;
    status: string;
    issueDate: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getNetPayable = (invoice: { total: number; subtotal?: number }) => {
    const tdsAmount = (invoice.subtotal || 0) * 0.1;
    return invoice.total - tdsAmount;
  };

  const getPendingAmount = (invoice: { status: string; total: number; subtotal?: number; paymentHistory?: { amount?: number }[]; paymentDetails?: { amount?: number } }) => {
    if (invoice.status === 'paid') return 0;
    const net = getNetPayable(invoice);
    const paid = (invoice.paymentHistory || []).reduce((s, p) => s + (p.amount || 0), 0) || invoice.paymentDetails?.amount || 0;
    return Math.max(0, net - paid);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const onFocus = () => fetchDashboardData();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchDashboardData();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [invoicesRes, clientsRes] = await Promise.all([
        fetch('/api/invoices', { cache: 'no-store' }),
        fetch('/api/clients', { cache: 'no-store' }),
      ]);
      const invoicesData = await invoicesRes.json();
      const clientsData = await clientsRes.json();

      if (invoicesData.success && clientsData.success) {
        const invoices = invoicesData.data || [];
        const clients = clientsData.data || [];

        const totalRevenue = invoices.reduce((sum: number, inv: { status: string; total: number; subtotal?: number }) =>
          inv.status === 'paid' ? sum + getNetPayable(inv) : sum, 0);

        const pendingAmount = invoices.reduce((sum: number, inv: { status: string; total: number; subtotal?: number; paymentHistory?: { amount?: number }[]; paymentDetails?: { amount?: number } }) =>
          inv.status === 'unpaid' || inv.status === 'partial' ? sum + getPendingAmount(inv) : sum, 0);

        const paidInvoices = invoices.filter((inv: { status: string }) => inv.status === 'paid').length;
        const unpaidInvoices = invoices.filter((inv: { status: string }) => inv.status === 'unpaid').length;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = invoices
          .filter((inv: { paymentDetails?: { paidAt: string }; issueDate: string; status: string }) => {
            const d = inv.paymentDetails?.paidAt ? new Date(inv.paymentDetails.paidAt) : new Date(inv.issueDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && inv.status === 'paid';
          })
          .reduce((sum: number, inv: { total: number; subtotal?: number }) => sum + getNetPayable(inv), 0);

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthRevenue = invoices
          .filter((inv: { paymentDetails?: { paidAt: string }; issueDate: string; status: string }) => {
            const d = inv.paymentDetails?.paidAt ? new Date(inv.paymentDetails.paidAt) : new Date(inv.issueDate);
            return d.getMonth() === lastMonth && d.getFullYear() === currentYear && inv.status === 'paid';
          })
          .reduce((sum: number, inv: { total: number; subtotal?: number }) => sum + getNetPayable(inv), 0);

        const growthRate = lastMonthRevenue > 0
          ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

        setStats({ totalRevenue, totalInvoices: invoices.length, paidInvoices, unpaidInvoices, pendingAmount, totalClients: clients.length, monthlyRevenue, growthRate });

        const recent = invoices
          .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentInvoices(recent);
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'badge badge-paid',
      unpaid: 'badge badge-unpaid',
      partial: 'badge badge-partial',
      cancelled: 'badge badge-cancelled',
    };
    const labels: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid', partial: 'Partial', cancelled: 'Cancelled' };
    return (
      <span className={map[status] || map.unpaid}>
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
        {labels[status] || 'Unpaid'}
      </span>
    );
  };

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      sub: `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate.toFixed(1)}% vs last month`,
      icon: DollarSign,
      gradient: 'from-indigo-500 to-violet-600',
      glow: 'rgba(99,102,241,0.3)',
      iconBg: 'bg-indigo-500/20',
      iconColor: 'text-indigo-400',
      subColor: stats.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400',
      delay: 'animate-stagger-1',
    },
    {
      label: 'Total Invoices',
      value: stats.totalInvoices.toString(),
      sub: `${stats.paidInvoices} paid · ${stats.unpaidInvoices} unpaid`,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'rgba(59,130,246,0.3)',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      subColor: 'text-slate-400',
      delay: 'animate-stagger-2',
    },
    {
      label: 'Paid Invoices',
      value: stats.paidInvoices.toString(),
      sub: `${stats.totalInvoices > 0 ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}% collection rate`,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'rgba(16,185,129,0.3)',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      subColor: 'text-emerald-400',
      delay: 'animate-stagger-3',
    },
    {
      label: 'Pending Amount',
      value: formatCurrency(stats.pendingAmount),
      sub: `${stats.unpaidInvoices} invoices outstanding`,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'rgba(245,158,11,0.3)',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      subColor: 'text-amber-400',
      delay: 'animate-stagger-4',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="text-slate-500 text-sm animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">Overview</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Welcome back — here&apos;s your business at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link href="/invoices/create" className="btn-premium flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`stat-card ${card.delay}`} style={{ '--glow-color': card.glow } as React.CSSProperties}>
              {/* Top gradient line */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} rounded-t-[20px]`} />

              <div className="flex items-start justify-between mb-4">
                <div className={`icon-box ${card.iconBg}`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600" />
              </div>

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-slate-100 mb-2">{card.value}</p>
              <div className={`flex items-center gap-1 text-xs font-medium ${card.subColor}`}>
                <TrendingUp className="w-3 h-3" />
                <span>{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="icon-box bg-violet-500/20">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Clients</p>
            <p className="text-xl font-bold text-slate-100">{stats.totalClients}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="icon-box bg-cyan-500/20">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">This Month Revenue</p>
            <p className="text-xl font-bold text-slate-100">{formatCurrency(stats.monthlyRevenue)}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="icon-box bg-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Growth Rate</p>
            <p className={`text-xl font-bold ${stats.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="glass-card-static overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="icon-box bg-indigo-500/20">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Recent Invoices</h3>
              <p className="text-xs text-slate-500">Last 5 transactions</p>
            </div>
          </div>
          <Link
            href="/invoices"
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors group"
          >
            View all
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="icon-box bg-slate-800 mx-auto">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <p className="text-slate-500 text-sm">No invoices yet</p>
                      <Link href="/invoices/create" className="btn-premium text-xs px-4 py-2">
                        Create your first invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td data-label="Invoice">
                      <span className="font-mono text-indigo-400 font-medium text-xs bg-indigo-500/10 px-2 py-1 rounded-lg">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td data-label="Client" className="font-medium text-slate-200">{invoice.client?.name || 'N/A'}</td>
                    <td data-label="Amount" className="font-semibold text-slate-100">{formatCurrency(getNetPayable(invoice))}</td>
                    <td data-label="Status">{getStatusBadge(invoice.status)}</td>
                    <td data-label="Date" className="text-slate-500">{new Date(invoice.issueDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <Link
                        href={`/invoices/${invoice._id}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors group"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
