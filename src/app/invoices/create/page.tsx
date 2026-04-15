'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, Eye, Download, Printer, FileText, ArrowLeft, Users, Calendar, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { pdfGenerator } from '@/lib/pdfGenerator';

interface Client { _id: string; name: string; email: string; address: string; gstin?: string; }
interface InvoiceItem { description: string; quantity: number; rate: number; gstPercentage: number; amount: number; }
interface InvoiceForm { client: string; issueDate: string; dueDate: string; items: InvoiceItem[]; notes?: string; termsAndConditions?: string; }

export default function CreateInvoicePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [company, setCompany] = useState<Record<string, string> | null>(null);
  const router = useRouter();

  const getLogoDataURL = async (): Promise<string | undefined> => {
    try {
      const res = await fetch('/logo.png');
      if (!res.ok) return undefined;
      const blob = await res.blob();
      return await new Promise<string>((resolve) => { const r = new FileReader(); r.onloadend = () => resolve(String(r.result)); r.readAsDataURL(blob); });
    } catch { return undefined; }
  };

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceForm>({
    defaultValues: {
      client: '', issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, rate: 0, gstPercentage: 18, amount: 0 }],
      notes: '', termsAndConditions: 'Payment is due within 3 days of invoice date.',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  useEffect(() => { fetchClients(); fetchCompanySettings(); }, []);

  const fetchCompanySettings = async () => {
    try { const res = await fetch('/api/settings', { cache: 'no-store' }); const r = await res.json(); if (r.success) setCompany(r.data); } catch { }
  };

  const fetchClients = async () => {
    try { const res = await fetch('/api/clients'); const d = await res.json(); if (d.success) setClients(d.data); } catch { }
  };

  useEffect(() => {
    watchedItems.forEach((item, i) => {
      const base = item.quantity * item.rate;
      setValue(`items.${i}.amount`, base + (base * item.gstPercentage) / 100);
    });
  }, [watchedItems, setValue]);

  const watchedIssueDate = watch('issueDate');
  useEffect(() => {
    if (watchedIssueDate) setValue('dueDate', new Date(new Date(watchedIssueDate).getTime() + 3 * 86400000).toISOString().split('T')[0]);
  }, [watchedIssueDate, setValue]);

  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((s, i) => s + i.quantity * i.rate, 0);
    const gstAmount = watchedItems.reduce((s, i) => s + (i.quantity * i.rate * i.gstPercentage) / 100, 0);
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const computedItems = watchedItems.map(item => {
    const base = Number(item.quantity || 0) * Number(item.rate || 0);
    return { ...item, amount: base + (base * Number(item.gstPercentage || 0)) / 100 };
  });

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  const buildPayload = async (invoiceNumber = 'INV-PREVIEW') => {
    const { subtotal, gstAmount, total } = calculateTotals();
    const selectedClient = clients.find(c => c._id === watch('client'));
    if (!selectedClient) { toast.error('Please select a client first'); return null; }
    const logoDataURL = company?.logo?.startsWith('data:image') ? company.logo : await getLogoDataURL();
    return {
      invoiceNumber, client: { name: selectedClient.name, email: selectedClient.email, address: selectedClient.address, gstin: selectedClient.gstin },
      issueDate: watch('issueDate'), dueDate: watch('dueDate'), items: computedItems, subtotal, gstAmount, total,
      status: 'unpaid' as 'paid' | 'unpaid', notes: watch('notes'), termsAndConditions: watch('termsAndConditions'),
      companyDetails: { name: company?.name || 'Bytesflare Infotech', gstin: company?.gstin || '', address: company?.address || '', phone: company?.phone || '', email: company?.email || '', logo: logoDataURL },
    };
  };

  const onSubmit = async (data: InvoiceForm) => {
    setLoading(true);
    try {
      const { subtotal, gstAmount, total } = calculateTotals();
      const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, items: computedItems, subtotal, gstAmount, total, status: 'unpaid' }) });
      const result = await res.json();
      if (result.success) { toast.success('Invoice created!'); router.push('/invoices'); }
      else toast.error(result.message || 'Failed to create invoice');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleDownloadPDF = async () => {
    try { const d = await buildPayload(); if (!d) return; const blob = await pdfGenerator.generateInvoicePDF(d); pdfGenerator.downloadPDF(blob, `Invoice-${d.invoiceNumber}.pdf`); toast.success('PDF downloaded!'); } catch { toast.error('Failed to generate PDF'); }
  };

  const handlePrint = async () => {
    try { const d = await buildPayload(); if (!d) return; const blob = await pdfGenerator.generateInvoicePDF(d); pdfGenerator.printPDF(blob); } catch { toast.error('Failed to print'); }
  };

  const { subtotal, gstAmount, total } = calculateTotals();
  const selectedClient = clients.find(c => c._id === watch('client'));

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className="icon-box bg-indigo-500/20"><Icon className="w-4 h-4 text-indigo-400" /></div>
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );

  if (previewMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setPreviewMode(false)} className="icon-box bg-white/5 hover:bg-white/10 transition-colors border border-white/8 cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </button>
            <h1 className="text-2xl font-bold text-slate-100">Invoice Preview</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDownloadPDF} className="btn-ghost flex items-center gap-2 text-sm"><Download className="w-4 h-4" />Download PDF</button>
            <button onClick={handlePrint} className="btn-ghost flex items-center gap-2 text-sm"><Printer className="w-4 h-4" />Print</button>
          </div>
        </div>

        <div className="glass-card-static p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold gradient-text">INVOICE</h2>
              <p className="text-slate-500 text-sm mt-1">Preview</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-slate-100">{company?.name || 'Bytesflare Infotech'}</h3>
              {company?.gstin && <p className="text-slate-400 text-sm">GSTIN: {company.gstin}</p>}
              {company?.address && <p className="text-slate-400 text-sm">{company.address}</p>}
            </div>
          </div>

          {selectedClient && (
            <div className="mb-8 p-4 rounded-xl bg-white/3 border border-white/5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Bill To</p>
              <p className="text-slate-200 font-semibold">{selectedClient.name}</p>
              <p className="text-slate-400 text-sm">{selectedClient.email}</p>
              <p className="text-slate-400 text-sm">{selectedClient.address}</p>
              {selectedClient.gstin && <p className="text-slate-400 text-sm font-mono">GSTIN: {selectedClient.gstin}</p>}
            </div>
          )}

          <div className="overflow-x-auto mb-6">
            <table className="premium-table">
              <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>GST %</th><th>Amount</th></tr></thead>
              <tbody>
                {computedItems.map((item, i) => (
                  <tr key={i}>
                    <td className="text-slate-200">{item.description || '—'}</td>
                    <td>{item.quantity}</td>
                    <td>{fmt(item.rate)}</td>
                    <td>{item.gstPercentage}%</td>
                    <td className="font-semibold text-slate-100">{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 p-4 rounded-xl bg-white/3 border border-white/5">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-slate-200">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">GST</span><span className="text-slate-200">{fmt(gstAmount)}</span></div>
              <div className="divider" />
              <div className="flex justify-between font-bold"><span className="text-slate-100">Total</span><span className="gradient-text text-lg">{fmt(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        <button onClick={() => router.back()} className="icon-box bg-white/5 hover:bg-white/10 transition-colors border border-white/8 cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">New Invoice</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Create Invoice</h1>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the details to generate a new invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Client */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <SectionHeader icon={Users} title="Client Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Select Client *</label>
              <select {...register('client', { required: 'Please select a client' })} className={`input-premium appearance-none cursor-pointer ${errors.client ? 'border-red-500/50' : ''}`}>
                <option value="">Choose a client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name} — {c.email}</option>)}
              </select>
              {errors.client && <p className="text-red-400 text-xs mt-1">{errors.client.message}</p>}
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => router.push('/clients/create')} className="btn-ghost w-full text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />Add New Client
              </button>
            </div>
          </div>
          {selectedClient && (
            <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-sm">
              <p className="text-slate-300 font-medium">{selectedClient.name}</p>
              <p className="text-slate-500">{selectedClient.email} · {selectedClient.address}</p>
              {selectedClient.gstin && <p className="text-indigo-400 font-mono text-xs mt-1">GSTIN: {selectedClient.gstin}</p>}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <SectionHeader icon={Calendar} title="Invoice Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Issue Date *</label>
              <input type="date" {...register('issueDate', { required: 'Required' })} className={`input-premium ${errors.issueDate ? 'border-red-500/50' : ''}`} />
              {errors.issueDate && <p className="text-red-400 text-xs mt-1">{errors.issueDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Due Date *</label>
              <input type="date" {...register('dueDate', { required: 'Required' })} className={`input-premium ${errors.dueDate ? 'border-red-500/50' : ''}`} />
              {errors.dueDate && <p className="text-red-400 text-xs mt-1">{errors.dueDate.message}</p>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-box bg-indigo-500/20"><Hash className="w-4 h-4 text-indigo-400" /></div>
              <div>
                <h2 className="text-base font-semibold text-slate-100">Invoice Items</h2>
                <p className="text-xs text-slate-500">{fields.length} item{fields.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button type="button" onClick={() => append({ description: '', quantity: 1, rate: 0, gstPercentage: 18, amount: 0 })}
              className="btn-premium flex items-center gap-2 text-xs px-3 py-2">
              <Plus className="w-3.5 h-3.5" />Add Item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-indigo-500/20 transition-colors">
                {/* Description — full width */}
                <div className="mb-3">
                  <label className="block text-xs text-slate-500 mb-1.5">Description *</label>
                  <input {...register(`items.${index}.description`, { required: 'Required' })} placeholder="Service or product description" className="input-premium text-sm" />
                  {errors.items?.[index]?.description && <p className="text-red-400 text-xs mt-1">{errors.items[index]?.description?.message}</p>}
                </div>
                {/* Qty / Rate / GST / Amount + Delete */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Qty *</label>
                    <input type="number" min="1" {...register(`items.${index}.quantity`, { required: 'Required', min: { value: 1, message: 'Min 1' } })} className="input-premium text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Rate (₹) *</label>
                    <input type="number" min="0" step="0.01" {...register(`items.${index}.rate`, { required: 'Required', min: { value: 0, message: 'Min 0' } })} className="input-premium text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">GST %</label>
                    <select {...register(`items.${index}.gstPercentage`)} className="input-premium text-sm appearance-none cursor-pointer">
                      {[0, 5, 12, 18, 28].map(v => <option key={v} value={v}>{v}%</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1.5">Amount</label>
                      <div className="input-premium text-sm text-emerald-400 font-semibold bg-emerald-500/5 border-emerald-500/20 cursor-default truncate">
                        {fmt(computedItems[index]?.amount || 0)}
                      </div>
                    </div>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)}
                        className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 mb-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-5 flex justify-end">
            <div className="w-72 space-y-2 p-4 rounded-xl bg-white/3 border border-white/5">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-slate-200">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">GST</span><span className="text-slate-200">{fmt(gstAmount)}</span></div>
              <div className="divider" />
              <div className="flex justify-between font-bold"><span className="text-slate-100">Total</span><span className="gradient-text text-lg">{fmt(total)}</span></div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <SectionHeader icon={FileText} title="Additional Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Notes</label>
              <textarea {...register('notes')} rows={3} placeholder="Additional notes for the client..." className="input-premium resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Terms & Conditions</label>
              <textarea {...register('termsAndConditions')} rows={3} placeholder="Terms and conditions..." className="input-premium resize-none" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreviewMode(true)} className="btn-ghost flex items-center gap-2 text-sm"><Eye className="w-4 h-4" />Preview</button>
            <button type="button" onClick={handleDownloadPDF} className="btn-ghost flex items-center gap-2 text-sm"><Download className="w-4 h-4" />PDF</button>
            <button type="button" onClick={handlePrint} className="btn-ghost flex items-center gap-2 text-sm"><Printer className="w-4 h-4" />Print</button>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.push('/invoices')} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-premium flex items-center gap-2 text-sm disabled:opacity-60">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><Save className="w-4 h-4" />Create Invoice</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
