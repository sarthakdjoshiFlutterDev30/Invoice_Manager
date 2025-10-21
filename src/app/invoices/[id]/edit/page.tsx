'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Save, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

interface Client {
  _id: string;
  name: string;
  email: string;
  address: string;
  gstin?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  gstPercentage: number;
  amount: number;
}

interface InvoiceForm {
  client: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
  termsAndConditions?: string;
}

export default function EditInvoicePage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceForm>({
    defaultValues: {
      client: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        {
          description: '',
          quantity: 1,
          rate: 0,
          gstPercentage: 18,
          amount: 0,
        },
      ],
      notes: '',
      termsAndConditions: 'Payment is due within 3 days of invoice date.',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  // Fetch clients and invoice data
  useEffect(() => {
    fetchClients();
    fetchInvoice();
  }, []);

  // Auto-update due date when issue date changes
  const watchedIssueDate = watch('issueDate');
  useEffect(() => {
    if (watchedIssueDate) {
      const issueDate = new Date(watchedIssueDate);
      const dueDate = new Date(issueDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      setValue('dueDate', dueDate.toISOString().split('T')[0]);
    }
  }, [watchedIssueDate, setValue]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${params.id}`);
      const data = await response.json();

      if (data.success) {
        const invoiceData = data.data;
        setInvoice(invoiceData);
        
        // Populate form with existing invoice data
        setValue('client', invoiceData.client._id);
        setValue('issueDate', new Date(invoiceData.issueDate).toISOString().split('T')[0]);
        setValue('dueDate', new Date(invoiceData.dueDate).toISOString().split('T')[0]);
        setValue('items', invoiceData.items);
        setValue('notes', invoiceData.notes || '');
        setValue('termsAndConditions', invoiceData.termsAndConditions || '');
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

  // Calculate amounts when items change
  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const amount = item.quantity * item.rate;
      const gstAmount = (amount * item.gstPercentage) / 100;
      const totalAmount = amount + gstAmount;
      
      setValue(`items.${index}.amount`, totalAmount);
    });
  }, [watchedItems, setValue]);

  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const gstAmount = watchedItems.reduce((sum, item) => {
      const itemAmount = item.quantity * item.rate;
      return sum + (itemAmount * item.gstPercentage) / 100;
    }, 0);
    const total = subtotal + gstAmount;
    
    return { subtotal, gstAmount, total };
  };

  const onSubmit = async (data: InvoiceForm) => {
    try {
      setLoading(true);
      
      const { subtotal, gstAmount, total } = calculateTotals();
      
      const invoiceData = {
        ...data,
        subtotal,
        gstAmount,
        total,
        updatedAt: new Date(),
      };

      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Invoice updated successfully!');
        router.push(`/invoices/${params.id}`);
      } else {
        toast.error(result.message || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.back();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading && !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading invoice...</span>
        </div>
      </div>
    );
  }

  const { subtotal, gstAmount, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Logo />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Edit Invoice {invoice?.invoiceNumber}
                </h1>
                <p className="text-sm text-gray-500">Update invoice details</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Client Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client *
              </label>
              <select
                {...register('client', { required: 'Please select a client' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
              {errors.client && (
                <p className="text-red-500 text-sm mt-1">{errors.client.message}</p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date *
                </label>
                <input
                  type="date"
                  {...register('issueDate', { required: 'Issue date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.issueDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.issueDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  {...register('dueDate', { required: 'Due date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
              <button
                type="button"
                onClick={() => append({
                  description: '',
                  quantity: 1,
                  rate: 0,
                  gstPercentage: 18,
                  amount: 0,
                })}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      {...register(`items.${index}.description`, { required: 'Description is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item description"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-red-500 text-xs mt-1">{errors.items[index]?.description?.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      {...register(`items.${index}.quantity`, { 
                        required: 'Quantity is required',
                        min: { value: 1, message: 'Quantity must be at least 1' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-red-500 text-xs mt-1">{errors.items[index]?.quantity?.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate (₹) *
                    </label>
                    <input
                      type="number"
                      {...register(`items.${index}.rate`, { 
                        required: 'Rate is required',
                        min: { value: 0, message: 'Rate cannot be negative' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                    {errors.items?.[index]?.rate && (
                      <p className="text-red-500 text-xs mt-1">{errors.items[index]?.rate?.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST %
                    </label>
                    <select
                      {...register(`items.${index}.gstPercentage`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      {...register(`items.${index}.amount`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                      value={watchedItems[index]?.amount || 0}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Totals</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST:</span>
                <span className="font-medium">{formatCurrency(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes for the invoice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  {...register('termsAndConditions')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Terms and conditions"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Updating...' : 'Update Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
