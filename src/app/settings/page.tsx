"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  Building2,
  CreditCard,
  Settings as SettingsIcon,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

interface CompanyDetails {
  name: string;
  gstin: string;
  pan: string;
  tan: string;
  cin: string;
  address: string;
  phone: string;
  email: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifsc: string;
  };
  logo?: string;
}

export default function SettingsPage() {
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CompanyDetails>({
    defaultValues: {
      name: 'Bytesflare Infotech',
      gstin: '',
      pan: '',
      tan: '',
      cin: '',
      address: '',
      phone: '',
      email: '',
      bankDetails: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        ifsc: '',
      },
      logo: '',
    },
  });

  useEffect(() => {
    // Load user's company details
    loadCompanyDetails();
  }, []);

  const loadCompanyDetails = async () => {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        setValue('name',    data.name    || '');
        setValue('gstin',   data.gstin   || '');
        setValue('pan',     data.pan     || '');
        setValue('tan',     data.tan     || '');
        setValue('cin',     data.cin     || '');
        setValue('address', data.address || '');
        setValue('phone',   data.phone   || '');
        setValue('email',   data.email   || '');
        setValue('bankDetails.accountName',   data.bankDetails?.accountName   || '');
        setValue('bankDetails.accountNumber', data.bankDetails?.accountNumber || '');
        setValue('bankDetails.bankName',      data.bankDetails?.bankName      || '');
        setValue('bankDetails.ifsc',          data.bankDetails?.ifsc          || '');
        setValue('logo',  data.logo  || '');
        setLogoPreview(data.logo || '');
      } else {
        toast.error('Failed to load company details');
      }
    } catch (error) {
      console.error("Error loading company details:", error);
      toast.error("Error loading company details");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setValue("logo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: CompanyDetails) => {
    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Company details updated successfully!");
      } else {
        toast.error(result.message || "Failed to update company details");
      }
    } catch (error) {
      console.error("Error saving company details:", error);
      toast.error("Failed to save company details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your company profile and preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Company Information
          </h2>

          <div className="mb-6 flex items-center space-x-6">
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <label
                htmlFor="logo-upload"
                className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Logo</span>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                {...register('name', { required: 'Company name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input type="tel" {...register('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
              <input
                type="text"
                {...register('gstin', { pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GSTIN format' } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="29ABCDE1234F1Z5"
              />
              {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
              <input
                type="text"
                {...register('pan', { pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format' } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABCDE1234F"
              />
              {errors.pan && <p className="text-red-500 text-sm mt-1">{errors.pan.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TAN Number</label>
              <input
                type="text"
                {...register('tan', { pattern: { value: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, message: 'Invalid TAN format (e.g. ABCD01234E)' } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABCD01234E"
              />
              {errors.tan && <p className="text-red-500 text-sm mt-1">{errors.tan.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CIN Number</label>
              <input
                type="text"
                {...register('cin')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="U72200KA2020PTC123456"
              />
            </div>

          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              {...register("address", { required: "Address is required" })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter complete business address"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">
                {errors.address.message}
              </p>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Bank Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                {...register("bankDetails.accountName", {
                  required: "Account name is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.bankDetails?.accountName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.bankDetails.accountName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                {...register("bankDetails.accountNumber", {
                  required: "Account number is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.bankDetails?.accountNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.bankDetails.accountNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                {...register("bankDetails.bankName", {
                  required: "Bank name is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.bankDetails?.bankName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.bankDetails.bankName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code *
              </label>
              <input
                type="text"
                {...register("bankDetails.ifsc", {
                  required: "IFSC code is required",
                  pattern: {
                    value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                    message: "Invalid IFSC code format",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HDFC0001234"
              />
              {errors.bankDetails?.ifsc && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.bankDetails.ifsc.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
