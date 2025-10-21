'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Save, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  Upload,
  User,
  Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyDetails {
  name: string;
  gstin: string;
  pan: string;
  address: string;
  phone: string;
  email: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifsc: string;
  };
  upiId: string;
  logo: string;
  signature: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CompanyDetails>({
    defaultValues: {
      name: 'Bytesflare Infotech',
      gstin: '',
      pan: '',
      address: '',
      phone: '',
      email: '',
      bankDetails: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        ifsc: '',
      },
      upiId: '',
      logo: '',
      signature: '',
    },
  });

  useEffect(() => {
    // Load user's company details
    loadCompanyDetails();
  }, []);

  const loadCompanyDetails = async () => {
    try {
      // This would fetch from user profile API
      // For now, we'll use default values
      setValue('name', 'Bytesflare Infotech');
      setValue('gstin', '29ABCDE1234F1Z5');
      setValue('pan', 'ABCDE1234F');
      setValue('address', '123 Tech Park, Bangalore, Karnataka 560001');
      setValue('phone', '+91 9876543210');
      setValue('email', 'info@bytesflare.com');
      setValue('bankDetails.accountName', 'Bytesflare Infotech Pvt Ltd');
      setValue('bankDetails.accountNumber', '1234567890123456');
      setValue('bankDetails.bankName', 'HDFC Bank');
      setValue('bankDetails.ifsc', 'HDFC0001234');
      setValue('upiId', 'bytesflare@paytm');
    } catch (error) {
      console.error('Error loading company details:', error);
    }
  };

  const onSubmit = async (data: CompanyDetails) => {
    setSaving(true);
    
    try {
      // This would save to user profile API
      console.log('Saving company details:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Company details updated successfully!');
    } catch (error) {
      console.error('Error saving company details:', error);
      toast.error('Failed to save company details');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (field: 'logo' | 'signature') => {
    // This would implement file upload functionality
    toast.success(`${field} upload feature coming soon!`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your company profile and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Company Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Company name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSTIN
              </label>
              <input
                type="text"
                {...register('gstin', {
                  pattern: {
                    value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                    message: 'Invalid GSTIN format'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="29ABCDE1234F1Z5"
              />
              {errors.gstin && (
                <p className="text-red-500 text-sm mt-1">{errors.gstin.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number
              </label>
              <input
                type="text"
                {...register('pan', {
                  pattern: {
                    value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                    message: 'Invalid PAN format'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABCDE1234F"
              />
              {errors.pan && (
                <p className="text-red-500 text-sm mt-1">{errors.pan.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                {...register('upiId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="company@paytm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              {...register('address', { required: 'Address is required' })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter complete business address"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
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
                {...register('bankDetails.accountName', { required: 'Account name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.bankDetails?.accountName && (
                <p className="text-red-500 text-sm mt-1">{errors.bankDetails.accountName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                {...register('bankDetails.accountNumber', { required: 'Account number is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.bankDetails?.accountNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.bankDetails.accountNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                {...register('bankDetails.bankName', { required: 'Bank name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.bankDetails?.bankName && (
                <p className="text-red-500 text-sm mt-1">{errors.bankDetails.bankName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code *
              </label>
              <input
                type="text"
                {...register('bankDetails.ifsc', { 
                  required: 'IFSC code is required',
                  pattern: {
                    value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                    message: 'Invalid IFSC code format'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HDFC0001234"
              />
              {errors.bankDetails?.ifsc && (
                <p className="text-red-500 text-sm mt-1">{errors.bankDetails.ifsc.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Branding
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload your company logo</p>
                <button
                  type="button"
                  onClick={() => handleFileUpload('logo')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Choose File
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload your digital signature</p>
                <button
                  type="button"
                  onClick={() => handleFileUpload('signature')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Choose File
                </button>
              </div>
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
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
