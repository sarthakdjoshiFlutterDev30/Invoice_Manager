'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  CheckCircle,
  User,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { pdfGenerator } from '@/lib/pdfGenerator';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice(params.id as string);
    }
  }, [params.id]);

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

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      const response = await fetch(`/api/invoices/${invoice._id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDF downloaded successfully!');
      } else {
        toast.error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handlePrint = async () => {
    if (!invoice) return;

    try {
      const response = await fetch(`/api/invoices/${invoice._id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        pdfGenerator.printPDF(blob);
      } else {
        toast.error('Failed to print invoice');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to print invoice');
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
        <p className="mt-1 text-sm text-gray-500">The invoice you&apos;re looking for doesn&apos;t exist.</p>
        <div className="mt-6">
          <Link
            href="/invoices"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/invoices"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Invoices
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(invoice.status)}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white shadow rounded-lg">
        {/* Invoice Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
              <p className="text-sm text-gray-600">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Issue Date</p>
              <p className="font-medium">{formatDate(invoice.issueDate)}</p>
              <p className="text-sm text-gray-600 mt-2">Due Date</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Client Details */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Bill To</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{invoice.client.name}</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{invoice.client.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{invoice.client.address}</span>
              </div>
              {invoice.client.gstin && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">GSTIN: </span>
                  <span className="text-sm font-medium">{invoice.client.gstin}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.gstPercentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">GST:</span>
                <span className="text-sm font-medium">{formatCurrency(invoice.gstAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="text-base font-medium text-gray-900">Total:</span>
                <span className="text-base font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>


         {/* Payment Details */}
         {invoice.status === 'paid' && (
           <div className="px-6 py-4 border-t border-gray-200 bg-green-50">
             <div className="flex items-center space-x-2 mb-3">
               <CheckCircle className="w-5 h-5 text-green-600" />
               <h3 className="text-lg font-medium text-green-900">Payment Received</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="text-gray-600">Payment ID:</span>
                 <span className="ml-2 font-mono">{invoice.paymentDetails?.paymentId || `PAY-${invoice.invoiceNumber}-${invoice._id.slice(-6).toUpperCase()}`}</span>
               </div>
               <div>
                 <span className="text-gray-600">Amount:</span>
                 <span className="ml-2 font-medium">{formatCurrency(invoice.paymentDetails?.amount || invoice.total)}</span>
               </div>
               <div>
                 <span className="text-gray-600">Method:</span>
                 <span className="ml-2 capitalize">{invoice.paymentDetails?.method || 'Bank Transfer'}</span>
               </div>
               <div>
                 <span className="text-gray-600">Paid At:</span>
                 <span className="ml-2">{invoice.paymentDetails?.paidAt ? formatDate(invoice.paymentDetails.paidAt) : formatDate(invoice.updatedAt)}</span>
               </div>
             </div>
           </div>
         )}

        {/* Notes and Terms */}
        {(invoice.notes || invoice.termsAndConditions) && (
          <div className="px-6 py-4 border-t border-gray-200">
            {invoice.notes && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.termsAndConditions && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                <p className="text-sm text-gray-600">{invoice.termsAndConditions}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
