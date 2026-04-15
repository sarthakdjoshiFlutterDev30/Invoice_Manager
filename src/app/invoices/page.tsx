'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Eye, Edit, Trash2, Download,
  DollarSign, CheckCircle, Clock, AlertCircle,
  FileText, RefreshCw, X, Banknote, CreditCard,
  ArrowUpRight, Filter, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: { _id: string; name: string; email: string };
  issueDate: string;
  dueDate: string;
  total: number;
  subtotal?: number;
  status: 'paid' | 'unpaid' | 'partial' | 'cancelled';
  createdAt: string;
  paymentDetails?: { amount?: number };
  paymentHistory?: { amount?: number }[];
}

type AmountOption = '50' | '100' | 'custom';

interface PaymentModalState {
  open: boolean;
  invoiceId: string | null;
  invoiceTotal: number;
  fullTotal: number;
  alreadyPaid: number;
  isPartial: boolean;
  method: 'bank_transfer' | 'cheque';
  referenceNo: string;
  amountOption: AmountOption;
  customAmount: string;
  submitting: boolean;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({
    open: false, invoiceId: null, invoiceTotal: 0, fullTotal: 0,
    alreadyPaid: 0, isPartial: false, method: 'bank_transfer',
    referenceNo: '', amountOption: '100', customAmount: '', submitting: false,
  });

  useEffect(() => { fetchInvoices(); }, []);

