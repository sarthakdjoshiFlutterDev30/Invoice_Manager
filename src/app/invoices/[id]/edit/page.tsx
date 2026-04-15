'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Save, Plus, Trash2, ArrowLeft, FileText, Users, Calendar, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

interface Client { _id: string; name: string; email: string; address: string; gstin?: string; }
interface InvoiceItem { description: string; quantity: number; rate: number; gstPercentage: number; amount: number; }
interface InvoiceForm { client: string; issueDate: string; dueDate: string; items: InvoiceItem[]; notes?: string; termsAndConditions?: string; }

export default function EditInvoicePage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

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

  useEffect(() => { fetchClients(); fetchInvoice(); }, []);

  const watchedIssueDate = watch('issueDate');
  useEffect(() => {
    if (watchedIssueDate) setValue('dueDate', new Date(new Date(watchedIssueDate).getTime() + 3 * 86400000).toISOString().split('T')[0]);
  }, [watchedIssueDate, setValue]);

  useEffect(() => {
    watchedItems.forEach((item, i) => {
      const base = item.quantity * item.rate;
      setValue(`items.${i}.amount`, base + (base * item.gstPercentage) / 100);
    });
  }, [watchedItems, setValue]);

  const fetchClients = async () => {
    try { const res = await fetch('/api/clients'); const d = await res.json(); if (d.success) setClients(d.data); } catch { }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${params.id}`);
      const data = await res.json();
      if (data.success) {
        const inv = data.data;
        setInvoiceNumber(inv.invoiceNumber);
        setValue('client', inv.client._id);
        setValue('issueDate', new Date(inv.issueDate).toISOString().split('T')[0]);
        setValue('dueDate', new Date(inv.dueDate).toISOString().split('T')[0]);
        setValue('items', inv.items);
        setValue('notes', inv.notes || '');
        setValue('termsAndConditions', inv.termsAndConditions || '');
      } else { toast.error('Failed to fetch invoice'); router.push('/invoices'); }
    } catch { toast.error('Failed to fetch invoice'); router.push('/invoices'); }
    finally { setLoading(false); }
  };

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

  const onSubmit = async (data: InvoiceForm) => {
    setLoading(true);
    try {
      const { subtotal, gstAmount, total } = calculateTotals();
      const res = await fetch(`/api/invoices/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, subtotal, gstAmount, total, updatedAt: new Date() }) });
      const result = await res.json();
      if (result.success) { toast.success('Invoice updated!'); router.push(`/invoices/${params.id}`); }
      else toast.error(result.message || 'Failed to update');
    } catch { toast.error('Failed to update invoice'); }
    finally { setLoading(false); }
  };

  const { subtotal, gstAmount, total } = calculateTotals();
  const selectedClient = clients.find(c => c._id === watch('client'));

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className="icon-box bg-indigo-500/20"><Icon className="w-4 h-4 text-indigo-400" /></div>
      <h2 className="text-base font-semibold text-slate-100">{title}</h2>
    </div>
  );

  if (loading && !invoiceNumber) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-slate-500 text-sm animate-pulse">Loading invoice...</p>
    </div>
  );

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
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">Edit Invoice</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">
            {invoiceNumber ? <><span className="text-slate-400 font-normal">Editing </span>{invoiceNumber}</> : 'Edit Invoice'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Client */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <SectionHeader icon={Users} title="Client Information" />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Select Client *</label>
            <select {...register('client', { required: 'Please select a client' })} className={`input-premium appearance-none cursor-pointer ${errors.client ? 'border-red-500/50' : ''}`}>
              <option value="">Choose a client...</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name} — {c.email}</option>)}
            </select>
            {errors.client && <p className="text-red-400 text-xs mt-1">{errors.client.message}</p>}
          </div>
          {selectedClient && (
            <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-sm">
              <p className="text-slate-300 font-medium">{selectedClient.name}</p>
              <p className="text-slate-500">{selectedClient.email} · {selectedClient.address}</p>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <SectionHeader icon={Calendar} title="Invoice Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Issue Date *</label>
              <input type="date" {...register('issueDate', { required: 'Required' })} className="input-premium" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Due Date *</label>
              <input type="date" {...register('dueDate', { required: 'Required' })} className="input-premium" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-box bg-indigo-500/20"><Hash className="w-4 h-4 text-indigo-400" /></div>
              <h2 className="text-base font-semibold text-slate-100">Invoice Items</h2>
            </div>
            <button type="button" onClick={() => append({ description: '', quantity: 1, rate: 0, gstPercentage: 18, amount: 0 })}
              className="btn-premium flex items-center gap-2 text-xs px-3 py-2">
              <Plus className="w-3.5 h-3.5" />Add Item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-indigo-500/20 transition-colors">
                <div className="mb-3">
                  <label className="block text-xs text-slate-500 mb-1.5">Description *</label>
                  <input {...register(`items.${index}.description`, { required: 'Required' })} placeholder="Service or product" className="input-premium text-sm" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Qty</label>
                    <input type="number" min="1" {...register(`items.${index}.quantity`, { required: 'Required', min: 1 })} className="input-premium text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Rate (₹)</label>
                    <input type="number" min="0" step="0.01" {...register(`items.${index}.rate`, { required: 'Required', min: 0 })} className="input-premium text-sm" />
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
                      <button type="button" onClick={() => remove(index)} className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 mb-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

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
              <textarea {...register('notes')} rows={3} placeholder="Additional notes..." className="input-premium resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Terms & Conditions</label>
              <textarea {...register('termsAndConditions')} rows={3} placeholder="Terms and conditions..." className="input-premium resize-none" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button type="button" onClick={() => { if (confirm('Discard changes?')) router.back(); }} className="btn-ghost text-sm">Cancel</button>
          <button type="submit" disabled={loading} className="btn-premium flex items-center gap-2 text-sm disabled:opacity-60">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</> : <><Save className="w-4 h-4" />Update Invoice</>}
          </button>
        </div>
      </form>
    </div>
  );
}
