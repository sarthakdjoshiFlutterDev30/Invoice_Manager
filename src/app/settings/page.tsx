"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Save, Building2, CreditCard, Settings as SettingsIcon,
  Upload, CheckCircle, X, ImageIcon, Loader2, Cloud,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

interface CompanyDetails {
  name: string; gstin: string; pan: string; tan: string; cin: string;
  address: string; phone: string; email: string;
  bankDetails: { accountName: string; accountNumber: string; bankName: string; ifsc: string };
  logo?: string;
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CompanyDetails>({
    defaultValues: {
      name: 'Bytesflare Infotech', gstin: '', pan: '', tan: '', cin: '',
      address: '', phone: '', email: '',
      bankDetails: { accountName: '', accountNumber: '', bankName: '', ifsc: '' },
      logo: '',
    },
  });

  useEffect(() => { loadCompanyDetails(); }, []);

  const loadCompanyDetails = async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        setValue('name', d.name || '');
        setValue('gstin', d.gstin || '');
        setValue('pan', d.pan || '');
        setValue('tan', d.tan || '');
        setValue('cin', d.cin || '');
        setValue('address', d.address || '');
        setValue('phone', d.phone || '');
        setValue('email', d.email || '');
        setValue('bankDetails.accountName', d.bankDetails?.accountName || '');
        setValue('bankDetails.accountNumber', d.bankDetails?.accountNumber || '');
        setValue('bankDetails.bankName', d.bankDetails?.bankName || '');
        setValue('bankDetails.ifsc', d.bankDetails?.ifsc || '');
        setValue('logo', d.logo || '');
        setLogoUrl(d.logo || '');
      }
    } catch { toast.error("Error loading company details"); }
  };

  const uploadToCloudflare = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/upload/logo', { method: 'POST', body: form });
      const data = await res.json();

      if (data.success) {
        setLogoUrl(data.url);
        setValue('logo', data.url);
        toast.success('Logo uploaded to Cloudflare!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToCloudflare(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToCloudflare(file);
  };

  const removeLogo = () => {
    setLogoUrl('');
    setValue('logo', '');
  };

  const onSubmit = async (data: CompanyDetails) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Settings saved!");
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(result.message || "Failed to save");
      }
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const inputClass = (hasError?: boolean) =>
    `input-premium ${hasError ? 'border-red-500/50' : ''}`;

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="icon-box bg-indigo-500/20">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="icon-box bg-indigo-500/20">
          <SettingsIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">Configuration</span>
          <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your company profile and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Company Information ─────────────────────────────── */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <SectionHeader icon={Building2} title="Company Information" subtitle="Your business identity on invoices" />

          {/* Logo Upload — Cloudflare Images */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-orange-400" />
              Company Logo
              <span className="text-orange-400/70 normal-case font-normal tracking-normal">· Stored on Cloudinary</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Preview */}
              <div className="relative flex-shrink-0">
                <div className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all duration-300 ${logoUrl
                  ? 'border-indigo-500/40 bg-slate-800/50'
                  : 'border-dashed border-slate-700 bg-slate-800/30'
                  }`}>
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Company Logo"
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-colors shadow-lg"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`flex-1 min-h-[96px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${dragOver
                  ? 'border-indigo-500/70 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-indigo-500/40 hover:bg-indigo-500/5'
                  } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-medium">Uploading to Cloudflare...</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-slate-500" />
                      <Cloud className="w-4 h-4 text-orange-400/70" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">
                      {dragOver ? 'Drop to upload' : 'Click or drag & drop'}
                    </p>
                    <p className="text-xs text-slate-600">PNG, JPG, WebP · Max 10MB</p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Cloudflare badge */}
            {logoUrl && (
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/15">
                <Cloud className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <p className="text-xs text-orange-400/80 truncate">
                  Hosted on Cloudinary: <span className="font-mono text-orange-300">{logoUrl}</span>
                </p>
              </div>
            )}
          </div>

          {/* Company fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              { label: 'Company Name *', field: 'name', type: 'text', placeholder: '', rules: { required: 'Required' } },
              { label: 'Email Address *', field: 'email', type: 'email', placeholder: '', rules: { required: 'Required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } } },
              { label: 'Phone Number', field: 'phone', type: 'tel', placeholder: '', rules: {} },
              { label: 'GSTIN', field: 'gstin', type: 'text', placeholder: '29ABCDE1234F1Z5', rules: { pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GSTIN' } } },
              { label: 'PAN Number', field: 'pan', type: 'text', placeholder: 'ABCDE1234F', rules: { pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN' } } },
              { label: 'TAN Number', field: 'tan', type: 'text', placeholder: 'ABCD01234E', rules: { pattern: { value: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, message: 'Invalid TAN' } } },
              { label: 'CIN Number', field: 'cin', type: 'text', placeholder: 'U72200KA2020PTC123456', rules: {} },
            ] as Array<{ label: string; field: 'name' | 'email' | 'phone' | 'gstin' | 'pan' | 'tan' | 'cin'; type: string; placeholder: string; rules: Record<string, unknown> }>).map(({ label, field, type, placeholder, rules }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{label}</label>
                <input
                  type={type}
                  {...register(field, rules)}
                  placeholder={placeholder}
                  className={inputClass(!!(errors as Record<string, unknown>)[field])}
                />
                {(errors as Record<string, { message?: string }>)[field] && (
                  <p className="text-red-400 text-xs mt-1">{(errors as Record<string, { message?: string }>)[field]?.message}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Address *</label>
            <textarea
              {...register("address", { required: "Address is required" })}
              rows={3}
              placeholder="Enter complete business address"
              className={`${inputClass(!!errors.address)} resize-none`}
            />
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
          </div>
        </div>

        {/* ── Bank Details ────────────────────────────────────── */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <SectionHeader icon={CreditCard} title="Bank Details" subtitle="Payment information for invoices" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              { label: 'Account Holder Name *', field: 'bankDetails.accountName', placeholder: '', rules: { required: 'Required' } },
              { label: 'Account Number *', field: 'bankDetails.accountNumber', placeholder: '', rules: { required: 'Required' } },
              { label: 'Bank Name *', field: 'bankDetails.bankName', placeholder: '', rules: { required: 'Required' } },
              { label: 'IFSC Code *', field: 'bankDetails.ifsc', placeholder: 'HDFC0001234', rules: { required: 'Required', pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC' } } },
            ] as Array<{ label: string; field: 'bankDetails.accountName' | 'bankDetails.accountNumber' | 'bankDetails.bankName' | 'bankDetails.ifsc'; placeholder: string; rules: Record<string, unknown> }>).map(({ label, field, placeholder, rules }) => {
              const fieldKey = field.replace('bankDetails.', '') as 'accountName' | 'accountNumber' | 'bankName' | 'ifsc';
              const hasError = !!errors.bankDetails?.[fieldKey];
              return (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{label}</label>
                  <input type="text" {...register(field, rules)} placeholder={placeholder} className={inputClass(hasError)} />
                  {hasError && <p className="text-red-400 text-xs mt-1">{errors.bankDetails?.[fieldKey]?.message}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Save ────────────────────────────────────────────── */}
        <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-premium flex items-center gap-2 text-sm px-8 py-3 disabled:opacity-60 transition-all"
            style={saved ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" />Saved!</>
            ) : (
              <><Save className="w-4 h-4" />Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
