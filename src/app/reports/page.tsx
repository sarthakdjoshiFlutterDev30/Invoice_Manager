'use client';

import { useState, useEffect } from 'react';
import { 
  Download, 
  DollarSign,
  TrendingUp,
  FileText,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportData {
  monthlyRevenue: Array<{ month: string; revenue: number; invoices: number }>;
  paymentStatus: Array<{ status: string; count: number; color: string }>;
  topClients: Array<{ client: string; revenue: number; invoices: number }>;
  yearlyGrowth: Array<{ year: string; revenue: number }>;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    monthlyRevenue: [],
    paymentStatus: [],
    topClients: [],
    yearlyGrowth: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last6months');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch invoices for the selected date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'last30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'last3months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'last6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case 'lastyear':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 6);
      }

      const response = await fetch(
        `/api/invoices?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();
      
      if (data.success) {
        const invoices = data.data || [];
        processReportData(invoices);
      } else {
        toast.error('Failed to fetch report data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (invoices: Array<{ status: string; total: number; issueDate: string; paymentDetails?: { paidAt: string } }>) => {
    // Monthly Revenue Data
    const monthlyData = generateMonthlyData(invoices);
    
    // Payment Status Data
    const statusData = [
      { status: 'Paid', count: invoices.filter(inv => inv.status === 'paid').length, color: '#10B981' },
      { status: 'Unpaid', count: invoices.filter(inv => inv.status === 'unpaid').length, color: '#EF4444' },
      { status: 'Partial', count: invoices.filter(inv => inv.status === 'partial').length, color: '#F59E0B' },
      { status: 'Cancelled', count: invoices.filter(inv => inv.status === 'cancelled').length, color: '#6B7280' },
    ];
    
    // Top Clients Data
    const clientRevenue = invoices.reduce((acc: Record<string, { revenue: number; invoices: number }>, invoice: { client?: { name: string }; status: string; total: number }) => {
      const clientName = invoice.client?.name || 'Unknown';
      if (!acc[clientName]) {
        acc[clientName] = { revenue: 0, invoices: 0 };
      }
      if (invoice.status === 'paid') {
        acc[clientName].revenue += invoice.total;
      }
      acc[clientName].invoices += 1;
      return acc;
    }, {});
    
    const topClients = Object.entries(clientRevenue)
      .map(([client, data]: [string, { revenue: number; invoices: number }]) => ({
        client,
        revenue: data.revenue,
        invoices: data.invoices,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Yearly Growth Data
    const yearlyData = generateYearlyData(invoices);
    
    setReportData({
      monthlyRevenue: monthlyData,
      paymentStatus: statusData,
      topClients,
      yearlyGrowth: yearlyData,
    });
  };

  const generateMonthlyData = (invoices: Array<{ issueDate: string; status: string; total: number }>) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => {
      const monthIndex = (currentMonth - 5 + index + 12) % 12;
      const monthInvoices = invoices.filter((invoice: { issueDate: string; status: string }) => {
        const invoiceDate = new Date(invoice.issueDate);
        return invoiceDate.getMonth() === monthIndex && invoice.status === 'paid';
      });
      
      return {
        month,
        revenue: monthInvoices.reduce((sum: number, invoice: { total: number }) => sum + invoice.total, 0),
        invoices: monthInvoices.length,
      };
    });
  };

  const generateYearlyData = (invoices: Array<{ issueDate: string; status: string; total: number }>) => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    
    return years.map(year => {
      const yearInvoices = invoices.filter((invoice: { issueDate: string; status: string }) => {
        const invoiceDate = new Date(invoice.issueDate);
        return invoiceDate.getFullYear() === year && invoice.status === 'paid';
      });
      
      return {
        year: year.toString(),
        revenue: yearInvoices.reduce((sum: number, invoice: { total: number }) => sum + invoice.total, 0),
      };
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleExport = () => {
    // This would implement CSV/PDF export functionality
    toast.success('Export feature coming soon!');
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Insights into your business performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="last30days">Last 30 Days</option>
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="lastyear">Last Year</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  reportData.monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.monthlyRevenue.reduce((sum, item) => sum + item.invoices, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.topClients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.yearlyGrowth.length > 1 
                  ? `${Math.round(
                      ((reportData.yearlyGrowth[reportData.yearlyGrowth.length - 1].revenue - 
                       reportData.yearlyGrowth[reportData.yearlyGrowth.length - 2].revenue) / 
                       reportData.yearlyGrowth[reportData.yearlyGrowth.length - 2].revenue) * 100
                    )}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Top Clients */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Invoice Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.topClients.map((client, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(client.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.invoices}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(client.revenue / client.invoices)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yearly Growth Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Growth Trend</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <p>Chart visualization removed</p>
        </div>
      </div>
    </div>
  );
}