  useEffect(() => {
    const onFocus = () => fetchInvoices();
    const onVis = () => { if (document.visibilityState === 'visible') fetchInvoices(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  useEffect(() => { filterInvoices(); }, [invoices, searchTerm, statusFilter, dateFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setInvoices(data.data);
      else toast.error('Failed to fetch invoices');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const filterInvoices = () => {
    let f = [...invoices];
    if (searchTerm) f = f.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (statusFilter !== 'all') f = f.filter(inv => inv.status === statusFilter);
    if (dateFilter !== 'all') {
      const now = new Date();
      const ago30 = new Date(now.getTime() - 30 * 86400000);
      const ago90 = new Date(now.getTime() - 90 * 86400000);
      f = f.filter(inv => {
        const d = new Date(inv.issueDate);
        if (dateFilter === 'last30days') return d >= ago30;
        if (dateFilter === 'last90days') return d >= ago90;
        if (dateFilter === 'thisyear') return d.getFullYear() === now.getFullYear();
        return true;
      });
    }
    setFilteredInvoices(f);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN');
  const getNet = (inv: Invoice) => inv.total - (inv.subtotal || 0) * 0.1;
  const getPending = (inv: Invoice) => {
    if (inv.status === 'paid') return 0;
    const paid = (inv.paymentHistory || []).reduce((s, p) => s + (p.amount || 0), 0) || inv.paymentDetails?.amount || 0;
    return Math.max(0, getNet(inv) - paid);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { paid: 'badge badge-paid', unpaid: 'badge badge-unpaid', partial: 'badge badge-partial', cancelled: 'badge badge-cancelled' };
    const labels: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid', partial: 'Partial', cancelled: 'Cancelled' };
    return <span className={map[status] || map.unpaid}><span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />{labels[status] || 'Unpaid'}</span>;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Invoice deleted'); fetchInvoices(); }
      else toast.error(data.message || 'Failed to delete');
    } catch { toast.error('Something went wrong'); }
  };

  const openPaymentModal = (inv: Invoice) => {
    const net = getNet(inv);
    const alreadyPaid = (inv.paymentHistory || []).reduce((s, p) => s + (p.amount || 0), 0) || inv.paymentDetails?.amount || 0;
    setPaymentModal({ open: true, invoiceId: inv._id, invoiceTotal: Math.max(0, net - alreadyPaid), fullTotal: net, alreadyPaid, isPartial: inv.status === 'partial', method: 'bank_transfer', referenceNo: '', amountOption: '100', customAmount: '', submitting: false });
  };

  const closePaymentModal = () => setPaymentModal(p => ({ ...p, open: false, invoiceId: null, referenceNo: '', customAmount: '' }));

  const getPaymentAmount = () => {
    const { amountOption, invoiceTotal, customAmount } = paymentModal;
    if (amountOption === '50') return invoiceTotal * 0.5;
    if (amountOption === '100') return invoiceTotal;
    const n = parseFloat(customAmount);
    return isNaN(n) ? 0 : n;
  };

  const handleMarkAsPaid = async () => {
    const { invoiceId, method, referenceNo, amountOption, invoiceTotal } = paymentModal;
    if (!invoiceId) return;
    if (!referenceNo.trim()) { toast.error(`Please enter the ${method === 'bank_transfer' ? 'NEFT/RTGS Transaction No.' : 'Cheque No.'}`); return; }
    const amount = getPaymentAmount();
    if (amountOption === 'custom') {
      if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
      if (amount > invoiceTotal) { toast.error('Amount exceeds invoice total'); return; }
    }
    const newStatus = amount >= invoiceTotal ? 'paid' : 'partial';
    setPaymentModal(p => ({ ...p, submitting: true }));
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, paymentMethod: method, referenceNo: referenceNo.trim(), paidAmount: amount }) });
      const data = await res.json();
      if (data.success) { toast.success(newStatus === 'paid' ? 'Invoice marked as paid!' : `Partial payment of ${fmt(amount)} recorded!`); closePaymentModal(); fetchInvoices(); }
      else toast.error(data.message || 'Failed to update');
    } catch { toast.error('Something went wrong'); }
    finally { setPaymentModal(p => ({ ...p, submitting: false })); }
  };

  const handleDownloadPDF = async (id: string, num: string) => {
    const res = await fetch(`/api/invoices/${id}/pdf`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Invoice-${num}.pdf`; a.click();
  };

  const statCards = [
    { label: 'Total Revenue', value: fmt(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + getNet(i), 0)), icon: DollarSign, iconBg: 'bg-indigo-500/20', iconColor: 'text-indigo-400', gradient: 'from-indigo-500 to-violet-600' },
    { label: 'Paid Invoices', value: invoices.filter(i => i.status === 'paid').length.toString(), icon: CheckCircle, iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Unpaid Invoices', value: invoices.filter(i => i.status === 'unpaid').length.toString(), icon: Clock, iconBg: 'bg-red-500/20', iconColor: 'text-red-400', gradient: 'from-red-500 to-rose-600' },
    { label: 'Pending Amount', value: fmt(invoices.filter(i => i.status === 'unpaid' || i.status === 'partial').reduce((s, i) => s + getPending(i), 0)), icon: AlertCircle, iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400', gradient: 'from-amber-500 to-orange-500' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-slate-500 text-sm animate-pulse">Loading invoices...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Payment Modal */}
      {paymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closePaymentModal} />
          <div className="relative w-full max-w-md glass-card-static overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="icon-box bg-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-100 font-bold text-base">Record Payment</h3>
                    {paymentModal.isPartial ? (
                      <p className="text-slate-400 text-xs">
                        Paid: {fmt(paymentModal.alreadyPaid)} · <span className="text-emerald-400 font-semibold">Balance: {fmt(paymentModal.invoiceTotal)}</span>
                      </p>
                    ) : (
                      <p className="text-slate-400 text-xs">Invoice total: {fmt(paymentModal.invoiceTotal)}</p>
                    )}
                  </div>
                </div>
                <button onClick={closePaymentModal} className="icon-box bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* Amount */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Payment Amount</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['50', '100', 'custom'] as AmountOption[]).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setPaymentModal(p => ({ ...p, amountOption: opt, customAmount: '' }))}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-200 ${paymentModal.amountOption === opt ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/8 bg-white/3 text-slate-500 hover:border-white/15 hover:text-slate-300'}`}
                    >
                      <span className="text-sm font-bold">{opt === 'custom' ? 'Custom' : `${opt}%`}</span>
                      {opt !== 'custom' && <span className="text-[10px] opacity-70">{fmt(paymentModal.invoiceTotal * (parseInt(opt) / 100))}</span>}
                    </button>
                  ))}
                </div>
                {paymentModal.amountOption === 'custom' && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input type="number" min="1" max={paymentModal.invoiceTotal} value={paymentModal.customAmount}
                      onChange={e => setPaymentModal(p => ({ ...p, customAmount: e.target.value }))}
                      placeholder={`Max ${fmt(paymentModal.invoiceTotal)}`}
                      className="input-premium pl-8"
                    />
                  </div>
                )}
                {paymentModal.amountOption !== 'custom' && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">Recording:</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{fmt(getPaymentAmount())}</span>
                    {paymentModal.amountOption === '50' && <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-semibold">Partial</span>}
                  </div>
                )}
              </div>

              {/* Method */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'bank_transfer', icon: Banknote, label: 'Bank Transfer', sub: 'NEFT / RTGS' },
                    { key: 'cheque', icon: CreditCard, label: 'Cheque', sub: 'Bank Cheque' },
                  ].map(({ key, icon: Icon, label, sub }) => (
                    <button key={key} type="button"
                      onClick={() => setPaymentModal(p => ({ ...p, method: key as 'bank_transfer' | 'cheque', referenceNo: '' }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${paymentModal.method === key ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/8 bg-white/3 text-slate-500 hover:border-white/15 hover:text-slate-300'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{label}</span>
                      <span className="text-[10px] opacity-70">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  {paymentModal.method === 'bank_transfer' ? 'NEFT / RTGS Transaction No.' : 'Cheque Number'}
                </label>
                <input type="text" value={paymentModal.referenceNo}
                  onChange={e => setPaymentModal(p => ({ ...p, referenceNo: e.target.value }))}
                  placeholder={paymentModal.method === 'bank_transfer' ? 'e.g. NEFT2024041200001234' : 'e.g. 004512'}
                  className="input-premium"
                  onKeyDown={e => e.key === 'Enter' && handleMarkAsPaid()}
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={closePaymentModal} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={handleMarkAsPaid} disabled={paymentModal.submitting}
                className="flex-1 btn-premium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {paymentModal.submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><CheckCircle className="w-4 h-4" />Confirm Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">Billing</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Invoices</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your invoices and track payments</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchInvoices} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <Link href="/invoices/create" className="btn-premium flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </Link>
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

      {/* Filters */}
      <div className="glass-card-static p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input type="text" placeholder="Search by invoice #, client name or email..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-premium pl-11"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-premium pl-9 pr-4 appearance-none cursor-pointer w-full">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input-premium appearance-none cursor-pointer flex-1">
              <option value="all">All Time</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="thisyear">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-slate-300 font-medium">No invoices found</p>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or create a new invoice</p>
                      </div>
                      <Link href="/invoices/create" className="btn-premium text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" />Create Invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td data-label="Invoice #">
                      <span className="font-mono text-indigo-400 font-medium text-xs bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td data-label="Client">
                      <div className="font-medium text-slate-200">{invoice.client.name}</div>
                      <div className="text-xs text-slate-500 hidden sm:block">{invoice.client.email}</div>
                    </td>
                    <td data-label="Issue Date" className="text-slate-400">{fmtDate(invoice.issueDate)}</td>
                    <td data-label="Due Date" className="text-slate-400 hidden md:table-cell">{fmtDate(invoice.dueDate)}</td>
                    <td data-label="Amount" className="font-semibold text-slate-100">{fmt(getNet(invoice))}</td>
                    <td data-label="Status">{getStatusBadge(invoice.status)}</td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link href={`/invoices/${invoice._id}`} title="View"
                          className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-200">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDownloadPDF(invoice._id, invoice.invoiceNumber)} title="Download PDF"
                          className="p-2 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-200">
                          <Download className="w-4 h-4" />
                        </button>
                        <Link href={`/invoices/${invoice._id}/edit`} title="Edit"
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200">
                          <Edit className="w-4 h-4" />
                        </Link>
                        {(invoice.status === 'unpaid' || invoice.status === 'partial') && (
                          <button onClick={() => openPaymentModal(invoice)} title="Record Payment"
                            className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(invoice._id)} title="Delete"
                          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
