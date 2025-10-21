'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  Plus,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  pendingAmount: number;
  totalClients: number;
  monthlyRevenue: number;
  growthRate: number;
}


export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    pendingAmount: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    growthRate: 0,
  });

  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch invoices
      const invoicesResponse = await fetch('/api/invoices');
      const invoicesData = await invoicesResponse.json();
      
      // Fetch clients
      const clientsResponse = await fetch('/api/clients');
      const clientsData = await clientsResponse.json();
      
      if (invoicesData.success && clientsData.success) {
        const invoices = invoicesData.data || [];
        const clients = clientsData.data || [];
        
        // Calculate stats
        const totalRevenue = invoices.reduce((sum: number, invoice: any) => 
          invoice.status === 'paid' ? sum + invoice.total : sum, 0
        );
        
        const pendingAmount = invoices.reduce((sum: number, invoice: any) => 
          invoice.status === 'unpaid' ? sum + invoice.total : sum, 0
        );
        
        const paidInvoices = invoices.filter((invoice: any) => invoice.status === 'paid').length;
        const unpaidInvoices = invoices.filter((invoice: any) => invoice.status === 'unpaid').length;
        
        // Calculate monthly revenue (current month) - based on payment date
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = invoices
          .filter((invoice: any) => {
            // Use payment date if available, otherwise fall back to invoice date
            const paymentDate = invoice.paymentDetails?.paidAt 
              ? new Date(invoice.paymentDetails.paidAt)
              : new Date(invoice.issueDate);
            
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear &&
                   invoice.status === 'paid';
          })
          .reduce((sum: number, invoice: any) => sum + invoice.total, 0);
        
        // Calculate growth rate (simplified)
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthRevenue = invoices
          .filter((invoice: any) => {
            // Use payment date if available, otherwise fall back to invoice date
            const paymentDate = invoice.paymentDetails?.paidAt 
              ? new Date(invoice.paymentDetails.paidAt)
              : new Date(invoice.issueDate);
            
            return paymentDate.getMonth() === lastMonth && 
                   paymentDate.getFullYear() === currentYear &&
                   invoice.status === 'paid';
          })
          .reduce((sum: number, invoice: any) => sum + invoice.total, 0);
        
        const growthRate = lastMonthRevenue > 0 
          ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0;
        
    setStats({
          totalRevenue,
          totalInvoices: invoices.length,
          paidInvoices,
          unpaidInvoices,
          pendingAmount,
          totalClients: clients.length,
          monthlyRevenue,
          growthRate,
        });
        
        
        // Get recent invoices
        const recent = invoices
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentInvoices(recent);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Logo size="lg" showText={true} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-poppins">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business.</p>
          </div>
        </div>
        <Link
          href="/invoices/create"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Invoice</span>
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                {stats.growthRate.toFixed(1)}% from last month
              </p>
            </div>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
              <p className="text-sm text-gray-500">This month: {stats.monthlyRevenue > 0 ? 'Active' : 'No activity'}</p>
            </div>
          </div>
        </div>

        {/* Paid vs Unpaid */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paidInvoices}</p>
              <p className="text-sm text-gray-500">Out of {stats.totalInvoices} total</p>
            </div>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</p>
              <p className="text-sm text-gray-500">{stats.unpaidInvoices} unpaid invoices</p>
            </div>
          </div>
        </div>
      </div>



      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <Link 
              href="/invoices" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
          </Link>
              </div>
            </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.client?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.issueDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      href={`/invoices/${invoice._id}`}
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
          </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}