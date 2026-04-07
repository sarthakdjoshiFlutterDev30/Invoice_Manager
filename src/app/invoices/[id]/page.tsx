'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Printer,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Building2,
  Mail,
  MapPin,
  Hash,
  Calendar,
  CreditCard,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { pdfGenerator } from '@/lib/pdfGenerator';
import Image from 'next/image';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: {
    _id: string;
    name: string;
    email: string;
    address: string;
    gstin?: string;
  };
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    gstPercentage: number;
    amount: number;
  }>;
  subtotal: number;
  gstAmount: number;
  total: number;
  status: string;
  paymentDetails?: {
    paymentId?: string;
    orderId?: string;
    method?: string;
    amount?: number;
    currency?: string;
    status?: string;
    paidAt?: string;
  };
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceDetailPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchInvoice(params.id as string);
      fetchCompanySettings();
    }
  }, [params.id]);

  const fetchCompanySettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const result = await res.json();
      if (result.success) setCompany(result.data);
    } catch (e) {}
  };

  const fetchInvoice = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${id}`);
      const data = await response.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch invoice');
        router.push('/invoices');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to fetch invoice');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const generateClientPDF = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) throw new Error('Invoice content not found');
    
    // Briefly adjust styling for perfectly isolated capture
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';
    element.style.border = 'none';
    
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Restore
    element.style.boxShadow = originalShadow;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Maintain aspect ratio
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    return pdf;
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      const pdf = await generateClientPDF();
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!invoice) return;
    setPrinting(true);
    try {
      const pdf = await generateClientPDF();
      const blob = pdf.output('blob');
      pdfGenerator.printPDF(blob);
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to print invoice');
    } finally {
      setPrinting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const statusConfig = {
    paid: {
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: CheckCircle,
      label: 'Paid',
    },
    unpaid: {
      color: 'from-red-500 to-rose-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: Clock,
      label: 'Payment Pending',
    },
    partial: {
      color: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: Clock,
      label: 'Partial',
    },
    cancelled: {
      color: 'from-gray-400 to-gray-500',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      icon: XCircle,
      label: 'Cancelled',
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">Loading Invoice</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Invoice Not Found</h3>
          <p className="text-slate-400 mb-8">The invoice you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const sc = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.unpaid;
  const StatusIcon = sc.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
      {/* ── Top action bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/invoices"
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Invoices
          </Link>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} ${sc.border} border`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {sc.label}
            </span>

            {/* Print */}
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium shadow-sm disabled:opacity-60"
            >
              {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Print
            </button>

            {/* Download */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all text-sm font-semibold shadow-md hover:shadow-indigo-200 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Main invoice card ────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 print:py-0 print:px-0">
        <div id="invoice-content" className="bg-white rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 print:shadow-none print:border-none print:rounded-none">

          {/* ── Invoice header gradient banner ── */}
          <div className="relative bg-gradient-to-r from-[#0f1a4a] via-[#1e3a8a] to-[#4f46e5] px-8 py-8 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute top-4 right-24 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 right-8 w-36 h-36 rounded-full bg-indigo-400/10" />

            <div className="relative flex items-start justify-between gap-6">
              {/* Company info */}
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                  {company?.logo ? (
                    <img src={company.logo} alt="Company Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-white font-bold text-2xl tracking-tight">{company?.name || 'Bytesflare Infotech'}</h1>
                  <p className="text-indigo-300/80 text-xs mt-1">
                    {[company?.email, company?.phone].filter(Boolean).join('  •  ') || 'info@bytesflare.com'}
                  </p>
                  {company?.address && (
                    <p className="text-indigo-200/60 text-xs mt-0.5 max-w-xs leading-relaxed">{company.address}</p>
                  )}
                  {/* Registration Numbers */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {company?.gstin && (
                      <span className="text-[10px] text-white/70 font-medium"><span className="text-white/40">GSTIN: </span>{company.gstin}</span>
                    )}
                    {company?.pan && (
                      <span className="text-[10px] text-white/70 font-medium"><span className="text-white/40">PAN: </span>{company.pan}</span>
                    )}
                    {company?.tan && (
                      <span className="text-[10px] text-white/70 font-medium"><span className="text-white/40">TAN: </span>{company.tan}</span>
                    )}
                    {company?.cin && (
                      <span className="text-[10px] text-white/70 font-medium"><span className="text-white/40">CIN: </span>{company.cin}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice label */}
              <div className="text-right shrink-0">
                <div className="text-white/20 font-black text-5xl leading-none tracking-widest mb-1">INVOICE</div>
                <div className="flex items-center gap-2 justify-end">
                  <Hash className="w-4 h-4 text-indigo-300" />
                  <span className="text-white font-semibold text-lg">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end mt-2">
                  <StatusIcon className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/80 text-xs font-semibold tracking-wide uppercase">{sc.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Meta info strip ── */}
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Issue Date</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(invoice.issueDate)}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Due Date</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Currency</p>
                <p className="text-sm font-semibold text-slate-800">INR (₹)</p>
              </div>
            </div>
          </div>

          {/* ── Bill to / from ── */}
          <div className="px-8 py-7 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 bg-white">
            {/* Bill To */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-100 px-2.5 py-1 rounded-full">Bill To</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center mt-0.5 shrink-0">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-base">{invoice.client.name}</p>
                    {invoice.client.gstin && (
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">GSTIN: {invoice.client.gstin}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-600">{invoice.client.email}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-[200px]">{invoice.client.address}</p>
                </div>
              </div>
            </div>

            {/* Invoice Summary box */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white relative overflow-hidden h-full flex flex-col justify-center">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Invoice Summary</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/20">
                    <span className="text-indigo-200 text-sm">Subtotal</span>
                    <span className="font-semibold text-sm">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/20">
                    <span className="text-indigo-200 text-sm">GST Amount</span>
                    <span className="font-semibold text-sm">{formatCurrency(invoice.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5">
                    <span className="text-white font-bold text-base">Total Amount</span>
                    <span className="font-black text-xl">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Line Items table ── */}
          <div className="px-8 py-7 bg-white">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Line Items</h3>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-12 whitespace-nowrap">#</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Description</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">Qty</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">Rate (₹)</th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">GST %</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">Amount (₹)</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => {
                    const lineAmt = item.quantity * item.rate;
                    const gstAmt = (lineAmt * item.gstPercentage) / 100;
                    const lineTotal = lineAmt + gstAmt;
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-5 py-4 text-slate-600 font-medium">{idx + 1}</td>
                        <td className="px-5 py-4 font-medium text-slate-800">{item.description}</td>
                        <td className="px-5 py-4 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-5 py-4 text-right text-slate-700 font-medium">
                          {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(item.rate)}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-600 font-medium">{item.gstPercentage}%</td>
                        <td className="px-5 py-4 text-right text-slate-700 font-medium">
                          {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(lineAmt)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-indigo-700">
                          {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="w-96 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                <div className="bg-slate-50 px-5 py-3 flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="bg-slate-50 px-5 py-3 flex justify-between text-sm border-t border-slate-100">
                  <span className="text-slate-500">GST</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(invoice.gstAmount)}</span>
                </div>
                <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-5 py-4 flex justify-between">
                  <span className="text-white font-bold">Gross Total (incl. GST)</span>
                  <span className="text-white font-black text-lg">{formatCurrency(invoice.total)}</span>
                </div>
                {/* TDS Section — Section 194J @ 10% */}
                <div className="bg-amber-50 px-5 py-3.5 flex items-center justify-between text-sm border-t border-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 font-semibold">TDS Deductible</span>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full whitespace-nowrap">Section 194J @ 10%</span>
                  </div>
                  <span className="font-semibold text-amber-700 whitespace-nowrap">- {formatCurrency(invoice.subtotal * 0.1)}</span>
                </div>
                <div className="bg-emerald-600 px-5 py-4 flex justify-between">
                  <span className="text-white font-bold">Net Payable (after TDS)</span>
                  <span className="text-white font-black text-lg">{formatCurrency(invoice.total - invoice.subtotal * 0.1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment status ── */}
          <div className="px-8 pb-6 bg-white">
            {invoice.status === 'paid' ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-800">Payment Received</h3>
                    <p className="text-xs text-emerald-600">This invoice has been paid in full</p>
                  </div>
                </div>
                {invoice.paymentDetails && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {[
                      { label: 'Payment ID', value: invoice.paymentDetails?.paymentId || `PAY-${invoice.invoiceNumber}` },
                      { label: 'Method', value: invoice.paymentDetails?.method === 'bank_transfer' ? 'Bank Transfer' : invoice.paymentDetails?.method === 'cheque' ? 'Cheque' : (invoice.paymentDetails?.method || 'Bank Transfer') },
                      { label: invoice.paymentDetails?.method === 'cheque' ? 'Cheque No.' : 'Txn Ref. No.', value: (invoice.paymentDetails as any)?.referenceNo || '—' },
                      { label: 'Amount', value: formatCurrency(invoice.paymentDetails?.amount || invoice.total) },
                      { label: 'Paid On', value: invoice.paymentDetails?.paidAt ? formatDate(invoice.paymentDetails.paidAt) : formatDate(invoice.updatedAt) },
                    ].map((d) => (
                      <div key={d.label} className="bg-white rounded-xl p-3 border border-emerald-100">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-1">{d.label}</p>
                        <p className="font-bold text-emerald-800 text-sm break-all">{d.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800">Payment Pending</h3>
                  <p className="text-sm text-red-600 mt-0.5">Please make payment as per the agreed terms and conditions.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Notes & Terms ── */}
          {(invoice.notes || invoice.termsAndConditions) && (
            <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
              {invoice.notes && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice.termsAndConditions && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Terms & Conditions</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{invoice.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Bank Details ── */}
          {(company?.bankDetails?.accountName || company?.bankDetails?.accountNumber || company?.bankDetails?.bankName || company?.bankDetails?.ifsc || company?.upiId) && (
            <div className="px-8 pb-8 bg-white">
              <div className="rounded-2xl border border-indigo-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-3 flex items-center gap-2 border-b border-indigo-100">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Bank Details for Payment</p>
                </div>
                {/* Detail Cards */}
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {company?.bankDetails?.accountName && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Name</p>
                      <p className="text-sm font-semibold text-slate-800">{company.bankDetails.accountName}</p>
                    </div>
                  )}
                  {company?.bankDetails?.accountNumber && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Number</p>
                      <p className="text-sm font-semibold text-slate-800 break-all">{company.bankDetails.accountNumber}</p>
                    </div>
                  )}
                  {company?.bankDetails?.bankName && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Name</p>
                      <p className="text-sm font-semibold text-slate-800">{company.bankDetails.bankName}</p>
                    </div>
                  )}
                  {company?.bankDetails?.ifsc && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IFSC Code</p>
                      <p className="text-sm font-semibold text-slate-800 font-mono">{company.bankDetails.ifsc}</p>
                    </div>
                  )}
                  {company?.upiId && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">UPI ID</p>
                      <p className="text-sm font-semibold text-slate-800">{company.upiId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-5 flex items-center justify-between">
            <p className="text-slate-400 text-xs italic">
              This is a computer-generated invoice by {company?.name || 'Bytes Flare Infotech'}.
            </p>
            <p className="text-slate-500 text-xs">
              Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
