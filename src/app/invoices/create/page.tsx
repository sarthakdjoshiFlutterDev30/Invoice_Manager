'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, Eye, Download, CreditCard, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { pdfGenerator } from '@/lib/pdfGenerator';

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

export default function CreateInvoicePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const router = useRouter();

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

  // Fetch clients
  useEffect(() => {
    fetchClients();
  }, []);

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

  // Calculate amounts when items change
  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const amount = item.quantity * item.rate;
      const gstAmount = (amount * item.gstPercentage) / 100;
      const totalAmount = amount + gstAmount;
      
      setValue(`items.${index}.amount`, totalAmount);
    });
  }, [watchedItems, setValue]);

  // Auto-update due date when issue date changes
  const watchedIssueDate = watch('issueDate');
  useEffect(() => {
    if (watchedIssueDate) {
      const issueDate = new Date(watchedIssueDate);
      const dueDate = new Date(issueDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      setValue('dueDate', dueDate.toISOString().split('T')[0]);
    }
  }, [watchedIssueDate, setValue]);

  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const gstAmount = watchedItems.reduce((sum, item) => {
      const itemAmount = item.quantity * item.rate;
      return sum + (itemAmount * item.gstPercentage) / 100;
    }, 0);
    const total = subtotal + gstAmount;

    return { subtotal, gstAmount, total };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const onSubmit = async (data: InvoiceForm) => {
    setLoading(true);
    
    try {
      const { subtotal, gstAmount, total } = calculateTotals();
      
      const invoiceData = {
        ...data,
        subtotal,
        gstAmount,
        total,
        status: 'unpaid',
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Invoice created successfully!');
        
        // Automatically send email with payment link
        try {
          const emailResponse = await fetch(`/api/invoices/${result.data._id}/email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'invoice' }),
          });

          const emailResult = await emailResponse.json();
          if (emailResult.success) {
            toast.success('Invoice email sent to client with payment link!');
          } else {
            toast.error('Invoice created but email sending failed');
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          toast.error('Invoice created but email sending failed');
        }
        
        router.push('/invoices');
      } else {
        toast.error(result.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { subtotal, gstAmount, total } = calculateTotals();
      const selectedClient = clients.find(client => client._id === watch('client'));
      
      if (!selectedClient) {
        toast.error('Please select a client first');
        return;
      }

      const invoiceData = {
        invoiceNumber: 'INV-0001', // This would be generated by the server
        client: {
          name: selectedClient.name,
          email: selectedClient.email,
          address: selectedClient.address,
          gstin: selectedClient.gstin,
        },
        issueDate: watch('issueDate'),
        dueDate: watch('dueDate'),
        items: watchedItems,
        subtotal,
        gstAmount,
        total,
        status: 'unpaid', // Default status for new invoices
        notes: watch('notes'),
        termsAndConditions: watch('termsAndConditions'),
        companyDetails: {
          name: 'Bytesflare Infotech',
          gstin: '29ABCDE1234F1Z5',
          address: '123 Tech Park, Bangalore, Karnataka 560001',
          phone: '+91 9876543210',
          email: 'info@bytesflare.com',
        },
      };

      const pdfBlob = await pdfGenerator.generateInvoicePDF(invoiceData);
      pdfGenerator.downloadPDF(pdfBlob, `Invoice-${invoiceData.invoiceNumber}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = async () => {
    try {
      const { subtotal, gstAmount, total } = calculateTotals();
      const selectedClient = clients.find(client => client._id === watch('client'));
      
      if (!selectedClient) {
        toast.error('Please select a client first');
        return;
      }

      const invoiceData = {
        invoiceNumber: 'INV-0001',
        client: {
          name: selectedClient.name,
          email: selectedClient.email,
          address: selectedClient.address,
          gstin: selectedClient.gstin,
        },
        issueDate: watch('issueDate'),
        dueDate: watch('dueDate'),
        items: watchedItems,
        subtotal,
        gstAmount,
        total,
        status: 'unpaid', // Default status for new invoices
        notes: watch('notes'),
        termsAndConditions: watch('termsAndConditions'),
        companyDetails: {
          name: 'Bytesflare Infotech',
          gstin: '29ABCDE1234F1Z5',
          address: '123 Tech Park, Bangalore, Karnataka 560001',
          phone: '+91 9876543210',
          email: 'info@bytesflare.com',
        },
      };

      const pdfBlob = await pdfGenerator.generateInvoicePDF(invoiceData);
      pdfGenerator.printPDF(pdfBlob);
    } catch (error) {
      console.error('Error printing PDF:', error);
      toast.error('Failed to print invoice');
    }
  };

  const addItem = () => {
    append({
      description: '',
      quantity: 1,
      rate: 0,
      gstPercentage: 18,
      amount: 0,
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const { subtotal, gstAmount, total } = calculateTotals();

  if (previewMode) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Invoice Preview</h1>
          <div className="space-x-2">
            <button
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Edit
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2 inline" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="border border-gray-200 rounded-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-gray-600">Invoice #INV-0001</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-semibold text-gray-900">Bytesflare Infotech</h3>
              <p className="text-gray-600">GSTIN: 29ABCDE1234F1Z5</p>
              <p className="text-gray-600">Address: Bangalore, India</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h4>
            <p className="text-gray-600">Client Name</p>
            <p className="text-gray-600">Client Address</p>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Rate</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">GST %</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {watchedItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.rate)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.gstPercentage}%</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">GST:</span>
                <span className="font-medium">{formatCurrency(gstAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>This is a computer-generated invoice by Bytesflare Infotech.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-poppins">Create New Invoice</h1>
        <p className="text-gray-600 mt-2">Fill in the details below to create a new invoice</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Client Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => router.push('/clients/create')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Add New Client
              </button>
            </div>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    {...register(`items.${index}.description`, { required: 'Description is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Item description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register(`items.${index}.quantity`, { 
                      required: 'Quantity is required',
                      min: { value: 1, message: 'Quantity must be at least 1' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`items.${index}.rate`, { 
                      required: 'Rate is required',
                      min: { value: 0, message: 'Rate must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={watchedItems[index]?.amount || 0}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h2>
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST:</span>
                <span className="font-medium">{formatCurrency(gstAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
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
                placeholder="Additional notes for the client..."
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
                placeholder="Terms and conditions..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.push('/invoices')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Creating...' : 'Create Invoice'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}