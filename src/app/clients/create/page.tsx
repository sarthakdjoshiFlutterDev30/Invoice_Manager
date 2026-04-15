'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, User, Phone, MapPin, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientForm {
  name: string; email: string; phone: string; address: string; gstin: string;
}

export default function CreateClientPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<ClientForm>({
    defaultValues: { name: '', email: '', phone: '', address: '', gstin: '' },
  });

  const onSubmit = async (data: ClientForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) { toast.success('Client created!'); router.push('/clients'); }
      else toast.error(result.message || 'Failed to create client');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className="icon-box bg-indigo-500/20"><Icon className="w-4 h-4 text-indigo-400" /></div>
      <h2 className="text-base font-semibold text-slate-100">{title}</h2>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        <button onClick={() => router.back()} className="icon-box bg-white/5 hover:bg-white/10 transition-colors border border-white/8 cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">New Client</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Add Client</h1>
          <p className="text-slate-500 text-sm mt-0.5">Enter client information to get started</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Info */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <SectionHeader icon={User} title="Basic Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Client Name *</label>
              <input type="text" {...register('name', { required: 'Required', minLength: { value: 2, message: 'Min 2 characters' } })}
                placeholder="Enter client name" className={`input-premium ${errors.name ? 'border-red-500/50' : ''}`} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Email Address *</label>
              <input type="email" {...register('email', { required: 'Required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } })}
                placeholder="client@example.com" className={`input-premium ${errors.email ? 'border-red-500/50' : ''}`} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <SectionHeader icon={Phone} title="Contact Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Phone Number</label>
              <input type="tel" {...register('phone', { pattern: { value: /^[\+]?[1-9][\d]{0,15}$/, message: 'Invalid phone' } })}
                placeholder="+91 9876543210" className={`input-premium ${errors.phone ? 'border-red-500/50' : ''}`} />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">GSTIN (Optional)</label>
              <input type="text" {...register('gstin', { pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GSTIN' } })}
                placeholder="29ABCDE1234F1Z5" className={`input-premium font-mono ${errors.gstin ? 'border-red-500/50' : ''}`} />
              {errors.gstin && <p className="text-red-400 text-xs mt-1">{errors.gstin.message}</p>}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <SectionHeader icon={MapPin} title="Address Information" />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Address *</label>
            <textarea {...register('address', { required: 'Required', minLength: { value: 10, message: 'Min 10 characters' } })}
              rows={4} placeholder="Enter complete address including city, state, and postal code"
              className={`input-premium resize-none ${errors.address ? 'border-red-500/50' : ''}`} />
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <button type="button" onClick={() => router.back()} className="btn-ghost text-sm">Cancel</button>
          <button type="submit" disabled={loading} className="btn-premium flex items-center gap-2 text-sm disabled:opacity-60">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><Save className="w-4 h-4" />Create Client</>}
          </button>
        </div>
      </form>
    </div>
  );
}
