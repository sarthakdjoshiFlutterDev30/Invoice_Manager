'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
  X,
  Banknote,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: {
    _id: string;
    name: string;
    email: string;
  };
  issueDate: string;
  dueDate: string;
  total: number;
  subtotal?: number;
  status: 'paid' | 'unpaid' | 'partial' | 'cancelled';
  createdAt: string;
  paymentDetails?: { amount?: number };
  paymentHistory?: { amount?: number }[];
}

// ── Payment Modal State ─────────────────────────────────────
type AmountOption = '50' | '100' | 'custom';

interface PaymentModalState {
  open: boolean;
  invoiceId: string | null;
  invoiceTotal: number;      // remaining balance (what's left to pay)
  fullTotal: number;         // original invoice total
  alreadyPaid: number;       // amount already paid
  isPartial: boolean;        // was previously a partial payment
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
    open: false,
    invoiceId: null,
    invoiceTotal: 0,
    fullTotal: 0,
    alreadyPaid: 0,
    isPartial: false,
    method: 'bank_transfer',
    referenceNo: '',
    amountOption: '100',
    customAmount: '',
    submitting: false,
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const onFocus = () => fetchInvoices();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchInvoices();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices', { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.data);
      } else {
        toast.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.issueDate);
        switch (dateFilter) {
          case 'last30days':
            return invoiceDate >= thirtyDaysAgo;
          case 'last90days':
            return invoiceDate >= ninetyDaysAgo;
          case 'thisyear':
            return invoiceDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredInvoices(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getNetPayable = (invoice: Invoice) => {
    const tdsAmount = (invoice.subtotal || 0) * 0.1;
    return invoice.total - tdsAmount;
  };

  const getPendingAmount = (invoice: Invoice) => {
    if (invoice.status === 'paid') return 0;
    const net = getNetPayable(invoice);
    const paid = (invoice.paymentHistory || []).reduce((s, p) => s + (p.amount || 0), 0) || invoice.paymentDetails?.amount || 0;
    return Math.max(0, net - paid);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      unpaid: { color: 'bg-red-100 text-red-800', text: 'Unpaid' },
      partial: { color: 'bg-yellow-100 text-yellow-800', text: 'Partial' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Invoice deleted successfully');
        fetchInvoices();
      } else {
        toast.error(data.message || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Something went wrong');
    }
  };

  // Opens the payment modal — passes the REMAINING balance for partial invoices
  const openPaymentModal = (invoice: Invoice) => {
    const net = getNetPayable(invoice);
    const alreadyPaid = (invoice.paymentHistory || []).reduce((s, p) => s + (p.amount || 0), 0)
      || invoice.paymentDetails?.amount || 0;
    const remaining = Math.max(0, net - alreadyPaid);
    const isPartial = invoice.status === 'partial';
    setPaymentModal({
      open: true,
      invoiceId: invoice._id,
      invoiceTotal: remaining,
      method: 'bank_transfer',
      referenceNo: '',
      amountOption: '100',
      customAmount: '',
      submitting: false,
      isPartial,
      alreadyPaid,
      fullTotal: net,
    });
  };

  const closePaymentModal = () => {
    setPaymentModal(p => ({ ...p, open: false, invoiceId: null, referenceNo: '', customAmount: '' }));
  };

  const getPaymentAmount = () => {
    const { amountOption, invoiceTotal, customAmount } = paymentModal;
    if (amountOption === '50') return invoiceTotal * 0.5;
    if (amountOption === '100') return invoiceTotal;
    const parsed = parseFloat(customAmount);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleMarkAsPaid = async () => {
    const { invoiceId, method, referenceNo, amountOption, invoiceTotal } = paymentModal;
    if (!invoiceId) return;

    const label = method === 'bank_transfer' ? 'NEFT/RTGS Transaction No.' : 'Cheque No.';
    if (!referenceNo.trim()) {
      toast.error(`Please enter the ${label}`);
      return;
    }

    const amount = getPaymentAmount();
    if (amountOption === 'custom') {
      if (!amount || amount <= 0) { toast.error('Please enter a valid amount'); return; }
      if (amount > invoiceTotal) { toast.error('Amount cannot exceed invoice total'); return; }
    }

    // Determine status: full amount = paid, partial = partial
    const newStatus = amount >= invoiceTotal ? 'paid' : 'partial';

    setPaymentModal(p => ({ ...p, submitting: true }));
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, paymentMethod: method, referenceNo: referenceNo.trim(), paidAmount: amount }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(newStatus === 'paid' ? 'Invoice marked as paid!' : `Partial payment of ${formatCurrency(amount)} recorded!`);
        closePaymentModal();
        fetchInvoices();
      } else {
        toast.error(data.message || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Something went wrong');
    } finally {
      setPaymentModal(p => ({ ...p, submitting: false }));
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
    const blob = await response.blob();
  
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceNumber}.pdf`;
    link.click();
  };
  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Payment Method Modal ───────────────────────────────── */}
      {paymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePaymentModal}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Record Payment</h3>
                  {paymentModal.isPartial ? (
                    <div className="text-green-100 text-xs">
                      <span className="text-white/60">Already paid: </span>{formatCurrency(paymentModal.alreadyPaid)}
                      <span className="mx-1.5 text-white/30">·</span>
                      <span className="font-bold text-white">Balance due: {formatCurrency(paymentModal.invoiceTotal)}</span>
                    </div>
                  ) : (
                    <p className="text-green-100 text-xs">Invoice total: {formatCurrency(paymentModal.invoiceTotal)}</p>
                  )}
                </div>
              </div>
              <button
                onClick={closePaymentModal}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-5">

              {/* ── Amount Option ── */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Payment Amount</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['50', '100', 'custom'] as AmountOption[]).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPaymentModal(p => ({ ...p, amountOption: opt, customAmount: '' }))}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
                        paymentModal.amountOption === opt
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm font-black">{opt === 'custom' ? 'Custom' : `${opt}%`}</span>
                      {opt !== 'custom' && (
                        <span className="text-[10px] font-semibold opacity-70">
                          {formatCurrency(paymentModal.invoiceTotal * (parseInt(opt) / 100))}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {paymentModal.amountOption === 'custom' && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={paymentModal.invoiceTotal}
                      value={paymentModal.customAmount}
                      onChange={e => setPaymentModal(p => ({ ...p, customAmount: e.target.value }))}
                      placeholder={`Max ${formatCurrency(paymentModal.invoiceTotal)}`}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 text-sm font-medium text-gray-800 placeholder-gray-300 outline-none transition-all"
                    />
                  </div>
                )}
                {/* Amount preview chip */}
                {paymentModal.amountOption !== 'custom' && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">Amount to record:</span>
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      {formatCurrency(getPaymentAmount())}
                    </span>
                    {paymentModal.amountOption === '50' && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">Partial</span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Method Selector ── */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModal(p => ({ ...p, method: 'bank_transfer', referenceNo: '' }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentModal.method === 'bank_transfer'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span className="text-xs font-bold">Bank Transfer</span>
                    <span className="text-[10px] text-center leading-tight opacity-70">NEFT / RTGS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentModal(p => ({ ...p, method: 'cheque', referenceNo: '' }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentModal.method === 'cheque'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs font-bold">Cheque</span>
                    <span className="text-[10px] text-center leading-tight opacity-70">Bank Cheque</span>
                  </button>
                </div>
              </div>

              {/* ── Reference Number ── */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {paymentModal.method === 'bank_transfer' ? 'NEFT / RTGS Transaction Number' : 'Cheque Number'}
                </label>
                <input
                  type="text"
                  value={paymentModal.referenceNo}
                  onChange={e => setPaymentModal(p => ({ ...p, referenceNo: e.target.value }))}
                  placeholder={
                    paymentModal.method === 'bank_transfer'
                      ? 'e.g. NEFT2024041200001234'
                      : 'e.g. 004512'
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 text-sm font-medium text-gray-800 placeholder-gray-300 outline-none transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleMarkAsPaid()}
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={closePaymentModal}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={paymentModal.submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 transition-all shadow-md shadow-green-200 flex items-center justify-center gap-2"
              >
                {paymentModal.submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Confirm Payment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage your invoices and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvoices}
            className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
          <Link
            href="/invoices/create"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  invoices
                    .filter(inv => inv.status === 'paid')
                    .reduce((sum, inv) => sum + getNetPayable(inv), 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices.filter(inv => inv.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unpaid Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices.filter(inv => inv.status === 'unpaid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  invoices
                    .filter(inv => inv.status === 'unpaid' || inv.status === 'partial')
                    .reduce((sum, inv) => sum + getPendingAmount(inv), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="thisyear">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No invoices found</p>
                      <p className="text-sm">Create your first invoice to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.client.name}</div>
                      <div className="text-sm text-gray-500">{invoice.client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(getNetPayable(invoice))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/invoices/${invoice._id}`}
                          className="text-blue-600 hover:text-blue-700"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDownloadPDF(invoice._id, invoice.invoiceNumber)}
                          className="text-purple-600 hover:text-purple-700"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/invoices/${invoice._id}/edit`}
                          className="text-gray-600 hover:text-gray-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {(invoice.status === 'unpaid' || invoice.status === 'partial') && (
                          <button
                            onClick={() => openPaymentModal(invoice)}
                            className="text-green-600 hover:text-green-700"
                            title="Record Payment"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invoice._id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
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
