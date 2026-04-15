'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Eye, Edit, Trash2,
  Mail, Phone, MapPin, Building2, Users, DollarSign,
  ArrowUpRight, UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  gstin?: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchClients(); }, []);
  useEffect(() => { filterClients(); }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) setClients(data.data);
      else toast.error('Failed to fetch clients');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const filterClients = () => {
    if (!searchTerm) { setFilteredClients(clients); return; }
    setFilteredClients(clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Client deleted'); fetchClients(); }
      else toast.error(data.message || 'Failed to delete');
    } catch { toast.error('Something went wrong'); }
  };

  const statCards = [
    { label: 'Total Clients', value: clients.length, icon: Users, iconBg: 'bg-indigo-500/20', iconColor: 'text-indigo-400', gradient: 'from-indigo-500 to-violet-600' },
    { label: 'Business Clients', value: clients.filter(c => c.gstin).length, icon: Building2, iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Active Clients', value: clients.length, icon: UserCheck, iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
  ];

  // Generate initials avatar color
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-indigo-500 to-violet-600',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-600',
      'from-violet-500 to-purple-600',
    ];
    const idx = name.charCodeAt(0) % gradients.length;
    return gradients[idx];
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-slate-500 text-sm animate-pulse">Loading clients...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">Directory</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Clients</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your client relationships</p>
        </div>
        <Link href="/clients/create" className="btn-premium flex items-center gap-2 text-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} rounded-t-[20px]`} />
              <div className="flex items-start justify-between mb-4">
                <div className={`icon-box ${card.iconBg}`}><Icon className={`w-5 h-5 ${card.iconColor}`} /></div>
                <ArrowUpRight className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-slate-100">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="glass-card-static p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input type="text" placeholder="Search clients by name, email, phone or address..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="input-premium pl-11"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredClients.length === 0 ? (
        <div className="glass-card-static p-16 text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-slate-200 font-semibold text-lg mb-2">No clients found</h3>
          <p className="text-slate-500 text-sm mb-6">
            {searchTerm ? 'Try a different search term' : 'Add your first client to get started'}
          </p>
          {!searchTerm && (
            <Link href="/clients/create" className="btn-premium inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />Add Client
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client, i) => (
            <div key={client._id} className="glass-card p-6 group" style={{ animationDelay: `${i * 0.05}s` }}>
              {/* Card Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(client.name)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-white font-bold text-sm">{getInitials(client.name)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-base leading-tight">{client.name}</h3>
                    {client.gstin && (
                      <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-mono mt-0.5 inline-block">
                        {client.gstin}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Link href={`/clients/${client._id}`} title="View"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <Link href={`/clients/${client._id}/edit`} title="Edit"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                  <button onClick={() => handleDelete(client._id)} title="Delete"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2.5 text-sm text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-2.5 text-sm text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{client.address}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Added {new Date(client.createdAt).toLocaleDateString('en-IN')}
                </span>
                <Link href={`/invoices/create?client=${client._id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group/link">
                  <DollarSign className="w-3 h-3" />
                  <span>Create Invoice</span>
                  <ArrowUpRight className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
